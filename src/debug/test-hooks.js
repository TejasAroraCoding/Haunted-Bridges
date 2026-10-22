/**
 * Test-only hooks. Imported solely when built with `--mode test` (see main.js), so production
 * bundles never expose internals. Lets end-to-end tests inspect and drive the game directly.
 */

import { state } from '../core/state.js';
import { loadStage } from '../game/stage-loader.js';
import { hurt } from '../game/player.js';
import { damageEnemy } from '../game/combat.js';
import { startNewGameUI, togglePauseUI } from '../ui/menus.js';

export function installTestHooks() {
  window.__game = { state, loadStage, hurt, damageEnemy, startNewGameUI, togglePauseUI };
}
