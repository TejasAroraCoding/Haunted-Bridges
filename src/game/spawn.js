/**
 * Factories for everything that appears on a stage: the player, enemies, coins, bullets and loot.
 * Enemy health scales with the stage, the player's weapon level and the difficulty.
 */

import { state } from '../core/state.js';
import { H, MATERIALIZE_TIME, W } from '../core/constants.js';
import { rand } from '../core/math.js';
import { difficulty } from '../core/settings.js';

/** Enemy types the player can shoot (orbs, saws, the bomber and wraiths are hazards). */
const DAMAGEABLE_TYPES = new Set(['zombie', 'wizard', 'vampire', 'ghost']);
const POWER_UP_KINDS = ['rapid', 'shield', 'speed'];
const MAX_ENEMY_BULLETS = 90;

export const isDamageable = e => DAMAGEABLE_TYPES.has(e.type);

const scaledHp = base => Math.max(1, Math.round(base * difficulty().hp));

export function createPlayer(hero) {
  return {
    x: 72,
    y: H / 2,
    vx: 0,
    vy: 0,
    hp: hero.hp,
    maxHp: hero.hp,
    inv: 1.6, // invulnerability timer
    cd: 0, // fire cooldown
    step: 0, // walk-cycle phase
    fx: 1, // facing direction (-1 / 1)
    dashT: 0,
    dashCd: 0,
    shield: 0,
    rapidT: 0,
    speedT: 0,
    hitFl: 0,
    dying: 0,
  };
}

export function spawnCoin(x, y) {
  state.coins.push({ x, y, a: rand(0, 6), got: 0, spin: rand(0, 6) });
}

export function spawnZombie(x, y, speed, stageIndex) {
  const hp = scaledHp(2.5 + state.weaponLevel * 1.15 + stageIndex * 0.35);
  state.enemies.push({
    type: 'zombie',
    x,
    y,
    sp: speed * 1.1,
    hp,
    maxHp: hp,
    dispHp: hp,
    fl: 0,
    a: rand(0, 6),
    lv: Math.max(1, state.weaponLevel),
    mat: MATERIALIZE_TIME,
    dead: 0,
  });
}

export function spawnGhost(x, y, vx, vy, stageIndex) {
  const hp = scaledHp(3 + state.weaponLevel * 0.9 + stageIndex * 0.4);
  state.enemies.push({
    type: 'ghost',
    x,
    y,
    y0: y,
    vx: vx * 1.08,
    vy: vy * 1.08,
    a: rand(0, 6),
    hp,
    maxHp: hp,
    dispHp: hp,
    fl: 0,
    kt: 0,
    kx: 0,
    ky: 0,
    lv: Math.max(1, state.weaponLevel),
    mat: MATERIALIZE_TIME,
    dead: 0,
  });
}

export function spawnWizard(x, y, level = 1) {
  const hp = scaledHp((level === 1 ? 8 : 12) + state.weaponLevel * 2);
  state.enemies.push({
    type: 'wizard',
    x,
    y,
    cd: 1.2,
    maxCd: level === 1 ? 1.7 : 1.22,
    fl: 0,
    lvl: level,
    hp,
    maxHp: hp,
    dispHp: hp,
    a: 0,
    mat: MATERIALIZE_TIME,
    dead: 0,
  });
}

export function spawnVampire(x, y, level = 1) {
  const hp = scaledHp(6 + level * 2 + Math.floor(state.weaponLevel * 0.8));
  state.enemies.push({
    type: 'vampire',
    x,
    y,
    vx: 0,
    vy: 0,
    hp,
    maxHp: hp,
    dispHp: hp,
    lvl: level,
    a: rand(0, 6.28),
    state: 'stalk', // stalk → lock → swoop → stalk
    cd: rand(1.9, 2.8),
    lockT: 0,
    swoopT: 0,
    tx: x,
    ty: y,
    dashVx: 0,
    dashVy: 0,
    fl: 0,
    kt: 0,
    kx: 0,
    ky: 0,
    mat: MATERIALIZE_TIME,
    dead: 0,
  });
}

export function spawnOrb(x, vy, phase) {
  state.enemies.push({ type: 'orb', x, y: rand(100, 440), vy, ph: phase, dead: 0 });
}

export function spawnSaw(x, y, vy) {
  state.enemies.push({ type: 'saw', x, y, vy, a: 0, dead: 0 });
}

export function spawnBomber() {
  state.enemies.push({ type: 'bomber', x: 0, y: 0, cd: 2.4, dead: 0 });
}

export function createBoss() {
  const hp = Math.round(155 * difficulty().hp);
  return {
    x: W + 150, // starts off-screen; the intro glides him in
    y: 270,
    baseX: 810,
    hp,
    max: hp,
    dispHp: hp,
    roared: false,
    skipArmed: false,
    wind: 0, // 0..1 wind-up before the next attack
    next: 'spear', // next attack, used for telegraphs
    fireFl: 0,
    windSnd: false,
    cd: 1.2,
    a: 0,
    ph: 0, // attack counter
    pl: 1, // phase 1–3
    dead: 0,
    deadT: 0,
    fl: 0,
    atkName: 'ABYSSAL VOLLEY',
    state: 'hover', // hover | crushWarn | crushDash
    stateT: 0,
    crushY: 270,
    crushDir: -1,
    t2: 2.4, // secondary hazard timer (lasers, bombs)
    bob: 0,
  };
}

export function spawnWraiths() {
  for (let i = 0; i < 3; i++) state.enemies.push({ type: 'wraith', i, a: i * 2.09, x: 0, y: 0, dead: 0 });
}

export function spawnEnemyBullet(x, y, angle, speed, r = 6, c = '#c6f', gKey = 'purple', free = false) {
  if (state.enemyBullets.length >= MAX_ENEMY_BULLETS) return null;
  speed *= difficulty().bul;
  const bullet = {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r,
    c,
    gKey,
    dead: 0,
    free, // free-flying shots pass through walls
    rot: angle,
  };
  state.enemyBullets.push(bullet);
  return bullet;
}

export function spawnPowerUp(x, y, kind) {
  state.powerUps.push({ x, y, kind, a: 0, got: 0 });
}

/** Slain foes sometimes drop a random power-up; wizards and vampires always do. */
export function dropLoot(x, y, force = false) {
  if (force || Math.random() < 0.34)
    spawnPowerUp(x, y, POWER_UP_KINDS[Math.floor(Math.random() * POWER_UP_KINDS.length)]);
}
