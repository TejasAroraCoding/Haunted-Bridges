/**
 * Stage-warp cheat (type WARP, or tap BEST RUN five times).
 */

import { state } from '../core/state.js';
import { ensureAudio, playSfx } from '../audio/audio.js';
import { STAGES } from '../config/stages.js';
import { clamp } from '../core/math.js';
import { loadStage } from './stage-loader.js';
import { queueLayout } from '../ui/layout.js';
import { resumeGameUI, startNewGameUI } from '../ui/menus.js';
import { toast } from '../ui/toast.js';

let cheatTaps = [];

export function setCheats(on) {
  state.cheatsEnabled = on;
  document.body.classList.toggle('cheats', on);
  playSfx(on ? 880 : 300, 0.25, 'triangle', 0.08, on ? 500 : -150);
  toast(on ? '⚡ WARP CHEAT ON — press 1–6 or [ ] to change stage' : 'Warp cheat off', 2600);
  queueLayout();
}

export function cheatTap() {
  const now = performance.now();
  cheatTaps = cheatTaps.filter(t => now - t < 1500);
  cheatTaps.push(now);
  if (cheatTaps.length >= 5) {
    cheatTaps = [];
    setCheats(!state.cheatsEnabled);
  }
}

export function cheatWarp(n) {
  if (!state.cheatsEnabled) return;
  n = clamp(n, 0, 5);
  ensureAudio();
  if (state.scene === 'title' || state.scene === 'over' || state.scene === 'win') startNewGameUI();
  else if (state.scene === 'pause') resumeGameUI();
  state.warpTimer = 0;
  loadStage(n);
  state.runCheated = true;
  playSfx(520, 0.4, 'triangle', 0.1, 520);
  toast(`⚡ Warped to ${STAGES[n].n} — ${STAGES[n].s} (score won't count as best)`);
}
