/**
 * Malakor, the final boss: entrance cinematic, three-phase AI, attacks, telegraph state and death.
 *
 * Phases follow damage taken (phase II at 33 %, phase III at 66 %). Every cooldown he fires the
 * attack chosen by nextBossAttack(); `boss.wind` (0..1) ramps up just before so the renderer can telegraph it.
 */

import { state } from '../core/state.js';
import { playSfx, playTone } from '../audio/audio.js';
import { BOSS_LINES } from '../config/dialogue.js';
import { HEROES } from '../config/heroes.js';
import { H, W } from '../core/constants.js';
import { clamp, dist, rand } from '../core/math.js';
import { difficulty } from '../core/settings.js';
import { keys, mouse, rightStick } from '../input/input.js';
import { finalizeRun } from '../ui/end-screen.js';
import { addShockwave, burst } from './effects.js';
import { showBanner } from './flow.js';
import { hurt } from './player.js';
import { spawnEnemyBullet, spawnVampire } from './spawn.js';
import { addShake } from './camera.js';

const LEFT_POST = 155;
const RIGHT_POST = 810;
const WIND_UP_TIME = 0.55;
const CRUSH_SPEED = 980;
const CONTACT_RADIUS = 58;

/** Which attack the boss uses for attack number `count` in phase `phase`. */
export function nextBossAttack(count, phase) {
  if (count % 4 === 0 && phase >= 2) return 'rift';
  if (count % 5 === 0 && phase === 3) return 'crush';
  if (count % 3 === 0) return 'ring';
  return 'spear';
}

/** Shows one of Malakor's lines as a typed subtitle, with a growl. */
export function bossSay(key, duration = 3.2) {
  const text = BOSS_LINES[key](HEROES[state.selectedHeroIndex].name);
  state.bossLine = { text, t: duration, m: duration };
  if (state.audioCtx && !state.muted) {
    const now = state.audioCtx.currentTime;
    playTone(92, now, 0.5, 'sawtooth', 0.07, -30);
    playTone(69, now + 0.12, 0.6, 'sawtooth', 0.06, -20);
  }
}

/* ---------- Entrance cinematic: Malakor glides in, roars, speaks; fire to skip ---------- */

export function stepBossIntro(dt) {
  const boss = state.boss;
  if (!boss) {
    state.bossIntro = 0;
    return;
  }
  if (state.bossIntro >= state.bossIntroDuration) {
    bossSay(state.bossSeen ? 'retry' : 'intro', state.bossIntroDuration - 0.15);
    playSfx(55, 1.4, 'sawtooth', 0.14, -15);
    addShake(0.3);
  }
  state.bossIntro -= dt;
  const progress = 1 - state.bossIntro / state.bossIntroDuration;
  boss.x += (boss.baseX - boss.x) * Math.min(1, dt * 2.6);
  boss.y += (270 - boss.y) * Math.min(1, dt * 3);
  boss.bob += dt;
  boss.dispHp = boss.hp;
  for (const e of state.enemies) {
    if (e.type !== 'wraith') continue;
    e.a += dt * 1.35;
    const r = 115 * Math.min(1, progress * 1.6);
    e.x = boss.x + Math.cos(e.a) * r;
    e.y = boss.y + Math.sin(e.a) * r;
  }
  if (!boss.roared && progress > 0.42) {
    boss.roared = true;
    state.lightningFlash = 0.7;
    addShake(0.55, Math.PI);
    addShockwave(boss.x, boss.y, 210, '#ff2a55', 0.7);
    burst(boss.x, boss.y, 30, '#ff2a55', 260);
    playSfx(70, 0.9, 'sawtooth', 0.18, -25);
  }
  // Skipping needs a fresh press, so holding fire from the previous stage doesn't skip instantly.
  const firing = keys[' '] || mouse.d || rightStick.active;
  if (!firing) boss.skipArmed = true;
  else if (boss.skipArmed && progress > 0.15) state.bossIntro = Math.min(state.bossIntro, 0.25);
  if (state.bossIntro <= 0) {
    state.bossIntro = 0;
    state.bossSeen = true;
    state.player.inv = Math.max(state.player.inv, 0.8);
    boss.cd = Math.max(boss.cd, 1.0);
  }
}

/* ---------- Combat ---------- */

/** Applies a player hit to the boss; returns true if this hit killed him. */
export function damageBoss(amount) {
  const boss = state.boss;
  boss.hp -= amount;
  boss.fl = 0.12;
  if (boss.hp > 0 || boss.dead) return false;
  boss.dead = 1;
  boss.deadT = 3.0;
  bossSay('death', 2.9);
  state.enemyBullets.length = 0;
  state.lasers.length = 0;
  state.bombs.length = 0;
  return true;
}

export function updateBoss(dt) {
  const boss = state.boss;
  if (!boss) return;
  boss.dispHp += (Math.max(0, boss.hp) - boss.dispHp) * Math.min(1, dt * 8);
  if (boss.dead) {
    updateDeathThroes(dt);
    return;
  }
  boss.fl -= dt;
  boss.bob += dt;
  if (!state.bossLowSaid && boss.hp / boss.max < 0.12) {
    state.bossLowSaid = true;
    bossSay('low', 2.6);
  }
  const damageTaken = 1 - boss.hp / boss.max;
  const phase = damageTaken > 0.66 ? 3 : damageTaken > 0.33 ? 2 : 1;
  if (boss.pl !== phase) enterPhase(phase);

  updateMovement(dt, damageTaken);
  boss.cd -= dt;
  if (boss.cd <= 0 && boss.state === 'hover') fireAttack(phase, damageTaken);
  updateTelegraph(dt, phase);
  updateSecondaryHazards(dt, phase);

  if (dist(state.player.x, state.player.y, boss.x, boss.y) < CONTACT_RADIUS) {
    hurt(1, boss.state === 'crushDash' ? 'ABYSSAL CRUSH! -1' : 'MALAKOR CRUSH! -1', boss.x, boss.y);
  }
}

function updateDeathThroes(dt) {
  const boss = state.boss;
  boss.deadT -= dt;
  if (Math.random() < 0.35 * dt * 60) {
    const x = boss.x + rand(-55, 55);
    const y = boss.y + rand(-55, 55);
    burst(x, y, 10, Math.random() < 0.5 ? '#ff3355' : '#ffcc55', 180);
    addShockwave(x, y, 65, '#ffaa44', 0.3);
    playSfx(110 + rand(0, 90), 0.15, 'sawtooth', 0.08, -40);
  }
  if (boss.deadT <= 0 && state.scene === 'play') {
    state.scene = 'win';
    finalizeRun('win');
  }
}

function enterPhase(phase) {
  const boss = state.boss;
  boss.pl = phase;
  state.lightningFlash = 0.85;
  state.hitStop = 0.1;
  addShake(0.55);
  addShockwave(boss.x, boss.y, 170, phase === 3 ? '#ff2a55' : '#c77dff', 0.55);
  burst(boss.x, boss.y, 36, '#ff2a55', 280);
  playSfx(75, 0.8, 'sawtooth', 0.2, -30);
  showBanner(phase === 2 ? 'PHASE II — CRIMSON ECLIPSE!' : 'PHASE III — ABYSSAL CATACLYSM!');
  bossSay(phase === 2 ? 'p2' : 'p3', 3);
  if (phase === 2 && !state.enemies.some(e => e.type === 'vampire')) spawnVampire(620, 140, 2);
}

function updateMovement(dt, damageTaken) {
  const boss = state.boss;
  if (boss.state === 'crushWarn') {
    boss.stateT -= dt;
    boss.y += (boss.crushY - boss.y) * Math.min(1, dt * 10);
    if (boss.stateT <= 0) {
      boss.state = 'crushDash';
      boss.stateT = 0.68;
      playSfx(95, 0.45, 'sawtooth', 0.16, 120);
    }
  } else if (boss.state === 'crushDash') {
    boss.stateT -= dt;
    boss.x += boss.crushDir * CRUSH_SPEED * dt;
    if (Math.random() < 0.5) addShockwave(boss.x, boss.y, 62, '#ff2a55', 0.22);
    if (boss.x < 120 || boss.x > 840 || boss.stateT <= 0) {
      boss.crushDir *= -1;
      boss.baseX = boss.x < W / 2 ? LEFT_POST : RIGHT_POST;
      boss.x = boss.baseX;
      boss.state = 'hover';
      boss.atkName = 'VOID RECKONING';
    }
  } else {
    // Hover at his post, sweeping up and down faster as he weakens.
    boss.x += (boss.baseX - boss.x) * Math.min(1, dt * 5);
    boss.y = 270 + Math.sin(state.gameTime * (0.85 + damageTaken * 0.45)) * 155;
  }
}

function fireAttack(phase, damageTaken) {
  const boss = state.boss;
  boss.ph++;
  boss.fireFl = 0.25;
  boss.windSnd = false;
  boss.cd = Math.max(0.68, 1.25 - damageTaken * 0.45 - (state.weaponLevel - 1) * 0.04) * difficulty().cd;
  const aim = Math.atan2(state.player.y - boss.y, state.player.x - boss.x);

  switch (nextBossAttack(boss.ph, phase)) {
    case 'rift': {
      // Teleports to the other post, leaving a ring of bolts behind.
      boss.atkName = 'SHADOW-STEP RIFT';
      addShockwave(boss.x, boss.y, 85, '#c77dff', 0.35);
      boss.baseX = boss.baseX > W / 2 ? 160 : RIGHT_POST;
      const count = 12;
      for (let i = 0; i < count; i++)
        spawnEnemyBullet(boss.x, boss.y, (i / count) * Math.PI * 2, 195, 6, '#c77dff', 'purple');
      playSfx(240, 0.25, 'sine', 0.1, 180);
      break;
    }
    case 'crush':
      // Locks onto the player's row, then charges across the screen.
      boss.atkName = 'ABYSSAL CRUSH CHARGE';
      boss.state = 'crushWarn';
      boss.stateT = 0.72;
      boss.crushY = clamp(state.player.y, 95, H - 95);
      boss.crushDir = boss.x > W / 2 ? -1 : 1;
      playSfx(150, 0.4, 'sawtooth', 0.12, 160);
      break;
    case 'ring': {
      boss.atkName = phase >= 2 ? 'SPIRAL ECLIPSE NOVA' : 'DARK MATTER RING';
      const count = 10 + phase * 2;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + state.gameTime;
        spawnEnemyBullet(boss.x, boss.y, angle, 165 + damageTaken * 65, 7, '#ff2a55', 'red');
      }
      playSfx(105, 0.28, 'sawtooth', 0.1, -50);
      break;
    }
    default:
      boss.atkName = 'VOID SPEAR BARRAGE';
      for (let i = -2; i <= 2; i++) {
        spawnEnemyBullet(boss.x, boss.y, aim + i * 0.18, 245 + damageTaken * 85, 6, '#c77dff', 'purple');
      }
      playSfx(130, 0.22, 'sawtooth', 0.08, -50);
  }
}

/** Tracks the next attack and the wind-up amount the renderer uses for telegraphs. */
function updateTelegraph(dt, phase) {
  const boss = state.boss;
  if (boss.fireFl > 0) boss.fireFl -= dt;
  boss.next = nextBossAttack(boss.ph + 1, phase);
  boss.wind = boss.state === 'hover' ? clamp(1 - boss.cd / WIND_UP_TIME, 0, 1) : 0;
  if (boss.wind > 0.08 && !boss.windSnd) {
    boss.windSnd = true;
    playSfx(boss.next === 'ring' ? 150 : boss.next === 'rift' ? 260 : 200, 0.5, 'sine', 0.05, 240);
  }
}

/** From phase II: time bombs on the player; from phase III also sweeping lasers. */
function updateSecondaryHazards(dt, phase) {
  const boss = state.boss;
  boss.t2 -= dt;
  if (phase === 1 || boss.t2 > 0) return;
  boss.t2 = (phase === 3 ? 2.3 : 3.2) * difficulty().cd;
  if (phase === 3) {
    if (Math.random() < 0.5) state.lasers.push({ y: clamp(state.player.y, 70, H - 70), t: 1.05, h: 34, vert: false });
    else state.lasers.push({ x: clamp(state.player.x, 110, W - 110), t: 1.05, w: 34, vert: true });
  }
  state.bombs.push({ x: state.player.x, y: state.player.y, t: 1.25, dead: 0 });
}
