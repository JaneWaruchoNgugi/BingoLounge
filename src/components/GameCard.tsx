import { CircleHelp } from 'lucide-react'
import { KIND_LABEL, posterUrl, thumbUrl, type Game } from '../games'

/** One game tile: poster art (click to play) and a How to play button under it that opens the game's tour. */
export function GameCard({ game, onPlay, onLearn }: { game: Game; onPlay: (id: string) => void; onLearn: (id: string) => void }) {
  return (
    <article className="game">
      <button className="art" onClick={() => onPlay(game.id)} aria-label={`Play ${game.name}`}>
        {game.poster ? (
          <img src={posterUrl(game.id)} alt="" loading="lazy" />
        ) : (
          <>
            <img src={thumbUrl(game.id)} alt="" loading="lazy" className="shot" />
            <span className="art-title" aria-hidden="true">{game.name}</span>
          </>
        )}
        {game.isNew && <span className="ribbon">NEW</span>}
        <span className={'kind ' + game.kind}>{KIND_LABEL[game.kind]}</span>
      </button>
      <div className="game-foot">
        <span className="game-name">{game.name}</span>
        <button className="htp-card" onClick={() => onLearn(game.id)} aria-label={`How to play ${game.name}`}>
          <CircleHelp aria-hidden="true" /> How to play
        </button>
      </div>
    </article>
  )
}
