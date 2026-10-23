/**
 * Per-frame cosmetic animation (runs every display frame, independent of physics).
 */

import { state } from '../core/state.js';
import { playSfx } from '../audio/audio.js';
import { W } from '../core/constants.js';
import { compact, rand } from '../core/math.js';
import { createEmber, embers, fogBanks, glowPuff, spawnParticle } from '../game/effects.js';
import { animateGate } from './gate.js';
import { animateTitleSky } from './title.js';

/** Advances purely cosmetic animation once per display frame (physics runs separately at a fixed rate). */
export function updateVisuals(dt) {
  if (state.scene === 'title') {
    animateTitleSky(dt);
    animateAmbience(dt);
    return;
  }
  if (state.scene === 'pause') return; // a paused world stays perfectly still
  animateGate(dt);
  animateFlyingCoins(dt);
  animateHeartShards(dt);
  animateCorpsesAndBats(dt);
  spawnProjectileTrails(dt);
  animateBossAura(dt);
  animateAmbience(dt);
  animateEffects(dt);
  animatePickupsAndEnemies(dt);
}

/** Coins flying into the HUD counter; the counter ticks when each lands. */
function animateFlyingCoins(dt) {
  for (const f of state.flyingCoins) {
    f.t += dt;
    if (f.t >= f.dur && !f.done) {
      f.done = true;
      state.coinShown++;
      state.hudCoinFlash = 0.3;
      if (state.coinCounterPops.length < 8)
        state.coinCounterPops.push({
          t: 0.35,
          m: 0.35,
        });
      playSfx(1320 + Math.min(8, state.coinShown) * 40, 0.08, 'triangle', 0.05, 220);
    }
  }
  compact(state.flyingCoins, f => !f.done);
  for (const c of state.coinCounterPops) c.t -= dt;
  compact(state.coinCounterPops, c => c.t > 0);
}

/** Shards from shattered health cells. */
function animateHeartShards(dt) {
  for (const sh of state.heartShards) {
    sh.vy += 520 * dt;
    sh.x += sh.vx * dt;
    sh.y += sh.vy * dt;
    sh.rot += sh.vr * dt;
    sh.t -= dt;
  }
  compact(state.heartShards, sh => sh.t > 0);
  for (const cf of state.heartCracks) cf.t -= dt;
  compact(state.heartCracks, cf => cf.t > 0);
}

/** Enemy death animations and vampire bat swarms. */
function animateCorpsesAndBats(dt) {
  for (const c of state.corpses) {
    c.t += dt;
    if (c.kind === 'ghost' && c.t < c.dur * 0.85 && Math.random() < dt * 34)
      glowPuff(c.x + rand(-18, 18), c.y - (c.t / c.dur) ** 2 * 64 + rand(-10, 24), 'cyan', rand(10, 20), 0.6);
    if (c.kind === 'wizard' && c.t > 0.15 && c.t < 0.7 && Math.random() < dt * 24)
      glowPuff(c.x + rand(-22, 22), c.y + 40, 'purple', rand(10, 18), 0.5);
  }
  compact(state.corpses, c => c.t < c.dur);
  for (const b of state.bats) {
    b.t += dt;
    b.vx += Math.sin(b.t * 9 + b.ph) * 260 * dt;
    b.vy -= 70 * dt;
    b.vx *= Math.pow(0.55, dt);
    b.vy *= Math.pow(0.7, dt);
    b.x += b.vx * dt;
    b.y += b.vy * dt;
  }
  compact(state.bats, b => b.t < b.m);
}

/** Embers, motes and wisps trailing behind projectiles. */
function spawnProjectileTrails(dt) {
  for (const b of state.playerBullets) {
    switch (b.weapon) {
      case 'fireball': // rising embers
        if (Math.random() < dt * 50) {
          const color = Math.random() < 0.5 ? '#ff9e44' : '#ffd166';
          const vx = -b.vx * 0.08 + rand(-20, 20);
          const vy = -b.vy * 0.08 + rand(-30, 10);
          spawnParticle(b.x + rand(-3, 3), b.y + rand(-3, 3), vx, vy, rand(0.25, 0.5), color, rand(1.5, 2.8), 0, -70);
        }
        break;
      case 'spear': // golden motes
        if (Math.random() < dt * 14)
          spawnParticle(b.x, b.y, rand(-15, 15), rand(-15, 15), rand(0.3, 0.5), '#fff2b3', rand(1.2, 2));
        break;
      case 'blade': // shadow wisps
        if (Math.random() < dt * 18) glowPuff(b.x, b.y, 'purple', rand(6, 10), 0.3);
        break;
      default: // arcane sparkles
        if (Math.random() < dt * 14)
          spawnParticle(b.x, b.y, rand(-25, 25), rand(-25, 25), rand(0.25, 0.4), '#cffafe', rand(1.2, 2));
    }
  }
}

/** Malakor gathers energy during wind-ups and sheds embers from phase II. */
function animateBossAura(dt) {
  if (state.boss && !state.boss.dead && state.bossIntro <= 0) {
    if (state.boss.wind > 0.2 && Math.random() < dt * 45) {
      const an = rand(0, 6.283),
        r = rand(100, 140);
      const col = state.boss.next === 'ring' ? '#ff4d6d' : '#d8b4fe';
      spawnParticle(
        state.boss.x + Math.cos(an) * r,
        state.boss.y + Math.sin(an) * r,
        -Math.cos(an) * r * 2.4,
        -Math.sin(an) * r * 2.4,
        0.38,
        col,
        rand(1.8, 3),
        0,
        0
      );
    }
    if (state.boss.pl >= 2 && Math.random() < dt * state.boss.pl * 10)
      spawnParticle(
        state.boss.x + rand(-50, 50),
        state.boss.y + rand(-30, 40),
        rand(-10, 10),
        -rand(40, 100),
        rand(0.6, 1.1),
        state.boss.pl === 3 ? '#ff4d6d' : '#e879f9',
        rand(1.5, 2.6),
        0,
        -20
      );
  }
}

/** Ambient embers and fog banks. */
function animateAmbience(dt) {
  for (const e of embers) {
    e.p += dt;
    e.x += (e.vx + Math.sin(e.p * 1.7) * 6) * dt;
    e.y += e.vy * dt;
    if (e.y < -10) Object.assign(e, createEmber(false));
  }
  for (const f of fogBanks) {
    f.x += f.v * dt;
    f.p += dt;
    if (f.x > W + f.w) f.x = -f.w;
  }
}

/** Particles, floating text, shockwaves, indicators, afterimages and soul orbs. */
function animateEffects(dt) {
  for (const p of state.particles) {
    p.vy += p.gr * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= Math.pow(0.5, dt * 3);
    p.l -= dt;
  }
  compact(state.particles, p => p.l > 0);
  for (const f of state.floatingTexts) {
    f.t -= dt;
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    f.vy += (f.big ? 60 : 150) * dt;
  }
  compact(state.floatingTexts, f => f.t > 0);
  for (const s of state.shockwaves) ((s.r = s.maxR * (1 - s.t / s.m) ** 0.6), (s.t -= dt));
  compact(state.shockwaves, s => s.t > 0);
  for (const hd of state.hitIndicators) hd.t -= dt;
  compact(state.hitIndicators, hd => hd.t > 0);
  for (const gh of state.dashGhosts) gh.t -= dt;
  compact(state.dashGhosts, gh => gh.t > 0);
  for (const s of state.soulOrbs) s.t += dt;
  compact(state.soulOrbs, s => s.t < s.dur);
  if (state.hudCoinFlash > 0) state.hudCoinFlash -= dt;
  if (state.hudScoreFlash > 0) state.hudScoreFlash -= dt;
}

/** Spinning pickups, trailing health bars and void-orb wisps. */
function animatePickupsAndEnemies(dt) {
  for (const z of state.powerUps) z.a += dt * 3;
  for (const p of state.coins) p.spin += dt;
  for (const e of state.enemies) {
    if (e.maxHp) e.dispHp += (Math.max(0, e.hp) - e.dispHp) * Math.min(1, dt * 6);
    if (e.type === 'orb') {
      e.ph += dt * 3;
      if (Math.random() < dt * 20) glowPuff(e.x + rand(-8, 8), e.y + rand(-8, 8), 'purple', rand(15, 25), 0.5);
    }
  }
}
