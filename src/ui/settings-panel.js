/**
 * Settings modal controls.
 */

import { state } from '../core/state.js';
import { ensureAudio, playSfx } from '../audio/audio.js';
import { DIFFICULTIES } from '../config/difficulty.js';
import { updateRenderScale } from '../core/canvas.js';
import { settings } from '../core/settings.js';
import { updateTouchVisibility } from '../input/input.js';
import { STORAGE_KEYS, writeStorage } from '../core/storage.js';

export function toggleMuteUI() {
  ensureAudio();
  state.muted = !state.muted;
  if (state.musicGain) state.musicGain.gain.value = state.muted ? 0 : 0.04;
  document.getElementById('mute-icon').textContent = state.muted ? '🔇' : '🔊';
  const btn = document.getElementById('set-audio-btn');
  btn.textContent = state.muted ? 'MUTED' : 'ON';
  btn.className = `btn-neo px-4 py-1.5 rounded-lg font-bold ${state.muted ? 'text-rose-400' : 'text-cyan-300'}`;
}

export function cycleTouchMode() {
  const modes = ['auto', 'on', 'off'];
  settings.touchMode = modes[(modes.indexOf(settings.touchMode) + 1) % modes.length];
  document.getElementById('set-touch-btn').textContent = settings.touchMode.toUpperCase();
  updateTouchVisibility();
}

export function updateGfxUI() {
  const btn = document.getElementById('set-gfx-btn'),
    d = document.getElementById('set-gfx-desc');
  const lab = {
    auto: 'AUTO',
    high: 'HIGH',
    perf: 'PERFORMANCE',
  }[settings.gfx];
  btn.textContent = lab;
  btn.className = `btn-neo px-4 py-1.5 rounded-lg font-bold ${settings.gfx === 'high' ? 'text-emerald-300' : settings.gfx === 'perf' ? 'text-amber-300' : 'text-cyan-300'}`;
  d.textContent =
    settings.gfx === 'auto'
      ? `Adapts to keep play smooth · currently ${['full quality', 'reduced resolution', 'no lighting', 'lowest'][state.perfLevel]}`
      : settings.gfx === 'high'
        ? 'Lighting, embers & full resolution always on'
        : 'No lighting, fewer particles, lower resolution';
}

export function toggleGfxQuality() {
  const order = ['auto', 'high', 'perf'];
  settings.gfx = order[(order.indexOf(settings.gfx) + 1) % order.length];
  if (settings.gfx === 'auto') state.perfLevel = 0;
  writeStorage(STORAGE_KEYS.graphics, settings.gfx);
  writeStorage(STORAGE_KEYS.perfLevel, state.perfLevel);
  updateGfxUI();
  updateRenderScale();
}

export function toggleShakeSetting() {
  settings.shake = !settings.shake;
  document.getElementById('set-shake-btn').textContent = settings.shake ? 'ON' : 'OFF';
}

export function toggleAimAssist() {
  settings.aimAssist = !settings.aimAssist;
  document.getElementById('set-aim-btn').textContent = settings.aimAssist ? 'ON' : 'OFF';
}

export function updateDiffUI() {
  const d = DIFFICULTIES[settings.difficulty];
  document.querySelectorAll('.diff-pill').forEach(b => b.classList.toggle('on', b.dataset.d === settings.difficulty));
  const pending = state.scene !== 'title' && settings.difficulty !== state.runDifficulty;
  document.getElementById('diff-desc').textContent = d.desc;
  const btn = document.getElementById('set-diff-btn');
  btn.textContent = d.label;
  btn.style.color = d.color;
  document.getElementById('set-diff-desc').textContent = d.desc + (pending ? ' · applies next run' : '');
}

export function setDifficulty(k) {
  if (!DIFFICULTIES[k]) return;
  ensureAudio();
  playSfx(k === 'nightmare' ? 220 : k === 'easy' ? 660 : 440, 0.14, 'triangle', 0.07, k === 'nightmare' ? -80 : 160);
  settings.difficulty = k;
  writeStorage(STORAGE_KEYS.difficulty, k);
  updateDiffUI();
}

export function cycleDifficulty() {
  const ks = Object.keys(DIFFICULTIES);
  setDifficulty(ks[(ks.indexOf(settings.difficulty) + 1) % ks.length]);
}

export function toggleFullscreen() {
  if (!document.fullscreenElement) {
    const pr = document.documentElement.requestFullscreen?.({
      navigationUI: 'hide',
    });
    pr?.then(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => {});
  } else document.exitFullscreen?.().catch(() => {});
}
