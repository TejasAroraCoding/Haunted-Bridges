/**
 * Enemy death animations (zombie topples, ghost dissolves, wizard collapses into his robes) and bat swarms.
 */

import { state } from '../core/state.js';
import { clamp, lerp } from '../core/math.js';
import { ctx } from '../core/canvas.js';
import { drawGhost } from './enemies.js';
export function drawCorpses() {
  for (const c of state.corpses) {
    const k = clamp(c.t / c.dur, 0, 1);
    const pa = ctx.globalAlpha;
    if (c.kind === 'zombie') {
      const e = 1 - Math.pow(1 - k, 2);
      ctx.save();
      ctx.globalAlpha = pa * (1 - k * k);
      ctx.translate(c.x, c.y + 24);
      ctx.rotate(-c.f * e * 1.25);
      ctx.scale(c.f * 1.65, 1.65 * (1 - k * 0.35));
      ctx.fillStyle = '#6a9648';
      ctx.beginPath();
      ctx.arc(0, -22 + e * 4, 7, 0, 6.3);
      ctx.fill();
      ctx.fillStyle = '#344454';
      ctx.fillRect(-6, -15, 12, 14);
      ctx.strokeStyle = '#6a9648';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(5, -12);
      ctx.lineTo(14, -6 + e * 8);
      ctx.moveTo(-3, -1);
      ctx.lineTo(-5, 7);
      ctx.moveTo(3, -1);
      ctx.lineTo(5, 7);
      ctx.stroke();
      ctx.restore();
    } else if (c.kind === 'ghost') {
      const e = k * k;
      ctx.save();
      ctx.translate(c.x, c.y - e * 64);
      ctx.scale(1 - k * 0.5, 1 + k * 0.75);
      drawGhost(0, 0, c.a + c.t * 9, c.s, '#e2e8f0', '#7df9ff', 'cyan', (1 - k) * 0.9);
      ctx.restore();
    } else if (c.kind === 'vampire') {
      ctx.save();
      ctx.globalAlpha = pa * (1 - k);
      ctx.translate(c.x, c.y);
      ctx.scale(c.f * 1.25 * (1 - k * 0.7), 1.25 * (1 - k * 0.7));
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-9, -15);
      ctx.lineTo(9, -15);
      ctx.lineTo(13, 18);
      ctx.lineTo(-13, 18);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (c.kind === 'wizard') {
      const col = clamp(k / 0.45, 0, 1),
        ce = 1 - Math.pow(1 - col, 3);
      const fade = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      ctx.save();
      ctx.globalAlpha = pa * fade;
      ctx.translate(c.x, c.y);
      ctx.scale(c.f * 1.15, 1.15);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.ellipse(0, 40, 19 + ce * 8, 5, 0, 0, 6.3);
      ctx.fill();
      // Staff topples outward, its orb going dark
      ctx.save();
      ctx.translate(-14, 40);
      ctx.rotate(-ce * 1.45);
      ctx.strokeStyle = '#6b4423';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-2, -72);
      ctx.stroke();
      ctx.globalAlpha = pa * fade * (1 - ce * 0.8);
      ctx.fillStyle = '#7df9ff';
      ctx.beginPath();
      ctx.arc(-2, -76, 5 * (1 - ce * 0.4), 0, 6.3);
      ctx.fill();
      ctx.restore();
      ctx.globalAlpha = pa * fade;
      // Robe slumps into a pile
      const top = lerp(-8, 30, ce),
        wTop = lerp(9, 16, ce),
        wBot = lerp(19, 27, ce),
        bul = lerp(23, 29, ce);
      const gr = ctx.createLinearGradient(0, top, 0, 40);
      gr.addColorStop(0, '#7b3fe4');
      gr.addColorStop(1, '#2a1258');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.moveTo(-wTop, top);
      ctx.quadraticCurveTo(-bul, (top + 39) / 2, -wBot, 39);
      ctx.lineTo(wBot, 39);
      ctx.quadraticCurveTo(bul, (top + 39) / 2, wTop, top);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffcc44';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-wBot, 38);
      ctx.lineTo(wBot, 38);
      ctx.stroke();
      // Head and beard vanish as he sinks
      if (ce < 1) {
        ctx.globalAlpha = pa * fade * (1 - ce);
        ctx.fillStyle = '#e8b894';
        ctx.beginPath();
        ctx.arc(0, -14 + ce * 40, 6.8, 0, 6.3);
        ctx.fill();
        ctx.fillStyle = '#eee';
        ctx.beginPath();
        ctx.moveTo(-6, -11 + ce * 40);
        ctx.lineTo(6, -11 + ce * 40);
        ctx.lineTo(0, 18 + ce * 24);
        ctx.closePath();
        ctx.fill();
      }
      // Hat slides off and tips over onto the pile
      ctx.globalAlpha = pa * fade;
      ctx.save();
      ctx.translate(lerp(0, 18, ce), lerp(-22, 30, ce));
      ctx.rotate(ce * 1.3);
      ctx.fillStyle = '#3a1d80';
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 4.8, 0, 0, 6.3);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-10, -1);
      ctx.quadraticCurveTo(-6, -17, 9, -30);
      ctx.quadraticCurveTo(7, -15, 10, -1);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.restore();
    }
    ctx.globalAlpha = pa;
  }
}

export function drawBats(list = state.bats) {
  for (const b of list) {
    const k = b.t / b.m,
      a = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
    const flap = Math.sin(b.ph + b.t * 32) * 7;
    const pa = ctx.globalAlpha;
    ctx.save();
    ctx.globalAlpha = pa * clamp(a, 0, 1) * (b.al || 1);
    ctx.translate(b.x, b.y);
    ctx.scale(b.s * (b.vx < 0 ? -1 : 1), b.s);
    ctx.fillStyle = '#1a0612';
    ctx.strokeStyle = 'rgba(255,42,85,0.55)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-6, -3 - flap);
    ctx.lineTo(-12, -1 - flap * 0.6);
    ctx.lineTo(-9, 2);
    ctx.lineTo(-5, 1);
    ctx.closePath();
    ctx.moveTo(0, 0);
    ctx.lineTo(6, -3 - flap);
    ctx.lineTo(12, -1 - flap * 0.6);
    ctx.lineTo(9, 2);
    ctx.lineTo(5, 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 0.5, 2.6, 3.6, 0, 0, 6.3);
    ctx.fill();
    ctx.fillStyle = '#ff2a55';
    ctx.fillRect(-1.7, -1.4, 1.1, 1.1);
    ctx.fillRect(0.6, -1.4, 1.1, 1.1);
    ctx.restore();
    ctx.globalAlpha = pa;
  }
}
