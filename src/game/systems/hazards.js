/**
 * Stage hazards: blood mist, void lasers, time bombs, enemy bolts, wall cannons and spike traps.
 */

import { state } from '../../core/state.js';
import { playSfx } from '../../audio/audio.js';
import { H, W } from '../../core/constants.js';
import { compact, dist } from '../../core/math.js';
import { insideRect } from '../collision.js';
import { addShockwave, burst, glowPuff } from '../effects.js';
import { hurt } from '../player.js';
import { spawnEnemyBullet } from '../spawn.js';
import { addShake } from '../camera.js';

const LASER_ACTIVE_TIME = 0.45; // how long a laser burns after its warning ends
const BOMB_RADIUS = 65;
const SPIKE_CYCLE = 2.3;

export function updateBloodMist(dt) {
  for (const m of state.bloodMist) {
    m.t -= dt;
    if (dist(state.player.x, state.player.y + 8, m.x, m.y) < m.r - 4) hurt(1, 'BLOOD MIST! -1', m.x, m.y);
  }
  compact(state.bloodMist, m => m.t > 0);
}

export function updateLasers(dt) {
  const p = state.player;
  for (const laser of state.lasers) {
    laser.t -= dt;
    if (laser.t >= 0 || laser.t <= -LASER_ACTIVE_TIME) continue;
    const hit = laser.vert ? Math.abs(p.x - laser.x) < laser.w / 2 + 10 : Math.abs(p.y - laser.y) < laser.h / 2 + 10;
    if (hit) hurt(1, 'VOID LASER! -1');
  }
  compact(state.lasers, laser => laser.t > -LASER_ACTIVE_TIME);
}

export function updateBombs(dt) {
  const p = state.player;
  for (const bomb of state.bombs) {
    bomb.t -= dt;
    if (bomb.t > 0 || bomb.dead) continue;
    bomb.dead = 1;
    burst(bomb.x, bomb.y, 22, '#fa3', 220);
    glowPuff(bomb.x, bomb.y, 'orange', 34, 0.4);
    addShockwave(bomb.x, bomb.y, 70, '#ff8822', 0.32);
    const d = dist(p.x, p.y, bomb.x, bomb.y);
    addShake(0.26, d < 140 && d > 1 ? Math.atan2(p.y - bomb.y, p.x - bomb.x) : undefined);
    playSfx(80, 0.45, 'sawtooth', 0.16, -50);
    if (d < BOMB_RADIUS) hurt(1, 'ARCANE BOMB! -1', bomb.x, bomb.y);
  }
  compact(state.bombs, bomb => !bomb.dead);
}

export function updateEnemyBullets(dt) {
  for (const b of state.enemyBullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.rot += dt * 5;
    if (dist(b.x, b.y, state.player.x, state.player.y) < b.r + 9) {
      b.dead = 1;
      hurt(1, 'DARK BOLT! -1', b.x - b.vx, b.y - b.vy);
    }
    if (b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20) b.dead = 1;
    if (b.free) continue;
    for (const wall of state.walls) {
      if (insideRect(b.x, b.y, wall)) {
        b.dead = 1;
        burst(b.x, b.y, 4, '#7df9ff', 80);
      }
    }
  }
  compact(state.enemyBullets, b => !b.dead);
}

/** Sentient walls open an eye, then fire a slow bolt that ignores walls. */
export function updateWallCannons(dt, speed) {
  const p = state.player;
  for (const wall of state.walls) {
    wall.cd -= dt * speed;
    wall.eye = wall.cd < 0.85;
    if (wall.cd > 0) continue;
    wall.cd = 4.2;
    const cx = wall.x + wall.w / 2;
    const cy = wall.y + wall.h / 2;
    if (spawnEnemyBullet(cx, cy, Math.atan2(p.y - cy, p.x - cx), 138, 7, '#7df9ff', 'cyan', true)) {
      playSfx(260, 0.22, 'sine', 0.05, -120);
    }
  }
}

/** Spikes cycle: up (deadly) → down → amber warning → up. */
export function updateSpikeTraps() {
  const p = state.player;
  const feetY = p.y + 22;
  for (const trap of state.spikeTraps) {
    const t = (state.gameTime + trap.ph) % SPIKE_CYCLE;
    trap.on = t < 0.88 && t > 0;
    trap.warn = t >= 1.55;
    const overTrap = p.x > trap.x - 8 && p.x < trap.x + trap.w + 8 && feetY > trap.y - 4 && feetY < trap.y + trap.h + 6;
    if (trap.on && overTrap) hurt(1, 'SPIKE TRAP! -1', trap.x + trap.w / 2, trap.y + trap.h / 2);
  }
}
