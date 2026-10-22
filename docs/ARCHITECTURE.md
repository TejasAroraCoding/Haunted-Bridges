# Architecture

## The frame

`core/loop.js` runs once per display frame:

1. **Cosmetic animation** — `render/animate.js#updateVisuals(dt)` advances particles, death animations, the gate sequence, title-screen sky, etc. This runs every frame (even when paused) and never affects gameplay.
2. **Physics** — while in play, as many fixed **120 Hz** steps as the elapsed time needs (`game/update.js#stepGame`). A fixed step keeps the game identical at 30, 60 or 144 FPS.
3. **Draw** — `core/interpolation.js` temporarily places moving objects between their last two physics positions (smooth motion on any refresh rate), then `render/world.js#drawWorld` (with camera shake) and `render/hud.js#drawHud` draw, and positions are restored.

`core/quality.js` watches the frame rate in AUTO graphics mode and steps quality down (lower resolution, then no lighting) when it stays below 48 FPS.

## One physics tick

`game/update.js` reads top to bottom:

```
interruptions (hit-stop, death animation, warp, stage card, boss intro) → stop here while running
player timers → movement → blood mist → shooting → player bullets
enemies → boss → lasers → bombs → enemy bullets → wall cannons → spike traps
hearts → power-ups → coins (magnet, gate unlock) → portal
```

Each step lives in `game/systems/` or `game/boss.js`.

## State

- **`core/state.js`** holds everything that changes at runtime _and_ is shared between modules, grouped and commented by area (app, run, stage, sequences, gate, effects, HUD). ES module bindings can't be reassigned by importers, so shared mutable values live on this one object.
- State used by a single module stays private to it (e.g. the music sequencer in `audio/audio.js`, camera spring in `game/camera.js`).
- **`config/`** is static data. **`core/constants.js`** holds fixed sizes and timings.
- Everything draws in a **960×540** logical playfield; `core/canvas.js` scales the backing store to the screen.

## Layers and dependencies

```
config/  core/          ← no game knowledge (core/settings reads config/difficulty)
   ↑        ↑
 game/  ←→  render/     ← simulation and drawing; render reads state, game spawns effects
   ↑          ↑
  ui/  input/  audio/  pwa/
   ↑
 main.js                ← wires everything together and starts the loop
```

`ui/actions.js` connects markup to code: buttons declare `data-action="name"` (optional `data-arg`), one delegated listener dispatches them.

## How to…

### Change a stage's layout

Edit `src/config/stage-layouts.js`. Each stage lists coins, enemies, walls, spikes, a heart and a power-up as coordinate arrays (documented at the top of the file). Stage names and threat text are in `src/config/stages.js`.

### Add an enemy type

1. **Spawn** — add a `spawnX()` factory in `game/spawn.js` (copy an existing one; set `type: 'x'`). If players can shoot it, add the type to `DAMAGEABLE_TYPES`.
2. **Behaviour** — add `updateX(e, dt, speed)` in `game/systems/enemies.js` and register it in `UPDATERS`.
3. **Drawing** — add a draw function in `render/enemies.js` and a branch in `drawEnemies()`.
4. **Death animation** (optional) — a branch in `playDeathEffect()` (`game/combat.js`) and `drawCorpses()` (`render/death-animations.js`).
5. **Place it** — add a key to the stage layout and spawn it in `spawnLayout()` (`game/stage-loader.js`).

### Add or tune a hero

Heroes are data in `src/config/heroes.js`: stats, colours and weapon fields (`weapon`, `spread`, `shotSpeed`, `damageMul`, `explosive`, `piercing`, `heavy`). A new projectile look needs a renderer in `render/projectiles.js` (`WEAPON_RENDERERS`) and, optionally, a trail in `render/animate.js#spawnProjectileTrails`. Hero art is drawn in `render/hero.js`.

### Tune difficulty

`src/config/difficulty.js` — lives, enemy speed/health/bullet-speed multipliers, boss cooldown, invulnerability time, coin-magnet radius and score multiplier per preset.

### Persisted data

`core/storage.js` wraps `localStorage` (keys in `STORAGE_KEYS`): best score, graphics setting, adaptive quality level and difficulty.

## Testing

`npm test` builds with `--mode test`, which also bundles `src/debug/test-hooks.js` and exposes `window.__game` (state plus a few functions) so Playwright can drive the game directly. Production builds never include it.

## PWA

`vite.config.js` contains a small plugin that, after each build, writes `dist/sw.js` from `src/pwa/sw-template.js`, injecting the list of built files to precache and a content hash for the cache name. `src/pwa/register-sw.js` registers it in production builds only.
