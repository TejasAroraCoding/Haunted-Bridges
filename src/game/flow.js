/**
 * Run lifecycle: starting a run, banners and what happens after the player dies.
 */

import { state } from '../core/state.js';
import { HEROES } from '../config/heroes.js';
import { difficulty, settings } from '../core/settings.js';
import { finalizeRun } from '../ui/end-screen.js';
import { loadStage } from './stage-loader.js';

const BANNER_TIME = 2.3;

/** Resets all run-wide state and loads stage 1. */
export function newGame() {
  const hero = HEROES[state.selectedHeroIndex];
  state.runDifficulty = settings.difficulty;
  state.lives = difficulty().lives;
  state.score = 0;
  state.weaponXp = 0;
  state.weaponLevel = 1;
  state.goldenHearts = hero.xh;
  state.bossSeen = false;
  state.combo = 0;
  state.comboT = 0;
  state.bestCombo = 1;
  state.gameOverPending = false;
  state.runKills = 0;
  state.runCoins = 0;
  state.runTime = 0;
  state.runDeaths = 0;
  state.runStartBest = state.highScore;
  state.lastEnd = null;
  state.runCheated = false;
  loadStage(0);
  state.scene = 'play';
}

/** Shows a message along the bottom of the playfield for a couple of seconds. */
export function showBanner(text) {
  state.bannerText = text;
  state.bannerTimer = BANNER_TIME;
}

/** Called when the death animation ends: restart the stage, or end the run when out of lives. */
export function finishDeath() {
  if (state.gameOverPending) {
    state.scene = 'over';
    finalizeRun('over');
    return;
  }
  loadStage(state.stageIndex);
}
