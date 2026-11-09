import { useRef, type CSSProperties } from 'react'
import { LC, SPOTS, colOf } from '../game/constants'
import { game } from '../game/store'
import { useGame } from '../hooks/useGame'
import { BLANK, BingoCard, LETTERS } from './BingoCard'
import { Foil } from './Foil'
import { Result } from './Result'

/** The scratch ticket: 30 silver spots on the left, the player's card(s) on the right. */
export function Ticket() {
  const g = useGame()
  const grid = useRef<HTMLDivElement>(null)
  const t = g.ticket
  const rev = g.revealed
  const cards = t?.cards ?? [BLANK]
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
            Scratch the calls{' '}
            <b>
              {opened}/{SPOTS}
            </b>
          </div>
          <div className="spots" ref={grid}>
            {Array.from({ length: SPOTS }, (_, i) => {
              const n = t?.spots[i]
              const mine = n !== undefined && t!.cards.some(c => c.includes(n))
              return n === 0 ? (
                <div key={i} className={'spot bonus' + (t?.open[i] ? ' open' : '') + (g.pop === i ? ' pop' : '')}>
                  <small>BONUS</small>
                  <b>★</b>
                </div>
              ) : (
                <div
                  key={i}
                  className={'spot' + (t?.open[i] ? ' open' : '') + (mine && t?.open[i] ? ' mine' : '') + (g.pop === i ? ' pop' : '')}
                  style={n ? ({ '--lc': LC[colOf(n)] } as CSSProperties) : undefined}
                >
                  {n !== undefined && (
                    <>
                      <small>{LETTERS[colOf(n)]}</small>
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
          {cards.map((card, k) => (
            <BingoCard
              key={k}
              card={card}
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
