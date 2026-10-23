/**
 * Pre-rendered sprites (glows, vignettes, light stamps) and the drawing helpers that use them.
 *
 * Performance note: scaling an image while drawing it is several times slower than copying it
 * pixel-for-pixel, and soft glows/vignettes are drawn dozens of times per frame. So:
 *  - full-screen overlays (vignettes) are rebuilt at the current render resolution and blitted 1:1;
 *  - glows and light stamps are rendered once at the exact on-screen size they're needed, cached
 *    (with a memory budget) and copied at whole-pixel positions.
 */

import { canvas, createLayer, ctx, onRenderScaleChange } from '../core/canvas.js';
import { H, W } from '../core/constants.js';
import { state } from '../core/state.js';

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

function fillRadial(c2d, w, h, cx, cy, r0, r1, stops) {
  const gradient = c2d.createRadialGradient(cx, cy, r0, cx, cy, r1);
  for (const [offset, color] of stops) gradient.addColorStop(offset, color);
  c2d.fillStyle = gradient;
  c2d.fillRect(0, 0, w, h);
}

const glowStops = hex => [
  [0, hex],
  [0.35, hex + '88'],
  [1, 'rgba(0,0,0,0)'],
];
const LIGHT_STOPS = [
  [0, 'rgba(0,0,0,1)'],
  [0.55, 'rgba(0,0,0,0.55)'],
  [1, 'rgba(0,0,0,0)'],
];
const VIGNETTE_STOPS = [
  [0, 'rgba(0,0,0,0)'],
  [1, 'rgba(0,0,0,0.7)'],
];
const LOW_HP_STOPS = [
  [0, 'rgba(255,20,60,0)'],
  [1, 'rgba(255,20,60,0.55)'],
];

/** Small 64 px glow sprites, one per colour; used for tiny or rotated draws that skip the cache. */
export const glowSprites = {};
for (const [name, hex] of Object.entries(GLOW_COLORS)) {
  const layer = createLayer(64, 64, 1);
  fillRadial(layer.x, 64, 64, 32, 32, 0, 32, glowStops(hex));
  glowSprites[name] = layer.c;
}

/* ---------- Size-exact sprite cache ---------- */

const CACHE_BUDGET_BYTES = 48 * 1024 * 1024;
const SMALL_GLOW_PX = 28;
const spriteCache = new Map(); // key → canvas; Map order doubles as LRU order
let cacheBytes = 0;

/** Rounds a size in device pixels so nearby sizes share one sprite (≤ ~3 % size error). */
const bucket = px => (px < 24 ? Math.max(1, Math.round(px)) : Math.round(px / 4) * 4);

function cachedSprite(key, w, h, paint) {
  let sprite = spriteCache.get(key);
  if (sprite) {
    spriteCache.delete(key); // refresh LRU position
    spriteCache.set(key, sprite);
    return sprite;
  }
  sprite = document.createElement('canvas');
  sprite.width = w;
  sprite.height = h;
  paint(sprite.getContext('2d'), w, h);
  spriteCache.set(key, sprite);
  cacheBytes += w * h * 4;
  for (const [oldKey, old] of spriteCache) {
    if (cacheBytes <= CACHE_BUDGET_BYTES) break;
    spriteCache.delete(oldKey);
    cacheBytes -= old.width * old.height * 4;
  }
  return sprite;
}

function glowSprite(color, diameter) {
  const hex = GLOW_COLORS[color] || GLOW_COLORS.cyan;
  return cachedSprite(`g${color}${diameter}`, diameter, diameter, (c, w) =>
    fillRadial(c, w, w, w / 2, w / 2, 0, w / 2, glowStops(hex))
  );
}

/** Elliptical soft white sprite (fog banks, title mist) at an exact device size. */
export function mistSprite(w, h) {
  const bw = bucket(w);
  const bh = bucket(h);
  return cachedSprite(`m${bw}x${bh}`, bw, bh, (c, cw, ch) => {
    c.scale(1, ch / cw);
    fillRadial(c, cw, cw, cw / 2, cw / 2, 0, cw / 2, glowStops('#ffffff'));
  });
}

/**
 * Copies `sprite` so it covers the logical rect (x, y, w, h). When the current transform is a plain
 * scale + translate, the sprite (already at device size) is copied 1:1 at a whole-pixel position.
 */
export function blitAligned(sprite, x, y, w, h) {
  const t = ctx.getTransform();
  if (t.b !== 0 || t.c !== 0) {
    ctx.drawImage(sprite, x, y, w, h);
    return;
  }
  const dx = Math.round(t.a * (x + w / 2) + t.e - sprite.width / 2);
  const dy = Math.round(t.d * (y + h / 2) + t.f - sprite.height / 2);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(sprite, dx, dy);
  ctx.setTransform(t);
}

/** Draws a soft glow of radius `r` centred on (x, y). Preserves the caller's globalAlpha. */
export function drawGlow(x, y, r, color = 'cyan', alpha = 0.75) {
  if (alpha <= 0.004 || r <= 0) return;
  const prevAlpha = ctx.globalAlpha;
  ctx.globalAlpha = prevAlpha * alpha;
  const t = ctx.getTransform();
  const diameter = bucket(2 * r * t.a);
  // Small glows are cheap to scale; the 1:1 cache only pays off for larger ones.
  if (diameter < SMALL_GLOW_PX || t.b !== 0 || t.c !== 0) {
    ctx.drawImage(glowSprites[color] || glowSprites.cyan, x - r, y - r, r * 2, r * 2);
  } else {
    blitAligned(glowSprite(color, diameter), x - r, y - r, r * 2, r * 2);
  }
  ctx.globalAlpha = prevAlpha;
}

/**
 * Draws `image` scaled to the logical rect via a cached copy pre-scaled to device size, so each frame
 * is a 1:1 copy instead of a resample. Use for soft images drawn at a fixed size (e.g. clouds).
 */
export function drawImageExact(image, key, x, y, w, h) {
  const s = state.renderScale;
  const dw = bucket(w * s);
  const dh = bucket(h * s);
  const sprite = cachedSprite(`i${key}${dw}x${dh}`, dw, dh, (c, cw, ch) => c.drawImage(image, 0, 0, cw, ch));
  blitAligned(sprite, x, y, w, h);
}

/** Draws a mist/fog ellipse covering the logical rect, using a size-exact sprite. */
export function drawMist(x, y, w, h, alpha) {
  if (alpha <= 0.004) return;
  const s = state.renderScale;
  const prevAlpha = ctx.globalAlpha;
  ctx.globalAlpha = prevAlpha * alpha;
  blitAligned(mistSprite(w * s, h * s), x, y, w, h);
  ctx.globalAlpha = prevAlpha;
}

/* ---------- Darkness mask (half resolution) ---------- */

/** Darkness mask at half the logical resolution, redrawn every frame by render/lighting.js. */
export const darkLayer = createLayer(W, H, 0.5);

/** Vignette pre-scaled to the darkness layer's size, so baking it in is a 1:1 copy. */
export const darkVignette = createLayer(W, H, 0.5);
fillRadial(darkVignette.x, W, H, W / 2, H / 2, H * 0.36, H * 0.94, VIGNETTE_STOPS);

/** Cuts a soft hole of radius `r` (logical px) into the darkness layer; caller sets destination-out. */
export function stampLight(x, y, r, alpha) {
  const d = bucket(r); // darkness layer is half-res: logical diameter 2r → r pixels
  const sprite = cachedSprite(`l${d}`, d, d, (c, w) => fillRadial(c, w, w, w / 2, w / 2, 0, w / 2, LIGHT_STOPS));
  const dg = darkLayer.x;
  dg.globalAlpha = alpha;
  dg.drawImage(sprite, Math.round(x / 2 - d / 2), Math.round(y / 2 - d / 2));
}

/* ---------- Full-screen overlays at render resolution ---------- */

/** Soft dark vignette around the screen edges, at canvas resolution. */
export const vignetteLayer = document.createElement('canvas');
/** Pulsing red vignette shown on the last heart, at canvas resolution. */
export const lowHpVignetteLayer = document.createElement('canvas');

function rebuildOverlays() {
  for (const [layer, inner, outer, stops] of [
    [vignetteLayer, 0.36, 0.94, VIGNETTE_STOPS],
    [lowHpVignetteLayer, 0.3, 0.9, LOW_HP_STOPS],
  ]) {
    layer.width = canvas.width;
    layer.height = canvas.height;
    const c = layer.getContext('2d');
    c.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    fillRadial(c, W, H, W / 2, H / 2, H * inner, H * outer, stops);
  }
}
rebuildOverlays();
onRenderScaleChange(() => {
  rebuildOverlays();
  spriteCache.clear(); // sprite sizes depend on the render scale
  cacheBytes = 0;
});

/** Draws a full-screen overlay canvas 1:1 regardless of the current transform. */
export function drawOverlay(layer) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(layer, 0, 0);
  ctx.restore();
}
