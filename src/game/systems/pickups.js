/**
 * Hearts, power-ups, coins (with magnet), unlocking the gate and stepping through the portal.
 */

import { state } from '../../core/state.js';
import { playSfx } from '../../audio/audio.js';
import { GATE_OPEN_DURATION, GATE_ZONE, H, WARP_DURATION } from '../../core/constants.js';
import { compact, dist, rand } from '../../core/math.js';
import { difficulty } from '../../core/settings.js';
import { addShockwave, burst, glowPuff, popText } from '../effects.js';
import { showBanner } from '../flow.js';
import { addCombo, addWeaponXp } from '../scoring.js';

const PICKUP_RADIUS = 34;
const COIN_RADIUS = 36;
const MAX_GOLDEN_HEARTS = 3;
const BUFF_DURATION = 7.5;
const LAST_STAGE = 5;

const distToFeet = (x, y) => dist(state.player.x, state.player.y + 4, x, y);

/** Heals one heart, or grants a golden shield heart when already at full health. */
export function updateHearts() {
  const p = state.player;
  for (const heart of state.hearts) {
    if (heart.got || distToFeet(heart.x, heart.y) >= PICKUP_RADIUS) continue;
    heart.got = 1;
    const full = p.hp >= p.maxHp;
    if (full) state.goldenHearts = Math.min(MAX_GOLDEN_HEARTS, state.goldenHearts + 1);
    else p.hp++;
    burst(heart.x, heart.y, 16, full ? '#fc3' : '#f46', 200);
    addShockwave(heart.x, heart.y, 55, full ? '#ffcc33' : '#ff4466', 0.3);
    playSfx(660, 0.28, 'sine', 0.1, 400);
    popText(heart.x, heart.y - 20, full ? '+1 GOLDEN SHIELD!' : '+1 VITALITY!', full ? '#ffcc44' : '#ff5577', 16);
  }
  compact(state.hearts, heart => !heart.got);
}

const POWER_UP_EFFECTS = {
  rapid: { label: 'OVERDRIVE! (RAPID FIRE)', color: '#ffe066', apply: p => (p.rapidT = BUFF_DURATION) },
  shield: { label: 'AEGIS BARRIER ACTIVE!', color: '#7df9ff', apply: p => (p.shield = 1) },
  speed: {
    label: 'HASTE SURGE! (+SPEED)',
    color: '#55ff99',
    apply: p => {
      p.speedT = BUFF_DURATION;
      p.dashCd = 0;
    },
  },
};

export function updatePowerUps() {
  for (const pu of state.powerUps) {
    if (pu.got || distToFeet(pu.x, pu.y) >= PICKUP_RADIUS) continue;
    pu.got = 1;
    const effect = POWER_UP_EFFECTS[pu.kind];
    effect.apply(state.player);
    playSfx(740, 0.28, 'triangle', 0.1, 350);
    popText(pu.x, pu.y - 22, effect.label, effect.color, 16);
    addShockwave(pu.x, pu.y, 65, effect.color, 0.32);
    burst(pu.x, pu.y, 18, '#fff', 200);
  }
  compact(state.powerUps, pu => !pu.got);
}

function collectCoin(coin) {
  coin.got = 1;
  state.coinsLeft--;
  const { gained } = addCombo(100, false); // coins score at the current multiplier but don't extend the combo
  addWeaponXp(1);
  burst(coin.x, coin.y, 12, '#fd4', 180);
  addShockwave(coin.x, coin.y, 44, '#ffdd44', 0.26);
  if (state.flyingCoins.length < 20) {
    state.flyingCoins.push({
      x0: coin.x,
      y0: coin.y,
      t: 0,
      dur: rand(0.5, 0.65),
      side: Math.random() < 0.5 ? 1 : -1,
      sp: rand(0, 6),
    });
  }
  playSfx(880, 0.18, 'sine', 0.09, 500);
  popText(coin.x, coin.y - 18, `+${gained}`, '#ffdd55', 14);
  if (state.coinsLeft === 0) unlockGate();
}

function unlockGate() {
  showBanner('BRIDGE GATE UNLOCKED — ENTER THE PORTAL!');
  addShockwave(GATE_ZONE.x + 20, H / 2, 120, '#55ff99', 0.5);
  glowPuff(GATE_ZONE.x + 20, H / 2, 'green', 60, 0.6);
  state.gateAnimT = GATE_OPEN_DURATION; // render/animate.js plays the opening sequence
  playSfx(300, 0.14, 'square', 0.06, -160);
}

/** Coins inside the magnet radius (set by difficulty, wider during Haste) drift to the player. */
export function updateCoins(dt) {
  const p = state.player;
  const magnetRadius = difficulty().mag * (p.speedT > 0 ? 1.5 : 1);
  for (const coin of state.coins) {
    if (coin.got) continue;
    const d = distToFeet(coin.x, coin.y);
    coin.pull = d < magnetRadius && p.dying <= 0;
    if (coin.pull && d > 0.5) {
      const closeness = 1 - d / magnetRadius;
      const step = Math.min(d, (140 + closeness * closeness * 950) * dt);
      coin.x += ((p.x - coin.x) / d) * step;
      coin.y += ((p.y + 4 - coin.y) / d) * step;
    }
    if (distToFeet(coin.x, coin.y) < COIN_RADIUS) collectCoin(coin);
  }
}

/** Walking into the open portal banks the stage bonus and starts the warp to the next stage. */
export function checkPortal() {
  const p = state.player;
  const inPortal = p.x > GATE_ZONE.x - 6 && p.y > GATE_ZONE.y && p.y < GATE_ZONE.y + GATE_ZONE.h;
  const gateOpen = state.coinsLeft <= 0 && state.gateLift > 0.8;
  if (state.stageIndex >= LAST_STAGE || !gateOpen || !inPortal || state.warpTimer) return;
  playSfx(520, 0.65, 'triangle', 0.12, 520);
  state.lastStageBonus = Math.round((250 + state.stageIndex * 100 + p.hp * 40) * difficulty().score);
  state.runCoins += state.coins.length;
  state.score += state.lastStageBonus;
  state.warpTimer = WARP_DURATION;
}
