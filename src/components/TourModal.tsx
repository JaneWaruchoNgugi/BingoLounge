import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Lightbulb, Play, X } from 'lucide-react'
import { KIND_LABEL, posterUrl, type Game } from '../games'
import { TOURS, markTourSeen, type TourStep } from '../tours'

/**
 * The guided How to play tour for one game: a cover with the poster, then one step per rule,
 * with a progress bar, Back / Next, arrow keys, Escape to close and focus kept inside the dialog.
 * `onPlay` (from the lobby) turns the last button into "Play now".
 */
export function TourModal({ game, onClose, onPlay }: { game: Game; onClose: () => void; onPlay?: () => void }) {
  const steps: TourStep[] = TOURS[game.id] ?? [{ Icon: Play, title: game.name, body: game.blurb }]
  const total = steps.length + 1 // the cover counts as the first step
  const [i, setI] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  const primary = useRef<HTMLButtonElement>(null)
  const last = i === total - 1

  const close = () => {
    markTourSeen(game.id)
    onClose()
  }
  const finish = () => {
    markTourSeen(game.id)
    if (onPlay) onPlay()
    else onClose()
  }
  const next = () => (last ? finish() : setI(v => v + 1))
  const prev = () => setI(v => Math.max(0, v - 1))

  useEffect(() => {
    primary.current?.focus()
  }, [i])

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      // capture phase + stopPropagation: Escape closes only the tour, not the game behind it
      if (e.key === 'Escape') {
        e.stopPropagation()
        close()
      } else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'Tab' && box.current) {
        const f = box.current.querySelectorAll<HTMLElement>('button:not([disabled])')
        if (!f.length) return
        const a = f[0], z = f[f.length - 1]
        if (e.shiftKey && document.activeElement === a) (z.focus(), e.preventDefault())
        else if (!e.shiftKey && document.activeElement === z) (a.focus(), e.preventDefault())
      }
    }
    window.addEventListener('keydown', key, true)
    return () => window.removeEventListener('keydown', key, true)
  })

  const step = i > 0 ? steps[i - 1] : null

  return (
    <div className="tour-overlay" onClick={close}>
      <div
        ref={box}
        className="tour-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        onClick={e => e.stopPropagation()}
      >
        <button className="tour-close" onClick={close} aria-label="Close tour">
          <X size={16} />
        </button>

        {step === null ? (
          <div className="tour-cover" key="cover">
            <img src={posterUrl(game.id)} alt="" />
            <div className="tour-cover-copy">
              <span className={'kind ' + game.kind}>{KIND_LABEL[game.kind]}</span>
              <p className="tour-eyebrow">How to play</p>
              <h2 id="tour-title" className="tour-title">{game.name}</h2>
              <p id="tour-body" className="tour-body">{game.blurb}</p>
              <ul className="tour-facts">
                {game.facts.map(f => <li key={f}>{f}</li>)}
              </ul>
            </div>
          </div>
        ) : (
          <div className="tour-step" key={i} aria-live="polite">
            <div className="tour-icon" aria-hidden="true">
              <step.Icon />
            </div>
            <p className="tour-eyebrow">
              Step {i} of {total - 1}
            </p>
            <h2 id="tour-title" className="tour-title">{step.title}</h2>
            <p id="tour-body" className="tour-body">{step.body}</p>
            {step.tip && (
              <p className="tour-tip">
                <Lightbulb aria-hidden="true" /> <span><b>Tip:</b> {step.tip}</span>
              </p>
            )}
          </div>
        )}

        <div className="tour-progress" role="group" aria-label="Tour steps">
          {Array.from({ length: total }, (_, k) => (
            <button
              key={k}
              className={k === i ? 'on' : k < i ? 'done' : ''}
              onClick={() => setI(k)}
              aria-label={k === 0 ? 'Overview' : `Step ${k}: ${steps[k - 1].title}`}
              aria-current={k === i ? 'step' : undefined}
            />
          ))}
        </div>

        <div className="tour-actions">
          {i === 0 ? (
            <button className="tour-skip" onClick={close}>
              Skip tour
            </button>
          ) : (
            <button className="tour-back" onClick={prev}>
              <ChevronLeft size={16} /> Back
            </button>
          )}
          <button ref={primary} className="tour-next" onClick={next}>
            {i === 0 ? (
              <>
                Start the tour <ChevronRight size={16} />
              </>
            ) : last ? (
              onPlay ? (
                <>
                  <Play size={14} fill="currentColor" /> Play {game.name}
                </>
              ) : (
                <>Got it, let&rsquo;s play</>
              )
            ) : (
              <>
                Next <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
