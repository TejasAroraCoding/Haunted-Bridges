/**
 * Fixed dimensions, timings and fonts shared across the game.
 * All game logic and drawing uses a 960×540 logical playfield; the canvas is scaled to the screen.
 */

/** Logical playfield width. */
export const W = 960;
/** Logical playfield height. */
export const H = 540;
/** Physics runs at a fixed 120 Hz regardless of the display refresh rate. */
export const PHYSICS_STEP = 1 / 120;

export const F_DISPLAY = "'Chakra Petch', sans-serif";
export const F_SANS = "'Rajdhani', sans-serif";
export const F_MONO = "'JetBrains Mono', monospace";

/** Seconds spent in the warp tunnel between stages. */
export const WARP_DURATION = 2.2;
/** Seconds an enemy spends fading in (harmless and invulnerable meanwhile). */
export const MATERIALIZE_TIME = 0.6;
/** Seconds the hero's death animation lasts before respawn or game over. */
export const DEATH_ANIM_TIME = 0.75;
/** Seconds the gate's unlock → lift → open sequence lasts. */
export const GATE_OPEN_DURATION = 2.0;

/** Area at the right edge the hero walks into to enter the open portal. */
export const GATE_ZONE = { x: W - 44, y: H / 2 - 58, w: 44, h: 116 };
