/**
 * Adaptive graphics quality (the AUTO setting). If the frame rate stays under 48 FPS during play,
 * quality steps down one level and is remembered for next time:
 *   0 full resolution + lighting · 1 reduced resolution · 2 no lighting · 3 lowest resolution
 */

import { state } from './state.js';
import { updateRenderScale } from './canvas.js';
import { settings } from './settings.js';
import { STORAGE_KEYS, writeStorage } from './storage.js';

const LOW_FPS = 48;
const LOW_FPS_SECONDS = 1.6; // sustained slowness before stepping down
const COOLDOWN_SECONDS = 2.5; // settle time after a change
const MAX_LEVEL = 3;

let smoothedFps = 60;
let lowFpsTime = 0;
let cooldown = 0;

export function governQuality(dt) {
  if (settings.gfx !== 'auto' || state.scene !== 'play' || document.hidden) {
    lowFpsTime = 0;
    return;
  }
  if (cooldown > 0) {
    cooldown -= dt;
    return;
  }
  smoothedFps += (1 / Math.max(dt, 1e-3) - smoothedFps) * 0.06;
  if (smoothedFps < LOW_FPS) lowFpsTime += dt;
  else lowFpsTime = Math.max(0, lowFpsTime - dt * 0.5);
  if (lowFpsTime > LOW_FPS_SECONDS && state.perfLevel < MAX_LEVEL) {
    state.perfLevel++;
    lowFpsTime = 0;
    smoothedFps = 60;
    cooldown = COOLDOWN_SECONDS;
    writeStorage(STORAGE_KEYS.perfLevel, state.perfLevel);
    updateRenderScale();
  }
}
