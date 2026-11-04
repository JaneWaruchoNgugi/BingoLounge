import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, CircleHelp } from 'lucide-react'
import { gameUrl, type Game } from '../games'
import { tourSeen } from '../tours'
import { TourModal } from './TourModal'

/**
 * A game, full screen over the lobby. How to play sits right beside the game's name, where the eye lands first,
 * glows until the player has taken the tour, and the tour opens by itself the first time a game is played.
 */
export function GameStage({ game, onClose, onStep }: { game: Game; onClose: () => void; onStep: (d: number) => void }) {
  const back = useRef<HTMLButtonElement>(null)
  const [touring, setTouring] = useState(() => !tourSeen(game.id))
  const [seen, setSeen] = useState(() => tourSeen(game.id))

  // switching game with previous / next: offer that game's tour if it is new to the player
  useEffect(() => {
    const s = tourSeen(game.id)
    setSeen(s)
    setTouring(!s)
  }, [game.id])

  useEffect(() => {
    if (!touring) back.current?.focus()
  }, [touring])

  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', key)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', key)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <>
      <div className="stage" role="dialog" aria-modal="true" aria-labelledby="stage-name">
        <header>
          <button className="back" ref={back} onClick={onClose}>
            <ChevronLeft /> Lobby
          </button>
          <b id="stage-name">{game.name}</b>
          <button className={'htp-stage' + (seen ? '' : ' fresh')} onClick={() => setTouring(true)} aria-haspopup="dialog">
            <CircleHelp aria-hidden="true" /> <span className="htp-long">How to play</span>
            <span className="htp-short" aria-hidden="true">Rules</span>
          </button>
          <div className="switch">
            <button onClick={() => onStep(-1)} aria-label="Previous game">
              <ChevronLeft />
            </button>
            <button onClick={() => onStep(1)} aria-label="Next game">
              <ChevronRight />
            </button>
          </div>
        </header>
        <iframe key={game.id} src={gameUrl(game.id)} title={game.name} allow="autoplay; fullscreen" />
      </div>
      {touring && (
        <TourModal
          game={game}
          onClose={() => {
            setTouring(false)
            setSeen(true)
          }}
        />
      )}
    </>
  )
}
