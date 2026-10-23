/**
 * Drawing Malakor, his attack telegraphs, intro cinematic and subtitles.
 */

import { state } from '../core/state.js';
import { ctx } from '../core/canvas.js';
import { F_DISPLAY, F_MONO, H, W } from '../core/constants.js';
import { isTouchDevice } from '../core/device.js';
import { clamp, lerp } from '../core/math.js';
import { difficulty } from '../core/settings.js';
import { drawGlow } from './sprites.js';

const BOSS_CRACKS = [
  [
    [-20, -30],
    [-14, -18],
    [-18, -6],
    [-10, 4],
  ],
  [
    [18, -28],
    [12, -16],
    [17, -4],
  ],
  [
    [-30, 10],
    [-20, 16],
    [-25, 28],
    [-18, 36],
  ],
  [
    [6, 2],
    [0, 14],
    [8, 24],
    [2, 36],
  ],
  [
    [27, 6],
    [33, 18],
    [26, 30],
  ],
  [
    [-5, -38],
    [1, -27],
    [-4, -19],
  ],
  [
    [-37, -6],
    [-28, 0],
    [-31, 8],
  ],
  [
    [14, 12],
    [20, 22],
    [14, 33],
  ],
  [
    [-12, 18],
    [-6, 28],
    [-11, 38],
  ],
];

function drawBossWindup(bx, by, w) {
  const nx = state.boss.next;
  ctx.save();
  if (nx === 'spear') {
    const a = Math.atan2(state.player.y - by, state.player.x - bx);
    ctx.strokeStyle = `rgba(199,125,255,${w * 0.55})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([10, 8]);
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(a + i * 0.18) * 280 * w, by + Math.sin(a + i * 0.18) * 280 * w);
      ctx.stroke();
    }
  } else if (nx === 'ring') {
    ctx.strokeStyle = `rgba(255,42,85,${w * 0.8})`;
    ctx.lineWidth = 2 + w * 2;
    ctx.setLineDash([6, 6]);
    ctx.lineDashOffset = -state.realTime * 40;
    ctx.beginPath();
    ctx.arc(bx, by, lerp(180, 64, w), 0, 6.3);
    ctx.stroke();
  } else if (nx === 'rift') {
    ctx.strokeStyle = `rgba(199,125,255,${w * 0.85})`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const r = (60 + i * 18 + Math.sin(state.realTime * 30 + i) * 4) * w + 20;
      ctx.beginPath();
      ctx.arc(bx, by, r, state.realTime * 3 + i * 2, state.realTime * 3 + i * 2 + 2.2);
      ctx.stroke();
    }
    const tx = state.boss.baseX > W / 2 ? 160 : 810;
    drawGlow(tx, by, 56 * w, 'purple', 0.55 * w);
  } else if (nx === 'crush') {
    ctx.fillStyle = `rgba(255,42,85,${w * 0.12})`;
    ctx.fillRect(0, clamp(state.player.y, 95, H - 95) - 46, W, 92);
  }
  ctx.restore();
  drawGlow(bx, by, 30 + w * 44, nx === 'ring' || nx === 'crush' ? 'red' : 'purple', w * 0.7);
}

const DEATH_FADE_TIME = 3.0; // matches boss.deadT set in game/boss.js

/** Draws Malakor; after his defeat he flickers, shrinks and dissolves over a few seconds. */
export function drawBoss() {
  const boss = state.boss;
  if (!boss) return;
  if (boss.dead) {
    const life = clamp(boss.deadT / DEATH_FADE_TIME, 0, 1);
    if (life <= 0) return;
    const shrink = 0.55 + 0.45 * life;
    ctx.globalAlpha *= life * (0.7 + 0.3 * Math.sin(state.realTime * 38));
    ctx.translate(boss.x, boss.y);
    ctx.scale(shrink, shrink);
    ctx.translate(-boss.x, -boss.y);
  }
  drawBossBody();
}

function drawBossBody() {
  if (state.boss.state === 'crushWarn') {
    const pulse = 0.16 + 0.1 * Math.sin(state.realTime * 28);
    ctx.fillStyle = `rgba(255,42,85,${pulse})`;
    ctx.fillRect(0, state.boss.crushY - 46, W, 92);
    ctx.strokeStyle = '#ff2a55';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 8]);
    ctx.strokeRect(0, state.boss.crushY - 46, W, 92);
    ctx.setLineDash([]);
    ctx.font = `700 14px ${F_DISPLAY}`;
    ctx.fillStyle = '#ff4d6d';
    ctx.textAlign = 'center';
    ctx.fillText('⚠ ABYSSAL CRUSH INCOMING — EVADE LANE! ⚠', W / 2, state.boss.crushY + 5);
  }
  const pl = state.boss.pl,
    dmg = 1 - Math.max(0, state.boss.hp) / state.boss.max;
  const wind = state.boss.dead || state.bossIntro > 0 ? 0 : state.boss.wind || 0;
  const jit = state.boss.next === 'rift' ? Math.sin(state.realTime * 70) * wind * 3.5 : 0;
  const bx = state.boss.x + jit,
    by = state.boss.y + Math.sin(state.boss.bob * 2) * 3;
  const AK = pl === 3 ? 'red' : 'purple';
  const AC3 = pl === 3 ? '255,42,85' : pl === 2 ? '236,72,190' : '179,136,255';
  const eyeCol = pl === 3 ? '#ff2a55' : pl === 2 ? '#f472b6' : '#7df9ff';
  const eyeKey = pl === 3 ? 'red' : pl === 2 ? 'purple' : 'cyan';
  if (wind > 0.02) drawBossWindup(bx, by, wind);

  // Aura: grows taller, faster and hotter each phase
  drawGlow(bx, by, 92 + pl * 16 + wind * 30, AK, 0.5 + pl * 0.07 + Math.sin(state.realTime * 3) * 0.08 + wind * 0.2);
  ctx.save();
  ctx.translate(bx, by);
  const tongues = 8 + pl * 4,
    baseR = 50 + pl * 6,
    amp = 10 + pl * 9 + wind * 12;
  for (let layer = 0; layer < 2; layer++) {
    ctx.fillStyle = `rgba(${AC3},${(layer ? 0.2 : 0.09) + pl * 0.04})`;
    ctx.beginPath();
    const n = tongues * 2;
    for (let i = 0; i <= n; i++) {
      const an = (i / n) * 6.283 + state.realTime * (0.35 + pl * 0.22) * (layer ? -1 : 1);
      const r =
        (i % 2 ? baseR : baseR + amp * (0.55 + 0.45 * Math.sin(state.realTime * 7 + i * 1.7 + layer))) *
        (layer ? 0.85 : 1);
      const px = Math.cos(an) * r,
        py = Math.sin(an) * r * 0.95 - (i % 2 ? 0 : 6);
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.save();
  ctx.translate(bx, by);
  const sc = 1.32 * (1 + wind * 0.07 + Math.max(0, state.boss.fireFl || 0) * 0.35);
  ctx.scale(sc, sc);

  // Rotating rune ring
  ctx.save();
  ctx.rotate(state.realTime * (0.7 + pl * 0.35));
  ctx.strokeStyle = `rgba(${AC3},${0.4 + wind * 0.4})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 48, 0, 6.3);
  ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * 6.283;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 34, Math.sin(a) * 34);
    ctx.lineTo(Math.cos(a + 2.09) * 48, Math.sin(a + 2.09) * 48);
    ctx.stroke();
  }
  ctx.restore();

  // Body
  ctx.fillStyle = state.boss.fl > 0 ? '#ffffff' : pl === 3 ? '#14040b' : '#090612';
  ctx.strokeStyle = pl === 3 ? '#ff2a55' : pl === 2 ? '#e879f9' : '#b388ff';
  ctx.lineWidth = 2 + (pl - 1) * 0.6;
  ctx.beginPath();
  ctx.arc(0, -8, 34, Math.PI, 0);
  ctx.lineTo(42, 40);
  for (let i = 0; i < 5; i++) {
    ctx.lineTo(42 - i * 16.8 - 8, 30 + Math.sin(state.realTime * (4 + pl) + i) * (6 + pl));
    ctx.lineTo(42 - (i + 1) * 16.8, 40);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Inner core glow + glowing cracks that spread as Malakor is damaged
  if (state.boss.fl <= 0) {
    ctx.save();
    ctx.clip();
    if (pl >= 2) {
      const cg = ctx.createRadialGradient(0, 8, 2, 0, 8, 46);
      cg.addColorStop(0, `rgba(${AC3},${0.3 + 0.15 * Math.sin(state.realTime * 4)})`);
      cg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = cg;
      ctx.fillRect(-50, -50, 100, 100);
    }
    const nC = Math.min(BOSS_CRACKS.length, Math.floor(dmg * 10));
    const cp = 0.65 + 0.35 * Math.sin(state.realTime * 6);
    for (let i = 0; i < nC; i++) {
      const pts = BOSS_CRACKS[i];
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let j = 1; j < pts.length; j++) ctx.lineTo(pts[j][0], pts[j][1]);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2.8;
      ctx.stroke();
      ctx.strokeStyle = pl === 3 ? `rgba(255,90,120,${cp})` : `rgba(${AC3},${0.55 + cp * 0.3})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.restore();
  }

  // Horns lengthen and redden with each phase
  const hl = pl - 1;
  ctx.fillStyle = pl === 3 ? '#ff6b6b' : pl === 2 ? '#ffb347' : '#ffcc55';
  ctx.beginPath();
  ctx.moveTo(-22, -32);
  ctx.lineTo(-34 - hl * 3, -56 - hl * 7);
  ctx.lineTo(-10, -38);
  ctx.moveTo(22, -32);
  ctx.lineTo(34 + hl * 3, -56 - hl * 7);
  ctx.lineTo(10, -38);
  ctx.fill();
  if (pl === 3) {
    for (let i = -2; i <= 2; i++) {
      const fh = 8 + Math.sin(state.realTime * 14 + i * 1.9) * 3;
      ctx.fillStyle = i % 2 ? '#ff2a55' : '#ffae33';
      ctx.beginPath();
      ctx.moveTo(i * 7 - 4, -40);
      ctx.lineTo(i * 7, -40 - fh);
      ctx.lineTo(i * 7 + 4, -40);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Eyes that track the hero
  const ea = Math.atan2(state.player.y - by, state.player.x - bx);
  const pxo = Math.cos(ea) * 2.6,
    pyo = Math.sin(ea) * 3.4;
  ctx.fillStyle = eyeCol;
  const bodyAlpha = ctx.globalAlpha;
  ctx.globalAlpha = bodyAlpha * Math.min(1, 0.85 + Math.sin(state.realTime * 5) * 0.15 + wind * 0.3);
  ctx.beginPath();
  ctx.ellipse(-12, -12, 5.5, 8.5, -0.2, 0, 6.3);
  ctx.ellipse(12, -12, 5.5, 8.5, 0.2, 0, 6.3);
  ctx.fill();
  ctx.globalAlpha = bodyAlpha;
  ctx.fillStyle = '#05010a';
  const pupH = 4.2 - wind * 1.6;
  ctx.beginPath();
  ctx.ellipse(-12 + pxo, -12 + pyo, 2.2, pupH, 0, 0, 6.3);
  ctx.ellipse(12 + pxo, -12 + pyo, 2.2, pupH, 0, 0, 6.3);
  ctx.fill();
  if (pl >= 2) {
    ctx.strokeStyle = '#05010a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    const sl = pl === 3 ? 6 : 3;
    ctx.beginPath();
    ctx.moveTo(-19, -22 - sl * 0.3);
    ctx.lineTo(-6, -20 + sl * 0.6);
    ctx.moveTo(19, -22 - sl * 0.3);
    ctx.lineTo(6, -20 + sl * 0.6);
    ctx.stroke();
  }
  ctx.restore();
  if (wind > 0.3 || pl === 3) {
    const eg = (pl === 3 ? 0.35 : 0) + wind * 0.5;
    drawGlow(bx - 12 * sc, by - 12 * sc, 12 + wind * 10, eyeKey, eg);
    drawGlow(bx + 12 * sc, by - 12 * sc, 12 + wind * 10, eyeKey, eg);
  }
}

export function drawBossIntro() {
  const k = 1 - state.bossIntro / state.bossIntroDuration;
  const a = Math.min(1, k * 5, state.bossIntro * 4);
  const bar = 64 * a;
  ctx.fillStyle = `rgba(70,0,18,${0.28 * a})`;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, bar);
  ctx.fillRect(0, H - bar, W, bar);
  ctx.save();
  ctx.globalAlpha = a;
  const sl = (1 - Math.min(1, k * 3)) * 90;
  const cx = W / 2 - 40;
  ctx.textAlign = 'center';
  ctx.font = `700 12px ${F_MONO}`;
  ctx.fillStyle = `rgba(253,164,175,${0.6 + 0.4 * Math.sin(state.realTime * 8)})`;
  ctx.fillText('⚠  ABYSSAL LORD APPROACHES  ⚠', cx, H / 2 - 78);
  ctx.font = `italic 700 72px ${F_DISPLAY}`;
  ctx.fillStyle = '#2a0610';
  ctx.fillText('MALAKOR', cx - sl + 4, H / 2 - 12 + 4);
  const tg = ctx.createLinearGradient(0, H / 2 - 70, 0, H / 2 - 10);
  tg.addColorStop(0, '#ffffff');
  tg.addColorStop(1, '#ff4d6d');
  ctx.fillStyle = tg;
  ctx.fillText('MALAKOR', cx - sl, H / 2 - 12);
  ctx.font = `700 18px ${F_DISPLAY}`;
  ctx.fillStyle = '#ff8fa3';
  ctx.fillText('LORD OF THE HAUNTED BRIDGES', cx + sl * 0.7, H / 2 + 18);
  const lw = 170 * Math.min(1, k * 2.4);
  ctx.fillStyle = '#ff2a55';
  ctx.fillRect(cx - lw, H / 2 + 30, lw * 2, 3);
  ctx.font = `700 11px ${F_MONO}`;
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(`3 PHASES  ·  ${state.boss ? state.boss.max : 0} HP  ·  ${difficulty().label}`, cx, H / 2 + 52);
  if (k > 0.15) {
    // Top-left of the letterbox bar: the top-right corner sits under the on-screen buttons.
    ctx.textAlign = 'left';
    ctx.font = `700 10px ${F_MONO}`;
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(isTouchDevice ? 'TAP RIGHT STICK TO SKIP ▸' : 'CLICK / SPACE TO SKIP ▸', 22, 40);
  }
  ctx.restore();
}

export function drawBossLine() {
  const L = state.bossLine;
  if (!L) return;
  const shown = Math.min(L.text.length, Math.floor((L.m - L.t) * 42));
  const typing = shown < L.text.length;
  const a = clamp(Math.min(L.t * 3, (L.m - L.t) * 6), 0, 1);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.font = `italic 700 15px ${F_DISPLAY}`;
  const tw = ctx.measureText(`“${L.text}”`).width;
  const bw = Math.min(W - 60, tw + 118),
    bx = W / 2 - bw / 2;
  const by = state.bossIntro > 0 ? H - 50 : H - 100;
  ctx.fillStyle = 'rgba(14,4,16,0.92)';
  ctx.fillRect(bx, by, bw, 34);
  ctx.strokeStyle = 'rgba(255,42,85,0.75)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(bx, by, bw, 34);
  ctx.fillStyle = '#ff2a55';
  ctx.fillRect(bx, by, 4, 34);
  ctx.textAlign = 'left';
  ctx.font = `800 11px ${F_MONO}`;
  ctx.fillStyle = '#ff4d6d';
  ctx.fillText('MALAKOR', bx + 14, by + 21);
  ctx.font = `italic 700 15px ${F_DISPLAY}`;
  ctx.fillStyle = '#ffe4e6';
  ctx.fillText(
    `“${L.text.slice(0, shown)}${typing ? (Math.floor(state.realTime * 10) % 2 ? '▌' : '') : '”'}`,
    bx + 92,
    by + 22
  );
  ctx.restore();
}
