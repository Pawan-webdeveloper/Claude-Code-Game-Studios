import { defineConfig } from "vite";

// assets/ is served as the public root: assets/models/pokemon/x.glb -> /models/pokemon/x.glb
export default defineConfig({
  publicDir: "assets",
  server: { port: 5173, host: true },
  build: { target: "es2022", chunkSizeWarningLimit: 900 },
  test: { include: ["tests/**/*.test.ts"], environment: "node" },
} as never);
