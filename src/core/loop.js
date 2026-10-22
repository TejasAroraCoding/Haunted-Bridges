/**
 * Main loop. Each display frame: animate cosmetics, run as many fixed 120 Hz physics steps as the
 * elapsed time needs, then draw with positions interpolated between physics states.
 */

import { state } from './state.js';
import { ctx } from './canvas.js';
import { PHYSICS_STEP } from './constants.js';
import { clamp } from './math.js';
import { applyInterpolation, rememberPositions, restorePositions } from './interpolation.js';
import { governQuality } from './quality.js';

import { stepGame } from '../game/update.js';
import { updateVisuals } from '../render/animate.js';
import { drawHud } from '../render/hud.js';
import { drawTitle } from '../render/title.js';
import { drawWorld } from '../render/world.js';
import { drawEndPortrait } from '../ui/end-screen.js';
import { applyShake, updateShake } from '../game/camera.js';

const MAX_FRAME_TIME = 0.1; // long pauses (tab switch) don't fast-forward the game
const MAX_STEPS_PER_FRAME = 12;

let lastFrameTime = 0;
let accumulator = 0;
let fpsFrames = 0;
let fpsTimer = 0;
let inRunClass = null;

/** Lets CSS hide some buttons on small screens while a run is in progress. */
function syncRunClass() {
  const inRun = state.scene === 'play' || state.scene === 'pause';
  if (inRun === inRunClass) return;
  inRunClass = inRun;
  document.body.classList.toggle('in-run', inRun);
}

function measureFps(dt) {
  fpsFrames++;
  fpsTimer += dt;
  if (fpsTimer < 0.5) return;
  state.fps = Math.min(144, Math.round(fpsFrames / fpsTimer));
  fpsFrames = 0;
  fpsTimer = 0;
}

function runPhysics(dt) {
  if (state.scene !== 'play') {
    accumulator = 0;
    return;
  }
  accumulator += dt;
  let steps = 0;
  while (accumulator >= PHYSICS_STEP && steps++ < MAX_STEPS_PER_FRAME) {
    rememberPositions();
    stepGame(PHYSICS_STEP);
    accumulator -= PHYSICS_STEP;
  }
  if (steps >= MAX_STEPS_PER_FRAME) accumulator = 0; // too far behind: drop time rather than spiral
}

function drawGame(dt) {
  applyInterpolation(state.scene === 'play' ? clamp(accumulator / PHYSICS_STEP, 0, 1) : 1);
  ctx.save();
  updateShake(dt);
  applyShake();
  drawWorld();
  ctx.restore();
  drawHud();
  restorePositions();
}

function frame(timestamp) {
  if (!lastFrameTime) lastFrameTime = timestamp;
  const dt = Math.min(MAX_FRAME_TIME, (timestamp - lastFrameTime) / 1000);
  lastFrameTime = timestamp;

  syncRunClass();
  measureFps(dt);
  state.realTime += dt;
  updateVisuals(dt);

  if (state.scene === 'title') {
    state.gameTime += dt;
    accumulator = 0;
    drawTitle();
  } else {
    runPhysics(dt);
    governQuality(dt);
    drawGame(dt);
    if (state.scene === 'over' || state.scene === 'win') drawEndPortrait();
  }
  requestAnimationFrame(frame);
}

/** Starts the render loop. */
export function startLoop() {
  requestAnimationFrame(frame);
}
