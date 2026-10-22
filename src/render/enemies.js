/**
 * Drawing enemies and their health bars. Death animations live in render/death-animations.js.
 */

import { state } from '../core/state.js';
import { ctx } from '../core/canvas.js';
import { F_DISPLAY, F_MONO, H, MATERIALIZE_TIME } from '../core/constants.js';
import { clamp } from '../core/math.js';
import { drawGlow } from './sprites.js';

export function drawZombie(e) {
  const pa = ctx.globalAlpha;
  const alpha = e.mat > 0 ? clamp(1 - e.mat / MATERIALIZE_TIME, 0, 1) : 1;
  ctx.globalAlpha = pa * alpha;
  drawGlow(e.x, e.y, 28, 'green', 0.25);
  ctx.save();
  ctx.translate(e.x, e.y + Math.abs(Math.sin(e.a)) * -2.5); // shamble bounce
  const dx = state.player.x < e.x ? -1 : 1;
  const hit = e.fl > 0 ? 1.14 : 1.0;
  ctx.scale(dx * 1.65 * hit, 1.65 / hit);
  ctx.fillStyle = e.fl > 0 ? '#ffffff' : '#6a9648';
  ctx.beginPath();
  ctx.arc(0, -12, 7, 0, 6.3);
  ctx.fill();
  ctx.fillStyle = e.fl > 0 ? '#d8f8ff' : '#344454';
  ctx.fillRect(-6, -5, 12, 14);
  ctx.strokeStyle = e.fl > 0 ? '#ffffff' : '#6a9648';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  const w = Math.sin(e.a * 2) * 3;
  ctx.beginPath();
  ctx.moveTo(5, -2);
  ctx.lineTo(17, -4 + w);
  ctx.moveTo(5, 1);
  ctx.lineTo(17, 2 - w);
  ctx.moveTo(-3, 9);
  ctx.lineTo(-5 + w, 18 - Math.abs(w) * 0.2);
  ctx.moveTo(3, 9);
  ctx.lineTo(5 - w, 18);
  ctx.stroke();
  ctx.fillStyle = '#ff2a55';
  ctx.fillRect(2, -14, 2.2, 2.2);
  ctx.restore();
  const ratio = e.hp / e.maxHp;
  const hc = ratio > 0.55 ? '#4ade80' : ratio > 0.28 ? '#facc15' : '#fb7185';
  drawEntityBar(e.x, e.y - 34, 34, 4.5, e.hp, e.maxHp, e.dispHp, hc, e.lv > 1 ? `L${e.lv}` : '');
  ctx.globalAlpha = pa;
}

export function drawGhost(x, y, a, s = 1, c = '#eef', eye = '#e22', gKey = 'cyan', alphaMul = 1) {
  const pa = ctx.globalAlpha;
  ctx.globalAlpha = pa * alphaMul;
  drawGlow(x, y, 28 * s, gKey, 0.28);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = c;
  ctx.globalAlpha = pa * alphaMul * 0.88;
  ctx.beginPath();
  ctx.arc(0, -4, 15, Math.PI, 0);
  ctx.lineTo(15, 16);
  for (let i = 0; i < 4; i++) {
    ctx.lineTo(15 - i * 7.5 - 3.7, 12 + Math.sin(a * 2 + i) * 4 + 4);
    ctx.lineTo(15 - (i + 1) * 7.5, 16);
  }
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = pa * alphaMul;
  ctx.fillStyle = eye;
  ctx.beginPath();
  ctx.arc(-5, -5, 3.3, 0, 6.3);
  ctx.arc(5, -5, 3.3, 0, 6.3);
  ctx.fill();
  ctx.fillStyle = '#070510';
  ctx.beginPath();
  ctx.ellipse(0, 5, 3.8, 4.8, 0, 0, 6.3);
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = pa;
}

export function drawWizard(e) {
  const pa = ctx.globalAlpha;
  const alpha = e.mat > 0 ? clamp(1 - e.mat / MATERIALIZE_TIME, 0, 1) : 1;
  ctx.globalAlpha = pa * alpha;
  const f = state.player.x < e.x ? -1 : 1,
    fl = e.fl > 0,
    bob = Math.sin(state.realTime * 2.2) * 2,
    swv = Math.sin(state.realTime * 3) * 2;
  const charge = clamp(1 - e.cd / 0.5, 0, 1); // ramps up before firing
  drawGlow(e.x, e.y, 44 + charge * 16, 'purple', 0.38 + charge * 0.4);
  ctx.save();
  ctx.translate(e.x, e.y + bob);
  ctx.scale(f * 1.15, 1.15);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 40 - bob, 19, 5, 0, 0, 6.3);
  ctx.fill();
  const gr = ctx.createLinearGradient(0, -8, 0, 40);
  gr.addColorStop(0, fl ? '#fff' : '#7b3fe4');
  gr.addColorStop(1, fl ? '#ddd' : '#2a1258');
  ctx.fillStyle = gr;
  ctx.beginPath();
  ctx.moveTo(-9, -8);
  ctx.quadraticCurveTo(-23, 16 + swv, -19, 39);
  ctx.lineTo(19, 39);
  ctx.quadraticCurveTo(23, 16 - swv, 9, -8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffcc44';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-19, 38);
  ctx.lineTo(19, 38);
  ctx.stroke();
  ctx.strokeStyle = '#6b4423';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-16, -32);
  ctx.lineTo(-14, 40);
  ctx.stroke();
  ctx.fillStyle = '#7df9ff';
  ctx.beginPath();
  ctx.arc(-16, -36, 5 + Math.sin(state.realTime * 6) + charge * 3, 0, 6.3);
  ctx.fill();
  ctx.fillStyle = '#e8b894';
  ctx.beginPath();
  ctx.arc(0, -14, 6.8, 0, 6.3);
  ctx.fill();
  ctx.fillStyle = '#7df9ff';
  ctx.fillRect(-4, -16, 2.4, 2);
  ctx.fillRect(1.5, -16, 2.4, 2);
  ctx.fillStyle = '#eee';
  ctx.beginPath();
  ctx.moveTo(-6, -11);
  ctx.lineTo(6, -11);
  ctx.quadraticCurveTo(7, 6, 0, 21 + swv);
  ctx.quadraticCurveTo(-7, 6, -6, -11);
  ctx.fill();
  ctx.fillStyle = fl ? '#fff' : '#3a1d80';
  ctx.beginPath();
  ctx.ellipse(0, -22, 16, 4.8, 0, 0, 6.3);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-10, -23);
  ctx.quadraticCurveTo(-6, -39, 9 + swv, -52);
  ctx.quadraticCurveTo(7, -37, 10, -23);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Charging sigil above the staff
  if (charge > 0.01) {
    ctx.strokeStyle = `rgba(192,132,252,${charge * 0.8})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(e.x - 16 * f, e.y - 36 + bob, 9 + charge * 10, 0, 6.3);
    ctx.stroke();
  }
  const castPct = 1 - Math.max(0, e.cd) / (e.maxCd || 1.5);
  drawEntityBar(e.x, e.y - 64, 46, 5, e.hp, e.maxHp, e.dispHp, '#c084fc', `ARCANE LV${e.lvl}`, castPct);
  ctx.globalAlpha = pa;
}

export function drawVampire(e) {
  const pa = ctx.globalAlpha;
  const alpha = e.mat > 0 ? clamp(1 - e.mat / MATERIALIZE_TIME, 0, 1) : 1;
  ctx.globalAlpha = pa * alpha;
  if (e.state === 'lock') {
    ctx.save();
    ctx.strokeStyle = `rgba(255,42,85,${0.45 + 0.35 * Math.sin(state.realTime * 28)})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(e.x, e.y);
    ctx.lineTo(e.tx, e.ty);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(e.tx, e.ty, 18 + Math.sin(state.realTime * 20) * 3, 0, 6.3);
    ctx.stroke();
    ctx.font = `700 10px ${F_DISPLAY}`;
    ctx.fillStyle = '#ff4d6d';
    ctx.textAlign = 'center';
    ctx.fillText('⚠ SWOOP LOCK', e.tx, e.ty - 24);
    ctx.restore();
  }
  drawGlow(e.x, e.y, 40, 'red', e.state === 'swoop' ? 0.65 : 0.35);
  const f = state.player.x < e.x ? -1 : 1,
    fl = e.fl > 0;
  const flap = Math.sin(state.realTime * (e.state === 'swoop' ? 22 : 11)) * 11;
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.scale(f * 1.25, 1.25);
  ctx.fillStyle = fl ? '#ffffff' : '#260919';
  ctx.strokeStyle = '#ff2a55';
  ctx.lineWidth = 1.3;
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.scale(s, 1);
    ctx.beginPath();
    ctx.moveTo(4, -6);
    ctx.lineTo(22, -18 + flap);
    ctx.lineTo(28, -4 + flap * 0.6);
    ctx.lineTo(19, 2 + flap * 0.3);
    ctx.lineTo(12, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = fl ? '#fff' : '#140812';
  ctx.beginPath();
  ctx.moveTo(-9, -15);
  ctx.lineTo(9, -15);
  ctx.lineTo(13, 18);
  ctx.lineTo(-13, 18);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#a81339';
  ctx.beginPath();
  ctx.moveTo(-6, -8);
  ctx.lineTo(6, -8);
  ctx.lineTo(8, 17);
  ctx.lineTo(-8, 17);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e2d8ea';
  ctx.beginPath();
  ctx.arc(0, -13, 6.2, 0, 6.3);
  ctx.fill();
  ctx.fillStyle = '#ff1e4d';
  ctx.fillRect(-3.6, -14.5, 2.4, 2.2);
  ctx.fillRect(1.2, -14.5, 2.4, 2.2);
  ctx.restore();
  const swoopPct = e.state === 'stalk' ? 1 - Math.max(0, e.cd) / (e.lvl === 1 ? 2.3 : 1.75) : 1;
  drawEntityBar(e.x, e.y - 38, 42, 4.5, e.hp, e.maxHp, e.dispHp, '#fb7185', `VAMP L${e.lvl}`, swoopPct);
  ctx.globalAlpha = pa;
}

export function drawEntityBar(x, y, w, h, hp, maxHp, dispHp, color, label = '', subPct = -1) {
  const bx = x - w / 2;
  ctx.fillStyle = 'rgba(6,5,14,0.88)';
  ctx.fillRect(bx - 1, y - 1, w + 2, h + 2 + (subPct >= 0 ? 3 : 0));
  const trailW = clamp(dispHp / maxHp, 0, 1) * w;
  if (trailW > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.fillRect(bx, y, trailW, h);
  }
  const curW = clamp(hp / maxHp, 0, 1) * w;
  if (curW > 0) {
    ctx.fillStyle = color;
    ctx.fillRect(bx, y, curW, h);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  const segs = Math.min(8, Math.max(2, Math.round(maxHp)));
  for (let i = 1; i < segs; i++) ctx.fillRect(bx + (i / segs) * w, y, 1, h);
  if (subPct >= 0) {
    ctx.fillStyle = '#142238';
    ctx.fillRect(bx, y + h + 1, w, 2);
    ctx.fillStyle = '#7df9ff';
    ctx.fillRect(bx, y + h + 1, clamp(subPct, 0, 1) * w, 2);
  }
  if (label) {
    ctx.font = `700 9px ${F_MONO}`;
    ctx.fillStyle = '#ffe8b3';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y - 3);
  }
}

/** Every enemy, dispatched by type. */
export function drawEnemies() {
  for (const e of state.enemies) {
    if (e.type === 'zombie') {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.ellipse(e.x, e.y + 27, 16, 4.5, 0, 0, 6.3);
      ctx.fill();
      drawZombie(e);
    } else if (e.type === 'ghost') {
      const hitG = e.fl > 0;
      const ga = e.mat > 0 ? clamp(1 - e.mat / MATERIALIZE_TIME, 0, 1) : 1;
      drawGhost(
        e.x,
        e.y,
        e.a,
        (state.stageIndex === 3 ? 2.1 : 1.85) * (hitG ? 1.1 : 1),
        hitG ? '#ffffff' : '#e2e8f0',
        hitG ? '#7df9ff' : '#ff2a55',
        'cyan',
        ga
      );
      if (hitG) drawGlow(e.x, e.y, 42, 'white', 0.5);
      const pga = ctx.globalAlpha;
      ctx.globalAlpha = pga * ga;
      drawEntityBar(
        e.x,
        e.y - 46,
        38,
        4.5,
        e.hp,
        e.maxHp,
        e.dispHp,
        '#67e8f9',
        e.lv > 1 ? `PHANTOM L${e.lv}` : 'PHANTOM'
      );
      ctx.globalAlpha = pga;
    } else if (e.type === 'wizard') {
      drawWizard(e);
    } else if (e.type === 'vampire') {
      drawVampire(e);
    } else if (e.type === 'wraith') {
      drawGhost(e.x, e.y, e.a, 2.0, '#67e8f9', '#ffffff', 'cyan');
    } else if (e.type === 'saw') {
      drawGlow(e.x, e.y, 38, 'gold', 0.35);
      ctx.save();
      ctx.strokeStyle = 'rgba(255,200,60,0.3)';
      ctx.setLineDash([4, 8]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(e.x, 40);
      ctx.lineTo(e.x, H - 40);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.translate(e.x, e.y);
      ctx.rotate(e.a);
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      for (let i = 0; i < 16; i++) {
        const r = i % 2 ? 19 : 29,
          an = (i / 16) * 6.283;
        ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, 6.3);
      ctx.fill();
      ctx.restore();
    } else if (e.type === 'orb') {
      const p = 1 + Math.sin(state.realTime * 6 + e.ph) * 0.1;
      drawGlow(e.x, e.y, 50 * p, 'purple', 0.6);
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(e.ph * 1.5);

      // Core
      ctx.fillStyle = '#090414';
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 26 * p, 0, 6.3);
      ctx.fill();
      ctx.stroke();

      // Orbiting rings
      ctx.strokeStyle = 'rgba(216, 143, 255, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 18 * p, 6 * p, 0, 0, 6.3);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, 0, 18 * p, 6 * p, Math.PI / 2, 0, 6.3);
      ctx.stroke();

      // Energy nodes
      ctx.fillStyle = '#ff7df9';
      for (let i = 0; i < 4; i++) {
        const an = (i / 4) * 6.283;
        ctx.beginPath();
        ctx.arc(Math.cos(an) * 26 * p, Math.sin(an) * 26 * p, 4 * p, 0, 6.3);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}
