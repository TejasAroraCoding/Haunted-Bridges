/**
 * The bridge gate: its opening sequence and drawing, plus the entry archway.
 */

import { state } from '../core/state.js';
import { F_DISPLAY, GATE_OPEN_DURATION, H, W } from '../core/constants.js';
import { clamp, easeOutBack, rand } from '../core/math.js';
import { ctx } from '../core/canvas.js';
import { drawGlow } from './sprites.js';
import { playSfx, playTone } from '../audio/audio.js';
import { addShockwave, burst, glowPuff, spawnParticle } from '../game/effects.js';
import { addShake } from '../game/camera.js';
export function drawGate() {
  if (state.stageIndex > 4) return;
  const x = W - 60,
    y = H / 2 - 72,
    h = 144,
    cx = x + 34;
  const lift = clamp(state.gateLift, 0, 1.03),
    open = lift > 0.01;
  const moving = state.gateAnimT > 0 && lift > 0.005 && lift < 1;
  const jx = moving ? Math.sin(state.realTime * 70) * 0.9 : 0;
  const bh = Math.max(8, 22 + (h - 22) * (1 - lift));
  ctx.save();
  // Recess
  const q = ctx.createLinearGradient(x, 0, W, 0);
  q.addColorStop(0, '#1a0a12');
  q.addColorStop(1, '#000');
  ctx.fillStyle = q;
  ctx.fillRect(x, y, 60, h);
  // Portal revealed behind the rising bars
  if (open) {
    const pa = ctx.globalAlpha,
      la = Math.min(1, lift);
    ctx.globalAlpha = pa * la;
    const q2 = ctx.createLinearGradient(x, 0, W, 0);
    q2.addColorStop(0, '#0f4a2a');
    q2.addColorStop(1, '#021208');
    ctx.fillStyle = q2;
    ctx.fillRect(x, y, 60, h);
    drawGlow(
      cx,
      H / 2,
      70 + Math.sin(state.realTime * 3) * 8 + state.gateFlare * 60,
      'green',
      0.5 + state.gateFlare * 0.4
    );
    // Vortex
    ctx.save();
    ctx.translate(cx, H / 2);
    ctx.scale(0.62, 1.55);
    ctx.lineCap = 'round';
    for (let arm = 0; arm < 3; arm++) {
      ctx.strokeStyle = `rgba(150,255,190,${0.55 * la})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let t = 0; t <= 1.001; t += 0.06) {
        const r = 3 + t * 24,
          an = state.realTime * 3.2 + arm * 2.094 + t * 5.2;
        if (t) ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r);
        else ctx.moveTo(Math.cos(an) * r, Math.sin(an) * r);
      }
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = '#b6ffd0';
    for (let i = 0; i < 3; i++) {
      const ax = x + 8 + ((state.realTime * 40 + i * 18) % 48);
      ctx.beginPath();
      ctx.moveTo(ax, H / 2 - 7);
      ctx.lineTo(ax + 7, H / 2);
      ctx.lineTo(ax, H / 2 + 7);
      ctx.fill();
    }
    ctx.globalAlpha = pa;
    // Light spilling out under the bars across the bridge floor
    const op = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = 'lighter';
    const L = 90 + Math.min(1, lift) * 170 + state.gateFlare * 90;
    const top = y + Math.min(h - 4, bh);
    const sg = ctx.createLinearGradient(x + 6, 0, x - L, 0);
    sg.addColorStop(0, `rgba(80,255,150,${0.2 * la + state.gateFlare * 0.25})`);
    sg.addColorStop(1, 'rgba(80,255,150,0)');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.moveTo(x + 6, top);
    ctx.lineTo(x - L, top - L * 0.3);
    ctx.lineTo(x - L, y + h + L * 0.3);
    ctx.lineTo(x + 6, y + h);
    ctx.closePath();
    ctx.fill();
    for (let r = 0; r < 5; r++) {
      const a0 = -0.28 + r * 0.14 + Math.sin(state.realTime * 1.7 + r * 2.1) * 0.03;
      const fl = 0.5 + 0.5 * Math.sin(state.realTime * 3 + r * 1.3);
      ctx.fillStyle = `rgba(150,255,190,${(0.05 + fl * 0.05) * la + state.gateFlare * 0.08})`;
      const my = (top + y + h) / 2;
      ctx.beginPath();
      ctx.moveTo(x + 4, my);
      ctx.lineTo(x - L * 1.1, my + Math.tan(a0) * L - 6);
      ctx.lineTo(x - L * 1.1, my + Math.tan(a0) * L + 6);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalCompositeOperation = op;
  }
  // Winch chains, links scrolling up while the gate rises
  ctx.strokeStyle = '#8a8199';
  ctx.lineWidth = 1.4;
  const scroll = (lift * 160) % 6;
  for (const chx of [x + 16, x + 52]) {
    for (let ly = y - 2, j = 0; ly < y + bh - 12; ly += 6, j++) {
      const yy = ly - scroll;
      if (yy < y - 4) continue;
      ctx.beginPath();
      if (j % 2) ctx.ellipse(chx + jx, yy, 1.4, 3, 0, 0, 6.3);
      else ctx.ellipse(chx + jx, yy, 2.6, 3, 0, 0, 6.3);
      ctx.stroke();
    }
  }
  // Portcullis bars with spiked tips and crossbars
  ctx.strokeStyle = '#55556a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 8 + jx, y + bh - 12);
  ctx.lineTo(x + 60 + jx, y + bh - 12);
  if (bh > 70) {
    ctx.moveTo(x + 8 + jx, y + bh * 0.45);
    ctx.lineTo(x + 60 + jx, y + bh * 0.45);
  }
  ctx.stroke();
  ctx.strokeStyle = lift >= 1 ? '#8a98aa' : '#6a6a74';
  ctx.lineWidth = 4;
  ctx.fillStyle = '#a7a7b6';
  for (let i = 0; i < 6; i++) {
    const bx = x + 12 + i * 9 + jx;
    ctx.beginPath();
    ctx.moveTo(bx, y);
    ctx.lineTo(bx, y + bh);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx - 3, y + bh);
    ctx.lineTo(bx, y + bh + 7);
    ctx.lineTo(bx + 3, y + bh);
    ctx.closePath();
    ctx.fill();
  }
  // Seal: fills with gold as coins are collected, ignites with the runes, then shatters
  if (state.gateSeal > 0) {
    const prog = state.coins.length ? (state.coins.length - state.coinsLeft) / state.coins.length : 1;
    const charge = state.gateAnimT > 0 ? state.gateRunes / 6 : 0;
    drawGlow(cx, H / 2, 26 + charge * 18, charge > 0 ? 'cyan' : 'purple', 0.35 + charge * 0.5);
    ctx.fillStyle = '#120b22';
    ctx.strokeStyle = charge > 0 ? '#7df9ff' : '#8a6acc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, H / 2, 13, 0, 6.3);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, H / 2, 9.5, -Math.PI / 2, -Math.PI / 2 + prog * 6.283);
    ctx.stroke();
    ctx.fillStyle = charge > 0 ? '#e0fbff' : '#c4b5fd';
    ctx.beginPath();
    ctx.arc(cx, H / 2 - 2, 2.6, 0, 6.3);
    ctx.fill();
    ctx.fillRect(cx - 1.2, H / 2 - 1, 2.4, 6);
  }
  // Stone frame with rune slots
  ctx.fillStyle = '#2e2a3e';
  ctx.strokeStyle = '#7a70a0';
  ctx.lineWidth = 2;
  ctx.fillRect(x - 8, y - 14, 68, 22);
  ctx.strokeRect(x - 8, y - 14, 68, 22);
  ctx.fillRect(x - 8, y + 8, 14, h - 8);
  ctx.strokeRect(x - 8, y + 8, 14, h - 8);
  ctx.fillRect(x - 8, y + h, 68, 10);
  ctx.beginPath();
  ctx.moveTo(x + 18, y - 14);
  ctx.lineTo(x + 26, y - 24);
  ctx.lineTo(x + 34, y - 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const RUNES = [
    [x - 1, y + 26],
    [x - 1, y + 56],
    [x - 1, y + 86],
    [x - 1, y + 116],
    [x + 10, y - 3],
    [x + 42, y - 3],
  ];
  RUNES.forEach(([rx, ry], i) => {
    const lit = i < state.gateRunes || lift >= 1;
    if (lit) drawGlow(rx, ry, 11 + state.gateFlare * 8, 'green', 0.7);
    ctx.strokeStyle = lit ? '#9dffc4' : '#4f4670';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(rx - 3, ry - 4);
    ctx.lineTo(rx + 3, ry - 4);
    ctx.lineTo(rx - 2, ry + 4);
    ctx.lineTo(rx + 3, ry + 4);
    if (i % 2) {
      ctx.moveTo(rx, ry - 5);
      ctx.lineTo(rx, ry + 5);
    }
    ctx.stroke();
  });
  // Winch gear turns while the gate rises
  ctx.save();
  ctx.translate(x + 2, y - 3);
  ctx.rotate(lift * 9);
  ctx.strokeStyle = '#a99fd0';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, 6.3);
  ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const an = i * 1.047;
    ctx.beginPath();
    ctx.moveTo(Math.cos(an) * 5, Math.sin(an) * 5);
    ctx.lineTo(Math.cos(an) * 8, Math.sin(an) * 8);
    ctx.stroke();
  }
  ctx.restore();
  const label =
    lift >= 1
      ? 'PORTAL OPEN'
      : state.gateAnimT > 0
        ? state.gateSeal > 0
          ? 'UNSEALING…'
          : 'GATE RISING…'
        : 'GATE LOCKED';
  ctx.fillStyle = lift >= 1 ? '#6ee7b7' : state.gateAnimT > 0 ? '#fde68a' : '#fda4af';
  ctx.font = `700 10px ${F_DISPLAY}`;
  ctx.textAlign = 'right';
  ctx.fillText(label, W - 6, y - 28);
  ctx.restore();
}

export function drawEntry() {
  const y = H / 2 - 60;
  ctx.fillStyle = '#050308';
  ctx.fillRect(0, y, 22, 120);
  ctx.fillStyle = '#2e2a3e';
  ctx.strokeStyle = '#7a70a0';
  ctx.lineWidth = 2;
  ctx.fillRect(0, y - 12, 34, 14);
  ctx.strokeRect(0, y - 12, 34, 14);
  ctx.fillRect(0, y + 118, 34, 14);
  ctx.strokeRect(0, y + 118, 34, 14);
}

/** Gate sequence: runes ignite → seal shatters → portcullis winches up in four heaves → portal bursts open. */
export function animateGate(dt) {
  if (state.gateAnimT > 0) {
    state.gateAnimT = Math.max(0, state.gateAnimT - dt);
    const k = 1 - state.gateAnimT / GATE_OPEN_DURATION;
    const gx = W - 60,
      gy = H / 2 - 72;
    const uk = clamp(k / 0.25, 0, 1);
    const runes = Math.min(6, Math.floor(uk * 6.999));
    if (runes > state.gateRunes) {
      state.gateRunes = runes;
      playSfx(560 + runes * 110, 0.1, 'triangle', 0.06, 180);
    }
    if (uk >= 1 && state.gateSeal > 0) {
      state.gateSeal = 0;
      burst(gx + 34, H / 2, 20, '#7df9ff', 220);
      for (let i = 0; i < 10; i++)
        spawnParticle(gx + 34, H / 2, rand(-160, 60), rand(-120, 120), rand(0.4, 0.8), '#c4b5fd', rand(2, 3.5), 0, 300);
      addShockwave(gx + 34, H / 2, 54, '#7df9ff', 0.3);
      playSfx(1100, 0.22, 'square', 0.05, -800);
      playSfx(240, 0.22, 'sawtooth', 0.07, -140);
      addShake(0.12);
    }
    const lk = clamp((k - 0.28) / 0.64, 0, 1),
      n = 4;
    if (lk > 0 && !state.gateRumble) {
      state.gateRumble = true;
      playSfx(44, 1.4, 'sawtooth', 0.1, 16);
    }
    const u = lk * n,
      i = Math.min(n - 1, Math.floor(u)),
      f = lk >= 1 ? 1 : u - i;
    const st = f < 0.62 ? easeOutBack(f / 0.62) : 1;
    state.gateLift = lk >= 1 ? 1 : clamp((i + st) / n, 0, 1.03);
    const done = lk >= 1 ? n : i + (f >= 0.62 ? 1 : 0);
    if (done > state.gateStep) {
      state.gateStep = done;
      playSfx(120, 0.16, 'square', 0.09, -60);
      playSfx(58, 0.3, 'sawtooth', 0.08, -12);
      addShake(0.16, Math.PI / 2);
      for (let j = 0; j < 12; j++)
        spawnParticle(
          gx + rand(4, 60),
          gy + 144 - rand(0, 6),
          rand(-90, 50),
          -rand(20, 90),
          rand(0.5, 1.1),
          j % 2 ? '#7d7590' : '#4a4458',
          rand(2, 4),
          0,
          80
        );
      for (let j = 0; j < 3; j++) glowPuff(gx + rand(0, 60), gy + 140, 'white', rand(14, 24), 0.6);
      for (let j = 0; j < 4; j++)
        spawnParticle(
          gx + rand(0, 60),
          gy - 4,
          rand(-20, 20),
          rand(20, 60),
          rand(0.5, 0.9),
          '#2e2a3e',
          rand(2, 3),
          0,
          420
        );
      if (done === n) {
        state.gateFlare = 1;
        addShockwave(gx + 30, H / 2, 150, '#55ff99', 0.55);
        burst(gx + 30, H / 2, 28, '#8fffb0', 260);
        glowPuff(gx + 30, H / 2, 'green', 70, 0.7);
        if (state.audioCtx && !state.muted) {
          const now = state.audioCtx.currentTime;
          [392, 523, 659, 784].forEach((fq, q) => playTone(fq, now + q * 0.07, 0.5, 'triangle', 0.06));
        }
      }
    }
    if (lk > 0 && lk < 1 && f < 0.62) {
      if (Math.random() < dt * 14) playSfx(1700 + rand(0, 500), 0.03, 'square', 0.012); // chain rattle
      if (Math.random() < dt * 40)
        spawnParticle(
          gx + rand(4, 60),
          gy + 140,
          rand(-50, 50),
          -rand(10, 50),
          rand(0.4, 0.8),
          '#5d566e',
          rand(1.5, 3),
          0,
          60
        );
    }
  }
  if (state.gateFlare > 0) state.gateFlare = Math.max(0, state.gateFlare - dt * 1.1);
}
