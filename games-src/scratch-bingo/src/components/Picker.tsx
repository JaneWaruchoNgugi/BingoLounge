import { useEffect, useRef, type CSSProperties } from 'react'
import { Check, ChevronLeft, ChevronRight, Shuffle, X } from 'lucide-react'
import { LC, LINE_PAYS, MATCH_MIN, MATCH_PAYS } from '../game/constants'
import { game } from '../game/store'
import { useGame } from '../hooks/useGame'
import { LETTERS } from './BingoCard'

const no = (i: number) => String(i + 1).padStart(2, '0')

/** The card picker: a carousel of cards to swipe through, take up to the limit, and approve. */
export function Picker() {
  const g = useGame()
  const downX = useRef<number | null>(null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') game.go(-1)
      if (e.key === 'ArrowRight') game.go(1)
      if (e.key === 'Escape') game.closePicker()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const n = g.pool.length
  const taken = g.picked.includes(g.idx)
  const max = g.maxCards
  const full = g.picked.length >= max
  return (
    <div className={'pk' + (full ? ' full' : '')} role="dialog" aria-modal="true" aria-label="Pick your cards">
      <div className="pk-top">
        <div key={'b' + g.limitKey} className="pk-badge">
          {g.picked.length}/{max}
        </div>
        <div className="pk-title">
          <b>
            {g.quick
              ? `QUICK BUY · ${max} × KES ${g.quick}`
              : full
                ? max > 1
                  ? 'LIMIT REACHED'
                  : 'CARD CHOSEN'
                : max > 1
                  ? 'PICK YOUR CARDS'
                  : 'PICK YOUR CARD'}
          </b>
          <small>
            {g.quick
              ? `${max > 1 ? 'Your cards are' : 'Your card is'} ready · approve to buy, or swap first`
              : full
                ? max > 1
                  ? `You have ${max} cards · approve to buy, or tap a taken card to swap it`
                  : 'Approve to buy, or tap another card to switch to it'
                : max > 1
                  ? `Swipe to look · tap to take up to ${max} · approve to buy`
                  : 'Swipe to look · tap to take 1 · approve to buy'}
          </small>
        </div>
        <button className="pk-x" onClick={() => game.closePicker()} aria-label="Close">
          <X />
        </button>
      </div>
      <div
        className="pk-track"
        onPointerDown={e => (downX.current = e.clientX)}
        onPointerUp={e => {
          if (downX.current === null) return
          const dx = e.clientX - downX.current
          downX.current = null
          if (Math.abs(dx) > 40) game.go(dx < 0 ? 1 : -1)
        }}
      >
        {g.pool.map((card, i) => {
          // offset from the front card, wrapped so the carousel loops
          let o = i - g.idx
          if (o > n / 2) o -= n
          if (o < -n / 2) o += n
          const isTaken = g.picked.includes(i)
          const price = g.prices[i]
          const kes = (x: number) => `KES ${Math.round(x * price)}`
          return (
            <div
              key={i}
              className={
                'pk-card t' +
                price +
                (o === 0 ? ' front' : '') +
                (isTaken ? ' taken' : full && max > 1 ? ' locked' : '') +
                (Math.abs(o) > 1 ? ' far' : '')
              }
              style={{ '--o': o, '--a': Math.abs(o), '--hue': (i * 57) % 360 } as CSSProperties}
              aria-hidden={o !== 0}
              onClick={() => (o === 0 ? game.pick(i) : game.focus(i))}
            >
              <div className="pk-band">
                <span>SCRATCH BINGO</span>
                <b>No. {no(i)}</b>
              </div>
              <div className="pk-rosette">
                <small>KES</small>
                <b>{price}</b>
              </div>
              <div className="pk-letters">
                {[...LETTERS].map((l, j) => (
                  <span key={j} style={{ background: LC[j] }}>
                    {l}
                  </span>
                ))}
              </div>
              <div className="pk-grid">
                {card.map((v, j) => (
                  <span key={j} className={v ? '' : 'free'}>
                    {v || '★'}
                  </span>
                ))}
              </div>
              <div className="pk-prz">
                {LINE_PAYS.map(([lines, x], j) => (
                  <span key={lines}>
                    <small>
                      {lines}
                      {j === LINE_PAYS.length - 1 ? '+' : ''} line{lines > 1 ? 's' : ''}
                    </small>
                    <b>{kes(x)}</b>
                  </span>
                ))}
                <span>
                  <small>{MATCH_MIN} match</small>
                  <b>{kes(MATCH_PAYS[0][1])}</b>
                </span>
              </div>
              {isTaken && (
                <div key={'s' + i} className="pk-inkstamp">
                  TAKEN <small>#{g.picked.indexOf(i) + 1}</small>
                </div>
              )}
              {!isTaken && full && max > 1 && o === 0 && (
                <div key={'l' + g.limitKey} className="pk-lock">
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
        {Array.from({ length: max }, (_, s) => {
          const i = g.picked[s]
          return (
            <button key={s} className={'pk-slot' + (i !== undefined ? ' on' : '')} disabled={i === undefined} onClick={() => i !== undefined && game.focus(i)}>
              {i !== undefined ? (
                <>
                  <Check /> No. {no(i)} · <b>KES {g.prices[i]}</b>
                </>
              ) : (
                `Ticket slot ${s + 1}`
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
      <button className={'pk-take' + (taken ? ' on' : full && max > 1 ? ' max' : '')} onClick={() => game.pick(g.idx)}>
        <Check /> {taken ? 'Taken · tap to put back' : full ? (max > 1 ? `Limit of ${max} reached` : 'Switch to this card') : 'Take this card'}
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
