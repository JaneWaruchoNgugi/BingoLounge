import { KIND_LABEL, posterUrl, thumbUrl, type Game } from '../games'

/** One game tile: poster art only. Click to play. */
export function GameCard({ game, onPlay }: { game: Game; onPlay: (id: string) => void }) {
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
    </article>
  )
}
