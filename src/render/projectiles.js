/**
 * Drawing the hero's projectiles. Each weapon type (see config/heroes.js) has its own look;
 * trails are spawned separately in render/animate.js.
 */

import { state } from '../core/state.js';
import { ctx } from '../core/canvas.js';
import { drawGlow } from './sprites.js';

const TAU = Math.PI * 2;

function fillCircle(x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

/** Lyra: a flickering fireball with a fading tail. */
function drawFireball(b, ux, uy) {
  const flicker = 0.85 + Math.sin(state.realTime * 40 + b.rot) * 0.1 + Math.random() * 0.08;
  drawGlow(b.x, b.y, 26 * flicker, 'orange', 0.8);
  for (let i = 3; i >= 1; i--) {
    ctx.globalAlpha = 0.16 * i;
    fillCircle(b.x - ux * i * 6, b.y - uy * i * 6, (7.5 - i * 1.3) * flicker, '#ff5a1f');
  }
  ctx.globalAlpha = 1;
  fillCircle(b.x, b.y, 7 * flicker, '#ff7a22');
  fillCircle(b.x + ux, b.y + uy, 4.6 * flicker, '#ffd166');
  fillCircle(b.x + ux * 1.6, b.y + uy * 1.6, 2.2, '#fffbe6');
}

/** Bram: a shimmering solar light-spear with a crossguard. */
function drawSpear(b, ux, uy, angle) {
  drawGlow(b.x - ux * 10, b.y - uy * 10, 24, 'gold', 0.55);
  const shimmer = 0.7 + 0.3 * Math.sin(state.realTime * 30 + b.rot);
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(angle);
  ctx.lineCap = 'round';
  ctx.strokeStyle = `rgba(255,224,102,${0.35 * shimmer})`;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-36, 0);
  ctx.lineTo(-4, 0);
  ctx.stroke();
  ctx.strokeStyle = '#ffe680';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(-30, 0);
  ctx.lineTo(0, 0);
  ctx.stroke();
  ctx.fillStyle = '#c89d42';
  ctx.fillRect(-4, -4.5, 2.4, 9);
  ctx.fillStyle = '#fffbe0';
  ctx.beginPath();
  ctx.moveTo(11, 0);
  ctx.lineTo(-1, -5.5);
  ctx.lineTo(2, 0);
  ctx.lineTo(-1, 5.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Vesper: a spinning three-pronged shadow blade with two afterimages. */
function drawBlade(b, ux, uy) {
  const spin = b.age * 26 + b.rot;
  drawGlow(b.x, b.y, 18, 'purple', 0.6);
  for (let j = 2; j >= 0; j--) {
    ctx.save();
    ctx.translate(b.x - ux * j * 7, b.y - uy * j * 7);
    ctx.rotate(spin - j * 0.55);
    ctx.globalAlpha = j ? 0.28 / j : 1;
    ctx.fillStyle = j ? '#a855f7' : '#f0c6ff';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * TAU) / 6;
      const r = i % 2 ? 2.6 : 8.5;
      if (i) ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.moveTo(r, 0);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  fillCircle(b.x, b.y, 1.6, '#2a0a3a');
}

/** Aric: an arcane bolt with a bright streak and an orbiting spark. */
function drawBolt(b, ux, uy) {
  drawGlow(b.x, b.y, 20, b.gKey || 'cyan', 0.65);
  ctx.lineCap = 'round';
  ctx.strokeStyle = b.c;
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(b.x - ux * 18, b.y - uy * 18);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(b.x, b.y);
  ctx.lineTo(b.x - ux * 12, b.y - uy * 12);
  ctx.stroke();
  fillCircle(b.x, b.y, 3.8, '#ffffff');
  const orbit = b.age * 34 + b.rot;
  fillCircle(b.x + Math.cos(orbit) * 7, b.y + Math.sin(orbit) * 7, 1.7, '#cffafe');
}

const WEAPON_RENDERERS = { fireball: drawFireball, spear: drawSpear, blade: drawBlade, bolt: drawBolt };

export function drawPlayerProjectiles() {
  for (const b of state.playerBullets) {
    const speed = Math.hypot(b.vx, b.vy) || 1;
    const ux = b.vx / speed;
    const uy = b.vy / speed;
    (WEAPON_RENDERERS[b.weapon] || drawBolt)(b, ux, uy, Math.atan2(uy, ux));
  }
}
