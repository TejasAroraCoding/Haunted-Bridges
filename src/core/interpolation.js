/**
 * Render interpolation. Physics runs at a fixed 120 Hz; before drawing, moving objects are temporarily
 * placed between their last two physics positions so motion stays smooth on any refresh rate
 * (60/90/120/144 Hz) and through dropped frames. Positions are restored right after drawing.
 */

import { state } from './state.js';

const TELEPORT_DISTANCE_SQ = 90 * 90; // bigger jumps snap instead of smearing across the screen
const moved = [];

function* movingObjects() {
  if (state.player) yield state.player;
  yield* state.enemies;
  yield* state.enemyBullets;
  yield* state.playerBullets;
  yield* state.coins;
  if (state.boss) yield state.boss;
}

/** Remembers current positions; call before every physics step. */
export function rememberPositions() {
  for (const o of movingObjects()) {
    o.px = o.x;
    o.py = o.y;
  }
}

/** Moves objects to `alpha` (0..1) of the way from their previous to their current position. */
export function applyInterpolation(alpha) {
  moved.length = 0;
  if (alpha >= 0.999) return;
  for (const o of movingObjects()) {
    if (o.px === undefined) continue;
    const dx = o.x - o.px;
    const dy = o.y - o.py;
    if (dx * dx + dy * dy > TELEPORT_DISTANCE_SQ) continue;
    o._x = o.x;
    o._y = o.y;
    o.x = o.px + dx * alpha;
    o.y = o.py + dy * alpha;
    moved.push(o);
  }
}

/** Puts every interpolated object back at its real physics position. */
export function restorePositions() {
  for (const o of moved) {
    o.x = o._x;
    o.y = o._y;
  }
  moved.length = 0;
}
