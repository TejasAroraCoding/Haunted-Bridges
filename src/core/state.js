/**
 * Shared mutable game state.
 *
 * Anything that changes while the game runs and is needed by more than one module lives on this one
 * object, so every module reads and writes the same values (ES module bindings can't be reassigned
 * from outside). State used by a single module stays private to that module.
 * Static data lives in src/config/, fixed tuning values in src/core/constants.js.
 */
export const state = {
  // --- App & settings ---
  scene: 'title', // 'title' | 'play' | 'pause' | 'over' | 'win'
  selectedHeroIndex: 0, // index into HEROES
  runDifficulty: 'normal', // difficulty locked in for the current run
  highScore: 0,
  perfLevel: 0, // adaptive quality level 0–3 (see core/quality.js)
  renderScale: 1, // canvas pixels per playfield unit
  floorLayer: null, // baked floor of the current stage
  fps: 60,

  // --- Audio ---
  audioCtx: null,
  musicGain: null,
  muted: false,

  // --- Clocks ---
  realTime: 0, // seconds since load, advances every frame (animation)
  gameTime: 0, // seconds since the stage started, advances with physics

  // --- Run ---
  lives: 3,
  score: 0,
  weaponXp: 0,
  weaponLevel: 1, // 1–5
  goldenHearts: 0, // extra shield hearts
  combo: 0, // hits in the current streak
  comboT: 0, // seconds left before the streak resets
  bestCombo: 1, // best multiplier reached
  runKills: 0,
  runCoins: 0, // coins banked on cleared stages
  runTime: 0,
  runDeaths: 0,
  runStartBest: 0, // best score when the run began, for 'new best' detection
  runCheated: false, // a warp cheat was used
  cheatsEnabled: false,
  gameOverPending: false, // out of lives; end the run after the death animation
  lastEnd: null, // summary shown on the end screen

  // --- Stage ---
  stageIndex: 0, // 0–5
  player: null,
  boss: null,
  enemies: [],
  coins: [],
  coinsLeft: 0,
  walls: [],
  spikeTraps: [],
  hearts: [],
  powerUps: [],
  bombs: [],
  lasers: [],
  bloodMist: [],
  enemyBullets: [],
  playerBullets: [],
  candleCoords: [], // candle positions baked into the floor
  stageKills: 0,
  stageKillable: 0,
  lastStageBonus: 0,

  // --- Sequences & timers ---
  stageCardTimer: 0, // stage title card
  arrivalTimer: 0, // arrival beam
  warpTimer: 0, // portal warp to the next stage
  hitStop: 0, // brief freeze on big hits
  hurtFlash: 0,
  lightningFlash: 0,
  bannerText: '',
  bannerTimer: 0,
  bossIntro: 0, // seconds left in the boss entrance cinematic
  bossIntroDuration: 0,
  bossSeen: false, // shorter intro after the first time
  bossLine: null, // current boss subtitle { text, t, m }
  bossLowSaid: false,

  // --- Gate ---
  gateAnimT: 0, // seconds left in the opening sequence
  gateLift: 0, // 0 closed … 1 open
  gateRunes: 0, // runes lit (0–6)
  gateSeal: 1, // 1 until the seal shatters
  gateStep: 0, // lift heaves completed
  gateFlare: 0, // burst when fully open
  gateRumble: false,

  // --- Visual effects ---
  particles: [],
  shockwaves: [],
  floatingTexts: [],
  soulOrbs: [],
  dashGhosts: [],
  corpses: [], // death animations
  bats: [],
  hitIndicators: [],
  flyingCoins: [], // coins arcing into the HUD
  coinCounterPops: [],
  coinShown: 0, // coins counted by the HUD so far
  heartShards: [],
  heartCracks: [],

  // --- HUD ---
  hudCoinFlash: 0,
  hudScoreFlash: 0,
  hudHpPrev: 0, // last health drawn, to detect lost hearts
  hudGoldenPrev: 0,
};
