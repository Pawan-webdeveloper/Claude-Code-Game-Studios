/**
 * Trainer's Atlas: wires the world, rides, rider, landmarks, camera, input, HUD and audio, and
 * runs the frame loop.
 */
import * as THREE from "three";
import worldJson from "./data/world.json";
import regionsJson from "./data/regions.json";
import ridesJson from "./data/rides.json";
import landmarksJson from "./data/landmarks.json";
import { Noise2D } from "./core/noise";
import { damp } from "./core/math";
import { RegionField } from "./world/regions";
import { Terrain } from "./world/terrain";
import { ChunkManager } from "./world/chunks";
import { Water } from "./world/water";
import { Sky } from "./world/sky";
import type { LandmarkDef, Quality, RegionDef, WorldConfig } from "./world/types";
import { loadModel } from "./entities/models";
import { Rider } from "./entities/rider";
import { CharizardRide, GengarRide, GreninjaRide, Ride, type PlayerState, type RideContext, type RideTuning } from "./rides/rides";
import { autoSwitch, manualSwitch, surfaceWithHysteresis, type RideId } from "./rides/rideLogic";
import { Input } from "./input/input";
import { FollowCamera } from "./render/followCamera";
import { DynamicResolution, isTouch } from "./render/quality";
import { PostPaper } from "./render/postPaper";
import { DiscoveryLog } from "./gameplay/discoveryLog";
import { Landmarks } from "./gameplay/landmarks";
import { Audio } from "./gameplay/audio";
import { Hud, Minimap, type MinimapPoint } from "./ui/hud";

const WORLD = worldJson as WorldConfig;
const REGIONS = regionsJson as RegionDef[];
const LANDMARKS = landmarksJson as LandmarkDef[];
const RIDES = ridesJson as unknown as Record<RideId, RideTuning> & { switching: Record<string, number> };

export class Game {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  private readonly noise = new Noise2D(WORLD.seed);
  private readonly field = new RegionField(REGIONS, this.noise, WORLD.regionBlendWidth, WORLD.regionWarp);
  private readonly terrain = new Terrain(WORLD, this.field, this.noise, LANDMARKS);
  private readonly fog: THREE.Fog;
  private readonly chunks: ChunkManager;
  private readonly water: Water;
  private readonly sky: Sky;
  private readonly input: Input;
  private readonly follow: FollowCamera;
  private readonly dynres: DynamicResolution;
  private readonly post: PostPaper;
  private readonly sun: THREE.DirectionalLight;
  private readonly sunDir = new THREE.Vector3(0.62, 0.55, -0.55).normalize();
  private readonly log: DiscoveryLog;
  private readonly landmarks: Landmarks;
  private readonly audio = new Audio();
  private readonly hud: Hud;
  private minimap!: Minimap;
  private readonly rider: Rider;
  private readonly rides = new Map<RideId, Ride>();
  private readonly loaded = new Set<RideId>();
  private current!: Ride;
  private readonly state: PlayerState;
  private readonly clock = new THREE.Clock();
  private running = false;
  private t = 0;
  private readonly hinted = new Set<RideId>();
  private readonly bursts: Array<{ mesh: THREE.Mesh; age: number }> = [];
  private mapPoints: MinimapPoint[] = [];

  /** @param container element that receives the canvas @param quality render tier */
  constructor(private readonly container: HTMLElement, quality: Quality) {
    // Antialiasing happens in the paper pass's multisampled target, not on the canvas.
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.info.autoReset = false; // count the scene pass + paper pass together per frame
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(62, container.clientWidth / container.clientHeight, 0.5, 2600);
    this.fog = new THREE.Fog("#eef4f5", WORLD.fog.near, WORLD.fog.far[quality]);
    this.scene.fog = this.fog;

    this.post = new PostPaper(this.renderer, this.camera, "#f4efe2", WORLD.ink, quality === "low" ? 0 : 4);
    this.dynres = new DynamicResolution(this.renderer, Math.min(devicePixelRatio, quality === "high" ? 2 : 1.5), 33, () => this.post.resize());
    this.post.resize();

    // Morning light: warm sun plus a white-sky / lilac-ground fill, with soft shadows near the player.
    const hemi = new THREE.HemisphereLight("#ffffff", "#b7aee0", 1.35);
    this.sun = new THREE.DirectionalLight("#fff3dc", 2.6);
    if (quality !== "low") {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.sun.castShadow = true;
      const size = quality === "high" ? 2048 : 1024;
      this.sun.shadow.mapSize.set(size, size);
      Object.assign(this.sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, near: 1, far: 500 });
      this.sun.shadow.bias = -0.0006;
      this.sun.shadow.normalBias = 0.06;
    }
    this.scene.add(hemi, this.sun, this.sun.target);

    this.chunks = new ChunkManager(this.scene, WORLD, this.terrain, this.field, this.noise, quality);
    this.water = new Water(WORLD.waterY, WORLD.fog.far[quality] * 2.6);
    this.scene.add(this.water.mesh);
    this.sky = new Sky(this.scene, this.field, WORLD.ink, this.sunDir, WORLD.worldLimit);

    let store: Storage | null = null;
    try { store = window.localStorage; } catch { store = null; }
    this.log = new DiscoveryLog(store, new Set(LANDMARKS.map((l) => l.id)));
    this.landmarks = new Landmarks(this.scene, LANDMARKS, this.field, this.terrain, this.log, WORLD.ink, WORLD.fog.far[quality] + 250);

    this.rider = new Rider(WORLD.ink);
    this.input = new Input(this.renderer.domElement);
    this.follow = new FollowCamera(this.camera);
    this.hud = new Hud((id) => (this.input.state.ride = id), () => this.audio.toggleMute());

    const spawn = WORLD.spawn;
    const target = this.landmarks.positions().find((p) => p.def.id === spawn.faceTowards);
    const heading = target ? Math.atan2(target.x - spawn.x, target.z - spawn.z) : 0;
    this.state = { pos: new THREE.Vector3(spawn.x, spawn.y, spawn.z), heading, pitch: 0, speed: 0, vy: 0, bank: 0, grounded: false };

    window.addEventListener("resize", () => this.resize());
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) this.clock.getDelta();
    });
  }

  /** Loads the first ride and the world around the spawn. Gengar and Greninja load later. */
  async load(progress: (p: number, label: string) => void): Promise<void> {
    progress(0.05, "Folding the paper world…");
    const charizard = await loadModel(RIDES.charizard.model, RIDES.charizard.height, WORLD.ink, (p) => progress(0.05 + p * 0.45, "Waking Charizard…"));
    this.addRide(new CharizardRide(RIDES.charizard, charizard));
    progress(0.55, "Inking the regions…");
    await new Promise((r) => setTimeout(r, 0));
    let built = 0;
    while (this.chunks.update(this.state.pos.x, this.state.pos.z, 4) > 0) {
      built += 4;
      progress(Math.min(0.9, 0.55 + built * 0.006), "Inking the regions…");
      await new Promise((r) => setTimeout(r, 0));
    }
    progress(0.92, "Drawing the map…");
    await new Promise((r) => setTimeout(r, 0));
    const water = new THREE.Color("#7cc4c0");
    const colors = REGIONS.map((r) => new THREE.Color(r.colors.mid));
    this.minimap = new Minimap(document.getElementById("minimap") as HTMLCanvasElement, WORLD.islandRadius * 1.1, (x, z) => {
      if (this.terrain.heightAt(x, z) < WORLD.waterY) return "#" + water.getHexString();
      return "#" + colors[this.field.regionAt(x, z)].getHexString();
    });
    if (isTouch()) this.minimap.toggle();
    this.mapPoints = this.landmarks.positions().map((p) => ({
      x: p.x, z: p.z, kind: p.def.project ? "project" : p.def.pawan ? "pawan" : "other", found: this.log.has(p.def.id),
    }));
    this.switchTo("charizard", false);
    this.hud.setCount(this.log.count, this.log.total);
    this.post.render(this.scene, 0, 0);
    progress(1, "Ready!");
  }

  private addRide(ride: Ride): void {
    ride.root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh && !o.userData.isOutline) o.castShadow = true;
    });
    this.rides.set(ride.id, ride);
    this.loaded.add(ride.id);
    this.scene.add(ride.root);
  }

  private async loadGroundRides(): Promise<void> {
    try {
      const gengar = await loadModel(RIDES.gengar.model, RIDES.gengar.height, WORLD.ink);
      this.addRide(new GengarRide(RIDES.gengar, gengar));
      const greninja = await loadModel(RIDES.greninja.model, RIDES.greninja.height, WORLD.ink);
      this.addRide(new GreninjaRide(RIDES.greninja, greninja));
    } catch (err) {
      console.error("Ground rides failed to load", err);
      this.hud.toast("Couldn't load Gengar/Greninja", "You can keep flying with Charizard.");
    }
  }

  /** Starts the loop (call from a user gesture so audio can start). */
  start(): void {
    this.audio.start();
    this.running = true;
    this.clock.start();
    this.hud.showHint(isTouch()
      ? "Joystick to steer · ▲ to climb · BOOST to speed up · dive low to land"
      : "A/D steer · W/S climb & dive · Shift boost · Space flap · dive low to land · drag to look", 7000);
    this.hud.toast("Pawan's Atlas", "Follow the golden beams to my projects.", 5000);
    void this.loadGroundRides();
    this.renderer.setAnimationLoop(() => this.frame());
  }

  /** Wires the on-screen touch controls to the input system. */
  bindTouch(stick: HTMLElement, knob: HTMLElement, buttons: NodeListOf<HTMLElement>): void {
    this.input.bindTouch(stick, knob, buttons);
  }

  private switchTo(id: RideId, effects = true): void {
    const next = this.rides.get(id);
    if (!next || next === this.current) return;
    const prev = this.current;
    prev?.exit();
    if (id === "charizard" && prev) {
      this.state.pitch = 0.5;
      this.state.pos.y += 3;
      this.state.speed = Math.max(this.state.speed, RIDES.switching.takeoffVelocity);
    }
    next.enter(this.state);
    // Pawan rides Charizard only; summoning another Pokémon hides him (BUG-0002).
    if (next.cfg.showRider) {
      next.seat.add(this.rider.root);
      this.rider.root.visible = true;
      this.rider.setPose(next.cfg.riderPose);
    } else {
      this.rider.root.removeFromParent();
      this.rider.root.visible = false;
    }
    this.current = next;
    this.hud.setRide(id, this.loaded);
    if (effects) {
      this.audio.whoosh();
      this.burst(next.root.position, id === "greninja" ? "#a6dccf" : id === "gengar" ? "#b98cf0" : "#f0663a");
      if (!this.hinted.has(id)) {
        this.hinted.add(id);
        const msg: Record<RideId, string> = {
          charizard: "Charizard! Dive low over land or water to land.",
          gengar: "Gengar runs the land. Press 1 / F (or FLY) to take off.",
          greninja: "Greninja runs on land and surfs the sea. Press 1 / F to fly again.",
        };
        this.hud.showHint(msg[id]);
      }
    }
  }

  private burst(at: THREE.Vector3, color: string): void {
    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(2, 0.35, 6, 24).rotateX(Math.PI / 2),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false }),
    );
    mesh.position.copy(at).add(new THREE.Vector3(0, 1.5, 0));
    this.scene.add(mesh);
    this.bursts.push({ mesh, age: 0 });
  }

  private fixedDt: number | null = null;

  private frame(): void {
    if (!this.running) return;
    const real = this.clock.getDelta();
    this.renderer.info.reset();
    const dt = this.fixedDt ?? Math.min(0.05, real);
    this.t += dt;
    this.input.poll(dt);
    const inp = this.input.state;

    // Ride switching: manual requests first, then the terrain rules.
    const ground = this.terrain.heightAt(this.state.pos.x, this.state.pos.z);
    const surface = surfaceWithHysteresis(this.current.id, ground, WORLD.waterY, RIDES.switching.shoreMargin);
    if (inp.ride) {
      this.switchTo(manualSwitch(inp.ride, this.current.id, surface, this.loaded));
    } else {
      const clearance = this.state.pos.y - this.terrain.floorAt(this.state.pos.x, this.state.pos.z);
      const auto = autoSwitch({
        current: this.current.id,
        surface,
        clearance,
        descending: inp.y < -0.2 || this.state.pitch < -0.2,
        landClearance: RIDES.switching.landClearance,
        loaded: this.loaded,
      });
      if (auto) this.switchTo(auto);
    }
    if (inp.toggleMap) this.minimap.toggle();
    this.input.consume();

    const ctx: RideContext = { terrain: this.terrain, waterY: WORLD.waterY, worldLimit: WORLD.worldLimit, input: inp, t: this.t };
    this.current.update(dt, ctx, this.state);
    this.rider.animate(this.current.lean, this.current.bob);

    this.chunks.update(this.state.pos.x, this.state.pos.z, 1);
    this.sky.update(dt, this.t, this.camera, this.state.pos.x, this.state.pos.z, this.fog);
    this.water.update(this.t, this.camera.position.x, this.camera.position.z, this.fog);
    this.sun.target.position.copy(this.state.pos);
    this.sun.position.copy(this.state.pos).addScaledVector(this.sunDir, 250);

    for (const def of this.landmarks.update(this.t, dt, this.state.pos)) this.onDiscover(def);

    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      b.age += dt;
      const k = b.age / RIDES.switching.burstDuration;
      b.mesh.scale.setScalar(1 + k * 4);
      (b.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.9 * (1 - k));
      if (k >= 1) {
        this.scene.remove(b.mesh);
        b.mesh.geometry.dispose();
        (b.mesh.material as THREE.Material).dispose();
        this.bursts.splice(i, 1);
      }
    }

    this.follow.update(dt, this.state, this.current.cfg.camera, inp.orbitYaw, inp.orbitPitch, this.terrain);
    const fovTarget = 60 + (inp.boost ? 10 : 0);
    this.camera.fov += (fovTarget - this.camera.fov) * damp(3, dt);
    this.camera.updateProjectionMatrix();

    const region = this.field.def(this.field.regionAt(this.state.pos.x, this.state.pos.z));
    this.hud.setRegion(region.name);
    this.minimap.draw(this.state.pos.x, this.state.pos.z, this.state.heading, this.mapPoints);
    this.audio.update(Math.min(1, Math.abs(this.state.speed) / 60), this.field.regionAt(this.state.pos.x, this.state.pos.z));

    this.post.render(this.scene, this.t, inp.boost ? Math.min(1, Math.abs(this.state.speed) / 60) : 0);
    this.dynres.sample(dt);
  }

  private onDiscover(def: LandmarkDef): void {
    this.hud.setCount(this.log.count, this.log.total);
    const pt = this.mapPoints.find((p) => Math.abs(p.x - def.pos[0]) < 0.01 && Math.abs(p.z - def.pos[1]) < 0.01);
    if (pt) pt.found = true;
    this.audio.chime(!!def.project);
    const open = def.card ? () => this.hud.showCard(def, def.card!) : undefined;
    this.hud.toast(def.name, def.line, 5000, open);
    if (open) open();
    if (this.log.count === this.log.total) {
      setTimeout(() => this.hud.toast("Atlas complete! 🎉", "You found every landmark. Thanks for exploring my world.", 8000), 5200);
    }
  }

  private resize(): void {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    this.post.resize();
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Testing hook: advances the simulation by `seconds` at a fixed 30 fps, independent of the
   * browser's frame rate (hidden/background tabs throttle requestAnimationFrame).
   */
  simulate(seconds: number): void {
    this.fixedDt = 1 / 30;
    const n = Math.round(seconds * 30);
    for (let i = 0; i < n; i++) this.frame();
    this.fixedDt = null;
  }

  /** Debug/testing hook: exposes state for automated screenshots. */
  debug() {
    return { state: this.state, ride: this.current?.id, loaded: [...this.loaded], chunks: this.chunks.size, found: this.log.count,
      wingBones: (this.rides.get("charizard") as CharizardRide | undefined)?.wingBoneCount ?? 0,
      pixelRatio: this.dynres.pixelRatio, calls: this.renderer.info.render.calls, tris: this.renderer.info.render.triangles };
  }
}
