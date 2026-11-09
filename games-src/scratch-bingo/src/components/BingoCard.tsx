import type { CSSProperties } from 'react'
import { LC } from '../game/constants'
import { game, nearLines, score } from '../game/store'

export const LETTERS = 'BINGO'
/** The empty card shown before a ticket is bought: only the free centre. */
export const BLANK = Array.from({ length: 25 }, (_, i) => (i === 12 ? 0 : -1))

interface Props {
  card: number[]
  /** numbers revealed so far for this card */
  rev: Set<number>
  /** which card of the ticket this is */
  k: number
  many: boolean
  /** this card's win once the ticket is done (two-card tickets only) */
  win?: number
  /** cell holding the bonus star */
  star?: number
  /** the star is waiting to be placed: numbers not yet hit are buttons */
  cand: boolean
  /** ticket still being scratched: show near lines */
  live: boolean
}

/** One 5×5 bingo card, with hits, finished lines and lines one number short. */
export function BingoCard({ card, rev, k, many, win, star, cand, live }: Props) {
  const real = card[0] !== -1
  const s = real ? score(card, rev) : null
  const onLine = new Set(s?.lines.flat() ?? [])
  const near = real && live ? nearLines(card, rev) : null
  return (
    <div className={'bcard' + (win ? ' won' : '') + (real ? '' : ' blank')}>
      <div className="lbl">
        {many ? `Card ${k + 1}` : 'Your card'}
        <b>{s ? `${s.matches} matched · ${s.lines.length} line${s.lines.length === 1 ? '' : 's'}` : ''}</b>
      </div>
      <div className="chead">
        {[...LETTERS].map((l, i) => (
          <span key={i} style={{ background: LC[i] }}>
            {l}
          </span>
        ))}
      </div>
      <div className="cgrid">
        {card.map((n, i) => {
          const hit = n > 0 && rev.has(n)
          const pick = cand && n > 0 && !hit
          const cls =
            'cell' +
            (n === 0 ? ' free' : hit ? ' hit' : '') +
            (onLine.has(i) ? ' line' : near?.cells.has(i) ? ' near' : '') +
            (near?.missing.has(i) ? ' miss' : '') +
            (star === i ? ' starred' : '') +
            (pick ? ' cand' : '')
          return pick ? (
            <button key={i} className={cls} style={{ '--lc': LC[i % 5] } as CSSProperties} onClick={() => game.placeStar(k, i)} aria-label={`Put the star on ${n}`}>
              {n}
            </button>
          ) : (
            <div key={i} className={cls} style={{ '--lc': LC[i % 5] } as CSSProperties}>
              {n === 0 ? '★' : n > 0 ? n : ''}
              {star === i && <i className="stari">★</i>}
            </div>
          )
        })}
      </div>
      {win !== undefined && <div className={'cwin' + (win ? ' on' : '')}>{win ? `WINS KES ${win}` : 'No win'}</div>}
    </div>
  )
}
