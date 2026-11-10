import React, { useEffect, useReducer, useRef, useState } from 'react';
import { isMuted, setMuted, sfx } from './sfx';
import { createRoot } from 'react-dom/client';
import { Picker, prizeRow, priceTag } from './Picker';
import { CardPicker, QUICK_PRICES } from './CardPicker';
import {
  CALLS_PER_ROUND,
  LINES as LINE_CELLS,
  LADDER,
  LETTERS,
  PRICES,
  START_BALANCE,
  Rng,
  RoundState,
  CardState,
  CardPick,
  newPicks,
  Token,
  colOf,
  initialState,
  letterOf,
  reducer,
  totalWin,
} from './engine';

export interface FieldProps {
  state: RoundState;
  reveal: (i: number) => void;
  lose: (i: number) => void;
  bonus: (amount: number) => void;
  revealAll: () => void;
}

export interface Chip {
  label: string;
  tone?: 'gold' | 'info';
}

export interface GameDef {
  id: string;
  name: string; // e.g. "Pop"
  fieldTitle: string; // e.g. "Pop the balloons"
  pitch: string; // one line under the buy button
  rules: string[];
  makeTokens: (calls: number[], rng: Rng) => Token[];
  Field: React.ComponentType<FieldProps>;
  revealAllLabel?: string | false;
  chips?: (s: RoundState) => Chip[];
  calls?: number; // calls per round, default 30
  banner?: string; // announcement strip above the game
  inlineCards?: boolean; // deal cards on the main screen instead of the picker sheet
  theme?: 'bright';
  startLabel?: string; // main button when cards are on the main screen
  icon?: React.ReactNode; // small art beside the title
}

const fmt = (n: number) => 'KSh ' + n.toLocaleString('en-US');

function loadBalance(id: string): number {
  try {
    const v = localStorage.getItem(`ib-${id}-balance`);
    if (v != null && !isNaN(+v)) return +v;
  } catch {}
  return START_BALANCE;
}

export function Ball({ n, size = 'md' }: { n: number; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span className={`ball ball-${size} c${colOf(n)}`}>
      <small>{letterOf(n)}</small>
      {n}
    </span>
  );
}

function CardView({ c, ci, s, placing, onPlace, two }: { c: CardState; ci: number; s: RoundState; placing: boolean; onPlace: (cell: number) => void; two: boolean }) {
  const wins = s.lineWins.filter((w) => w.card === ci);
  const matched = c.daubed.filter(Boolean).length - 1;
  return (
    <div className={`bcard ${two ? 'two' : ''}`}>
      <div className="bcard-head">
        <b>{two ? `Card ${ci + 1}` : 'Your card'}</b>
        <span className="price">KSh {c.price}</span>
        <span className="bcard-meta">
          {matched} matched · {wins.length} line{wins.length === 1 ? '' : 's'}
        </span>
      </div>
      <div className="letters" aria-hidden="true">
        {LETTERS.map((l, i) => (
          <span key={l} className={`c${i}`}>
            {l}
          </span>
        ))}
      </div>
      <div className={`grid ${placing ? 'placing' : ''}`} role="grid">
        {c.nums.map((n, i) => {
          const d = c.daubed[i];
          const inLine = wins.some((w) => LINE_CELLS[w.line].includes(i));
          const cls = ['cell', d ? `on c${i % 5}` : '', inLine ? 'line' : '', s.justDaubed.includes(ci * 25 + i) ? 'fresh' : '', n === 0 ? 'free' : '']
            .filter(Boolean)
            .join(' ');
          if (placing && !d)
            return (
              <button key={`${s.roundId}-${i}`} className={cls + ' pick'} onClick={() => onPlace(i)} aria-label={`Place free daub on ${n}`}>
                {n}
              </button>
            );
          return (
            <div key={`${s.roundId}-${i}`} className={cls} role="gridcell" aria-label={n === 0 ? 'Free space' : `${n}${d ? ', daubed' : ''}`}>
              {n === 0 ? '★' : n}
            </div>
          );
        })}
      </div>
      <dl className="ladder" aria-label={`Prizes for this KSh ${c.price} card`}>
        {prizeRow(c.price).map((p, k) => (
          <div key={p.label} className={(k < 3 ? wins.length > k : c.full) ? 'hit' : ''}>
            <dt>{p.label}</dt>
            <dd>{p.value.toLocaleString('en-US')}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

const SHORT_PRIZES = (price: number) => prizeRow(price).filter((p) => p.label !== '3 lines');

function DealCard({ pick, ci, two }: { pick: CardPick; ci: number; two: boolean }) {
  return (
    <div className={`bcard ${two ? 'two' : ''} deal on`}>
      <div className="bcard-head">
        <b>Card {ci + 1}</b>
        <span className="price">{priceTag(pick.price)}</span>
        <span className="bcard-meta">Ready to play</span>
      </div>
      <div className="letters" aria-hidden="true">
        {LETTERS.map((l, i) => (
          <span key={l} className={`c${i}`}>
            {l}
          </span>
        ))}
      </div>
      <div className="grid">
        {pick.nums.map((n, i) => (
          <div key={i} className={`cell ${n === 0 ? 'free' : ''}`}>
            {n === 0 ? '★' : n}
          </div>
        ))}
      </div>
      <dl className="ladder three">
        {SHORT_PRIZES(pick.price).map((p) => (
          <div key={p.label}>
            <dt>{p.label}</dt>
            <dd>{p.value.toLocaleString('en-US')}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function winParts(s: RoundState) {
  const p: string[] = [];
  if (s.lineWins.length) p.push(`${s.lineWins.length} line${s.lineWins.length === 1 ? '' : 's'}`);
  if (s.multiplier > 1 && s.lineWins.length) p.push(`x${s.multiplier}`);
  if (s.bonusCash) p.push('bonus');
  return p.length ? ' · ' + p.join(' · ') : '';
}

function Shell({ game }: { game: GameDef }) {
  const [s, dispatch] = useReducer(reducer, undefined, () => initialState(loadBalance(game.id)));
  const [help, setHelp] = useState(false);
  const { Field } = game;

  useEffect(() => {
    try {
      localStorage.setItem(`ib-${game.id}-balance`, String(s.balance));
    } catch {}
  }, [s.balance, game.id]);

  useEffect(() => {
    try {
      if (!localStorage.getItem(`ib-${game.id}-help`)) {
        setHelp(true);
        localStorage.setItem(`ib-${game.id}-help`, '1');
      }
    } catch {}
  }, [game.id]);

  const [mute, setMute] = useState(isMuted());
  const lines = s.lineWins.length;
  const prevLines = useRef(0);
  useEffect(() => {
    if (lines > prevLines.current) sfx.line();
    else if (s.justDaubed.length) sfx.daub();
    prevLines.current = lines;
  }, [s.justDaubed, lines]);

  const [picking, setPicking] = useState(false);
  const buyPicks = (picks: CardPick[]) => {
    setPicking(false);
    setDealing(false);
    dispatch({ type: 'buy', picks, tokens: game.makeTokens, calls: game.calls });
  };
  const again = () => buyPicks(newPicks(s.lastPrices));
  const inline = !!game.inlineCards;
  const [deal, setDeal] = useState<CardPick[]>(() => newPicks([20, 30]));
  const [dealing, setDealing] = useState(false);
  // Scratch Bingo style buying (2026-11-10): 1 or 2 cards, quick buy at one price, or the card picker.
  const [maxCards, setMaxCards] = useState<number>(() => {
    try {
      return localStorage.getItem(`ib-${game.id}-max`) === '1' ? 1 : 2;
    } catch {
      return 2;
    }
  });
  const chooseMax = (n: number) => {
    setMaxCards(n);
    sfx.pop();
    try {
      localStorage.setItem(`ib-${game.id}-max`, String(n));
    } catch {}
  };
  const [pickQuick, setPickQuick] = useState<number | null>(null); // null = picker closed, 0 = mixed prices
  // Publish the action bar's height so the page can stop the play area just above it.
  useEffect(() => {
    const bar = document.querySelector('.bar') as HTMLElement | null;
    if (!bar || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty('--bar-h', bar.offsetHeight + 'px'));
    ro.observe(bar);
    return () => ro.disconnect();
  }, []);
  // When a round starts, bring the play area into view above the action bar (phones and tablets).
  useEffect(() => {
    if (s.phase !== 'playing') return;
    const id = window.requestAnimationFrame(() => {
      const f = document.querySelector('.field-panel') as HTMLElement | null;
      if (!f) return;
      const r = f.getBoundingClientRect();
      const bar = (document.querySelector('.bar') as HTMLElement | null)?.offsetHeight ?? 0;
      const room = window.innerHeight - bar;
      if (r.top >= 0 && r.bottom <= room) return;
      window.scrollBy({ top: r.top - 8, behavior: 'smooth' });
    });
    return () => window.cancelAnimationFrame(id);
  }, [s.phase, s.roundId]);

  const showDeal = false;
  const dealPicks = deal;
  const dealCost = dealPicks.reduce((a, p) => a + p.price, 0);
  const startDeal = () => {
    setDealing(false);
    buyPicks(dealPicks);
    setDeal((d) => newPicks(d.map((p) => p.price)));
  };

  const lastCost = s.lastPrices.reduce((a, b) => a + b, 0);
  const opened = s.revealed.filter(Boolean).length + s.lost.filter(Boolean).length;
  const win = totalWin(s);
  const placing = s.phase === 'playing' && s.pendingFree > 0;
  const chips: Chip[] = [
    ...(s.pendingFree > 0 ? [{ label: `${s.pendingFree} free daub${s.pendingFree > 1 ? 's' : ''} to place`, tone: 'gold' as const }] : []),
    ...(game.chips ? game.chips(s) : []),
  ];

  return (
    <div className={`app phase-${s.phase} theme-${game.id}${game.theme ? ` theme-${game.theme}` : ''}`}>
      <header className="top">
        <div className="brand">
          <span className="mark" aria-hidden="true">
            <i className="c0" />
            <i className="c2" />
            <i className="c4" />
          </span>
          <span className="brand-text">
            Bingo Lounge <em>prototype</em>
          </span>
        </div>
        <button
          className="ghost sound"
          aria-label={mute ? 'Turn sound on' : 'Turn sound off'}
          aria-pressed={!mute}
          onClick={() => {
            setMuted(!mute);
            setMute(!mute);
          }}
        >
          {mute ? 'Sound off' : 'Sound on'}
        </button>
        <div className="balance" aria-label="Practice balance">
          <span>Practice</span>
          <b>{fmt(s.balance)}</b>
        </div>
      </header>

      {game.banner && (
        <div className="banner" role="note">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M3 10v4h3l5 4V6L6 10H3z" fill="currentColor" />
            <path d="M15 8.5a4.5 4.5 0 0 1 0 7M17.5 6a8 8 0 0 1 0 12" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          </svg>
          {game.banner}
        </div>
      )}
      <main className="layout">
        <section className="panel card-panel" aria-label="Your card">
          <div className="ticket-row">
            {game.icon}
            <h1 className="title">
              {game.name} <span>Bingo</span>
            </h1>
            <button className="ghost help-btn" onClick={() => setHelp(true)} aria-label="How to play">
              ?
            </button>
          </div>
          <div className="meta">
            <span className="tag">Instant</span>
            <span className="stake">{showDeal ? `${dealPicks.length} card${dealPicks.length > 1 ? 's' : ''} · ${fmt(dealCost)}` : s.phase === 'idle' ? 'Cards from KSh 10' : `Stake ${fmt(s.stake)}`}</span>
            <span className="last">
              {s.lastToken?.n ? <Ball n={s.lastToken.n} size="sm" /> : <span className="ball ball-sm empty">–</span>}
            </span>
          </div>
          {showDeal ? (
            <>
              <div className={`cards n${deal.length}`}>
                {deal.map((p, ci) => (
                  <DealCard key={ci} pick={p} ci={ci} two={deal.length > 1} />
                ))}
              </div>
              <div className="deal-tools">
                <button className="ghost newcards pick" onClick={() => setPicking(true)}>
                  Change cards
                </button>
                <button className="ghost newcards" onClick={() => setDeal((d) => newPicks(d.map((p) => p.price)))}>
                  ↻ New numbers
                </button>
              </div>
            </>
          ) : inline && s.phase === 'idle' ? (
            <div className="cards-empty">
              <div className={`cards n${maxCards}`} aria-hidden="true">
                {Array.from({ length: maxCards }, (_, ci) => (
                  <div key={ci} className={`bcard ${maxCards > 1 ? 'two' : ''} ghost-card`}>
                    <div className="bcard-head">
                      <b>Card {ci + 1}</b>
                    </div>
                    <div className="letters">
                      {LETTERS.map((l, i) => (
                        <span key={l} className={`c${i}`}>
                          {l}
                        </span>
                      ))}
                    </div>
                    <div className="grid">
                      {Array.from({ length: 25 }, (_, i) => (
                        <div key={i} className="cell" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button className="pick-cta" onClick={() => setPickQuick(0)}>
                <b>Pick your cards</b>
                <small>Choose your cards, then play</small>
              </button>
            </div>
          ) : (
          <div className={`cards n${s.cards.length}`}>
            {s.cards.map((c, ci) => (
              <CardView key={`${s.roundId}-${ci}`} c={c} ci={ci} s={s} placing={placing} two={s.cards.length > 1} onPlace={(cell) => dispatch({ type: 'placeFree', card: ci, cell })} />
            ))}
          </div>
          )}
          {placing && <p className="place-hint">Tap any open number on your card to daub it.</p>}
        </section>

        <section className={`panel field-panel field-${game.id}`} aria-label={game.fieldTitle}>
          <div className="field-head">
            <h2>{game.fieldTitle}</h2>
            <span className="count">
              {opened}/{s.tokens.length || game.calls || CALLS_PER_ROUND}
            </span>
          </div>
          {chips.length > 0 && (
            <div className="chips">
              {chips.map((c) => (
                <span key={c.label} className={`chip ${c.tone ? `tone-${c.tone}` : ''}`}>
                  {c.label}
                </span>
              ))}
            </div>
          )}
          <div className="field-wrap">
            <Field
              key={s.roundId}
              state={s}
              reveal={(i) => dispatch({ type: 'reveal', i })}
              lose={(i) => dispatch({ type: 'lose', i })}
              bonus={(amount) => dispatch({ type: 'bonus', amount })}
              revealAll={() => dispatch({ type: 'revealAll' })}
            />
            {s.phase === 'idle' && !inline && (
              <div className="idle">
                <p>{game.pitch}</p>
                <button className="gold big" onClick={() => setPicking(true)}>
                  Pick your cards
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
      <p className="responsible">
        <span className="r18">18+</span> Play responsibly. Balances shown are practice amounts.
      </p>

      <footer className="bar">
        <div className="bar-inner">
          {showDeal && (
            <>
              <div className="sum">
                <span>{dealPicks.length} card{dealPicks.length > 1 ? 's' : ''}</span>
                <b>{fmt(dealCost)}</b>
              </div>
              {s.balance >= dealCost ? (
                <button className="gold start" onClick={startDeal}>
                  <span aria-hidden="true">▶</span> {game.startLabel ?? 'Start Game'}
                </button>
              ) : (
                <button className="gold" onClick={() => dispatch({ type: 'topUp' })}>
                  Reset practice balance
                </button>
              )}
            </>
          )}
          {s.phase === 'idle' && !inline && (
            <>
              <div className="sum">
                <span>Cards</span>
                <b>KSh 10 – 200</b>
              </div>
              {s.balance >= 10 ? (
                <button className="gold" onClick={() => setPicking(true)}>
                  Pick cards
                </button>
              ) : (
                <button className="gold" onClick={() => dispatch({ type: 'topUp' })}>
                  Reset practice balance
                </button>
              )}
            </>
          )}
          {s.phase === 'playing' && (
            <>
              <div className="sum">
                <span>Won so far</span>
                <b>{fmt(win)}</b>
              </div>
              {game.revealAllLabel !== false && (
                <button className="outline" onClick={() => dispatch({ type: 'revealAll' })}>
                  {game.revealAllLabel ?? 'Reveal all'}
                </button>
              )}
            </>
          )}
          {inline && s.phase !== 'playing' && (
            <div className="buy-panel">
              {s.phase === 'done' && (
                <div className={`sum row ${s.credited > 0 ? 'won' : ''}`} role="status">
                  <span>{s.credited > 0 ? `You won${winParts(s)}` : 'No line this time'}</span>
                  <b>{fmt(s.credited)}</b>
                </div>
              )}
              {s.balance >= 10 ? (
                <>
                  <div className="cnt" role="radiogroup" aria-label="Cards per round">
                    {[1, 2].map((n) => (
                      <label key={n} className={maxCards === n ? 'on' : ''}>
                        <input type="radio" name="cnt" checked={maxCards === n} onChange={() => chooseMax(n)} />
                        <i />
                        {n} card{n > 1 ? 's' : ''}
                      </label>
                    ))}
                  </div>
                  <div className="quick">
                    <span>
                      Quick buy
                      <small>
                        {maxCards} card{maxCards > 1 ? 's' : ''}
                      </small>
                    </span>
                    {QUICK_PRICES.map((p) => (
                      <button key={p} disabled={p * maxCards > s.balance} onClick={() => setPickQuick(p)}>
                        <b>{p}</b>
                        <small>KSh {p * maxCards}</small>
                      </button>
                    ))}
                  </div>
                  <button className="gold pick-btn" onClick={() => setPickQuick(0)}>
                    {s.phase === 'done' ? 'Next round · pick cards' : 'Pick your cards'}
                  </button>
                </>
              ) : (
                <button className="gold pick-btn" onClick={() => dispatch({ type: 'topUp' })}>
                  Reset practice balance
                </button>
              )}
            </div>
          )}
          {s.phase === 'done' && !inline && (
            <>
              <div className={`sum ${s.credited > 0 ? 'won' : ''}`} role="status">
                <span>{s.credited > 0 ? `You won${winParts(s)}` : 'No line this time'}</span>
                <b>{fmt(s.credited)}</b>
              </div>
              {s.balance >= 10 ? (
                <div className="again">
                  <button className="ghost change" onClick={() => setPicking(true)} aria-label="Change cards">
                    Change<span className="hide-sm"> cards</span>
                  </button>
                  {s.balance >= lastCost && (
                    <button className="gold" onClick={again}>
                      Play again · {fmt(lastCost)}
                    </button>
                  )}
                </div>
              ) : (
                <button className="gold" onClick={() => dispatch({ type: 'topUp' })}>
                  Reset practice balance
                </button>
              )}
            </>
          )}
        </div>
      </footer>

      {pickQuick !== null && (
        <CardPicker
          gameName={game.name}
          balance={s.balance}
          max={maxCards}
          quick={pickQuick}
          onBuy={(picks) => {
            setPickQuick(null);
            buyPicks(picks);
          }}
          onClose={() => setPickQuick(null)}
        />
      )}
      {picking && (
        <Picker
          balance={s.balance}
          onBuy={(picks) => {
            setDeal(newPicks(picks.map((p) => p.price)));
            buyPicks(picks);
          }}
          onClose={() => setPicking(false)}
        />
      )}

      {help && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="How to play" onClick={() => setHelp(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h2>
              How to play {game.name} Bingo
            </h2>
            <ol>
              {game.rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
              <li>{inline ? 'Choose 1 or 2 cards, then tap Pick your cards to swipe through cards priced KSh 10 to KSh 100, or use Quick buy to get cards at one price. A dearer card pays bigger prizes.' : 'Pick up to four cards before each round. Cards cost KSh 10 to KSh 200, and a dearer card pays bigger prizes.'}</li>
              <li>
                On each card, the first line pays {LADDER[0]}x the card price, then {LADDER.slice(1).join('x, ')}x for each further line. A full card pays 500x the card price.
              </li>
              <li>Balances here are practice amounts.</li>
            </ol>
            <button className="gold" onClick={() => setHelp(false)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function mount(game: GameDef) {
  document.title = `${game.name} Bingo`;
  createRoot(document.getElementById('root')!).render(<Shell game={game} />);
}
