import React, { useEffect, useRef, useState } from 'react';
import { CardPick, FULL_CARD_MULT, LADDER, LETTERS, newPicks } from './engine';
import { sfx } from './sfx';

/** Card prices in the picker, as in Scratch Bingo's picker. */
export const PICK_PRICES = [10, 20, 20, 50, 50, 100];
/** Quick buy prices on the main screen, as in Scratch Bingo. */
export const QUICK_PRICES = [10, 20, 50, 100];

const fmt = (n: number) => 'KSh ' + n.toLocaleString('en-US');
const no = (i: number) => String(i + 1).padStart(2, '0');

const prizes = (price: number) => [
  { label: '1 line', value: LADDER[0] * price },
  { label: '2 lines', value: (LADDER[0] + LADDER[1]) * price },
  { label: '3 lines', value: (LADDER[0] + LADDER[1] + LADDER[2]) * price },
  { label: 'Full card', value: FULL_CARD_MULT * price },
];

/**
 * Card picker modelled on Scratch Bingo's (2026-11-10, Charles): swipe a looping carousel of priced cards,
 * take up to `max`, then approve to buy. Quick buy opens it with every card at one price and the first `max` taken.
 */
export function CardPicker({
  gameName,
  balance,
  max,
  quick,
  onBuy,
  onClose,
}: {
  gameName: string;
  balance: number;
  max: number;
  quick: number; // 0 = mixed prices
  onBuy: (picks: CardPick[]) => void;
  onClose: () => void;
}) {
  const prices = quick ? PICK_PRICES.map(() => quick) : PICK_PRICES;
  const n = prices.length;
  const firstPicks = () => (quick ? Array.from({ length: max }, (_, i) => i) : []);
  const [pool, setPool] = useState<CardPick[]>(() => newPicks(prices));
  const [picked, setPicked] = useState<number[]>(firstPicks);
  const [idx, setIdx] = useState(0);
  const [bump, setBump] = useState(0); // replays the "limit" nudge
  const downX = useRef<number | null>(null);
  const advance = useRef<number>();

  const go = (d: number) => {
    setIdx((i) => (((i + d) % n) + n) % n);
    sfx.brush();
  };
  const focus = (i: number) => {
    if (i !== idx) {
      setIdx(i);
      sfx.brush();
    }
  };
  const full = picked.length >= max;
  const pick = (i: number) => {
    window.clearTimeout(advance.current);
    if (picked.includes(i)) {
      setPicked(picked.filter((x) => x !== i));
      sfx.pop();
      return;
    }
    if (max === 1 && picked.length) {
      setPicked([i]);
      sfx.daub();
      return;
    }
    if (full) {
      setBump((b) => b + 1);
      sfx.miss();
      return;
    }
    const next = [...picked, i];
    setPicked(next);
    sfx.daub();
    if (next.length < max)
      advance.current = window.setTimeout(() => {
        for (let d = 1; d < n; d++) {
          const j = (i + d) % n;
          if (!next.includes(j)) return setIdx(j);
        }
      }, 420);
  };
  const newCards = () => {
    setPool(newPicks(prices));
    setPicked(firstPicks());
    sfx.special();
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  useEffect(() => () => window.clearTimeout(advance.current), []);

  const cost = picked.reduce((a, i) => a + pool[i].price, 0);
  const tooMuch = cost > balance;
  const taken = picked.includes(idx);
  const title = quick
    ? `Quick buy · ${max} × ${fmt(quick)}`
    : full
      ? max > 1
        ? 'Limit reached'
        : 'Card chosen'
      : max > 1
        ? 'Pick your cards'
        : 'Pick your card';
  const sub = quick
    ? `${max > 1 ? 'Your cards are' : 'Your card is'} ready · approve to buy, or swap first`
    : full
      ? max > 1
        ? `You have ${max} cards · approve to buy, or tap a taken card to swap it`
        : 'Approve to buy, or tap another card to switch to it'
      : max > 1
        ? `Swipe to look · tap to take up to ${max} · approve to buy`
        : 'Swipe to look · tap to take 1 · approve to buy';

  return (
    <div className={`sp ${full ? 'full' : ''}`} role="dialog" aria-modal="true" aria-label="Pick your cards">
      <div className="sp-top">
        <div className="sp-badge" key={bump}>
          {picked.length}/{max}
        </div>
        <div className="sp-title">
          <b>{title}</b>
          <small>{sub}</small>
        </div>
        <button className="sp-x" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <div
        className="sp-track"
        onPointerDown={(e) => (downX.current = e.clientX)}
        onPointerUp={(e) => {
          if (downX.current === null) return;
          const dx = e.clientX - downX.current;
          downX.current = null;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
      >
        {pool.map((card, i) => {
          let o = i - idx;
          if (o > n / 2) o -= n;
          if (o < -n / 2) o += n;
          const isTaken = picked.includes(i);
          return (
            <div
              key={i}
              className={`sp-card${o === 0 ? ' front' : ''}${isTaken ? ' taken' : full && max > 1 ? ' locked' : ''}${Math.abs(o) > 1 ? ' far' : ''}`}
              style={{ '--o': o, '--a': Math.abs(o) } as React.CSSProperties}
              aria-hidden={o !== 0}
              onClick={() => (o === 0 ? pick(i) : focus(i))}
            >
              <div className="sp-band">
                <span>{gameName}</span>
                <b>No. {no(i)}</b>
              </div>
              <div className="sp-rosette">
                <small>KSh</small>
                <b>{card.price}</b>
              </div>
              <div className="sp-letters">
                {LETTERS.map((l, j) => (
                  <span key={l} className={`c${j}`}>
                    {l}
                  </span>
                ))}
              </div>
              <div className="sp-grid">
                {card.nums.map((v, j) => (
                  <span key={j} className={v ? '' : 'free'}>
                    {v || '★'}
                  </span>
                ))}
              </div>
              <div className="sp-prz">
                {prizes(card.price).map((p) => (
                  <span key={p.label}>
                    <small>{p.label}</small>
                    <b>{p.value.toLocaleString('en-US')}</b>
                  </span>
                ))}
              </div>
              {isTaken && (
                <div className="sp-stamp" key={'s' + i}>
                  Taken <small>#{picked.indexOf(i) + 1}</small>
                </div>
              )}
              {!isTaken && full && max > 1 && o === 0 && (
                <div className="sp-lock" key={'l' + bump}>
                  <b>Limit reached</b>
                  <small>Put a card back to take this one</small>
                </div>
              )}
            </div>
          );
        })}
        <button className="sp-arrow l" onClick={() => go(-1)} aria-label="Previous card">
          ‹
        </button>
        <button className="sp-arrow r" onClick={() => go(1)} aria-label="Next card">
          ›
        </button>
      </div>

      <div className="sp-slots" aria-label="Cards taken">
        {Array.from({ length: max }, (_, k) => {
          const i = picked[k];
          return (
            <button key={k} className={`sp-slot ${i !== undefined ? 'on' : ''}`} disabled={i === undefined} onClick={() => i !== undefined && focus(i)}>
              {i !== undefined ? (
                <>
                  ✓ No. {no(i)} · <b>{fmt(pool[i].price)}</b>
                </>
              ) : (
                `Card slot ${k + 1}`
              )}
            </button>
          );
        })}
      </div>
      <div className="sp-dots" aria-hidden="true">
        {pool.map((_, i) => (
          <i key={i} className={`${i === idx ? 'on' : ''} ${picked.includes(i) ? 't' : ''}`} />
        ))}
      </div>
      <button className={`sp-take ${taken ? 'on' : full && max > 1 ? 'max' : ''}`} onClick={() => pick(idx)}>
        ✓ {taken ? 'Taken · tap to put back' : full ? (max > 1 ? `Limit of ${max} reached` : 'Switch to this card') : 'Take this card'}
      </button>
      <div className="sp-bottom">
        <button className="sp-new" onClick={newCards}>
          ⤮ New cards
        </button>
        <button className={`gold sp-buy ${full ? 'ready' : ''}`} disabled={!picked.length || tooMuch} onClick={() => onBuy(picked.map((i) => pool[i]))}>
          {!picked.length ? 'Take a card to buy' : tooMuch ? 'Not enough balance' : `Approve ${picked.length} card${picked.length > 1 ? 's' : ''} · ${fmt(cost)}`}
        </button>
      </div>
    </div>
  );
}
