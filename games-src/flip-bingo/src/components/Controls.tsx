import { Shuffle } from 'lucide-react'
import { LEVELS, STAKES } from '../game/constants'
import { game } from '../game/store'
import { useGame } from '../hooks/useGame'

/** Stake, number of cracks and New card. Locked while a game is running. */
export function Controls() {
  const g = useGame()
  const live = g.phase === 'play'
  return (
    <div className={'controls' + (live ? ' lock' : '')}>
      <div className="grp">
        <small>Stake</small>
        <div className="seg">
          {STAKES.map(s => (
            <button key={s} className={g.stake === s ? 'on' : ''} disabled={live} onClick={() => game.setStake(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="grp">
        <small>Cracks</small>
        <div className="seg">
          {LEVELS.map((l, i) => (
            <button key={i} className={g.lvl === i ? 'on' : ''} disabled={live} onClick={() => game.setLevel(i)}>
              {l.name} · {l.cracks}
            </button>
          ))}
        </div>
      </div>
      <button className="btn ghostbtn newcard" disabled={live} onClick={() => game.newCard()}>
        <Shuffle /> New card
      </button>
    </div>
  )
}
