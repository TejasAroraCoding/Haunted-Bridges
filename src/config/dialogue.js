/**
 * Malakor's lines and the end-screen survival tips.
 */

/** Malakor's subtitles; each receives the current hero's name. */
export const BOSS_LINES = {
  intro: n => `Six bridges. Six graves. Yours will be the last, ${n}.`,
  retry: n => `Back from the dark, ${n}? Then I will send you deeper.`,
  p2: () => `You dare wound me? Then bleed beneath the Crimson Eclipse!`,
  p3: () => `ENOUGH! I AM THE ABYSS — AND THE ABYSS DEVOURS ALL!`,
  low: () => `No... a mere mortal... this cannot be...`,
  death: () => `The curse... breaks... but the dark... remembers...`,
};

export const END_TIPS = [
  'Phase Dash makes you invulnerable — dash THROUGH bullets, not away from them.',
  'Vampires draw a red lock line before they swoop. Sidestep the moment it flashes.',
  'Wizards glow brighter and grow a sigil just before casting. Break line of sight.',
  'Kill streaks raise your multiplier, and coins cash in at that multiplier — kill first, then collect.',
  'Grab a heart at full health to earn a Golden Shield that absorbs the next hit.',
  'Phantom ghosts can be banished now — clear a lane before you cross it.',
  'Sentient Bastion walls blink cyan before firing. Their bolts pass through walls!',
  'Spike traps flash amber before they spring. Cross on the amber, not the red.',
];
