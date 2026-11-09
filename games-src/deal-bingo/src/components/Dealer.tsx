import { useEffect, useRef } from 'react'
import { LC, PER as PER_HAND } from '../game/constants'
import { HANDS } from '../game/deal'
import type { DealCard, Hand } from '../game/deal'
import { game } from '../game/store'
import { useGame } from '../hooks/useGame'

/** Suit for each letter column: B ◆, I ♥, N ★, G ♠, O ♣. */
const SUITS = ['◆', '♥', '★', '♠', '♣']
/** ms each card takes to fly from the shoe to its spot */
const FLY_MS = 620
/** ms between the cards of a hand leaving the shoe */
const STAGGER_MS = 380
/** ms from a card landing to it turning face up */
const FLIP_MS = 420

/** Face of a dealt card: number (or J/Q/K) in the corners, suit and letter in the middle. */
function CardFace({ it }: { it: DealCard }) {
  const letter = 'BINGO'[it.col]
  const corner = it.rank ?? String(it.n)
  return (
    <div className={'pfront' + (it.rank ? ' court' : '')} style={{ '--lc': LC[it.col] } as React.CSSProperties}>
      <span className="pc tl">
        {corner}
        <i>{letter}</i>
      </span>
      <b className="pmid">
        {it.rank ? (
          <>
            {it.rank}
            <small>WILD {letter}</small>
          </>
        ) : (
          <>
            {SUITS[it.col]}
            <small>{letter}</small>
          </>
        )}
      </b>
      <span className="pc br">
        {corner}
        <i>{letter}</i>
      </span>
    </div>
  )
}

/**
 * The dealer's felt table: each hand's three cards fly out of the shoe to their spots, then turn
 * face up one after another. The game waits for the last card before it marks the numbers.
 */
export function Dealer() {
  const g = useGame()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    game.fx = {
      animate(hand, done) {
        const el = ref.current
        if (!el) return done()
        // two frames, so the new hand's cards are in the DOM and laid out before they fly
        requestAnimationFrame(() => requestAnimationFrame(() => deal(el, hand, done)))
      },
    }
    function deal(el: HTMLDivElement, hand: Hand, done: () => void) {
      const spots = [...el.querySelectorAll<HTMLElement>('.spot')]
      const shoe = el.querySelector('.shoe')!.getBoundingClientRect()
      let landed = 0
      hand.items.forEach((it, i) => {
        const card = spots[i]?.querySelector<HTMLElement>('.pcard')
        if (!card) {
          if (++landed === hand.items.length) done()
          return
        }
        const r = spots[i].getBoundingClientRect()
        const dx = shoe.left + shoe.width / 2 - (r.left + r.width / 2)
        const dy = shoe.top + shoe.height / 2 - (r.top + r.height / 2)
        card.classList.remove('up')
        const a = card.animate(
          [
            { transform: `translate(${dx}px,${dy}px) rotate(-28deg) scale(.6)`, opacity: 0 },
            { opacity: 1, offset: 0.15 },
            { transform: `translate(0,0) rotate(${(i - 1) * 4}deg) scale(1)`, opacity: 1 },
          ],
          { duration: FLY_MS, delay: i * STAGGER_MS, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'both' },
        )
        a.onfinish = () => {
          card.classList.add('up')
          setTimeout(() => {
            game.landSound(i, it.n)
            if (++landed === hand.items.length) setTimeout(done, 250)
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
    <div className="gobj dealt" ref={ref}>
      <div className="felt">
        <div className="arc">DEALER CALLS · J Q K WILD</div>
        <div className="shoe" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className="spots">
          {Array.from({ length: PER_HAND }, (_, i) => (
            <div key={i} className="spot">
              {items[i] && (
                <div key={g.spin + (g.drawing ? 1 : 0) + ':' + i} className={'pcard' + (g.drawing ? '' : ' up')}>
                  <div className="pback" />
                  <CardFace it={items[i]} />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="suits">
          {[0, 1, 2, 3, 4].map(c => (
            <span key={c} style={{ color: LC[c] }}>
              {SUITS[c]} {'BINGO'[c]}
            </span>
          ))}
        </div>
        <div className="hand">
          {g.phase === 'buy' ? `${HANDS} hands this round` : `Hand ${Math.min(g.spin + (g.drawing ? 1 : 0), HANDS)} of ${HANDS}`}
        </div>
      </div>
    </div>
  )
}
