/**
 * Damaging enemies and their death effects.
 */

import { state } from '../core/state.js';
import { playSfx } from '../audio/audio.js';
import { rand } from '../core/math.js';
import { addShockwave, burst, glowPuff, popText, spawnParticle, spawnSoulOrb } from './effects.js';
import { dropLoot } from './spawn.js';
import { addCombo, addWeaponXp } from './scoring.js';

function playDeathEffect(e) {
  const f = state.player.x < e.x ? -1 : 1;
  if (state.corpses.length > 14) state.corpses.shift();
  if (e.type === 'zombie') {
    // Zombie crumbles backward into the stones
    burst(e.x, e.y, 8, '#7d4', 170);
    for (let i = 0; i < 8; i++)
      spawnParticle(
        e.x + rand(-10, 10),
        e.y + 20,
        rand(-80, 80),
        rand(-130, -30),
        rand(0.5, 0.9),
        Math.random() < 0.5 ? '#3d2f1e' : '#3d5a2a',
        rand(2, 3.5),
        0,
        320
      );
    addShockwave(e.x, e.y, 40, '#7dff88', 0.3);
    state.corpses.push({
      kind: 'zombie',
      x: e.x,
      y: e.y,
      f,
      t: 0,
      dur: 0.9,
    });
  } else if (e.type === 'vampire') {
    // Vampire bursts into a swarm of bats
    burst(e.x, e.y, 10, '#ff2a55', 200);
    glowPuff(e.x, e.y, 'red', 44, 0.7);
    addShockwave(e.x, e.y, 62, '#ff2a55', 0.32);
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + rand(-1.7, 1.7),
        sp = rand(90, 230);
      if (state.bats.length < 40)
        state.bats.push({
          x: e.x + rand(-8, 8),
          y: e.y + rand(-10, 6),
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          t: 0,
          m: rand(0.85, 1.35),
          ph: rand(0, 6),
          s: rand(1.1, 1.6),
        });
    }
    state.corpses.push({
      kind: 'vampire',
      x: e.x,
      y: e.y,
      f,
      t: 0,
      dur: 0.32,
    });
  } else if (e.type === 'wizard') {
    // Wizard collapses into an empty pile of robes
    burst(e.x, e.y, 12, '#d88fff', 200);
    addShockwave(e.x, e.y, 60, '#d88fff', 0.32);
    state.corpses.push({
      kind: 'wizard',
      x: e.x,
      y: e.y,
      f,
      t: 0,
      dur: 1.4,
    });
  } else if (e.type === 'ghost') {
    // Ghost rises and dissolves into wisps
    addShockwave(e.x, e.y, 54, '#7df9ff', 0.32);
    state.corpses.push({
      kind: 'ghost',
      x: e.x,
      y: e.y,
      f,
      t: 0,
      dur: 0.95,
      s: state.stageIndex === 3 ? 2.1 : 1.85,
      a: e.a || 0,
    });
  }
  spawnSoulOrb(
    e.x,
    e.y,
    e.type === 'zombie' ? '#7dff88' : e.type === 'vampire' ? '#ff2a55' : e.type === 'ghost' ? '#7df9ff' : '#d88fff'
  );
}

export function damageEnemy(e, dm, bx, by, isAoE = false) {
  if (e.dead || e.mat > 0) return;
  e.hp -= dm;
  e.fl = 0.15;
  e.kx = bx * 0.14;
  e.ky = by * 0.14;
  e.kt = 0.12;
  const bigHit = dm >= 2;
  popText(
    e.x,
    e.y - 26,
    `-${dm.toFixed(dm % 1 ? 1 : 0)}${bigHit ? '!' : ''}`,
    bigHit ? '#fff4c2' : isAoE ? '#ff9e44' : '#ffffff',
    Math.round(13 + Math.min(10, dm * 2.6)),
    bigHit
  );
  burst(
    e.x,
    e.y,
    5,
    e.type === 'zombie' ? '#7d4' : e.type === 'vampire' ? '#ff2a55' : e.type === 'ghost' ? '#bfefff' : '#c6f',
    150
  );
  if (e.hp <= 0) {
    e.dead = 1;
    state.stageKills++;
    state.runKills++;
    const basePts = e.type === 'wizard' ? 200 : e.type === 'vampire' ? 150 : e.type === 'ghost' ? 90 : 60;
    const { gained, mult } = addCombo(basePts);
    addWeaponXp(e.type === 'wizard' ? 6 : e.type === 'vampire' ? 5 : e.type === 'ghost' ? 4 : 3);
    if (e.type === 'ghost') playSfx(620, 0.4, 'sine', 0.09, -480);
    else playSfx(e.type === 'vampire' ? 280 : 210, 0.26, 'sawtooth', 0.1, -110);
    playDeathEffect(e);
    if (e.type === 'vampire' || e.type === 'wizard') state.hitStop = Math.max(state.hitStop, 0.035);
    const bigKill = mult >= 2 || gained >= 300;
    popText(
      e.x,
      e.y - 40,
      `+${gained}${mult > 1 ? ' x' + mult.toFixed(1) : ''}`,
      '#ffdd55',
      bigKill ? Math.round(16 + mult * 3) : 16,
      bigKill
    );
    dropLoot(e.x, e.y, e.type === 'wizard' || e.type === 'vampire');
  }
}
