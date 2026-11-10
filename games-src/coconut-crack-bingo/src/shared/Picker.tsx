import React, { useRef, useState } from 'react';
import { CardPick, FULL_CARD_MULT, LADDER, LETTERS, MAX_CARDS, newPicks } from './engine';

const fmt = (n: number) => 'KSh ' + n.toLocaleString('en-US');
/** Prices on offer, mixed so neighbours differ, as in the reference picker. */
export const OFFER_PRICES = [10, 20, 50, 10, 30, 100, 20, 200];

export function prizeRow(price: number) {
  return [
    { label: '1 line', value: LADDER[0] * price },
    { label: '2 lines', value: (LADDER[0] + LADDER[1]) * price },
    { label: '3 lines', value: (LADDER[0] + LADDER[1] + LADDER[2]) * price },
    { label: 'Full card', value: FULL_CARD_MULT * price },
  ];
}

export const priceTag = (price: number) => (price > 10 ? `×${price / 10} · KSh ${price}` : `KSh ${price}`);

function PickCard({ pick, taken }: { pick: CardPick; taken: boolean }) {
  return (
    <div className={`pk-card ${taken ? 'taken' : ''}`}>
      <div className="pk-letters" aria-hidden="true">
        {LETTERS.map((l, i) => (
          <span key={l} className={`c${i}`}>
            {l}
          </span>
        ))}
      </div>
      <div className="pk-grid">
        {pick.nums.map((n, i) => (
          <span key={i} className={n === 0 ? 'free' : ''}>
            {n === 0 ? '★' : n}
          </span>
        ))}
      </div>
      <span className="pk-tag">{priceTag(pick.price)}</span>
      {taken && (
        <span className="pk-check" aria-hidden="true">
          ✓
        </span>
      )}
    </div>
  );
}

export function Picker({ balance, onBuy, onClose }: { balance: number; initialPrices?: number[]; onBuy: (picks: CardPick[]) => void; onClose: () => void }) {
  const [offers] = useState<CardPick[]>(() => newPicks(OFFER_PRICES));
  const [taken, setTaken] = useState<number[]>([]);
  const [active, setActive] = useState(0);
  const [note, setNote] = useState('');
  const drag = useRef<{ x: number; id: number } | null>(null);

  const go = (d: number) => setActive((a) => Math.max(0, Math.min(offers.length - 1, a + d)));
  const toggle = (i: number) => {
    setNote('');
    if (taken.includes(i)) return setTaken(taken.filter((x) => x !== i));
    if (taken.length >= MAX_CARDS) return setNote(`You can take ${MAX_CARDS} cards. Put one back first.`);
    setTaken([...taken, i]);
  };

  const picks = taken.map((i) => offers[i]);
  const total = picks.reduce((a, p) => a + p.price, 0);
  const short = total > balance;
  const cur = offers[active];

  return (
    <div className="modal pk-modal" role="dialog" aria-modal="true" aria-label="Pick your cards">
      <div className="pk">
        <header className="pk-head">
          <span className="pk-ring" style={{ '--p': taken.length / MAX_CARDS } as React.CSSProperties} aria-label={`${taken.length} of ${MAX_CARDS} taken`}>
            <b>{taken.length}</b>
          </span>
          <div>
            <span className="pk-eyebrow">Practice mode</span>
            <h2>Pick your cards</h2>
            <p>Swipe · take up to {MAX_CARDS}</p>
          </div>
        </header>

        <div
          className="pk-stage"
          onPointerDown={(e) => (drag.current = { x: e.clientX, id: e.pointerId })}
          onPointerUp={(e) => {
            const d = drag.current;
            drag.current = null;
            if (!d || d.id !== e.pointerId) return;
            const dx = e.clientX - d.x;
            if (Math.abs(dx) > 36) go(dx < 0 ? 1 : -1);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') go(-1);
            if (e.key === 'ArrowRight') go(1);
          }}
        >
          {offers.map((p, i) => {
            const off = i - active;
            if (Math.abs(off) > 2) return null;
            return (
              <button
                key={i}
                className={`pk-slot off${off}`}
                style={{ '--o': off } as React.CSSProperties}
                tabIndex={off === 0 ? 0 : -1}
                aria-label={`${priceTag(p.price)} card${taken.includes(i) ? ', taken' : ''}`}
                onClick={() => (off === 0 ? toggle(i) : setActive(i))}
              >
                <PickCard pick={p} taken={taken.includes(i)} />
              </button>
            );
          })}
        </div>

        <p className="pk-prize">
          A line on this card pays from <b>{fmt(LADDER[0] * cur.price)}</b> · Full card <b>{fmt(FULL_CARD_MULT * cur.price)}</b>
        </p>

        <div className="pk-nav">
          <button className="pk-arrow" onClick={() => go(-1)} disabled={active === 0} aria-label="Previous card">
            ‹
          </button>
          <button className={`pk-take ${taken.includes(active) ? 'on' : ''}`} onClick={() => toggle(active)}>
            {taken.includes(active) ? `Put back · KSh ${cur.price}` : `Take this card · KSh ${cur.price}`}
          </button>
          <button className="pk-arrow" onClick={() => go(1)} disabled={active === offers.length - 1} aria-label="Next card">
            ›
          </button>
        </div>

        <div className="pk-slots" aria-label="Your cards">
          {Array.from({ length: MAX_CARDS }, (_, k) => {
            const i = taken[k];
            return i == null ? (
              <span key={k} className="pk-box" />
            ) : (
              <button key={k} className="pk-box on" onClick={() => setActive(i)} aria-label={`KSh ${offers[i].price} card, show it`}>
                ✓<small>{offers[i].price}</small>
              </button>
            );
          })}
        </div>
        {note && (
          <p className="pk-note" role="status">
            {note}
          </p>
        )}

        <div className="pk-actions">
          <button className="pk-close" onClick={onClose}>
            Close
          </button>
          <button className="pk-buy" disabled={!picks.length || short} onClick={() => onBuy(picks)}>
            {!picks.length ? 'Pick a card' : short ? 'Not enough balance' : `Buy ${picks.length} · ${fmt(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
