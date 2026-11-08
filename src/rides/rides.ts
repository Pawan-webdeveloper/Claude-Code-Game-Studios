/**
 * The three rides. Each owns a loaded Pokémon model, a seat for Pawan, a movement model and a
 * procedural animation layer (the GLBs ship without fly/run/surf clips for most mounts).
 *
 * Convention: heading 0 faces +Z; forward = (sin h, 0, cos h). Models face +Z.
 */
import * as THREE from "three";
import { clamp, damp, lerp, wrapAngle } from "../core/math";
import { findBones, type LoadedModel } from "../entities/models";
import type { InputState } from "../input/input";
import type { Terrain } from "../world/terrain";
import type { RideId } from "./rideLogic";
import type { RiderPose } from "../entities/rider";

/** Shared, ride-independent player state (survives ride switches). */
export interface PlayerState {
  pos: THREE.Vector3;
  heading: number;
  pitch: number;
  speed: number;
  vy: number;
  bank: number;
  grounded: boolean;
}

/** Per-frame world access for rides. */
export interface RideContext {
  terrain: Terrain;
  waterY: number;
  worldLimit: number;
  input: InputState;
  t: number;
}

export interface CameraProfile {
  distance: number;
  height: number;
  lookAhead: number;
}

/** Tuning shared by every ride (from rides.json). */
export interface RideTuning {
  label: string;
  surface: "air" | "land" | "water";
  model: string;
  height: number;
  yawOffset: number;
  speed: number;
  boostSpeed: number;
  accel: number;
  turnRate: number;
  camera: CameraProfile;
  seat: { x: number; y: number; z: number };
  riderPose: RiderPose;
  [key: string]: unknown;
}

export abstract class Ride {
  /** Root moved/rotated by the ride; contains the model pivot and the rider seat. */
  readonly root = new THREE.Group();
  /** Pawan attaches here. */
  readonly seat = new THREE.Group();
  /** Visual lean (-1..1) and bob for the rider. */
  lean = 0;
  bob = 0;

  /** Rest height of the model pivot inside its tilt holder (bob animates around it). */
  protected readonly pivotBase: number;

  constructor(readonly id: RideId, readonly cfg: RideTuning, readonly model: LoadedModel) {
    // Tilt holder rotates the model about its centre (e.g. Charizard's standing bind pose → flying pose).
    const tilt = new THREE.Group();
    const half = cfg.height * 0.5;
    tilt.position.y = half;
    tilt.rotation.set((cfg.modelPitch as number) ?? 0, cfg.yawOffset, 0, "YXZ");
    this.pivotBase = -half;
    model.pivot.position.y = this.pivotBase;
    tilt.add(model.pivot);
    this.root.add(tilt);
    this.autoFace(tilt);
    this.seat.position.set(cfg.seat.x * cfg.height, cfg.seat.y * cfg.height, cfg.seat.z * cfg.height);
    this.root.add(this.seat);
    this.root.visible = false;
  }

  /**
   * Measures which way the rig faces (toe ahead of ankle = facing +Z) and turns the model 180°
   * if it faces backwards, so orientation never depends on a hand-tuned guess (BUG-0001).
   */
  private autoFace(tilt: THREE.Group): void {
    const bones = this.cfg.faceBones as [string, string] | undefined;
    if (!bones) return;
    const [toe] = findBones(this.model.scene, [bones[0]]);
    const [ankle] = findBones(this.model.scene, [bones[1]]);
    if (!toe || !ankle) return;
    this.root.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(this.root.matrixWorld).invert();
    const t = toe.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv);
    const a = ankle.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv);
    if (t.z < a.z) tilt.rotation.y += Math.PI;
    this.facingCorrected = t.z < a.z;
  }

  /** True when autoFace had to turn the model around (for debugging/tests). */
  facingCorrected = false;

  /** Forward unit vector for a heading. */
  static forward(heading: number, out = new THREE.Vector3()): THREE.Vector3 {
    return out.set(Math.sin(heading), 0, Math.cos(heading));
  }

  /** Called when this ride becomes active. */
  enter(state: PlayerState): void {
    this.root.visible = true;
    state.speed = Math.max(state.speed, this.cfg.speed * 0.6);
  }

  /** Called when another ride takes over. */
  exit(): void {
    this.root.visible = false;
  }

  /** Advances movement and animation. */
  abstract update(dt: number, ctx: RideContext, s: PlayerState): void;

  /** Keeps the player inside the world boundary by steering them back toward the centre. */
  protected keepInWorld(dt: number, ctx: RideContext, s: PlayerState): void {
    const r = Math.hypot(s.pos.x, s.pos.z);
    if (r > ctx.worldLimit) {
      const toCenter = Math.atan2(-s.pos.x, -s.pos.z);
      s.heading += wrapAngle(toCenter - s.heading) * damp(2.5, dt);
      const k = ctx.worldLimit / r;
      s.pos.x = lerp(s.pos.x, s.pos.x * k, damp(4, dt));
      s.pos.z = lerp(s.pos.z, s.pos.z * k, damp(4, dt));
    }
  }
}

/** Charizard: always-forward flight with banking, climb/dive, boost and procedural wing flaps. */
export class CharizardRide extends Ride {
  private readonly wings: Array<{ bone: THREE.Bone; rest: THREE.Quaternion; side: number; depth: number }> = [];
  private readonly tail: Array<{ bone: THREE.Bone; rest: THREE.Quaternion; depth: number }> = [];
  private phase = 0;
  private readonly axis: THREE.Vector3;
  private readonly q = new THREE.Quaternion();
  private readonly fwd = new THREE.Vector3();

  constructor(cfg: RideTuning, model: LoadedModel) {
    super("charizard", cfg, model);
    const prefixes = cfg.flapBones as string[];
    for (const bone of findBones(model.scene, prefixes)) {
      const depth = Number((bone.name.match(/Feeler(\d)/) ?? [])[1] ?? 1);
      this.wings.push({ bone, rest: bone.quaternion.clone(), side: bone.name.startsWith("L") ? 1 : -1, depth });
    }
    for (const bone of findBones(model.scene, cfg.tailBones as string[])) {
      const depth = Number((bone.name.match(/Tail(\d)/) ?? [])[1] ?? 1);
      this.tail.push({ bone, rest: bone.quaternion.clone(), depth });
    }
    const a = cfg.flapAxis as [number, number, number];
    this.axis = new THREE.Vector3(a[0], a[1], a[2]).normalize();
    // Static pose bends turn the standing bind pose into a flying pose (body forward, tail behind).
    for (const bend of (cfg.poseBends as Array<{ bone: string; axis: [number, number, number]; angle: number }>) ?? []) {
      for (const bone of findBones(model.scene, [bend.bone])) {
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(...bend.axis).normalize(), bend.angle);
        bone.quaternion.multiply(q);
      }
    }
  }

  /** Number of wing bones found (0 means the procedural flap cannot work on this model). */
  get wingBoneCount(): number {
    return this.wings.length;
  }

  update(dt: number, ctx: RideContext, s: PlayerState): void {
    const c = this.cfg as RideTuning & Record<string, number>;
    const inp = ctx.input;
    const target = inp.boost ? c.boostSpeed : c.speed;
    s.speed = lerp(s.speed, target, damp(c.accel, dt));
    s.heading -= inp.x * c.turnRate * dt;
    const climb = inp.y + (inp.jump ? 0.8 : 0);
    s.pitch = lerp(s.pitch, clamp(climb, -1, 1) * c.maxPitch, damp(2.2, dt));
    s.bank = lerp(s.bank, inp.x * c.bankMax, damp(3, dt));

    Ride.forward(s.heading, this.fwd);
    s.pos.addScaledVector(this.fwd, Math.cos(s.pitch) * s.speed * dt);
    s.pos.y += Math.sin(s.pitch) * s.speed * dt;
    const floor = ctx.terrain.floorAt(s.pos.x, s.pos.z);
    if (s.pos.y < floor + 1.2) s.pos.y = floor + 1.2;
    if (s.pos.y > c.maxAltitude) { s.pos.y = c.maxAltitude; s.pitch = Math.min(s.pitch, 0); }
    s.vy = 0;
    s.grounded = false;
    this.keepInWorld(dt, ctx, s);

    this.root.position.copy(s.pos);
    this.root.rotation.set(-s.pitch, s.heading, -s.bank, "YXZ");

    // Procedural flap: faster when boosting or climbing, gliding when diving.
    const hz = inp.boost || climb > 0.2 ? c.boostFlapHz : s.pitch < -0.25 ? 0.4 : c.flapHz;
    this.phase += dt * hz * Math.PI * 2;
    const flap = Math.sin(this.phase);
    for (const w of this.wings) {
      const amp = c.flapAmp * (w.depth <= 2 ? 1 : 0.35);
      this.q.setFromAxisAngle(this.axis, flap * amp * w.side);
      w.bone.quaternion.copy(w.rest).multiply(this.q);
    }
    for (const tb of this.tail) {
      this.q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, Math.sin(ctx.t * 2 - tb.depth * 0.5) * 0.08 - s.bank * 0.1);
      tb.bone.quaternion.copy(tb.rest).multiply(this.q);
    }
    this.model.pivot.position.y = this.pivotBase - flap * 0.18;
    this.lean = s.bank;
    this.bob = -flap;
  }
}

/** Shared ground/water movement: throttle, steer, hop, gravity; floor provided by subclass. */
abstract class GroundRide extends Ride {
  protected readonly fwd = new THREE.Vector3();
  protected stride = 0;

  /** Height the ride stands on at (x, z). */
  protected abstract floor(ctx: RideContext, x: number, z: number): number;

  update(dt: number, ctx: RideContext, s: PlayerState): void {
    const c = this.cfg as RideTuning & Record<string, number>;
    const inp = ctx.input;
    const top = inp.boost ? c.boostSpeed : c.speed;
    const target = inp.y >= 0 ? inp.y * top : inp.y * c.speed * 0.4;
    s.speed = lerp(s.speed, target, damp(c.accel, dt));
    const turnScale = 0.35 + 0.65 * Math.min(1, Math.abs(s.speed) / c.speed);
    s.heading -= inp.x * c.turnRate * turnScale * dt;
    s.pitch = lerp(s.pitch, 0, damp(4, dt));
    s.bank = lerp(s.bank, inp.x * 0.25 * Math.sign(s.speed || 1), damp(4, dt));

    Ride.forward(s.heading, this.fwd);
    s.pos.addScaledVector(this.fwd, s.speed * dt);
    this.keepInWorld(dt, ctx, s);
    const floor = this.floor(ctx, s.pos.x, s.pos.z);
    if (s.grounded && inp.jump) { s.vy = c.hopVelocity; s.grounded = false; }
    s.vy -= c.gravity * dt;
    s.pos.y += s.vy * dt;
    if (s.pos.y <= floor) { s.pos.y = floor; s.vy = 0; s.grounded = true; }

    // Lean the body to the slope ahead.
    const ahead = this.floor(ctx, s.pos.x + this.fwd.x * 2, s.pos.z + this.fwd.z * 2);
    const slope = s.grounded ? Math.atan2(ahead - floor, 2) * 0.6 : 0;
    this.root.position.copy(s.pos);
    this.root.rotation.set(-slope, s.heading, -s.bank, "YXZ");

    this.stride += dt * c.bobHz * Math.PI * 2 * (0.3 + Math.abs(s.speed) / c.speed);
    this.bob = Math.sin(this.stride * 2) * (s.grounded ? 1 : 0);
    this.model.pivot.position.y = this.pivotBase + this.bob * c.bobAmp;
    this.lean = s.bank * 2;
    this.animate(dt, s);
  }

  /** Model-specific animation. */
  protected abstract animate(dt: number, s: PlayerState): void;
}

/** Gengar: runs on land and streets, swinging its legs and arms procedurally. */
export class GengarRide extends GroundRide {
  private readonly limbs: Array<{ bone: THREE.Bone; rest: THREE.Quaternion; phase: number }> = [];
  private readonly q = new THREE.Quaternion();
  private readonly xAxis = new THREE.Vector3(1, 0, 0);

  constructor(cfg: RideTuning, model: LoadedModel) {
    super("gengar", cfg, model);
    const legs = findBones(model.scene, cfg.legBones as string[]);
    const arms = findBones(model.scene, cfg.armBones as string[]);
    legs.forEach((b) => this.limbs.push({ bone: b, rest: b.quaternion.clone(), phase: b.name.startsWith("R") ? 0 : Math.PI }));
    arms.forEach((b) => this.limbs.push({ bone: b, rest: b.quaternion.clone(), phase: b.name.startsWith("R") ? Math.PI : 0 }));
  }

  protected floor(ctx: RideContext, x: number, z: number): number {
    return ctx.terrain.heightAt(x, z);
  }

  protected animate(_dt: number, s: PlayerState): void {
    const amt = Math.min(1, Math.abs(s.speed) / (this.cfg.speed as number)) * 0.7;
    for (const l of this.limbs) {
      this.q.setFromAxisAngle(this.xAxis, Math.sin(this.stride + l.phase) * amt);
      l.bone.quaternion.copy(l.rest).multiply(this.q);
    }
  }
}

/** Greninja: amphibious — runs on land and surfs the water using its own run/idle clips. */
export class GreninjaRide extends GroundRide {
  private readonly mixer: THREE.AnimationMixer;
  private readonly run: THREE.AnimationAction | null;
  private readonly idle: THREE.AnimationAction | null;

  constructor(cfg: RideTuning, model: LoadedModel) {
    super("greninja", cfg, model);
    this.mixer = new THREE.AnimationMixer(model.scene);
    // The clips carry root motion (the "origin" bone slides forward each loop); movement is
    // driven by gameplay instead, so strip those position tracks.
    const strip = cfg.stripRootMotion as string | undefined;
    if (strip) {
      for (const clip of model.animations) {
        clip.tracks = clip.tracks.filter((t) => !(t.name.startsWith(strip) && t.name.endsWith(".position")));
      }
    }
    const find = (suffix: string) => model.animations.find((a) => a.name.endsWith(suffix)) ?? null;
    const runClip = find(cfg.clip as string), idleClip = find(cfg.idleClip as string);
    this.run = runClip ? this.mixer.clipAction(runClip) : null;
    this.idle = idleClip ? this.mixer.clipAction(idleClip) : null;
    this.run?.play();
    this.idle?.play();
  }

  protected floor(ctx: RideContext, x: number, z: number): number {
    return Math.max(ctx.terrain.heightAt(x, z), ctx.waterY + 0.1);
  }

  protected animate(dt: number, s: PlayerState): void {
    const k = Math.min(1, Math.abs(s.speed) / (this.cfg.speed as number));
    this.run?.setEffectiveWeight(k);
    this.idle?.setEffectiveWeight(1 - k);
    if (this.run) this.run.timeScale = 0.6 + k * 0.8;
    this.mixer.update(dt);
  }
}
