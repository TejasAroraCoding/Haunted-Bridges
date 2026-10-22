/**
 * Main hub, champion picker, modals and pause screen.
 */

import { state } from '../core/state.js';
import { ensureAudio, playSfx } from '../audio/audio.js';
import { HEROES } from '../config/heroes.js';
import { difficulty } from '../core/settings.js';
import { newGame } from '../game/flow.js';
import { updateTouchVisibility } from '../input/input.js';
import { updateInstallUI } from '../pwa/install.js';
import { renderEndModal } from './end-screen.js';
import { queueLayout } from './layout.js';
import { updateDiffUI, updateGfxUI } from './settings-panel.js';
import { STORAGE_KEYS, writeStorage } from '../core/storage.js';

let pauseReturnStatus = false;

export const heroCardCanvases = [];

export function renderHeroCardsUI() {
  const grid = document.getElementById('hero-grid');
  grid.innerHTML = '';
  HEROES.forEach((h, idx) => {
    const sel = idx === state.selectedHeroIndex;
    const el = document.createElement('div');
    el.className = `hero-card rounded-xl p-3 flex flex-col justify-between ${sel ? 'selected' : ''}`;
    el.onclick = () => selectHero(idx);
    el.innerHTML = `
      <div>
        <div class="flex items-center gap-2.5 mb-2">
          <div class="w-14 h-14 rounded-lg bg-slate-950 border border-purple-500/40 flex items-center justify-center shrink-0">
            <canvas id="hero-card-cv-${idx}" width="68" height="68" class="w-14 h-14"></canvas>
          </div>
          <div>
            <div class="text-xs uppercase tracking-wider font-bold" style="color:${h.glow}">${h.title}</div>
            <div class="text-base font-bold text-white serif-title">${h.name}</div>
            <div class="text-[11px] text-slate-300 leading-tight">${h.desc}</div>
          </div>
        </div>
        <div class="space-y-1.5 text-[11px] mt-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
          ${statBarHtml('Vitality', `${h.hp} ♥ ${h.xh ? '+ 1 ★' : ''}`, h.stats.hp, 'bg-rose-500')}
          ${statBarHtml('Speed & Dash', h.spd, h.stats.spd, 'bg-emerald-400')}
          ${statBarHtml('Fire Rate', h.stats.rof + '%', h.stats.rof, 'bg-cyan-400')}
          ${statBarHtml('Arcane Power', h.stats.pwr + '%', h.stats.pwr, 'bg-amber-400')}
        </div>
      </div>
      <div class="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between">
        <span class="text-[10px] font-semibold uppercase tracking-wider ${sel ? 'text-amber-300' : 'text-slate-400'}">${sel ? '✓ SELECTED CHAMPION' : 'Click to Select'}</span>
        <span class="w-2.5 h-2.5 rounded-full" style="background:${h.glow}"></span>
      </div>`;
    grid.appendChild(el);
  });
  for (let i = 0; i < HEROES.length; i++) heroCardCanvases[i] = document.getElementById(`hero-card-cv-${i}`);
  updateMiniHeroCard();
}

function statBarHtml(label, val, pct, cls) {
  return `<div>
    <div class="flex justify-between text-slate-300"><span>${label}</span><span class="mono-font">${val}</span></div>
    <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5"><div class="h-full ${cls} transition-all duration-500" style="width:${pct}%"></div></div>
  </div>`;
}

export function selectHero(idx) {
  ensureAudio();
  state.selectedHeroIndex = idx;
  playSfx(520, 0.15, 'triangle', 0.08, 220);
  renderHeroCardsUI();
  document.getElementById('selected-hero-perk').textContent = `PERK // ${HEROES[idx].perk}`;
}

function updateMiniHeroCard() {
  const h = HEROES[state.selectedHeroIndex];
  document.getElementById('mini-hero-name').textContent = `${h.name.toUpperCase()} // ${h.title.toUpperCase()}`;
  document.getElementById('mini-hero-desc').textContent = h.desc;
}

const MENU_PANEL_IDS = ['menu-main', 'modal-heroes', 'modal-controls', 'modal-settings', 'modal-status', 'modal-end'];

export function setVisible(id, on) {
  const el = document.getElementById(id);
  el.classList.toggle('hidden', !on);
  el.classList.toggle('flex', on);
}

export function openModal(id) {
  ensureAudio();
  playSfx(440, 0.1, 'sine', 0.06, 120);
  MENU_PANEL_IDS.forEach(m => setVisible(m, false));
  setVisible(id, true);
  if (id === 'modal-heroes') renderHeroCardsUI();
  if (id === 'modal-settings' || id === 'menu-main') {
    updateDiffUI();
    updateGfxUI();
    updateInstallUI();
  }
}

export function openModalFromPause(id) {
  pauseReturnStatus = true;
  openModal(id);
}

export function closeModals() {
  ensureAudio();
  playSfx(340, 0.1, 'sine', 0.05, -80);
  ['modal-heroes', 'modal-controls', 'modal-settings', 'modal-status', 'modal-end'].forEach(m => setVisible(m, false));
  const fromPause = pauseReturnStatus;
  pauseReturnStatus = false;
  if (state.scene === 'pause' && fromPause) {
    showPauseModal();
    return;
  }
  if ((state.scene === 'over' || state.scene === 'win') && state.lastEnd) {
    renderEndModal();
    return;
  }
  if (state.scene === 'title') {
    setVisible('menu-main', true);
    updateDiffUI();
    queueLayout();
  }
}

export function startNewGameUI() {
  ensureAudio();
  playSfx(580, 0.25, 'triangle', 0.1, 300);
  MENU_PANEL_IDS.forEach(m => setVisible(m, false));
  document.getElementById('btn-pause-quick').classList.remove('hidden');
  newGame();
  updateTouchVisibility();
}

/** Pause screen with the current run's stats. Also saves the best score, in case the player quits from here. */
function showPauseModal() {
  if (state.score > state.highScore && !state.runCheated) {
    state.highScore = state.score;
    writeStorage(STORAGE_KEYS.highScore, state.highScore);
    document.getElementById('ui-highscore').textContent = state.highScore;
  }
  const hero = HEROES[state.selectedHeroIndex];
  const objective =
    state.stageIndex < 5 ? `Coins ${state.coins.length - state.coinsLeft}/${state.coins.length}` : 'Defeat Malakor';
  document.getElementById('stat-score').textContent = state.score;
  document.getElementById('stat-stage').textContent = `${state.stageIndex + 1} / 6`;
  document.getElementById('stat-combo').textContent = `x${state.bestCombo.toFixed(1)}`;
  document.getElementById('status-desc').textContent =
    `Playing as ${hero.name} (${hero.title}) · Weapon LV ${state.weaponLevel} · ${objective} · ${difficulty().label}`;
  setVisible('modal-status', true);
  updateTouchVisibility();
}

export function togglePauseUI() {
  ensureAudio();
  if (state.scene === 'play') {
    state.scene = 'pause';
    showPauseModal();
  } else if (state.scene === 'pause') resumeGameUI();
}

export function resumeGameUI() {
  ensureAudio();
  state.scene = 'play';
  setVisible('modal-status', false);
  updateTouchVisibility();
}

export function returnToTitleUI(subModal) {
  ensureAudio();
  state.scene = 'title';
  state.stageIndex = 0;
  document.getElementById('btn-pause-quick').classList.add('hidden');
  updateTouchVisibility();
  if (subModal) openModal(subModal);
  else closeModals();
}
