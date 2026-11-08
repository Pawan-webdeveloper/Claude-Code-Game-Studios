# Game Spec — "Pokémon World" (working title)

A from-scratch 3D open-world exploration game, inspired by the *mechanics and feel* of **Paper World** (github.com/aadil6971/PaperWorld), re-themed as a Pokémon world with Pawan as the playable trainer. It is launched from the GAMES section of the portfolio and must run on desktop and phones.

## 0. Ground rules

- **Do NOT copy Paper World's code.** The repo has no LICENSE file, so it is "all rights reserved". Read it only to understand *how it feels and what systems exist*; write all code fresh, with our own names, structure and art style.
- **Updated 2026-11-08:** the user wants the whole game to LOOK like PaperWorld (ink-and-watercolour paper). Rebuild that look with original code. See design/gdd/game-concept.md.
- Single-purpose goal: an impressive, smooth, *playable-in-10-seconds* experience. Not a 10,000-line clone. Ship a tight version first.

## 1. What Paper World does (reference study — mechanics only)

| System | What it does in the reference | Our version |
|---|---|---|
| World | Endless, streamed in square chunks (384 units, 80×80 cells) around the player; noise-based terrain; lakes, meadows, forests, snow mountains | Same *idea*: chunked, streamed world from seeded noise |
| Roads | Painted roads wind across the world and drive where the player goes | Winding roads that connect towns; Gengar runs along them |
| Places | ~46 kinds of discoverable landmark (castle, lighthouse, ferris wheel…) with "discovered" toasts | ~40 Pokémon-themed landmarks, discovery counter |
| Vehicles | Rover car; enter/exit parked cars; walk on foot | Three **rides** (below); swap with a key/button |
| Flight | Fold into paper plane or eagle | Charizard flight |
| Collectibles | Golden records on ramps/peaks | Collectible items (Poké Balls / orbs) in hard-to-reach spots |
| Living world | Pedestrians, animals, butterflies, whales | Wild Pokémon wandering by region |
| Atmosphere | Time of day, rain, generative radio | Time of day (dawn→night), weather per region, chiptune music |
| UI | Minimap, camera cycle, photo mode | Minimap, camera cycle, photo mode (nice for sharing) |
| Mobile | Joystick + buttons, auto quality | Same, with quality tiers + auto resolution scaling |
| Delivery | Static files, three.js via CDN, offline PWA | Lazy-loaded chunk of the portfolio (not a separate page) |

## 2. The three rides (core of the request)

| Ride | Replaces | Terrain | Behaviour |
|---|---|---|---|
| **Charizard** (flying) | Paper plane / eagle | **Air**, any region | Pawan sits on Charizard's back. Pitch/yaw/bank, flap to climb, Shift = fire-boost with flame trail. Altitude min/max. Lands → switch to Gengar. |
| **Gengar** (running) | The rover car / jeep | **Land & streets** | Pawan rides or runs with Gengar along roads and fields. Throttle/steer, hop, shadow-dash boost (Shift). Can phase through light objects (fun ghost power); leaves dark mist trail. Stops at water's edge. |
| **Greninja** (swimming) | (no equivalent — new) | **Ocean / lakes / rivers** | Pawan surfs on Greninja across the water surface; water-ripple trail, water-jet boost, jump-flip from waves. Enter from shore: Gengar → Greninja at water edge. |

**Switching:** key `1/2/3` or on-screen ride button (mobile). Switch plays a Poké-Ball burst effect. Auto-suggest: when over water the HUD hints "Switch to Greninja?"; over land "Gengar"; press Fly to Charizard.
**Pawan** is always the rider: low-poly stylised character, simple riding animations (lean into turns).
**Charizard flight to be the star feature** — most polish budget goes here.

## 3. The world: regions (instead of one paper land)

Regions blend smoothly by distance/noise ("biomes"). Each has colour palette, ground, trees, wild Pokémon, weather, landmarks, music tone.

| Region | Look | Wild Pokémon (ambient) | Example landmarks |
|---|---|---|---|
| **Pallet Meadows** (grass) | Green fields, flower beds, windmills | Bulbasaur, Oddish, Pikachu | Starter town, Professor's lab, bridge |
| **Ember Peaks** (fire) | Red rock, lava rivers, volcano | Charmander, Growlithe, Ponyta | Volcano crater, fire gym, forge |
| **Frost Highlands** (ice) | Snow, ice lakes, pines | Snom, Vulpix (Alolan), Glaceon | Ice gym, snow lodge |
| **Haunted Hollow** (ghost) | Purple fog, dead trees, night-ish | Gastly, Haunter, Misdreavus | Ruined tower, graveyard, Pokémon Tower |
| **Azure Coast / Ocean** (water) | Beaches, open sea, islands, reefs | Magikarp, Wingull, Lapras | Lighthouse, harbor, sunken ruins |
| **Neon City** (electric/city) | Skyline, glowing roads | Pikachu, Voltorb | Power plant, Game Corner, Silph-style tower |
| *(optional)* Sky Isles | Floating islands, clouds | Pidgeot, Altaria | Sky temple |

Wild Pokémon are **ambient decoration + discoverable** (not catchable — keep scope small). Each is a billboard sprite or low-poly model.

Landmarks (~40 total across regions): each has a name, region, short fun line, and 8 of them link to Pawan's real info (e.g. "ScanlyFix Lighthouse" → opens project card). Discovered count: "12 / 40" with save in localStorage.

## 4. Controls

**Desktop**
- `W/S` throttle/brake (or pitch in flight), `A/D` steer/yaw-bank, `Space` jump/flap, `Shift` boost, `1/2/3` switch ride, `C` camera, `M` minimap, `P` photo, `H` hide UI, `Esc` exit to portfolio, drag = look, scroll = zoom.

**Mobile (landscape)**
- Left: virtual joystick. Right: `JUMP/FLAP`, `BOOST`, ride-switch button (shows current ride icon), camera. Drag empty screen = look. "Rotate your phone" hint in portrait. No page scrolling/zoom/bounce while playing.

## 5. Technical plan

- **Stack:** Three.js (via npm in the portfolio project), dynamic `import()` only when PLAY pressed. Plain TypeScript modules (not one giant file): `world/`, `rides/`, `regions/`, `landmarks/`, `ui/`, `audio/`, `input/`.
- **Terrain:** seeded simplex/fbm heightmap per chunk, chunk size ~256, streamed in radius by quality tier, chunk dispose to avoid leaks. Biome by low-frequency noise → palette + props.
- **Water:** simple animated shader plane at sea level (cheap), shoreline foam optional.
- **Rendering style:** MeshToonMaterial + inverted-hull outlines (cheap), fog for distance, instanced meshes for trees/grass/props. Keep draw calls low.
- **Characters/rides:** first pass = stylised low-poly built from primitives or lightweight GLB; upgrade later. Pokémon visuals options in priority order:
  1. Original low-poly stylised models inspired by the Pokémon (smallest risk, lightest),
  2. Licensed/CC fan GLB models (check license each; track in CREDITS.md),
  3. Billboard 2D sprites for ambient wild Pokémon.
- **Collision:** simple heightfield ground + spherical/box colliders for landmarks; no heavy physics engine.
- **Quality tiers:** Low / Medium / High; phones default Medium; auto resolution scaling by measured frame time; user toggle remembered.
- **Audio:** Howler + royalty-free chiptune; per-region music crossfade; engine-ish whoosh for flight; mute toggle. Start only after user gesture.
- **Save:** localStorage for discovered landmarks, settings.
- **Integration:** Game mounts inside the portfolio's GAMES screen as full-screen overlay; Exit button returns; pause when tab hidden; dispose all GPU resources on exit.

## 6. Milestones

1. **M1 – Fly:** terrain + sky + water + Charizard flight with camera, boost, mobile joystick. (Proves feel + performance.)
2. **M2 – Run:** Gengar on land/roads, ride switching, region blending (2 regions).
3. **M3 – Swim:** Greninja on water, wake/ripples, shoreline switching.
4. **M4 – Content:** all regions, ~40 landmarks with discover toasts, collectibles, wild Pokémon, minimap.
5. **M5 – Polish:** time of day/weather, music, photo mode, quality tiers, save, tutorial hints.
6. **M6 – Integrate:** lazy-load from portfolio, exit/back, loading bar, QA on real phones.

Each milestone must run at ≥60 fps on a desktop, ≥30 fps on a mid-range phone before moving on.

## 7. Open items for Pawan

- Pawan character look (photo / description / colours).
- Which landmarks should be tied to your real projects/skills (suggested: ScanlyFix, Bennet AI, third project, Dhyan Vandana, Skills).
- Do you accept starting with stylised low-poly Pokémon (recommended) instead of exact official models?
- Preferred music mood per region (or "agent picks royalty-free").
