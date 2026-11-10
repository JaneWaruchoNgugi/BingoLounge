// Catch sounds: bouncy arcade boings, coin blips and power-ups, and a quick chiptune with
// kick and hats.
import { hz, type Kit, type Theme } from '../shared/sfx';

const blip = (k: Kit, n: number, at = 0, dur = 0.07, vol = 0.04, type: OscillatorType = 'square') =>
  k.tone({ f: hz(n), at, dur, vol, type, lp: 3500, a: 0.002 });

export const catchSound: Theme = {
  musicHint: 'Bouncy chiptune',
  sfxHint: 'Boings, coin blips and power-ups',
  play: {
    tap(k) {
      k.tone({ f: 170, to: 760, dur: 0.13, vol: 0.12, type: 'sine' });
      k.tone({ f: 340, to: 1500, dur: 0.1, vol: 0.025, type: 'square', lp: 2500 });
      k.buzz(10);
    },
    pop(k) {
      blip(k, 76, 0, 0.05);
      blip(k, 83, 0.04, 0.06);
      k.buzz(8);
    },
    brush: (k) => blip(k, 96, 0, 0.02, 0.015),
    miss(k) {
      k.tone({ f: 420, to: 110, dur: 0.3, vol: 0.05, type: 'square', lp: 900 });
      k.buzz(30);
    },
    daub(k) {
      blip(k, 83, 0, 0.06);
      blip(k, 88, 0.06, 0.16);
    },
    special(k) {
      for (let i = 0; i < 10; i++) blip(k, 60 + i * 3, i * 0.035, 0.06, 0.035);
      k.tone({ f: hz(96), at: 0.35, dur: 0.3, vol: 0.03, type: 'square', lp: 4000 });
      k.buzz([15, 20, 15, 20, 40]);
    },
    line(k) {
      [72, 76, 79, 84, 88, 91, 96].forEach((n, i) => blip(k, n, i * 0.05, i === 6 ? 0.3 : 0.07, 0.04));
      k.tone({ f: 60, to: 40, dur: 0.25, vol: 0.2 });
      k.buzz(40);
    },
    start(k) {
      blip(k, 72, 0, 0.1);
      blip(k, 72, 0.18, 0.1);
      blip(k, 84, 0.36, 0.25);
    },
    win(k) {
      const tune = [72, 76, 79, 84, 79, 84, 88, 91, 96];
      tune.forEach((n, i) => blip(k, n, i * 0.08, i === tune.length - 1 ? 0.5 : 0.09, 0.045));
      tune.forEach((n, i) => blip(k, n - 12, i * 0.08, 0.08, 0.03, 'triangle'));
      k.buzz([30, 40, 30, 40, 100]);
    },
    tick: (k) => blip(k, 96, 0, 0.03, 0.03),
  },
  // 132 bpm: C - Am - F - G, square bass, triangle arpeggio, kick and hats.
  bar(k, t, n) {
    const beat = 60 / 132;
    const roots = [48, 45, 41, 43];
    const r = roots[n % 4];
    const tri = r === 45 ? [57, 60, 64] : r === 43 ? [55, 59, 62] : [r + 12, r + 16, r + 19];
    for (let e = 0; e < 8; e++) {
      const at = t + e * beat * 0.5;
      k.tone({ f: hz(e % 2 ? r : r - 12), at, dur: beat * 0.4, vol: 0.035, type: 'square', lp: 700, a: 0.003 });
      if (e % 2) k.noise({ at, dur: 0.03, vol: 0.05, f: 9000, ft: 'highpass' });
    }
    for (let s = 0; s < 16; s++) {
      if (n % 2 && s > 11 && s % 2) continue;
      const note = tri[(s + (s >> 2)) % 3] + 12;
      k.tone({ f: hz(note), at: t + s * beat * 0.25, dur: beat * 0.22, vol: 0.022, type: 'triangle', a: 0.002 });
    }
    [0, 2].forEach((b) => k.tone({ f: 150, to: 45, at: t + b * beat, dur: 0.16, vol: 0.18 }));
    k.noise({ at: t + beat, dur: 0.1, vol: 0.06, f: 1800, q: 0.7 });
    k.noise({ at: t + beat * 3, dur: 0.1, vol: 0.06, f: 1800, q: 0.7 });
    return beat * 4;
  },
};
