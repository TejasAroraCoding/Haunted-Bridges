/**
 * Keyboard, mouse and dual virtual-joystick touch input.
 */

import { state } from '../core/state.js';
import { ensureAudio } from '../audio/audio.js';
import { canvas } from '../core/canvas.js';
import { H, W } from '../core/constants.js';
import { isTouchDevice } from '../core/device.js';
import { clamp } from '../core/math.js';
import { settings } from '../core/settings.js';
import { cheatWarp, setCheats } from '../game/cheats.js';
import { triggerDash } from '../game/player.js';
import { closeModals, startNewGameUI, togglePauseUI } from '../ui/menus.js';
import { toggleMuteUI } from '../ui/settings-panel.js';

let cheatBuffer = '';

/** Keys currently held, by lower-cased `KeyboardEvent.key`. */
export const keys = {};

/** Pointer position in playfield coordinates; `d` = button held, `t` = last move time (ms). */
export const mouse = { x: W / 2, y: H / 2, d: 0, t: 0 };

export const leftStick = {
  active: false,
  id: null,
  cx: 110,
  cy: H - 105,
  x: 110,
  y: H - 105,
  dx: 0,
  dy: 0,
};

export const rightStick = {
  active: false,
  id: null,
  cx: W - 110,
  cy: H - 105,
  x: W - 110,
  y: H - 105,
  dx: 0,
  dy: 0,
};

/** Movement direction from the keyboard plus the left touch stick (not normalised). */
export function readMoveInput() {
  let x = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
  let y = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0);
  if (leftStick.active) {
    x += leftStick.dx;
    y += leftStick.dy;
  }
  return { x, y };
}

export function updateTouchVisibility() {
  const show = settings.touchMode === 'on' || (settings.touchMode === 'auto' && isTouchDevice);
  document.getElementById('touch-layer').classList.toggle('hidden', !(state.scene === 'play' && show));
}

function clientToCanvas(cx, cy) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((cx - r.left) * W) / r.width,
    y: ((cy - r.top) * H) / r.height,
  };
}

function setupTouchControls() {
  const zL = document.getElementById('zone-left');
  const zR = document.getElementById('zone-right');
  const btnDash = document.getElementById('btn-touch-dash');
  const MAXR = 48;
  zL.addEventListener(
    'touchstart',
    e => {
      e.preventDefault();
      ensureAudio();
      const t = e.changedTouches[0],
        p = clientToCanvas(t.clientX, t.clientY);
      leftStick.active = true;
      leftStick.id = t.identifier;
      leftStick.cx = clamp(p.x, 70, 240);
      leftStick.cy = clamp(p.y, H - 220, H - 65);
      leftStick.x = leftStick.cx;
      leftStick.y = leftStick.cy;
      leftStick.dx = 0;
      leftStick.dy = 0;
    },
    {
      passive: false,
    }
  );
  zL.addEventListener(
    'touchmove',
    e => {
      e.preventDefault();
      for (const t of e.changedTouches)
        if (t.identifier === leftStick.id) {
          const p = clientToCanvas(t.clientX, t.clientY);
          const rx = p.x - leftStick.cx,
            ry = p.y - leftStick.cy,
            dist = Math.hypot(rx, ry);
          const cl = Math.min(dist, MAXR),
            a = Math.atan2(ry, rx);
          leftStick.x = leftStick.cx + Math.cos(a) * cl;
          leftStick.y = leftStick.cy + Math.sin(a) * cl;
          leftStick.dx = dist > 6 ? (rx / dist) * (cl / MAXR) : 0;
          leftStick.dy = dist > 6 ? (ry / dist) * (cl / MAXR) : 0;
        }
    },
    {
      passive: false,
    }
  );
  const endL = e => {
    for (const t of e.changedTouches)
      if (t.identifier === leftStick.id) {
        leftStick.active = false;
        leftStick.id = null;
        leftStick.dx = 0;
        leftStick.dy = 0;
      }
  };
  zL.addEventListener('touchend', endL);
  zL.addEventListener('touchcancel', endL);
  zR.addEventListener(
    'touchstart',
    e => {
      e.preventDefault();
      ensureAudio();
      const t = e.changedTouches[0],
        p = clientToCanvas(t.clientX, t.clientY);
      rightStick.active = true;
      rightStick.id = t.identifier;
      rightStick.cx = clamp(p.x, W - 240, W - 70);
      rightStick.cy = clamp(p.y, H - 220, H - 65);
      rightStick.x = rightStick.cx;
      rightStick.y = rightStick.cy;
      rightStick.dx = 0;
      rightStick.dy = 0;
    },
    {
      passive: false,
    }
  );
  zR.addEventListener(
    'touchmove',
    e => {
      e.preventDefault();
      for (const t of e.changedTouches)
        if (t.identifier === rightStick.id) {
          const p = clientToCanvas(t.clientX, t.clientY);
          const rx = p.x - rightStick.cx,
            ry = p.y - rightStick.cy,
            dist = Math.hypot(rx, ry);
          const cl = Math.min(dist, MAXR),
            a = Math.atan2(ry, rx);
          rightStick.x = rightStick.cx + Math.cos(a) * cl;
          rightStick.y = rightStick.cy + Math.sin(a) * cl;
          if (dist > 10) {
            rightStick.dx = Math.cos(a);
            rightStick.dy = Math.sin(a);
          } else {
            rightStick.dx = 0;
            rightStick.dy = 0;
          }
        }
    },
    {
      passive: false,
    }
  );
  const endR = e => {
    for (const t of e.changedTouches)
      if (t.identifier === rightStick.id) {
        rightStick.active = false;
        rightStick.id = null;
        rightStick.dx = 0;
        rightStick.dy = 0;
      }
  };
  zR.addEventListener('touchend', endR);
  zR.addEventListener('touchcancel', endR);
  btnDash.addEventListener(
    'touchstart',
    e => {
      e.preventDefault();
      ensureAudio();
      triggerDash();
    },
    {
      passive: false,
    }
  );
}

export function initInput() {
  setupTouchControls();
  addEventListener('keydown', e => {
    ensureAudio();
    const k = e.key.toLowerCase();
    keys[k] = 1;
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
    if (k === 'p' || k === 'escape') {
      if (state.scene === 'play' || state.scene === 'pause') togglePauseUI();
      else if (state.scene !== 'over' && state.scene !== 'win') closeModals();
    }
    if ((k === 'shift' || k === 'e') && state.scene === 'play') triggerDash();
    if (
      k === 'r' &&
      (state.scene === 'play' || state.scene === 'pause' || state.scene === 'over' || state.scene === 'win')
    )
      startNewGameUI();
    if (k === 'm') toggleMuteUI();
    if (k === 'enter' && (state.scene === 'over' || state.scene === 'win')) startNewGameUI();
    if (k.length === 1 && k >= 'a' && k <= 'z') {
      cheatBuffer = (cheatBuffer + k).slice(-8);
      if (cheatBuffer.endsWith('warp')) {
        cheatBuffer = '';
        setCheats(!state.cheatsEnabled);
      }
    }
    if (state.cheatsEnabled && !e.repeat) {
      if (k >= '1' && k <= '6' && k.length === 1) cheatWarp(+k - 1);
      else if (k === ']' && state.scene !== 'title') cheatWarp(state.stageIndex + 1);
      else if (k === '[' && state.scene !== 'title') cheatWarp(state.stageIndex - 1);
    }
  });
  addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = 0;
  });
  canvas.addEventListener('mousemove', e => {
    const p = clientToCanvas(e.clientX, e.clientY);
    mouse.x = p.x;
    mouse.y = p.y;
    mouse.t = performance.now();
  });
  canvas.addEventListener('mousedown', e => {
    ensureAudio();
    if (e.button === 2) {
      if (state.scene === 'play') triggerDash();
      return;
    }
    const p = clientToCanvas(e.clientX, e.clientY);
    mouse.x = p.x;
    mouse.y = p.y;
    mouse.t = performance.now();
    mouse.d = 1;
  });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('mouseup', () => {
    mouse.d = 0;
  });
  addEventListener('blur', () => {
    for (const k in keys) keys[k] = 0;
    mouse.d = 0;
    leftStick.active = false;
    rightStick.active = false;
    if (state.scene === 'play') togglePauseUI();
  });
  // Auto-pause when the tab is hidden so returning never teleports the fight
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.scene === 'play') togglePauseUI();
  });
}
