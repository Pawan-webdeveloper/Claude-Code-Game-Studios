/**
 * Loads Draco-compressed Pokémon GLBs, normalises them (scale to a target height, feet on y = 0,
 * centred), and converts them to the inked toon look.
 */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { addInkOutline, toonifyModel } from "../render/paper";

export interface LoadedModel {
  /** Pivot group: rotate/translate this. The model sits inside, normalised. */
  pivot: THREE.Group;
  /** The raw glTF scene (bones live here). */
  scene: THREE.Object3D;
  animations: THREE.AnimationClip[];
  /** Height after normalisation. */
  height: number;
}

let loader: GLTFLoader | null = null;

function getLoader(manager?: THREE.LoadingManager): GLTFLoader {
  if (loader) return loader;
  const draco = new DRACOLoader(manager);
  draco.setDecoderPath("/vendor/draco/");
  loader = new GLTFLoader(manager);
  loader.setDRACOLoader(draco);
  return loader;
}

/**
 * Loads and normalises a model.
 * @param url GLB url
 * @param height desired height in world units
 * @param ink outline colour
 * @param onProgress 0..1 download progress
 */
export async function loadModel(url: string, height: number, ink: string, onProgress?: (p: number) => void): Promise<LoadedModel> {
  const gltf = await getLoader().loadAsync(url, (e) => {
    if (onProgress && e.total) onProgress(e.loaded / e.total);
  });
  const scene = gltf.scene;
  scene.updateMatrixWorld(true);
  // Hide lower LOD meshes some exports carry (they overlap the main mesh).
  scene.traverse((o) => {
    if (/lod[12]/i.test(o.name)) o.visible = false;
  });
  toonifyModel(scene);
  const box = new THREE.Box3().setFromObject(scene, true);
  const size = box.getSize(new THREE.Vector3());
  const s = height / Math.max(1e-3, size.y);
  scene.scale.multiplyScalar(s);
  scene.updateMatrixWorld(true);
  box.setFromObject(scene, true);
  const center = box.getCenter(new THREE.Vector3());
  scene.position.x -= center.x;
  scene.position.z -= center.z;
  scene.position.y -= box.min.y;
  scene.updateMatrixWorld(true);
  addInkOutline(scene, 0.035, ink);
  scene.traverse((o) => {
    o.frustumCulled = false;
  });
  const pivot = new THREE.Group();
  pivot.add(scene);
  onProgress?.(1);
  return { pivot, scene, animations: gltf.animations, height };
}

/** Finds bones whose names start with any of the given prefixes. */
export function findBones(root: THREE.Object3D, prefixes: readonly string[]): THREE.Bone[] {
  const out: THREE.Bone[] = [];
  root.traverse((o) => {
    if ((o as THREE.Bone).isBone && prefixes.some((p) => o.name.startsWith(p))) out.push(o as THREE.Bone);
  });
  return out;
}
