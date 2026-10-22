# Haunted Bridges

A roguelite arcane-survival game for the browser. Pick one of four champions, collect every coin on six cursed bridges to open each gate, and defeat **Malakor, Lord of the Abyss**. Plays with keyboard + mouse or twin touch sticks, and installs as an offline-capable app (PWA).

- Vanilla JavaScript (ES modules) and Canvas 2D — no framework, no runtime dependencies
- Built with [Vite](https://vitejs.dev); fonts are self-hosted, so it works fully offline
- Fixed 120 Hz physics with interpolated rendering, adaptive graphics quality on slow devices

## Quick start

Requires Node.js 18+ (20 recommended).

```bash
npm install
npm run dev        # http://localhost:5173 with hot reload
```

```bash
npm run build      # production build → dist/
npm run preview    # serve dist/ locally to try it (service worker included)
```

## Scripts

| Command                           | What it does                                                            |
| --------------------------------- | ----------------------------------------------------------------------- |
| `npm run dev`                     | Development server with hot reload (service worker disabled)            |
| `npm run build`                   | Production build into `dist/`, including the generated service worker   |
| `npm run preview`                 | Serves `dist/` locally                                                  |
| `npm run lint` / `lint:fix`       | ESLint                                                                  |
| `npm run format` / `format:check` | Prettier                                                                |
| `npm test`                        | Playwright smoke tests (desktop + phone landscape) against a test build |
| `npm run check`                   | Lint + format check + build — run before committing                     |

First-time test setup: `npx playwright install chromium`.

## Project structure

```
index.html                Markup for the menus/HUD shell (no inline scripts or handlers)
public/                   Copied as-is: web manifest, icons, response headers
src/
  main.js                 Entry point — loads styles and fonts, boots subsystems, starts the loop
  config/                 Game data: heroes, stages, stage layouts, difficulty, dialogue
  core/                   Engine: state, constants, canvas, main loop, interpolation, quality, settings, storage
  game/                   Simulation
    update.js             One physics tick, calling the systems in order
    systems/              Player movement, shooting, enemies, hazards, pickups
    boss.js               Malakor's intro, phases and attacks
    stage-loader.js       Builds a stage from config/stage-layouts.js
    spawn.js              Factories for the player, enemies, bullets and loot
    flow.js · player.js · combat.js · scoring.js · effects.js · camera.js · collision.js · cheats.js
  render/                 Drawing: world, hero, enemies, boss, projectiles, lighting, HUD, overlays, title
  ui/                     HTML menus: hub, settings, end screen, layout fitting, button actions, toast
  input/                  Keyboard, mouse and virtual joysticks
  audio/                  WebAudio synth (sound effects + music)
  pwa/                    Service-worker template, registration, install prompt
  styles/                 CSS split by area
  debug/test-hooks.js     Only included in `--mode test` builds (used by the Playwright tests)
tests/                    Playwright smoke tests
docs/ARCHITECTURE.md      How the pieces fit together, and how to add content
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the main loop, state model and how-tos (new stage, enemy, hero).

## Deployment

`npm run build` produces a static site in `dist/`. Host it anywhere that serves static files over **HTTPS** (required for installing and offline play). All URLs are relative, so it also works from a sub-path.

**Netlify** — connect the repository; `netlify.toml` sets the build command (`npm ci && npm run build`) and publish folder (`dist`). Or drag `dist/` onto app.netlify.com/drop.

**GitHub Pages** — push to `main` with `.github/workflows/deploy-pages.yml` in place, then set _Settings → Pages → Source_ to **GitHub Actions**.

**Cloudflare Pages** — build command `npm run build`, output directory `dist`.

**Any other static host** (S3/CloudFront, Vercel, nginx…) — upload `dist/`. Recommended response headers are in `public/_headers` (Netlify and Cloudflare apply them automatically). The important ones:

- `sw.js`, `index.html`, `manifest.webmanifest`: `Cache-Control: no-cache` so updates reach players
- `assets/*`: `Cache-Control: public, max-age=31536000, immutable` (file names are content-hashed)
- The `Content-Security-Policy` in that file is tested against the build

### Updates and offline play

The build generates `dist/sw.js` with the exact list of built files and a content hash in its cache name. Every deploy therefore gets a fresh cache automatically; there's nothing to bump by hand. Pages load network-first (so new releases appear) and fall back to the cache offline.

## Gameplay reference

| Action       | Keyboard / mouse        | Touch       |
| ------------ | ----------------------- | ----------- |
| Move         | WASD / arrow keys       | Left stick  |
| Aim and fire | Mouse + click, or Space | Right stick |
| Phase dash   | Shift, E or right-click | ⚡ button   |
| Pause        | P / Esc                 | ⏸ button    |
| Restart run  | R                       | Pause menu  |
| Mute         | M                       | Pause menu  |

Difficulty (Easy / Normal / Nightmare) changes lives, enemy speed and health, coin-magnet range and the score multiplier — see `src/config/difficulty.js`.

**Stage-warp cheat** (for testing): type `warp`, then press `1`–`6` or `[` / `]`. On touch devices, tap the BEST RUN number five times to reveal stage buttons. Warped runs never overwrite the best score.

## Browser support

Current Chrome, Edge, Firefox and Safari (desktop and mobile). The game targets ES2020 and Canvas 2D; the menu fitting uses `dvh` units with a `vh` fallback.

## License

No license has been chosen yet. Add a `LICENSE` file before publishing the source.
