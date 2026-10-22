/**
 * Install-as-app prompt handling.
 */

import { ensureAudio } from '../audio/audio.js';
import { toast } from '../ui/toast.js';

let deferredInstallPrompt = null;

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.matchMedia('(display-mode: fullscreen)').matches ||
  navigator.standalone === true;

export function updateInstallUI() {
  const b = document.getElementById('btn-install'),
    sb = document.getElementById('set-install-btn'),
    d = document.getElementById('set-install-desc');
  b.classList.toggle('hidden', !deferredInstallPrompt || isStandalone());
  if (isStandalone()) {
    sb.textContent = 'INSTALLED';
    sb.disabled = true;
    d.textContent = 'Running as an installed app';
  }
}

export function installApp() {
  ensureAudio();
  if (isStandalone()) {
    toast('Already installed');
    return;
  }
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.finally(() => {
      deferredInstallPrompt = null;
      updateInstallUI();
    });
  } else if (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  ) {
    toast('On iPhone/iPad: tap Share, then “Add to Home Screen”', 4200);
  } else if (!location.protocol.startsWith('http')) {
    toast('Host the game folder on an https site to install it', 3600);
  } else {
    toast('Use your browser menu → “Install app” or “Add to Home screen”', 3600);
  }
}

export function initInstallPrompt() {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredInstallPrompt = e;
    updateInstallUI();
  });
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    updateInstallUI();
    toast('Installed! Launch Haunted Bridges from your home screen');
  });
}
