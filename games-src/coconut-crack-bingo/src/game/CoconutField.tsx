import React, { useEffect, useRef, useState } from 'react';
import type { FieldProps } from '../shared/Shell';
import { colOf } from '../shared/engine';
import { sfx } from '../shared/sfx';
import { BeachScene, CoconutIcon } from './art';

export const ROUND_MS = 120_000; // 2:00 to crack them all, then the rest open by themselves
const jit = (i: number, k: number) => Math.sin(i * 91.7 + k * 13.1) * 0.5;
const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export function CoconutField({ state, reveal }: FieldProps) {
  const [cracking, setCracking] = useState<Record<number, boolean>>({});
  const live = state.phase === 'playing';
  const tokens = state.tokens.length ? state.tokens : Array.from({ length: 30 }, (_, i) => ({ i, n: null, kind: 'number' as const }));
  const [left, setLeft] = useState(ROUND_MS);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Round clock: when it runs out, every coconut still closed cracks open.
  useEffect(() => {
    if (!live) return;
    const start = performance.now();
    const id = window.setInterval(() => {
      const l = ROUND_MS - (performance.now() - start);
      setLeft(l);
      if (l <= 0) {
        window.clearInterval(id);
        const s = stateRef.current;
        s.tokens.forEach((t) => !s.revealed[t.i] && reveal(t.i));
      }
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  const crack = (i: number) => {
    if (!live || cracking[i] || state.revealed[i]) return;
    sfx.crack();
    setCracking((c) => ({ ...c, [i]: true }));
    setTimeout(() => {
      reveal(i);
      if (state.tokens[i]?.kind === 'double') sfx.special();
    }, 240);
  };

  const opened = state.revealed.filter(Boolean).length;

  return (
    <div className="field coco-field">
      <BeachScene />
      <div className="hud">
        <div className="hud-box">
          <svg className="hud-ico" viewBox="0 0 32 32" aria-hidden="true">
            <circle cx="16" cy="18" r="11" fill="none" stroke="#f6b928" strokeWidth="3" />
            <path d="M16 18V12M16 18l4 3" stroke="#f6b928" strokeWidth="2.6" strokeLinecap="round" />
            <rect x="12" y="2" width="8" height="4" rx="1.5" fill="#f6b928" />
          </svg>
          <div>
            <small>Time left</small>
            <b className={live && left < 15000 ? 'low' : ''}>{mmss(live ? left : state.phase === 'done' ? 0 : ROUND_MS)}</b>
          </div>
        </div>
        <div className="hud-box right">
          <CoconutIcon className="hud-ico" />
          <div>
            <small>Cracked</small>
            <b>
              {opened} / {tokens.length}
            </b>
          </div>
        </div>
      </div>
      <div className="coco-grid">
        {tokens.map((t) => {
          const style = { transform: `translate(${jit(t.i, 1) * 8}px, ${jit(t.i, 2) * 6}px)` } as React.CSSProperties;
          if (state.revealed[t.i]) {
            const milk = t.kind === 'double';
            const hit = t.n != null && state.card.includes(t.n);
            return (
              <div key={t.i} className={`coco open ${milk ? 'milk' : ''} ${hit ? 'hit' : ''}`} style={style}>
                <span className="rays" aria-hidden="true" />
                <span className="bits" aria-hidden="true">
                  {[0, 60, 120, 180, 240, 300].map((a) => (
                    <i key={a} style={{ '--a': `${a + jit(t.i, a) * 30}deg` } as React.CSSProperties} />
                  ))}
                </span>
                <span className="cup">
                  <b className={`c${colOf(t.n!)}`}>{t.n}</b>
                </span>
                {milk && <span className="milk-tag">x2 next line</span>}
              </div>
            );
          }
          return (
            <button
              key={t.i}
              className={`coco shell ${cracking[t.i] ? 'cracking' : ''}`}
              style={{ ...style, animationDelay: `${(t.i * 0.41) % 3}s` }}
              disabled={!live}
              aria-label="Coconut"
              onPointerDown={(e) => {
                e.preventDefault();
                crack(t.i);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  crack(t.i);
                }
              }}
            >
              <span className="eyes" />
              <span className="split" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
