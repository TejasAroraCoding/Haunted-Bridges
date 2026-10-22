/**
 * Camera shake: "trauma" adds smooth noise-based wobble, and directional hits add a spring-loaded kick
 * that overshoots slightly and settles. Respects the Combat Screen Shake setting.
 */

import { state } from '../core/state.js';
import { ctx } from '../core/canvas.js';
import { H, W } from '../core/constants.js';
import { settings } from '../core/settings.js';

const KICK_STRENGTH = 520;
const SPRING_STIFFNESS = 260;
const SPRING_DAMPING = 16;
const TRAUMA_DECAY = 1.5; // per second

let trauma = 0; // 0..1, wobble amount (squared when applied)
let kickX = 0;
let kickY = 0;
let kickVX = 0;
let kickVY = 0;

/** Adds shake; with `angle` the camera is also kicked in that direction. */
export function addShake(amount, angle) {
  if (!settings.shake) return;
  trauma = Math.min(1, trauma + amount);
  if (angle !== undefined)
    kickCamera(Math.cos(angle) * amount * KICK_STRENGTH, Math.sin(angle) * amount * KICK_STRENGTH);
}

/** Gives the camera an impulse (used for heavy-weapon recoil). */
export function kickCamera(vx, vy) {
  if (!settings.shake) return;
  kickVX += vx;
  kickVY += vy;
}

export function updateShake(dt) {
  trauma = Math.max(0, trauma - dt * TRAUMA_DECAY);
  // Sub-stepped damped spring so it stays stable at any frame rate.
  let remaining = Math.min(dt, 0.1);
  while (remaining > 1e-6) {
    const h = Math.min(remaining, 1 / 120);
    kickVX += (-SPRING_STIFFNESS * kickX - SPRING_DAMPING * kickVX) * h;
    kickVY += (-SPRING_STIFFNESS * kickY - SPRING_DAMPING * kickVY) * h;
    kickX += kickVX * h;
    kickY += kickVY * h;
    remaining -= h;
  }
}

/** Applies the current shake to the canvas transform (call inside ctx.save/restore). */
export function applyShake() {
  if (!settings.shake) return;
  const t = state.realTime;
  const wobble = trauma * trauma * 12;
  const ox = (Math.sin(t * 41) * 0.6 + Math.sin(t * 23 + 1.3) * 0.4) * wobble + kickX;
  const oy = (Math.sin(t * 37 + 0.7) * 0.6 + Math.sin(t * 19 + 2.1) * 0.4) * wobble + kickY;
  const rot = Math.sin(t * 29) * 0.016 * trauma * trauma;
  ctx.translate(W / 2 + ox, H / 2 + oy);
  ctx.rotate(rot);
  ctx.translate(-W / 2, -H / 2);
}
