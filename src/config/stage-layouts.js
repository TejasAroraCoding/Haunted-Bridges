/**
 * What spawns on each stage. Coordinates are in the 960×540 playfield.
 *
 *   coins      [x, y]
 *   zombies    [x, y, speed]
 *   ghosts     [x, y, vx, vy?]        x = null picks a random x (used for the stage-4 ghost lanes)
 *   wizards    [x, y, level]
 *   vampires   [x, y, level]
 *   orbs       [x, vy]                y is random
 *   saws       [x, y, vy]
 *   walls      [x, y, w, h, firstShotDelay]
 *   spikes     [centreX, centreY]
 *   heart      [x, y]                 one healing heart
 *   powerUp    [x, y, kind]           'rapid' | 'shield' | 'speed'
 *   bomber     true → time bombs keep dropping on the player
 *   boss       true → Malakor and his three soul wraiths
 */
export const STAGE_LAYOUTS = [
  // Stage 1 — The Outer Span
  {
    coins: [
      [330, 130],
      [430, 420],
      [640, 260],
      [200, 120],
      [220, 420],
      [500, 270],
      [700, 430],
      [760, 100],
      [130, 270],
    ],
    zombies: [
      [600, 140, 34],
      [520, 400, 39],
      [760, 270, 36],
    ],
  },
  // Stage 2 — Sentient Bastion
  {
    walls: [
      [230, 50, 140, 90, 2],
      [230, 400, 140, 90, 3],
      [600, 50, 140, 90, 2.6],
      [600, 400, 140, 90, 3.4],
    ],
    spikes: [
      [470, 150],
      [470, 390],
      [400, 270],
      [540, 270],
    ],
    coins: [
      [300, 270],
      [480, 270],
      [680, 200],
      [680, 340],
      [100, 200],
      [100, 400],
      [800, 400],
    ],
    ghosts: [[500, 270, 74, 52]],
    zombies: [
      [780, 120, 38],
      [780, 420, 36],
    ],
    heart: [480, 90],
    powerUp: [350, 270, 'shield'],
  },
  // Stage 3 — Vampire & Arcane Sanctum
  {
    wizards: [[480, 105, 1]],
    vampires: [[720, 180, 1]],
    coins: [
      [300, 300],
      [520, 440],
      [200, 100],
      [200, 440],
      [400, 100],
      [640, 120],
      [760, 260],
      [760, 440],
    ],
    zombies: [
      [300, 220, 46],
      [700, 330, 52],
    ],
    orbs: [
      [430, -112],
      [515, 128],
      [600, -144],
      [685, 160],
      [770, -176],
    ],
    heart: [480, 480],
    powerUp: [350, 270, 'speed'],
  },
  // Stage 4 — Phantom Gauntlet
  {
    ghosts: [
      [null, 110, 118],
      [null, 200, -142],
      [null, 340, 166],
      [null, 430, -190],
      [480, 270, 165, 0],
    ],
    vampires: [[680, 270, 2]],
    coins: [
      [300, 110],
      [700, 340],
      [480, 200],
      [240, 430],
      [150, 270],
      [600, 60],
      [850, 150],
      [850, 420],
      [380, 330],
      [600, 480],
    ],
    saws: [
      [380, 150, 138],
      [640, 400, -155],
    ],
    heart: [120, 270],
    powerUp: [350, 270, 'rapid'],
  },
  // Stage 5 — Coven of Blood & Fire
  {
    wizards: [[135, 120, 2]],
    vampires: [
      [620, 140, 2],
      [740, 410, 2],
    ],
    ghosts: [
      [500, 200, 190],
      [300, 430, -205],
      [700, 320, 175, 135],
    ],
    saws: [
      [300, 200, 155],
      [620, 350, -172],
    ],
    coins: [
      [420, 270],
      [700, 100],
      [560, 450],
      [200, 160],
      [250, 300],
      [820, 480],
      [840, 80],
      [150, 450],
    ],
    bomber: true,
    heart: [150, 270],
    powerUp: [350, 270, 'shield'],
  },
  // Stage 6 — Throne of the Abyss
  {
    boss: true,
    powerUp: [420, 270, 'speed'],
  },
];
