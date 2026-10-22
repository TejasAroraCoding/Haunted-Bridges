/**
 * Darkness mask, coloured light and vignette.
 */

import { isHighGfx } from '../core/settings.js';
import { darkLayer, drawGlow, lightStamp, vignetteLayer } from './sprites.js';
import { GATE_ZONE, H, W } from '../core/constants.js';
import { state } from '../core/state.js';
import { ctx } from '../core/canvas.js';
import { HEROES } from '../config/heroes.js';
import { embers } from '../game/effects.js';
/** Darkness with light cut out around light sources, then coloured light (HIGH graphics only). */
export function drawDarkness() {
  if (isHighGfx()) {
    const dg = darkLayer.x;
    dg.setTransform(0.5, 0, 0, 0.5, 0, 0);
    dg.globalCompositeOperation = 'source-over';
    dg.clearRect(0, 0, W, H);
    dg.fillStyle = `rgba(3,2,12,${0.36 + state.stageIndex * 0.025})`;
    dg.fillRect(0, 0, W, H);
    dg.globalCompositeOperation = 'destination-out';
    const L = (x, y, r, a = 1) => {
      dg.globalAlpha = a;
      dg.drawImage(lightStamp.c, x - r, y - r, r * 2, r * 2);
    };
    L(state.player.x, state.player.y, 290 + Math.sin(state.realTime * 2) * 6, 1);
    for (const c of state.candleCoords) L(c.x, c.y - 3, 64, 0.55);
    for (const b of state.playerBullets) L(b.x, b.y, b.weapon === 'fireball' ? 74 : 44, 0.6);
    for (const c of state.coins) if (!c.got) L(c.x, c.y, 68, 0.8);
    for (const e of state.enemies) L(e.x, e.y, 78, 0.8);
    if (state.boss) L(state.boss.x, state.boss.y, 145, 0.9);
    if (state.stageIndex < 5) L(GATE_ZONE.x + 20, H / 2, 105, 0.85);
    dg.globalAlpha = 1;
    dg.globalCompositeOperation = 'source-over';
    dg.drawImage(vignetteLayer.c, 0, 0, W, H); // vignette baked into the mask: one less full-screen pass
    ctx.drawImage(darkLayer.c, 0, 0, W, H);
    lightPass();
  }
}

/** Coloured light: additive tinted glows drawn over the darkness mask (HIGH graphics only). */
function lightPass() {
  const op = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'lighter';
  for (const c of state.candleCoords)
    drawGlow(c.x, c.y - 2, 58 * (0.85 + 0.15 * Math.sin(state.realTime * 9 + c.i * 1.3)), 'gold', 0.16);
  drawGlow(state.player.x, state.player.y + 12, 110, HEROES[state.selectedHeroIndex].glowKey, 0.1);
  for (const b of state.playerBullets)
    drawGlow(b.x, b.y, b.weapon === 'fireball' ? 70 : 42, b.gKey || 'cyan', b.weapon === 'fireball' ? 0.34 : 0.18);
  for (const b of state.enemyBullets) drawGlow(b.x, b.y, 36, b.gKey || 'purple', 0.14);
  if (state.stageIndex < 5)
    drawGlow(
      GATE_ZONE.x + 20,
      H / 2,
      150 + state.gateLift * 50 + state.gateFlare * 120,
      state.gateLift > 0.02 ? 'green' : 'red',
      0.08 + state.gateLift * 0.24 + state.gateFlare * 0.3
    );
  for (const pu of state.powerUps)
    if (!pu.got) drawGlow(pu.x, pu.y, 60, pu.kind === 'rapid' ? 'gold' : pu.kind === 'shield' ? 'cyan' : 'green', 0.15);
  for (const hi of state.hearts) if (!hi.got) drawGlow(hi.x, hi.y, 56, 'red', 0.15);
  for (const m of state.bloodMist) drawGlow(m.x, m.y, m.r * 2.4, 'red', 0.12 * Math.min(1, m.t / m.m));
  for (const b of state.bombs) drawGlow(b.x, b.y, 85, 'orange', 0.1 + (1 - b.t / 1.25) * 0.22);
  for (const e of state.enemies) {
    if (e.type === 'wizard') drawGlow(e.x - 16, e.y - 36, 72, 'cyan', 0.15);
    else if (e.type === 'orb') drawGlow(e.x, e.y, 80, 'purple', 0.16);
    else if (e.type === 'vampire') drawGlow(e.x, e.y, 60, 'red', 0.1);
  }
  for (const w of state.walls) if (w.eye) drawGlow(w.x + w.w / 2, w.y + w.h / 2, 100, 'cyan', 0.14);
  if (state.boss && !state.boss.dead)
    drawGlow(
      state.boss.x,
      state.boss.y,
      240,
      state.boss.pl === 3 ? 'red' : 'purple',
      0.14 + (state.boss.wind || 0) * 0.14
    );
  ctx.globalCompositeOperation = op;
}

/** Ambient embers drifting above the lighting. */
export function drawEmbers() {
  if (isHighGfx()) {
    for (const e of embers) {
      const tw = 0.6 + 0.4 * Math.sin(e.p * 5);
      drawGlow(e.x, e.y, e.r * 3.5, e.c === '#ffe08a' ? 'gold' : 'orange', 0.5 * tw);
    }
  }
}

/** Vignette (already baked into the darkness layer in HIGH graphics). */
export function drawVignette() {
  if (!isHighGfx()) ctx.drawImage(vignetteLayer.c, 0, 0, W, H);
}
