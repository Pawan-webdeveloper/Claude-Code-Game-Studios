/**
 * The "Paper Atlas" look: stepped toon shading and ink outlines (inverted hull), shared by the
 * world, landmarks, rider and Pokémon so everything is drawn in the same ink.
 */
import * as THREE from "three";

let gradient: THREE.DataTexture | null = null;

/** A 4-step toon ramp (nearest-filtered) used by every toon material. */
export function toonGradient(): THREE.DataTexture {
  if (gradient) return gradient;
  // Three tones (shadow / mid / lit), the PaperWorld-style stepped watercolour wash.
  const steps = new Uint8Array([105, 185, 255]);
  const data = new Uint8Array(steps.length * 4);
  steps.forEach((v, i) => data.set([v, v, v, 255], i * 4));
  gradient = new THREE.DataTexture(data, steps.length, 1, THREE.RGBAFormat);
  gradient.minFilter = THREE.NearestFilter;
  gradient.magFilter = THREE.NearestFilter;
  gradient.needsUpdate = true;
  return gradient;
}

/** Toon material with the shared ramp. `flatShading` gives the faceted folded-paper look. */
export function toon(params: THREE.MeshToonMaterialParameters & { flatShading?: boolean } = {}): THREE.MeshToonMaterial {
  const { flatShading, ...rest } = params;
  const m = new THREE.MeshToonMaterial({ gradientMap: toonGradient(), ...rest });
  // MeshToonMaterial's typings omit flatShading, but the toon shader honours FLAT_SHADED.
  if (flatShading) (m as unknown as { flatShading: boolean }).flatShading = true;
  return m;
}

/**
 * Ink outline material (inverted hull). Back faces are pushed out along a smoothed normal
 * (`outlineNormal`) by `thickness` local units, growing slightly with camera distance so far
 * outlines stay legible; fog fades distant ink into the sky like a wash.
 */
export function outlineMaterial(ink: THREE.ColorRepresentation, thickness: number): THREE.MeshBasicMaterial {
  const mat = new THREE.MeshBasicMaterial({ color: ink, side: THREE.BackSide });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.outlineThickness = { value: thickness };
    shader.vertexShader = shader.vertexShader
      .replace("void main() {", "uniform float outlineThickness;\nattribute vec3 outlineNormal;\nvoid main() {")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vec4 inkWorld = modelMatrix * vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          inkWorld = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
        #endif
        float inkDist = distance(cameraPosition, inkWorld.xyz);
        transformed += normalize(outlineNormal) * outlineThickness * (0.7 + inkDist * 0.011);`,
      );
  };
  mat.customProgramCacheKey = () => "ink-outline-v2"; // one shared program; thickness is a per-material uniform
  return mat;
}

/**
 * Adds a smoothed normal attribute (`outlineNormal`): normals averaged across vertices that share
 * a position, so hard-edged shapes (boxes, flat-shaded rocks) get a closed outline without gaps.
 */
export function addOutlineNormals(geo: THREE.BufferGeometry): void {
  if (geo.getAttribute("outlineNormal")) return;
  if (!geo.getAttribute("normal")) geo.computeVertexNormals();
  const pos = geo.getAttribute("position");
  const nor = geo.getAttribute("normal");
  const sums = new Map<string, THREE.Vector3>();
  const key = (i: number) => `${Math.round(pos.getX(i) * 1e4)},${Math.round(pos.getY(i) * 1e4)},${Math.round(pos.getZ(i) * 1e4)}`;
  for (let i = 0; i < pos.count; i++) {
    const k = key(i);
    let v = sums.get(k);
    if (!v) { v = new THREE.Vector3(); sums.set(k, v); }
    v.x += nor.getX(i); v.y += nor.getY(i); v.z += nor.getZ(i);
  }
  const out = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const v = sums.get(key(i))!;
    const len = v.length() || 1;
    out[i * 3] = v.x / len; out[i * 3 + 1] = v.y / len; out[i * 3 + 2] = v.z / len;
  }
  geo.setAttribute("outlineNormal", new THREE.BufferAttribute(out, 3));
}

const sharedOutlines = new Map<string, THREE.MeshBasicMaterial>();

/** Creates an ink outline for an instanced mesh (shares its geometry, instance matrices and material). */
export function instancedOutline(inst: THREE.InstancedMesh, thickness: number, ink: THREE.ColorRepresentation): THREE.InstancedMesh {
  addOutlineNormals(inst.geometry);
  const key = String(ink) + "|" + thickness;
  let mat = sharedOutlines.get(key);
  if (!mat) { mat = outlineMaterial(ink, thickness); sharedOutlines.set(key, mat); }
  const o = new THREE.InstancedMesh(inst.geometry, mat, inst.count);
  o.instanceMatrix = inst.instanceMatrix;
  o.userData.isOutline = true;
  o.castShadow = false;
  if (inst.boundingSphere) o.boundingSphere = inst.boundingSphere.clone();
  return o;
}

/**
 * Adds an ink outline to every mesh under `root`. Thickness is given in world units and converted
 * to each mesh's local scale. Skinned meshes get a skinned outline bound to the same skeleton.
 */
export function addInkOutline(root: THREE.Object3D, worldThickness: number, ink: THREE.ColorRepresentation): void {
  root.updateMatrixWorld(true);
  const meshes: THREE.Mesh[] = [];
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh && !o.userData.isOutline && !o.userData.noOutline) meshes.push(o as THREE.Mesh);
  });
  const scale = new THREE.Vector3();
  for (const mesh of meshes) {
    const geo = mesh.geometry as THREE.BufferGeometry;
    addOutlineNormals(geo);
    mesh.getWorldScale(scale);
    const s = Math.max(1e-4, (Math.abs(scale.x) + Math.abs(scale.y) + Math.abs(scale.z)) / 3);
    const mat = outlineMaterial(ink, worldThickness / s);
    let outline: THREE.Mesh;
    if ((mesh as THREE.SkinnedMesh).isSkinnedMesh) {
      const sk = mesh as THREE.SkinnedMesh;
      const o = new THREE.SkinnedMesh(geo, mat);
      o.bind(sk.skeleton, sk.bindMatrix);
      outline = o;
    } else {
      outline = new THREE.Mesh(geo, mat);
    }
    outline.userData.isOutline = true;
    outline.frustumCulled = false;
    outline.castShadow = false;
    mesh.add(outline);
  }
}

/** Replaces imported glTF materials with toon materials that keep the original texture and colour. */
export function toonifyModel(root: THREE.Object3D): void {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const geo = mesh.geometry as THREE.BufferGeometry;
    if (!geo.getAttribute("normal")) geo.computeVertexNormals();
    const convert = (m: THREE.Material): THREE.Material => {
      const src = m as THREE.MeshStandardMaterial;
      const out = toon({
        map: src.map ?? null,
        color: src.color ? src.color.clone() : new THREE.Color(0xffffff),
        transparent: src.transparent,
        alphaTest: src.alphaTest || (src.transparent ? 0.3 : 0),
        side: src.side,
      });
      if (out.map) out.map.colorSpace = THREE.SRGBColorSpace;
      return out;
    };
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(convert) : convert(mesh.material);
  });
}
