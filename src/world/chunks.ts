/**
 * Streams the finite island world in square chunks around the player: faceted toon terrain with
 * watercolour vertex colours, plus instanced props per region. Chunks far away are disposed.
 */
import * as THREE from "three";
import { hash2i, mulberry32 } from "../core/rng";
import { clamp, lerp, smoothstep } from "../core/math";
import type { Noise2D } from "../core/noise";
import { instancedOutline, toon } from "../render/paper";
import { propGeometry } from "./props";
import type { RegionField } from "./regions";
import type { Terrain } from "./terrain";
import type { PropKind, Quality, RegionDef, WorldConfig } from "./types";

interface Chunk {
  key: string;
  group: THREE.Group;
}

interface RegionColors {
  low: THREE.Color;
  mid: THREE.Color;
  high: THREE.Color;
  fields: THREE.Color[];
}

const SAND = new THREE.Color("#efe0b8");
const SEABED = new THREE.Color("#9fd8c8");
const SNOW = new THREE.Color("#fbfbff");

export class ChunkManager {
  private readonly chunks = new Map<string, Chunk>();
  private readonly regionColors: RegionColors[];
  private readonly terrainMat = toon({ vertexColors: true, flatShading: true });
  private readonly propMat = toon({ vertexColors: true, flatShading: true });
  private readonly tmpColor = new THREE.Color();
  private readonly tmpColor2 = new THREE.Color();

  constructor(
    private readonly scene: THREE.Scene,
    private readonly cfg: WorldConfig,
    private readonly terrain: Terrain,
    private readonly field: RegionField,
    private readonly noise: Noise2D,
    private quality: Quality,
  ) {
    this.regionColors = [];
    for (let i = 0; i < field.count; i++) {
      const c = field.def(i).colors;
      this.regionColors.push({
        low: new THREE.Color(c.low), mid: new THREE.Color(c.mid), high: new THREE.Color(c.high),
        fields: field.def(i).fields.map((f) => new THREE.Color(f)),
      });
    }
  }

  /** Changes quality; affects chunks built from now on. */
  setQuality(q: Quality): void {
    this.quality = q;
  }

  /** Number of chunks currently alive. */
  get size(): number {
    return this.chunks.size;
  }

  /**
   * Builds up to `budget` missing chunks nearest the player and disposes far ones.
   * @returns how many chunks were built this call
   */
  update(px: number, pz: number, budget: number): number {
    const size = this.cfg.chunkSize;
    const R = this.cfg.viewRadiusChunks[this.quality];
    const pcx = Math.floor(px / size), pcz = Math.floor(pz / size);
    const limit = Math.ceil(this.cfg.worldLimit / size);
    const wanted: Array<[number, number, number]> = [];
    for (let dx = -R; dx <= R; dx++)
      for (let dz = -R; dz <= R; dz++) {
        const d = Math.hypot(dx, dz);
        if (d > R + 0.5) continue;
        const cx = pcx + dx, cz = pcz + dz;
        if (Math.abs(cx) > limit || Math.abs(cz) > limit) continue;
        if (!this.chunks.has(cx + "," + cz)) wanted.push([d, cx, cz]);
      }
    wanted.sort((a, b) => a[0] - b[0]);
    let built = 0;
    for (const [, cx, cz] of wanted) {
      if (built >= budget) break;
      this.build(cx, cz);
      built++;
    }
    for (const [key, chunk] of this.chunks) {
      const [cx, cz] = key.split(",").map(Number);
      if (Math.hypot(cx - pcx, cz - pcz) > R + 1.6) this.dispose(chunk);
    }
    return built;
  }

  /**
   * Ground colour in the paper-watercolour style: sand at the shore, lavender rock on steep faces,
   * snow on high peaks, and elsewhere the region's greens broken up by a warped patchwork of
   * bright field colours. Each vertex gets a small brightness jitter like uneven pigment.
   */
  private colorAt(x: number, z: number, h: number, slope: number, out: THREE.Color): THREE.Color {
    const s = this.field.sample(x, z);
    const a = this.regionShade(s.primary, x, z, h, slope, this.tmpColor);
    if (s.t > 0.001) a.lerp(this.regionShade(s.secondary, x, z, h, slope, this.tmpColor2), s.t);
    const w = this.cfg.waterY;
    if (h < w) a.lerp(SEABED, 0.75);
    else if (h < w + 1.6) a.copy(SAND);
    const jitter = hash2i(Math.floor(x * 0.5), Math.floor(z * 0.5), this.cfg.seed) / 4294967296;
    return out.copy(a).multiplyScalar(0.95 + 0.1 * jitter);
  }

  private regionShade(index: number, x: number, z: number, h: number, slope: number, out: THREE.Color): THREE.Color {
    const def: RegionDef = this.field.def(index);
    const col = this.regionColors[index];
    const t = def.terrain;
    if (h > 150 + 15 * this.noise.sample(x * 0.01, z * 0.01) || (def.id === "frost" && h > 95)) return out.copy(SNOW);
    if (slope > 1.1 || h > t.base + t.amp * 0.8 + t.ridged * 0.55) {
      return out.copy(col.high).offsetHSL(0, 0, (hash2i(Math.floor(x * 0.3), Math.floor(z * 0.3), 7) / 4294967296 - 0.5) * 0.06);
    }
    // Warped patchwork cells (about 87 × 69 units).
    const wx = x + this.noise.sample(z * 0.011, 3.1) * 30, wz = z + this.noise.sample(x * 0.011, 8.7) * 30;
    const cell = hash2i(Math.floor(wx / 87), Math.floor(wz / 69), this.cfg.seed ^ 0x5eed) / 4294967296;
    if (slope < 0.45 && cell < 0.42 && col.fields.length) return out.copy(col.fields[Math.floor(cell * 997) % col.fields.length]);
    const k = clamp((h - (t.base - t.amp * 0.4)) / Math.max(1, t.amp * 1.2 + t.ridged * 0.6), 0, 1);
    return out.copy(col.low).lerp(col.mid, smoothstep(0.2, 0.8, k));
  }

  private build(cx: number, cz: number): void {
    const size = this.cfg.chunkSize;
    const cells = this.cfg.cellsPerChunk[this.quality];
    const step = size / cells;
    const x0 = cx * size, z0 = cz * size;
    const n = cells + 1;
    const heights = new Float32Array(n * n);
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) heights[j * n + i] = this.terrain.heightAt(x0 + i * step, z0 + j * step);

    const pos = new Float32Array(n * n * 3);
    const col = new Float32Array(n * n * 3);
    const c = new THREE.Color();
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) {
        const k = j * n + i;
        const h = heights[k];
        const hx = heights[j * n + Math.min(n - 1, i + 1)] - heights[j * n + Math.max(0, i - 1)];
        const hz = heights[Math.min(n - 1, j + 1) * n + i] - heights[Math.max(0, j - 1) * n + i];
        const slope = Math.hypot(hx, hz) / (2 * step);
        const x = x0 + i * step, z = z0 + j * step;
        pos.set([x, h, z], k * 3);
        this.colorAt(x, z, h, slope, c);
        col.set([c.r, c.g, c.b], k * 3);
      }
    const idx: number[] = [];
    for (let j = 0; j < cells; j++)
      for (let i = 0; i < cells; i++) {
        const a = j * n + i, b = a + 1, d = a + n, e = d + 1;
        idx.push(a, d, b, b, d, e);
      }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    geo.computeBoundingSphere();

    const group = new THREE.Group();
    group.name = "chunk " + cx + "," + cz;
    const mesh = new THREE.Mesh(geo, this.terrainMat);
    mesh.receiveShadow = true;
    group.add(mesh);
    this.addProps(group, cx, cz);
    this.scene.add(group);
    const key = cx + "," + cz;
    this.chunks.set(key, { key, group });
  }

  private addProps(group: THREE.Group, cx: number, cz: number): void {
    const size = this.cfg.chunkSize;
    const rand = mulberry32(hash2i(cx, cz, this.cfg.seed));
    const perKind = new Map<PropKind, THREE.Matrix4[]>();
    const tries = Math.round(this.cfg.propsPerChunk * (this.quality === "low" ? 0.6 : 1));
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    for (let k = 0; k < tries * 1.3; k++) {
      const x = cx * size + rand() * size, z = cz * size + rand() * size;
      const region = this.field.def(this.field.regionAt(x, z));
      if (rand() > region.propDensity / 1.3) continue;
      const h = this.terrain.heightAt(x, z);
      if (h < this.cfg.waterY + 1.5 || this.terrain.inStamp(x, z)) continue;
      const slope = Math.abs(this.terrain.heightAt(x + 2, z) - h) + Math.abs(this.terrain.heightAt(x, z + 2) - h);
      if (slope > 2.4) continue;
      const kind = region.prop;
      const sc = lerp(0.8, 1.6, rand()) * (kind === "neonBlock" ? lerp(0.8, 2.2, rand()) : 1);
      const rot = kind === "neonBlock" ? Math.floor(rand() * 4) * (Math.PI / 2) : rand() * Math.PI * 2;
      q.setFromAxisAngle(up, rot);
      s.set(sc, kind === "neonBlock" ? sc * lerp(0.8, 2.5, rand()) : sc, sc);
      p.set(x, h - 0.2, z);
      m.compose(p, q, s);
      const list = perKind.get(kind) ?? [];
      list.push(m.clone());
      perKind.set(kind, list);
    }
    for (const [kind, mats] of perKind) {
      const inst = new THREE.InstancedMesh(propGeometry(kind), this.propMat, mats.length);
      mats.forEach((mm, i) => inst.setMatrixAt(i, mm));
      inst.instanceMatrix.needsUpdate = true;
      inst.computeBoundingSphere();
      inst.castShadow = this.quality === "high";
      inst.receiveShadow = true;
      group.add(inst);
      // Ink outlines on props (the post pass also inks silhouettes; this adds the brush rim).
      if (this.quality === "high") group.add(instancedOutline(inst, 0.06, this.cfg.ink));
    }
  }

  private dispose(chunk: Chunk): void {
    this.scene.remove(chunk.group);
    chunk.group.traverse((o) => {
      const mesh = o as THREE.Mesh;
      // Prop geometries are shared and cached; only terrain geometry is per-chunk.
      if (mesh.isMesh && !(o as THREE.InstancedMesh).isInstancedMesh) mesh.geometry.dispose();
      if ((o as THREE.InstancedMesh).isInstancedMesh && !o.userData.isOutline) (o as THREE.InstancedMesh).dispose();
    });
    this.chunks.delete(chunk.key);
  }

  /** Disposes every chunk and the shared materials. */
  disposeAll(): void {
    for (const chunk of [...this.chunks.values()]) this.dispose(chunk);
    this.terrainMat.dispose();
    this.propMat.dispose();
  }
}
