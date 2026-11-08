/**
 * Full-screen "paper" pass (BUG-0005): the scene is rendered to an off-screen target with depth,
 * then one shader adds ink edges traced from depth, a watercolour wobble, pigment/paper grain,
 * pencil hatching in shadow, a warm vignette, speed streaks and a torn-paper border.
 * Written for Trainer's Atlas to match PaperWorld's look; no PaperWorld code is used.
 */
import * as THREE from "three";

const fragment = /* glsl */ `
uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform vec2 uRes;
uniform float uNear, uFar, uTime, uPR, uSpeed;
uniform vec3 uPaper, uInk;
varying vec2 vUv;

float h21(vec2 p) { p = fract(p * vec2(233.34, 851.73)); p += dot(p, p + 23.45); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), u.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm4(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int k = 0; k < 4; k++) { s += a * vnoise(p); p = p * 2.07 + 13.1; a *= 0.5; }
  return s;
}
// Reciprocal of view-space depth: linear across flat surfaces, so its Laplacian is ~0 on planes
// and spikes at silhouettes and creases.
float recipDepth(vec2 uv) {
  float d = texture2D(tDepth, uv).r * 2.0 - 1.0;
  float z = 2.0 * uNear * uFar / (uFar + uNear - d * (uFar - uNear));
  return 1.0 / z;
}

void main() {
  vec2 frag = vUv * uRes;
  vec2 px = 1.0 / uRes;
  vec2 cssPx = frag / uPR;

  // Watercolour wobble: low-frequency wander of the sample position.
  vec2 wob = vec2(vnoise(cssPx * 0.02 + 4.0), vnoise(cssPx * 0.02 + 9.0)) - 0.5;
  vec3 col = texture2D(tColor, vUv + wob * px * 2.6 * uPR).rgb;

  // Gentle highlight roll-off, display gamma, then a pigment-like saturation lift.
  col = col / (1.0 + col * 0.1);
  col = pow(clamp(col, 0.0, 1.0), vec3(1.0 / 2.2));
  float L = dot(col, vec3(0.299, 0.587, 0.114));
  col = clamp(mix(vec3(L), col, 1.22), 0.0, 1.0);

  // Ink edges.
  float s = max(1.0, uPR);
  float c0 = recipDepth(vUv);
  float lap = recipDepth(vUv + vec2(px.x * s, 0.0)) + recipDepth(vUv - vec2(px.x * s, 0.0))
            + recipDepth(vUv + vec2(0.0, px.y * s)) + recipDepth(vUv - vec2(0.0, px.y * s)) - 4.0 * c0;
  float edge = smoothstep(0.05, 0.2, abs(lap) / max(c0, 1e-6));
  edge *= 1.0 - smoothstep(450.0, 1400.0, 1.0 / max(c0, 1e-6));
  col = mix(col, uInk, edge * 0.82);

  // Vignette with a warm light leak from the upper left.
  vec2 q = vUv - 0.5;
  col *= 1.0 - 0.15 * smoothstep(0.38, 0.92, length(q * vec2(1.15, 1.0)));
  col += vec3(0.03, 0.018, 0.0) * (1.0 - smoothstep(0.0, 0.9, length(q - vec2(-0.3, 0.35))));

  // Paper grain and pigment pooling.
  float grain = fbm4(cssPx * 0.085);
  float pool = fbm4(cssPx * 0.004 + 7.0);
  col *= 0.94 + 0.06 * grain;
  col = mix(col, col * col * 1.1, 0.12 * (pool - 0.35));

  // Pencil hatching in the darker tones.
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  float stripe = abs(fract((cssPx.x - cssPx.y) / 5.0) - 0.5);
  col = mix(col, uInk, (1.0 - smoothstep(0.05, 0.13, stripe)) * (1.0 - smoothstep(0.3, 0.5, lum)) * 0.15);

  // Speed streaks while boosting.
  if (uSpeed > 0.0) {
    vec2 cq = q * vec2(uRes.x / uRes.y, 1.0);
    float ang = atan(cq.y, cq.x);
    float streak = smoothstep(0.7, 0.95, vnoise(vec2(ang * 40.0, uTime * 8.0))) * smoothstep(0.22, 0.6, length(cq));
    col = mix(col, vec3(1.0, 0.98, 0.78), streak * uSpeed * 0.65);
  }

  // Torn paper border.
  vec2 size = uRes / uPR;
  float e = min(min(cssPx.x, cssPx.y), min(size.x - cssPx.x, size.y - cssPx.y));
  float along = cssPx.x + cssPx.y * 1.41;
  float rag = 20.0 + 14.0 * fbm4(vec2(along * 0.012, 0.7)) + 4.0 * vnoise(vec2(along * 0.18, 3.0));
  float inside = smoothstep(rag, rag + 8.0, e);
  col *= 1.0 - 0.12 * (1.0 - smoothstep(rag + 2.0, rag + 22.0, e)) * inside;
  vec3 paper = uPaper * (0.965 + 0.035 * grain);
  col = mix(paper, col, inside);

  gl_FragColor = vec4(col, 1.0);
}`;

export class PostPaper {
  private target: THREE.WebGLRenderTarget;
  private readonly material: THREE.ShaderMaterial;
  private readonly quad: THREE.Mesh;
  private readonly orthoCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly size = new THREE.Vector2();

  /**
   * @param renderer the renderer (its size and pixel ratio define the target size)
   * @param camera scene camera (near/far for depth linearisation)
   * @param paper paper colour
   * @param ink ink colour
   * @param msaa multisample count for the scene target (0 = off)
   */
  constructor(private readonly renderer: THREE.WebGLRenderer, private readonly camera: THREE.PerspectiveCamera, paper: string, ink: string, private readonly msaa: number) {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        tColor: { value: null },
        tDepth: { value: null },
        uRes: { value: new THREE.Vector2(1, 1) },
        uNear: { value: camera.near },
        uFar: { value: camera.far },
        uTime: { value: 0 },
        uPR: { value: 1 },
        uSpeed: { value: 0 },
        uPaper: { value: new THREE.Color(paper) },
        uInk: { value: new THREE.Color(ink) },
      },
      vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
      fragmentShader: fragment,
      depthTest: false,
      depthWrite: false,
    });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material);
    this.quad.frustumCulled = false;
    this.target = this.makeTarget();
  }

  private makeTarget(): THREE.WebGLRenderTarget {
    this.renderer.getDrawingBufferSize(this.size);
    const w = Math.max(1, Math.floor(this.size.x)), h = Math.max(1, Math.floor(this.size.y));
    const depth = new THREE.DepthTexture(w, h);
    depth.type = THREE.UnsignedIntType;
    const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: this.msaa, depthTexture: depth });
    this.material.uniforms.uRes.value.set(w, h);
    this.material.uniforms.uPR.value = this.renderer.getPixelRatio();
    return rt;
  }

  /** Rebuilds the off-screen target after a resize or pixel-ratio change. */
  resize(): void {
    this.target.depthTexture?.dispose();
    this.target.dispose();
    this.target = this.makeTarget();
  }

  /** Renders the scene through the paper pass. */
  render(scene: THREE.Scene, t: number, speed01: number): void {
    const r = this.renderer;
    r.setRenderTarget(this.target);
    r.render(scene, this.camera);
    r.setRenderTarget(null);
    const u = this.material.uniforms;
    u.tColor.value = this.target.texture;
    u.tDepth.value = this.target.depthTexture;
    u.uNear.value = this.camera.near;
    u.uFar.value = this.camera.far;
    u.uTime.value = t;
    u.uSpeed.value = speed01;
    r.render(this.quad, this.orthoCam);
  }
}
