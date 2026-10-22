/**
 * Drawing coins, healing hearts and power-ups.
 */

import { state } from '../core/state.js';
import { drawGlow } from './sprites.js';
import { ctx } from '../core/canvas.js';
/** Spinning coins with a sparkle and a streak when magnetised. */
export function drawCoins() {
  for (const c of state.coins) {
    if (c.got) continue;
    const sc = Math.abs(Math.cos(state.realTime * 3.2 + c.a));
    const bob = Math.sin(state.realTime * 3 + c.a) * 2;
    drawGlow(c.x, c.y + bob, c.pull ? 30 : 22, 'gold', c.pull ? 0.7 : 0.45);
    if (c.pull) {
      const pdx = state.player.x - c.x,
        pdy = state.player.y + 4 - c.y,
        pl = Math.hypot(pdx, pdy) || 1;
      ctx.strokeStyle = 'rgba(253,224,71,0.45)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(c.x, c.y + bob);
      ctx.lineTo(c.x - (pdx / pl) * 16, c.y + bob - (pdy / pl) * 16);
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(c.x, c.y + bob);
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.ellipse(0, 0, 10 * Math.max(0.28, sc), 10, 0, 0, 6.3);
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    const sp = (state.realTime * 1.3 + c.a) % 1;
    if (sp < 0.2) {
      const k = sp / 0.2;
      drawGlow(c.x + 8, c.y - 8 + bob, 6 * (1 - k) + 2, 'white', 0.9 * (1 - k));
    }
  }
}

/** Healing heart pickups. */
export function drawHearts() {
  for (const hi of state.hearts) {
    if (hi.got) continue;
    const hy = hi.y + Math.sin(state.realTime * 3.2) * 4;
    const hs = 1 + Math.sin(state.realTime * 6) * 0.08;
    drawGlow(hi.x, hy, 28, 'red', 0.5);
    ctx.save();
    ctx.translate(hi.x, hy);
    ctx.scale(hs, hs);
    ctx.fillStyle = '#fb7185';
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.bezierCurveTo(-18, -4, -10, -18, 0, -7);
    ctx.bezierCurveTo(10, -18, 18, -4, 0, 8);
    ctx.fill();
    ctx.restore();
  }
}

/** Rotating power-up crystals. */
export function drawPowerUps() {
  for (const p of state.powerUps) {
    if (p.got) continue;
    const py = p.y + Math.sin(p.a) * 4;
    const gKey = p.kind === 'rapid' ? 'gold' : p.kind === 'shield' ? 'cyan' : 'green';
    drawGlow(p.x, py, 30 + Math.sin(p.a * 2) * 4, gKey, 0.55);
    ctx.save();
    ctx.translate(p.x, py);
    ctx.rotate(state.realTime * 1.6);
    ctx.fillStyle = p.kind === 'rapid' ? '#facc15' : p.kind === 'shield' ? '#38bdf8' : '#4ade80';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(11, 0);
    ctx.lineTo(0, 11);
    ctx.lineTo(-11, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
