import { LINE_PAYS, MATCH_MIN, MATCH_PAYS, MATCH_STEP } from '../game/constants'
import { score } from '../game/store'
import { useGame } from '../hooks/useGame'

/** Match prizes listed one by one before the table collapses to "N+ … each". */
const ROWS = 5

/** The prize table, lighting up the best prize reached so far on the current ticket. */
export function Prizes() {
  const g = useGame()
  const t = g.ticket
  const scores = t ? t.cards.map(c => score(c, g.revealed)) : []
  const lines = Math.max(0, ...scores.map(s => s.lines.length))
  const matches = Math.max(0, ...scores.map(s => s.matches))
  const best = (table: [number, number][], v: number) => [...table].reverse().find(([n]) => v >= n)?.[0]
  const lineOn = t && best(LINE_PAYS, lines)
  const matchOn = t && best(MATCH_PAYS, matches)
  const x = (v: number) => `×${+v.toFixed(2)}`
  return (
    <div className="prizes">
      <div>
        <small>Lines</small>
        {LINE_PAYS.map(([n, v], i) => (
          <span key={n} className={lineOn === n ? 'on' : ''}>
            {n}
            {i === LINE_PAYS.length - 1 ? '+' : ''} line{n > 1 ? 's' : ''} <b>{x(v)}</b>
          </span>
        ))}
      </div>
      <div>
        <small>Numbers matched</small>
        {MATCH_PAYS.slice(0, ROWS).map(([n, v]) => (
          <span key={n} className={matchOn === n ? 'on' : ''}>
            {n} <b>{x(v)}</b>
          </span>
        ))}
        <span className={matchOn != null && matchOn >= MATCH_MIN + ROWS ? 'on' : ''}>
          {MATCH_MIN + ROWS}+{' '}
          <b>
            {x(MATCH_PAYS[ROWS][1])}, +{+MATCH_STEP.toFixed(2)} each
          </b>
        </span>
      </div>
      <p>Prizes are × the card's price. Each card pays its best prize.</p>
    </div>
  )
}
