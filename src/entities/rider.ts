/**
 * Pawan, the rider (BUG-0004 rebuild). A procedurally modelled figure with real human proportions:
 * shaped oversized tee (lathe) wearing his block-print design, curly hair volume, face features
 * (eyes, brows, nose, ears, beard, moustache), glasses, hands, black trousers and sandals.
 * Origin is at the hips so it sits naturally on a mount's seat.
 */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { mulberry32 } from "../core/rng";
import { toon, addInkOutline } from "../render/paper";
import { drawElephantBand, drawFloralBand, drawSunBow, PAWAN } from "../render/blockPrint";

export type RiderPose = "sit" | "stand";

const SKIN = "#8d5b3e";
const SKIN_SHADE = "#7a4c33";
const HAIR = "#17110e";
const TROUSER = "#18181c";

/**
 * Tee texture wrapped around the lathe torso: u = 0/1 is the front centre, u = 0.5 the back.
 * Rows: top ~28% is the shoulder yoke, the rest is the body.
 */
function teeTexture(): THREE.CanvasTexture {
  const W = 1024, H = 512;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = PAWAN.black;
  ctx.fillRect(0, 0, W, H);
  // Shoulder yoke florals all the way round.
  drawFloralBand(ctx, 0, H * 0.2, W, H * 0.07);
  // Back emblem (centre of the canvas = back of the tee).
  drawSunBow(ctx, W * 0.5, H * 0.5, H * 0.17);
  // Front collar band (pink + green) and elephant pocket, split across both edges (front centre).
  for (const x0 of [-W * 0.12, W * 0.88]) {
    ctx.fillStyle = PAWAN.pink;
    ctx.fillRect(x0, H * 0.27, W * 0.24, H * 0.06);
    drawFloralBand(ctx, x0, H * 0.27, W * 0.24, H * 0.06);
  }
  ctx.fillStyle = PAWAN.green;
  ctx.fillRect(W * 0.9, H * 0.38, W * 0.05, H * 0.08);
  ctx.fillStyle = PAWAN.terracotta;
  ctx.beginPath();
  ctx.ellipse(W * 0.925, H * 0.42, W * 0.014, H * 0.02, 0, 0, Math.PI * 2);
  ctx.fill();
  // Trees-and-temple band above the hem, then the elephant border.
  ctx.fillStyle = PAWAN.green;
  for (let x = 0; x < W; x += 22) {
    const h = 18 + ((x * 37) % 23);
    ctx.beginPath();
    ctx.arc(x + 11, H * 0.78 - h * 0.3, h * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const x of [W * 0.5, W * 0.0, W * 1.0]) {
    ctx.beginPath();
    ctx.arc(x, H * 0.76, 26, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(x - 30, H * 0.76, 60, 14);
  }
  ctx.fillRect(0, H * 0.8, W, 4);
  drawElephantBand(ctx, 0, H * 0.83, W, H * 0.15);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

/** A limb segment: capsule hanging down from its group's origin (the joint). */
function limb(radius: number, length: number, mat: THREE.Material): THREE.Mesh {
  const g = new THREE.CapsuleGeometry(radius, length, 6, 12);
  g.translate(0, -length / 2, 0);
  return mesh(g, mat);
}

/**
 * Merges every untextured mesh directly inside `group` into one vertex-coloured mesh, recursing
 * into child groups. The figure keeps its jointed pose groups but draws in ~16 calls, not ~180.
 */
function bakeGroup(group: THREE.Object3D): void {
  for (const child of [...group.children]) if (!(child as THREE.Mesh).isMesh) bakeGroup(child);
  const meshes = group.children.filter((c) => {
    const m = c as THREE.Mesh;
    return m.isMesh && !(m.material as THREE.MeshToonMaterial).map;
  }) as THREE.Mesh[];
  if (meshes.length < 2) return;
  let doubleSided = false;
  const parts: THREE.BufferGeometry[] = [];
  for (const m of meshes) {
    const mat = m.material as THREE.MeshToonMaterial;
    doubleSided ||= mat.side === THREE.DoubleSide;
    m.updateMatrix();
    let g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
    g.applyMatrix4(m.matrix);
    for (const name of Object.keys(g.attributes)) if (name !== "position" && name !== "normal") g.deleteAttribute(name);
    if (!g.getAttribute("normal")) g.computeVertexNormals();
    const n = g.getAttribute("position").count;
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) col.set([mat.color.r, mat.color.g, mat.color.b], i * 3);
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    parts.push(g);
    group.remove(m);
  }
  const merged = mergeGeometries(parts);
  if (!merged) return;
  const baked = new THREE.Mesh(merged, toon({ vertexColors: true, side: doubleSided ? THREE.DoubleSide : THREE.FrontSide }));
  baked.castShadow = true;
  group.add(baked);
}

export class Rider {
  readonly root = new THREE.Group();
  private readonly spine = new THREE.Group();
  private readonly head = new THREE.Group();
  private readonly arms: Array<{ upper: THREE.Group; fore: THREE.Group }> = [];
  private readonly legs: Array<{ thigh: THREE.Group; shin: THREE.Group }> = [];

  /** @param ink outline colour */
  constructor(ink: string) {
    const skin = toon({ color: SKIN });
    const skinShade = toon({ color: SKIN_SHADE });
    const hair = toon({ color: HAIR });
    const trousers = toon({ color: TROUSER });
    const tee = toon({ map: teeTexture() });
    const black = toon({ color: PAWAN.black });
    const white = toon({ color: "#f4f1ea" });
    const frame = toon({ color: "#101010" });

    // ---- Pelvis + legs (origin = hips) ----
    this.root.add(mesh(new THREE.SphereGeometry(0.15, 16, 10).scale(1.15, 0.7, 0.85), trousers, 0, 0.0, 0));
    for (const side of [-1, 1]) {
      const thigh = new THREE.Group();
      thigh.position.set(side * 0.095, -0.02, 0);
      thigh.add(limb(0.072, 0.34, trousers));
      const shin = new THREE.Group();
      shin.position.y = -0.41;
      shin.add(limb(0.058, 0.34, trousers));
      const foot = new THREE.Group();
      foot.position.y = -0.42;
      foot.add(mesh(new THREE.SphereGeometry(0.05, 12, 8).scale(0.9, 0.55, 1.9), skin, 0, -0.01, 0.045));
      foot.add(mesh(new THREE.BoxGeometry(0.1, 0.022, 0.25), toon({ color: "#5a3b28" }), 0, -0.04, 0.045));
      foot.add(mesh(new THREE.TorusGeometry(0.045, 0.008, 5, 12, Math.PI).rotateY(Math.PI / 2), toon({ color: "#3a2618" }), 0, -0.03, 0.07));
      shin.add(foot);
      thigh.add(shin);
      this.root.add(thigh);
      this.legs.push({ thigh, shin });
    }

    // ---- Torso: oversized tee shaped on a lathe (wider at the shoulders, boxy hem) ----
    this.spine.position.y = 0.04;
    const profile = [
      [0.19, -0.06], [0.205, 0.0], [0.198, 0.14], [0.205, 0.3], [0.222, 0.42], [0.21, 0.5], [0.13, 0.56], [0.07, 0.575],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    const torso = mesh(new THREE.LatheGeometry(profile, 28), tee);
    torso.scale.set(1, 1, 0.64);
    this.spine.add(torso);
    this.spine.add(mesh(new THREE.CylinderGeometry(0.048, 0.055, 0.1, 12), skin, 0, 0.6, 0));

    // ---- Arms with wide short sleeves, bare forearms, hands, bracelet ----
    for (const side of [-1, 1]) {
      const upper = new THREE.Group();
      upper.position.set(side * 0.215, 0.47, 0);
      const sleeve = mesh(new THREE.CylinderGeometry(0.075, 0.095, 0.24, 14, 1, true), black, 0, -0.1, 0);
      (sleeve.material as THREE.Material).side = THREE.DoubleSide;
      upper.add(sleeve);
      upper.add(mesh(new THREE.CylinderGeometry(0.097, 0.097, 0.035, 14, 1, true), toon({ color: PAWAN.green, side: THREE.DoubleSide }), 0, -0.2, 0));
      upper.add(mesh(new THREE.CylinderGeometry(0.098, 0.098, 0.012, 14, 1, true), toon({ color: PAWAN.gold, side: THREE.DoubleSide }), 0, -0.18, 0));
      upper.add(limb(0.043, 0.2, skin));
      const fore = new THREE.Group();
      fore.position.y = -0.27;
      fore.add(limb(0.037, 0.2, skin));
      const hand = new THREE.Group();
      hand.position.y = -0.27;
      hand.add(mesh(new THREE.SphereGeometry(0.045, 12, 8).scale(0.85, 1.1, 0.55), skin));
      hand.add(mesh(new THREE.CapsuleGeometry(0.014, 0.035, 3, 6).rotateZ(side * 0.6), skinShade, side * -0.035, 0.0, 0.015));
      fore.add(hand);
      if (side === -1) {
        const rand = mulberry32(5);
        for (let i = 0; i < 9; i++) {
          const a = (i / 9) * Math.PI * 2;
          const col = ["#c84b5a", "#e2b93b", "#2e7d5b", "#f4f1ea"][Math.floor(rand() * 4)];
          fore.add(mesh(new THREE.SphereGeometry(0.011, 6, 4), toon({ color: col }), Math.cos(a) * 0.042, -0.2, Math.sin(a) * 0.042));
        }
      }
      upper.add(fore);
      this.spine.add(upper);
      this.arms.push({ upper, fore });
    }

    // ---- Head ----
    this.head.position.y = 0.64;
    const skull = mesh(new THREE.SphereGeometry(0.1, 28, 20), skin, 0, 0.11, 0);
    skull.scale.set(1, 1.17, 1.08);
    this.head.add(skull);
    for (const side of [-1, 1]) {
      this.head.add(mesh(new THREE.SphereGeometry(0.026, 10, 8).scale(0.5, 1, 0.8), skinShade, side * 0.099, 0.105, -0.005));
      // Eyes behind the glasses.
      this.head.add(mesh(new THREE.SphereGeometry(0.015, 10, 8).scale(1.2, 0.8, 0.6), white, side * 0.037, 0.122, 0.094));
      this.head.add(mesh(new THREE.SphereGeometry(0.009, 8, 6), black, side * 0.037, 0.122, 0.102));
      const brow = mesh(new THREE.BoxGeometry(0.045, 0.01, 0.012), hair, side * 0.039, 0.152, 0.099);
      brow.rotation.z = side * -0.12;
      this.head.add(brow);
      // Glasses: rounded rectangular frames + temples to the ears.
      const lens = mesh(new THREE.TorusGeometry(0.029, 0.0045, 6, 22), frame, side * 0.039, 0.122, 0.116);
      lens.scale.set(1.25, 0.95, 1);
      this.head.add(lens);
      const temple = mesh(new THREE.BoxGeometry(0.005, 0.005, 0.11), frame, side * 0.096, 0.127, 0.06);
      this.head.add(temple);
    }
    this.head.add(mesh(new THREE.BoxGeometry(0.022, 0.005, 0.005), frame, 0, 0.128, 0.118));
    this.head.add(mesh(new THREE.SphereGeometry(0.019, 10, 8).scale(0.85, 1, 1.25), skinShade, 0, 0.093, 0.11));
    // Beard: a shell over the jaw and chin (front ~160°), plus moustache.
    // Short trimmed beard: along the jawline and chin only, leaving the cheeks clear.
    const beard = mesh(
      new THREE.SphereGeometry(0.103, 24, 10, Math.PI / 2 - 1.25, 2.5, Math.PI * 0.66, Math.PI * 0.27),
      hair, 0, 0.11, 0,
    );
    beard.scale.set(1.01, 1.17, 1.08);
    this.head.add(beard);
    const stache = mesh(new THREE.CapsuleGeometry(0.007, 0.04, 3, 6).rotateZ(Math.PI / 2), hair, 0, 0.075, 0.104);
    this.head.add(stache);
    this.head.add(mesh(new THREE.BoxGeometry(0.03, 0.005, 0.005), toon({ color: "#4a2a20" }), 0, 0.062, 0.108));
    // Curly hair: dense clusters over the crown, sides and back, leaving the face and forehead clear.
    const rand = mulberry32(2711);
    const curlGeo = new THREE.IcosahedronGeometry(1, 1);
    const hairShades = [toon({ color: HAIR }), toon({ color: "#241a15" }), toon({ color: "#0f0b09" })];
    for (let i = 0; i < 140; i++) {
      const u = rand() * 2 - 1, phi = rand() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      const d = new THREE.Vector3(r * Math.cos(phi), u, r * Math.sin(phi));
      if (d.y < -0.15) continue;                     // no hair below the ears
      if (d.z > 0.35 && d.y < 0.55) continue;        // keep the face and forehead clear
      if (d.y < 0.15 && Math.abs(d.x) > 0.7 && d.z > -0.2) continue; // keep the ears visible
      const size = 0.028 + rand() * 0.02;
      const lift = d.y > 0.4 ? 0.035 + rand() * 0.03 : 0.012;
      const curl = mesh(curlGeo, hairShades[i % 3]);
      curl.scale.setScalar(size);
      curl.position.set(d.x * (0.1 + lift), 0.11 + d.y * (0.117 + lift) + 0.02, d.z * (0.108 + lift));
      this.head.add(curl);
    }
    this.spine.add(this.head);
    this.root.add(this.spine);

    bakeGroup(this.root);
    addInkOutline(this.root, 0.012, ink);
    this.setPose("sit");
  }

  /** Sets a straddling seated pose (riding) or a relaxed standing pose. */
  setPose(pose: RiderPose): void {
    const sit = pose === "sit";
    this.legs.forEach(({ thigh, shin }, i) => {
      const side = i === 0 ? -1 : 1;
      thigh.rotation.set(sit ? -1.35 : 0, 0, sit ? side * -0.55 : side * -0.04);
      shin.rotation.set(sit ? 1.25 : 0, 0, 0);
    });
    this.spine.rotation.x = sit ? 0.28 : 0;
    this.head.rotation.x = sit ? -0.25 : 0;
    this.arms.forEach(({ upper, fore }, i) => {
      const side = i === 0 ? -1 : 1;
      upper.rotation.set(sit ? -0.95 : 0, 0, side * (sit ? 0.18 : 0.08));
      fore.rotation.set(sit ? -0.55 : -0.1, 0, 0);
    });
  }

  /** Leans into turns and bobs with the mount. */
  animate(lean: number, bob: number): void {
    this.spine.rotation.z = -lean * 0.35;
    this.spine.position.y = 0.04 + bob * 0.025;
    this.head.rotation.z = lean * 0.15;
  }
}
