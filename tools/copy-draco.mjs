// Copies three.js's Draco decoder into assets/vendor/draco so Vite serves it at /vendor/draco/.
import { cpSync, existsSync, mkdirSync } from "node:fs";
const src = "node_modules/three/examples/jsm/libs/draco/gltf/";
const dst = "assets/vendor/draco/";
if (!existsSync(dst)) mkdirSync(dst, { recursive: true });
for (const f of ["draco_decoder.js", "draco_decoder.wasm", "draco_wasm_wrapper.js"]) cpSync(src + f, dst + f);
console.log("[copy-draco] decoder copied to", dst);
