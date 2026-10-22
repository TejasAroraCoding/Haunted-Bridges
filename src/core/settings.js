/**
 * Player settings (graphics, shake, touch, aim assist, difficulty) and their persistence.
 */

import { state } from './state.js';
import { DIFFICULTIES } from '../config/difficulty.js';
import { clamp } from './math.js';
import { STORAGE_KEYS, readStorage } from './storage.js';

export const settings = {
  gfx: 'auto',
  shake: true,
  touchMode: 'auto',
  aimAssist: true,
  difficulty: 'normal',
};

export const isHighGfx = () => settings.gfx === 'high' || (settings.gfx === 'auto' && state.perfLevel < 2);

export const difficulty = () => DIFFICULTIES[state.runDifficulty] || DIFFICULTIES.normal;

/** Restores persisted settings and the best score. Call once at startup. */
export function loadSettings() {
  const gfx = readStorage(STORAGE_KEYS.graphics);
  if (['auto', 'high', 'perf'].includes(gfx)) settings.gfx = gfx;
  // Adaptive quality: 0 = full res + lighting, 1 = reduced res + lighting, 2 = no lighting, 3 = lowest
  state.perfLevel = clamp(parseInt(readStorage(STORAGE_KEYS.perfLevel) || '0', 10) || 0, 0, 3);
  const diff = readStorage(STORAGE_KEYS.difficulty);
  if (DIFFICULTIES[diff]) settings.difficulty = diff;
  state.highScore = parseInt(readStorage(STORAGE_KEYS.highScore) || '0', 10) || 0;
}
