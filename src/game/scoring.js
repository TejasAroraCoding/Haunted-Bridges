/**
 * Score, combo multiplier, weapon experience and stage progress.
 */

import { state } from '../core/state.js';
import { playSfx } from '../audio/audio.js';
import { HEROES } from '../config/heroes.js';
import { clamp } from '../core/math.js';
import { difficulty } from '../core/settings.js';
import { addShockwave, burst } from './effects.js';
import { showBanner } from './flow.js';

// isHit=false (coins) scores at the current multiplier without touching the hit counter
export function addCombo(ptsBase, isHit = true) {
  if (isHit) {
    state.combo = Math.min(35, state.combo + 1);
    state.comboT = 4.2;
  }
  const mult = Math.min(4.0, 1 + Math.floor(state.combo / 3) * 0.5);
  if (mult > state.bestCombo) state.bestCombo = mult;
  const gained = Math.round(ptsBase * mult * difficulty().score);
  state.score += gained;
  state.hudScoreFlash = 0.25;
  return {
    gained,
    mult,
  };
}

export function addWeaponXp(n) {
  state.weaponXp += n;
  const nl = [0, 9, 21, 35, 52].filter(v => state.weaponXp >= v).length;
  if (nl > state.weaponLevel) {
    state.weaponLevel = nl;
    for (const e of state.enemies)
      if (e.type === 'zombie' || e.type === 'vampire' || e.type === 'ghost') {
        e.hp += 1.4;
        e.maxHp += 1.4;
        e.dispHp = e.hp;
        e.lv = state.weaponLevel;
      }
    showBanner('WEAPON LV ' + state.weaponLevel + ' — ARCANE ARSENAL UPGRADED!');
    playSfx(600, 0.5, 'triangle', 0.12, 600);
    burst(state.player.x, state.player.y, 22, HEROES[state.selectedHeroIndex].glow, 220);
    addShockwave(state.player.x, state.player.y, 105, HEROES[state.selectedHeroIndex].glow, 0.45);
  }
}

export function stageProgress() {
  const tot = state.coins.length + state.stageKillable;
  return tot ? clamp((state.coins.length - state.coinsLeft + state.stageKills) / tot, 0, 1) : 0;
}
