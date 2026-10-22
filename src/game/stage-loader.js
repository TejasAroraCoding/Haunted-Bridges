/**
 * Builds a stage: resets per-stage state, places the player and spawns the layout from config/stage-layouts.js.
 */

import { state } from '../core/state.js';
import { HEROES } from '../config/heroes.js';
import { STAGE_LAYOUTS } from '../config/stage-layouts.js';
import { rand } from '../core/math.js';
import { bakeFloor } from '../render/floor.js';
import { addShockwave } from './effects.js';
import { showBanner } from './flow.js';
import {
  createBoss,
  createPlayer,
  isDamageable,
  spawnBomber,
  spawnCoin,
  spawnGhost,
  spawnOrb,
  spawnPowerUp,
  spawnSaw,
  spawnVampire,
  spawnWizard,
  spawnWraiths,
  spawnZombie,
} from './spawn.js';

const STAGE_CARD_TIME = 2.4;

function resetStageState() {
  for (const key of [
    'enemies',
    'coins',
    'walls',
    'spikeTraps',
    'enemyBullets',
    'playerBullets',
    'bombs',
    'lasers',
    'powerUps',
    'hearts',
    'dashGhosts',
    'shockwaves',
    'bloodMist',
    'particles',
    'floatingTexts',
    'soulOrbs',
    'flyingCoins',
    'coinCounterPops',
    'heartShards',
    'heartCracks',
    'corpses',
    'bats',
    'hitIndicators',
  ]) {
    state[key] = [];
  }
  state.boss = null;
  state.bossLine = null;
  state.bossLowSaid = false;
  state.gateLift = 0;
  state.gateAnimT = 0;
  state.gateRunes = 0;
  state.gateSeal = 1;
  state.gateStep = 0;
  state.gateFlare = 0;
  state.gateRumble = false;
  state.coinShown = 0;
  state.stageKills = 0;
}

function spawnLayout(layout, stageIndex) {
  for (const [x, y] of layout.coins ?? []) spawnCoin(x, y);
  for (const [x, y, speed] of layout.zombies ?? []) spawnZombie(x, y, speed, stageIndex);
  for (const [x, y, vx, vy = 0] of layout.ghosts ?? []) spawnGhost(x ?? rand(120, 800), y, vx, vy, stageIndex);
  for (const [x, y, level] of layout.wizards ?? []) spawnWizard(x, y, level);
  for (const [x, y, level] of layout.vampires ?? []) spawnVampire(x, y, level);
  (layout.orbs ?? []).forEach(([x, vy], i) => spawnOrb(x, vy, i));
  for (const [x, y, vy] of layout.saws ?? []) spawnSaw(x, y, vy);
  for (const [x, y, w, h, cd] of layout.walls ?? []) state.walls.push({ x, y, w, h, cd, eye: false });
  (layout.spikes ?? []).forEach(([cx, cy], i) =>
    state.spikeTraps.push({ x: cx - 30, y: cy - 20, w: 60, h: 40, ph: i * 0.5 })
  );
  if (layout.heart) state.hearts.push({ x: layout.heart[0], y: layout.heart[1], a: 0, got: 0 });
  if (layout.powerUp) spawnPowerUp(...layout.powerUp);
  if (layout.bomber) spawnBomber();
  if (layout.boss) {
    state.boss = createBoss();
    spawnWraiths();
  }
}

export function loadStage(stageIndex) {
  const hero = HEROES[state.selectedHeroIndex];
  const layout = STAGE_LAYOUTS[stageIndex];

  state.stageIndex = stageIndex;
  state.gameTime = 0;
  state.stageCardTimer = STAGE_CARD_TIME;
  state.arrivalTimer = stageIndex > 0 ? 1.15 : 0.6;
  resetStageState();
  bakeFloor(stageIndex);

  state.player = createPlayer(hero);
  spawnLayout(layout, stageIndex);

  state.coinsLeft = state.coins.length;
  state.stageKillable = state.enemies.filter(isDamageable).length;
  state.hudHpPrev = state.player.hp;
  state.hudGoldenPrev = state.goldenHearts;
  state.bossIntroDuration = layout.boss ? (state.bossSeen ? 2.2 : 4.2) : 0;
  state.bossIntro = state.bossIntroDuration;

  addShockwave(state.player.x, state.player.y, 90, hero.glow, 0.5);
  showBanner(
    layout.boss
      ? 'OBJECTIVE: DEFEAT MALAKOR, LORD OF THE ABYSS'
      : `OBJECTIVE: COLLECT ALL ${state.coins.length} COINS TO UNLOCK THE GATE`
  );
}
