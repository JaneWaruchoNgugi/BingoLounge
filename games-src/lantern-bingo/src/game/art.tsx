import React from 'react';

// Lantern colours, after the mockup: amber, rose, blue, jade.
export const TONES = ['amber', 'rose', 'blue', 'jade'];
export const TONE_LABEL = ['amber', 'rose', 'blue', 'jade'];
const LIT = [
  ['#fff6d8', '#ffc24a', '#e07a10'],
  ['#ffe3f4', '#ff5fbf', '#b51f7e'],
  ['#e3f4ff', '#3fa2ff', '#1452b8'],
  ['#e6ffe9', '#3fdc72', '#11853c'],
];
const DIM = [
  ['#8a6a3a', '#5e4524', '#3b2a14'],
  ['#7a3e66', '#542a47', '#341a2c'],
  ['#3b5684', '#283c60', '#18253e'],
  ['#3c6e4c', '#284c34', '#183020'],
];

/** One set of gradients shared by every lantern on the page. */
export function LanternDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        {[LIT, DIM].map((set, s) =>
          set.map(([a, b, c], k) => (
            <radialGradient key={`${s}-${k}`} id={`lt-${s ? 'd' : 'l'}${k}`} cx="50%" cy="48%" r="60%">
              <stop offset="0" stopColor={a} />
              <stop offset=".55" stopColor={b} />
              <stop offset="1" stopColor={c} />
            </radialGradient>
          )),
        )}
        <linearGradient id="lt-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe9a6" />
          <stop offset="1" stopColor="#b8780f" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const Flower = ({ fill }: { fill: string }) => (
  <g fill={fill}>
    {[0, 60, 120, 180, 240, 300].map((r) => (
      <ellipse key={r} cx="30" cy="42" rx="3.4" ry="7" transform={`rotate(${r} 30 50)`} />
    ))}
    <circle cx="30" cy="50" r="3.5" />
  </g>
);

/** Paper lantern, 60 x 100. Lit lanterns show the number in the medallion. */
export function LanternArt({ tone, lit, n }: { tone: number; lit: boolean; n?: number | null }) {
  const id = `url(#lt-${lit ? 'l' : 'd'}${tone})`;
  const rib = lit ? 'rgba(120, 50, 0, .28)' : 'rgba(0,0,0,.3)';
  return (
    <svg viewBox="0 0 60 100" className="lantern-art" aria-hidden="true">
      <line x1="30" y1="0" x2="30" y2="10" stroke="#c99a3a" strokeWidth="2" />
      <rect x="18" y="9" width="24" height="7" rx="2" fill="url(#lt-gold)" />
      <path d="M14 18 Q 2 50 14 82 L 46 82 Q 58 50 46 18 Z" fill={id} />
      <path d="M22 18 Q 16 50 22 82 M38 18 Q 44 50 38 82 M30 18 V 82" stroke={rib} strokeWidth="1.3" fill="none" />
      <path d="M12 26 H48 M10 74 H50" stroke="rgba(255, 220, 140, .55)" strokeWidth="1.5" />
      {lit && n != null ? (
        <>
          <circle cx="30" cy="50" r="13.5" fill="#fffaf0" stroke="#e9b84a" strokeWidth="1.6" />
          <text x="30" y="55.5" textAnchor="middle" fontSize={n > 9 ? 15 : 17} fontWeight="900" fill="#5a0f0f" fontFamily="'Plus Jakarta Sans', system-ui, sans-serif">
            {n}
          </text>
        </>
      ) : (
        <Flower fill={lit ? 'rgba(255,255,255,.75)' : 'rgba(255, 230, 190, .35)'} />
      )}
      <rect x="16" y="82" width="28" height="6" rx="2" fill="url(#lt-gold)" />
      <path d="M24 88 V 98 M27 88 V 99 M30 88 V 100 M33 88 V 99 M36 88 V 98" stroke="#d9a63a" strokeWidth="1.4" />
    </svg>
  );
}

/** Moon, blossom branches, pagodas and lake. Decorative only. */
export function NightScene() {
  const blossom = (x: number, y: number, s = 1) => (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="#f2a6d8">
      {[0, 72, 144, 216, 288].map((r) => (
        <circle key={r} cx="0" cy="-3.2" r="2.6" transform={`rotate(${r})`} />
      ))}
      <circle r="1.5" fill="#fff0c0" />
    </g>
  );
  const pagoda = (x: number, flip: boolean) => (
    <g transform={`translate(${x} 0) scale(${flip ? -1 : 1} 1)`} fill="#070f19">
      {[0, 1, 2].map((k) => (
        <g key={k}>
          <path d={`M${-36 + k * 6} ${430 - k * 46} Q 0 ${416 - k * 46} ${36 - k * 6} ${430 - k * 46} L ${26 - k * 6} ${436 - k * 46} L ${-26 + k * 6} ${436 - k * 46} Z`} />
          <rect x={-22 + k * 5} y={436 - k * 46} width={44 - k * 10} height="40" />
          <rect x={-14 + k * 4} y={446 - k * 46} width="6" height="10" fill="#ffb648" opacity=".85" />
          <rect x={6 - k * 2} y={446 - k * 46} width="6" height="10" fill="#ffb648" opacity=".85" />
        </g>
      ))}
      <path d="M0 330 V 300" stroke="#070f19" strokeWidth="3" />
    </g>
  );
  return (
    <svg className="night" viewBox="0 0 400 600" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="nsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#06111f" />
          <stop offset=".6" stopColor="#10283c" />
          <stop offset="1" stopColor="#3a1c26" />
        </linearGradient>
        <radialGradient id="nmoon" cx="40%" cy="40%">
          <stop offset="0" stopColor="#fff4ea" />
          <stop offset=".7" stopColor="#f6d6d8" />
          <stop offset="1" stopColor="#e3b7c7" />
        </radialGradient>
        <linearGradient id="nlake" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0e2232" />
          <stop offset="1" stopColor="#040b14" />
        </linearGradient>
      </defs>
      <rect width="400" height="600" fill="url(#nsky)" />
      <path d="M0 470 Q 60 420 120 455 Q 180 425 240 455 Q 300 420 400 460 L 400 520 L 0 520 Z" fill="#0a1824" />
      {pagoda(26, false)}
      {pagoda(374, true)}
      <rect y="515" width="400" height="85" fill="url(#nlake)" />
      {[530, 548, 566, 584].map((y, k) => (
        <path key={y} d={`M${20 + k * 12} ${y} H ${380 - k * 15}`} stroke="#ffb648" strokeWidth="1.2" strokeDasharray="10 14" opacity={0.35 - k * 0.06} />
      ))}
      <path d="M0 40 Q 40 30 70 50 Q 90 62 110 58" stroke="#3a1a2e" strokeWidth="4" fill="none" />
      <path d="M400 150 Q 370 140 350 160 Q 335 172 315 170" stroke="#3a1a2e" strokeWidth="4" fill="none" />
      {[[10, 34], [26, 40], [44, 36], [60, 48], [76, 54], [92, 60], [104, 54], [36, 52], [70, 40]].map(([x, y], k) => (
        <g key={k}>{blossom(x, y, 1 + (k % 3) * 0.2)}</g>
      ))}
      {[[392, 146], [376, 154], [360, 150], [344, 164], [328, 168], [318, 160], [368, 166]].map(([x, y], k) => (
        <g key={k}>{blossom(x, y, 1 + (k % 2) * 0.3)}</g>
      ))}
    </svg>
  );
}
