import { useEffect, useMemo, useRef } from 'react'
import { game, SPINS } from '../game/store'
import { STAR } from '../game/cards'
import { LC, ballBg, rnd } from '../game/constants'
import { useGame } from '../hooks/useGame'

/** A ball face on a reel: the number on its column's colours, or the gold Star. */
function Face({ n }: { n: number | null }) {
  if (n === null) return <div className="rface0" />
  if (n === STAR)
    return (
      <div className="rball star" aria-label="Star">
        <b>★</b>
      </div>
    )
  return (
    <div className="rball tb" style={{ background: ballBg(n) }}>
      <small>{'BINGO'[Math.floor((n - 1) / 15)]}</small>
      <b>{n}</b>
    </div>
  )
}

/** Numbers of column `c` that blur past while reel `c` spins (fixed per spin so React doesn't redraw them). */
const blurStrip = (c: number) => Array.from({ length: 8 }, (_, k) => (k === 5 ? STAR : 1 + c * 15 + rnd(15)))

/**
 * The slot cabinet: five reels, one per B-I-N-G-O column. Each spin they all whirl, then stop left
 * to right; each one lands on a number of its column or on the Star (a free daub for every card).
 */
export function Reels() {
  const g = useGame()
  const host = useRef<HTMLDivElement>(null)
  const strips = useMemo(() => [0, 1, 2, 3, 4].map(blurStrip), [g.spin])

  useEffect(() => {
    game.fx = {
      reelStop(i) {
        const w = host.current?.querySelectorAll('.reel')[i]
        if (!w) return
        w.classList.remove('thud')
        void (w as HTMLElement).offsetWidth
        w.classList.add('thud')
      },
    }
    return () => {
      game.fx = null
    }
  }, [])

  const anySpin = g.spinning.some(Boolean)
  return (
    <div className={'gobj reels' + (anySpin ? ' spinning' : '')} ref={host}>
      <div className="cab">
        <div className="marquee">
          <span>REEL</span> <em>BINGO</em>
        </div>
        <div className="window">
          {[0, 1, 2, 3, 4].map(c => (
            <div key={c} className={'reel' + (g.spinning[c] ? ' spin' : '') + (g.starHit[c] ? ' starhit' : '')} style={{ '--lc': LC[c] } as React.CSSProperties}>
              <div className="rhead">{'BINGO'[c]}</div>
              <div className="rview">
                {g.spinning[c] ? (
                  <div className="strip" style={{ animationDelay: -c * 0.07 + 's' }}>
                    {[...strips[c], ...strips[c]].map((n, k) => (
                      <Face key={k} n={n} />
                    ))}
                  </div>
                ) : (
                  <div className="landed" key={g.spin + ':' + g.reels[c]}>
                    <Face n={g.reels[c]} />
                  </div>
                )}
              </div>
            </div>
          ))}
          <i className="payline" aria-hidden="true" />
        </div>
        <div className="spins" aria-label={`Spin ${g.spin} of ${SPINS}`}>
          {Array.from({ length: SPINS }, (_, k) => (
            <i key={k} className={k < g.spin ? 'on' : k === g.spin && anySpin ? 'now' : ''} />
          ))}
          <span>
            {g.phase === 'buy' ? `${SPINS} spins · 5 numbers each` : `Spin ${Math.min(g.spin + (anySpin ? 1 : 0), SPINS)} / ${SPINS}`}
          </span>
        </div>
      </div>
    </div>
  )
}
