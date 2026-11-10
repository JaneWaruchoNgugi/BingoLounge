// Lantern sounds: wind chimes, temple bells and a gong, paper and wood, and a slow night
// tune with koto plucks over a soft drone.
import { hz, type Kit, type Theme } from '../shared/sfx';

const BELL: [number, number][] = [[1, 1], [2.76, 0.35], [5.4, 0.15], [8.93, 0.06]];
const GONG: [number, number][] = [[1, 1], [1.48, 0.55], [2.1, 0.35], [2.94, 0.2], [4.1, 0.1]];
const PENTA = [62, 65, 67, 69, 72, 74, 77, 79, 81, 84, 86]; // D minor pentatonic
const pick = () => PENTA[4 + Math.floor(Math.random() * 7)];

const koto = (k: Kit, n: number, at: number, vol: number, pan = 0) => {
  k.tone({ f: hz(n), at, dur: 0.9, type: 'triangle', vol, a: 0.002, lp: 2600, pan });
  k.tone({ f: hz(n) * 2, at, dur: 0.25, vol: vol * 0.4, a: 0.002, pan });
};
const block = (k: Kit, f: number, at = 0, vol = 0.12) => k.tone({ f, to: f * 0.8, at, dur: 0.07, vol, a: 0.001 });

export const lanternSound: Theme = {
  musicHint: 'Slow koto and drone under the moon',
  sfxHint: 'Wind chimes, temple bells and a gong',
  play: {
    tap(k) {
      k.noise({ dur: 0.3, vol: 0.1, f: 300, to: 1600, ft: 'lowpass', q: 0.7 });
      k.strike(hz(pick() + 12), 0.06, 1.6, 0.05, BELL, Math.random() - 0.5);
      k.buzz(8);
    },
    pop(k) {
      block(k, 880);
      k.buzz(8);
    },
    brush: (k) => k.noise({ dur: 0.05, vol: 0.05, f: 3000, q: 0.5 }),
    miss: (k) => koto(k, 50, 0, 0.06),
    daub(k) {
      k.strike(hz(pick() + 12), 0, 1.2, 0.045, BELL);
    },
    special(k) {
      k.strike(98, 0, 3.5, 0.18, GONG);
      [86, 84, 81, 79, 77].forEach((n, i) => k.strike(hz(n + 12), 0.25 + i * 0.07, 1.4, 0.03, BELL, (i - 2) * 0.2));
      k.buzz([40, 30, 60]);
    },
    line(k) {
      [91, 89, 86, 84, 81, 79, 77].forEach((n, i) => k.strike(hz(n), i * 0.065, 1.6, 0.04, BELL, (i - 3) * 0.15));
      k.strike(hz(62), 0, 2.2, 0.07, BELL);
      k.buzz(40);
    },
    start(k) {
      k.strike(130.8, 0, 2.5, 0.12, GONG);
      k.strike(hz(81), 0.2, 1.5, 0.04, BELL);
    },
    win(k) {
      k.strike(98, 0, 4, 0.2, GONG);
      [74, 77, 79, 81, 84, 86, 89, 91, 93].forEach((n, i) => k.strike(hz(n), 0.3 + i * 0.09, 1.8, 0.04, BELL, (i - 4) * 0.12));
      k.buzz([40, 60, 40, 60, 100]);
    },
    tick: (k) => block(k, 1200, 0, 0.08),
  },
  // 72 bpm: a soft drone and a wandering koto line, a temple bell every other bar.
  bar(k, t, n) {
    const beat = 60 / 72;
    const len = beat * 4;
    const root = n % 4 === 2 ? 55 : 50; // D, with a lift to G
    k.tone({ f: hz(root - 12), at: t, dur: len + 0.4, vol: 0.05, a: 1.2, lp: 400 });
    k.tone({ f: hz(root - 5), at: t, dur: len + 0.4, vol: 0.03, a: 1.4, lp: 600 });
    let i = 3 + (n % 3);
    for (let b = 0; b < 8; b++) {
      if (b % 2 && Math.random() < 0.6) continue;
      if (b === 6 && n % 2) continue;
      i = Math.max(0, Math.min(PENTA.length - 3, i + [-2, -1, 1, 2][Math.floor(Math.random() * 4)]));
      koto(k, PENTA[i], t + b * beat * 0.5, 0.045, i % 2 ? 0.25 : -0.25);
    }
    if (n % 2 === 0) k.strike(hz(PENTA[8 + (n % 3)]), t + beat * 3, 2, 0.02, BELL, 0.4);
    return len;
  },
};
