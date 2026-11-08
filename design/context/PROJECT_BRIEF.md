# Pokémon-Style Portfolio — Project Brief

> Purpose: this file is the single source of truth for the AI agent building the site.
> Items marked **[TODO]** are things Pawan still has to provide or decide. Items marked **[ASSUMPTION]** are my defaults — change them if wrong.

---

## 1. One-line pitch

A retro Pokémon-style (Gen 1–3, Red/FireRed feel) portfolio website where the visitor meets a 2D pixel version of Pawan standing next to his Greninja, chooses from a Pokémon-style menu, and explores his experience, projects (as a "Pokémon team"), skills (as a journey map), a playable 3D game, and a contact option — on **desktop and mobile**.

## 2. Goals & audience

- **Primary audience:** recruiters, hiring managers, freelance clients. They have ~60 seconds.
- **Goal:** memorable first impression + clear proof of skill (full-stack web developer who ships real products).
- **Non-negotiable:** a visitor who does NOT want to play must still get all the information fast.
  - Add a visible **"Skip intro / Classic View"** button that shows a plain, fast, SEO-friendly résumé-style page with the same content.
  - All real content (text, links) must exist as real HTML so it is readable by search engines and screen readers — not only drawn on a canvas.

## 3. Visual & audio direction

- Pixel-art style, Game Boy Advance / FireRed palette. Pixel font (e.g. "Press Start 2P" or similar free font). Crisp pixels (`image-rendering: pixelated`), no blurry scaling.
- UI built like Pokémon menus: white/cream text boxes with a dark border, a `▶` selection cursor, typewriter text effect, "A / B" button feel.
- Sound: chiptune background music + menu blip / select sounds. **Audio must start only after the first click/tap** (browsers block autoplay) — so the "Press Start" screen doubles as the audio unlock. Always provide a mute toggle. Default: music on after Start, low volume.
- Respect `prefers-reduced-motion` (shorter/no animations).

## 4. User flow

```
Loading screen → "Press Start" → Home scene → Menu → (Section) → Back to menu
                                  ↘ "Skip / Classic View" available at all times
```

### 4.1 Loading screen
- Shown while assets load. Pokéball-style loading animation with a **real progress bar** tied to actual asset loading (not a fake timer).
- Text like "Loading…" / "A wild portfolio appeared!".
- When loaded → "PRESS START" (tap/click/Enter). This unlocks audio.

### 4.2 Home scene
- Pawan's **2D pixel avatar** standing beside **Greninja** (idle animation: breathing, Greninja slight sway, eyes blink).
- Background: simple route / town scene. Works in desktop (landscape) and mobile (portrait) layouts — the scene recomposes, not just shrinks.
- A dialog box: "PAWAN wants to show you his work!" then the menu opens.

### 4.3 Main menu (5 options)
Styled like the Pokémon pause/battle menu. Mapping to Pokémon concepts so it feels native:

| Menu label | Pokémon concept | Content |
|---|---|---|
| **JOURNEY** | Trainer Card | Work experience + achievements |
| **TEAM** | Pokémon Party | Projects, each shown as a Pokémon |
| **SKILLS** | Route / Region map | Skills as a walkable journey map |
| **GAMES** | Game Corner | Playable 3D world game |
| **CONTACT** | Poké Gear / Mail | Contact options |

Controls: keyboard (arrows/WASD + Enter/Space + Esc/Backspace for back) and touch (tap, big tap targets ≥ 44px, on-screen Back button). Mouse hover also highlights options.

## 5. Section specs

### 5.1 JOURNEY (Trainer Card)
- Shown as a Pokémon Trainer Card: avatar, name, "Class: Full-Stack Developer", ID number, badges.
- Timeline of experience, presented as chapters/dialog boxes:
  1. **Dhyan Vandana Agency** — Web Developer / Full-Stack Developer, ~1 year, 2025–2026. **[TODO: exact role title, start/end month, 3–5 real bullet points of what you built, tech used, any numbers]**
  2. **Built & sold [product name] to 500+ users** — **[TODO: what is this exactly? e.g. "built a SaaS/benefits product and sold it to 500+ users" — I need the product name, what it does, what "sell benefits" means, your role, and the real number]**
  3. Any education / certifications / hackathons **[TODO optional]**
- Badges = key achievements (e.g. "500+ users" badge).

### 5.2 TEAM (Projects as Pokémon)
Flow: Team screen shows the party (3 slots to start, expandable). Each member = a Pokémon sprite + a project icon/pop-up.

**Interaction (important animation):**
1. User sees the party grid. Each Pokémon has the project's logo/icon floating beside it.
2. User taps a project → smooth animation: the Pokémon moves/slides in, and a large **info card** opens (Pokémon summary-screen style) with the Pokémon pinned in the **top-right corner**.
3. Card content: project name, one-paragraph description, **architecture** (simple diagram or bullet list), tech stack as "type" chips, key features as "moves", live **link button**, GitHub link if public.
4. Back button returns to party.

Projects:

| # | Pokémon | Project | Link | Notes |
|---|---|---|---|---|
| 1 | **Greninja** | **ScanlyFix** — free web scanner: 114 checks across security, SEO, AI-answer visibility, performance, accessibility, compliance; fix prompts, Auto-Fix PRs, pentest agents, CLI/API/MCP (Next.js) | https://scanlyfix.com/ | "Best project". Needs your architecture notes + your role. |
| 2 | **Charizard** | **Bennet AI** — no-code AI support chatbot trained on your docs, one-line embed, admin-controlled answers, integrations | https://bennet-ai.vercel.app/ | Needs architecture notes + GitHub link. |
| 3 | **[TODO: pick Pokémon]** | **Third Eye** ("Safety Reimagined") — **[TODO: the live page shows only a tagline. What does it do? Is Health Vault the same project or a different one?]** | https://third-eye-main.vercel.app/ | Needs description + architecture. |

> Name fix: earlier voice notes said "Stanleyfish" / "Banner.ai" — these are **ScanlyFix** and **Bennet AI**.

For each project I need (**[TODO] for each**): problem it solves, your role, tech stack, 3–5 key features, architecture description, screenshots/GIF (optional), live link, repo link, one measurable outcome if any.

### 5.3 SKILLS (Journey map)
- A game-like **route map**: Pawan's avatar walks along a path between towns; each town is a skill group, e.g.:
  - *Frontend Town* — HTML, CSS, JavaScript, TypeScript, React, Next.js, Tailwind…
  - *Backend City* — Node.js, Express, REST/GraphQL, auth…
  - *Database Cave* — MongoDB / PostgreSQL / etc.
  - *Web3 Lab* — Solidity / blockchain (from Health Vault)
  - *DevOps Harbor* — Git, deployment, CI/CD…
  - *AI Tower* — LLM/AI APIs (from Banner.ai) **[confirm]**
- **[TODO: give me your real list of skills, grouped, and be honest — rate each as Learning / Comfortable / Strong]**
- Desktop: avatar walks with arrow keys *or* auto-walks as user scrolls/clicks next town. Mobile: tap "Next Town" or swipe; optional on-screen D-pad. Reaching a town opens a small dialog listing its skills as "moves".
- Fallback: also expose a plain list for classic view/accessibility.

### 5.4 GAMES (Game Corner) — see full spec in §6
- Screen shows the game card(s) with a **PLAY** button. Launches the 3D world game. Designed so more games can be added later.

### 5.5 CONTACT
- Options: Email (mailto), LinkedIn, GitHub, resume PDF download, and optionally a small contact form (name/email/message) that really sends (e.g. via a form service or serverless function).
- Pokémon flavor: "Send a message" = Mail on a Poké Gear screen; success message "Message sent! It's super effective!".
- **[TODO: email, LinkedIn, GitHub, resume PDF, preferred contact method]**
- If a form is used: spam protection (honeypot / simple rate limit) and no email address exposed in raw client code if you want to avoid scrapers.

## 6. The Game (3D "Pokémon World")

> **The full, current game design is in [GAME_SPEC.md](GAME_SPEC.md). That file overrides the summary below.**
> Rides: **Charizard = flying**, **Gengar = running on land/streets**, **Greninja = swimming on water**. Multiple Pokémon regions (grass, fire, ice, ghost, ocean, city).

**Reference:** Paper World — https://github.com/aadil6971/PaperWorld (cloned in `./PaperWorld`). Studied for mechanics only.
⚠ **License:** the repo has **no LICENSE file**, so its code must NOT be copied. We rebuild from scratch with our own code and a different (Pokémon, not paper/ink) art style.

### Core concept
Player rides Pokémon around a stylized Pokémon-themed world with ~**40 locations** (landmarks/towns/cities, each with a name popup and maybe a short fun fact or a link to Pawan's content). Instead of a paper plane, the player is **Pawan's avatar riding a Pokémon**.

### Pokémon forms ("vehicles")
Player can switch form at any time (key press on desktop, on-screen button on mobile) — like the vehicle switch in the reference game:

| Form | Movement | Where it's used |
|---|---|---|
| **Charizard** (default) | Flying over the whole world | Sky/air |
| **Greninja – land** | Runs/jumps on streets and ground | Roads, towns |
| **Greninja – water** | Swims on the surface of water | Oceans, lakes, rivers |
| **Gengar** | Flies/floats (ghost-style hover, maybe passes through objects / night mode) | Anywhere, special effect |

**[ASSUMPTION]** Greninja auto-switches between land and swim animations depending on whether the ground below is water. **[TODO: confirm — I heard "Greninja flows on the street" and "swims on the water"; I'm reading it as run on land + swim on water.]**

### Required features
- Free exploration (no score needed), ~40 discoverable locations with a mini-map / progress counter "12 / 40 discovered".
- Smooth form-switch animation (poof/pokéball effect).
- Camera follows rider; speed boost; basic collision/altitude limits.
- Desktop controls: WASD/arrows + mouse look, Space = boost, Q/E or number keys = switch form.
- Mobile controls: virtual joystick + action buttons (switch form, boost). Landscape recommended; show a "rotate your phone" hint.
- Pause/Exit button always visible → back to Game Corner.
- **Performance:** game code and models are **lazy-loaded** only when the user presses PLAY, so the portfolio loads fast. Target 60 fps desktop, ≥30 fps on mid-range phones; low-quality mode toggle.
- Loading bar for game assets.

### Asset note (biggest risk)
Need 3D models (or 2.5D sprites) of Charizard, Greninja, Gengar with animations (fly / run / swim / idle). See §8 for legality.
**Fallback if no good models:** stylized low-poly versions, or 2D billboard sprites inside the 3D world (many Pokémon fan games do this), which is far lighter on mobile.

## 7. Responsive & mobile requirements

- Design **mobile-first AND desktop-first**: both are first-class. Test widths 360, 390, 768, 1024, 1440+.
- Pixel scene scales by integer factors where possible (no blur).
- Portrait mobile: Home scene stacks avatar + Greninja nicely; menu is vertical with large buttons.
- Handle safe areas (notches), disable page bounce/zoom during gameplay, avoid 100vh bugs (use `dvh`).
- Touch + keyboard + mouse all supported everywhere.

## 8. Assets, IP & legal (read this)

- Pokémon names/sprites/music are **Nintendo / Game Freak / The Pokémon Company** property. A **non-commercial personal portfolio** that clearly says "fan project" is common and usually tolerated, but it is not officially permitted. Risks: takedown, and looking unprofessional to a company if it looks like you're passing off their IP.
- Mitigations the agent should apply:
  - Footer disclaimer: "Fan-made, non-commercial. Pokémon © Nintendo / Creatures Inc. / GAME FREAK inc. Not affiliated."
  - No ads, no selling, no paywall on the site.
  - Prefer **original or re-drawn pixel art** (avatar is fully original); for Pokémon use clearly credited sources and keep a `CREDITS.md`.
  - Do **not** rip copyrighted music; use royalty-free chiptune (CC0 / properly licensed) instead.
  - For every third-party model/sprite/sound, record: source URL, author, license.
- Alternative if you want zero IP risk: use "Pokémon-inspired" original creatures. (Your call — see §10.)

## 9. Recommended tech stack  **[ASSUMPTION]**

- **Vite + React + TypeScript** for app shell, menus, routing between sections, state.
- **Pixel scenes (home, journey, skills map):** Canvas/CSS sprite animation, or **Phaser 3** if the skills map needs real tile-based walking. Start with CSS/Canvas; move to Phaser only if needed.
- **Animation:** Framer Motion (or GSAP) for card transitions and the Greninja slide animation.
- **Game:** **Three.js** (optionally via react-three-fiber), loaded lazily (dynamic import).
- **Audio:** Howler.js.
- **Styling:** Tailwind or plain CSS modules, pixel font via self-hosted file.
- **Contact form:** serverless endpoint (Vercel function / Formspree / EmailJS).
- **Hosting:** Vercel or Netlify. Custom domain optional.
- **Quality:** Lighthouse check on classic view; basic accessibility (focus states, aria labels, keyboard).
- Keep all content in one data file (`content.ts` / JSON) so editing text never requires touching UI code.

## 10. Open questions — please answer

1. **Project name:** is the best project **Selfix.com** or **Stanleyfish.com** (or are they different)? URL?
2. **"Built and sold to 500+ users"** — what is that product, and what does "sell benefits" mean?
3. **Third project Pokémon:** Health Vault needs a Pokémon. Suggestions: **Blastoise** (water-cannon = sturdy/secure), **Alakazam** (data/brain), **Snorlax** (vault/storage energy). Which one?
4. **Greninja in the game:** run on land + swim on water — correct?
5. **Gengar:** what should be special about it (fly, pass through objects, night mode)?
6. **Avatar:** do you have a photo/drawing to base the pixel avatar on (hair, glasses, clothes, colors)? Or should the agent draw one from a description?
7. **IP choice:** real Pokémon (fan-project disclaimer) or Pokémon-inspired originals?
8. **Domain / hosting** already decided?
9. **Languages:** English only? (You speak Hindi too — optional EN/HI toggle later.)
10. Do you want your **resume PDF** and **profile photo** in Classic View?

## 11. References to gather (what to give the agent)

1. **Screenshots of Pokémon Red/FireRed/Emerald** you want to copy the feel of: title screen, battle menu (FIGHT/BAG/POKÉMON/RUN), party screen, Trainer Card, summary screen, Game Corner. (5–10 images is plenty.)
2. **GitHub link** of the paper-plane Three.js game (+ check its license).
3. **Banner.ai** GitHub link and **Stanleyfish/Selfix** URL; Health Vault repo or demo.
4. **Your avatar reference** (photo or sketch) + preferred colors.
5. **Your real content**: bio, experience bullets, skills list, project descriptions, resume PDF.
6. **1–3 portfolio sites you love** (any style) and 1–2 Pokémon fan sites/games you like, so the agent can match polish level.
7. **Music/sound preferences** (calm Route theme? energetic?) — or "agent picks royalty-free".
8. Any **do-nots** (colors, things you dislike).

## 12. Build phases (suggested order)

1. **Foundation:** project setup, content file, routing, pixel font, global pixel UI components (dialog box, menu with cursor, button), classic-view page.
2. **Loading + Start + Home scene** with avatar and Greninja, audio unlock, responsive layouts.
3. **Main menu + navigation** (keyboard + touch).
4. **JOURNEY** (Trainer Card + timeline).
5. **TEAM** (party grid, project card animation, 3 projects).
6. **SKILLS** (map with walking avatar).
7. **CONTACT** (links + working form).
8. **GAMES hub + 3D game MVP** (Charizard flying, 10 locations) → then Greninja land/water → Gengar → all 40 locations → mobile controls → performance pass.
9. **Polish:** sounds, transitions, reduced-motion, accessibility, SEO/meta/OG image, Lighthouse, cross-device testing.
10. **Deploy** + credits/disclaimer.

Each phase should end with something runnable and checked on both a desktop and a phone-sized viewport before moving on.

## 13. Definition of done

- Works smoothly on latest Chrome, Safari (iOS), Firefox; phones and desktop.
- First load (before pressing Start) is light; game assets only load on PLAY.
- Every section reachable by keyboard and touch; Classic View contains all content.
- No broken links; all placeholders (**[TODO]**) replaced with real content.
- Credits + fan-project disclaimer present.
