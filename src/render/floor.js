/**
 * Bakes each stage's bridge floor into an off-screen layer once per stage.
 */

import { state } from '../core/state.js';
import { createLayer, onRenderScaleChange } from '../core/canvas.js';
import { H, W } from '../core/constants.js';

/** Re-bakes the current stage's floor whenever the render resolution changes mid-run. */
onRenderScaleChange(() => {
  if (state.scene !== 'title' && state.player) bakeFloor(state.stageIndex);
});

/** Paints the stage floor (tiles, sigil, cracks, rails, candles) into `state.floorLayer`. */
export function bakeFloor(stageIdx) {
  if (!state.floorLayer || state.floorLayer.s !== state.renderScale)
    state.floorLayer = createLayer(W, H, state.renderScale);
  const f = state.floorLayer.x;
  f.setTransform(state.renderScale, 0, 0, state.renderScale, 0, 0);
  f.clearRect(0, 0, W, H);
  const hu = [220, 260, 280, 200, 340, 355][stageIdx] || 220;
  const bg = f.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, `hsl(${hu}, 38%, 11%)`);
  bg.addColorStop(0.5, `hsl(${hu + 15}, 32%, 8%)`);
  bg.addColorStop(1, `hsl(${hu + 30}, 36%, 5%)`);
  f.fillStyle = bg;
  f.fillRect(0, 0, W, H);
  for (let i = 0; i < W / 48; i++) {
    for (let j = 0; j < H / 48; j++) {
      const hv = Math.sin(i * 12.9898 + j * 78.233 + stageIdx * 7.1) * 43758.5453;
      const r = hv - Math.floor(hv);
      const bx = i * 48,
        by = j * 48;
      f.fillStyle = r > 0.5 ? `hsla(${hu}, 25%, 18%, ${0.14 + r * 0.12})` : `rgba(0,0,0,${0.12 + r * 0.15})`;
      f.fillRect(bx + 2, by + 2, 44, 44);
      f.fillStyle = 'rgba(255,255,255,0.045)';
      f.fillRect(bx + 2, by + 2, 44, 1.5);
      f.fillRect(bx + 2, by + 2, 1.5, 44);
      f.fillStyle = 'rgba(0,0,0,0.42)';
      f.fillRect(bx, by, 48, 2);
      f.fillRect(bx, by, 2, 48);
    }
  }
  if (stageIdx === 3 || stageIdx === 4) {
    f.fillStyle = 'rgba(125,249,255,0.035)';
    f.strokeStyle = 'rgba(125,249,255,0.12)';
    f.lineWidth = 1;
    [110, 200, 340, 430].forEach(y => {
      f.fillRect(0, y - 20, W, 40);
      f.beginPath();
      f.moveTo(0, y - 20);
      f.lineTo(W, y - 20);
      f.moveTo(0, y + 20);
      f.lineTo(W, y + 20);
      f.stroke();
    });
  }
  f.save();
  f.translate(W / 2, H / 2);
  f.strokeStyle = `hsla(${hu + 20}, 65%, 65%, 0.13)`;
  f.lineWidth = 2;
  f.beginPath();
  f.arc(0, 0, 88, 0, Math.PI * 2);
  f.stroke();
  f.beginPath();
  f.arc(0, 0, 74, 0, Math.PI * 2);
  f.stroke();
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    f.beginPath();
    f.moveTo(Math.cos(a) * 74, Math.sin(a) * 74);
    f.lineTo(Math.cos(a + 0.785) * 44, Math.sin(a + 0.785) * 44);
    f.stroke();
  }
  f.restore();
  f.strokeStyle = 'rgba(0,0,0,0.55)';
  f.lineWidth = 1.5;
  for (let i = 0; i < 11; i++) {
    const x = ((i * 211 + 90) % (W - 60)) + 30,
      y = ((i * 131 + 50) % (H - 80)) + 40;
    f.beginPath();
    f.moveTo(x, y);
    f.lineTo(x + 14, y + 18);
    f.lineTo(x + 5, y + 32);
    f.lineTo(x + 21, y + 48);
    f.stroke();
  }
  f.fillStyle = '#0e0b18';
  f.fillRect(0, 0, W, 16);
  f.fillRect(0, H - 16, W, 16);
  f.strokeStyle = '#3a3254';
  f.lineWidth = 2;
  f.beginPath();
  f.moveTo(0, 16);
  f.lineTo(W, 16);
  f.moveTo(0, H - 16);
  f.lineTo(W, H - 16);
  f.stroke();
  for (let x = 90; x < W - 80; x += 180) {
    for (const py of [14, H - 14]) {
      f.fillStyle = '#1d1830';
      f.strokeStyle = '#534778';
      f.lineWidth = 1.5;
      f.fillRect(x - 10, py - 9, 20, 18);
      f.strokeRect(x - 10, py - 9, 20, 18);
      f.fillStyle = '#090710';
      f.beginPath();
      f.arc(x, py, 5.5, 0, Math.PI * 2);
      f.fill();
    }
  }
  state.candleCoords = [];
  for (let i = 0; i < 12; i++) {
    const x = ((i * 97 + 45) % (W - 140)) + 20;
    const y = ((i * 173 + 60) % (H - 80)) + 40;
    const k = (i + stageIdx) % 3;
    f.save();
    f.translate(x, y);
    if (k === 0) {
      f.fillStyle = '#151221';
      f.strokeStyle = '#474066';
      f.lineWidth = 1.5;
      f.beginPath();
      f.moveTo(-9, 12);
      f.lineTo(-9, -4);
      f.arc(0, -4, 9, Math.PI, 0);
      f.lineTo(9, 12);
      f.closePath();
      f.fill();
      f.stroke();
      f.strokeStyle = '#62598a';
      f.beginPath();
      f.moveTo(0, -8);
      f.lineTo(0, 3);
      f.moveTo(-4, -4);
      f.lineTo(4, -4);
      f.stroke();
    } else if (k === 1) {
      f.fillStyle = '#e0d6be';
      f.fillRect(-2.5, 0, 5, 10);
      f.strokeStyle = '#5c5346';
      f.lineWidth = 1;
      f.strokeRect(-2.5, 0, 5, 10);
      state.candleCoords.push({
        x,
        y,
        i,
      });
    } else {
      f.fillStyle = '#c8c2b4';
      f.beginPath();
      f.arc(0, 0, 6, 0, 6.3);
      f.fill();
      f.fillRect(-4, 5, 8, 4);
      f.fillStyle = '#14111a';
      f.fillRect(-3.2, -1, 2.2, 3);
      f.fillRect(1, -1, 2.2, 3);
    }
    f.restore();
  }
}
