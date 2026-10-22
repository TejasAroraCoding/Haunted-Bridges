/**
 * Pre-rendered sprites (glows, vignettes, light stamps) and the glow helper.
 * Everything here is drawn once at startup so the per-frame renderer only blits images.
 */

import { createLayer, ctx } from '../core/canvas.js';
import { H, W } from '../core/constants.js';

/** Half-resolution darkness mask, redrawn each frame by render/lighting.js. */
export const darkLayer = createLayer(W, H, 0.5);

/** Soft dark vignette around the screen edges. */
export const vignetteLayer = createLayer(W, H, 1);

/** Pulsing red vignette shown on the last heart. */
export const lowHpVignetteLayer = createLayer(W, H, 1);

/** Radial stamp used to cut light out of the darkness mask. */
export const lightStamp = createLayer(128, 128, 1);

function fillRadial(layer, cx, cy, r0, r1, stops) {
  const gradient = layer.x.createRadialGradient(cx, cy, r0, cx, cy, r1);
  for (const [offset, color] of stops) gradient.addColorStop(offset, color);
  layer.x.fillStyle = gradient;
  layer.x.fillRect(0, 0, layer.c.width / layer.s, layer.c.height / layer.s);
}

fillRadial(vignetteLayer, W / 2, H / 2, H * 0.36, H * 0.94, [
  [0, 'rgba(0,0,0,0)'],
  [1, 'rgba(0,0,0,0.7)'],
]);
fillRadial(lowHpVignetteLayer, W / 2, H / 2, H * 0.3, H * 0.9, [
  [0, 'rgba(255,20,60,0)'],
  [1, 'rgba(255,20,60,0.55)'],
]);
fillRadial(lightStamp, 64, 64, 0, 64, [
  [0, 'rgba(0,0,0,1)'],
  [0.55, 'rgba(0,0,0,0.55)'],
  [1, 'rgba(0,0,0,0)'],
]);

const GLOW_COLORS = {
  cyan: '#7df9ff',
  gold: '#ffcc55',
  red: '#ff2a55',
  purple: '#c77dff',
  green: '#55ff99',
  orange: '#ff7722',
  white: '#ffffff',
  blue: '#4da6ff',
};

/** One soft round glow sprite per named colour. */
export const glowSprites = {};
for (const [name, hex] of Object.entries(GLOW_COLORS)) {
  const layer = createLayer(64, 64, 1);
  fillRadial(layer, 32, 32, 0, 32, [
    [0, hex],
    [0.35, hex + '88'],
    [1, 'rgba(0,0,0,0)'],
  ]);
  glowSprites[name] = layer.c;
}

/** Draws a glow sprite of radius `r` centred on (x, y). Preserves the caller's globalAlpha. */
export function drawGlow(x, y, r, color = 'cyan', alpha = 0.75) {
  const sprite = glowSprites[color] || glowSprites.cyan;
  const prevAlpha = ctx.globalAlpha;
  ctx.globalAlpha = prevAlpha * alpha;
  ctx.drawImage(sprite, x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = prevAlpha;
}
