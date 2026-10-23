/**
 * Draws the playfield: hazards, pickups, enemies, projectiles, lighting and the gate.
 */

import { state } from '../core/state.js';

import { ctx } from '../core/canvas.js';
import { H, W } from '../core/constants.js';

import { fogBanks } from '../game/effects.js';
import { drawBoss } from './boss.js';
import { drawEnemies } from './enemies.js';
import { drawBats, drawCorpses } from './death-animations.js';
import { drawPlayer } from './hero.js';
import { blitAligned, drawGlow, drawMist } from './sprites.js';
import { drawBloodMist, drawBombs, drawEnemyBullets, drawLasers, drawSpikeTraps, drawWalls } from './hazards.js';
import { drawEntry, drawGate } from './gate.js';
import { drawCoins, drawHearts, drawPowerUps } from './pickups.js';
import { drawPlayerProjectiles } from './projectiles.js';
import {
  drawDashGhosts,
  drawHitIndicators,
  drawParticles,
  drawScreenFlashes,
  drawShockwaves,
  drawSoulOrbs,
} from './effects.js';
import { drawDarkness, drawEmbers, drawVignette } from './lighting.js';

/** Playfield layers, back to front. */
const WORLD_LAYERS = [
  drawFloorMist,
  drawCandles,
  drawBloodMist,
  drawWalls,
  drawSpikeTraps,
  drawGate,
  drawEntry,
  drawCoins,
  drawHearts,
  drawPowerUps,
  drawBombs,
  drawCorpses,
  drawEnemies,
  drawBoss,
  drawLasers,
  drawEnemyBullets,
  drawPlayerProjectiles,
  drawDashGhosts,
  drawHeroOnField,
  drawShockwaves,
  drawParticles,
  drawBats,
  drawSoulOrbs,
  drawDarkness,
  drawEmbers,
  drawVignette,
  drawHitIndicators,
  drawScreenFlashes,
];

/**
 * Draws the whole playfield for one frame. Each layer runs inside save/restore, so canvas state one
 * layer sets (alpha, blend mode, line style, text alignment…) can never leak into the next.
 */
export function drawWorld() {
  blitAligned(state.floorLayer.c, 0, 0, W, H); // floor is baked at render resolution
  for (const drawLayer of WORLD_LAYERS) {
    ctx.save();
    drawLayer();
    ctx.restore();
  }
}

/** Drifting mist over the chasm lanes (under everything else). */
function drawFloorMist() {
  for (const f of fogBanks)
    drawMist(f.x - f.w / 2, f.y - f.w * 0.18, f.w, f.w * 0.36, f.a * (0.8 + 0.2 * Math.sin(f.p)));
}

/** Flickering candles baked into the floor. */
function drawCandles() {
  for (const c of state.candleCoords) {
    const fl = 0.75 + 0.25 * Math.sin(state.realTime * 9 + c.i * 1.3) + Math.sin(state.realTime * 23 + c.i) * 0.05;
    drawGlow(c.x, c.y - 3, 22 * fl, 'gold', 0.45);
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y - 3, 2.5, 4.4 * fl, Math.sin(state.realTime * 4 + c.i) * 0.08, 0, 6.3);
    ctx.fill();
    ctx.fillStyle = '#fff6d0';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y - 3, 1.1, 2.2 * fl, 0, 0, 6.3);
    ctx.fill();
  }
}

/** The hero, blinking while invulnerable. */
function drawHeroOnField() {
  if (
    state.player.dying > 0 ||
    !(state.player.inv > 0 && state.player.dashT <= 0 && Math.floor(state.realTime * 15) % 2)
  ) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(state.player.x, state.player.y + 32, 17, 5, 0, 0, 6.3);
    ctx.fill();
    drawPlayer(state.player.x, state.player.y, state.player.step);
  }
}
