import { useState } from 'react'
import { Grid2x2 } from 'lucide-react'
import { GAMES } from './games'
import { useHashRoute } from './useHashGame'
import { Sidebar, BottomNav } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { Hero } from './components/Hero'
import { Filters, type Filter } from './components/Filters'
import { GameCard } from './components/GameCard'
import { GameStage } from './components/GameStage'
import { TourModal } from './components/TourModal'
import { Help, MyCards, Preferences, Promotions } from './components/Pages'

export default function App() {
  const [filter, setFilter] = useState<Filter>('all')
  const [learning, setLearning] = useState<string | null>(null)
  const learnGame = GAMES.find(g => g.id === learning)
  const { page, game, go } = useHashRoute()
  const shown = GAMES.filter(g => filter === 'all' || g.kind === filter)
  const current = GAMES.find(g => g.id === game)

  const step = (d: number) => {
    const i = GAMES.findIndex(g => g.id === game)
    go(GAMES[(i + d + GAMES.length) % GAMES.length].id)
  }

  return (
    <div className="shell">
      <Sidebar page={page} go={go} />
      <div className="main">
        <TopBar onLearn={() => go('promotions')} />
        {page === 'lobby' && (
          <>
            <Hero go={go} />
            <section className="games" aria-labelledby="all-games">
              <div className="bar">
                <h2 id="all-games">
                  <Grid2x2 className="gi" /> All Games
                </h2>
                <Filters value={filter} total={GAMES.length} onChange={setFilter} />
              </div>
              <div className="grid">
                {shown.map(g => (
                  <GameCard key={g.id} game={g} onPlay={go} onLearn={setLearning} />
                ))}
              </div>
            </section>
          </>
        )}
        {page === 'promotions' && <Promotions go={go} />}
        {page === 'my-cards' && <MyCards go={go} />}
        {page === 'help' && <Help onLearn={setLearning} />}
        {page === 'preferences' && <Preferences />}
        <footer className="foot">
          <span>
            <span className="age">18+</span> Play responsibly. Balances shown are practice amounts.
          </span>
        </footer>
      </div>
      <BottomNav page={page} go={go} />
      {learnGame && !current && (
        <TourModal
          game={learnGame}
          onClose={() => setLearning(null)}
          onPlay={() => {
            setLearning(null)
            go(learnGame.id)
          }}
        />
      )}
      {current && <GameStage game={current} onClose={() => go(null)} onStep={step} />}
    </div>
  )
}
