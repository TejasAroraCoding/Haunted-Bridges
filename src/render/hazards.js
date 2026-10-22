/**
 * Drawing stage hazards: blood mist, sentient walls, spike traps, time bombs, void lasers and enemy bolts.
 */

import { state } from '../core/state.js';
import { ctx } from '../core/canvas.js';
import { drawGlow } from './sprites.js';
import { F_MONO, H, W } from '../core/constants.js';
/** Blood-mist pools left by vampire swoops. */
export function drawBloodMist() {
  for (const m of state.bloodMist) {
    const al = Math.min(1, m.t / m.m) * 0.42;
    ctx.fillStyle = `rgba(225,29,72,${al})`;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.r, 0, 6.3);
    ctx.fill();
    ctx.strokeStyle = `rgba(255,100,130,${al * 1.4})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

/** Sentient Bastion walls; the eyes open before they fire. */
export function drawWalls() {
  for (const b of state.walls) {
    ctx.fillStyle = '#181226';
    ctx.strokeStyle = b.eye ? '#7df9ff' : '#8a6acc';
    ctx.lineWidth = 2;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    if (b.eye) drawGlow(b.x + b.w / 2, b.y + b.h / 2 - 4, 42, 'cyan', 0.45);
    const blinkH = b.eye ? 8.5 + Math.sin(state.realTime * 14) * 0.8 : 4;
    ctx.fillStyle = b.eye ? '#7df9ff' : '#6e5c94';
    ctx.beginPath();
    ctx.ellipse(b.x + b.w / 2 - 14, b.y + b.h / 2 - 4, 6, blinkH, 0, 0, 6.3);
    ctx.ellipse(b.x + b.w / 2 + 14, b.y + b.h / 2 - 4, 6, blinkH, 0, 0, 6.3);
    ctx.fill();
    ctx.fillStyle = '#b9a6e8';
    ctx.font = `700 10px ${F_MONO}`;
    ctx.textAlign = 'center';
    ctx.fillText('SENTIENT BASTION', b.x + b.w / 2, b.y + b.h - 8);
  }
}

/** Spike traps: grey (down), amber (about to rise), red (deadly). */
export function drawSpikeTraps() {
  for (const s of state.spikeTraps) {
    const n = 4;
    ctx.fillStyle = s.on ? 'rgba(255,40,55,0.34)' : s.warn ? 'rgba(255,175,40,0.32)' : 'rgba(110,115,140,0.22)';
    ctx.fillRect(s.x - 4, s.y - 4, s.w + 8, s.h + 8);
    ctx.strokeStyle = s.on ? '#ff4d6d' : s.warn ? '#facc15' : '#64748b';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(s.x - 4, s.y - 4, s.w + 8, s.h + 8);
    for (let i = 0; i < n; i++) {
      const bx = s.x + (i * s.w) / n;
      ctx.fillStyle = s.on ? '#ff4d6d' : s.warn ? '#fbbf24' : '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(bx, s.y + s.h);
      ctx.lineTo(bx + s.w / n / 2, s.on ? s.y - 4 : s.y + s.h - 10);
      ctx.lineTo(bx + s.w / n, s.y + s.h);
      ctx.fill();
    }
  }
}

/** Time bombs with their shrinking blast radius. */
export function drawBombs() {
  for (const b of state.bombs) {
    const f = 1 - b.t / 1.25;
    ctx.strokeStyle = `rgba(255,${Math.round(130 - f * 100)},40,${0.4 + f * 0.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 65 * f + 8, 0, 6.3);
    ctx.stroke();
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(b.x, b.y, 65, 0, 6.3);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#18181b';
    ctx.strokeStyle = '#fb923c';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 11, 0, 6.3);
    ctx.fill();
    ctx.stroke();
    drawGlow(b.x, b.y - 11, 6 + f * 6, 'orange', 0.4 + f * 0.5);
  }
}

/** Void lasers: dashed warning lane, then the beam. */
export function drawLasers() {
  for (const z of state.lasers) {
    if (!z.vert) {
      if (z.t > 0) {
        ctx.fillStyle = `rgba(255,60,80,${0.14 + 0.1 * Math.sin(state.realTime * 28)})`;
        ctx.fillRect(0, z.y - z.h / 2, W, z.h);
        ctx.strokeStyle = '#ff4d6d';
        ctx.setLineDash([10, 8]);
        ctx.strokeRect(0, z.y - z.h / 2, W, z.h);
        ctx.setLineDash([]);
      } else {
        ctx.fillStyle = 'rgba(255,42,85,0.45)';
        ctx.fillRect(0, z.y - z.h / 2 - 6, W, z.h + 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, z.y - z.h / 2, W, z.h);
      }
    } else {
      if (z.t > 0) {
        ctx.fillStyle = `rgba(255,60,80,${0.14 + 0.1 * Math.sin(state.realTime * 28)})`;
        ctx.fillRect(z.x - z.w / 2, 0, z.w, H);
        ctx.strokeStyle = '#ff4d6d';
        ctx.setLineDash([10, 8]);
        ctx.strokeRect(z.x - z.w / 2, 0, z.w, H);
        ctx.setLineDash([]);
      } else {
        ctx.fillStyle = 'rgba(255,42,85,0.45)';
        ctx.fillRect(z.x - z.w / 2 - 6, 0, z.w + 12, H);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(z.x - z.w / 2, 0, z.w, H);
      }
    }
  }
}

/** Enemy bolts with comet tails. */
export function drawEnemyBullets() {
  for (const b of state.enemyBullets) {
    const sp = Math.hypot(b.vx, b.vy) || 1;
    const tx = b.x - (b.vx / sp) * b.r * 3.2,
      ty = b.y - (b.vy / sp) * b.r * 3.2;
    ctx.strokeStyle = b.c;
    ctx.lineWidth = b.r * 0.9;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.globalAlpha = 1;
    drawGlow(b.x, b.y, b.r * 3.2, b.gKey || 'purple', 0.65);
    ctx.fillStyle = b.c;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r + 2, 0, 6.3);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(b.x + Math.cos(b.rot) * 1, b.y + Math.sin(b.rot) * 1, b.r - 1.5, 0, 6.3);
    ctx.fill();
  }
}
