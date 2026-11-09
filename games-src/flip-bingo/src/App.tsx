import { Volume2, VolumeX } from 'lucide-react'
import { Board } from './components/Board'
import { Card } from './components/Card'
import { Controls } from './components/Controls'
import { Pot } from './components/Pot'
import { game } from './game/store'
import { useGame } from './hooks/useGame'

export default function App() {
  const g = useGame()
  return (
    <div className="app">
      <header>
        <div className="logo" aria-label="Flip Bingo">
          <span>FLIP</span>
          <span>BINGO</span>
        </div>
        <div className="hright">
          <button className="snd" onClick={() => game.toggleSound()} aria-label={g.sound ? 'Mute sound' : 'Turn sound on'}>
            {g.sound ? <Volume2 /> : <VolumeX />}
          </button>
          <div className="bal">
            <small>Balance</small>
            <b>KES {g.pts.toLocaleString()}</b>
          </div>
        </div>
      </header>
      <main>
        <section className="left">
          <Card />
          <Controls />
        </section>
        <section className="mid">
          <Board />
        </section>
        <section className="right">
          <Pot />
          <div className="hist">
            <small>Last games</small>
            <div>
              {g.history.length ? (
                g.history.map(h => (
                  <span key={h.id} className={h.win ? 'w' : 'l'}>
                    {h.txt}
                  </span>
                ))
              ) : (
                <i>No games yet</i>
              )}
            </div>
          </div>
          <div className="how">
            <b>How to play</b>
            <p>
              Flip tiles to call numbers. Every number on your card raises the pot. Every line you finish banks a bonus at once. A
              crack ends the game and the pot is lost, so collect when you're happy.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
