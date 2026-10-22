/**
 * Button wiring. Markup declares intent with `data-action` (and optional `data-arg`);
 * one delegated click listener routes it here — no inline handlers or window globals.
 */

import { cheatTap, cheatWarp } from '../game/cheats.js';
import { installApp } from '../pwa/install.js';
import {
  closeModals,
  openModal,
  openModalFromPause,
  resumeGameUI,
  returnToTitleUI,
  startNewGameUI,
  togglePauseUI,
} from './menus.js';
import {
  cycleDifficulty,
  cycleTouchMode,
  setDifficulty,
  toggleAimAssist,
  toggleFullscreen,
  toggleGfxQuality,
  toggleMuteUI,
  toggleShakeSetting,
} from './settings-panel.js';

const ACTIONS = {
  openModal,
  openModalFromPause,
  closeModals,
  startNewGameUI,
  resumeGameUI,
  togglePauseUI,
  returnToTitleUI,
  deployFromHeroes: () => {
    closeModals();
    startNewGameUI();
  },
  toggleMuteUI,
  toggleFullscreen,
  toggleGfxQuality,
  toggleShakeSetting,
  toggleAimAssist,
  cycleTouchMode,
  cycleDifficulty,
  setDifficulty,
  installApp,
  cheatTap,
  cheatWarp: stage => cheatWarp(Number(stage)),
};

export function initActions() {
  document.addEventListener('click', event => {
    const el = event.target.closest('[data-action]');
    if (!el) return;
    const action = ACTIONS[el.dataset.action];
    if (action) action(el.dataset.arg);
    else console.warn(`Unknown data-action "${el.dataset.action}"`);
  });
}
