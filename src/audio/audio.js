/**
 * WebAudio synth: voice-limited sound effects and a background drone with a scheduled melody.
 */

import { state } from '../core/state.js';

let musicStep = 0;

let musicNextTime = 0;

let activeVoices = 0;

const MUSIC_NOTES = [220, 261.6, 329.6, 392, 329.6, 261.6, 196, 246.9];

export function ensureAudio() {
  if (state.audioCtx) {
    if (state.audioCtx.state === 'suspended') state.audioCtx.resume();
    return;
  }
  try {
    state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    state.musicGain = state.audioCtx.createGain();
    state.musicGain.gain.value = state.muted ? 0 : 0.04;
    const f = state.audioCtx.createBiquadFilter();
    f.frequency.value = 280;
    const o = state.audioCtx.createOscillator(),
      o2 = state.audioCtx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = 55;
    o2.type = 'sine';
    o2.frequency.value = 82.4;
    o.connect(f);
    o2.connect(f);
    f.connect(state.musicGain);
    state.musicGain.connect(state.audioCtx.destination);
    o.start();
    o2.start();
  } catch (e) {
    state.audioCtx = null;
  }
}

export function playTone(f, when, d, type, v, slide = 0) {
  if (!state.audioCtx || state.muted || activeVoices > 36) return;
  const o = state.audioCtx.createOscillator(),
    a = state.audioCtx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, when);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), when + d);
  a.gain.setValueAtTime(v, when);
  a.gain.exponentialRampToValueAtTime(0.001, when + d);
  o.connect(a);
  a.connect(state.audioCtx.destination);
  activeVoices++;
  o.onended = () => {
    activeVoices--;
  };
  o.start(when);
  o.stop(when + d + 0.03);
}

export function playSfx(f, d, t = 'square', v = 0.08, s = 0) {
  if (state.audioCtx) playTone(f, state.audioCtx.currentTime, d, t, v, s);
}

export function startMusicScheduler() {
  // Music sequencer: schedules ahead on the audio clock so tempo never drifts
  setInterval(() => {
    if (!state.audioCtx || state.muted || state.scene !== 'play') return;
    const now = state.audioCtx.currentTime;
    if (musicNextTime < now) musicNextTime = now + 0.05;
    while (musicNextTime < now + 0.25) {
      playTone(MUSIC_NOTES[musicStep++ % 8] / 2, musicNextTime, 0.42, 'triangle', 0.03);
      musicNextTime += 0.48;
    }
  }, 100);
}
