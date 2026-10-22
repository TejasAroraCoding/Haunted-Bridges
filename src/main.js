/**
 * Entry point: loads styles and fonts, boots every subsystem, then starts the main loop.
 */

import '@fontsource/rajdhani/latin-500.css';
import '@fontsource/rajdhani/latin-600.css';
import '@fontsource/rajdhani/latin-700.css';
import '@fontsource/chakra-petch/latin-600.css';
import '@fontsource/chakra-petch/latin-700.css';
import '@fontsource/chakra-petch/latin-700-italic.css';
import '@fontsource/jetbrains-mono/latin-500.css';
import '@fontsource/jetbrains-mono/latin-700.css';
import '@fontsource/jetbrains-mono/latin-800.css';

import './styles/utilities.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/menus.css';
import './styles/end-screen.css';

import { state } from './core/state.js';
import { startMusicScheduler } from './audio/audio.js';
import { startLoop } from './core/loop.js';
import { loadSettings } from './core/settings.js';
import { initInput } from './input/input.js';
import { initInstallPrompt, updateInstallUI } from './pwa/install.js';
import { registerServiceWorker } from './pwa/register-sw.js';
import { initActions } from './ui/actions.js';
import { initLayout, layoutStage } from './ui/layout.js';
import { renderHeroCardsUI } from './ui/menus.js';
import { updateDiffUI, updateGfxUI } from './ui/settings-panel.js';

loadSettings();
initActions();
initInput();
initLayout();
initInstallPrompt();
registerServiceWorker();
startMusicScheduler();

document.getElementById('ui-highscore').textContent = state.highScore;
renderHeroCardsUI();
updateDiffUI();
updateGfxUI();
updateInstallUI();
layoutStage();
document.fonts?.ready.then(layoutStage);

startLoop();

if (import.meta.env.MODE === 'test') {
  import('./debug/test-hooks.js').then(m => m.installTestHooks());
}
