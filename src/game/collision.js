/**
 * Collision helpers for the playfield's solid walls.
 */

import { state } from '../core/state.js';
import { clamp, dist } from '../core/math.js';

export const insideRect = (x, y, r) => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h;

/** Pushes a circle of radius `radius` centred on `obj` out of any wall it overlaps. */
export function pushOutOfWalls(obj, radius) {
  for (const wall of state.walls) {
    const nx = clamp(obj.x, wall.x, wall.x + wall.w);
    const ny = clamp(obj.y, wall.y, wall.y + wall.h);
    const d = dist(obj.x, obj.y, nx, ny);
    if (d >= radius) continue;
    if (d === 0) {
      obj.x += radius;
      continue;
    }
    obj.x += ((obj.x - nx) / d) * (radius - d);
    obj.y += ((obj.y - ny) / d) * (radius - d);
  }
}
