/**
 * Fits the 16:9 stage to any screen and scales the HTML menus so they never overflow.
 */

import { state } from '../core/state.js';
import { updateRenderScale } from '../core/canvas.js';
import { isTouchDevice } from '../core/device.js';
import { clamp } from '../core/math.js';
import { togglePauseUI } from './menus.js';

let layoutRaf = 0;

let uiScale = 1;

function fitUI(w, h) {
  const ui = document.getElementById('ui-root'),
    hub = document.getElementById('menu-main');
  if (!ui || !hub) return;
  if (!hub.classList.contains('hidden')) {
    let sc = 1;
    for (let it = 0; it < 2; it++) {
      ui.style.width = w / sc + 'px';
      ui.style.height = h / sc + 'px';
      ui.style.transform = 'none';
      const prevH = hub.style.height;
      hub.style.height = 'auto';
      const cs = getComputedStyle(ui);
      const need = hub.scrollHeight + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + 4;
      hub.style.height = prevH;
      sc = clamp((h / need) * (it ? sc : 1), 0.55, 1);
      if (it === 0 && sc === 1) break;
    }
    uiScale = sc;
  }
  ui.style.width = w / uiScale + 'px';
  ui.style.height = h / uiScale + 'px';
  ui.style.transform = uiScale < 1 ? `scale(${uiScale})` : 'none';
}

export function layoutStage() {
  const wrap = document.getElementById('app-wrap'),
    stageEl = document.getElementById('game-stage');
  const cs = getComputedStyle(wrap);
  const aw = wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const ah = wrap.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  let w = aw,
    h = (aw * 9) / 16;
  if (h > ah) {
    h = ah;
    w = (ah * 16) / 9;
  }
  w = Math.max(160, Math.floor(w));
  h = Math.max(90, Math.floor(h));
  stageEl.style.width = w + 'px';
  stageEl.style.height = h + 'px';
  document.body.classList.toggle('compact', h < 520);
  fitUI(w, h);
  updateRenderScale();
  // Rotating a phone to portrait mid-run pauses the game
  if (isTouchDevice && window.innerHeight > window.innerWidth && state.scene === 'play') togglePauseUI();
}

export const queueLayout = () => {
  cancelAnimationFrame(layoutRaf);
  layoutRaf = requestAnimationFrame(layoutStage);
};

export function initLayout() {
  window.addEventListener('resize', queueLayout);
  window.addEventListener('orientationchange', () => setTimeout(layoutStage, 250));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', queueLayout);

  /* ---------- Pre-baked sprites ---------- */
}
