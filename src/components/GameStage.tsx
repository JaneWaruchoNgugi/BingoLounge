import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react'
import { gameUrl, type Game } from '../games'
import { TourModal } from './TourModal'

/** A game, full screen over the lobby, with Lobby / previous / next / how-to-play controls. */
export function GameStage({ game, onClose, onStep }: { game: Game; onClose: () => void; onStep: (d: number) => void }) {
  const back = useRef<HTMLButtonElement>(null)
  const [touring, setTouring] = useState(false)

  useEffect(() => {
    back.current?.focus()
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
          <div className="switch">
            <button className="htp-stage" onClick={() => setTouring(true)} aria-label="How to play">
              <HelpCircle size={18} /> How to play
            </button>
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
      {touring && <TourModal game={game} onClose={() => setTouring(false)} />}
    </>
  )
}
