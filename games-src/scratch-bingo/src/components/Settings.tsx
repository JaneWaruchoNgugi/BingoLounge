import { useEffect, useRef, useState } from 'react'
import { Settings as Gear, X } from 'lucide-react'
import { game } from '../game/store'
import { useGame } from '../hooks/useGame'

/** The gear button and its panel with the music and sound-effect switches. */
export function Settings() {
  const g = useGame()
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !box.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])
  const row = (label: string, hint: string, on: boolean, toggle: () => void) => (
    <button className="srow" role="switch" aria-checked={on} onClick={toggle}>
      <span>
        <b>{label}</b>
        <small>{hint}</small>
      </span>
      <i className={'sw' + (on ? ' on' : '')} />
    </button>
  )
  return (
    <div className="settings" ref={box}>
      <button className={'snd' + (open ? ' open' : '')} onClick={() => setOpen(o => !o)} aria-label="Settings" aria-expanded={open}>
        <Gear />
      </button>
      {open && (
        <div className="spanel" role="dialog" aria-label="Settings">
          <div className="shead">
            <b>Settings</b>
            <button className="sx" onClick={() => setOpen(false)} aria-label="Close settings">
              <X />
            </button>
          </div>
          {row('Music', 'Background tune', g.music, () => game.toggleMusic())}
          {row('Sound effects', 'Scratching, hits and wins', g.sound, () => game.toggleSound())}
        </div>
      )}
    </div>
  )
}
