/**
 * Places the 40 landmarks, animates their markers, culls far ones, and reports arrivals.
 */
import * as THREE from "three";
import { buildLandmark } from "../world/landmarkKit";
import type { RegionField } from "../world/regions";
import type { Terrain } from "../world/terrain";
import type { LandmarkDef } from "../world/types";
import type { DiscoveryLog } from "./discoveryLog";

interface Placed {
  def: LandmarkDef;
  group: THREE.Group;
  marker: THREE.Mesh;
  beam: THREE.Mesh | null;
  spinners: THREE.Object3D[];
  base: THREE.Vector3;
  height: number;
  radius: number;
}

export class Landmarks {
  private readonly placed: Placed[] = [];
  private readonly markerGeo = new THREE.OctahedronGeometry(1, 0);

  constructor(
    scene: THREE.Scene,
    defs: readonly LandmarkDef[],
    field: RegionField,
    terrain: Terrain,
    private readonly log: DiscoveryLog,
    ink: string,
    private readonly cullDistance: number,
  ) {
    const regionIndex = new Map<string, number>();
    for (let i = 0; i < field.count; i++) regionIndex.set(field.def(i).id, i);
    defs.forEach((def, i) => {
      const region = field.def(regionIndex.get(def.region) ?? field.regionAt(def.pos[0], def.pos[1]));
      const { group, height, spinners } = buildLandmark(def, region, ink);
      const base = new THREE.Vector3(def.pos[0], terrain.stamps[i].height - 0.3, def.pos[1]);
      group.position.copy(base);
      group.rotation.y = Math.atan2(-def.pos[0], -def.pos[1]) + Math.PI; // face roughly toward the island centre
      group.name = def.id;
      scene.add(group);

      const color = def.project ? "#f2c94c" : def.pawan ? "#e2733c" : "#ffffff";
      const marker = new THREE.Mesh(this.markerGeo, new THREE.MeshBasicMaterial({ color }));
      const ms = def.project ? 4.5 : 3;
      marker.scale.set(ms, ms * 1.5, ms);
      marker.position.set(base.x, base.y + height + 8, base.z);
      scene.add(marker);

      let beam: THREE.Mesh | null = null;
      if (def.project) {
        beam = new THREE.Mesh(
          new THREE.CylinderGeometry(2.2, 2.2, 260, 10, 1, true),
          new THREE.MeshBasicMaterial({ color: "#f2c94c", transparent: true, opacity: 0.28, depthWrite: false, fog: false }),
        );
        beam.position.set(base.x, base.y + height + 130, base.z);
        scene.add(beam);
      }
      this.placed.push({ def, group, marker, beam, spinners, base, height, radius: 34 + 18 * def.scale });
      this.refreshMarker(this.placed[this.placed.length - 1]);
    });
  }

  /** Landmark definitions with their world base positions (for the minimap and spawn facing). */
  positions(): Array<{ def: LandmarkDef; x: number; y: number; z: number }> {
    return this.placed.map((p) => ({ def: p.def, x: p.base.x, y: p.base.y, z: p.base.z }));
  }

  private refreshMarker(p: Placed): void {
    const found = this.log.has(p.def.id);
    p.marker.visible = !found;
    if (p.beam) (p.beam.material as THREE.MeshBasicMaterial).opacity = found ? 0.08 : 0.28;
  }

  /**
   * Animates, culls and checks arrival.
   * @returns landmarks discovered this frame (first time only)
   */
  update(t: number, dt: number, player: THREE.Vector3): LandmarkDef[] {
    const out: LandmarkDef[] = [];
    for (const p of this.placed) {
      const dx = player.x - p.base.x, dz = player.z - p.base.z;
      const d = Math.hypot(dx, dz);
      const visible = d < this.cullDistance;
      p.group.visible = visible;
      if (visible) {
        p.spinners.forEach((s, i) => {
          if (p.def.kind === "windmill" && i === 0) s.rotation.z += dt * 1.2;
          else s.rotation.y += dt * 0.6;
        });
      }
      p.marker.rotation.y = t * 1.5;
      p.marker.position.y = p.base.y + p.height + 8 + Math.sin(t * 2 + p.base.x) * 1.2;
      const dy = player.y - (p.base.y + p.height * 0.5);
      if (d < p.radius && Math.abs(dy) < p.radius + p.height && this.log.discover(p.def.id)) {
        this.refreshMarker(p);
        out.push(p.def);
      }
    }
    return out;
  }
}
