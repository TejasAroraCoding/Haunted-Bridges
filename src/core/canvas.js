/**
 * The main canvas, its 2D context, off-screen layers and render-resolution handling.
 */

import { state } from './state.js';
import { H, W } from './constants.js';
import { isTouchDevice } from './device.js';
import { clamp } from './math.js';
import { settings } from './settings.js';

export const canvas = document.getElementById('c');
export const ctx = canvas.getContext('2d', { alpha: false });

/** Max device-pixel ratio per adaptive-quality level (0 = best). Phones start lower to save fill-rate. */
const PIXEL_RATIO_CAP = [isTouchDevice ? 1.5 : 2, 1.25, 1, 0.8];

const scaleListeners = [];

/** Registers a callback run whenever the render resolution changes (e.g. to re-bake cached layers). */
export function onRenderScaleChange(listener) {
  scaleListeners.push(listener);
}

/**
 * Creates an off-screen canvas layer of logical size w×h rendered at `scale`.
 * @returns {{ c: HTMLCanvasElement, x: CanvasRenderingContext2D, s: number }}
 */
export function createLayer(w, h, scale = 1) {
  const c = document.createElement('canvas');
  c.width = Math.round(w * scale);
  c.height = Math.round(h * scale);
  const x = c.getContext('2d');
  x.setTransform(scale, 0, 0, scale, 0, 0);
  return { c, x, s: scale };
}

/**
 * Sizes the canvas backing store to the on-screen stage size × device pixel ratio,
 * capped by the graphics setting / adaptive quality level. Drawing always uses 960×540 coordinates.
 */
export function updateRenderScale() {
  const stageEl = document.getElementById('game-stage');
  const cssWidth = stageEl?.getBoundingClientRect().width || W;
  const level = settings.gfx === 'auto' ? state.perfLevel : settings.gfx === 'perf' ? 2 : 0;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, PIXEL_RATIO_CAP[level]);
  state.renderScale = Math.round(clamp((cssWidth * pixelRatio) / W, 0.5, 2.5) * 100) / 100;
  const resized = canvas.width !== Math.round(W * state.renderScale);
  if (resized) {
    canvas.width = Math.round(W * state.renderScale);
    canvas.height = Math.round(H * state.renderScale);
  }
  ctx.setTransform(state.renderScale, 0, 0, state.renderScale, 0, 0);
  if (resized) for (const listener of scaleListeners) listener(state.renderScale);
}
