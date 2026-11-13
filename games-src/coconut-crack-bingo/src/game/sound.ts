// Coconut Crack sounds: wooden knocks and shell cracks, marimba and steel drum, and a
// laid-back calypso tune with shaker.
import { hz, type Kit, type Theme } from '../shared/sfx';

const MARIMBA: [number, number][] = [[1, 1], [3.9, 0.22], [9.2, 0.05]];
const STEEL: [number, number][] = [[1, 1], [2, 0.45], [3, 0.2], [4.16, 0.1]];
const PENTA = [65, 67, 69, 72, 74, 77, 79, 81]; // F major pentatonic

const knock = (k: Kit, f: number, at = 0, vol = 0.16) => {
  k.tone({ f, to: f * 0.55, at, dur: 0.09, type: 'triangle', vol });
  k.noise({ at, dur: 0.035, vol: 0.25, f: f * 2.4, q: 3 });
};
const shaker = (k: Kit, at: number, vol: number) => k.noise({ at, dur: 0.06, vol, f: 7000, ft: 'highpass', q: 0.5 });

export const coconutSound: Theme = {
  musicHint: 'Calypso marimba by the sea',
  sfxHint: 'Coconut knocks, marimba and steel drum',
  play: {
    tap(k) {
      knock(k, 230);
      k.noise({ at: 0.03, dur: 0.12, vol: 0.32, f: 2400, q: 0.9 });
      k.noise({ at: 0.05, dur: 0.18, vol: 0.12, f: 900, to: 400, ft: 'lowpass' });
      k.buzz(18);
    },
    pop(k) {
      knock(k, 520, 0, 0.12);
      knock(k, 430, 0.07, 0.09);
      k.buzz(10);
    },
    brush: (k) => shaker(k, 0, 0.05),
    miss: (k) => knock(k, 150, 0, 0.12),
    daub(k) {
      k.strike(hz(PENTA[3 + Math.floor(Math.random() * 5)]), 0, 0.45, 0.1, MARIMBA);
    },
    special(k) {
      k.noise({ dur: 0.5, vol: 0.28, f: 3500, to: 300, ft: 'lowpass', q: 1.5 });
      [72, 74, 77, 79, 81, 84].forEach((n, i) => k.strike(hz(n), 0.12 + i * 0.06, 0.4, 0.08, MARIMBA));
      k.buzz([20, 40, 20]);
    },
    line(k) {
      [65, 69, 72, 77].forEach((n, i) => k.strike(hz(n), i * 0.09, 0.7, 0.09, STEEL));
      k.strike(hz(81), 0.38, 1, 0.08, STEEL);
      for (let i = 0; i < 4; i++) shaker(k, i * 0.09, 0.08);
      k.buzz(40);
    },
    start(k) {
      k.strike(hz(72), 0, 0.5, 0.08, STEEL);
      k.strike(hz(77), 0.14, 0.8, 0.08, STEEL);
      shaker(k, 0, 0.08);
      shaker(k, 0.14, 0.08);
    },
    win(k) {
      const run = [65, 69, 72, 77, 72, 77, 81, 84];
      run.forEach((n, i) => k.strike(hz(n), i * 0.1, i === run.length - 1 ? 1.4 : 0.5, 0.09, STEEL));
      [0, 0.4].forEach((t) => k.tone({ f: hz(41), at: t, dur: 0.5, type: 'triangle', vol: 0.14, lp: 500 }));
      k.buzz([30, 60, 30, 60, 80]);
    },
    tick: (k) => k.tone({ f: 2500, dur: 0.03, type: 'triangle', vol: 0.06 }),
  },
  // 108 bpm calypso, F - Bb - C - F, one chord a bar.
  bar(k, t, n) {
    const beat = 60 / 108;
    const roots = [53, 58, 60, 53];
    const r = roots[n % 4];
    const chord = [r + 12, r + 16, r + 19, r + 24];
    // bass: the calypso 1, (2-and), 3, 4 pattern
    [[0, 0], [1.5, 7], [2, 12], [3, 7]].forEach(([b, s]) =>
      k.tone({ f: hz(r - 12 + s), at: t + b * beat, dur: beat * 0.6, type: 'triangle', vol: 0.09, lp: 600, a: 0.01 }),
    );
    // marimba: off-beat chord tones, a little different every bar
    for (let e = 0; e < 8; e++) {
      if (e === 0 || (e === 4 && n % 2) || Math.random() < 0.25) continue;
      const note = chord[(e + n) % 4] + (e === 7 && n % 2 ? 2 : 0);
      k.strike(hz(note), t + e * beat * 0.5, 0.35, 0.035, MARIMBA, e % 2 ? 0.3 : -0.3);
    }
    for (let e = 0; e < 8; e++) shaker(k, t + e * beat * 0.5, e % 2 ? 0.035 : 0.015);
    return beat * 4;
  },
};
