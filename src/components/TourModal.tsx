import { useState } from 'react'
import { X, ChevronRight } from 'lucide-react'
import type { Game } from '../games'

/** Step-through tour for a single game. */
export function TourModal({ game, onClose }: { game: Game; onClose: () => void }) {
  const steps = [game.blurb, ...game.facts]
  const [step, setStep] = useState(0)
  return (
    <div className="tour-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="tour-box" onClick={e => e.stopPropagation()}>
        <button className="tour-close" onClick={onClose} aria-label="Close"><X size={16} /></button>
        <p className="tour-step">{step + 1} / {steps.length}</p>
        <p className="tour-title">{game.name}</p>
        <p className="tour-body">{steps[step]}</p>
        <div className="tour-actions">
          <button className="tour-skip" onClick={onClose}>Skip tour</button>
          {step < steps.length - 1 ? (
            <button className="tour-next" onClick={() => setStep(s => s + 1)}>
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button className="tour-next" onClick={onClose}>Got it!</button>
          )}
        </div>
      </div>
    </div>
  )
}
