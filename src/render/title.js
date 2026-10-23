/**
 * Animated title-screen backdrop and hero previews.
 */

import { state } from '../core/state.js';
import { HEROES } from '../config/heroes.js';
import { createLayer, ctx, onRenderScaleChange } from '../core/canvas.js';
import { H, W } from '../core/constants.js';
import { compact, rand } from '../core/math.js';
import { embers, fogBanks } from '../game/effects.js';
import { drawGhost } from './enemies.js';
import { drawBats } from './death-animations.js';
import { drawHeroModel } from './hero.js';
import { drawGlow, drawImageExact, drawMist, drawOverlay, glowSprites, vignetteLayer } from './sprites.js';
import { heroCardCanvases } from '../ui/menus.js';
import { playTone } from '../audio/audio.js';

let titleNextStarIn = 2;

let titleNextBatsIn = 3;

let shootingStar = null;

let titleNextBoltIn = 2.5;

let titleFlash = 0;

let titleBolt = null;

// Cheap stars for the title sky
const TITLE_STARS = Array.from(
  {
    length: 70,
  },
  () => ({
    x: rand(0, W),
    y: rand(0, 300),
    r: rand(0.5, 1.6),
    p: rand(0, 6),
    s: rand(1, 3),
  })
);

const heroPreviewCanvas = document.getElementById('hero-mini-preview');

const heroPreviewCtx = heroPreviewCanvas.getContext('2d');

/* Title-screen state & pre-baked cloud sprites */
const cloudSprites = [];

for (let c = 0; c < 3; c++) {
  const cs = createLayer(340, 140, 1);
  for (let i = 0; i < 16; i++) {
    const px = rand(50, 290),
      py = rand(55, 95) - Math.sin(((px - 50) / 240) * Math.PI) * 26,
      r = rand(24, 50);
    const gd = cs.x.createRadialGradient(px, py - r * 0.35, r * 0.1, px, py, r);
    gd.addColorStop(0, 'rgba(92,78,140,0.5)');
    gd.addColorStop(0.55, 'rgba(40,31,72,0.45)');
    gd.addColorStop(1, 'rgba(20,14,40,0)');
    cs.x.fillStyle = gd;
    cs.x.beginPath();
    cs.x.arc(px, py, r, 0, 6.3);
    cs.x.fill();
  }
  cloudSprites.push(cs.c);
}

export const titleClouds = Array.from(
  {
    length: 6,
  },
  (_, i) => ({
    x: rand(-200, W),
    y: rand(24, 190),
    s: rand(0.8, 1.5),
    v: rand(5, 15),
    k: i % 3,
    a: rand(0.55, 0.95),
  })
);

const titleGhosts = [
  {
    x0: 120,
    y0: 150,
    s: 0.85,
    sp: 0.5,
    ph: 0,
    far: true,
  },
  {
    x0: 470,
    y0: 120,
    s: 0.75,
    sp: 0.42,
    ph: 2,
    far: true,
  },
  {
    x0: 690,
    y0: 175,
    s: 0.9,
    sp: 0.55,
    ph: 4,
    far: true,
  },
  {
    x0: 300,
    y0: 215,
    s: 1.35,
    sp: 0.35,
    ph: 1,
    far: false,
  },
  {
    x0: 860,
    y0: 245,
    s: 1.5,
    sp: 0.3,
    ph: 3,
    far: false,
  },
];

export const titleBats = [];

const TITLE_LAYERS = [
  {
    y: 300,
    amp: 64,
    f1: 0.0071,
    f2: 0.019,
    spd: 5,
    top: '#231a42',
    bot: '#120c26',
    rim: 0.28,
  },
  {
    y: 352,
    amp: 70,
    f1: 0.0102,
    f2: 0.031,
    spd: 13,
    top: '#171030',
    bot: '#0b0719',
    rim: 0.2,
  },
  {
    y: 402,
    amp: 52,
    f1: 0.0153,
    f2: 0.047,
    spd: 26,
    top: '#0e0a1e',
    bot: '#05030c',
    rim: 0.14,
  },
];

function ridgeY(L, u) {
  return L.y - Math.abs(Math.sin(u * L.f1 + 1.2)) * L.amp - Math.abs(Math.sin(u * L.f2)) * L.amp * 0.25;
}

/* ---------- Pre-rendered static layers (rebuilt when the render resolution changes) ---------- */

const DECK_Y = 446; // top of the foreground bridge deck
const BRIDGE_TOP = DECK_Y - 32; // highest pixel of the baked bridge layer
const MOON = { x: 810, y: 100, r: 40 };

let skyLayer = null;
let bridgeLayer = null;

/** Sky gradient, nebulae and the moon: everything behind the clouds that never moves. */
function bakeSky() {
  const layer = createLayer(W, H, state.renderScale);
  const c = layer.x;
  const sky = c.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#05030f');
  sky.addColorStop(0.55, '#130a26');
  sky.addColorStop(0.8, '#24123a');
  sky.addColorStop(1, '#0b0618');
  c.fillStyle = sky;
  c.fillRect(0, 0, W, H);
  const nebula = (x, y, r, color, alpha) => {
    c.globalAlpha = alpha;
    c.drawImage(glowSprites[color], x - r, y - r, r * 2, r * 2);
  };
  nebula(250, 120, 280, 'purple', 0.1);
  nebula(640, 200, 240, 'blue', 0.07);
  nebula(MOON.x, MOON.y, 150, 'gold', 0.42);
  c.globalAlpha = 1;
  c.strokeStyle = 'rgba(255,236,190,0.12)';
  c.lineWidth = 1.5;
  c.beginPath();
  c.arc(MOON.x, MOON.y, MOON.r + 26, 0, Math.PI * 2);
  c.stroke();
  const body = c.createRadialGradient(MOON.x - 12, MOON.y - 12, 4, MOON.x, MOON.y, MOON.r);
  body.addColorStop(0, '#fffbeb');
  body.addColorStop(1, '#f5deb0');
  c.fillStyle = body;
  c.beginPath();
  c.arc(MOON.x, MOON.y, MOON.r, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(170,140,80,0.22)';
  c.beginPath();
  c.arc(MOON.x - 12, MOON.y - 8, 8, 0, Math.PI * 2);
  c.arc(MOON.x + 14, MOON.y + 9, 6, 0, Math.PI * 2);
  c.arc(MOON.x + 4, MOON.y - 18, 4, 0, Math.PI * 2);
  c.fill();
  return layer;
}

/** The stone bridge in the foreground: arches, deck, rail and lantern posts (flames are drawn live). */
function bakeBridge() {
  const layer = createLayer(W, H - BRIDGE_TOP, state.renderScale);
  const c = layer.x;
  c.translate(0, -BRIDGE_TOP);
  c.fillStyle = '#0c0918';
  c.fillRect(0, DECK_Y, W, H - DECK_Y);
  c.fillStyle = '#04030a';
  for (let x = -40; x < W + 160; x += 190) {
    c.beginPath();
    c.moveTo(x, H);
    c.lineTo(x, DECK_Y + 56);
    c.quadraticCurveTo(x + 75, DECK_Y + 16, x + 150, DECK_Y + 56);
    c.lineTo(x + 150, H);
    c.closePath();
    c.fill();
  }
  c.fillStyle = '#19122d';
  c.fillRect(0, DECK_Y, W, 16);
  c.strokeStyle = 'rgba(0,0,0,0.5)';
  c.lineWidth = 1;
  for (let x = 0, row = 0; x < W; x += 32, row++) {
    c.beginPath();
    c.moveTo(x + (row % 2) * 16, DECK_Y);
    c.lineTo(x + (row % 2) * 16, DECK_Y + 16);
    c.stroke();
  }
  c.beginPath();
  c.moveTo(0, DECK_Y + 8);
  c.lineTo(W, DECK_Y + 8);
  c.stroke();
  c.strokeStyle = 'rgba(200,185,255,0.25)';
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(0, DECK_Y);
  c.lineTo(W, DECK_Y);
  c.stroke();
  c.fillStyle = '#1d1630';
  c.fillRect(0, DECK_Y - 22, W, 4);
  for (let x = 20; x < W; x += 80) {
    c.fillStyle = '#1d1630';
    c.fillRect(x - 3, DECK_Y - 26, 6, 26);
    c.fillStyle = '#2b2245';
    c.fillRect(x - 5, DECK_Y - 30, 10, 5);
  }
  return layer;
}

onRenderScaleChange(() => {
  skyLayer = null;
  bridgeLayer = null;
});

/** Copies a baked layer whose top-left is at logical (0, y), pixel-for-pixel. */
function blitBaked(layer, y) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(layer.c, 0, Math.round(y * state.renderScale));
  ctx.restore();
}

/* ---------- Title scene ---------- */

/** Ridge fill gradients, created once (they're in playfield coordinates, so they never change). */
const ridgeGradients = TITLE_LAYERS.map(L => {
  const g = ctx.createLinearGradient(0, L.y - L.amp * 1.3, 0, H);
  g.addColorStop(0, L.top);
  g.addColorStop(1, L.bot);
  return g;
});

function drawSky() {
  skyLayer ??= bakeSky();
  blitBaked(skyLayer, 0);
  ctx.fillStyle = '#e8e4ff';
  for (const star of TITLE_STARS) {
    ctx.globalAlpha = 0.3 + 0.4 * Math.sin(state.realTime * star.s + star.p);
    ctx.fillRect(star.x, star.y, star.r * 1.6, star.r * 1.6);
  }
  ctx.globalAlpha = 1;
  // A gentle breathing halo on top of the baked moon.
  drawGlow(MOON.x, MOON.y, 62 + Math.sin(state.realTime * 1.1) * 5, 'gold', 0.14);
  if (shootingStar) drawShootingStar();
}

function drawShootingStar() {
  const s = shootingStar;
  const a = s.t / s.m;
  const len = 90;
  const speed = Math.hypot(s.vx, s.vy);
  const ux = s.vx / speed;
  const uy = s.vy / speed;
  const tail = ctx.createLinearGradient(s.x, s.y, s.x - ux * len, s.y - uy * len);
  tail.addColorStop(0, `rgba(255,255,255,${a})`);
  tail.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.strokeStyle = tail;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(s.x, s.y);
  ctx.lineTo(s.x - ux * len, s.y - uy * len);
  ctx.stroke();
  drawGlow(s.x, s.y, 8, 'white', a);
}

function drawClouds() {
  for (const c of titleClouds) {
    ctx.globalAlpha = Math.min(1, c.a * (1 + titleFlash * 0.6));
    drawImageExact(cloudSprites[c.k], `cloud${c.k}`, c.x, c.y, 340 * c.s, 140 * c.s);
  }
  ctx.globalAlpha = 1;
}

function drawLightning() {
  if (!titleBolt) return;
  const a = (titleBolt.t / titleBolt.m) * (Math.random() < 0.25 ? 0.4 : 1);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.beginPath();
  titleBolt.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.strokeStyle = `rgba(160,180,255,${a * 0.45})`;
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.strokeStyle = `rgba(235,242,255,${a})`;
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ctx.restore();
  const [tipX, tipY] = titleBolt.pts[titleBolt.pts.length - 1];
  drawGlow(tipX, tipY, 100, 'blue', a * 0.6);
}

function drawCastle(L, offset) {
  const period = 1100;
  const cx = ((((540 - offset) % period) + period) % period) - 80;
  const base = ridgeY(L, cx + offset) + 6;
  ctx.fillStyle = L.top;
  ctx.fillRect(cx - 34, base - 46, 68, 46);
  for (let bx = -34; bx < 34; bx += 10) ctx.fillRect(cx + bx, base - 52, 6, 6);
  for (const [dx, th, tw] of [
    [-38, 70, 12],
    [-6, 94, 14],
    [26, 62, 11],
  ]) {
    ctx.fillRect(cx + dx, base - th, tw, th);
    ctx.beginPath();
    ctx.moveTo(cx + dx - 3, base - th);
    ctx.lineTo(cx + dx + tw / 2, base - th - 20);
    ctx.lineTo(cx + dx + tw + 3, base - th);
    ctx.closePath();
    ctx.fill();
  }
  const flicker = 0.55 + 0.45 * Math.sin(state.realTime * 3.3) * Math.sin(state.realTime * 1.7);
  ctx.fillStyle = `rgba(255,190,90,${0.5 + 0.3 * flicker})`;
  ctx.fillRect(cx + 1, base - 74, 3, 5);
  ctx.fillRect(cx - 33, base - 54, 3, 4);
  ctx.fillRect(cx + 30, base - 46, 3, 4);
  ctx.fillRect(cx - 12, base - 30, 3, 4);
  drawGlow(cx + 2, base - 72, 10, 'gold', 0.5 * flicker);
}

function drawTitleGhosts(far) {
  for (const g of titleGhosts) {
    if (g.far !== far) continue;
    const swing = far ? 60 : 80;
    const x = g.x0 + Math.sin(state.realTime * g.sp + g.ph) * swing;
    const y = g.y0 + Math.sin(state.realTime * g.sp * 1.7 + g.ph) * (far ? 18 : 22);
    drawGhost(x, y, state.realTime * 3 + g.ph, g.s, far ? '#aab4cc' : '#d6deee', '#7df9ff', 'cyan', far ? 0.5 : 0.85);
  }
}

/**
 * How far down each ridge needs filling: just past the lowest point of the layer in front of it
 * (ridges never dip below their base `y`), or the bridge deck for the nearest one. Everything lower
 * is covered anyway, and skipping it more than halves the gradient fill.
 */
const RIDGE_FILL_BOTTOM = [TITLE_LAYERS[1].y + 8, TITLE_LAYERS[2].y + 8, DECK_Y + 4];

/** Three parallax ridges with moonlit rims; the far one carries the castle, ghosts drift between them. */
function drawRidges() {
  TITLE_LAYERS.forEach((L, li) => {
    const offset = state.realTime * L.spd;
    const bottom = RIDGE_FILL_BOTTOM[li];
    ctx.beginPath();
    ctx.moveTo(0, bottom);
    for (let x = 0; x <= W + 12; x += 12) ctx.lineTo(x, ridgeY(L, x + offset));
    ctx.lineTo(W, bottom);
    ctx.closePath();
    ctx.fillStyle = ridgeGradients[li];
    ctx.fill();
    if (titleFlash > 0.02) {
      ctx.fillStyle = `rgba(150,140,235,${titleFlash * 0.22 * (1 - li * 0.25)})`;
      ctx.fill();
    }
    ctx.beginPath();
    for (let x = 0; x <= W + 12; x += 12) ctx.lineTo(x, ridgeY(L, x + offset));
    ctx.strokeStyle = `rgba(200,185,255,${L.rim + titleFlash * 0.3})`;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    if (li === 0) {
      drawCastle(L, offset);
      drawTitleGhosts(true);
    } else if (li === 1) {
      for (const f of fogBanks) drawMist(f.x - f.w / 2, 330 + (f.y % 90) - f.w * 0.1, f.w, f.w * 0.24, f.a * 0.9);
      drawTitleGhosts(false);
      drawBats(titleBats);
    }
  });
}

function drawTitleEmbers() {
  for (const e of embers) drawGlow(e.x, e.y, e.r * 3.5, 'orange', 0.5 * (0.6 + 0.4 * Math.sin(e.p * 5)));
}

function drawBridge() {
  bridgeLayer ??= bakeBridge();
  blitBaked(bridgeLayer, BRIDGE_TOP);
  for (let x = 20, j = 0; x < W; x += 80, j++) {
    if (j % 2) continue;
    const flicker = 0.8 + 0.2 * Math.sin(state.realTime * 8 + x) + Math.sin(state.realTime * 23 + x) * 0.04;
    drawGlow(x, DECK_Y - 38, 34 * flicker, 'gold', 0.6);
    drawGlow(x, DECK_Y + 4, 46 * flicker, 'gold', 0.12);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(x - 2.5, DECK_Y - 42, 5, 7);
  }
}

/** The selected hero standing watch on the bridge, cloak streaming in the wind. */
function drawTitleHero() {
  const x = 150;
  const hero = HEROES[state.selectedHeroIndex];
  drawGlow(x, DECK_Y - 40, 86, hero.glowKey, 0.32);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.ellipse(x, DECK_Y + 2, 26, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  const wind = -5 - Math.sin(state.realTime * 1.4) * 2.5 - Math.max(0, Math.sin(state.realTime * 0.6)) * 2;
  drawHeroModel(ctx, x, DECK_Y - 48, state.selectedHeroIndex, {
    walkPhase: state.realTime * 6,
    aim: -0.35,
    scale: 2.2,
    wind,
  });
  for (let i = 0; i < 3; i++) {
    const a = state.realTime * 2.6 + i * 2.094;
    drawGlow(x + 57 + Math.cos(a) * 14, DECK_Y - 72 + Math.sin(a) * 7, 5, hero.glowKey, 0.9);
  }
}

function drawDeckMist() {
  for (let i = 0; i < 4; i++) {
    const x = ((state.realTime * (14 + i * 5) + i * 300) % (W + 500)) - 250;
    drawMist(x - 220, DECK_Y - 28, 440, 56, 0.07);
  }
}

function drawFlashAndVignette() {
  if (titleFlash > 0) {
    ctx.fillStyle = `rgba(210,220,255,${titleFlash * 0.22})`;
    ctx.fillRect(0, 0, W, H);
  }
  drawOverlay(vignetteLayer);
}

const hubPanel = document.getElementById('menu-main');
const heroesPanel = document.getElementById('modal-heroes');

/** Animated hero portraits in the menus — only while those menus are on screen. */
function drawMenuPortraits() {
  if (!hubPanel.classList.contains('hidden')) {
    heroPreviewCtx.clearRect(0, 0, 72, 72);
    drawHeroModel(heroPreviewCtx, 36, 42, state.selectedHeroIndex, {
      walkPhase: state.realTime * 6,
      aim: -0.2,
      vx: 60,
      scale: 1.35,
    });
  }
  if (!heroesPanel.classList.contains('hidden')) {
    HEROES.forEach((_, i) => {
      const card = heroCardCanvases[i]?.getContext('2d');
      if (!card) return;
      card.clearRect(0, 0, 68, 68);
      drawHeroModel(card, 34, 40, i, { walkPhase: state.realTime * 5 + i, aim: -0.15, vx: 45, scale: 1.25 });
    });
  }
}

const TITLE_SCENE_LAYERS = [
  drawSky,
  drawClouds,
  drawLightning,
  drawRidges,
  drawTitleEmbers,
  drawBridge,
  drawTitleHero,
  drawDeckMist,
  drawFlashAndVignette,
];

export function drawTitle() {
  for (const drawLayer of TITLE_SCENE_LAYERS) {
    ctx.save();
    drawLayer();
    ctx.restore();
  }
  drawMenuPortraits();
}

export function animateTitleSky(dt) {
  if (state.scene === 'title') {
    titleNextBoltIn -= dt;
    if (titleNextBoltIn <= 0) {
      titleNextBoltIn = rand(4, 9);
      const pts = [[rand(140, 640), -10]];
      while (pts[pts.length - 1][1] < 300) {
        const l = pts[pts.length - 1];
        pts.push([l[0] + rand(-26, 26), l[1] + rand(18, 34)]);
      }
      titleBolt = {
        pts,
        t: 0.38,
        m: 0.38,
      };
      titleFlash = 1;
      if (state.audioCtx && !state.muted) playTone(44, state.audioCtx.currentTime + 0.15, 1.6, 'sawtooth', 0.05, -12);
    }
  }
  if (state.scene === 'title') {
    for (const c of titleClouds) {
      c.x += c.v * dt;
      if (c.x > W + 60) {
        c.x = -330 * c.s;
        c.y = rand(24, 190);
      }
    }
    titleNextBatsIn -= dt;
    if (titleNextBatsIn <= 0) {
      titleNextBatsIn = rand(7, 12);
      const y0 = rand(150, 250),
        dir = Math.random() < 0.5 ? 1 : -1,
        cnt = 6 + Math.floor(rand(0, 5));
      for (let i = 0; i < cnt; i++)
        titleBats.push({
          x: dir > 0 ? -30 - rand(0, 140) : W + 30 + rand(0, 140),
          y: y0 + rand(-28, 28),
          vx: dir * rand(120, 175),
          vy: rand(-8, 8),
          t: 0,
          m: 1e9,
          ph: rand(0, 6),
          s: rand(0.9, 1.5),
          al: 0.9,
        });
    }
    for (const b of titleBats) {
      b.t += dt;
      b.x += b.vx * dt;
      b.y += (Math.sin(b.t * 3 + b.ph) * 30 + b.vy) * dt;
    }
    compact(titleBats, b => b.x > -260 && b.x < W + 260);
    titleNextStarIn -= dt;
    if (titleNextStarIn <= 0) {
      titleNextStarIn = rand(3, 7);
      shootingStar = {
        x: rand(80, W - 260),
        y: rand(16, 110),
        vx: rand(380, 520),
        vy: rand(110, 190),
        t: 0.7,
        m: 0.7,
      };
    }
    if (shootingStar) {
      shootingStar.t -= dt;
      shootingStar.x += shootingStar.vx * dt;
      shootingStar.y += shootingStar.vy * dt;
      if (shootingStar.t <= 0) shootingStar = null;
    }
  }
  if (titleFlash > 0) titleFlash = Math.max(0, titleFlash - dt * 2.4);
  if (titleBolt) {
    titleBolt.t -= dt;
    if (titleBolt.t <= 0) titleBolt = null;
  }
}
