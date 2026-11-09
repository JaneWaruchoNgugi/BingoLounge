import { useEffect, useState, type CSSProperties } from 'react'
import { SFX } from '../audio/sfx'
import { LC } from '../game/constants'
import { game, score, type Ticket } from '../game/store'

/** One line per card: its best prize, or "no win". */
function summary(t: Ticket) {
  return t.cards
    .map((card, k) => {
      const s = score(card, game.marks(k))
      const txt =
        s.lx >= s.mx && s.lx
          ? `${s.lines.length} line${s.lines.length > 1 ? 's' : ''} · KES ${Math.round(s.lx * t.stakes[k])}`
          : s.mx
            ? `${s.matches} matched · KES ${Math.round(s.mx * t.stakes[k])}`
            : 'no win'
      return t.cards.length > 1 ? `Card ${k + 1}: ${txt}` : txt
    })
    .join(' · ')
}

/** Counts up to `to` over `ms`, with a coin tick along the way. Restarts when `key` changes. */
function useCountUp(to: number, key: number, ms = 1200) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!to) return setV(0)
    let raf = 0
    let ticks = 0
    const t0 = performance.now()
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / ms)
      const e = 1 - Math.pow(1 - p, 3)
      setV(Math.round(to * e))
      const tick = Math.floor(p * 12)
      if (tick > ticks && p < 1) {
        ticks = tick
        SFX.coin()
      }
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [to, key, ms])
  return v
}

/** A burst of coins flying out from the centre. */
function Coins({ n = 12 }: { n?: number }) {
  const [coins] = useState(() =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.5
      const d = 60 + Math.random() * 70
      return { dx: Math.cos(a) * d, dy: Math.sin(a) * d * 0.6 - 30, r: Math.random() * 360, dl: Math.random() * 0.15 }
    }),
  )
  return (
    <span className="coins" aria-hidden="true">
      {coins.map((c, i) => (
        <i key={i} style={{ '--dx': c.dx + 'px', '--dy': c.dy + 'px', '--r': c.r + 'deg', animationDelay: c.dl + 's' } as CSSProperties} />
      ))}
    </span>
  )
}

/** how long the result banner stays before fading out */
const SHOW_MS = 4000

/** The win / no-win banner shown when a ticket is finished. */
export function Result({ t, cls }: { t: Ticket; cls: string }) {
  const shown = useCountUp(t.win, t.id)
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const a = setTimeout(() => setPhase(1), SHOW_MS)
    const b = setTimeout(() => setPhase(2), SHOW_MS + 450)
    return () => {
      clearTimeout(a)
      clearTimeout(b)
    }
  }, [t.id])
  if (phase === 2) return null
  return (
    <div key={t.id} className={cls + (t.win ? ' win' : '') + (phase ? ' fade' : '')}>
      {t.win > 0 && <Coins />}
      <b>{t.win ? `YOU WIN KES ${shown.toLocaleString()}` : 'NO WIN THIS TIME'}</b>
      <small>{summary(t)}</small>
    </div>
  )
}

/** Full-screen celebration for a win of BIG_WIN_X × the ticket price or more. */
export function BigWin({ t }: { t: Ticket }) {
  const [open, setOpen] = useState(true)
  const shown = useCountUp(t.win, t.id, 2200)
  const x = Math.round(t.win / t.stakes.reduce((a, b) => a + b, 0))
  useEffect(() => {
    const id = setTimeout(() => setOpen(false), 5200)
    return () => clearTimeout(id)
  }, [])
  const [bits] = useState(() =>
    Array.from({ length: 60 }, () => ({
      x: Math.random() * 100,
      d: Math.random() * 1.2,
      s: 2.2 + Math.random() * 1.8,
      c: LC[Math.floor(Math.random() * 5)],
      r: Math.random() * 720 - 360,
    })),
  )
  if (!open) return null
  return (
    <div className="bigwin" role="dialog" aria-label="Big win" onClick={() => setOpen(false)}>
      <div className="confetti" aria-hidden="true">
        {bits.map((b, i) => (
          <i
            key={i}
            style={{ left: b.x + '%', background: b.c, animationDelay: b.d + 's', animationDuration: b.s + 's', '--r': b.r + 'deg' } as CSSProperties}
          />
        ))}
      </div>
      <div className="bw-box">
        <small>{x >= 100 ? 'MEGA WIN' : x >= 30 ? 'SUPER WIN' : 'BIG WIN'}</small>
        <b>KES {shown.toLocaleString()}</b>
        <span>{x}× your ticket</span>
        <Coins n={18} />
        <em>Tap to continue</em>
      </div>
    </div>
  )
}
