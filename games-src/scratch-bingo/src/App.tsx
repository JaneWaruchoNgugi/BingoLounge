import { useEffect, useRef, useState } from 'react'
import { Eye, Shuffle, Check, Settings as Gear, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { game, useGame, SPOTS, LC, LINE_PAY, MATCH_PAY, MATCH_FROM, MATCH_STEP, QUICK_PRICES, BIG_WIN, colOf, score, nearLines, type Ticket as T } from './game'
import { Foil } from './Foil'
import { SFX } from './audio/sfx'

const L = 'BINGO'
/** match rows listed one by one in the prize table */
const SHOWN = 5
const blank = Array.from({ length: 25 }, (_, i) => (i === 12 ? 0 : -1))

/** One bingo card on the ticket, daubed with the spots opened so far. */
function Card({ card, rev, k, many, win, star, cand, live }: { card: number[]; rev: Set<number>; k: number; many: boolean; win?: number; star?: number; cand?: boolean; live?: boolean }) {
  const real = card[0] !== -1
  const sc = real ? score(card, rev) : null
  const lineCells = new Set(sc?.lines.flat() ?? [])
  // lines one number short glow while the ticket is being scratched, and the missing cell gets a ring
  const near = real && live ? nearLines(card, rev) : null
  return (
    <div className={'bcard' + (win ? ' won' : '') + (real ? '' : ' blank')}>
      <div className="lbl">
        {many ? `Card ${k + 1}` : 'Your card'}
        <b>{sc ? `${sc.matches} matched · ${sc.lines.length} line${sc.lines.length === 1 ? '' : 's'}` : ''}</b>
      </div>
      <div className="chead">
        {[...L].map((l, c) => (
          <span key={c} style={{ background: LC[c] }}>
            {l}
          </span>
        ))}
      </div>
      <div className="cgrid">
        {card.map((n, i) => {
            const hit = n > 0 && rev.has(n)
            const pickable = cand && n > 0 && !hit
            const cls =
              'cell' +
              (n === 0 ? ' free' : hit ? ' hit' : '') +
              (lineCells.has(i) ? ' line' : near?.cells.has(i) ? ' near' : '') +
              (near?.missing.has(i) ? ' miss' : '') +
              (star === i ? ' starred' : '') +
              (pickable ? ' cand' : '')
            return pickable ? (
              <button key={i} className={cls} style={{ '--lc': LC[i % 5] } as React.CSSProperties} onClick={() => game.placeStar(k, i)} aria-label={`Put the star on ${n}`}>
                {n}
              </button>
            ) : (
              <div key={i} className={cls} style={{ '--lc': LC[i % 5] } as React.CSSProperties}>
                {n === 0 ? '★' : n > 0 ? n : ''}
                {star === i && <i className="stari">★</i>}
              </div>
            )
        })}
      </div>
      {win !== undefined && <div className={'cwin' + (win ? ' on' : '')}>{win ? `WINS KES ${win}` : 'No win'}</div>}
    </div>
  )
}

/** What the finished ticket paid, and why. */
function resultText(t: T) {
  const parts = t.cards.map((c, i) => {
    const sc = score(c, game.marks(i))
    const why = sc.lx >= sc.mx && sc.lx ? `${sc.lines.length} line${sc.lines.length > 1 ? 's' : ''} · KES ${Math.round(sc.lx * t.stakes[i])}` : sc.mx ? `${sc.matches} matched · KES ${Math.round(sc.mx * t.stakes[i])}` : 'no win'
    return t.cards.length > 1 ? `Card ${i + 1}: ${why}` : why
  })
  return parts.join(' · ')
}

/** counts from 0 up to `to`, with a coin tick as it goes */
function useRoll(to: number, key: number, ms = 1200) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!to) return setV(0)
    let raf = 0
    let ticks = 0
    const t0 = performance.now()
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / ms)
      const e = 1 - Math.pow(1 - p, 3)
      setV(Math.round(to * e))
      const k = Math.floor(p * 12)
      if (k > ticks && p < 1) {
        ticks = k
        SFX.coin()
      }
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [to, key, ms])
  return v
}

/** a burst of coins flying out of the win banner */
function Coins({ n = 12 }: { n?: number }) {
  const [c] = useState(() =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.5
      const d = 60 + Math.random() * 70
      return { dx: Math.cos(a) * d, dy: Math.sin(a) * d * 0.6 - 30, r: Math.random() * 360, dl: Math.random() * 0.15 }
    }),
  )
  return (
    <span className="coins" aria-hidden="true">
      {c.map((p, i) => (
        <i key={i} style={{ '--dx': p.dx + 'px', '--dy': p.dy + 'px', '--r': p.r + 'deg', animationDelay: p.dl + 's' } as React.CSSProperties} />
      ))}
    </span>
  )
}

/** how long the result banner stays before it fades away (ms) */
const RESULT_MS = 4000

function Result({ t, cls }: { t: T; cls: string }) {
  const v = useRoll(t.win, t.id)
  // the banner fades out after a few seconds; the ticket history keeps the result
  const [gone, setGone] = useState(0)
  useEffect(() => {
    const a = setTimeout(() => setGone(1), RESULT_MS)
    const b = setTimeout(() => setGone(2), RESULT_MS + 450)
    return () => {
      clearTimeout(a)
      clearTimeout(b)
    }
  }, [t.id])
  if (gone === 2) return null
  return (
    <div className={cls + (t.win ? ' win' : '') + (gone ? ' fade' : '')} key={t.id}>
      {t.win > 0 && <Coins />}
      <b>{t.win ? `YOU WIN KES ${v.toLocaleString()}` : 'NO WIN THIS TIME'}</b>
      <small>{resultText(t)}</small>
    </div>
  )
}

function Ticket() {
  const g = useGame()
  const grid = useRef<HTMLDivElement>(null)
  const t = g.ticket
  const rev = g.revealed
  const cards = t?.cards ?? [blank]
  const opened = t ? t.open.filter(Boolean).length : 0
  return (
    <div className={'ticket' + (t ? '' : ' preview') + (t?.done ? ' done' : '') + (cards.length > 1 ? ' two' : '')}>
      <div className="tk-head">
        <span className="tk-logo">
          <em>INSTANT</em>SCRATCH BINGO
        </span>
        <span className="tk-price">{t ? `KES ${t.stakes.reduce((a, b) => a + b, 0)} TICKET` : 'NO TICKET'}</span>
      </div>
      {g.starWaiting && (
        <div className="starbar" role="status">
          <b>★ BONUS STAR</b>
          <small>Tap any number on your card{cards.length > 1 ? 's' : ''} to mark it</small>
        </div>
      )}
      <div className="tk-body">
        <div className="tk-spots">
          <div className="lbl">
            Scratch the calls <b>{opened}/{SPOTS}</b>
          </div>
          <div className="spots" ref={grid}>
            {Array.from({ length: SPOTS }, (_, i) => {
              const n = t?.spots[i]
              const mine = n !== undefined && t!.cards.some(c => c.includes(n))
              if (n === 0)
                return (
                  <div key={i} className={'spot bonus' + (t?.open[i] ? ' open' : '') + (g.pop === i ? ' pop' : '')}>
                    <small>BONUS</small>
                    <b>★</b>
                  </div>
                )
              return (
                <div key={i} className={'spot' + (t?.open[i] ? ' open' : '') + (mine && t?.open[i] ? ' mine' : '') + (g.pop === i ? ' pop' : '')} style={n ? ({ '--lc': LC[colOf(n)] } as React.CSSProperties) : undefined}>
                  {n !== undefined && (
                    <>
                      <small>{L[colOf(n)]}</small>
                      <b>{n}</b>
                    </>
                  )}
                </div>
              )
            })}
            <Foil grid={grid} />
          </div>
        </div>
        <div className="tk-cards">
          {cards.map((c, k) => (
            <Card
              key={k}
              card={c}
              rev={t ? g.marks(k) : rev}
              k={k}
              many={cards.length > 1}
              win={t?.done && cards.length > 1 ? t.wins[k] : undefined}
              star={t?.starAt?.k === k ? t.starAt.i : undefined}
              cand={g.starWaiting}
              live={!!t && !t.done}
            />
          ))}
          {!t && (
            <button className="pickme" onClick={() => game.openPicker()}>
              <b>Pick your cards</b>
              <small>Choose your card{g.maxCards > 1 ? 's' : ''}, then scratch</small>
            </button>
          )}
        </div>
      </div>
      {t?.done && <Result key={t.id} t={t} cls="tk-result" />}
    </div>
  )
}

/** The card picker overlay: swipe through cards, take up to two, approve and buy. */
function Picker() {
  const g = useGame()
  const sx = useRef<number | null>(null)
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') game.go(-1)
      if (e.key === 'ArrowRight') game.go(1)
      if (e.key === 'Escape') game.closePicker()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])
  const n = g.pool.length
  const taken = g.picked.includes(g.idx)
  const MAX = g.maxCards
  const full = g.picked.length >= MAX
  return (
    <div className={'pk' + (full ? ' full' : '')} role="dialog" aria-modal="true" aria-label="Pick your cards">
      <div className="pk-top">
        <div className="pk-badge" key={'b' + g.limitKey}>
          {g.picked.length}/{MAX}
        </div>
        <div className="pk-title">
          <b>{g.quick ? `QUICK BUY · ${MAX} × KES ${g.quick}` : full ? (MAX > 1 ? 'LIMIT REACHED' : 'CARD CHOSEN') : MAX > 1 ? 'PICK YOUR CARDS' : 'PICK YOUR CARD'}</b>
          <small>{g.quick ? `${MAX > 1 ? 'Your cards are' : 'Your card is'} ready · approve to buy, or swap first` : full ? MAX > 1 ? `You have ${MAX} cards · approve to buy, or tap a taken card to swap it` : 'Approve to buy, or tap another card to switch to it' : MAX > 1 ? `Swipe to look · tap to take up to ${MAX} · approve to buy` : 'Swipe to look · tap to take 1 · approve to buy'}</small>
        </div>
        <button className="pk-x" onClick={() => game.closePicker()} aria-label="Close">
          <X />
        </button>
      </div>
      <div
        className="pk-track"
        onPointerDown={e => (sx.current = e.clientX)}
        onPointerUp={e => {
          if (sx.current === null) return
          const dx = e.clientX - sx.current
          sx.current = null
          if (Math.abs(dx) > 40) game.go(dx < 0 ? 1 : -1)
        }}
      >
        {g.pool.map((c, i) => {
          let off = i - g.idx
          if (off > n / 2) off -= n
          if (off < -n / 2) off += n
          const on = g.picked.includes(i)
          const pr = g.prices[i]
          const prize = (x: number) => `KES ${Math.round(x * pr)}`
          return (
            <div
              key={i}
              className={'pk-card t' + pr + (off === 0 ? ' front' : '') + (on ? ' taken' : full && MAX > 1 ? ' locked' : '') + (Math.abs(off) > 1 ? ' far' : '')}
              style={{ '--o': off, '--a': Math.abs(off), '--hue': (i * 57) % 360 } as React.CSSProperties}
              aria-hidden={off !== 0}
              onClick={() => (off === 0 ? game.pick(i) : game.focus(i))}
            >
              <div className="pk-band">
                <span>SCRATCH BINGO</span>
                <b>No. {String(i + 1).padStart(2, '0')}</b>
              </div>
              <div className="pk-rosette">
                <small>KES</small>
                <b>{pr}</b>
              </div>
              <div className="pk-letters">
                {[...L].map((l, k) => (
                  <span key={k} style={{ background: LC[k] }}>
                    {l}
                  </span>
                ))}
              </div>
              <div className="pk-grid">
                {c.map((v, k) => (
                  <span key={k} className={v ? '' : 'free'}>
                    {v || '★'}
                  </span>
                ))}
              </div>
              <div className="pk-prz">
                {LINE_PAY.map(([k, x], j) => (
                  <span key={k}>
                    <small>
                      {k}
                      {j === LINE_PAY.length - 1 ? '+' : ''} line{k > 1 ? 's' : ''}
                    </small>
                    <b>{prize(x)}</b>
                  </span>
                ))}
                <span>
                  <small>{MATCH_FROM} match</small>
                  <b>{prize(MATCH_PAY[0][1])}</b>
                </span>
              </div>
              {on && (
                <div className="pk-inkstamp" key={'s' + i}>
                  TAKEN <small>#{g.picked.indexOf(i) + 1}</small>
                </div>
              )}
              {!on && full && MAX > 1 && off === 0 && (
                <div className="pk-lock" key={'l' + g.limitKey}>
                  <b>LIMIT REACHED</b>
                  <small>Put a card back to take this one</small>
                </div>
              )}
            </div>
          )
        })}
        <button className="pk-arrow l" onClick={() => game.go(-1)} aria-label="Previous card">
          <ChevronLeft />
        </button>
        <button className="pk-arrow r" onClick={() => game.go(1)} aria-label="Next card">
          <ChevronRight />
        </button>
      </div>
      <div className="pk-slots" aria-label="Cards taken">
        {Array.from({ length: MAX }, (_, k) => {
          const i = g.picked[k]
          return (
            <button key={k} className={'pk-slot' + (i !== undefined ? ' on' : '')} disabled={i === undefined} onClick={() => i !== undefined && game.focus(i)}>
              {i !== undefined ? (
                <>
                  <Check /> No. {String(i + 1).padStart(2, '0')} · <b>KES {g.prices[i]}</b>
                </>
              ) : (
                `Ticket slot ${k + 1}`
              )}
            </button>
          )
        })}
      </div>
      <div className="pk-dots">
        {g.pool.map((_, i) => (
          <i key={i} className={(i === g.idx ? 'on' : '') + (g.picked.includes(i) ? ' t' : '')} />
        ))}
      </div>
      <button className={'pk-take' + (taken ? ' on' : full && MAX > 1 ? ' max' : '')} onClick={() => game.pick(g.idx)}>
        <Check /> {taken ? 'Taken · tap to put back' : full ? (MAX > 1 ? `Limit of ${MAX} reached` : 'Switch to this card') : 'Take this card'}
      </button>
      <div className="pk-bottom">
        <button className="pk-new" onClick={() => game.newPool()}>
          <Shuffle /> New cards
        </button>
        <button className={'btn buy' + (full ? ' ready' : '')} disabled={!g.canBuy} onClick={() => game.buy()}>
          {g.picked.length ? `Approve ${g.picked.length} card${g.picked.length > 1 ? 's' : ''} · KES ${g.price}` : 'Take a card to buy'}
        </button>
      </div>
    </div>
  )
}

function Prizes() {
  const g = useGame()
  const t = g.ticket
  // highlight the best tier any card has reached
  const scs = t ? t.cards.map(c => score(c, g.revealed)) : []
  const lines = Math.max(0, ...scs.map(s => s.lines.length))
  const matches = Math.max(0, ...scs.map(s => s.matches))
  const tier = (table: [number, number][], v: number) => [...table].reverse().find(([k]) => v >= k)?.[0]
  const lt = t && tier(LINE_PAY, lines)
  const mt = t && tier(MATCH_PAY, matches)
  const x = (v: number) => `×${+v.toFixed(2)}`
  return (
    <div className="prizes">
      <div>
        <small>Lines</small>
        {LINE_PAY.map(([k, v], i) => (
          <span key={k} className={lt === k ? 'on' : ''}>
            {k}
            {i === LINE_PAY.length - 1 ? '+' : ''} line{k > 1 ? 's' : ''} <b>{x(v)}</b>
          </span>
        ))}
      </div>
      <div>
        <small>Numbers matched</small>
        {MATCH_PAY.slice(0, SHOWN).map(([k, v]) => (
          <span key={k} className={mt === k ? 'on' : ''}>
            {k} <b>{x(v)}</b>
          </span>
        ))}
        <span className={mt !== undefined && mt !== null && mt >= MATCH_FROM + SHOWN ? 'on' : ''}>
          {MATCH_FROM + SHOWN}+ <b>{x(MATCH_PAY[SHOWN][1])}, +{+MATCH_STEP.toFixed(2)} each</b>
        </span>
      </div>
      <p>Prizes are × the card's price. Each card pays its best prize.</p>
    </div>
  )
}

/** The gear in the top bar: a small panel with the music and sound switches. */
function Settings() {
  const g = useGame()
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !box.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])
  const row = (label: string, sub: string, on: boolean, flip: () => void) => (
    <button className="srow" role="switch" aria-checked={on} onClick={flip}>
      <span>
        <b>{label}</b>
        <small>{sub}</small>
      </span>
      <i className={'sw' + (on ? ' on' : '')} />
    </button>
  )
  return (
    <div className="settings" ref={box}>
      <button className={'snd' + (open ? ' open' : '')} onClick={() => setOpen(o => !o)} aria-label="Settings" aria-expanded={open}>
        <Gear />
      </button>
      {open && (
        <div className="spanel" role="dialog" aria-label="Settings">
          <div className="shead">
            <b>Settings</b>
            <button className="sx" onClick={() => setOpen(false)} aria-label="Close settings">
              <X />
            </button>
          </div>
          {row('Music', 'Background tune', g.music, () => game.toggleMusic())}
          {row('Sound effects', 'Scratching, hits and wins', g.sound, () => game.toggleSound())}
        </div>
      )}
    </div>
  )
}


/** a big win takes over the screen: confetti, a rolling total, and a tap to carry on */
function BigWin({ t }: { t: T }) {
  const [open, setOpen] = useState(true)
  const v = useRoll(t.win, t.id, 2200)
  const x = Math.round(t.win / t.stakes.reduce((a, b) => a + b, 0))
  useEffect(() => {
    const id = setTimeout(() => setOpen(false), 5200)
    return () => clearTimeout(id)
  }, [])
  const [bits] = useState(() =>
    Array.from({ length: 60 }, () => ({ x: Math.random() * 100, d: Math.random() * 1.2, s: 2.2 + Math.random() * 1.8, c: LC[Math.floor(Math.random() * 5)], r: Math.random() * 720 - 360 })),
  )
  if (!open) return null
  return (
    <div className="bigwin" role="dialog" aria-label="Big win" onClick={() => setOpen(false)}>
      <div className="confetti" aria-hidden="true">
        {bits.map((b, i) => (
          <i key={i} style={{ left: b.x + '%', background: b.c, animationDelay: b.d + 's', animationDuration: b.s + 's', '--r': b.r + 'deg' } as React.CSSProperties} />
        ))}
      </div>
      <div className="bw-box">
        <small>{x >= 100 ? 'MEGA WIN' : x >= 30 ? 'SUPER WIN' : 'BIG WIN'}</small>
        <b>KES {v.toLocaleString()}</b>
        <span>{x}× your ticket</span>
        <Coins n={18} />
        <em>Tap to continue</em>
      </div>
    </div>
  )
}

export default function App() {
  const g = useGame()
  const live = !!g.ticket && !g.ticket.done
  return (
    <div className="app">
      <header>
        <div className="logo" aria-label="Scratch Bingo">
          <span>SCRATCH</span>
          <span>BINGO</span>
        </div>
        <div className="hright">
          <Settings />
          <div className="bal">
            <small>Balance</small>
            <b>KES {g.pts.toLocaleString()}</b>
          </div>
        </div>
      </header>
      <main>
        <section className="play">
          <Ticket />
          <div className="actions">
            {g.ticket?.done && <Result key={g.ticket.id} t={g.ticket} cls="mres" />}
            {live ? (
              <button className="btn ghost" onClick={() => game.revealAll()}>
                <Eye /> Reveal all
              </button>
            ) : (
              <>
                <div className="cnt" role="radiogroup" aria-label="Cards per ticket">
                  {[1, 2].map(n => (
                    <label key={n} className={g.maxCards === n ? 'on' : ''}>
                      <input type="radio" name="cnt" checked={g.maxCards === n} onChange={() => game.setMax(n)} />
                      <i />
                      {n} card{n > 1 ? 's' : ''}
                    </label>
                  ))}
                </div>
                <div className="quick">
                  <span>
                    Quick buy
                    <small>
                      {g.maxCards} card{g.maxCards > 1 ? 's' : ''}
                    </small>
                  </span>
                  {QUICK_PRICES.map(v => (
                    <button key={v} disabled={v * g.maxCards > g.pts} onClick={() => game.openQuick(v)}>
                      <b>{v}</b>
                      <small>KES {v * g.maxCards}</small>
                    </button>
                  ))}
                </div>
                <button className="btn buy" onClick={() => game.openPicker()}>
                  {g.ticket ? 'Next ticket · pick cards' : 'Pick your cards'}
                </button>
              </>
            )}
          </div>
        </section>
        <aside>
          <Prizes />
          <div className="hist">
            <small>Last tickets</small>
            <div>{g.history.length ? g.history.map(h => <span key={h.id} className={h.win ? 'w' : 'l'}>{h.txt}</span>) : <i>No tickets yet</i>}</div>
          </div>
        </aside>
      </main>
      {g.pickOpen && <Picker />}
      {g.ticket?.done && g.ticket.win >= BIG_WIN * g.ticket.stakes.reduce((a, b) => a + b, 0) && <BigWin t={g.ticket} key={g.ticket.id} />}
    </div>
  )
}
