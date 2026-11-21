// All sound is synthesized with WebAudio — no audio files, no network.
// Short oscillator envelopes: footsteps, alert sting, pickup chime, coin clink,
// win and lose jingles. The context starts on the first user gesture.
let ctx = null;
let muted = false;

export function setMuted(value) { muted = value; }
export function isMuted() { return muted; }

export function ensureAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch {
    ctx = null;
  }
  return ctx;
}

function tone(freq, dur, type, vol, when = 0, slideTo = null) {
  if (muted) return;
  const ac = ensureAudio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noiseBurst(dur, vol, when = 0, lowpass = 1200) {
  if (muted) return;
  const ac = ensureAudio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const len = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowpass;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(t0);
}

export function playFootstep(loud) {
  if (loud) noiseBurst(0.09, 0.16, 0, 900);
  else noiseBurst(0.06, 0.05, 0, 600);
}
export function playGuardStep(distance) {
  // A guard's boots, quieter with distance — footsteps that tell you where a guard is.
  const vol = Math.max(0.015, 0.11 - distance / 3200);
  noiseBurst(0.07, vol, 0, 500);
}
export function playSuspicious() { tone(392, 0.16, 'sine', 0.12); tone(523, 0.2, 'sine', 0.1, 0.1); }
export function playAlert() {
  tone(220, 0.22, 'sawtooth', 0.14, 0, 440);
  tone(440, 0.3, 'sawtooth', 0.12, 0.14, 220);
  noiseBurst(0.25, 0.1, 0, 2400);
}
export function playPickup() { tone(880, 0.1, 'sine', 0.14); tone(1318, 0.18, 'sine', 0.12, 0.08); }
export function playCoinThrow() { tone(1200, 0.08, 'triangle', 0.1, 0, 700); }
export function playCoinLand() { tone(1568, 0.07, 'triangle', 0.16); tone(2093, 0.12, 'triangle', 0.12, 0.06); }
export function playCaught() { tone(160, 0.5, 'sawtooth', 0.2, 0, 60); noiseBurst(0.3, 0.14, 0, 500); }
export function playWin() {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.14, i * 0.13));
}
export function playLose() {
  [392, 330, 262, 196].forEach((f, i) => tone(f, 0.26, 'triangle', 0.13, i * 0.16));
}
export function playClick() { tone(660, 0.05, 'square', 0.05); }
export function playBeamHum() { tone(55, 1.2, 'sine', 0.02); }
