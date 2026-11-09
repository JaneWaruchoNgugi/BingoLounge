import { Sparkles } from 'lucide-react'
import { mult, game } from '../game/store'
import { useGame } from '../hooks/useGame'

/** The pot: what collecting pays now, the next hit, the crack risk, and Play / Collect. */
export function Pot() {
  const g = useGame()
  const live = g.phase === 'play'
  const cracks = g.level.cracks
  return (
    <div className="pot">
      <div className="pv">
        <small>{live ? 'Pot' : 'First hit pays'}</small>
        <b>KES {live ? g.pot : Math.round(g.stake * mult(1, cracks))}</b>
        <em>×{mult(live ? g.hits : 1, cracks).toFixed(2)}</em>
      </div>
      <div className="pmeta">
        <span>
          Next hit <b>KES {g.nextPot}</b>
        </span>
        <span>
          Crack risk <b>{Math.round(live ? g.risk * 100 : (cracks / 40) * 100)}%</b>
        </span>
        <span>
          Line bonus <b>KES {Math.round(g.stake * g.level.line)}</b>
        </span>
      </div>
      {live ? (
        <div className="pbtns">
          <button className="btn collect" disabled={!g.hits} onClick={() => game.collect()}>
            {g.hits ? `Collect KES ${g.pot}` : 'Hit your card to collect'}
          </button>
          <button className="btn ghostbtn" onClick={() => game.auto()}>
            <Sparkles /> Flip random
          </button>
        </div>
      ) : (
        <div className="pbtns">
          <button className="btn play" disabled={g.stake > g.pts} onClick={() => game.start()}>
            Play · KES {g.stake}
          </button>
        </div>
      )}
    </div>
  )
}
