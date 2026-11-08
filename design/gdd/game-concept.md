# Game Concept: Trainer's Atlas

*Created: 2026-11-08*
*Status: Draft — written by /brainstorm (rigor full, automation autonomous); director gates run, user overrides logged*

> Context sources: `design/context/00-START-HERE.md`, `design/context/PROJECT_BRIEF.md`, `design/context/GAME_SPEC.md`. Where those disagree with this file, **this file wins**.

---

## Elevator Pitch

> It's a relaxing open-world exploration game where you **ride Charizard, Gengar and Greninja across a hand-inked paper Pokémon world** to discover 40 landmarks — and the map is developer Pawan's portfolio.
>
> Recruiter version: *"The map is the portfolio, and you ride Pawan's Pokémon through it."*

---

## Core Identity

| Aspect | Detail |
| ---- | ---- |
| **Genre** | Open-world exploration / "toy" sandbox; interactive portfolio |
| **Platform** | Web / Browser — desktop and mid-range phones (iOS Safari, Android Chrome), lazy-loaded inside Pawan's portfolio site |
| **Target Audience** | Primary: recruiters and clients (first 60 seconds). Secondary: Pokémon and cozy-exploration fans (everything after). See Target Player Profile |
| **Player Count** | Single-player |
| **Session Length** | 1–3 minutes (recruiter) / 15–45 minutes (explorer) |
| **Monetization** | None — personal, non-commercial portfolio |
| **Estimated Scope** | Large (12–24 months, solo, full-time) |
| **Comparable Titles** | PaperWorld (aadil6971 — mechanics and look reference), Bruno Simon's 3D driving portfolio, Pokémon Legends: Arceus (ride-switching fantasy) |

---

## Core Fantasy

**You are Pawan, riding your own Pokémon across a living, hand-painted world — and every landmark you reach is a chapter of your story.**

The player plays *as* Pawan (decided: the user is the rider, in his signature black block-print tee). The fantasy is freedom of movement — soar on Charizard, dash through streets on Gengar, surf the sea on Greninja — in a world that feels drawn by hand. The emotional promise is calm wonder with a personal twist: this isn't a random fan game, it's *someone's* world, and you come away knowing who they are.

---

## Unique Hook

**"Like PaperWorld's open, hand-inked exploration, AND ALSO the whole map is a developer's portfolio you explore by riding three Pokémon that each own a terrain (sky, land, water)."**

- One sentence: the map is the portfolio, and you ride Pawan's Pokémon through it.
- Novel element: portfolio content is placed *in the world* as discoverable landmarks, not as pages.
- Tied to fantasy and gameplay: the three rides define where you can go; landmarks are where Pawan's story lives.
- PaperWorld is an internal feel/look reference only — never used in the public pitch (CD-PILLARS feedback: recruiters don't know it).

---

## Player Experience Analysis (MDA Framework)

### Target Aesthetics (What the player FEELS)

| Aesthetic | Priority | How We Deliver It |
| ---- | ---- | ---- |
| **Discovery** (exploration, secrets) | 1 | 40 landmarks across 6 regions, discovery counter, hidden collectibles on peaks and islands, project landmarks revealing Pawan's work |
| **Submission** (relaxation, comfort zone) | 2 | No fail states, no timers, forgiving movement, generative calm music, watercolour world |
| **Fantasy** (make-believe, role-playing) | 3 | You *are* Pawan riding your own Pokémon; three terrain-owning rides |
| **Sensation** (sensory pleasure) | 4 | Ink-and-watercolour paper look, wing-beat camera sway, boosts, splashes, chiptune/lo-fi music |
| **Narrative** (drama, story arc) | 5 | Short first-person lines at landmarks forming Pawan's career story (agency → products → projects) |
| **Expression** (self-expression, creativity) | 6 | Photo mode, time of day, ride choice |
| **Challenge** (obstacle course, mastery) | 7 | Optional: hard-to-reach collectibles, flight lines through arches — never required |
| **Fellowship** (social connection) | N/A | Single-player; sharing photos is the only social outlet |

### Key Dynamics (Emergent player behaviors)

- Players will **chase the horizon**: a landmark silhouette or region colour on the skyline pulls them toward it.
- Players will **switch rides at terrain edges** for fun — dive off a cliff on Charizard into the sea and land as Greninja.
- Players will **hunt the counter** ("12 / 40") once they notice it.
- Recruiters will **open one project card, then explore one more** — the world rewards a second click.
- Explorers will **take photos** at golden hour and share them.

### Core Mechanics (Systems we build)

1. **Three-ride traversal** — Charizard flight, Gengar ground running, Greninja water surfing, one state machine, automatic terrain-based switching with manual override.
2. **Streamed regional world** — seeded terrain with 6 blended regions, roads, water, instanced props, authored landmark stamps.
3. **Landmark discovery** — 40 landmarks with arrival detection, toasts, short first-person lines, project/experience cards and a saved counter.
4. **Living ambience** — wild Pokémon loops, weather and time of day, generative music, all within the performance budget.
5. **Portfolio bridge** — lazy-load from the portfolio page, project cards that link out, Classic View fallback, exit back to the site.

---

## Player Motivation Profile

### Primary Psychological Needs Served

| Need | How This Game Satisfies It | Strength |
| ---- | ---- | ---- |
| **Autonomy** (freedom, meaningful choice) | Go anywhere, any order, choose your ride; nothing is gated | Core |
| **Competence** (mastery, skill growth) | Flight feels better as you learn boost and banking; reaching tricky collectibles | Supporting |
| **Relatedness** (connection, belonging) | Getting to know Pawan through his own words and projects; recognising beloved Pokémon | Supporting |

### Player Type Appeal (Bartle Taxonomy)

- [x] **Explorers** (primary) — How: open world, horizon pull, 6 distinct regions, secrets on peaks and islands.
- [x] **Achievers** (secondary) — How: 40-landmark counter, collectibles, "Atlas complete" state.
- [ ] **Socializers** — Only via shared photos; not a design target.
- [ ] **Killers/Competitors** — Not served; no scores or leaderboards (anti-pillar b).

Quantic Foundry: strongest on **Discovery/Exploration** and **Fantasy/Being someone else**; low on Competition and Destruction. Successful games serving the same player: PaperWorld, A Short Hike, Alba: A Wildlife Adventure, Pokémon Legends: Arceus (exploration slice).

### Flow State Design

- **Onboarding curve**: spawn on Charizard already in the air with a project landmark in view (first-60-seconds rule); one on-screen hint per ride the first time it is used; no tutorial screens.
- **Difficulty scaling**: none required; optional collectibles demand tighter flight lines.
- **Feedback clarity**: discovery toast + counter tick + chime; ride-switch burst; minimap reveals visited areas.
- **Recovery from failure**: there is no failure. Water landings switch to Greninja; ground impacts become a hop; leaving the world edge gently turns you back.

---

## Core Loop

### Moment-to-Moment (30 seconds)
Steer a ride through the world: bank and boost on Charizard, dash and hop on Gengar, surf and wave-jump on Greninja. It is satisfying in itself through **momentum, camera sway, speed lines, ink-splash particles and audio swells**, and through the constant visual pull of the next landmark or region colour on the horizon.

### Short-Term (5–15 minutes)
**Spot → travel → discover → read a line → spot the next.** Each landmark gives a toast, a counter tick, and (for portfolio landmarks) a project/experience card with a link out. Crossing a coast or cliff naturally triggers a ride switch, so each cycle mixes all three traversal modes. "One more" lives in the next silhouette on the skyline.

### Session-Level (30–120 minutes)
A full session tours 2–4 regions and finds 10–20 landmarks. Natural stopping points: finishing a region's landmark set, or reaching a vista. The hook to return: remaining counter, unseen regions, time-of-day changes. A recruiter session is 1–3 minutes: spawn → project landmark → card → link → maybe one more.

### Long-Term Progression
No stats or levels (anti-pillar a). Progression is **knowledge and completion**: regions visited, landmarks discovered, collectibles found, Pawan's story assembled. Endpoint: "Atlas complete — 40 / 40", which unlocks a final landmark/message from Pawan.

### Retention Hooks
- **Curiosity**: unexplored regions, unseen landmarks, night-only sights.
- **Investment**: saved counter and minimap reveal (localStorage).
- **Social**: photo mode screenshots.
- **Mastery**: tricky collectibles and flight lines.

---

## Game Pillars

Ranked. When two pillars conflict, the higher rank wins: **1 > 2 > 3 > 4 > 5** (CD-PILLARS recommendation, adopted). Audience rule: *recruiters own the first minute; explorers own everything after.*

### Pillar 1: Instant & Light
The game is playable within seconds and runs smoothly on a mid-range phone.

*Design test (hard budgets, checked not argued)*: first input possible ≤ 10 s on 4G; first-playable download ≤ ~1.5 MB (JS + decoder + Charizard + rider); ≥ 30 fps on a reference mid-range phone sustained for 10 minutes; mobile Medium tier ≤ 150 draw calls, ≤ 300k visible triangles, DPR ≤ 1.5. Anything else streams after the first input. A feature that breaks a budget is cut or deferred.

### Pillar 2: Pawan, Unmistakably
The player *is* Pawan; his look, his words and his projects are the soul of the world.

*Design test*: after 60 seconds, can a recruiter name one Pawan-specific detail (a project, his outfit, a line he wrote)? If a landmark, line or asset could belong to any fan game, it loses to one that could only be Pawan's. "Voice" = short first-person written lines (≤ 2 lines at a glance) plus his signature outfit; not every landmark must carry story — some are pure delight.

### Pillar 3: Discovery Is the Interface
Portfolio content is found in the world, never forced — and always one tap away.

*Design test*: if a feature makes a visitor read before they can move, cut or defer it. **First-60-seconds rule**: the spawn point places a project landmark in view (placement, not forcing). Story text appears only at landmarks, after arrival, glanceable. A Classic View with all content always exists outside the game.

### Pillar 4: Effortless Flow
Moving is always smooth, forgiving and uninterrupted.

*Design test*: if a mechanic makes the player stop, wait or pick from a menu to keep moving, it loses. Ride switching happens automatically by terrain (sky / land / water) and never interrupts movement; a manual switch button exists for play, not necessity. No stamina, no hard stops.

### Pillar 5: A Living Pokémon World
Every region feels alive — wild Pokémon, weather, light, landmarks — within the budget of Pillar 1.

*Design test*: density beats scale — more life in the visible radius beats more props or area. "Alive" is cheap: ambient Pokémon are simple loops or billboards; weather is effects-only. No region ships half-alive. (Name keeps "Pokémon" by user decision; see IP risk.)

### Anti-Pillars (What This Game Is NOT)

- **NOT battles, catching, stats or RPG systems**: they compromise Effortless Flow and the solo scope.
- **NOT fail states, timers or score pressure**: they compromise relaxation and the recruiter's first minute.
- **NOT gating portfolio info behind gameplay**: a plain-HTML Classic View always exists; gating breaks Discovery and Instant & Light.
- **NOT realistic/high-fidelity graphics**: they break Instant & Light and the hand-inked look.
- **NOT multiplayer, accounts or backends** (beyond the portfolio's contact form): out of scope and against Instant & Light.
- **NOT long dialogue, cutscenes or tutorials**: they break Discovery and Instant & Light.
- **NOT shipping a half-alive region**: an empty region breaks A Living Pokémon World and reads as unfinished.

---

## Visual Identity Anchor

**Direction: "Paper Atlas" — the user's own direction: the whole game looks like PaperWorld.**

AD-CONCEPT-VISUAL returned STRONG for three directions (Toybox Atlas, Block-Print Atlas, Pocket Cartridge World). The user chose instead to match **PaperWorld's ink-and-watercolour folded-paper look**. We copy the *look*, never the code: PaperWorld has no license, so every shader, texture and system is written fresh.

**One-line visual rule**: *"The whole world is an ink-and-watercolour paper diorama — toon-shaded, ink-outlined, paper-grained — and every Pokémon and person is drawn in the same ink."*

**Supporting principles**
1. **One ink for everything.** Toon ramp lighting + ink outlines on terrain features, props, the rider and the Pokémon. *Design test*: if a GLB model looks glossy or "3D-rendered" next to the paper world, it gets the toon/ink treatment or a texture grade until it doesn't.
2. **Paper is the canvas.** Paper grain, watercolour wobble and a torn-paper frame as cheap screen overlays. *Design test*: any paper effect that breaks Pillar 1 budgets drops to a static overlay on the Low tier; outlines on Low are limited to rider and mounts (TD-FEASIBILITY).
3. **Regions are watercolour washes.** Each region owns one wash so the player knows where they are from colour alone. *Design test*: a screenshot of any region must be identifiable by hue at thumbnail size.
4. *(Proposed accent, from AD direction B — confirm in /art-bible)*: **Pawan's content is block-printed.** His landmarks, UI frames and discovery markers carry his tee's Indian block-print motifs (sun-and-bow, elephants, temple-and-trees) — ink on paper, so it fits the Paper Atlas look.

**Colour philosophy**: warm cream paper base (~`#F4EEDC`) and near-black ink (~`#1F1D2B`). Region washes: Pallet Meadows sap green, Ember Peaks vermilion, Frost Highlands cerulean, Haunted Hollow violet ink, Azure Coast/Ocean teal, Neon City magenta-on-indigo night paper. Pawan's accent trio (terracotta `#B5503C`, forest green `#2E7D5B`, mustard gold `#E2B93B`) is reserved for his content, so it doubles as wayfinding. Final values set in `/art-bible`.

---

## Inspiration and References

| Reference | What We Take From It | What We Do Differently | Why It Matters |
| ---- | ---- | ---- | ---- |
| PaperWorld (aadil6971) | The look (ink, watercolour, paper grain), chunked world, landmarks, vehicle switching, mobile controls, quality tiers | Pokémon rides instead of vehicles; regions; portfolio landmarks; original code only | Proves this world style and scale run in a browser |
| Bruno Simon's 3D portfolio | Portfolio-as-playable-world | Open world with flight and water; story via landmarks | Validates that recruiters engage with a playable portfolio |
| Pokémon Legends: Arceus | Ride Pokémon that each own a terrain | Relaxed, no catching or battles | Validates the three-ride fantasy |
| A Short Hike | Calm exploration, small-but-dense world, gentle flight | Larger regions, portfolio content | Validates "density over scale" and no-fail exploration |

**Non-game inspirations**: Indian block-print textiles (Pawan's tee), watercolour travel journals, pop-up books, Studio Ghibli skies.

---

## Target Player Profile

| Attribute | Detail |
| ---- | ---- |
| **Age range** | 20–40 |
| **Gaming experience** | Casual to mid-core (recruiters often non-gamers) |
| **Time availability** | Recruiters: 60 seconds–3 minutes; fans: 15–45 minute sessions |
| **Platform preference** | Laptop browser (recruiters), phone browser (shared links) |
| **Current games they play** | Pokémon titles, cozy exploration games, browser games |
| **What they're looking for** | Recruiters: a memorable signal of skill and personality. Fans: a calm, beautiful world to roam |
| **What would turn them away** | Slow loading, confusing controls, being forced through text or tutorials, poor phone performance |

---

## Technical Considerations

| Consideration | Assessment |
| ---- | ---- |
| **Recommended Engine** | **Three.js + TypeScript (Vite)** — user preference, confirmed by TD-FEASIBILITY (smallest footprint, fits web skills, lazy-loads in a page). Not one of the studio's pinned engines: engine-reference docs and engine-specific agents don't apply; Three.js API/version claims must be verified against the installed package (NOT SOURCEABLE from the repo) |
| **Key Technical Challenges** | Chunk streaming + water + instancing at 30 fps on phones; procedural bone animation (no fly/surf clips); Charizard wing bones unconfirmed (`LFeeler/RFeeler` chains — 1-day spike); iOS Safari GPU memory and context loss; terrain/landmark stamping; GC stutter; thermal throttling |
| **Art Style** | 3D stylised — ink-and-watercolour paper look (toon ramp + ink outlines + paper overlays) |
| **Art Pipeline Complexity** | Medium–High: Pokémon GLBs exist (rigged, Draco + WebP); world art is procedural/code-built; **Pawan's 3D character must be created** (HIGH skill risk) |
| **Audio Needs** | Moderate: generative or royalty-free calm music per region, ride SFX, discovery chimes |
| **Networking** | None (static hosting; portfolio contact form only) |
| **Content Volume** | 6 regions, 40 landmarks, 3 rides, ~10 ambient Pokémon species, 3 project cards + experience/skills landmarks |
| **Procedural Systems** | Seeded terrain, region blending, roads, prop scatter; landmarks authored at fixed coordinates with terrain stamps |

Existing assets: `assets/models/pokemon/` — charizard.glb (4.4k verts, 1 clip), gengar.glb (2.6k, no clips), greninja.glb (4k, ~70 clips, 7 MB → prune), pikachu.glb (2.9k, 1 clip). Source: Pokemon-3D-api/assets.

---

## Risks and Open Questions

### Design Risks
- Exploration may not hold explorers past ~20 minutes without stronger story beats (mitigation: landmark lines form a career arc; Atlas-complete reward).
- Recruiters may wander and never see a project (mitigation: first-60-seconds spawn rule; Classic View).
- Auto ride switching could feel like a loss of control (mitigation: manual override; tune in prototype).

### Technical Risks
- **Charizard wing bones** may not deform the wings → flight (the star feature) would need reweighting in Blender. *Gate condition: 1-day spike before M1.* (TD-FEASIBILITY)
- Mobile performance and iOS Safari memory/context loss (MEDIUM-HIGH); must be tested on real devices from M1.
- PaperWorld-style ink outlines double vertex/draw cost of outlined meshes — Low tier limits outlines to rider and mounts.
- Studio QA tooling assumes Godot/Unity/Unreal; web needs Vitest + Playwright + a real-device checklist (testing ADR).

### Market Risks
- **IP**: official Pokémon names and models on a public portfolio carry takedown risk, and could be judged by a recruiter's company. *User decision: commit to official Pokémon.* Mitigations kept: CREDITS.md, fan-project footer, swappable model path.

### Scope Risks
- **User override — v1 includes all 6 regions and 40 landmarks.** TD-FEASIBILITY recommended v1 = 2 regions / ~12 landmarks (HIGH scope risk for 40 authored landmarks + region blending). Logged as accepted risk.
- **User override — kept the original MVP plan (all three rides together, 8–12 weeks).** PR-SCOPE (OPTIMISTIC) estimated ~17.5 FTE weeks (range 11–24) and warned the most likely cut point is between rides, leaving a half-working build. Logged as accepted risk; re-estimate after the first milestone using real pace.
- Pawan's 3D character is a skill gap (modelling, hair, UV painting, rigging); use a stand-in until M3 and pick a route (self-built/auto-rig/commission) by M2.
- The pixel-art portfolio shell is additional scope beside the game.

### Open Questions
- Do `LFeeler`/`RFeeler` bones drive Charizard's wings? → 1-day spike (`/prototype`).
- Finite world vs endless streaming? → ADR before M2 (TD recommends finite).
- How is Pawan's 3D character produced? → decide by M2.
- Portfolio content still missing: the "500+ users" product, Dhyan Vandana details, skills list, contact links, Bennet AI / Third Eye repo links.

---

## MVP Definition

**Core hypothesis**: *Riding three terrain-owning Pokémon through a hand-inked world toward landmarks is fun on its own — and a visitor finds a Pawan project within 60 seconds — while holding 30 fps on a mid-range phone.*

**Required for MVP** (user kept original plan):
1. Charizard flight, Gengar running, Greninja surfing, with automatic + manual ride switching.
2. One continuous world with 2 regions (Pallet Meadows + Azure Coast/Ocean) in the Paper Atlas look.
3. 8 landmarks including the 3 project landmarks (ScanlyFix, Bennet AI, Third Eye), discovery toasts and counter.
4. Placeholder Pawan rider (stylised stand-in).
5. Desktop and mobile controls, lazy-loaded inside a minimal portfolio page, meeting Pillar 1 budgets.

**Explicitly NOT in MVP** (defer):
- Regions 3–6, landmarks 9–40, ambient Pokémon, weather/time of day, photo mode, minimap, music beyond a placeholder loop, detailed Pawan character, full pixel portfolio shell.

### Scope Tiers (if budget/time shrinks)

| Tier | Content | Features | Timeline (full-time) |
| ---- | ---- | ---- | ---- |
| **MVP** | 2 regions, 8 landmarks | 3 rides + switching, discovery, mobile | 8–12 weeks (user); producer estimate 11–24 weeks |
| **Vertical Slice** | 1 region at final quality | Full Paper Atlas look, music, minimap, quality tiers, real Pawan character started | +6–8 weeks |
| **Alpha** | All 6 regions, 40 landmarks (placeholder art) | All features rough: ambience, weather/time, photo mode, pixel portfolio shell | months 6–12 |
| **Full Vision (v1)** | 6 regions, 40 landmarks, polished | Everything polished, Atlas-complete reward, secrets | 12–24 months total |

---

## Director Gate Results

| Gate | Verdict | Resolution |
| ---- | ---- | ---- |
| CD-PILLARS | CONCERNS | Applied: falsifiable tests for Pillars 1 & 4, numeric budgets, priority order, first-60-seconds rule, recruiter-facing hook, anti-pillars f & g, player = Pawan. IP: user committed to Pokémon (logged risk) |
| AD-CONCEPT-VISUAL | STRONG | User chose own direction "Paper Atlas" (PaperWorld look) over the three offered; block-print accent proposed for /art-bible |
| TD-FEASIBILITY | CONCERNS | Conditions: Charizard wing spike before M1; real-device test in M1; ADRs before M2 (ride state machine/camera, world model, web testing, asset pipeline); Pawan stand-in until M3. v1 scope cut **declined by user** |
| PR-SCOPE | OPTIMISTIC | Adjustments (ride-by-ride MVP split, re-baseline, portfolio first) **declined by user**; 40+ h/week confirmed |

## Decision Log (autonomous mode)

| Decision | Chosen | Alternatives | By |
| ---- | ---- | ---- | ---- |
| Concept | Trainer's Atlas (free-roam) | Rider's Route, The Living Résumé | User |
| Experience goal | Story + discovery in relaxation flow | Challenge, Expression | User |
| Player identity | Play as Pawan | Visitor meeting Pawan | User (earlier) |
| IP | Official Pokémon assets | License-independent pillars; original creatures | User (earlier) |
| Engine | Three.js + TypeScript | Godot web export, Babylon.js | User |
| Pillars | Locked as revised, ranked 1–5 | Unranked original draft | Autonomous, per CD feedback |
| Visual anchor | Paper Atlas (PaperWorld look) | Toybox, Block-Print, Pocket Cartridge | User |
| Hours | 40+ per week | — | User |
| Schedule | Original single MVP | Producer's 1A/1B/1C split | User |
| v1 world | 6 regions, 40 landmarks | 2 regions, ~12 landmarks | User |

---

## Next Steps

- [ ] `/setup-engine` — configure web / Three.js manually (not a studio preset)
- [ ] `/prototype charizard-flight` — 1-day wing-bone spike, then the flight feel (TD gate condition)
- [ ] `/art-bible` — formalise the Paper Atlas look and block-print accent
- [ ] `/design-review design/gdd/game-concept.md`
- [ ] `/map-systems` → `/design-system` per system
- [ ] `/create-architecture` → ADRs (ride state machine/camera, world model, web testing, asset pipeline)
- [ ] `/architecture-review` → `/gate-check`
