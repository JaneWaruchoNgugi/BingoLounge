import { Play } from 'lucide-react'
import { thumbUrl, type Game } from '../games'

/** The game in the spotlight at the top of the lobby. */
export function Featured({ game, onPlay }: { game: Game; onPlay: (id: string) => void }) {
  return (
    <section className="feature" aria-labelledby="ft">
      <div className="shot" role="img" aria-label={`${game.name} screenshot`} style={{ backgroundImage: `url("${thumbUrl(game.id)}")` }} />
      <div className="copy">
        <span className="eyebrow">New in the hall</span>
        <h2 id="ft">{game.name}</h2>
        <p>
          Pick one or two cards from KES 10 to 100, then scratch 30 calls off a holographic foil with a gold coin. One ticket in 40 hides a bonus star you can
          place on any number.
        </p>
        <button className="play" onClick={() => onPlay(game.id)}>
          <Play fill="currentColor" /> Play {game.name}
        </button>
      </div>
    </section>
  )
}
