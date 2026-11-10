// Tiny Web Audio sound kit, no audio files. Sound starts only after the first tap.
let ctx: AudioContext | null = null;
let muted = false;
try { muted = localStorage.getItem('ib-muted') === '1'; } catch {}

export const isMuted = () => muted;
export function setMuted(m: boolean) {
  muted = m;
  try { localStorage.setItem('ib-muted', m ? '1' : '0'); } catch {}
}

function ac(): AudioContext | null {
  if (muted) return null;
  try {
    ctx ??= new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur = 0.12, type: OscillatorType = 'sine', gain = 0.06, slideTo?: number, delay = 0) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur = 0.08, gain = 0.2, freq = 1800, q = 0.8) {
  const a = ac();
  if (!a) return;
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  f.Q.value = q;
  const g = a.createGain();
  g.gain.value = gain;
  src.connect(f).connect(g).connect(a.destination);
  src.start();
}

const buzz = (ms: number) => { try { navigator.vibrate?.(ms); } catch {} };

export const sfx = {
  pop() { noise(0.07, 0.5, 2600, 0.6); tone(520, 0.07, 'triangle', 0.05, 180); buzz(12); },
  crack() { noise(0.05, 0.45, 700, 1.2); noise(0.09, 0.3, 1400, 0.9); buzz(18); },
  rip() { noise(0.16, 0.18, 3200, 0.5); buzz(8); },
  brush() { noise(0.04, 0.05, 4200, 0.4); },
  light() { tone(660, 0.25, 'sine', 0.04, 990); },
  catch() { tone(300, 0.08, 'triangle', 0.08, 160); buzz(10); },
  miss() { tone(220, 0.12, 'sine', 0.03, 140); },
  daub() { tone(880, 0.12, 'sine', 0.04); },
  special() { tone(784, 0.18, 'sine', 0.05); tone(1175, 0.24, 'sine', 0.04, undefined, 0.09); tone(1568, 0.3, 'sine', 0.03, undefined, 0.18); buzz(25); },
  line() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.05, undefined, i * 0.08)); buzz(40); },
};
