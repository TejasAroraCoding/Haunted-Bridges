/**
 * Difficulty presets: lives, enemy scaling, magnet range and score multipliers.
 */

export const DIFFICULTIES = {
  easy: {
    key: 'easy',
    label: 'EASY',
    color: '#6ee7b7',
    spd: 0.82,
    hp: 0.75,
    bul: 0.82,
    cd: 1.2,
    lives: 4,
    score: 0.75,
    inv: 1.45,
    mag: 78,
    desc: '4 lives · weaker foes · big coin magnet · ×0.75 score',
  },
  normal: {
    key: 'normal',
    label: 'NORMAL',
    color: '#7df9ff',
    spd: 1,
    hp: 1,
    bul: 1,
    cd: 1,
    lives: 3,
    score: 1,
    inv: 1,
    mag: 56,
    desc: '3 lives · the intended challenge · ×1.0 score',
  },
  nightmare: {
    key: 'nightmare',
    label: 'NIGHTMARE',
    color: '#fb7185',
    spd: 1.2,
    hp: 1.35,
    bul: 1.15,
    cd: 0.82,
    lives: 2,
    score: 1.5,
    inv: 0.85,
    mag: 38,
    desc: '2 lives · tougher foes · tiny coin magnet · ×1.5 score',
  },
};
