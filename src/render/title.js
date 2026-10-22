/**
 * Animated title-screen backdrop and hero previews.
 */

import { state } from '../core/state.js';
import { HEROES } from '../config/heroes.js';
import { createLayer, ctx } from '../core/canvas.js';
import { H, W } from '../core/constants.js';
import { compact, rand } from '../core/math.js';
import { embers, fogBanks } from '../game/effects.js';
import { drawGhost } from './enemies.js';
import { drawBats } from './death-animations.js';
import { drawHeroModel } from './hero.js';
import { drawGlow, glowSprites, vignetteLayer } from './sprites.js';
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

export function drawTitle() {
  // Sky with a violet horizon band and faint nebulae
  const gr = ctx.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, '#05030f');
  gr.addColorStop(0.55, '#130a26');
  gr.addColorStop(0.8, '#24123a');
  gr.addColorStop(1, '#0b0618');
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, W, H);
  drawGlow(250, 120, 280, 'purple', 0.1);
  drawGlow(640, 200, 240, 'blue', 0.07);
  for (const st of TITLE_STARS) {
    ctx.globalAlpha = 0.3 + 0.4 * Math.sin(state.realTime * st.s + st.p);
    ctx.fillStyle = '#e8e4ff';
    ctx.fillRect(st.x, st.y, st.r * 1.6, st.r * 1.6);
  }
  ctx.globalAlpha = 1;
  if (shootingStar) {
    const a = shootingStar.t / shootingStar.m,
      len = 90;
    const sp = Math.hypot(shootingStar.vx, shootingStar.vy),
      ux = shootingStar.vx / sp,
      uy = shootingStar.vy / sp;
    const tg = ctx.createLinearGradient(
      shootingStar.x,
      shootingStar.y,
      shootingStar.x - ux * len,
      shootingStar.y - uy * len
    );
    tg.addColorStop(0, `rgba(255,255,255,${a})`);
    tg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = tg;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(shootingStar.x, shootingStar.y);
    ctx.lineTo(shootingStar.x - ux * len, shootingStar.y - uy * len);
    ctx.stroke();
    drawGlow(shootingStar.x, shootingStar.y, 8, 'white', a);
  }

  // Moon: halo, rim ring, craters
  const mx = 810,
    my = 100,
    mr = 40 + Math.sin(state.realTime * 1.1) * 1.2;
  drawGlow(mx, my, 150 + Math.sin(state.realTime * 1.1) * 8, 'gold', 0.42);
  ctx.strokeStyle = 'rgba(255,236,190,0.12)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(mx, my, mr + 26, 0, 6.3);
  ctx.stroke();
  const mg = ctx.createRadialGradient(mx - 12, my - 12, 4, mx, my, mr);
  mg.addColorStop(0, '#fffbeb');
  mg.addColorStop(1, '#f5deb0');
  ctx.fillStyle = mg;
  ctx.beginPath();
  ctx.arc(mx, my, mr, 0, 6.3);
  ctx.fill();
  ctx.fillStyle = 'rgba(170,140,80,0.22)';
  ctx.beginPath();
  ctx.arc(mx - 12, my - 8, 8, 0, 6.3);
  ctx.arc(mx + 14, my + 9, 6, 0, 6.3);
  ctx.arc(mx + 4, my - 18, 4, 0, 6.3);
  ctx.fill();

  // Clouds drifting across the moon
  for (const c of titleClouds) {
    ctx.globalAlpha = c.a * (1 + titleFlash * 0.6);
    ctx.drawImage(cloudSprites[c.k], c.x, c.y, 340 * c.s, 140 * c.s);
  }
  ctx.globalAlpha = 1;

  // Lightning (behind the mountains)
  if (titleBolt) {
    const a = (titleBolt.t / titleBolt.m) * (Math.random() < 0.25 ? 0.4 : 1);
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.beginPath();
    titleBolt.pts.forEach((pp, i) => (i ? ctx.lineTo(pp[0], pp[1]) : ctx.moveTo(pp[0], pp[1])));
    ctx.strokeStyle = `rgba(160,180,255,${a * 0.45})`;
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.strokeStyle = `rgba(235,242,255,${a})`;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.restore();
    const tip = titleBolt.pts[titleBolt.pts.length - 1];
    drawGlow(tip[0], tip[1], 100, 'blue', a * 0.6);
  }

  // Parallax ridges with moonlit rims
  TITLE_LAYERS.forEach((L, li) => {
    const off = state.realTime * L.spd;
    const pts = [];
    for (let x = 0; x <= W + 12; x += 12) pts.push([x, ridgeY(L, x + off)]);
    const lg = ctx.createLinearGradient(0, L.y - L.amp * 1.3, 0, H);
    lg.addColorStop(0, L.top);
    lg.addColorStop(1, L.bot);
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (const pp of pts) ctx.lineTo(pp[0], pp[1]);
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
    if (titleFlash > 0.02) {
      ctx.fillStyle = `rgba(150,140,235,${titleFlash * 0.22 * (1 - li * 0.25)})`;
      ctx.fill();
    }
    ctx.beginPath();
    pts.forEach((pp, i) => (i ? ctx.lineTo(pp[0], pp[1]) : ctx.moveTo(pp[0], pp[1])));
    ctx.strokeStyle = `rgba(200,185,255,${L.rim + titleFlash * 0.3})`;
    ctx.lineWidth = 1.3;
    ctx.stroke();
    if (li === 0) {
      // Ruined castle on the far ridge with flickering windows
      const period = 1100;
      const cx = ((((540 - off) % period) + period) % period) - 80;
      const base = ridgeY(L, cx + off) + 6;
      ctx.fillStyle = L.top;
      ctx.fillRect(cx - 34, base - 46, 68, 46);
      for (let bx = -34; bx < 34; bx += 10) ctx.fillRect(cx + bx, base - 52, 6, 6);
      [
        [-38, 70, 12],
        [-6, 94, 14],
        [26, 62, 11],
      ].forEach(([dx, th, tw]) => {
        ctx.fillRect(cx + dx, base - th, tw, th);
        ctx.beginPath();
        ctx.moveTo(cx + dx - 3, base - th);
        ctx.lineTo(cx + dx + tw / 2, base - th - 20);
        ctx.lineTo(cx + dx + tw + 3, base - th);
        ctx.closePath();
        ctx.fill();
      });
      const wf = 0.55 + 0.45 * Math.sin(state.realTime * 3.3) * Math.sin(state.realTime * 1.7);
      ctx.fillStyle = `rgba(255,190,90,${0.5 + 0.3 * wf})`;
      ctx.fillRect(cx + 1, base - 74, 3, 5);
      ctx.fillRect(cx - 33, base - 54, 3, 4);
      ctx.fillRect(cx + 30, base - 46, 3, 4);
      ctx.fillRect(cx - 12, base - 30, 3, 4);
      drawGlow(cx + 2, base - 72, 10, 'gold', 0.5 * wf);
      for (const tg of titleGhosts)
        if (tg.far) {
          const gx = tg.x0 + Math.sin(state.realTime * tg.sp + tg.ph) * 60,
            gy = tg.y0 + Math.sin(state.realTime * tg.sp * 1.7 + tg.ph) * 18;
          drawGhost(gx, gy, state.realTime * 3 + tg.ph, tg.s, '#aab4cc', '#7df9ff', 'cyan', 0.5);
        }
    }
    if (li === 1) {
      for (const f of fogBanks) {
        ctx.globalAlpha = f.a * 0.9;
        ctx.drawImage(glowSprites.white, f.x - f.w / 2, 330 + (f.y % 90) - f.w * 0.1, f.w, f.w * 0.24);
      }
      ctx.globalAlpha = 1;
      for (const tg of titleGhosts)
        if (!tg.far) {
          const gx = tg.x0 + Math.sin(state.realTime * tg.sp + tg.ph) * 80,
            gy = tg.y0 + Math.sin(state.realTime * tg.sp * 1.7 + tg.ph) * 22;
          drawGhost(gx, gy, state.realTime * 3 + tg.ph, tg.s, '#d6deee', '#7df9ff', 'cyan', 0.85);
        }
      drawBats(titleBats);
    }
  });
  for (const e of embers) {
    const tw = 0.6 + 0.4 * Math.sin(e.p * 5);
    drawGlow(e.x, e.y, e.r * 3.5, 'orange', 0.5 * tw);
  }

  // Foreground stone bridge
  const DY = 446;
  ctx.fillStyle = '#0c0918';
  ctx.fillRect(0, DY, W, H - DY);
  ctx.fillStyle = '#04030a';
  for (let x = -40; x < W + 160; x += 190) {
    ctx.beginPath();
    ctx.moveTo(x, H);
    ctx.lineTo(x, DY + 56);
    ctx.quadraticCurveTo(x + 75, DY + 16, x + 150, DY + 56);
    ctx.lineTo(x + 150, H);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#19122d';
  ctx.fillRect(0, DY, W, 16);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 1;
  for (let x = 0, r = 0; x < W; x += 32, r++) {
    ctx.beginPath();
    ctx.moveTo(x + (r % 2) * 16, DY);
    ctx.lineTo(x + (r % 2) * 16, DY + 16);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, DY + 8);
  ctx.lineTo(W, DY + 8);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(200,185,255,0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, DY);
  ctx.lineTo(W, DY);
  ctx.stroke();
  ctx.fillStyle = '#1d1630';
  ctx.fillRect(0, DY - 22, W, 4);
  for (let x = 20, j = 0; x < W; x += 80, j++) {
    ctx.fillStyle = '#1d1630';
    ctx.fillRect(x - 3, DY - 26, 6, 26);
    ctx.fillStyle = '#2b2245';
    ctx.fillRect(x - 5, DY - 30, 10, 5);
    if (j % 2 === 0) {
      const fl = 0.8 + 0.2 * Math.sin(state.realTime * 8 + x) + Math.sin(state.realTime * 23 + x) * 0.04;
      drawGlow(x, DY - 38, 34 * fl, 'gold', 0.6);
      drawGlow(x, DY + 4, 46 * fl, 'gold', 0.12);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(x - 2.5, DY - 42, 5, 7);
    }
  }

  // Selected hero on watch, cloak streaming in the wind
  const hx = 150,
    hh = HEROES[state.selectedHeroIndex];
  drawGlow(hx, DY - 40, 86, hh.glowKey, 0.32);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.ellipse(hx, DY + 2, 26, 6, 0, 0, 6.3);
  ctx.fill();
  const wind = -5 - Math.sin(state.realTime * 1.4) * 2.5 - Math.max(0, Math.sin(state.realTime * 0.6)) * 2;
  drawHeroModel(ctx, hx, DY - 48, state.selectedHeroIndex, {
    walkPhase: state.realTime * 6,
    aim: -0.35,
    scale: 2.2,
    wind,
  });
  const tipX = hx + 57,
    tipY = DY - 72;
  for (let i = 0; i < 3; i++) {
    const an = state.realTime * 2.6 + i * 2.094;
    drawGlow(tipX + Math.cos(an) * 14, tipY + Math.sin(an) * 7, 5, hh.glowKey, 0.9);
  }

  // Low mist rolling across the deck
  for (let i = 0; i < 4; i++) {
    const mxp = ((state.realTime * (14 + i * 5) + i * 300) % (W + 500)) - 250;
    ctx.globalAlpha = 0.07;
    ctx.drawImage(glowSprites.white, mxp - 220, DY - 28, 440, 56);
  }
  ctx.globalAlpha = 1;
  if (titleFlash > 0) {
    ctx.fillStyle = `rgba(210,220,255,${titleFlash * 0.22})`;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.drawImage(vignetteLayer.c, 0, 0, W, H);
  heroPreviewCtx.clearRect(0, 0, 72, 72);
  drawHeroModel(heroPreviewCtx, 36, 42, state.selectedHeroIndex, {
    walkPhase: state.realTime * 6,
    aim: -0.2,
    vx: 60,
    scale: 1.35,
  });
  HEROES.forEach((h, idx) => {
    const cc = heroCardCanvases[idx]?.getContext('2d');
    if (!cc) return;
    cc.clearRect(0, 0, 68, 68);
    drawHeroModel(cc, 34, 40, idx, { walkPhase: state.realTime * 5 + idx, aim: -0.15, vx: 45, scale: 1.25 });
  });
}

/** Title screen: lightning, drifting clouds, bat flocks and shooting stars. */
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
