# Handoff Context — Pawan's Pokémon Portfolio Game

Read this first, then `PROJECT_BRIEF.md` (whole portfolio) and `GAME_SPEC.md` (3D game). This file overrides them where they disagree.

## One-sentence concept (for /start path C)
A browser-based Pokémon-world portfolio: a retro pixel-art menu site for Pawan (full-stack dev) that launches a Three.js 3D open-world game where Pawan, in his signature outfit, flies on Charizard, runs on Gengar and swims on Greninja across Pokémon-style regions.

## Decisions already made (do not re-ask)
- **Platform:** browser game (desktop + phone). **Tech: Three.js + TypeScript** (Vite). No Godot/Unity/Unreal. The studio's engine-specific agents don't apply; use its generic design/art/QA/producer/gameplay/UI agents and skills. `/setup-engine` must be told the engine is "web / Three.js", not one of its three presets.
- **Project type:** personal portfolio, used by Pawan only. Pawan decided: official Pokémon assets are OK to use. (Keep a CREDITS.md of where assets came from anyway.)
- **Assets:** Pawan downloads Pokémon 3D models/sprites himself. The agent must produce an exact checklist (names, formats like .glb, animations needed, target polygon budget, folder paths) and wire them in. Use temporary primitive stand-ins in code until the real files exist so the game is always runnable.
- **Rides:** Charizard = flying, Gengar = running on land/streets, Greninja = swimming on water. Regions: grass, fire, ice, ghost, ocean, neon city (see GAME_SPEC.md).
- **Reference game:** `PaperWorld/` (github.com/aadil6971/PaperWorld, cloned one folder above `my-game`). **No license → study mechanics only, never copy code.** Rebuild from scratch, different (cel-shaded Pokémon) art style.
- **Do not push anywhere:** `origin` still points at the template repo (Donchitos/Claude-Code-Game-Studios). Pawan should create his own repo.

## Portfolio projects (team section) — final
| Pokémon | Project | URL | What it is |
|---|---|---|---|
| Greninja | **ScanlyFix** | https://scanlyfix.com/ | Free web scanner, 114 checks across security, SEO, AI-answer visibility, performance, accessibility, compliance; fix prompts, Auto-Fix PRs, pentest agents, CLI/API/MCP. Next.js. |
| Charizard | **Bennet AI** | https://bennet-ai.vercel.app/ | No-code AI support chatbot trained on your docs, one-line embed, admin-controlled answers, integrations. |
| Pikachu | **Third Eye** | https://third-eye-main.vercel.app/ | Women's harassment detection model — "Safety Reimagined". (Health Vault is dropped.) |
Experience: Dhyan Vandana agency, web / full-stack developer, 2025–2026 (~1 year). Also built and sold a product to 500+ users (details TBD — ask Pawan).

## Playable character: PAWAN (build from his real outfit)
Reference photos in `reference-photos/`: `pawan-face.jpg` (face/hair/glasses), `pawan-full-body-front.png` (front of outfit, black trousers, sandals), `outfit-back-reference.webp` (the same tee seen from the back — a model wears it).

**Face/body:** young man, voluminous dark curly/wavy hair (tall on top, shorter at sides), glasses, short trimmed beard/stubble, slim and fairly tall build.

**Signature outfit (key to his identity):** oversized black half-sleeve tee with Indian folk-art / block-print graphics:
- **Back (hero graphic — visible in 3rd-person flight/run camera, so make it crisp):** large terracotta-red radiating sun enclosing a spiral mandala disc, with a gold-and-green bow and upward gold arrow in front of it. Above: a shoulder-yoke border of green leaves with red/yellow flowers. Below: dense green trees around a domed palace/temple silhouette, then a hem border of terracotta elephants alternating with fan/feather motifs, green ornamental trim. Sleeve bands: green strips with red/yellow hexagon + diamond geometric patterns.
- **Front:** same black tee; wide pink-red + green floral band around the collar/chest yoke; small chest pocket with an elephant motif; green trees/temple band and elephant row near the hem.
- **Bottoms/shoes:** black trousers (cream linen trousers as an alternate skin), flip-flop sandals. Optional beaded/red-thread bracelet on wrist.
- **Palette:** black `#141414`, terracotta `#B5503C`, forest green `#2E7D5B`, mustard gold `#E2B93B`, pink-red `#C84B5A`, cream `#E8DCC0`, skin warm brown, hair near-black.

**Required character deliverables**
1. **2D pixel sprite set** for the portfolio menus/home scene: ~32×48 or 48×64 px, front/back/side idle, 4-frame walk, "standing next to Greninja" pose, mini-portrait for the Trainer Card. Outfit prints simplified to readable pixel patterns (sun+bow on back, elephant row, collar band).
2. **3D stylised low-poly rider** for the game: same outfit via a painted canvas/texture (back print especially), curly-hair mesh, glasses, simple rig poses: seated-riding (lean left/right), running-ride, swimming-surf, flying-prone.
3. Colour variants: black-pants default, cream-trousers alt.

## Studio rules to follow (from my-game/CLAUDE.md)
- Collaboration protocol: Question → Options → Decision → Draft → Approval. Ask "May I write this to [path]?" before writing files (Pawan pre-approved this handoff file only).
- Pawan's session may start outside `my-game/`; hooks/deny rules only load when Claude Code is *started* in `my-game/`. Run Claude Code from inside `my-game` for the real build.
- No commits unless Pawan says so.

## Open questions still to ask Pawan (via the studio's own skills)
1. The "built and sold to 500+ users" product: name, what it does, his role.
2. Dhyan Vandana: exact title, months, 3–5 achievements.
3. Skills list grouped (Frontend / Backend / DB / DevOps / AI…), honest levels.
4. Contact details (email, LinkedIn, GitHub, resume PDF).
5. Bennet AI and Third Eye GitHub links / architecture notes.
6. Music mood preferences or "pick royalty-free".

## Update: model sources (verified, not yet downloaded)
- Third Eye's Pokémon is **Pikachu** (not Lucario).
- Best source: `github.com/Pokemon-3D-api/assets` (MIT repo; the older `Sudhanshu-Ambastha/Pokemon-3D-api` has moved there). Files are `.glb` named by Pokédex number, Draco-compressed (needs Three.js `DRACOLoader`), textures WebP:
  | Pokémon | File | Size |
  |---|---|---|
  | Charizard | `models/opt/regular/6.glb` (also `x/6.glb`, `y/6.glb`, `gmax/6.glb`) | ~174 KB |
  | Gengar | `models/opt/regular/94.glb` (also `mega/94.glb`) | ~47 KB |
  | Greninja | `models/opt/regular/658.glb` (7 MB — heavy for phones; `unique/658.glb` is ~99 KB, check what it is) | ~7 MB |
  | Pikachu | `models/opt/regular/25.glb` | ~146 KB |
- `rendfall/pokemon-viewer-3d` (MIT code, OBJ models) only has Charizard, Bulbasaur, Rattata, Snorlax, Slowpoke, Pikachu — **no Gengar or Greninja**, so it is only a fallback.
- **Still unknown:** whether these GLBs have skeletal animations (fly/run/swim). If static, animate procedurally in code (flap, bob, lean, ripple). Greninja needs texture/size reduction for mobile.
- Next: download the 4 GLBs into `assets/` (needs Pawan's OK), inspect them (animations, polycount), record sources in CREDITS.md.

## Update: models downloaded and inspected (2026-11-08)
Files are in `assets/models/pokemon/` (source: Pokemon-3D-api/assets `models/opt/regular/`). All are skinned (rigged), low-poly, Draco + WebP:
| File | Verts | Animations | Notes |
|---|---|---|---|
| charizard.glb (174 KB) | 4,464 | 1 (`Chariard_dizzy`) | No flight/flap clip → drive wing + body bones procedurally in code |
| gengar.glb (47 KB) | 2,636 | none | Rigged but static → procedural bob/hover/run-lean |
| greninja.glb (7 MB) | 4,042 | ~70 (idle, walk, run, jump, attack, etc.; no swim) | Size is from the animation data, not geometry → strip to ~6 clips (idle, run, jump, land + one swim-like pose) to cut it to well under 1 MB; swim = procedural surf pose + ripples |
| pikachu.glb (146 KB) | 2,866 | 1 (`Impactrueno`/Thunderbolt) | Fine for Team card + idle |
Needs: `DRACOLoader` + WebP support in Three.js, `gltf-transform` (or similar) to prune Greninja's animations.

## Update: /brainstorm decisions (2026-11-08) — supersedes earlier lines
- Concept written: `design/gdd/game-concept.md` ("Trainer's Atlas"). It is now the authoritative design record.
- **Visual direction changed:** the whole game should LOOK like PaperWorld (ink-and-watercolour paper). This replaces "ours must look different" above. Still never copy PaperWorld's code.
- Full-time (40+ h/week). Original single MVP kept; v1 = all 6 regions, 40 landmarks (reviewer concerns logged as risks).
