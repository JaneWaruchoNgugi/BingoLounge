// Web Audio sound kit, no audio files. Each game picks a sound theme (setTheme) so its taps,
// wins and music sound like that game only. Sound starts only after the first tap.
// Settings (music, sound effects, volume, vibration) are kept per game in localStorage.

export interface SoundSettings {
  music: boolean;
  sfx: boolean;
  volume: number; // 0..1
  vibrate: boolean;
}

export type Ev = 'tap' | 'special' | 'daub' | 'line' | 'miss' | 'pop' | 'brush' | 'start' | 'win' | 'tick';

export interface Theme {
  /** what the music and effects sound like, shown in settings */
  musicHint: string;
  sfxHint: string;
  play: Partial<Record<Ev, (k: Kit) => void>>;
  /** schedules one bar of music starting at time t and returns the bar length in seconds */
  bar?: (k: Kit, t: number, bar: number) => number;
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfxBus: GainNode | null = null;
let musicBus: GainNode | null = null;
let key = 'ib';
let theme: Theme | null = null;
let set: SoundSettings = { music: true, sfx: true, volume: 0.8, vibrate: true };
const subs = new Set<(s: SoundSettings) => void>();

function load() {
  try {
    const raw = localStorage.getItem(`${key}-sound`);
    if (raw) set = { ...set, ...JSON.parse(raw) };
    else if (localStorage.getItem('ib-muted') === '1') set = { ...set, music: false, sfx: false };
  } catch {}
}

export const getSound = () => set;
export const getTheme = () => theme;
export function setSound(p: Partial<SoundSettings>) {
  set = { ...set, ...p };
  try {
    localStorage.setItem(`${key}-sound`, JSON.stringify(set));
  } catch {}
  apply();
  subs.forEach((f) => f(set));
}
export function onSound(f: (s: SoundSettings) => void) {
  subs.add(f);
  return () => {
    subs.delete(f);
  };
}
// The older single toggle, kept for games that still use it.
export const isMuted = () => !set.sfx && !set.music;
export const setMuted = (m: boolean) => setSound({ sfx: !m, music: !m });

let started = false;
/** Called once by each game: loads that game's saved settings and its sound theme. */
export function setTheme(id: string, t?: Theme) {
  key = `ib-${id}`;
  theme = t ?? null;
  load();
  if (started || typeof window === 'undefined') return;
  started = true;
  const go = () => {
    ac(true);
    apply();
  };
  window.addEventListener('pointerdown', go, { capture: true });
  window.addEventListener('keydown', go, { capture: true });
  document.addEventListener('visibilitychange', apply);
}

function ac(create = false): AudioContext | null {
  try {
    if (!ctx) {
      if (!create) return null;
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = set.volume;
      const comp = ctx.createDynamicsCompressor();
      sfxBus = ctx.createGain();
      musicBus = ctx.createGain();
      musicBus.gain.value = 0;
      sfxBus.connect(comp);
      musicBus.connect(comp);
      comp.connect(master).connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function apply() {
  if (!ctx || !master || !sfxBus || !musicBus) return;
  const t = ctx.currentTime;
  master.gain.setTargetAtTime(set.volume, t, 0.05);
  sfxBus.gain.setTargetAtTime(set.sfx ? 1 : 0, t, 0.02);
  const on = set.music && !!theme?.bar && !document.hidden;
  musicBus.gain.setTargetAtTime(on ? 1 : 0, t, 0.3);
  if (on) startMusic();
}

// ---------- music scheduler: books notes a little ahead of time ----------
let nextBar = 0;
let barNo = 0;
let timer: number | undefined;
function startMusic() {
  if (timer !== undefined || !ctx || !theme?.bar) return;
  nextBar = Math.max(nextBar, ctx.currentTime + 0.1);
  const loop = () => {
    if (!ctx || !theme?.bar || !set.music || document.hidden) {
      timer = undefined;
      return;
    }
    while (nextBar < ctx.currentTime + 0.8) nextBar += theme.bar(musicKit, nextBar, barNo++);
    timer = window.setTimeout(loop, 200);
  };
  loop();
}

// ---------- building blocks ----------
export interface ToneOpts {
  f: number;
  /** seconds from now (effects) or an absolute time (music) */
  at?: number;
  dur?: number;
  vol?: number;
  type?: OscillatorType;
  to?: number;
  a?: number;
  lp?: number;
  pan?: number;
  det?: number;
}
export interface NoiseOpts {
  at?: number;
  dur?: number;
  vol?: number;
  f?: number;
  to?: number;
  q?: number;
  ft?: BiquadFilterType;
  pan?: number;
}
export interface Kit {
  tone: (o: ToneOpts) => void;
  noise: (o: NoiseOpts) => void;
  /** a struck note built from [ratio, level] partials: bells, marimba, steel drum */
  strike: (f: number, at: number, dur: number, vol: number, partials: [number, number][], pan?: number) => void;
  buzz: (ms: number | number[]) => void;
}

function out(c: AudioContext, bus: GainNode, pan?: number): AudioNode {
  if (pan && c.createStereoPanner) {
    const p = c.createStereoPanner();
    p.pan.value = pan;
    p.connect(bus);
    return p;
  }
  return bus;
}

function makeKit(which: 'sfx' | 'music'): Kit {
  const live = () => {
    const c = which === 'sfx' ? ac(true) : ctx;
    const b = which === 'sfx' ? sfxBus : musicBus;
    if (!c || !b || (which === 'sfx' && !set.sfx)) return null;
    return [c, b] as const;
  };
  const when = (c: AudioContext, at = 0) => (which === 'sfx' ? c.currentTime + at : at);
  const kit: Kit = {
    tone({ f, at, dur = 0.12, vol = 0.06, type = 'sine', to, a = 0.004, lp, pan, det }) {
      const l = live();
      if (!l) return;
      const [c, b] = l;
      const t = when(c, at);
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, t);
      if (det) o.detune.value = det;
      if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      let n: AudioNode = o.connect(g);
      if (lp) {
        const fl = c.createBiquadFilter();
        fl.type = 'lowpass';
        fl.frequency.value = lp;
        n = n.connect(fl);
      }
      n.connect(out(c, b, pan));
      o.start(t);
      o.stop(t + dur + 0.03);
    },
    noise({ at, dur = 0.08, vol = 0.2, f = 1800, to, q = 0.8, ft = 'bandpass', pan }) {
      const l = live();
      if (!l) return;
      const [c, b] = l;
      const t = when(c, at);
      const len = Math.max(1, Math.floor(c.sampleRate * dur));
      const buf = c.createBuffer(1, len, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
      const src = c.createBufferSource();
      src.buffer = buf;
      const fl = c.createBiquadFilter();
      fl.type = ft;
      fl.frequency.setValueAtTime(f, t);
      if (to) fl.frequency.exponentialRampToValueAtTime(to, t + dur);
      fl.Q.value = q;
      const g = c.createGain();
      g.gain.value = vol;
      src.connect(fl).connect(g).connect(out(c, b, pan));
      src.start(t);
    },
    strike(f, at, dur, vol, partials, pan) {
      partials.forEach(([r, v], i) => kit.tone({ f: f * r, at, dur: dur / (1 + i * 0.5), vol: vol * v, a: 0.002, pan }));
    },
    buzz(ms) {
      if (!set.vibrate || !set.sfx || which !== 'sfx') return;
      try {
        navigator.vibrate?.(ms);
      } catch {}
    },
  };
  return kit;
}
const k = makeKit('sfx');
const musicKit = makeKit('music');

/** Turns a note number (60 = middle C) into a frequency. */
export const hz = (n: number) => 440 * 2 ** ((n - 69) / 12);

// The original sounds, used by games without a theme of their own.
const legacy = {
  crack() {
    k.noise({ dur: 0.05, vol: 0.45, f: 700, q: 1.2 });
    k.noise({ dur: 0.09, vol: 0.3, f: 1400, q: 0.9 });
    k.buzz(18);
  },
  rip() {
    k.noise({ dur: 0.16, vol: 0.18, f: 3200, q: 0.5 });
    k.buzz(8);
  },
  light: () => k.tone({ f: 660, dur: 0.25, vol: 0.04, to: 990 }),
  catch() {
    k.tone({ f: 300, dur: 0.08, type: 'triangle', vol: 0.08, to: 160 });
    k.buzz(10);
  },
  pop() {
    k.noise({ dur: 0.07, vol: 0.5, f: 2600, q: 0.6 });
    k.tone({ f: 520, dur: 0.07, type: 'triangle', vol: 0.05, to: 180 });
    k.buzz(12);
  },
  brush: () => k.noise({ dur: 0.04, vol: 0.05, f: 4200, q: 0.4 }),
  miss: () => k.tone({ f: 220, dur: 0.12, vol: 0.03, to: 140 }),
  daub: () => k.tone({ f: 880, dur: 0.12, vol: 0.04 }),
  special() {
    k.tone({ f: 784, dur: 0.18, vol: 0.05 });
    k.tone({ f: 1175, at: 0.09, dur: 0.24, vol: 0.04 });
    k.tone({ f: 1568, at: 0.18, dur: 0.3, vol: 0.03 });
    k.buzz(25);
  },
  line() {
    [523, 659, 784, 1047].forEach((f, i) => k.tone({ f, at: i * 0.08, dur: 0.22, type: 'triangle', vol: 0.05 }));
    k.buzz(40);
  },
  tap() {},
  start() {},
  win() {},
  tick() {},
};

const fire = (e: Ev, old: () => void) => () => {
  const f = theme?.play[e];
  if (f) f(k);
  else if (!theme) old();
};

export const sfx = {
  crack: fire('tap', legacy.crack),
  rip: fire('tap', legacy.rip),
  light: fire('tap', legacy.light),
  catch: fire('tap', legacy.catch),
  tap: fire('tap', legacy.tap),
  pop: fire('pop', legacy.pop),
  brush: fire('brush', legacy.brush),
  miss: fire('miss', legacy.miss),
  daub: fire('daub', legacy.daub),
  special: fire('special', legacy.special),
  line: fire('line', legacy.line),
  start: fire('start', legacy.start),
  win: fire('win', legacy.win),
  tick: fire('tick', legacy.tick),
};
