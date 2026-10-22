/**
 * Safe wrappers around localStorage (it throws in some private-browsing modes and sandboxed iframes).
 */

export const STORAGE_KEYS = {
  highScore: 'hb_highscore',
  graphics: 'hb_gfx',
  perfLevel: 'hb_perf',
  difficulty: 'hb_diff',
};

export function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Storage unavailable — settings simply won't persist.
  }
}
