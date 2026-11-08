/**
 * Low-poly prop geometry per region (trees, rocks, buildings), with colours baked into vertex
 * colours so one toon material draws them all via instancing.
 */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { PropKind } from "./types";

function painted(geo: THREE.BufferGeometry, color: THREE.ColorRepresentation, at: [number, number, number] = [0, 0, 0]): THREE.BufferGeometry {
  const g = geo.index ? geo.toNonIndexed() : geo;
  g.translate(at[0], at[1], at[2]);
  const c = new THREE.Color(color);
  const n = g.getAttribute("position").count;
  const colors = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) colors.set([c.r, c.g, c.b], i * 3);
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.deleteAttribute("uv");
  g.computeVertexNormals();
  return g;
}

function build(kind: PropKind): THREE.BufferGeometry {
  switch (kind) {
    case "roundTree":
      return mergeGeometries([
        painted(new THREE.CylinderGeometry(0.35, 0.5, 3, 6), "#8a6448", [0, 1.5, 0]),
        painted(new THREE.IcosahedronGeometry(2.4, 0), "#7fbf4a", [0, 4.4, 0]),
        painted(new THREE.IcosahedronGeometry(1.6, 0), "#8ac653", [0.9, 5.6, 0.4]),
      ])!;
    case "snowPine":
      return mergeGeometries([
        painted(new THREE.CylinderGeometry(0.3, 0.45, 2, 5), "#6b4a3a", [0, 1, 0]),
        painted(new THREE.ConeGeometry(2.4, 3.6, 6), "#5fa37a", [0, 3.4, 0]),
        painted(new THREE.ConeGeometry(1.8, 3, 6), "#6fb58a", [0, 5.2, 0]),
        painted(new THREE.ConeGeometry(1.0, 1.8, 6), "#f4f7f8", [0, 6.8, 0]),
      ])!;
    case "lavaRock":
      return mergeGeometries([
        painted(new THREE.DodecahedronGeometry(2, 0), "#a79fbd", [0, 1.2, 0]),
        painted(new THREE.DodecahedronGeometry(0.9, 0), "#ff8f6a", [1.2, 2.4, 0.3]),
      ])!;
    case "deadTree":
      return mergeGeometries([
        painted(new THREE.CylinderGeometry(0.25, 0.55, 5, 5), "#8f84b0", [0, 2.5, 0]),
        painted(new THREE.CylinderGeometry(0.12, 0.2, 2.4, 4).rotateZ(0.9), "#8f84b0", [0.9, 4.2, 0]),
        painted(new THREE.CylinderGeometry(0.1, 0.18, 2, 4).rotateZ(-1.0), "#8f84b0", [-0.8, 3.6, 0]),
        painted(new THREE.IcosahedronGeometry(0.45, 0), "#b98cf0", [1.8, 5, 0]),
      ])!;
    case "neonBlock":
      return mergeGeometries([
        painted(new THREE.BoxGeometry(4, 9, 4), "#c3bad2", [0, 4.5, 0]),
        painted(new THREE.BoxGeometry(4.2, 0.6, 4.2), "#ff8fb1", [0, 6.5, 0]),
        painted(new THREE.BoxGeometry(4.2, 0.6, 4.2), "#9ad7ff", [0, 3.5, 0]),
      ])!;
    case "palm":
      return mergeGeometries([
        painted(new THREE.CylinderGeometry(0.25, 0.4, 5, 5).rotateZ(0.15), "#9a7650", [0.3, 2.5, 0]),
        painted(new THREE.ConeGeometry(2.6, 0.8, 5), "#7fbf4a", [0.7, 5.2, 0]),
      ])!;
  }
}

const cache = new Map<PropKind, THREE.BufferGeometry>();

/** Shared geometry for a prop kind (built once). */
export function propGeometry(kind: PropKind): THREE.BufferGeometry {
  let g = cache.get(kind);
  if (!g) {
    g = build(kind);
    cache.set(kind, g);
  }
  return g;
}
