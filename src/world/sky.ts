/**
 * Inked sky dome (BUG-0005): a horizon-to-zenith wash, a soft sun glow and hand-drawn cumulus with
 * ink contour lines, tinted toward the current region. Fog uses the horizon colour so the land
 * melts into the paper sky.
 */
import * as THREE from "three";
import { damp } from "../core/math";
import type { RegionField } from "./regions";

const fragment = /* glsl */ `
uniform float uTime;
uniform vec3 uZen, uHor, uSun, uSunDir, uCloudLit, uCloudShade, uInk;
varying vec3 vDir;
float h21(vec2 p) { p = fract(p * vec2(233.34, 851.73)); p += dot(p, p + 23.45); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), u.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm5(vec2 p) { float s = 0.0, a = 0.5; for (int k = 0; k < 5; k++) { s += a * vnoise(p); p = p * 2.03 + 17.0; a *= 0.5; } return s; }
void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 col = mix(uHor, uZen, smoothstep(-0.02, 0.6, h));
  float sd = max(dot(d, uSunDir), 0.0);
  col += uSun * (pow(sd, 260.0) * 1.4 + pow(sd, 10.0) * 0.2 + pow(sd, 3.0) * 0.07);
  if (h > -0.05) {
    vec2 cp = d.xz / (h + 0.15) * 0.8 + vec2(uTime * 0.005, uTime * 0.0018);
    float n = fbm5(cp * 1.2);
    float thr = 0.55;
    float fw = fwidth(n) * 1.3 + 1e-4;
    float cover = smoothstep(thr, thr + fw, n);
    float lit = smoothstep(thr, thr + 0.2, fbm5(cp * 1.2 + uSunDir.xz * 0.07 + vec2(0.02, 0.05)));
    float fade = smoothstep(-0.02, 0.12, h);
    col = mix(col, mix(uCloudShade, uCloudLit, lit), cover * fade);
    float contour = (1.0 - smoothstep(0.0, fw * 1.6, abs(n - thr))) * fade * smoothstep(0.0, 0.25, h + 0.1);
    col = mix(col, uInk, contour * 0.5);
  }
  gl_FragColor = vec4(col, 1.0);
}`;

export class Sky {
  readonly dome: THREE.Mesh;
  private readonly mat: THREE.ShaderMaterial;
  private readonly regionHorizon: THREE.Color[];
  private readonly baseHorizon = new THREE.Color("#eef4f5");
  private readonly horizon = new THREE.Color("#eef4f5");
  private readonly target = new THREE.Color();

  /** @param sunDir direction toward the sun (also used for the directional light) */
  constructor(scene: THREE.Scene, private readonly field: RegionField, ink: string, sunDir: THREE.Vector3, radius: number) {
    this.regionHorizon = [];
    for (let i = 0; i < field.count; i++) this.regionHorizon.push(new THREE.Color(field.def(i).sky));
    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uZen: { value: new THREE.Color("#8cc0ef") },
        uHor: { value: this.horizon.clone() },
        uSun: { value: new THREE.Color("#fff3dc") },
        uSunDir: { value: sunDir.clone().normalize() },
        uCloudLit: { value: new THREE.Color("#ffffff") },
        uCloudShade: { value: new THREE.Color("#c9c3ea") },
        uInk: { value: new THREE.Color(ink) },
      },
      vertexShader: "varying vec3 vDir; void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: fragment,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 16), this.mat);
    this.dome.renderOrder = -1;
    this.dome.frustumCulled = false;
    scene.add(this.dome);
  }

  /** Follows the camera, drifts the clouds and blends horizon and fog toward the region tint. */
  update(dt: number, t: number, camera: THREE.Camera, x: number, z: number, fog: THREE.Fog): void {
    const s = this.field.sample(x, z);
    this.target.copy(this.regionHorizon[s.primary]).lerp(this.regionHorizon[s.secondary], s.t);
    this.target.lerp(this.baseHorizon, 0.55);
    this.horizon.lerp(this.target, damp(1.5, dt));
    this.dome.position.copy(camera.position);
    this.mat.uniforms.uTime.value = t;
    this.mat.uniforms.uHor.value.copy(this.horizon);
    fog.color.copy(this.horizon);
  }
}
