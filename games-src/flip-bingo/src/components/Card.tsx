import { LC } from '../game/constants'
import { useGame } from '../hooks/useGame'
import { LETTERS } from './Board'

/** The player's bingo card: hit numbers light up, finished lines flash. */
export function Card() {
  const g = useGame()
  const m = g.marked
  return (
    <div className="card">
      <div className="chead">
        {[...LETTERS].map((l, i) => (
          <span key={i} style={{ background: LC[i] }}>
            {l}
          </span>
        ))}
      </div>
      <div className="cgrid">
        {g.card.map((n, i) => (
          <div
            key={i}
            className={'cell' + (n === 0 ? ' free' : m.has(n) && g.tiles.length ? ' hit' : '') + (g.flash.has(i) ? ' line' : '')}
            style={{ '--lc': LC[i % 5] } as React.CSSProperties}
          >
            {n === 0 ? '❄' : n}
          </div>
        ))}
      </div>
      <div className="cfoot">
        <span>
          Hits <b>{g.hits}/24</b>
        </span>
        <span>
          Lines <b>{g.lines}</b>
        </span>
      </div>
    </div>
  )
}
