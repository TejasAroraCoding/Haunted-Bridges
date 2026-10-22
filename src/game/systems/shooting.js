/**
 * Firing the hero's weapon (aim, spread patterns, aim assist) and moving the player's projectiles.
 */

import { state } from '../../core/state.js';
import { playSfx } from '../../audio/audio.js';
import { H, W } from '../../core/constants.js';
import { compact, dist, rand } from '../../core/math.js';
import { settings } from '../../core/settings.js';
import { mouse, keys, rightStick } from '../../input/input.js';
import { damageBoss } from '../boss.js';
import { insideRect } from '../collision.js';
import { damageEnemy } from '../combat.js';
import { addShockwave, burst, glowPuff, popText } from '../effects.js';
import { addCombo } from '../scoring.js';
import { isDamageable } from '../spawn.js';
import { addShake, kickCamera } from '../camera.js';

/** Shot angle offsets (radians) for weapon tiers: level 1–2, level 3, level 4+. */
const SPREADS = {
  single: [[0], [-0.07, 0.07], [-0.15, 0, 0.15]],
  twin: [
    [-0.055, 0.055],
    [-0.11, 0, 0.11],
    [-0.16, -0.05, 0.05, 0.16],
  ],
};
const MIN_FIRE_INTERVAL = 0.11;
const AIM_ASSIST_IDLE_MS = 1400; // mouse untouched this long → auto-aim
const BOSS_HIT_RADIUS = 58;
const SPLASH_RADIUS = 62;

const spreadTier = level => (level < 3 ? 0 : level === 3 ? 1 : 2);

function baseDamage(hero) {
  const level = state.weaponLevel;
  return (level >= 5 ? 2.1 : 1 + (level - 1) * 0.22) * hero.damageMul;
}

function nearestTarget() {
  let best = null;
  let bestDist = Infinity;
  for (const e of state.enemies) {
    if (!isDamageable(e) || e.dead) continue;
    const d = dist(state.player.x, state.player.y, e.x, e.y);
    if (d < bestDist) {
      bestDist = d;
      best = e;
    }
  }
  const boss = state.boss;
  if (boss && !boss.dead && dist(state.player.x, state.player.y, boss.x, boss.y) < bestDist) best = boss;
  return best;
}

/** Where the hero is aiming: mouse, right stick, or the nearest foe when aim assist kicks in. */
function aimPoint() {
  const p = state.player;
  const stickTilted = rightStick.active && Math.hypot(rightStick.dx, rightStick.dy) >= 0.2;
  const mouseIdle = !mouse.d && !rightStick.active && performance.now() - (mouse.t || 0) > AIM_ASSIST_IDLE_MS;
  const stickTapped = rightStick.active && !stickTilted;
  if (settings.aimAssist && (mouseIdle || stickTapped)) {
    const target = nearestTarget();
    return target ? { x: target.x, y: target.y } : { x: p.x + p.fx * 120, y: p.y };
  }
  if (stickTilted) return { x: p.x + rightStick.dx * 160, y: p.y + rightStick.dy * 160 };
  return { x: mouse.x, y: mouse.y };
}

export function updateShooting(hero) {
  const p = state.player;
  const wantsToShoot = keys[' '] || mouse.d || rightStick.active;
  if (!wantsToShoot || p.cd > 0) return;

  let interval = Math.max(MIN_FIRE_INTERVAL, hero.cdBase - (state.weaponLevel - 1) * 0.025);
  if (p.rapidT > 0) interval *= 0.56;
  p.cd = interval;

  const target = aimPoint();
  const aim = Math.atan2(target.y - p.y, target.x - p.x);
  const damage = baseDamage(hero);
  for (const offset of SPREADS[hero.spread][spreadTier(state.weaponLevel)]) {
    const angle = aim + offset;
    state.playerBullets.push({
      x: p.x + Math.cos(angle) * 18,
      y: p.y + Math.sin(angle) * 18,
      vx: Math.cos(angle) * hero.shotSpeed,
      vy: Math.sin(angle) * hero.shotSpeed,
      l: 1.05, // lifetime
      dm: damage,
      c: hero.projColor,
      gKey: hero.glowKey,
      weapon: hero.weapon,
      aoe: hero.explosive,
      pierce: hero.piercing && state.weaponLevel >= 3 ? 1 : 0,
      age: 0,
      rot: rand(0, 6),
    });
  }
  playSfx(hero.shotPitch, 0.1, 'square', 0.045, -360);
  if (hero.heavy) kickCamera(-Math.cos(aim) * 30, -Math.sin(aim) * 30); // recoil
}

function splashDamage(bullet, primary) {
  addShockwave(bullet.x, bullet.y, 56, '#ff7722', 0.25);
  glowPuff(bullet.x, bullet.y, 'orange', 26, 0.3);
  for (const e of state.enemies) {
    if (e !== primary && !e.dead && isDamageable(e) && dist(bullet.x, bullet.y, e.x, e.y) < SPLASH_RADIUS) {
      damageEnemy(e, bullet.dm * 0.55, bullet.vx * 0.5, bullet.vy * 0.5, true);
    }
  }
}

function hitEnemies(bullet) {
  for (const e of state.enemies) {
    if (bullet.l <= 0 || e.dead || !isDamageable(e)) continue;
    if (dist(bullet.x, bullet.y, e.x, e.y) >= (e.type === 'ghost' ? 36 : 30)) continue;
    damageEnemy(e, bullet.dm, bullet.vx, bullet.vy, false);
    if (bullet.aoe) splashDamage(bullet, e);
    if (bullet.pierce > 0) {
      bullet.pierce--;
    } else {
      bullet.l = 0;
      return;
    }
  }
}

function hitBoss(bullet) {
  const boss = state.boss;
  if (bullet.l <= 0 || !boss || boss.dead || dist(bullet.x, bullet.y, boss.x, boss.y) >= BOSS_HIT_RADIUS) return;
  bullet.l = 0;
  const big = bullet.dm >= 2;
  popText(
    boss.x + rand(-18, 18),
    boss.y - 48,
    `-${bullet.dm.toFixed(1)}`,
    big ? '#fff4c2' : bullet.aoe ? '#ff9933' : '#7df9ff',
    Math.round(14 + Math.min(10, bullet.dm * 2.6)),
    big
  );
  burst(bullet.x, bullet.y, 6, '#f55', 160);
  state.hitStop = Math.max(state.hitStop, 0.03);
  playSfx(160, 0.09, 'square', 0.055);
  if (damageBoss(bullet.dm)) celebrateBossKill();
}

function celebrateBossKill() {
  const boss = state.boss;
  const { gained } = addCombo(1200);
  popText(boss.x, boss.y - 80, `+${gained} ABYSS SLAIN`, '#ffdd55', 30, true);
  addShockwave(boss.x, boss.y, 180, '#ff3355', 0.75);
  burst(boss.x, boss.y, 60, '#fff', 300);
  glowPuff(boss.x, boss.y, 'red', 80, 0.8);
  state.hitStop = 0.12;
  addShake(0.75);
  playSfx(60, 1.8, 'sawtooth', 0.28, -40);
}

export function updatePlayerBullets(dt) {
  for (const b of state.playerBullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.l -= dt;
    b.age += dt;
    for (const wall of state.walls) {
      if (insideRect(b.x, b.y, wall)) {
        b.l = 0;
        burst(b.x, b.y, 4, '#7df9ff', 90);
      }
    }
    hitEnemies(b);
    hitBoss(b);
  }
  const onScreen = b => b.x > -20 && b.x < W + 20 && b.y > -20 && b.y < H + 20;
  compact(state.playerBullets, b => b.l > 0 && onScreen(b));
}
