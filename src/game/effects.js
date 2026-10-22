/**
 * Spawning visual effects: particles, shockwaves, floating text, soul orbs, embers and HUD heart shards.
 * (Camera shake lives in game/camera.js.)
 */

import { state } from '../core/state.js';
import { playTone } from '../audio/audio.js';

import { H, W } from '../core/constants.js';
import { rand } from '../core/math.js';
import { isHighGfx } from '../core/settings.js';

export function shatterCell(x, y, w, h, c, c2) {
  for (let i = 0; i < 8; i++) {
    const px = x + rand(0, w),
      py = y + rand(0, h);
    if (state.heartShards.length < 60)
      state.heartShards.push({
        x: px,
        y: py,
        vx: (px - (x + w / 2)) * rand(7, 13) + rand(-30, 30),
        vy: -rand(70, 170),
        rot: rand(0, 6),
        vr: rand(-14, 14),
        t: 0.85,
        m: 0.85,
        s: rand(3, 6),
        c: Math.random() < 0.3 ? c2 : c,
      });
  }
  state.heartCracks.push({
    x,
    y,
    w,
    h,
    t: 0.5,
    m: 0.5,
  });
  if (state.audioCtx && !state.muted) {
    const now = state.audioCtx.currentTime;
    playTone(2300, now, 0.12, 'square', 0.025, -1700);
    playTone(1500, now + 0.03, 0.16, 'triangle', 0.04, -900);
  }
}

/* Ambient layers (render-only, purely cosmetic) */
export const embers = Array.from(
  {
    length: 46,
  },
  () => createEmber(true)
);

export const fogBanks = Array.from(
  {
    length: 9,
  },
  () => ({
    x: rand(-300, W + 300),
    y: rand(60, H - 60),
    w: rand(260, 460),
    v: rand(7, 20),
    a: rand(0.05, 0.12),
    p: rand(0, 6),
  })
);

export function createEmber(anywhere) {
  return {
    x: rand(0, W),
    y: anywhere ? rand(0, H) : H + 10,
    vx: rand(-14, 14),
    vy: -rand(18, 52),
    r: rand(0.8, 2.3),
    p: rand(0, 6),
    c: Math.random() < 0.65 ? '#ffb347' : '#ffe08a',
  };
}

export function addShockwave(x, y, maxR, c = '#7df9ff', dur = 0.38) {
  if (state.shockwaves.length < 18)
    state.shockwaves.push({
      x,
      y,
      r: 6,
      maxR,
      t: dur,
      m: dur,
      c,
    });
}

export function popText(x, y, s, c = '#fff', sz = 15, big = false) {
  if (state.floatingTexts.length >= 26) state.floatingTexts.shift();
  const life = big ? 1.1 : 0.85;
  state.floatingTexts.push({
    x: x + rand(-8, 8),
    y,
    vx: rand(-24, 24),
    vy: big ? -rand(50, 70) : -rand(70, 100),
    t: life,
    m: life,
    s,
    c,
    sz,
    big,
  });
}

export function spawnParticle(x, y, vx, vy, l, c, r = 2, k = 0, gr = 0) {
  if (state.particles.length >= (isHighGfx() ? 320 : 150)) return;
  state.particles.push({
    x,
    y,
    vx,
    vy,
    l,
    m: l,
    c,
    r,
    k,
    gr,
  });
}

export function burst(x, y, n, c, sp = 190) {
  const cnt = isHighGfx() ? n : Math.ceil(n * 0.5);
  for (let i = 0; i < cnt; i++) {
    const a = rand(0, 6.283),
      s = rand(30, sp);
    spawnParticle(x, y, Math.cos(a) * s, Math.sin(a) * s, rand(0.25, 0.65), c, rand(1.6, 3.4), 0, 120);
  }
}

export function glowPuff(x, y, c, r = 14, l = 0.4) {
  if (state.particles.length < 300)
    state.particles.push({
      x,
      y,
      vx: rand(-10, 10),
      vy: -rand(10, 30),
      l,
      m: l,
      c,
      r,
      k: 1,
      gr: 0,
      gl: c,
    });
}

export function spawnSoulOrb(x, y, c) {
  if (state.soulOrbs.length < 24)
    state.soulOrbs.push({
      x0: x,
      y0: y,
      t: 0,
      c,
      dur: rand(0.55, 0.75),
      side: Math.random() < 0.5 ? 1 : -1,
    });
}
