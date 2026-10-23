# Changelog

## 1.1.0

### Changed

- Champions renamed: **Vesper → Ronin**, **Lyra → Phoenix** (titles, stats and weapons unchanged).
- Champion picker shows all four heroes side by side on desktop and on landscape phones; menus use
  their intended larger text and spacing on bigger screens (responsive styles were never being applied).
- The "skip" hint in Malakor's intro moved to the top-left, clear of the on-screen buttons.

### Fixed

- Starting a new run (R, or Main Hub → Deploy) during the portal warp skipped stage 1, and could crash.
- The aiming crosshair was drawn over stage title cards, the warp tunnel, the boss intro and the end screen.
- Malakor's body stayed on screen after his defeat; he now flickers, shrinks and dissolves.
- Big score labels (e.g. "+1200 ABYSS SLAIN") could run off the screen or sit behind the HUD.
- Boss health-bar phase markers cut through the label, which also became unreadable over the damage trail.
- Particles and other effects kept moving while the game was paused.
- Line style set by projectiles leaked into later drawing (the hero's outline changed while firing).

### Performance

- Gameplay frames are about 2× cheaper and the title screen about 3× cheaper (see
  docs/ARCHITECTURE.md → Rendering performance). With the CPU throttled 4×: title 7.5 → 23 FPS,
  stage 5 8 → 20 FPS, boss fight 8 → 19 FPS.
- Hero portraits in menus are only drawn while those menus are visible.
- Camera shake no longer leaves sub-pixel offsets that forced every layer to be resampled.

## 1.0.0

- Production restructure: Vite build, ES modules, self-hosted fonts, generated service worker,
  ESLint/Prettier, Playwright smoke tests, Netlify / GitHub Pages / Cloudflare Pages deployment.
