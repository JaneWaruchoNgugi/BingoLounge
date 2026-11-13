import React from 'react';

/** Half-cracked coconut, used beside the title and in the HUD. */
export function CoconutIcon({ className = 'title-icon' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <radialGradient id="cs" cx="35%" cy="30%">
          <stop offset="0" stopColor="#b9773f" />
          <stop offset=".7" stopColor="#6e3f1c" />
          <stop offset="1" stopColor="#3f220d" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="26" r="19" fill="url(#cs)" />
      <path d="M8 22c4-9 28-9 32 0-5 4-27 4-32 0z" fill="#fffaf0" />
      <path d="M11 22c4-6 22-6 26 0" fill="none" stroke="#e9dcc3" strokeWidth="2" />
      <path d="M33 9c4-5 10-5 12-2-4 1-7 3-9 6z" fill="#3c9a4a" />
    </svg>
  );
}

/** Palms, sea, hills and flowers behind the coconuts. Decorative only. */
export function BeachScene() {
  const frond = (rot: number, len: number) => (
    <path key={rot} d={`M0 0 Q ${len * 0.5} ${-len * 0.28} ${len} ${len * 0.08} Q ${len * 0.5} ${-len * 0.08} 0 0`} fill="#2f8a43" stroke="#1f6a31" strokeWidth="1.5" transform={`rotate(${rot})`} />
  );
  const palm = (x: number, flip: boolean) => (
    <g transform={`translate(${x} 0) scale(${flip ? -1 : 1} 1)`}>
      <path d="M6 400 C 14 300 10 200 30 120" stroke="#7a5230" strokeWidth="11" fill="none" strokeLinecap="round" />
      <path d="M6 400 C 14 300 10 200 30 120" stroke="#a0713f" strokeWidth="4" strokeDasharray="6 9" fill="none" />
      <g transform="translate(30 120)">{[-170, -140, -110, -60, -25, 10, 40].map((r) => frond(r, 95))}</g>
      <circle cx="30" cy="128" r="7" fill="#5a3416" />
      <circle cx="40" cy="126" r="6" fill="#4a2a10" />
    </g>
  );
  const flower = (x: number, y: number, c: string, s = 1) => (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[0, 72, 144, 216, 288].map((r) => (
        <ellipse key={r} cx="0" cy="-13" rx="9" ry="14" fill={c} transform={`rotate(${r})`} />
      ))}
      <circle r="5" fill="#ffd86b" />
    </g>
  );
  return (
    <svg className="beach" viewBox="0 0 400 600" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3f8fe0" />
          <stop offset="1" stopColor="#a9dcf5" />
        </linearGradient>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b8fc4" />
          <stop offset="1" stopColor="#3fd0d0" />
        </linearGradient>
        <linearGradient id="sand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3d69a" />
          <stop offset="1" stopColor="#d9a964" />
        </linearGradient>
      </defs>
      <rect width="400" height="150" fill="url(#sky)" />
      <ellipse cx="90" cy="70" rx="40" ry="10" fill="#fff" opacity=".7" />
      <ellipse cx="300" cy="50" rx="34" ry="8" fill="#fff" opacity=".6" />
      <path d="M220 150 C 260 95 300 80 340 100 C 370 112 390 130 400 150 Z" fill="#3c8a6a" />
      <path d="M250 150 C 280 118 320 110 360 128 L 380 150 Z" fill="#2f7458" />
      <rect y="140" width="400" height="46" fill="url(#sea)" />
      <path d="M0 160 Q 50 154 100 160 T 200 160 T 300 160 T 400 160" stroke="#bff3ff" strokeWidth="2" fill="none" opacity=".7" />
      <path d="M0 180 Q 60 172 120 182 T 240 180 T 400 182 L 400 200 L 0 200 Z" fill="#f7f1df" opacity=".85" />
      <rect y="186" width="400" height="414" fill="url(#sand)" />
      {palm(-6, false)}
      {palm(406, true)}
      {flower(18, 560, '#e8344e', 1.1)}
      {flower(48, 590, '#f29e18', 0.8)}
      {flower(382, 566, '#e8344e', 1)}
      {flower(356, 594, '#f06a2a', 0.75)}
    </svg>
  );
}
