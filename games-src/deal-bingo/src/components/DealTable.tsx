import { useEffect, useRef } from 'react'
import { game, BATCHES } from '../game/store'
import type { Batch, Item } from '../game/draw'
import { LC, PER } from '../game/constants'
import { useGame } from '../hooks/useGame'

/** Each letter's suit mark on the cards. */
const PIPS = ['◆', '♥', '★', '♠', '♣']
/** ms a card takes from the shoe to its spot, and between cards */
const DEAL_MS = 620
const GAP_MS = 380
const FLIP_MS = 420

/** The face of a playing card: corners with its letter and number, a big pip in the middle. */
function Face({ it }: { it: Item }) {
  const l = 'BINGO'[it.col]
  const label = it.rank ?? String(it.n)
  return (
    <div className={'pfront' + (it.rank ? ' court' : '')} style={{ '--lc': LC[it.col] } as React.CSSProperties}>
      <span className="pc tl">
        {label}
        <i>{l}</i>
      </span>
      <b className="pmid">{it.rank ? <>{it.rank}<small>WILD {l}</small></> : <>{PIPS[it.col]}<small>{l}</small></>}</b>
      <span className="pc br">
        {label}
        <i>{l}</i>
      </span>
    </div>
  )
}

/**
 * The card table: a shoe on the right deals PER cards face down onto the felt; each flips over to
 * show its number in its letter's suit. J, Q and K are wild.
 */
export function DealTable() {
  const g = useGame()
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    game.fx = {
      animate(batch: Batch, done: () => void) {
        const h = host.current
        if (!h) return done()
        // the new cards render on this update: start once they are on the page
        requestAnimationFrame(() => requestAnimationFrame(() => deal(h, batch, done)))
      },
    }
    function deal(h: HTMLDivElement, batch: Batch, done: () => void) {
        const spots = [...h.querySelectorAll<HTMLElement>('.spot')]
        const shoe = h.querySelector<HTMLElement>('.shoe')!.getBoundingClientRect()
        let flipped = 0
        batch.items.forEach((it, i) => {
          const card = spots[i]?.querySelector<HTMLElement>('.pcard')
          if (!card) {
            if (++flipped === batch.items.length) done()
            return
          }
          const sr = spots[i].getBoundingClientRect()
          const dx = shoe.left + shoe.width / 2 - (sr.left + sr.width / 2)
          const dy = shoe.top + shoe.height / 2 - (sr.top + sr.height / 2)
          card.classList.remove('up')
          const a = card.animate(
            [
              { transform: `translate(${dx}px,${dy}px) rotate(-28deg) scale(.6)`, opacity: 0 },
              { opacity: 1, offset: 0.15 },
              { transform: `translate(0,0) rotate(${(i - 1) * 4}deg) scale(1)`, opacity: 1 },
            ],
            { duration: DEAL_MS, delay: i * GAP_MS, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'both' },
          )
          a.onfinish = () => {
            card.classList.add('up')
            setTimeout(() => {
              game.landSound(i, it.n)
              if (++flipped === batch.items.length) setTimeout(done, 250)
            }, FLIP_MS)
          }
        })
    }
    return () => {
      game.fx = null
    }
  }, [])

  const items = g.batch?.items ?? []
  return (
    <div className="gobj dealt" ref={host}>
      <div className="felt">
        <div className="arc">
          DEALER CALLS · J Q K WILD
        </div>
        <div className="shoe" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className="spots">
          {Array.from({ length: PER }, (_, i) => (
            <div key={i} className="spot">
              {items[i] && (
                // keyed by hand, so a card stays put (face up) after its hand is counted
                <div className={'pcard' + (g.drawing ? '' : ' up')} key={g.spin + (g.drawing ? 1 : 0) + ':' + i}>
                  <div className="pback" />
                  <Face it={items[i]} />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="suits">
          {[0, 1, 2, 3, 4].map(c => (
            <span key={c} style={{ color: LC[c] }}>
              {PIPS[c]} {'BINGO'[c]}
            </span>
          ))}
        </div>
        <div className="hand">{g.phase === 'buy' ? `${BATCHES} hands this round` : `Hand ${Math.min(g.spin + (g.drawing ? 1 : 0), BATCHES)} of ${BATCHES}`}</div>
      </div>
    </div>
  )
}
