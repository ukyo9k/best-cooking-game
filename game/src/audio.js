// audio.js — all sounds are synthesised with WebAudio: no audio files, no network.
// A tiny synth: blips for picks, a filtered-noise sizzle for the grill, a bell for service.

let ctx = null;
let muted = false;
let sizzleNodes = null;

function ensureCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  return ctx;
}

/** Unlock audio on the first user gesture. */
export function unlockAudio() {
  const c = ensureCtx();
  if (c && c.state === 'suspended') void c.resume();
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  if (muted) stopSizzle();
  return muted;
}

function blip(freq, dur, type = 'sine', vol = 0.12, slideTo = null) {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

/** Short noise burst, e.g. a chop. */
function noiseBurst(dur, vol, filterFreq) {
  if (muted) return;
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  src.start(t);
}

export const sfx = {
  pick() {
    blip(520, 0.07, 'triangle', 0.1, 760);
  },
  place() {
    blip(300, 0.08, 'triangle', 0.1, 210);
  },
  chop() {
    noiseBurst(0.09, 0.22, 1800);
    blip(180, 0.06, 'square', 0.05, 120);
  },
  chopped() {
    blip(660, 0.08, 'triangle', 0.11, 880);
  },
  cooked() {
    blip(880, 0.12, 'sine', 0.12, 1320);
  },
  burnt() {
    blip(220, 0.3, 'sawtooth', 0.08, 110);
  },
  serve() {
    blip(1046, 0.14, 'sine', 0.14);
    setTimeout(() => blip(1318, 0.2, 'sine', 0.14), 90);
    setTimeout(() => blip(1568, 0.26, 'sine', 0.12), 180);
  },
  fail() {
    blip(330, 0.22, 'sawtooth', 0.09, 165);
  },
  tick() {
    blip(1200, 0.04, 'square', 0.05);
  },
  newOrder() {
    blip(587, 0.09, 'triangle', 0.1, 740);
  },
  error() {
    blip(160, 0.12, 'square', 0.08, 120);
  },
};

/** Looping grill sizzle while anything cooks; call with the count of items on the grill. */
export function setSizzle(count) {
  if (muted || count === 0) {
    stopSizzle();
    return;
  }
  const c = ensureCtx();
  if (!c || sizzleNodes) return;
  const len = c.sampleRate;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 4200;
  filter.Q.value = 0.6;
  const gain = c.createGain();
  gain.gain.value = 0.035;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  src.start();
  sizzleNodes = { src, gain };
}

export function stopSizzle() {
  if (!sizzleNodes) return;
  try {
    sizzleNodes.src.stop();
  } catch {
    /* already stopped */
  }
  sizzleNodes = null;
}
