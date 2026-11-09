import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react'
import { SFX } from '../audio/sfx'
import { game } from '../game/store'
import { useGame } from '../hooks/useGame'

/** Each spot is tracked as a G×G grid of cells; a spot opens once enough of them are scratched. */
const G = 5
/** share of a spot's cells that must be scratched before it clears and counts */
const OPEN_AT = 0.55
/** last time a scratch sound played, so a fast stroke doesn't machine-gun it */
let lastScratch = 0

/**
 * The holographic silver layer over the 30 spots, drawn on a canvas. Dragging a coin across it
 * erases the silver; a spot that is mostly scratched clears completely and is revealed.
 */
export function Foil({ grid }: { grid: RefObject<HTMLDivElement> }) {
  const g = useGame()
  const canvas = useRef<HTMLCanvasElement>(null)
  /** spot boxes, relative to the canvas */
  const boxes = useRef<DOMRect[]>([])
  /** per spot: which of its G×G cells have been scratched */
  const cells = useRef<boolean[][]>([])
  /** where the pointer was on the last move while scratching */
  const last = useRef<{ x: number; y: number } | null>(null)
  const t = g.ticket

  /** Paints a fresh foil sized to the spots grid; spots already open stay clear. */
  const paint = () => {
    const cv = canvas.current
    const el = grid.current
    if (!cv || !el) return
    const r = el.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    cv.width = r.width * dpr
    cv.height = r.height * dpr
    const c = cv.getContext('2d')!
    c.setTransform(dpr, 0, 0, dpr, 0, 0)
    boxes.current = [...el.querySelectorAll('.spot')].map(s => {
      const b = s.getBoundingClientRect()
      return new DOMRect(b.left - r.left, b.top - r.top, b.width, b.height)
    })
    const tk = game.ticket
    const W = r.width
    const H = r.height

    // brushed silver
    const base = c.createLinearGradient(0, 0, W, H)
    base.addColorStop(0, '#c4c8ce')
    base.addColorStop(0.2, '#f4f5f7')
    base.addColorStop(0.42, '#a7adb5')
    base.addColorStop(0.6, '#eceef1')
    base.addColorStop(0.82, '#b3b8c0')
    base.addColorStop(1, '#e2e5e9')
    c.fillStyle = base
    c.beginPath()
    c.roundRect(0, 0, W, H, 10)
    c.fill()
    // a rainbow hologram sheen
    c.save()
    c.globalCompositeOperation = 'overlay'
    const holo = c.createLinearGradient(0, H, W, 0)
    ;['#ff5fa2', '#ffcf4a', '#5fe3a1', '#4fc3ff', '#b06bff', '#ff5fa2', '#ffcf4a'].forEach((col, i, a) => holo.addColorStop(i / (a.length - 1), col))
    c.globalAlpha = 0.38
    c.fillStyle = holo
    c.fillRect(0, 0, W, H)
    c.restore()
    // guilloche waves
    c.save()
    c.strokeStyle = '#ffffff70'
    c.lineWidth = 0.8
    for (let k = -4; k < H / 9 + 4; k++) {
      c.beginPath()
      for (let x = 0; x <= W; x += 6) {
        const y = k * 9 + Math.sin(x / 22 + k * 0.6) * 4 + Math.sin(x / 57) * 3
        if (x) c.lineTo(x, y)
        else c.moveTo(x, y)
      }
      c.stroke()
    }
    c.restore()
    // glitter, with the odd cross-shaped sparkle
    for (let k = 0; k < (W * H) / 900; k++) {
      const x = (k * 7919) % W
      const y = (k * 104729) % H
      c.fillStyle = '#ffffff'
      c.globalAlpha = 0.35 + ((k * 13) % 50) / 100
      c.beginPath()
      c.arc(x, y, k % 7 ? 0.7 : 1.4, 0, 7)
      c.fill()
      if (k % 23 === 0) {
        c.fillRect(x - 4, y - 0.4, 8, 0.8)
        c.fillRect(x - 0.4, y - 4, 0.8, 8)
      }
    }
    c.globalAlpha = 1

    // a silver coin with a coloured "?" over each spot
    const lc = ['#22b8f0', '#ff4f7b', '#ffb320', '#a35cff', '#22c77a']
    boxes.current.forEach((b, i) => {
      if (tk && tk.open[i]) return c.clearRect(b.x - 2, b.y - 2, b.width + 4, b.height + 4)
      const x = b.x + b.width / 2
      const y = b.y + b.height / 2
      const R = b.width * 0.45
      c.save()
      c.shadowColor = '#00000055'
      c.shadowBlur = 6
      c.shadowOffsetY = 2
      const rim = c.createLinearGradient(x - R, y - R, x + R, y + R)
      rim.addColorStop(0, '#ffffff')
      rim.addColorStop(0.5, '#c9cdd3')
      rim.addColorStop(1, '#7f868f')
      c.fillStyle = rim
      c.beginPath()
      c.arc(x, y, R, 0, 7)
      c.fill()
      c.restore()
      const face = c.createRadialGradient(x - R * 0.35, y - R * 0.4, R * 0.1, x, y, R * 0.86)
      face.addColorStop(0, '#fbfcfd')
      face.addColorStop(0.6, '#d4d8de')
      face.addColorStop(1, '#a9afb7')
      c.fillStyle = face
      c.beginPath()
      c.arc(x, y, R * 0.84, 0, 7)
      c.fill()
      // milled edge
      c.strokeStyle = '#8a909a66'
      c.lineWidth = 1
      for (let k = 0; k < 28; k++) {
        const a = (k / 28) * Math.PI * 2
        c.beginPath()
        c.moveTo(x + Math.cos(a) * R * 0.86, y + Math.sin(a) * R * 0.86)
        c.lineTo(x + Math.cos(a) * R * 0.97, y + Math.sin(a) * R * 0.97)
        c.stroke()
      }
      const col = lc[i % 5]
      const gem = c.createRadialGradient(x - R * 0.15, y - R * 0.18, R * 0.04, x, y, R * 0.42)
      gem.addColorStop(0, '#ffffff')
      gem.addColorStop(0.25, col)
      gem.addColorStop(1, '#00000088')
      c.fillStyle = col
      c.beginPath()
      c.arc(x, y, R * 0.42, 0, 7)
      c.fill()
      c.fillStyle = gem
      c.globalAlpha = 0.65
      c.fill()
      c.globalAlpha = 1
      c.fillStyle = '#ffffff'
      c.font = `${R * 0.62}px 'Lilita One', sans-serif`
      c.textAlign = 'center'
      c.textBaseline = 'middle'
      c.shadowColor = '#0006'
      c.shadowBlur = 2
      c.fillText('?', x, y + R * 0.03)
      c.shadowBlur = 0
    })
    cells.current = boxes.current.map((_, i) => (tk && tk.open[i] ? Array(G * G).fill(true) : Array(G * G).fill(false)))
  }

  useLayoutEffect(paint, [t?.id])
  useEffect(() => {
    const ro = new ResizeObserver(() => paint())
    if (grid.current) ro.observe(grid.current)
    return () => ro.disconnect()
  }, [])
  // spots opened another way (Reveal all) lose their silver too
  useEffect(() => {
    const cv = canvas.current
    if (!cv || !t) return
    const c = cv.getContext('2d')!
    t.open.forEach((o, i) => {
      const b = boxes.current[i]
      if (o && b && !cells.current[i]?.every(Boolean)) {
        clearSpot(c, b)
        cells.current[i] = Array(G * G).fill(true)
      }
    })
  })

  function clearSpot(c: CanvasRenderingContext2D, b: DOMRect) {
    c.save()
    c.globalCompositeOperation = 'destination-out'
    c.fillRect(b.x - 2, b.y - 2, b.width + 4, b.height + 4)
    c.restore()
  }

  /** Scratches at (x, y): erases a ragged blob of silver and opens any spot that is now mostly clear. */
  function scratchAt(x: number, y: number) {
    const cv = canvas.current
    const tk = game.ticket
    if (!cv || !tk || tk.done) return
    const c = cv.getContext('2d')!
    const R = (boxes.current[0]?.width ?? 40) * 0.26
    const now = performance.now()
    if (now - lastScratch > 70 && boxes.current.some((b, i) => !tk.open[i] && x >= b.x && x <= b.right && y >= b.y && y <= b.bottom)) {
      lastScratch = now
      SFX.scratch()
    }
    c.save()
    c.globalCompositeOperation = 'destination-out'
    c.beginPath()
    c.arc(x, y, R * 0.78, 0, 7)
    c.fill()
    for (let k = 0; k < 7; k++) {
      const a = Math.random() * Math.PI * 2
      const d = R * (0.55 + Math.random() * 0.4)
      c.beginPath()
      c.ellipse(x + Math.cos(a) * d, y + Math.sin(a) * d, R * (0.18 + Math.random() * 0.25), R * (0.1 + Math.random() * 0.15), a, 0, 7)
      c.fill()
    }
    c.restore()
    flakes(x, y)
    boxes.current.forEach((b, i) => {
      if (tk.open[i] || x < b.x - R || x > b.right + R || y < b.y - R || y > b.bottom + R) return
      const done = cells.current[i]
      for (let cx = 0; cx < G; cx++)
        for (let cy = 0; cy < G; cy++) {
          const px = b.x + ((cx + 0.5) / G) * b.width
          const py = b.y + ((cy + 0.5) / G) * b.height
          if ((px - x) ** 2 + (py - y) ** 2 <= R * R) done[cx * G + cy] = true
        }
      if (done.filter(Boolean).length / done.length >= OPEN_AT) {
        clearSpot(c, b)
        cells.current[i] = Array(G * G).fill(true)
        game.open(i)
      }
    })
  }

  // silver flakes falling off the coin
  const flakeBox = useRef<HTMLDivElement>(null)
  const lastFlake = useRef(0)
  function flakes(x: number, y: number) {
    const box = flakeBox.current
    const now = performance.now()
    if (!box || now - lastFlake.current < 28 || box.childElementCount > 40) return
    lastFlake.current = now
    for (let k = 0; k < 2; k++) {
      const f = document.createElement('i')
      const s = 3 + Math.random() * 5
      f.style.cssText = `left:${x}px;top:${y}px;width:${s}px;height:${s * (0.5 + Math.random() * 0.6)}px;--fx:${(Math.random() - 0.5) * 50}px;--fy:${20 + Math.random() * 40}px;--fr:${Math.random() * 540 - 270}deg;background:${Math.random() < 0.5 ? '#e8ebef' : '#aab0b8'}`
      f.addEventListener('animationend', () => f.remove())
      box.appendChild(f)
    }
  }

  // the coin that follows the pointer, tilting with the stroke
  const coin = useRef<HTMLDivElement>(null)
  const moveCoin = (p: { x: number; y: number }, on: boolean, dx = 0) => {
    const el = coin.current
    if (!el) return
    el.style.transform = `translate(${p.x}px,${p.y}px) translate(-50%,-50%) rotate(${Math.max(-35, Math.min(35, dx * 3)) - 20}deg)`
    el.classList.toggle('on', on)
  }
  const at = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  /** Scratches along the line from the last point to this one, so fast strokes leave no gaps. */
  const drag = (e: React.PointerEvent) => {
    if (!last.current) return
    const p = at(e)
    const a = last.current
    const len = Math.hypot(p.x - a.x, p.y - a.y)
    const step = 4
    for (let d = step; d <= len; d += step) scratchAt(a.x + ((p.x - a.x) * d) / len, a.y + ((p.y - a.y) * d) / len)
    scratchAt(p.x, p.y)
    moveCoin(p, true, p.x - a.x)
    last.current = p
  }
  const live = !!t && !t.done

  return (
    <>
      <canvas
        ref={canvas}
        className={'foil' + (t && !t.done ? ' live' : '')}
        onPointerDown={e => {
          if (!game.ticket || game.ticket.done) return
          ;(e.target as Element).setPointerCapture(e.pointerId)
          last.current = at(e)
          scratchAt(last.current.x, last.current.y)
          moveCoin(last.current, true)
          coin.current?.classList.add('down')
        }}
        onPointerMove={e => {
          if (last.current) return drag(e)
          if (e.pointerType === 'mouse' && game.ticket && !game.ticket.done) moveCoin(at(e), true)
        }}
        onPointerUp={e => {
          last.current = null
          moveCoin(at(e), e.pointerType === 'mouse' && live)
          coin.current?.classList.remove('down')
        }}
        onPointerLeave={() => coin.current?.classList.remove('on', 'down')}
        onPointerCancel={() => {
          last.current = null
          coin.current?.classList.remove('on', 'down')
        }}
        aria-hidden="true"
      />
      <div className="flakes" ref={flakeBox} aria-hidden="true" />
      <div className="coin" ref={coin} aria-hidden="true">
        <span>5</span>
      </div>
    </>
  )
}
