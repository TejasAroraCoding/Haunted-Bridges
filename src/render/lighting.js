/**
 * Darkness mask, coloured light, ambient embers and the vignette.
 *
 * HIGH graphics: a half-resolution darkness layer has soft holes cut around light sources, the
 * vignette is baked into it, and it is laid over the scene in one copy. Coloured glows are then
 * added on top. PERFORMANCE graphics skips all of this and only draws the vignette.
 */

import { state } from '../core/state.js';
import { HEROES } from '../config/heroes.js';
import { ctx } from '../core/canvas.js';
import { GATE_ZONE, H, W } from '../core/constants.js';
import { isHighGfx } from '../core/settings.js';
import { embers } from '../game/effects.js';
import { darkLayer, darkVignette, drawGlow, drawOverlay, stampLight, vignetteLayer } from './sprites.js';

const MARGIN = 160;
/** True if a circle of radius r at (x, y) can touch the screen. */
const onScreen = (x, y, r) => x + r > -MARGIN && x - r < W + MARGIN && y + r > -MARGIN && y - r < H + MARGIN;

function light(x, y, r, alpha) {
  if (onScreen(x, y, r)) stampLight(x, y, r, alpha);
}

export function drawDarkness() {
  if (!isHighGfx()) return;
  const dg = darkLayer.x;
  dg.setTransform(1, 0, 0, 1, 0, 0);
  dg.globalAlpha = 1;
  dg.globalCompositeOperation = 'copy';
  dg.fillStyle = `rgba(3,2,12,${0.36 + state.stageIndex * 0.025})`;
  dg.fillRect(0, 0, darkLayer.c.width, darkLayer.c.height);

  dg.globalCompositeOperation = 'destination-out';
  const p = state.player;
  light(p.x, p.y, 290 + Math.sin(state.realTime * 2) * 6, 1);
  for (const c of state.candleCoords) light(c.x, c.y - 3, 64, 0.55);
  for (const b of state.playerBullets) light(b.x, b.y, b.weapon === 'fireball' ? 74 : 44, 0.6);
  for (const c of state.coins) if (!c.got) light(c.x, c.y, 68, 0.8);
  for (const e of state.enemies) light(e.x, e.y, 78, 0.8);
  if (state.boss && !state.boss.dead) light(state.boss.x, state.boss.y, 145, 0.9);
  if (state.stageIndex < 5) light(GATE_ZONE.x + 20, H / 2, 105, 0.85);

  dg.globalAlpha = 1;
  dg.globalCompositeOperation = 'source-over';
  dg.drawImage(darkVignette.c, 0, 0); // vignette baked in: one less full-screen pass

  // The mask is a soft gradient, so stretching it without smoothing looks identical and is much cheaper.
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(darkLayer.c, 0, 0, W, H);
  ctx.imageSmoothingEnabled = true;
  lightPass();
}

function glow(x, y, r, color, alpha) {
  if (onScreen(x, y, r)) drawGlow(x, y, r, color, alpha);
}

/** Coloured light: additive tinted glows drawn over the darkness mask. */
function lightPass() {
  ctx.globalCompositeOperation = 'lighter';
  for (const c of state.candleCoords) {
    glow(c.x, c.y - 2, 58 * (0.85 + 0.15 * Math.sin(state.realTime * 9 + c.i * 1.3)), 'gold', 0.16);
  }
  glow(state.player.x, state.player.y + 12, 110, HEROES[state.selectedHeroIndex].glowKey, 0.1);
  for (const b of state.playerBullets) {
    const fire = b.weapon === 'fireball';
    glow(b.x, b.y, fire ? 70 : 42, b.gKey || 'cyan', fire ? 0.34 : 0.18);
  }
  for (const b of state.enemyBullets) glow(b.x, b.y, 36, b.gKey || 'purple', 0.14);
  if (state.stageIndex < 5) {
    const r = 150 + state.gateLift * 50 + state.gateFlare * 120;
    const alpha = 0.08 + state.gateLift * 0.24 + state.gateFlare * 0.3;
    glow(GATE_ZONE.x + 20, H / 2, r, state.gateLift > 0.02 ? 'green' : 'red', alpha);
  }
  for (const pu of state.powerUps) {
    if (!pu.got) glow(pu.x, pu.y, 60, pu.kind === 'rapid' ? 'gold' : pu.kind === 'shield' ? 'cyan' : 'green', 0.15);
  }
  for (const heart of state.hearts) if (!heart.got) glow(heart.x, heart.y, 56, 'red', 0.15);
  for (const m of state.bloodMist) glow(m.x, m.y, m.r * 2.4, 'red', 0.12 * Math.min(1, m.t / m.m));
  for (const b of state.bombs) glow(b.x, b.y, 85, 'orange', 0.1 + (1 - b.t / 1.25) * 0.22);
  for (const e of state.enemies) {
    if (e.type === 'wizard') glow(e.x - 16, e.y - 36, 72, 'cyan', 0.15);
    else if (e.type === 'orb') glow(e.x, e.y, 80, 'purple', 0.16);
    else if (e.type === 'vampire') glow(e.x, e.y, 60, 'red', 0.1);
  }
  for (const w of state.walls) if (w.eye) glow(w.x + w.w / 2, w.y + w.h / 2, 100, 'cyan', 0.14);
  const boss = state.boss;
  if (boss && !boss.dead) glow(boss.x, boss.y, 240, boss.pl === 3 ? 'red' : 'purple', 0.14 + (boss.wind || 0) * 0.14);
  ctx.globalCompositeOperation = 'source-over';
}

/** Ambient embers drifting above the lighting. */
export function drawEmbers() {
  if (!isHighGfx()) return;
  for (const e of embers) {
    const twinkle = 0.6 + 0.4 * Math.sin(e.p * 5);
    drawGlow(e.x, e.y, e.r * 3.5, e.c === '#ffe08a' ? 'gold' : 'orange', 0.5 * twinkle);
  }
}

/** Vignette (already baked into the darkness layer in HIGH graphics). */
export function drawVignette() {
  if (!isHighGfx()) drawOverlay(vignetteLayer);
}
