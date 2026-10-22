/**
 * Drawing transient effects: afterimages, shockwaves, particles, soul orbs, hit indicators and screen flashes.
 */

import { state } from '../core/state.js';
import { ctx } from '../core/canvas.js';
import { clamp, lerp } from '../core/math.js';
import { drawGlow, glowSprites, lowHpVignetteLayer } from './sprites.js';
import { H, W } from '../core/constants.js';
/** Afterimages left by a phase dash. */
export function drawDashGhosts() {
  for (const gh of state.dashGhosts) {
    ctx.globalAlpha = (gh.t / gh.m) * 0.42;
    ctx.fillStyle = gh.c;
    ctx.beginPath();
    ctx.arc(gh.x, gh.y, 14, 0, 6.3);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** Expanding shockwave rings. */
export function drawShockwaves() {
  for (const s of state.shockwaves) {
    ctx.globalAlpha = Math.max(0, s.t / s.m);
    ctx.strokeStyle = s.c;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, 6.3);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/** Particles: squares for debris, glow sprites for embers and puffs. */
export function drawParticles() {
  for (const p of state.particles) {
    const a = clamp(p.l / p.m, 0, 1);
    if (p.k === 1) {
      ctx.globalAlpha = a * 0.7;
      ctx.drawImage(glowSprites[p.gl] || glowSprites.cyan, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    } else {
      ctx.globalAlpha = a;
      ctx.fillStyle = p.c;
      ctx.fillRect(p.x, p.y, p.r, p.r);
    }
  }
  ctx.globalAlpha = 1;
}

/** Soul orbs flying from slain foes toward the HUD. */
export function drawSoulOrbs() {
  for (const s of state.soulOrbs) drawSoul(s);
}

function drawSoul(s) {
  const k = clamp(s.t / s.dur, 0, 1);
  const e = k * k * (3 - 2 * k);
  const tx = W - 300,
    ty = 22;
  const x = lerp(s.x0, tx, e) + Math.sin(k * Math.PI) * 40 * s.side;
  const y = lerp(s.y0, ty, e) - Math.sin(k * Math.PI) * 60;
  drawGlow(x, y, 16, 'white', 0.9 * (1 - k * 0.5));
  drawGlow(
    x,
    y,
    9,
    s.c === '#ffdd55'
      ? 'gold'
      : s.c === '#ff2a55'
        ? 'red'
        : s.c === '#7dff88'
          ? 'green'
          : s.c === '#7df9ff'
            ? 'cyan'
            : 'purple',
    0.9
  );
}

/** Hit direction: an arc around the hero and a glow on the screen edge facing the attacker. */
export function drawHitIndicators() {
  for (const hd of state.hitIndicators) {
    const k = clamp(hd.t / hd.m, 0, 1);
    const rgb = hd.c === 'cyan' ? '125,249,255' : '255,42,85';
    const cx = Math.cos(hd.a),
      cy = Math.sin(hd.a);
    const tx = cx > 0.001 ? (W - state.player.x) / cx : cx < -0.001 ? -state.player.x / cx : 1e9;
    const ty = cy > 0.001 ? (H - state.player.y) / cy : cy < -0.001 ? -state.player.y / cy : 1e9;
    const tt = Math.min(tx, ty);
    drawGlow(state.player.x + cx * tt, state.player.y + cy * tt, 160, hd.c === 'cyan' ? 'cyan' : 'red', 0.6 * k);
    ctx.save();
    ctx.translate(state.player.x, state.player.y);
    const rad = 48 + (1 - k) * 12;
    ctx.strokeStyle = `rgba(${rgb},${0.9 * k})`;
    ctx.lineWidth = 3 + 5 * k;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, rad, hd.a - 0.6, hd.a + 0.6);
    ctx.stroke();
    ctx.rotate(hd.a);
    ctx.fillStyle = `rgba(${rgb},${k})`;
    ctx.beginPath();
    ctx.moveTo(rad + 20, 0);
    ctx.lineTo(rad + 8, -8);
    ctx.lineTo(rad + 11, 0);
    ctx.lineTo(rad + 8, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

/** Full-screen effects: low-health pulse, arrival beam, hurt flash, lightning. */
export function drawScreenFlashes() {
  if (state.player.hp <= 1 && state.player.dying <= 0) {
    ctx.globalAlpha = 0.45 + 0.3 * Math.sin(state.realTime * 5);
    ctx.drawImage(lowHpVignetteLayer.c, 0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  if (state.arrivalTimer > 0) {
    const p = state.arrivalTimer / 1.15;
    ctx.fillStyle = `rgba(125,249,255,${p * 0.55})`;
    ctx.fillRect(state.player.x - 26 * p, 0, 52 * p, H);
    ctx.fillStyle = `rgba(255,255,255,${p * 0.85})`;
    ctx.fillRect(state.player.x - 8 * p, 0, 16 * p, H);
  }
  if (state.hurtFlash > 0) {
    ctx.fillStyle = `rgba(255,20,50,${state.hurtFlash})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (state.lightningFlash > 0) {
    ctx.fillStyle = `rgba(220,240,255,${state.lightningFlash * 0.45})`;
    ctx.fillRect(0, 0, W, H);
  }
}
