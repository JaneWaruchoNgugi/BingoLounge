import { useEffect, useMemo, useRef } from 'react'
import { LC, ballBg, rnd } from '../game/constants'
import { STAR } from '../game/reels'
import { SPINS, game } from '../game/store'
import { useGame } from '../hooks/useGame'

/** What a reel shows: nothing yet, the Star, or a number ball. */
function ReelFace({ n }: { n: number | null }) {
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

/** The blur strip a spinning reel scrolls: random numbers from its column with the Star among them. */
const strip = (col: number) => Array.from({ length: 8 }, (_, i) => (i === 5 ? STAR : 1 + col * 15 + rnd(15)))

/**
 * The reel cabinet: five reels (B I N G O) that spin together and stop one by one, a payline,
 * and a row of lights counting the round's spins.
 */
export function Reels() {
  const g = useGame()
  const ref = useRef<HTMLDivElement>(null)
  // new blur strips each spin
  const strips = useMemo(() => [0, 1, 2, 3, 4].map(strip), [g.spin])

  useEffect(() => {
    game.fx = {
      reelStop(i) {
        const reel = ref.current?.querySelectorAll<HTMLElement>('.reel')[i]
        if (!reel) return
        // restart the landing thud
        reel.classList.remove('thud')
        void reel.offsetWidth
        reel.classList.add('thud')
      },
    }
    return () => {
      game.fx = null
    }
  }, [])

  const spinning = g.spinning.some(Boolean)
  return (
    <div className={'gobj reels' + (spinning ? ' spinning' : '')} ref={ref}>
      <div className="cab">
        <div className="marquee">
          <span>REEL</span> <em>BINGO</em>
        </div>
        <div className="window">
          {[0, 1, 2, 3, 4].map(i => (
            <div
              key={i}
              className={'reel' + (g.spinning[i] ? ' spin' : '') + (g.starHit[i] ? ' starhit' : '')}
              style={{ '--lc': LC[i] } as React.CSSProperties}
            >
              <div className="rhead">{'BINGO'[i]}</div>
              <div className="rview">
                {g.spinning[i] ? (
                  <div className="strip" style={{ animationDelay: -i * 0.07 + 's' }}>
                    {[...strips[i], ...strips[i]].map((n, k) => (
                      <ReelFace key={k} n={n} />
                    ))}
                  </div>
                ) : (
                  <div key={g.spin + ':' + g.reels[i]} className="landed">
                    <ReelFace n={g.reels[i]} />
                  </div>
                )}
              </div>
            </div>
          ))}
          <i className="payline" aria-hidden="true" />
        </div>
        <div className="spins" aria-label={`Spin ${g.spin} of ${SPINS}`}>
          {Array.from({ length: SPINS }, (_, i) => (
            <i key={i} className={i < g.spin ? 'on' : i === g.spin && spinning ? 'now' : ''} />
          ))}
          <span>{g.phase === 'buy' ? `${SPINS} spins · 5 numbers each` : `Spin ${Math.min(g.spin + (spinning ? 1 : 0), SPINS)} / ${SPINS}`}</span>
        </div>
      </div>
    </div>
  )
}
