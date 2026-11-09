import { LC, colOf } from '../game/constants'
import { game } from '../game/store'
import { useGame } from '../hooks/useGame'

export const LETTERS = 'BINGO'

/** The ice board: 40 tiles to flip, the line toast, and the result panel when a game ends. */
export function Board() {
  const g = useGame()
  const over = g.phase === 'bust' || g.phase === 'won'
  if (!g.tiles.length)
    return (
      <div className="board idle">
        {Array.from({ length: 40 }, (_, i) => (
          <div key={i} className="tile" style={{ animationDelay: (i % 8) * 0.06 + Math.floor(i / 8) * 0.05 + 's' }}>
            <div className="back" />
          </div>
        ))}
        <div className="idle-msg">
          <b>Pick a stake and press Play</b>
          <small>
            40 ice tiles hide your card's 24 numbers, some decoys and {g.level.cracks} crack{g.level.cracks > 1 ? 's' : ''}.
          </small>
        </div>
      </div>
    )
  return (
    <div className={'board' + (over ? ' over' : '') + (g.phase === 'bust' ? ' bust' : '')}>
      {g.tiles.map((t, i) => {
        const mine = t.n > 0 && g.card.includes(t.n)
        const cls =
          'tile' + (t.up ? ' up' : '') + (t.ghost ? ' ghost' : '') + (t.n ? (mine ? ' mine' : ' miss') : ' crack') + (g.last === i ? ' last' : '')
        return (
          <button
            key={i}
            className={cls}
            disabled={t.up || g.phase !== 'play'}
            onClick={() => game.flip(i)}
            aria-label={t.up ? (t.n ? `${LETTERS[colOf(t.n)]} ${t.n}` : 'crack') : 'face-down tile'}
          >
            <div className="back" />
            <div className="face" style={t.n ? ({ '--lc': LC[colOf(t.n)] } as React.CSSProperties) : undefined}>
              {t.n ? (
                <>
                  <small>{LETTERS[colOf(t.n)]}</small>
                  <b>{t.n}</b>
                </>
              ) : (
                <svg viewBox="0 0 40 40" aria-hidden="true">
                  <path d="M20 2 L17 14 L24 18 L15 27 L19 38 M17 14 L6 10 M24 18 L36 14 M15 27 L4 30 M19 38" />
                </svg>
              )}
            </div>
          </button>
        )
      })}
      {g.toastMsg && (
        <div key={g.toastMsg.id} className="toast">
          {g.toastMsg.txt}
        </div>
      )}
      {over && (
        <div className={'result ' + g.phase}>
          <b>{g.phase === 'won' ? 'COLLECTED' : 'CRACKED!'}</b>
          <span>{g.phase === 'won' ? `+KES ${g.paid}` : g.bank ? `Lines kept KES ${g.bank}` : 'Pot lost'}</span>
          <button className="btn play" onClick={() => game.start()}>
            Play again · KES {g.stake}
          </button>
        </div>
      )}
    </div>
  )
}
