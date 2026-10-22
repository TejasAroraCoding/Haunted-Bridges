/**
 * Full-screen overlays: stage title cards, the warp tunnel, banners and the boss intro.
 */

import { state } from '../core/state.js';
import { drawBossIntro, drawBossLine } from './boss.js';
import { ctx } from '../core/canvas.js';
import { F_DISPLAY, F_MONO, F_SANS, H, W, WARP_DURATION } from '../core/constants.js';
import { STAGES } from '../config/stages.js';
/** Boss intro cinematic and subtitles. */
export function drawBossOverlays() {
  if (state.bossIntro > 0 && state.stageCardTimer <= 0) drawBossIntro();
  if (state.bossLine && state.stageCardTimer <= 0) drawBossLine();
}

/** Banner message along the bottom. */
export function drawBanner() {
  if (state.bannerTimer > 0 && state.stageCardTimer <= 0 && state.warpTimer <= 0 && state.bossIntro <= 0) {
    const a = Math.min(1, state.bannerTimer * 3);
    ctx.globalAlpha = a;
    ctx.font = `700 18px ${F_DISPLAY}`;
    ctx.fillStyle = '#fde047';
    ctx.textAlign = 'center';
    ctx.fillText(state.bannerText, W / 2, H - 32 - (1 - a) * 6);
    ctx.globalAlpha = 1;
  }
}

/** Tunnel transition between stages with the stage-progress track. */
export function drawWarpTransition() {
  if (state.warpTimer > 0) {
    const p = 1 - state.warpTimer / WARP_DURATION;
    ctx.fillStyle = `rgba(4,3,12,${Math.min(0.95, p * 1.45)})`;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    for (let i = 0; i < 10; i++) {
      const k = ((i + state.realTime * 5) % 10) / 10;
      const s = k * k * 820;
      ctx.strokeStyle = `hsla(${175 + i * 10}, 85%, 60%, ${k * 0.75})`;
      ctx.lineWidth = 2 + k * 4;
      ctx.strokeRect(-s * 0.8, -s * 0.45, s * 1.6, s * 0.9);
    }
    ctx.restore();
    ctx.textAlign = 'center';
    ctx.font = `700 14px ${F_MONO}`;
    ctx.fillStyle = '#67e8f9';
    ctx.fillText(
      `SECTOR ${state.stageIndex + 1} CONQUERED // STAGE CLEAR BONUS +${state.lastStageBonus}`,
      W / 2,
      H / 2 - 58
    );
    ctx.font = `700 42px ${F_DISPLAY}`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`WARPING TO ${STAGES[Math.min(5, state.stageIndex + 1)].n}`, W / 2, H / 2 - 12);
    ctx.font = `600 18px ${F_SANS}`;
    ctx.fillStyle = '#fde68a';
    ctx.fillText(STAGES[Math.min(5, state.stageIndex + 1)].s, W / 2, H / 2 + 20);
    for (let i = 0; i < 6; i++) {
      const nx2 = W / 2 - 125 + i * 50,
        ny = H / 2 + 64;
      if (i < 5) {
        ctx.strokeStyle = i <= state.stageIndex ? '#4ade80' : '#334155';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(nx2, ny);
        ctx.lineTo(nx2 + 50, ny);
        ctx.stroke();
      }
      ctx.fillStyle = i <= state.stageIndex ? '#4ade80' : i === state.stageIndex + 1 ? '#fde047' : '#1e293b';
      ctx.beginPath();
      ctx.arc(nx2, ny, 8 + (i === state.stageIndex + 1 ? Math.sin(state.realTime * 6) * 1.5 : 0), 0, 6.3);
      ctx.fill();
    }
  }
}

/** Stage title card with objective and threats. */
export function drawStageCard() {
  if (state.stageCardTimer > 0) {
    const e = 1 - state.stageCardTimer / 2.4;
    const fa = Math.min(1, state.stageCardTimer * 2.2) * Math.min(1, e * 5);
    ctx.fillStyle = `rgba(3,2,10,${Math.min(0.88, state.stageCardTimer * 1.8)})`;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, 54 * fa);
    ctx.fillRect(0, H - 54 * fa, W, 54 * fa);
    ctx.save();
    ctx.globalAlpha = fa;
    const lw = Math.min(1, e * 3.2) * 310;
    ctx.strokeStyle = '#7df9ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - lw, H / 2 - 68);
    ctx.lineTo(W / 2 + lw, H / 2 - 68);
    ctx.moveTo(W / 2 - lw, H / 2 + 96);
    ctx.lineTo(W / 2 + lw, H / 2 + 96);
    ctx.stroke();
    const sl = (1 - Math.min(1, e * 3.2)) * 55;
    ctx.textAlign = 'center';
    ctx.font = `700 54px ${F_DISPLAY}`;
    ctx.fillStyle = '#fde68a';
    ctx.fillText(STAGES[state.stageIndex].n, W / 2 - sl, H / 2 - 14);
    ctx.font = `700 24px ${F_DISPLAY}`;
    ctx.fillStyle = '#7df9ff';
    ctx.fillText(STAGES[state.stageIndex].s, W / 2 + sl, H / 2 + 22);
    const objLine =
      state.stageIndex < 5
        ? `◆ OBJECTIVE: COLLECT ALL ${state.coins.length} COINS TO UNLOCK THE GATE`
        : '⚔ OBJECTIVE: DEFEAT MALAKOR, LORD OF THE ABYSS';
    ctx.font = `700 17px ${F_DISPLAY}`;
    ctx.fillStyle = '#fde047';
    ctx.fillText(objLine, W / 2, H / 2 + 56);
    ctx.font = `600 15px ${F_SANS}`;
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('THREATS: ' + STAGES[state.stageIndex].o, W / 2, H / 2 + 80);
    ctx.restore();
  }
}
