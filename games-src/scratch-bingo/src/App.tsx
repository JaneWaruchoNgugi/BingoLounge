import { Eye } from 'lucide-react'
import { BigWin, Result } from './components/Result'
import { Picker } from './components/Picker'
import { Prizes } from './components/Prizes'
import { Settings } from './components/Settings'
import { Ticket } from './components/Ticket'
import { BIG_WIN_X, QUICK_PRICES } from './game/constants'
import { game } from './game/store'
import { useGame } from './hooks/useGame'

export default function App() {
  const g = useGame()
  const playing = !!g.ticket && !g.ticket.done
  return (
    <div className="app">
      <header>
        <div className="logo" aria-label="Scratch Bingo">
          <span>SCRATCH</span>
          <span>BINGO</span>
        </div>
        <div className="hright">
          <Settings />
          <div className="bal">
            <small>Balance</small>
            <b>KES {g.pts.toLocaleString()}</b>
          </div>
        </div>
      </header>
      <main>
        <section className="play">
          <Ticket />
          <div className="actions">
            {g.ticket?.done && <Result key={g.ticket.id} t={g.ticket} cls="mres" />}
            {playing ? (
              <button className="btn ghost" onClick={() => game.revealAll()}>
                <Eye /> Reveal all
              </button>
            ) : (
              <>
                <div className="cnt" role="radiogroup" aria-label="Cards per ticket">
                  {[1, 2].map(n => (
                    <label key={n} className={g.maxCards === n ? 'on' : ''}>
                      <input type="radio" name="cnt" checked={g.maxCards === n} onChange={() => game.setMax(n)} />
                      <i />
                      {n} card{n > 1 ? 's' : ''}
                    </label>
                  ))}
                </div>
                <div className="quick">
                  <span>
                    Quick buy
                    <small>
                      {g.maxCards} card{g.maxCards > 1 ? 's' : ''}
                    </small>
                  </span>
                  {QUICK_PRICES.map(p => (
                    <button key={p} disabled={p * g.maxCards > g.pts} onClick={() => game.openQuick(p)}>
                      <b>{p}</b>
                      <small>KES {p * g.maxCards}</small>
                    </button>
                  ))}
                </div>
                <button className="btn buy" onClick={() => game.openPicker()}>
                  {g.ticket ? 'Next ticket · pick cards' : 'Pick your cards'}
                </button>
              </>
            )}
          </div>
        </section>
        <aside>
          <Prizes />
          <div className="hist">
            <small>Last tickets</small>
            <div>
              {g.history.length ? (
                g.history.map(h => (
                  <span key={h.id} className={h.win ? 'w' : 'l'}>
                    {h.txt}
                  </span>
                ))
              ) : (
                <i>No tickets yet</i>
              )}
            </div>
          </div>
        </aside>
      </main>
      {g.pickOpen && <Picker />}
      {g.ticket?.done && g.ticket.win >= BIG_WIN_X * g.ticket.stakes.reduce((a, b) => a + b, 0) && <BigWin key={g.ticket.id} t={g.ticket} />}
    </div>
  )
}
