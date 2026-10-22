/**
 * Vector drawing of the champions.
 */

import { state } from '../core/state.js';
import { HERO, HEROES } from '../config/heroes.js';
import { ctx } from '../core/canvas.js';
import { DEATH_ANIM_TIME } from '../core/constants.js';
import { clamp } from '../core/math.js';
import { mouse, rightStick } from '../input/input.js';
import { drawGlow } from './sprites.js';

/**
 * Draws a champion as a vector silhouette with breathing, walk cycle and cloak/scarf sway.
 * `ctx` may be any 2D context (the game canvas, a menu preview, the end-screen portrait).
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} heroIdx index into HEROES
 * @param {object} [pose]
 * @param {number} [pose.walkPhase] walk-cycle phase (advances while moving)
 * @param {number} [pose.aim] aim angle in radians; also decides which way the hero faces
 * @param {number} [pose.vx] velocity, drives walk bob, lean and cloak trail
 * @param {number} [pose.vy]
 * @param {number} [pose.scale]
 * @param {number} [pose.wind] extra cloak/scarf trail (title screen)
 */
export function drawHeroModel(
  ctx,
  x,
  y,
  heroIdx,
  { walkPhase: t = 0, aim: aimA = 0, vx = 0, vy = 0, scale = 1.5, wind = 0 } = {}
) {
  const h = HEROES[heroIdx] || HEROES[0];
  const fl = Math.cos(aimA) < 0 ? -1 : 1;
  const mv = Math.hypot(vx, vy) > 20;
  const breath = Math.sin(state.realTime * 3) * 0.8;
  const bob = (mv ? Math.abs(Math.sin(t)) * 2.2 : 0) + breath;
  const sw = mv ? Math.sin(t) * 6.5 : 0;
  const lean = clamp(vx / 1800, -0.12, 0.12);
  const tr = clamp(-vx / 24 + wind, -9, 9);
  const w = Math.sin(state.realTime * 7.5);
  const idleSway = mv ? 0 : Math.sin(state.realTime * 2.2) * 1.2;
  ctx.save();
  ctx.translate(x, y - bob);
  ctx.scale(scale, scale);
  ctx.rotate(lean);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.save();
  ctx.scale(fl, 1);
  ctx.strokeStyle = h.scarf;
  ctx.lineWidth = 3.8;
  ctx.beginPath();
  ctx.moveTo(-4, -8);
  ctx.quadraticCurveTo(-12 + tr + idleSway, -6 + w * 1.8, -16 + tr * 1.3, -1 + w * 2.5);
  ctx.stroke();
  const cg = ctx.createLinearGradient(0, -8, 0, 22);
  cg.addColorStop(0, h.cloak1);
  cg.addColorStop(1, h.cloak2);
  ctx.fillStyle = cg;
  ctx.beginPath();
  ctx.moveTo(-6, -8);
  ctx.lineTo(6, -8);
  ctx.quadraticCurveTo(10 + tr * 0.4, 6, 11 + tr + w * 1.2, 21);
  ctx.lineTo(5 + tr * 0.5, 18 + w);
  ctx.lineTo(tr * 0.3, 22);
  ctx.lineTo(-5 + tr * 0.5, 18 - w);
  ctx.lineTo(-11 + tr - w * 1.2, 21);
  ctx.quadraticCurveTo(-10 + tr * 0.4, 6, -6, -8);
  ctx.fill();
  ctx.strokeStyle = '#232b45';
  ctx.lineWidth = 5.2;
  ctx.beginPath();
  ctx.moveTo(-3, 8);
  ctx.lineTo(-4 + sw, 18);
  ctx.moveTo(3, 8);
  ctx.lineTo(4 - sw, 18);
  ctx.stroke();
  ctx.fillStyle = heroIdx === HERO.BRAM ? '#8a99ad' : '#6b4528';
  ctx.fillRect(-8.5 + sw, 17, 8.5, 4.8);
  ctx.fillRect(-sw, 17, 8.5, 4.8);
  const tg = ctx.createLinearGradient(-6, -8, 6, 10);
  tg.addColorStop(0, h.armor1);
  tg.addColorStop(1, h.armor2);
  ctx.fillStyle = tg;
  ctx.beginPath();
  ctx.moveTo(-7, -8);
  ctx.lineTo(7, -8);
  ctx.lineTo(6, 9);
  ctx.lineTo(-6, 9);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Chest core pulses with the breath
  ctx.fillStyle = h.glow;
  ctx.globalAlpha = 0.75 + Math.sin(state.realTime * 4) * 0.25;
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.lineTo(3, -1);
  ctx.lineTo(0, 3);
  ctx.lineTo(-3, -1);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(-7, 4, 14, 3);
  ctx.fillStyle = '#e0b050';
  ctx.fillRect(-2, 3.5, 4, 4);
  ctx.fillStyle = heroIdx === HERO.BRAM ? '#ffd966' : '#aab8d8';
  ctx.beginPath();
  ctx.arc(-7, -6, 4.2, 0, 6.3);
  ctx.arc(7, -6, 4.2, 0, 6.3);
  ctx.fill();
  ctx.fillStyle = h.scarf;
  ctx.fillRect(-6, -9, 12, 3.5);
  ctx.fillStyle = h.skin;
  ctx.beginPath();
  ctx.arc(0, -14, 6, 0, 6.3);
  ctx.fill();
  const hd = ctx.createLinearGradient(0, -23, 0, -10);
  hd.addColorStop(0, h.cloak1);
  hd.addColorStop(1, h.cloak2);
  ctx.fillStyle = hd;
  ctx.beginPath();
  ctx.arc(0, -14, 8, Math.PI * 0.95, Math.PI * 2.05);
  ctx.lineTo(7, -9);
  ctx.lineTo(4.5, -12);
  ctx.quadraticCurveTo(0, -17, -4.5, -12);
  ctx.lineTo(-7, -9);
  ctx.closePath();
  ctx.fill();
  if (heroIdx === HERO.BRAM) {
    ctx.fillStyle = '#ffd966';
    ctx.fillRect(-1.5, -24, 3, 6);
  } else if (heroIdx === HERO.LYRA) {
    ctx.fillStyle = '#ffae33';
    ctx.beginPath();
    ctx.moveTo(-5, -21);
    ctx.lineTo(-2, -26 - Math.sin(state.realTime * 10) * 1.5);
    ctx.lineTo(0, -22);
    ctx.lineTo(2, -27 - Math.cos(state.realTime * 10) * 1.5);
    ctx.lineTo(5, -21);
    ctx.closePath();
    ctx.fill();
  }

  // Blinking eyes
  const blink = Math.sin(state.realTime * 1.3) > 0.985 ? 0.2 : 2.5;
  ctx.fillStyle = h.glow;
  ctx.fillRect(-3.2 + Math.cos(aimA) * fl * 1.2, -14.5, 2.2, blink);
  ctx.fillRect(1.2 + Math.cos(aimA) * fl * 1.2, -14.5, 2.2, blink);
  ctx.restore();

  // Weapon arm
  ctx.save();
  ctx.translate(fl * 4, -3);
  ctx.rotate(aimA);
  ctx.strokeStyle = h.armor2;
  ctx.lineWidth = 4.2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(8, 0);
  ctx.stroke();
  if (heroIdx === HERO.VESPER) {
    ctx.fillStyle = '#e066ff';
    ctx.beginPath();
    ctx.moveTo(8, -3);
    ctx.lineTo(24, 0);
    ctx.lineTo(8, 3);
    ctx.closePath();
    ctx.fill();
  } else if (heroIdx === HERO.BRAM) {
    ctx.strokeStyle = '#c89d42';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(22, 0);
    ctx.stroke();
    ctx.fillStyle = '#ffe680';
    ctx.beginPath();
    ctx.moveTo(18, -5);
    ctx.lineTo(28, 0);
    ctx.lineTo(18, 5);
    ctx.lineTo(20, 0);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.strokeStyle = '#7a4a22';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(5, 0);
    ctx.lineTo(22, 0);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(23, 0, 3.2 + Math.sin(state.realTime * 8) * 0.5, 0, 6.3);
    ctx.fill();
    ctx.strokeStyle = h.glow;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(23, 0, 5.8 + Math.sin(state.realTime * 5), 0, 6.3);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}

export function drawPlayer(x, y, t) {
  let aimA = Math.atan2(mouse.y - y, mouse.x - x);
  if (rightStick.active && (rightStick.dx || rightStick.dy)) aimA = Math.atan2(rightStick.dy, rightStick.dx);
  const pa = ctx.globalAlpha;
  if (state.player.dying > 0) ctx.globalAlpha = pa * clamp(state.player.dying / DEATH_ANIM_TIME, 0, 1);
  drawHeroModel(ctx, x, y, state.selectedHeroIndex, {
    walkPhase: t,
    aim: aimA,
    vx: state.player.vx,
    vy: state.player.vy,
  });
  if (state.player.hitFl > 0) drawGlow(x, y, 34, 'red', clamp(state.player.hitFl * 2, 0, 0.8));
  if (state.player.shield > 0) {
    drawGlow(x, y, 42, 'cyan', 0.45);
    ctx.strokeStyle = `rgba(120,245,255,${0.6 + 0.25 * Math.sin(state.realTime * 6)})`;
    ctx.fillStyle = 'rgba(80,210,255,0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 29 + Math.sin(state.realTime * 8) * 1.5, 0, 6.3);
    ctx.fill();
    ctx.stroke();
  }
  ctx.globalAlpha = pa;
}
