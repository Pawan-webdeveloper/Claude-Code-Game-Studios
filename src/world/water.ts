/**
 * The sea (BUG-0005): teal watercolour with shallow/deep pools, white foam crests and sparkles,
 * fading into the paper fog. One plane that follows the player.
 */
import * as THREE from "three";

const fragment = /* glsl */ `
uniform float uTime, uFogNear, uFogFar;
uniform vec3 uDeep, uShallow, uFoam, uFogColor;
varying vec3 vWorld;
float h21(vec2 p) { p = fract(p * vec2(233.34, 851.73)); p += dot(p, p + 23.45); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), u.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm4(vec2 p) { float s = 0.0, a = 0.5; for (int k = 0; k < 4; k++) { s += a * vnoise(p); p = p * 2.05 + 11.0; a *= 0.5; } return s; }
void main() {
  vec2 p = vWorld.xz * 0.015;
  vec3 col = mix(uDeep, uShallow, smoothstep(0.3, 0.7, fbm4(p * 1.5 + uTime * 0.02)));
  float crest = 1.0 - abs(vnoise(p * 5.0 + vec2(uTime * 0.11, -uTime * 0.07)) * 2.0 - 1.0);
  float crest2 = 1.0 - abs(vnoise(p * 10.0 - uTime * 0.08) * 2.0 - 1.0);
  col = mix(col, uFoam, clamp(smoothstep(0.92, 0.965, crest) * 0.95 + smoothstep(0.95, 0.985, crest2) * 0.6, 0.0, 1.0));
  col += vec3(pow(vnoise(p * 36.0 + uTime * 0.6), 20.0) * 1.3);
  col = mix(col, uFogColor, smoothstep(uFogNear, uFogFar, distance(cameraPosition, vWorld)));
  gl_FragColor = vec4(col, 1.0);
}`;

export class Water {
  readonly mesh: THREE.Mesh;
  private readonly mat: THREE.ShaderMaterial;

  /** @param level sea level @param size plane size */
  constructor(level: number, size: number) {
    this.mat = new THREE.ShaderMaterial({
      vertexShader: "varying vec3 vWorld; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }",
      fragmentShader: fragment,
      uniforms: {
        uTime: { value: 0 },
        uDeep: { value: new THREE.Color("#3fbfc4") },
        uShallow: { value: new THREE.Color("#9fe6ea") },
        uFoam: { value: new THREE.Color("#ffffff") },
        uFogColor: { value: new THREE.Color("#eef4f5") },
        uFogNear: { value: 180 },
        uFogFar: { value: 700 },
      },
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2), this.mat);
    this.mesh.position.y = level;
    this.mesh.frustumCulled = false;
    this.mesh.receiveShadow = true;
  }

  /** Moves the plane with the player and animates foam. */
  update(t: number, px: number, pz: number, fog: THREE.Fog): void {
    this.mesh.position.x = Math.round(px / 64) * 64;
    this.mesh.position.z = Math.round(pz / 64) * 64;
    const u = this.mat.uniforms;
    u.uTime.value = t;
    u.uFogColor.value.copy(fog.color);
    u.uFogNear.value = fog.near;
    u.uFogFar.value = fog.far;
  }
}
