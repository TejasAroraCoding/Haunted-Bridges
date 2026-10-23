/**
 * One fixed-step physics tick (called 120× per second by core/loop.js).
 * Order matters: the player moves and fires first, then enemies, the boss, hazards and pickups react.
 */

import { state } from '../core/state.js';
import { HEROES } from '../config/heroes.js';
import { STAGE_LAYOUTS } from '../config/stage-layouts.js';
import { H, W } from '../core/constants.js';
import { compact } from '../core/math.js';
import { stepBossIntro, updateBoss } from './boss.js';
import { finishDeath } from './flow.js';
import { loadStage } from './stage-loader.js';
import { enemySpeedFactor, updateEnemies } from './systems/enemies.js';
import {
  updateBloodMist,
  updateBombs,
  updateEnemyBullets,
  updateLasers,
  updateSpikeTraps,
  updateWallCannons,
} from './systems/hazards.js';
import { checkPortal, updateCoins, updateHearts, updatePowerUps } from './systems/pickups.js';
import { updatePlayerMovement, updatePlayerTimers } from './systems/player-movement.js';
import { updatePlayerBullets, updateShooting } from './systems/shooting.js';

/**
 * Sequences that pause normal play: hit-stop, the death animation, the warp between stages,
 * the stage title card and the boss intro. Returns true while one of them is running.
 */
function stepInterruptions(dt) {
  if (state.hitStop > 0) {
    state.hitStop -= dt;
    return true;
  }
  if (state.lightningFlash > 0) state.lightningFlash = Math.max(0, state.lightningFlash - dt * 2.5);
  if (state.arrivalTimer > 0) state.arrivalTimer = Math.max(0, state.arrivalTimer - dt);

  const p = state.player;
  if (p.dying > 0) {
    p.dying -= dt;
    if (p.dying <= 0) {
      p.dying = 0;
      finishDeath();
    }
    return true;
  }
  if (state.warpTimer > 0) {
    // Pull the hero into the portal, then load the next stage.
    state.warpTimer -= dt;
    p.x += (W - 28 - p.x) * Math.min(1, dt * 8);
    p.y += (H / 2 - p.y) * Math.min(1, dt * 8);
    if (state.warpTimer <= 0) {
      state.warpTimer = 0;
      loadStage(Math.min(state.stageIndex + 1, STAGE_LAYOUTS.length - 1));
    }
    return true;
  }
  if (state.stageCardTimer > 0) {
    state.stageCardTimer -= dt;
    return true;
  }
  if (state.bossIntro > 0) {
    stepBossIntro(dt);
    return true;
  }
  return false;
}

export function stepGame(dt) {
  state.gameTime += dt;
  state.runTime += dt;
  if (state.bossLine) {
    state.bossLine.t -= dt;
    if (state.bossLine.t <= 0) state.bossLine = null;
  }
  if (stepInterruptions(dt)) return;

  const hero = HEROES[state.selectedHeroIndex];
  updatePlayerTimers(dt);
  updatePlayerMovement(dt, hero);
  updateBloodMist(dt);
  updateShooting(hero);
  updatePlayerBullets(dt);
  compact(state.enemies, e => !e.dead);

  const speed = enemySpeedFactor();
  updateEnemies(dt, speed);
  updateBoss(dt);

  updateLasers(dt);
  updateBombs(dt);
  updateEnemyBullets(dt);
  updateWallCannons(dt, speed);
  updateSpikeTraps();

  updateHearts();
  updatePowerUps();
  updateCoins(dt);
  checkPortal();

  if (state.hurtFlash > 0) state.hurtFlash -= dt;
  if (state.bannerTimer > 0) state.bannerTimer -= dt;
}
