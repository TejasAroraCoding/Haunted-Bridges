/**
 * Enemy behaviour, one update function per enemy type.
 * `speed` is the shared speed factor: it rises with stage progress and weapon level, times the difficulty.
 */

import { state } from '../../core/state.js';
import { playSfx } from '../../audio/audio.js';
import { H, W } from '../../core/constants.js';
import { clamp, dist } from '../../core/math.js';
import { difficulty } from '../../core/settings.js';
import { pushOutOfWalls } from '../collision.js';
import { addShockwave, burst } from '../effects.js';
import { hurt } from '../player.js';
import { stageProgress } from '../scoring.js';
import { spawnEnemyBullet } from '../spawn.js';

const CONTACT_RADIUS = 28;

/** Enemies speed up as the stage is cleared and as the player's weapon grows. */
export function enemySpeedFactor() {
  return (1.05 + stageProgress() * 0.55 + (state.weaponLevel - 1) * 0.09) * difficulty().spd;
}

const distToPlayer = e => dist(state.player.x, state.player.y, e.x, e.y);

function applyKnockback(e, dt, strength) {
  if (!(e.kt > 0)) return;
  e.x += (e.kx || 0) * dt * strength;
  e.y += (e.ky || 0) * dt * strength;
  e.kt -= dt;
}

/** Reflects velocity off the given box edges. */
function bounceWithin(e, minX, maxX, minY, maxY) {
  if (e.x < minX) [e.x, e.vx] = [minX, Math.abs(e.vx)];
  else if (e.x > maxX) [e.x, e.vx] = [maxX, -Math.abs(e.vx)];
  if (e.y < minY) [e.y, e.vy] = [minY, Math.abs(e.vy)];
  else if (e.y > maxY) [e.y, e.vy] = [maxY, -Math.abs(e.vy)];
}

function bounceVertically(e, margin) {
  if (e.y < margin) [e.y, e.vy] = [margin, Math.abs(e.vy)];
  else if (e.y > H - margin) [e.y, e.vy] = [H - margin, -Math.abs(e.vy)];
}

/** Shambles straight at the player. */
function updateZombie(e, dt, speed) {
  applyKnockback(e, dt, 4.5);
  const d = distToPlayer(e) || 1;
  if (e.mat <= 0) {
    e.x += ((state.player.x - e.x) / d) * e.sp * speed * dt;
    e.y += ((state.player.y - e.y) / d) * e.sp * speed * dt;
  }
  e.x = clamp(e.x, 20, W - 20);
  e.y = clamp(e.y, 26, H - 26);
  pushOutOfWalls(e, 16);
  if (d < CONTACT_RADIUS && e.mat <= 0) hurt(1, 'ZOMBIE BITE! -1', e.x, e.y);
}

/** Drifts along a lane (bobbing) or bounces around the arena. */
function updateGhost(e, dt, speed) {
  applyKnockback(e, dt, 2.5);
  e.x += e.vx * dt * speed;
  e.y += e.vy * dt * speed;
  const roamsFreely = state.stageIndex === 1 || (state.stageIndex === 4 && e.vy);
  if (roamsFreely) bounceWithin(e, 30, W - 70, 40, H - 40);
  else bounceWithin(e, 70, W - 80, 40, H - 40);
  if (!e.vy) e.y = e.y0 + Math.sin(e.a * 0.5) * 14;
  if (distToPlayer(e) < 30) hurt(1, 'PHANTOM TOUCH! -1', e.x, e.y);
}

/** Indestructible void orb sliding up and down a column. */
function updateOrb(e, dt, speed) {
  e.y += e.vy * dt * speed;
  bounceVertically(e, 42);
  if (distToPlayer(e) < 34) hurt(1, 'VOID ORB! -1', e.x, e.y);
}

/** Stationary caster: aimed bolts (level 1) or a three-way spread (level 2). */
function updateWizard(e, dt, speed) {
  e.cd -= dt * speed;
  e.y += Math.sin(state.gameTime * 2.2) * 0.35 * dt * 60 * 0.016;
  if (e.cd <= 0) {
    e.cd = e.maxCd;
    const aim = Math.atan2(state.player.y - e.y, state.player.x - e.x);
    const count = e.lvl === 1 ? 1 : 3;
    for (let i = 0; i < count; i++) {
      spawnEnemyBullet(e.x, e.y, aim + (i - (count - 1) / 2) * 0.22, e.lvl === 1 ? 185 : 250, 6, '#d580ff', 'purple');
    }
    playSfx(300, 0.2, 'sawtooth', 0.05, -150);
  }
  if (distToPlayer(e) < CONTACT_RADIUS && e.mat <= 0) hurt(1, 'ARCANE SHOCK! -1', e.x, e.y);
}

/** Circles the player, locks on (telegraphed), then swoops leaving blood mist and a bolt fan. */
function updateVampire(e, dt, speed) {
  applyKnockback(e, dt, 3.5);
  const p = state.player;
  if (e.state === 'stalk') {
    const angle = Math.atan2(p.y - e.y, p.x - e.x);
    const radial = distToPlayer(e) > 210 ? 1 : -0.6;
    const strafe = Math.sin(state.gameTime * 1.7 + e.a * 0.3) >= 0 ? 1 : -1;
    e.vx = (Math.cos(angle) * radial - Math.sin(angle) * strafe * 0.85) * 95 * speed;
    e.vy = (Math.sin(angle) * radial + Math.cos(angle) * strafe * 0.85) * 95 * speed;
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    e.cd -= dt * speed;
    if (e.cd <= 0) {
      e.state = 'lock';
      e.lockT = 0.62;
      e.tx = p.x;
      e.ty = p.y;
      playSfx(440, 0.22, 'sine', 0.06, 260);
    }
  } else if (e.state === 'lock') {
    e.lockT -= dt;
    e.tx += (p.x - e.tx) * Math.min(1, dt * 6);
    e.ty += (p.y - e.ty) * Math.min(1, dt * 6);
    if (e.lockT <= 0) {
      e.state = 'swoop';
      e.swoopT = 0.42;
      const angle = Math.atan2(e.ty - e.y, e.tx - e.x);
      const swoopSpeed = 540 + e.lvl * 45;
      e.dashVx = Math.cos(angle) * swoopSpeed;
      e.dashVy = Math.sin(angle) * swoopSpeed;
      playSfx(190, 0.28, 'sawtooth', 0.09, 240);
      addShockwave(e.x, e.y, 48, '#ff2a55', 0.25);
    }
  } else if (e.state === 'swoop') {
    e.swoopT -= dt;
    e.x += e.dashVx * dt;
    e.y += e.dashVy * dt;
    if (state.bloodMist.length < 18 && Math.random() < 0.45 * dt * 60) {
      state.bloodMist.push({ x: e.x, y: e.y, r: 22, t: 1.9, m: 1.9 });
    }
    const hitEdge = e.x < 26 || e.x > W - 26 || e.y < 30 || e.y > H - 30;
    if (e.swoopT <= 0 || hitEdge) {
      e.state = 'stalk';
      e.cd = e.lvl === 1 ? 2.3 : 1.75;
      const angle = Math.atan2(p.y - e.y, p.x - e.x);
      for (let k = -1; k <= 1; k++) spawnEnemyBullet(e.x, e.y, angle + k * 0.28, 225, 6, '#ff2a55', 'red');
      burst(e.x, e.y, 8, '#ff2a55', 120);
    }
  }
  e.x = clamp(e.x, 24, W - 24);
  e.y = clamp(e.y, 30, H - 30);
  pushOutOfWalls(e, 16);
  if (distToPlayer(e) < CONTACT_RADIUS && e.mat <= 0) hurt(1, 'VAMPIRE FANGS! -1', e.x, e.y);
}

/** Spinning saw blade on a vertical track. */
function updateSaw(e, dt, speed) {
  e.y += e.vy * dt * speed;
  if (e.y < 50 || e.y > H - 50) e.vy *= -1;
  e.a += dt * 11;
  if (dist(state.player.x, state.player.y + 4, e.x, e.y) < 30) hurt(1, 'SAW BLADE! -1', e.x, e.y);
}

/** Invisible spawner that drops a time bomb on the player every few seconds. */
function updateBomber(e, dt) {
  e.cd -= dt;
  if (e.cd > 0) return;
  e.cd = 2.75;
  state.bombs.push({ x: state.player.x, y: state.player.y, t: 1.25, dead: 0 });
}

/** Orbits Malakor, faster as he weakens. */
function updateWraith(e, dt) {
  const boss = state.boss;
  if (!boss) return;
  e.a += dt * (1.35 + (1 - boss.hp / boss.max) * 1.25);
  const r = 115 + Math.sin(state.gameTime * 1.5) * 26;
  e.x = boss.x + Math.cos(e.a) * r;
  e.y = boss.y + Math.sin(e.a) * r;
  if (boss.dead) e.dead = 1;
  if (distToPlayer(e) < 30) hurt(1, 'SOUL WRAITH! -1', e.x, e.y);
}

const UPDATERS = {
  zombie: updateZombie,
  ghost: updateGhost,
  orb: updateOrb,
  wizard: updateWizard,
  vampire: updateVampire,
  saw: updateSaw,
  bomber: updateBomber,
  wraith: updateWraith,
};

export function updateEnemies(dt, speed) {
  for (const e of state.enemies) {
    e.a = (e.a || 0) + dt * 4.2; // shared animation phase
    if (e.mat > 0) e.mat -= dt; // materialising (harmless and invulnerable)
    if (e.fl > 0) e.fl -= dt; // hit flash
    UPDATERS[e.type](e, dt, speed);
  }
}
