/**
 * Heads-up display, stage cards, warp transition and floating text.
 */

import { state } from '../core/state.js';
import { HEROES } from '../config/heroes.js';
import { STAGES } from '../config/stages.js';
import { ctx } from '../core/canvas.js';
import { F_DISPLAY, F_MONO, GATE_ZONE, H, W } from '../core/constants.js';
import { isTouchDevice } from '../core/device.js';
import { clamp, dist, lerp } from '../core/math.js';
import { difficulty, settings } from '../core/settings.js';
import { shatterCell } from '../game/effects.js';
import { isDamageable } from '../game/spawn.js';
import { leftStick, mouse, rightStick } from '../input/input.js';

import { drawGlow } from './sprites.js';
import { drawBanner, drawBossOverlays, drawStageCard, drawWarpTransition } from './overlays.js';

/** Draws the heads-up display and full-screen overlays (not affected by camera shake). */
/** Lowest edge of the top HUD panels; big floating labels stay below it. */
const HUD_BOTTOM = 100;

/** HUD layers, back to front. */
const HUD_LAYERS = [
  drawFloatingTexts,
  drawObjectiveArrow,
  drawStatusPanelFrame,
  drawVitalityIcon,
  drawHealthCells,
  drawWeaponAndDash,
  drawWarpRunTag,
  drawStagePanel,
  drawTelemetryPanel,
  drawFlyingCoins,
  drawComboMeter,
  drawBossHealthBar,
  drawBossOverlays,
  drawBanner,
  drawWarpTransition,
  drawStageCard,
  drawTouchSticks,
  drawCrosshair,
];

export function drawHud() {
  for (const drawLayer of HUD_LAYERS) {
    ctx.save();
    drawLayer();
    ctx.restore();
  }
}

/** Damage numbers and pickup labels; big hits pop in with a gold outline. */
function drawFloatingTexts() {
  for (const f of state.floatingTexts) {
    const pa = ctx.globalAlpha;
    const age = f.m - f.t;
    ctx.globalAlpha = Math.min(1, (f.t / f.m) * 1.6);
    const pop = f.big ? 1 + Math.max(0, 0.22 - age) * 3.4 : 1 + Math.max(0, 0.08 - age) * 2.5;
    ctx.font = `800 ${f.sz || 15}px ${F_DISPLAY}`;
    ctx.textAlign = 'center';
    // Keep big labels fully on screen (e.g. "+1200 ABYSS SLAIN" near the right edge).
    const half = (ctx.measureText(f.s).width * pop) / 2 + 8;
    const x = half * 2 < W ? clamp(f.x, half, W - half) : W / 2;
    ctx.save();
    ctx.translate(x, Math.max(f.y, f.big ? HUD_BOTTOM + (f.sz || 15) : (f.sz || 15) + 4));
    ctx.scale(pop, pop);
    ctx.lineJoin = 'round';
    if (f.big) {
      ctx.strokeStyle = '#2a1600';
      ctx.lineWidth = 5;
      ctx.strokeText(f.s, 0, 0);
      ctx.strokeStyle = '#ffcc33';
      ctx.lineWidth = 2.2;
      ctx.strokeText(f.s, 0, 0);
      ctx.fillStyle = f.c;
      ctx.fillText(f.s, 0, 0);
    } else {
      ctx.fillStyle = '#000';
      ctx.fillText(f.s, 1, 1);
      ctx.fillStyle = f.c;
      ctx.fillText(f.s, 0, 0);
    }
    ctx.restore();
    ctx.globalAlpha = pa;
  }
}

/** Arrow pointing at the last coins or the open gate. */
function drawObjectiveArrow() {
  if (state.stageIndex < 5 && state.warpTimer <= 0 && state.stageCardTimer <= 0) {
    let tx = null,
      ty = null,
      col = '#55ff99';
    if (state.coinsLeft <= 0) {
      tx = GATE_ZONE.x + 12;
      ty = H / 2;
    } else if (state.coinsLeft <= 2) {
      const rem = state.coins.find(c => !c.got);
      if (rem) {
        tx = rem.x;
        ty = rem.y;
        col = '#facc15';
      }
    }
    if (tx !== null && dist(state.player.x, state.player.y, tx, ty) > 85) {
      const ang = Math.atan2(ty - state.player.y, tx - state.player.x);
      const pulse = 1 + Math.sin(state.realTime * 8) * 0.12;
      const ax = state.player.x + Math.cos(ang) * 44,
        ay = state.player.y + Math.sin(ang) * 44;
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(ang);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.lineTo(-5, -6);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-5, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
}

/** Top-left panel background. */
function drawStatusPanelFrame() {
  ctx.fillStyle = 'rgba(8,6,18,0.86)';
  ctx.strokeStyle = 'rgba(125,249,255,0.32)';
  ctx.lineWidth = 1.5;
  ctx.fillRect(10, 8, 258, 54);
  ctx.strokeRect(10, 8, 258, 54);
}

/** Beating heart in front of the health bar (faster at low health). */
function drawVitalityIcon() {
  {
    const low = state.player.hp <= 1;
    const hb = 1 + Math.sin(state.realTime * (low ? 10 : 3.2)) * (low ? 0.14 : 0.06);
    drawGlow(27, 21, 17, 'red', low ? 0.75 : 0.5);
    ctx.save();
    ctx.translate(27, 22);
    ctx.scale(0.82 * hb, 0.82 * hb);
    ctx.fillStyle = '#fb7185';
    ctx.strokeStyle = '#ffe4e6';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.bezierCurveTo(-17, -3, -9, -17, 0, -6);
    ctx.bezierCurveTo(9, -17, 17, -3, 0, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.ellipse(-5.5, -6.5, 2.4, 1.6, -0.6, 0, 6.3);
    ctx.fill();
    ctx.restore();
  }
}

/** Health cells and golden hearts; lost cells crack and shatter. */
function drawHealthCells() {
  const HX = 44;
  if (state.player.hp < state.hudHpPrev)
    for (let i = Math.max(0, state.player.hp); i < state.hudHpPrev; i++)
      shatterCell(HX + i * 24, 15, 20, 11, '#fb7185', '#ffe4e6');
  if (state.goldenHearts < state.hudGoldenPrev)
    for (let i = state.goldenHearts; i < state.hudGoldenPrev; i++)
      shatterCell(HX + (state.player.maxHp + i) * 24, 15, 18, 11, '#facc15', '#fff7c2');
  state.hudHpPrev = state.player.hp;
  state.hudGoldenPrev = state.goldenHearts;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < state.player.maxHp; i++) {
    const alive = i < state.player.hp;
    const beat = alive && state.player.hp <= 1 ? 1 + Math.sin(state.realTime * 6) * 0.08 : 1;
    ctx.fillStyle = alive ? '#fb7185' : '#271a2c';
    ctx.fillRect(HX + i * 24, 15, 20 * beat, 11);
    ctx.strokeStyle = alive ? '#ffe4e6' : '#4a3552';
    ctx.strokeRect(HX + i * 24, 15, 20, 11);
  }
  for (let i = 0; i < state.goldenHearts; i++) {
    ctx.fillStyle = '#facc15';
    ctx.fillRect(HX + (state.player.maxHp + i) * 24, 15, 18, 11);
  }
  // Cracked-cell flash and flying shards
  for (const cf of state.heartCracks) {
    const k = cf.t / cf.m;
    ctx.fillStyle = `rgba(255,255,255,${k * 0.85})`;
    ctx.fillRect(cf.x - 2 * k, cf.y - 2 * k, cf.w + 4 * k, cf.h + 4 * k);
    ctx.strokeStyle = `rgba(255,230,235,${k})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cf.x, cf.y + cf.h * 0.4);
    ctx.lineTo(cf.x + cf.w * 0.3, cf.y + cf.h * 0.7);
    ctx.lineTo(cf.x + cf.w * 0.5, cf.y + cf.h * 0.2);
    ctx.lineTo(cf.x + cf.w * 0.75, cf.y + cf.h * 0.8);
    ctx.lineTo(cf.x + cf.w, cf.y + cf.h * 0.35);
    ctx.stroke();
  }
  for (const sh of state.heartShards) {
    ctx.save();
    ctx.globalAlpha = clamp((sh.t / sh.m) * 1.4, 0, 1);
    ctx.translate(sh.x, sh.y);
    ctx.rotate(sh.rot);
    ctx.fillStyle = sh.c;
    ctx.beginPath();
    ctx.moveTo(-sh.s, -sh.s * 0.6);
    ctx.lineTo(sh.s, -sh.s * 0.3);
    ctx.lineTo(sh.s * 0.2, sh.s * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

/** Weapon level XP bar and dash cooldown. */
function drawWeaponAndDash() {
  const h = HEROES[state.selectedHeroIndex];
  const nx = [9, 21, 35, 52][state.weaponLevel - 1] || 52,
    pv = [0, 9, 21, 35][state.weaponLevel - 1] || 0;
  const xpPct = state.weaponLevel >= 5 ? 1 : clamp((state.weaponXp - pv) / (nx - pv), 0, 1);
  ctx.font = `700 10px ${F_MONO}`;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#7df9ff';
  ctx.fillText(`WPN LV.${state.weaponLevel}${state.weaponLevel >= 5 ? ' MAX' : ''}`, 18, 41);
  ctx.fillStyle = '#162436';
  ctx.fillRect(18, 45, 108, 5);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(18, 45, 108 * xpPct, 5);
  const dashPct = state.player.dashCd <= 0 ? 1 : Math.max(0, 1 - state.player.dashCd / h.dashCd);
  ctx.fillStyle = dashPct >= 1 ? '#fde047' : '#94a3b8';
  ctx.fillText(dashPct >= 1 ? '⚡ DASH READY' : '⚡ RECHARGING', 138, 41);
  ctx.fillStyle = '#1e1b2e';
  ctx.fillRect(138, 45, 118, 5);
  ctx.fillStyle = dashPct >= 1 ? '#facc15' : '#64748b';
  ctx.fillRect(138, 45, 118 * dashPct, 5);
  if (dashPct >= 1) {
    const sh = (state.realTime * 1.5) % 1;
    ctx.globalAlpha = 0.6 * (1 - sh);
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 1;
    ctx.strokeRect(138 - sh * 6, 45 - sh * 4, 118 + sh * 12, 5 + sh * 8);
    ctx.globalAlpha = 1;
  }
}

/** Marks runs that used the stage-warp cheat. */
function drawWarpRunTag() {
  if (state.runCheated) {
    ctx.font = `800 9px ${F_MONO}`;
    ctx.textAlign = 'left';
    ctx.fillStyle = `rgba(251,113,133,${0.7 + 0.3 * Math.sin(state.realTime * 4)})`;
    ctx.fillText('⚡ WARP RUN — BEST NOT SAVED', 14, 76);
  }
}

/** Stage name, objective progress bar and objective text. */
function drawStagePanel() {
  ctx.fillStyle = 'rgba(8,6,18,0.86)';
  ctx.strokeStyle = 'rgba(255,204,102,0.35)';
  ctx.fillRect(W / 2 - 115, 8, 230, 58);
  ctx.strokeRect(W / 2 - 115, 8, 230, 58);
  ctx.font = `700 14px ${F_DISPLAY}`;
  ctx.fillStyle = '#fde68a';
  ctx.textAlign = 'center';
  ctx.fillText(`${STAGES[state.stageIndex].n} // ${STAGES[state.stageIndex].s.toUpperCase()}`, W / 2, 25);
  const coinPct =
    state.stageIndex < 5
      ? state.coins.length
        ? (state.coins.length - state.coinsLeft) / state.coins.length
        : 1
      : state.boss
        ? 1 - Math.max(0, state.boss.hp) / state.boss.max
        : 0;
  ctx.fillStyle = '#2a1220';
  ctx.fillRect(W / 2 - 95, 33, 190, 6);
  ctx.fillStyle = state.stageIndex >= 5 ? '#e11d48' : state.coinsLeft <= 0 ? '#4ade80' : '#facc15';
  ctx.fillRect(W / 2 - 95, 33, 190 * coinPct, 6);
  let objTxt, objCol;
  if (state.stageIndex >= 5) {
    objTxt = state.boss && state.boss.dead ? '✦ MALAKOR HAS FALLEN' : '⚔ OBJECTIVE: DEFEAT MALAKOR';
    objCol = '#fda4af';
  } else if (state.coinsLeft > 0) {
    objTxt = `◆ OBJECTIVE: COLLECT ALL COINS ${state.coins.length - state.coinsLeft}/${state.coins.length}`;
    objCol = '#fde047';
  } else {
    objTxt = '▶ GATE OPEN — ENTER THE PORTAL';
    objCol = `rgba(110,231,183,${0.75 + 0.25 * Math.sin(state.realTime * 6)})`;
  }
  ctx.font = `700 10px ${F_MONO}`;
  ctx.fillStyle = objCol;
  ctx.fillText(objTxt, W / 2, 54);
}

/** Coins, lives, score, difficulty and FPS. */
function drawTelemetryPanel() {
  ctx.fillStyle = 'rgba(8,6,18,0.86)';
  ctx.strokeStyle = 'rgba(179,136,255,0.32)';
  ctx.fillRect(W - 355, 8, 215, 44);
  ctx.strokeRect(W - 355, 8, 215, 44);
  ctx.font = `700 12px ${F_MONO}`;
  ctx.textAlign = 'left';
  ctx.fillStyle = state.hudCoinFlash > 0 ? '#fff7b0' : '#e2e8f0';
  {
    const cpop = 1 + Math.max(0, state.hudCoinFlash) * 1.1;
    ctx.save();
    ctx.translate(W - 345, 21);
    ctx.scale(cpop, cpop);
    ctx.fillText(
      `COINS: ${Math.min(state.coinShown, state.coins.length - state.coinsLeft)}/${state.coins.length}`,
      0,
      4
    );
    ctx.restore();
  }
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText(`LIVES: ${Math.max(0, state.lives)}`, W - 250, 25);
  ctx.fillStyle = state.hudScoreFlash > 0 ? '#fff7b0' : '#facc15';
  ctx.fillText(`SCORE: ${state.score}`, W - 345, 42);
  ctx.fillStyle = '#64748b';
  ctx.font = `700 10px ${F_MONO}`;
  ctx.textAlign = 'right';
  ctx.fillText(`${state.fps} FPS`, W - 148, 42);
  ctx.font = `700 9px ${F_MONO}`;
  ctx.fillStyle = difficulty().color;
  ctx.fillText(difficulty().label, W - 190, 42);
}

/** Collected coins arcing into the coin counter. */
function drawFlyingCoins() {
  for (const f of state.flyingCoins) {
    const k = clamp(f.t / f.dur, 0, 1),
      e = k * k * (3 - 2 * k);
    const tx = W - 312,
      ty = 20;
    const x = lerp(f.x0, tx, e) + Math.sin(k * Math.PI) * 50 * f.side;
    const y = lerp(f.y0, ty, e) - Math.sin(k * Math.PI) * 70;
    const sc = 1 - k * 0.4;
    drawGlow(x, y, 18 * sc, 'gold', 0.75);
    const spin = Math.max(0.25, Math.abs(Math.cos(state.realTime * 14 + f.sp)));
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(x, y, 7 * sc * spin, 7 * sc, 0, 0, 6.3);
    ctx.fill();
    ctx.stroke();
  }
  for (const c of state.coinCounterPops) {
    const k = 1 - c.t / c.m;
    ctx.strokeStyle = `rgba(253,224,71,${1 - k})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(W - 312, 20, 8 + k * 22, 0, 6.3);
    ctx.stroke();
  }
}

/** Hit-combo meter. */
function drawComboMeter() {
  if (state.combo >= 2) {
    const mult = Math.min(4.0, 1 + Math.floor(state.combo / 3) * 0.5);
    const pulse = 1 + Math.max(0, state.comboT - 3.8) * 0.8;
    ctx.fillStyle = 'rgba(34,15,58,0.9)';
    ctx.strokeStyle = '#e879f9';
    ctx.fillRect(W - 355, 56, 145, 24);
    ctx.strokeRect(W - 355, 56, 145, 24);
    ctx.font = `700 12px ${F_DISPLAY}`;
    ctx.fillStyle = '#f0abfc';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(W - 282, 72);
    ctx.scale(pulse, pulse);
    ctx.fillText(`${state.combo} HIT COMBO // x${mult.toFixed(1)}`, 0, 0);
    ctx.restore();
  }
}

/** Malakor's health bar with phase markers. */
function drawBossHealthBar() {
  const boss = state.boss;
  if (!boss || boss.dead || state.bossIntro > 0) return;
  const bw = 420;
  const bx = W / 2 - bw / 2;
  const by = 76;
  ctx.fillStyle = 'rgba(10,4,18,0.92)';
  ctx.strokeStyle = '#ff2a55';
  ctx.lineWidth = 1.5;
  ctx.fillRect(bx - 4, by - 4, bw + 8, 22);
  ctx.strokeRect(bx - 4, by - 4, bw + 8, 22);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillRect(bx, by, bw * Math.max(0, boss.dispHp / boss.max), 14);
  ctx.fillStyle = boss.pl === 3 ? '#ff1e4d' : boss.pl === 2 ? '#e11d48' : '#9333ea';
  ctx.fillRect(bx, by, bw * Math.max(0, boss.hp / boss.max), 14);
  // Phase thresholds as notches on the frame, so they never cut through the label.
  ctx.fillStyle = '#ffffff';
  for (const f of [0.34, 0.67]) {
    ctx.fillRect(bx + bw * f - 1, by - 4, 2, 4);
    ctx.fillRect(bx + bw * f - 1, by + 14, 2, 4);
  }
  ctx.font = `700 11px ${F_DISPLAY}`;
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(20,4,14,0.85)';
  const label = `MALAKOR, LORD OF THE ABYSS — PHASE ${boss.pl} // ${boss.atkName}`;
  ctx.strokeText(label, W / 2, by + 11);
  ctx.fillStyle = '#ffe4e6';
  ctx.fillText(label, W / 2, by + 11);
}

/** Virtual joysticks on touch devices. */
function drawTouchSticks() {
  if (settings.touchMode === 'on' || (settings.touchMode === 'auto' && isTouchDevice)) {
    for (const j of [leftStick, rightStick]) {
      ctx.save();
      ctx.strokeStyle = j === leftStick ? 'rgba(125,249,255,0.35)' : 'rgba(250,204,21,0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(j.cx, j.cy, 44, 0, 6.3);
      ctx.stroke();
      ctx.fillStyle = j === leftStick ? 'rgba(125,249,255,0.45)' : 'rgba(250,204,21,0.45)';
      ctx.beginPath();
      ctx.arc(j.x, j.y, 18, 0, 6.3);
      ctx.fill();
      ctx.restore();
    }
  }
}

/** Rotating crosshair; turns red over a target. */
/** The crosshair only shows while the player is actually in control. */
const crosshairVisible = () =>
  state.scene === 'play' &&
  state.stageCardTimer <= 0 &&
  state.warpTimer <= 0 &&
  state.bossIntro <= 0 &&
  state.player.dying <= 0 &&
  (!isTouchDevice || mouse.d);

function drawCrosshair() {
  if (crosshairVisible()) {
    let overEnemy = false;
    for (const e of state.enemies)
      if (isDamageable(e) && dist(mouse.x, mouse.y, e.x, e.y) < 32) {
        overEnemy = true;
        break;
      }
    if (state.boss && !state.boss.dead && dist(mouse.x, mouse.y, state.boss.x, state.boss.y) < 60) overEnemy = true;
    ctx.save();
    ctx.translate(mouse.x, mouse.y);
    ctx.rotate(state.realTime * 2.2);
    ctx.strokeStyle = overEnemy ? '#ff2a55' : '#7df9ff';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, overEnemy ? 11 : 9, 0, 6.3);
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * 6.283;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 5, Math.sin(a) * 5);
      ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 14);
      ctx.stroke();
    }
    ctx.restore();
  }
}
