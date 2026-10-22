/**
 * Game-over / victory screen: final score, rank, stats and tips.
 */

import { state } from '../core/state.js';
import { playTone } from '../audio/audio.js';
import { END_TIPS } from '../config/dialogue.js';
import { HEROES } from '../config/heroes.js';
import { STAGES } from '../config/stages.js';
import { difficulty } from '../core/settings.js';
import { updateTouchVisibility } from '../input/input.js';
import { setVisible } from './menus.js';
import { STORAGE_KEYS, writeStorage } from '../core/storage.js';
import { drawHeroModel } from '../render/hero.js';

let scoreCountRaf = 0;

const endHeroCanvas = document.getElementById('end-hero-cv');

const endHeroCtx = endHeroCanvas.getContext('2d');

function formatTime(t) {
  const s = Math.floor(t);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function calcRank(sc, type) {
  const tiers = [
    ['S', 16000, '#fde047'],
    ['A', 10000, '#6ee7b7'],
    ['B', 6000, '#7df9ff'],
    ['C', 2500, '#c084fc'],
    ['D', 0, '#fb7185'],
  ];
  let t = tiers.find(x => sc >= x[1]);
  if (type === 'win' && (t[0] === 'C' || t[0] === 'D')) t = tiers[2];
  return t;
}

function animateCount(el, to, dur) {
  cancelAnimationFrame(scoreCountRaf);
  const t0 = performance.now();
  const tick = now => {
    const k = Math.min(1, (now - t0) / dur),
      e = 1 - Math.pow(1 - k, 3);
    el.textContent = Math.round(to * e).toLocaleString();
    if (k < 1) scoreCountRaf = requestAnimationFrame(tick);
  };
  scoreCountRaf = requestAnimationFrame(tick);
}

export function finalizeRun(type) {
  const lifeEach = Math.round(500 * difficulty().score);
  const lifeBonus = type === 'win' ? Math.max(0, state.lives) * lifeEach : 0;
  const finalScore = state.score + lifeBonus;
  if (finalScore > state.highScore && !state.runCheated) {
    state.highScore = finalScore;
    writeStorage(STORAGE_KEYS.highScore, state.highScore);
    document.getElementById('ui-highscore').textContent = state.highScore;
  }
  state.lastEnd = {
    cheated: state.runCheated,
    type,
    base: state.score,
    lifeBonus,
    lifeEach,
    diff: difficulty(),
    livesLeft: Math.max(0, state.lives),
    finalScore,
    isBest: !state.runCheated && finalScore > state.runStartBest && finalScore > 0,
    best: state.highScore,
    stage: state.stageIndex,
    kills: state.runKills,
    coins: state.runCoins + (state.stageIndex < 5 ? state.coins.length - state.coinsLeft : 0),
    combo: state.bestCombo,
    wlv: state.weaponLevel,
    time: state.runTime,
    hero: state.selectedHeroIndex,
    rank: calcRank(finalScore, type),
    tip: END_TIPS[Math.floor(Math.random() * END_TIPS.length)],
  };
  document.getElementById('btn-pause-quick').classList.add('hidden');
  if (state.audioCtx && !state.muted) {
    const now = state.audioCtx.currentTime;
    if (type === 'win') [523, 659, 784, 1047].forEach((f, i) => playTone(f, now + i * 0.13, 0.4, 'triangle', 0.08));
    else [330, 262, 196, 131].forEach((f, i) => playTone(f, now + i * 0.18, 0.45, 'sawtooth', 0.05));
  }
  renderEndModal();
}

export function renderEndModal() {
  const r = state.lastEnd;
  if (!r) return;
  const $ = id => document.getElementById(id);
  const win = r.type === 'win',
    h = HEROES[r.hero],
    el = $('modal-end');
  el.classList.toggle('lost', !win);
  el.style.setProperty('--end-c', win ? '#6ee7b7' : '#fb7185');
  el.style.setProperty('--end-glow', win ? 'rgba(110,231,183,.3)' : 'rgba(251,113,133,.28)');
  $('end-badge').textContent =
    (win ? 'ABYSSAL CURSE SHATTERED' : `FALLEN ON ${STAGES[r.stage].n}`) + (r.cheated ? ' · WARP RUN' : '');
  $('end-title').textContent = win ? 'VICTORY' : 'GAME OVER';
  $('end-sub').textContent = win
    ? `Malakor is vanquished — all six Haunted Bridges are conquered by ${h.name}.`
    : `The shadows of ${STAGES[r.stage].s} claimed ${h.name}. Rise again, ${h.title}.`;
  $('end-hero-name').innerHTML = `<div><span style="color:${h.glow}">${h.title}</span><b>${h.name}</b></div>`;
  $('end-retry-name').textContent = h.name.toUpperCase();
  $('end-best').textContent = `BEST RUN: ${r.best.toLocaleString()}`;
  $('end-newbest').classList.toggle('hidden', !r.isBest);
  const rk = $('end-rank');
  rk.textContent = r.rank[0];
  rk.style.color = r.rank[2];
  const ed = $('end-diff');
  ed.textContent = r.diff.label;
  ed.style.color = r.diff.color;
  let tr = '';
  for (let i = 0; i < 6; i++) {
    const done = win || i < r.stage,
      fell = !win && i === r.stage;
    tr += `<div class="end-node ${done ? 'done' : fell ? 'fell' : ''}">${fell ? '✕' : done ? '✓' : i + 1}<small>${i === 5 ? 'BOSS' : 'S' + (i + 1)}</small></div>`;
    if (i < 5) tr += `<div class="end-link ${win || i < r.stage ? 'done' : ''}"></div>`;
  }
  $('end-track').innerHTML = tr;
  const stats = [
    ['SECTOR', `${r.stage + 1}/6`],
    ['FOES SLAIN', r.kills],
    ['COINS', r.coins],
    ['MAX COMBO', 'x' + r.combo.toFixed(1)],
    ['WEAPON', 'LV ' + r.wlv],
    ['RUN TIME', formatTime(r.time)],
  ];
  $('end-stats').innerHTML = stats
    .map(
      ([k, v], i) =>
        `<div class="end-stat" style="animation-delay:${0.2 + i * 0.07}s"><small>${k}</small><b>${v}</b></div>`
    )
    .join('');
  const br = $('end-break');
  br.classList.toggle('hidden', !win);
  if (win)
    br.innerHTML = `RUN ${r.base.toLocaleString()}<i>+</i>LIFE BONUS ${r.lifeBonus.toLocaleString()} (${r.livesLeft} × ${r.lifeEach})`;
  $('end-tip').innerHTML = win
    ? `<b>NEXT</b>Try another champion, or chase an S rank (16,000+).`
    : `<b>TIP</b>${r.tip}`;
  // Restart entrance animations every time the screen is shown
  for (const a of [el, rk]) {
    a.style.animation = 'none';
    void a.offsetWidth;
    a.style.animation = '';
  }
  setVisible('modal-end', true);
  animateCount($('end-score'), r.finalScore, 1200);
  updateTouchVisibility();
}

/** Animated hero portrait on the end screen (called every frame while it is shown). */
export function drawEndPortrait() {
  if (!state.lastEnd) return;
  endHeroCtx.clearRect(0, 0, 96, 96);
  drawHeroModel(endHeroCtx, 48, 58, state.lastEnd.hero, {
    walkPhase: state.realTime * 5,
    aim: -0.25,
    vx: state.scene === 'win' ? 50 : 0,
    scale: 1.75,
  });
}
