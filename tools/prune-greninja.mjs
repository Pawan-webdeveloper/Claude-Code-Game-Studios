// Reproducible asset step: shrink greninja.glb (7 MB, ~74 clips) to the few clips the game uses.
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { prune, dedup, resample } from "@gltf-transform/functions";
import draco3d from "draco3dgltf";

const KEEP = ["defaultwait01_loop", "run01_loop", "jumpup01_loop", "walk01_loop"];
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  "draco3d.decoder": await draco3d.createDecoderModule(),
  "draco3d.encoder": await draco3d.createEncoderModule(),
});
const doc = await io.read("assets/models/pokemon/greninja.glb");
for (const anim of doc.getRoot().listAnimations()) {
  const name = anim.getName();
  // Keep only the first (non-"1xxxx") variant of each wanted clip.
  const keep = KEEP.some((k) => name.endsWith(k)) && /_0\d{4}_/.test(name);
  if (!keep) anim.dispose();
}
await doc.transform(resample(), prune(), dedup());
await io.write("assets/models/pokemon/greninja-lite.glb", doc);
console.log("[prune-greninja] kept:", doc.getRoot().listAnimations().map((a) => a.getName()));
