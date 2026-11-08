/**
 * Modular landmark builder: 11 kinds assembled from primitives, painted with the region's colours,
 * inked, and (for Pawan's landmarks) dressed in his block-print banner.
 */
import * as THREE from "three";
import { toon, addInkOutline } from "../render/paper";
import { bannerTexture, PAWAN } from "../render/blockPrint";
import type { LandmarkDef, RegionDef } from "./types";

const mats = new Map<string, THREE.Material>();
function mat(color: string): THREE.Material {
  let m = mats.get(color);
  if (!m) {
    m = toon({ color, flatShading: true });
    mats.set(color, m);
  }
  return m;
}
function glow(color: string): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ color });
}
let banner: THREE.CanvasTexture | null = null;

function add(g: THREE.Group, geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, noOutline = false): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(x, y, z);
  if (noOutline) mesh.userData.noOutline = true;
  g.add(mesh);
  return mesh;
}

/** Palette for one landmark: walls, roof/trim, accent. Pawan's landmarks use his tee colours. */
function palette(def: LandmarkDef, region: RegionDef) {
  if (def.pawan) return { wall: PAWAN.cream, trim: PAWAN.terracotta, accent: PAWAN.green, gold: PAWAN.gold };
  return { wall: "#efe6cf", trim: region.colors.accent, accent: region.colors.mid, gold: "#f2c94c" };
}

/**
 * Builds a landmark group with its base at y = 0.
 * @returns the group plus its overall height (for marker placement)
 */
export function buildLandmark(def: LandmarkDef, region: RegionDef, ink: string): { group: THREE.Group; height: number; spinners: THREE.Object3D[] } {
  const u = 6 * def.scale;
  const p = palette(def, region);
  const g = new THREE.Group();
  const spinners: THREE.Object3D[] = [];
  let height = 4 * u;

  switch (def.kind) {
    case "house": {
      add(g, new THREE.BoxGeometry(3 * u, 2 * u, 2.4 * u), mat(p.wall), 0, u, 0);
      const roof = add(g, new THREE.ConeGeometry(2.4 * u, 1.6 * u, 4), mat(p.trim), 0, 2.8 * u, 0);
      roof.rotation.y = Math.PI / 4;
      roof.scale.set(1, 1, 0.85);
      add(g, new THREE.BoxGeometry(0.6 * u, 1.1 * u, 0.1 * u), mat(p.accent), 0, 0.55 * u, 1.22 * u);
      add(g, new THREE.BoxGeometry(0.5 * u, 0.5 * u, 0.1 * u), mat(p.gold), -0.9 * u, 1.3 * u, 1.22 * u);
      add(g, new THREE.BoxGeometry(0.5 * u, 0.5 * u, 0.1 * u), mat(p.gold), 0.9 * u, 1.3 * u, 1.22 * u);
      height = 3.6 * u;
      break;
    }
    case "tower": {
      let y = 0;
      for (let i = 0; i < 4; i++) {
        const r = (1.5 - i * 0.25) * u, h = 1.6 * u;
        add(g, new THREE.CylinderGeometry(r * 0.9, r, h, 8), mat(i % 2 ? p.trim : p.wall), 0, y + h / 2, 0);
        y += h;
      }
      add(g, new THREE.ConeGeometry(0.9 * u, 1.6 * u, 8), mat(p.trim), 0, y + 0.8 * u, 0);
      height = y + 1.6 * u;
      break;
    }
    case "windmill": {
      add(g, new THREE.CylinderGeometry(0.9 * u, 1.3 * u, 4 * u, 8), mat(p.wall), 0, 2 * u, 0);
      add(g, new THREE.ConeGeometry(1.2 * u, 1.3 * u, 8), mat(p.trim), 0, 4.6 * u, 0);
      const hub = new THREE.Group();
      hub.position.set(0, 3.6 * u, 1.3 * u);
      for (let i = 0; i < 4; i++) {
        const blade = add(hub, new THREE.BoxGeometry(0.5 * u, 2.6 * u, 0.1 * u), mat(p.accent), 0, 1.3 * u, 0);
        const arm = new THREE.Group();
        arm.rotation.z = (i * Math.PI) / 2;
        arm.add(blade);
        hub.add(arm);
      }
      g.add(hub);
      spinners.push(hub);
      height = 6.4 * u;
      break;
    }
    case "arch": {
      add(g, new THREE.BoxGeometry(0.8 * u, 3 * u, 0.8 * u), mat(p.wall), -2.4 * u, 1.5 * u, 0);
      add(g, new THREE.BoxGeometry(0.8 * u, 3 * u, 0.8 * u), mat(p.wall), 2.4 * u, 1.5 * u, 0);
      add(g, new THREE.TorusGeometry(2.4 * u, 0.4 * u, 6, 12, Math.PI), mat(p.trim), 0, 3 * u, 0);
      height = 5.6 * u;
      break;
    }
    case "statue": {
      add(g, new THREE.CylinderGeometry(1.6 * u, 1.8 * u, 0.8 * u, 8), mat(p.wall), 0, 0.4 * u, 0);
      const top = new THREE.SphereGeometry(1.1 * u, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      const bot = new THREE.SphereGeometry(1.1 * u, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
      add(g, top, mat("#e8473c"), 0, 2 * u, 0);
      add(g, bot, mat("#f7f3ea"), 0, 2 * u, 0);
      add(g, new THREE.TorusGeometry(1.1 * u, 0.1 * u, 6, 20).rotateX(Math.PI / 2), mat(ink), 0, 2 * u, 0);
      add(g, new THREE.CylinderGeometry(0.3 * u, 0.3 * u, 0.2 * u, 12).rotateX(Math.PI / 2), mat("#f7f3ea"), 0, 2 * u, 1.1 * u);
      height = 3.4 * u;
      break;
    }
    case "shrine": {
      const red = "#d6453a";
      add(g, new THREE.CylinderGeometry(0.22 * u, 0.25 * u, 3 * u, 6), mat(red), -1.5 * u, 1.5 * u, 2 * u);
      add(g, new THREE.CylinderGeometry(0.22 * u, 0.25 * u, 3 * u, 6), mat(red), 1.5 * u, 1.5 * u, 2 * u);
      add(g, new THREE.BoxGeometry(4.2 * u, 0.35 * u, 0.4 * u), mat(red), 0, 3.1 * u, 2 * u);
      add(g, new THREE.BoxGeometry(3.4 * u, 0.25 * u, 0.3 * u), mat(red), 0, 2.5 * u, 2 * u);
      add(g, new THREE.BoxGeometry(1.6 * u, 1.2 * u, 1.4 * u), mat(p.wall), 0, 0.6 * u, -0.5 * u);
      const roof = add(g, new THREE.ConeGeometry(1.4 * u, 0.9 * u, 4), mat(p.trim), 0, 1.6 * u, -0.5 * u);
      roof.rotation.y = Math.PI / 4;
      height = 3.6 * u;
      break;
    }
    case "lighthouse": {
      let y = 0;
      for (let i = 0; i < 5; i++) {
        const h = 1.4 * u, r0 = (1.3 - i * 0.12) * u;
        add(g, new THREE.CylinderGeometry(r0 - 0.12 * u, r0, h, 10), mat(i % 2 ? p.trim : "#f7f3ea"), 0, y + h / 2, 0);
        y += h;
      }
      add(g, new THREE.CylinderGeometry(0.6 * u, 0.6 * u, 0.9 * u, 10), glow("#ffe9a0"), 0, y + 0.45 * u, 0, true);
      add(g, new THREE.ConeGeometry(0.85 * u, 0.9 * u, 10), mat(p.trim), 0, y + 1.35 * u, 0);
      const beam = new THREE.Mesh(
        new THREE.ConeGeometry(2.2 * u, 14 * u, 12, 1, true).rotateZ(Math.PI / 2).translate(7 * u, 0, 0),
        new THREE.MeshBasicMaterial({ color: "#fff3c2", transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide }),
      );
      beam.userData.noOutline = true;
      const beamPivot = new THREE.Group();
      beamPivot.position.y = y + 0.45 * u;
      beamPivot.add(beam);
      g.add(beamPivot);
      spinners.push(beamPivot);
      height = y + 1.8 * u;
      break;
    }
    case "ruins": {
      add(g, new THREE.BoxGeometry(6 * u, 0.4 * u, 4.4 * u), mat(p.wall), 0, 0.2 * u, 0);
      const hs = [2.6, 1.4, 2.2, 0.9, 2.8, 1.8];
      hs.forEach((h, i) => {
        const x = (i % 3 - 1) * 2.2 * u, z = (i < 3 ? -1 : 1) * 1.5 * u;
        add(g, new THREE.CylinderGeometry(0.35 * u, 0.4 * u, h * u, 8), mat(i % 2 ? p.accent : p.wall), x, 0.4 * u + (h * u) / 2, z);
      });
      add(g, new THREE.BoxGeometry(5 * u, 0.4 * u, 0.9 * u), mat(p.trim), -1 * u, 3.0 * u, -1.5 * u);
      height = 3.6 * u;
      break;
    }
    case "gym": {
      add(g, new THREE.CylinderGeometry(3 * u, 3.2 * u, 1.6 * u, 12), mat(p.wall), 0, 0.8 * u, 0);
      add(g, new THREE.SphereGeometry(2.8 * u, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2), mat(p.trim), 0, 1.6 * u, 0);
      add(g, new THREE.TorusGeometry(1 * u, 0.22 * u, 6, 16), mat(p.gold), 0, 3.4 * u, 2.4 * u);
      add(g, new THREE.BoxGeometry(1 * u, 1.2 * u, 0.2 * u), mat(p.accent), 0, 0.6 * u, 3.15 * u);
      height = 4.6 * u;
      break;
    }
    case "spire": {
      add(g, new THREE.ConeGeometry(3 * u, 6 * u, 7), mat(p.accent), 0, 3 * u, 0);
      add(g, new THREE.ConeGeometry(1.4 * u, 3 * u, 6), mat(p.trim), 1.8 * u, 1.5 * u, 0.6 * u);
      add(g, new THREE.ConeGeometry(1.1 * u, 2.2 * u, 6), mat(p.trim), -1.6 * u, 1.1 * u, -0.9 * u);
      add(g, new THREE.IcosahedronGeometry(0.7 * u, 0), glow(region.colors.accent), 0, 6.1 * u, 0, true);
      height = 6.8 * u;
      break;
    }
    case "neon": {
      const blocks: Array<[number, number, number]> = [[0, 8, 0], [2.4, 5, 1.2], [-2.2, 6, -1], [1.4, 3.5, -2.2]];
      blocks.forEach(([x, h, z], i) => {
        add(g, new THREE.BoxGeometry(2 * u, h * u, 2 * u), mat(i ? "#3c3f6b" : "#2c2e52"), x * u, (h * u) / 2, z * u);
        for (let k = 1; k < h; k += 2)
          add(g, new THREE.BoxGeometry(2.08 * u, 0.18 * u, 2.08 * u), glow(k % 4 === 1 ? "#ff4fa8" : "#4fe3ff"), x * u, k * u, z * u, true);
      });
      add(g, new THREE.SphereGeometry(0.5 * u, 10, 8), glow("#ffe14f"), 0, 8.6 * u, 0, true);
      height = 9.2 * u;
      break;
    }
  }

  addInkOutline(g, 0.09 * def.scale, ink);
  g.traverse((o) => { if ((o as THREE.Mesh).isMesh && !o.userData.isOutline) { o.castShadow = true; o.receiveShadow = true; } });

  if (def.pawan) {
    banner ??= bannerTexture();
    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6 * u, 2.4 * u),
      new THREE.MeshBasicMaterial({ map: banner, side: THREE.DoubleSide }),
    );
    flag.position.set(0, height + 1.4 * u, 0);
    flag.userData.noOutline = true;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06 * u, 0.06 * u, 3 * u, 5), mat(ink));
    pole.position.set(-0.85 * u, height + 1.2 * u, 0);
    g.add(flag, pole);
    spinners.push(flag);
    height += 2.8 * u;
  }
  return { group: g, height, spinners };
}
