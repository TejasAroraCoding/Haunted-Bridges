/**
 * Player timers and movement (keyboard / left stick, dash momentum, walls and screen bounds).
 */

import { state } from '../../core/state.js';
import { H, W } from '../../core/constants.js';
import { clamp, rand } from '../../core/math.js';
import { readMoveInput } from '../../input/input.js';
import { pushOutOfWalls } from '../collision.js';
import { spawnParticle } from '../effects.js';

const ACCELERATION = 16;
const HASTE_SPEED_MUL = 1.28;

export function updatePlayerTimers(dt) {
  const p = state.player;
  if (state.comboT > 0) {
    state.comboT -= dt;
    if (state.comboT <= 0) state.combo = 0;
  }
  if (p.rapidT > 0) p.rapidT -= dt;
  if (p.speedT > 0) p.speedT -= dt;
  if (p.dashCd > 0) p.dashCd -= dt;
  if (p.hitFl > 0) p.hitFl -= dt;
}

export function updatePlayerMovement(dt, hero) {
  const p = state.player;
  const input = readMoveInput();
  const magnitude = Math.min(1, Math.hypot(input.x, input.y));
  const len = Math.hypot(input.x, input.y) || 1;
  const speed = hero.spd * (p.speedT > 0 ? HASTE_SPEED_MUL : 1);

  if (p.dashT > 0) {
    // Dashing keeps its burst velocity and leaves afterimages.
    p.dashT -= dt;
    if (state.dashGhosts.length < 12) state.dashGhosts.push({ x: p.x, y: p.y, t: 0.22, m: 0.22, c: hero.glow });
  } else {
    const k = Math.min(1, dt * ACCELERATION);
    p.vx += ((input.x / len) * speed * magnitude - p.vx) * k;
    p.vy += ((input.y / len) * speed * magnitude - p.vy) * k;
  }
  p.x += p.vx * dt;
  p.y += p.vy * dt;

  if (magnitude > 0.1) {
    p.step += dt * 13;
    if (Math.random() < 0.35 * (dt * 60))
      spawnParticle(p.x, p.y + 14, rand(-18, 18), rand(-18, 18), 0.35, hero.glow, 2);
  }
  if (Math.abs(input.x) > 0.05) p.fx = input.x > 0 ? 1 : -1;

  p.x = clamp(p.x, 18, W - 18);
  p.y = clamp(p.y, 22, H - 22);
  pushOutOfWalls(p, 15);
  pushOutOfWalls(p, 15); // second pass resolves corners between two walls
  p.inv -= dt;
  p.cd -= dt;
}
