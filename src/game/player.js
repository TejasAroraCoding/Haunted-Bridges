/**
 * Player actions and damage: dashing, getting hurt and dying.
 */

import { state } from '../core/state.js';
import { playSfx } from '../audio/audio.js';
import { HEROES } from '../config/heroes.js';
import { DEATH_ANIM_TIME } from '../core/constants.js';
import { dist } from '../core/math.js';
import { difficulty } from '../core/settings.js';
import { addShockwave, burst, popText } from './effects.js';
import { readMoveInput } from '../input/input.js';
import { addShake } from './camera.js';

export function triggerDash() {
  if (
    !state.player ||
    state.scene !== 'play' ||
    state.stageCardTimer > 0 ||
    state.warpTimer > 0 ||
    state.player.dashCd > 0 ||
    state.player.dying > 0
  )
    return;
  const h = HEROES[state.selectedHeroIndex];
  state.player.dashT = 0.21;
  state.player.dashCd = state.player.speedT > 0 ? h.dashCd * 0.65 : h.dashCd;
  state.player.inv = Math.max(state.player.inv, 0.32);
  let { x: dx, y: dy } = readMoveInput();
  if (Math.hypot(dx, dy) < 0.1) {
    dx = state.player.fx || 1;
    dy = 0;
  }
  const l = Math.hypot(dx, dy) || 1;
  state.player.vx = (dx / l) * 640;
  state.player.vy = (dy / l) * 640;
  playSfx(380, 0.18, 'sine', 0.09, 440);
  burst(state.player.x, state.player.y, 12, h.glow, 150);
  addShockwave(state.player.x, state.player.y, 46, h.glow, 0.26);
}

export function hurt(d = 1, lb, sx, sy) {
  if (
    state.player.inv > 0 ||
    state.stageCardTimer > 0 ||
    state.warpTimer > 0 ||
    state.player.dying > 0 ||
    state.bossIntro > 0
  )
    return;
  const hasSrc = sx !== undefined && dist(sx, sy, state.player.x, state.player.y) > 0.5;
  const hitAng = hasSrc ? Math.atan2(sy - state.player.y, sx - state.player.x) : 0;
  if (state.player.shield > 0) {
    if (hasSrc && state.hitIndicators.length < 6)
      state.hitIndicators.push({
        a: hitAng,
        t: 0.7,
        m: 0.7,
        c: 'cyan',
      });
    state.player.shield = 0;
    state.player.inv = 1.1;
    popText(state.player.x, state.player.y - 34, 'AEGIS BLOCKED!', '#7df9ff', 16);
    playSfx(520, 0.25, 'sine', 0.12, -200);
    burst(state.player.x, state.player.y, 16, '#6ff', 220);
    addShockwave(state.player.x, state.player.y, 70, '#7df9ff', 0.32);
    state.hitStop = 0.04;
    addShake(0.12, hasSrc ? hitAng + Math.PI : undefined);
    return;
  }
  if (state.goldenHearts > 0) state.goldenHearts--;
  else state.player.hp -= d;
  state.combo = 0;
  state.comboT = 0;
  popText(state.player.x, state.player.y - 34, lb || '-1 HEART', '#ff4d6d', 17);
  state.player.inv = 1.25 * difficulty().inv;
  state.player.hitFl = 0.3;
  if (hasSrc) {
    if (state.hitIndicators.length < 6)
      state.hitIndicators.push({
        a: hitAng,
        t: 0.9,
        m: 0.9,
        c: 'red',
      });
    if (state.player.dashT <= 0) {
      state.player.vx -= Math.cos(hitAng) * 260;
      state.player.vy -= Math.sin(hitAng) * 260;
    }
  }
  addShake(0.3, hasSrc ? hitAng + Math.PI : undefined);
  state.hurtFlash = 0.32;
  state.hitStop = 0.06;
  playSfx(120, 0.3, 'sawtooth', 0.15, -60);
  burst(state.player.x, state.player.y, 16, '#f44', 230);
  addShockwave(state.player.x, state.player.y, 65, '#ff3355', 0.32);
  if (state.player.hp <= 0) killPlayer();
}

function killPlayer() {
  state.player.dying = DEATH_ANIM_TIME;
  state.runDeaths++;
  playSfx(90, 0.8, 'sawtooth', 0.2, -70);
  burst(state.player.x, state.player.y, 34, HEROES[state.selectedHeroIndex].glow, 260);
  addShockwave(state.player.x, state.player.y, 110, HEROES[state.selectedHeroIndex].glow, 0.6);
  state.lives--;
  state.gameOverPending = state.lives < 0;
}
