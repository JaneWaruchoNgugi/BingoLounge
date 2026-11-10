import React, { useEffect, useRef, useState } from 'react';
import type { FieldProps } from '../shared/Shell';
import { sfx } from '../shared/sfx';
import { LanternArt, LanternDefs, NightScene, TONES, TONE_LABEL } from './art';

const PRIZES = [2, 5, 10]; // x stake
const ROUND_MS = 120_000;
const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export function LanternField({ state, reveal, bonus, revealAll }: FieldProps) {
  const live = state.phase === 'playing';
  const tokens = state.tokens.length ? state.tokens : Array.from({ length: 30 }, (_, i) => ({ i, n: null, kind: 'number' as const, tone: i % 4 }));
  const [order, setOrder] = useState<number[]>([]);
  const from = useRef(0);
  const [offer, setOffer] = useState<{ tone: number; prizes: number[]; picked: number | null } | null>(null);
  const [left, setLeft] = useState(ROUND_MS);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Round clock: lanterns still dark at 0:00 light up by themselves.
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

  useEffect(() => {
    setOrder((o) => {
      const add = state.revealed.map((r, i) => (r && !o.includes(i) ? i : -1)).filter((i) => i >= 0);
      return add.length ? [...o, ...add] : o;
    });
  }, [state.revealed]);

  useEffect(() => {
    if (offer) return;
    for (let p = from.current; p + 2 < order.length; p++) {
      const a = tokens[order[p]].tone;
      if (a === tokens[order[p + 1]].tone && a === tokens[order[p + 2]].tone) {
        from.current = p + 3;
        setOffer({ tone: a!, prizes: [...PRIZES].sort(() => Math.random() - 0.5), picked: null });
        sfx.special();
        return;
      }
    }
  }, [order, offer]);

  const lastTone = order.length > from.current ? tokens[order[order.length - 1]].tone! : -1;
  let run = 0;
  for (let p = order.length - 1; p >= from.current && tokens[order[p]].tone === lastTone; p--) run++;
  run = Math.min(3, run);
  const lit = state.revealed.filter(Boolean).length;
  const [wide, setWide] = useState(() => window.matchMedia('(min-width: 900px)').matches);
  useEffect(() => {
    const m = window.matchMedia('(min-width: 900px)');
    const on = () => setWide(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  const cols = wide ? 6 : 5;
  const rows = Math.ceil(tokens.length / cols);

  const light = (i: number) => {
    if (!live || state.revealed[i]) return;
    sfx.light();
    reveal(i);
  };

  return (
    <div className="field lantern-field">
      <LanternDefs />
      <NightScene />
      <div className="moon" aria-hidden="true" />
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
          <span className="hud-ico lantern-ico">
            <LanternArt tone={0} lit />
          </span>
          <div>
            <small>Lanterns in play</small>
            <b>
              {lit} / {tokens.length}
            </b>
          </div>
        </div>
      </div>
      <div className="streak" aria-label={`Colour run: ${run} of 3`}>
        <span>Colour run</span>
        {[0, 1, 2].map((k) => (
          <i key={k} className={k < run ? `on ${TONES[lastTone]}` : ''} />
        ))}
      </div>

      <div className="ropes" style={{ gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }} aria-hidden="true">
        {Array.from({ length: rows }, (_, r) => (
          <i key={r} />
        ))}
      </div>
      <div className="lanterns" style={{ gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`, gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {tokens.map((t) => {
          const on = state.revealed[t.i];
          const hit = on && t.n != null && state.card.includes(t.n);
          return (
            <button
              key={t.i}
              className={`lantern ${TONES[t.tone!]} ${on ? 'lit' : ''} ${hit ? 'hit' : ''}`}
              style={{ animationDelay: `${(t.i * 0.53) % 4}s` }}
              disabled={!live || on}
              aria-label={on ? `${TONE_LABEL[t.tone!]} lantern, ${t.n}` : 'Unlit lantern'}
              onClick={() => light(t.i)}
            >
              <LanternArt tone={t.tone!} lit={on} n={t.n} />
            </button>
          );
        })}
      </div>

      {live && (
        <button className="reveal-all" onClick={revealAll}>
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M12 2l1.8 5.6L19 9.5l-5.2 1.9L12 17l-1.8-5.6L5 9.5l5.2-1.9z M19 14l.9 2.3 2.1.7-2.1.8L19 20l-.9-2.2-2.1-.8 2.1-.7z" fill="#ffd86b" />
          </svg>
          Reveal All
        </button>
      )}

      {offer && (
        <div className="bonus" role="dialog" aria-label="Lantern bonus">
          <h3>Lantern bonus</h3>
          <p>{offer.picked == null ? `Three ${TONE_LABEL[offer.tone]} lanterns in a row. Pick a lantern.` : `You won KSh ${(offer.prizes[offer.picked] * state.stake).toLocaleString('en-US')}`}</p>
          <div className="bonus-row">
            {offer.prizes.map((m, k) => (
              <button
                key={k}
                className={`lantern big lit ${TONES[offer.tone]} ${offer.picked != null ? (k === offer.picked ? 'chosen' : 'other') : ''}`}
                disabled={offer.picked != null}
                aria-label={`Bonus lantern ${k + 1}`}
                onClick={() => {
                  setOffer({ ...offer, picked: k });
                  bonus(m * state.stake);
                  sfx.line();
                }}
              >
                <LanternArt tone={offer.tone} lit />
                {offer.picked != null && <b className="bonus-amt">{(m * state.stake).toLocaleString('en-US')}</b>}
              </button>
            ))}
          </div>
          {offer.picked != null && (
            <button className="gold" onClick={() => setOffer(null)}>
              Keep lighting
            </button>
          )}
        </div>
      )}
    </div>
  );
}
