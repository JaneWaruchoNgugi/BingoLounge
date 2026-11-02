import { useEffect, useLayoutEffect, useRef } from 'react'
import { game, useGame } from './game'
import { SFX } from './audio/sfx'

const SUB = 5
let lastRasp = 0
const NEED = 0.55

/**
 * The foil over the 24 spots: one canvas, painted spot by spot. Dragging scratches it away; once
 * enough of a spot is scratched, the spot opens and its foil is cleared.
 */
export function Foil({ grid }: { grid: React.RefObject<HTMLDivElement> }) {
  const g = useGame()
  const cv = useRef<HTMLCanvasElement>(null)
  const rects = useRef<DOMRect[]>([])
  const cover = useRef<boolean[][]>([])
  const last = useRef<{ x: number; y: number } | null>(null)
  const t = g.ticket

  /** measure the spots and paint fresh foil over every closed one */
  const paint = () => {
    const c = cv.current
    const box = grid.current
    if (!c || !box) return
    const br = box.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    c.width = br.width * dpr
    c.height = br.height * dpr
    const x = c.getContext('2d')!
    x.setTransform(dpr, 0, 0, dpr, 0, 0)
    rects.current = [...box.querySelectorAll<HTMLElement>('.spot')].map(el => {
      const r = el.getBoundingClientRect()
      return new DOMRect(r.left - br.left, r.top - br.top, r.width, r.height)
    })
    const tk = game.ticket
    // one holographic foil sheet over the whole panel, with a raised coin over each spot
    const W = br.width
    const H = br.height
    const gr = x.createLinearGradient(0, 0, W, H)
    gr.addColorStop(0, '#c4c8ce')
    gr.addColorStop(0.2, '#f4f5f7')
    gr.addColorStop(0.42, '#a7adb5')
    gr.addColorStop(0.6, '#eceef1')
    gr.addColorStop(0.82, '#b3b8c0')
    gr.addColorStop(1, '#e2e5e9')
    x.fillStyle = gr
    x.beginPath()
    x.roundRect(0, 0, W, H, 10)
    x.fill()
    // rainbow sheen bands, like a hologram
    x.save()
    x.globalCompositeOperation = 'overlay'
    const rb = x.createLinearGradient(0, H, W, 0)
    ;['#ff5fa2', '#ffcf4a', '#5fe3a1', '#4fc3ff', '#b06bff', '#ff5fa2', '#ffcf4a'].forEach((c, k, arr) => rb.addColorStop(k / (arr.length - 1), c))
    x.globalAlpha = 0.38
    x.fillStyle = rb
    x.fillRect(0, 0, W, H)
    x.restore()
    // fine guilloche waves printed on the foil
    x.save()
    x.strokeStyle = '#ffffff70'
    x.lineWidth = 0.8
    for (let k = -4; k < H / 9 + 4; k++) {
      x.beginPath()
      for (let px = 0; px <= W; px += 6) {
        const py = k * 9 + Math.sin(px / 22 + k * 0.6) * 4 + Math.sin(px / 57) * 3
        px ? x.lineTo(px, py) : x.moveTo(px, py)
      }
      x.stroke()
    }
    x.restore()
    // glints
    for (let k = 0; k < (W * H) / 900; k++) {
      const px = (k * 7919) % W
      const py = (k * 104729) % H
      x.fillStyle = '#ffffff'
      x.globalAlpha = 0.35 + ((k * 13) % 50) / 100
      x.beginPath()
      x.arc(px, py, k % 7 ? 0.7 : 1.4, 0, 7)
      x.fill()
      if (k % 23 === 0) {
        x.fillRect(px - 4, py - 0.4, 8, 0.8)
        x.fillRect(px - 0.4, py - 4, 0.8, 8)
      }
    }
    x.globalAlpha = 1
    const GEM = ['#22b8f0', '#ff4f7b', '#ffb320', '#a35cff', '#22c77a']
    rects.current.forEach((r, i) => {
      if (tk && tk.open[i]) return x.clearRect(r.x - 2, r.y - 2, r.width + 4, r.height + 4)
      const cx = r.x + r.width / 2
      const cy = r.y + r.height / 2
      const R = r.width * 0.45
      // drop shadow and bevelled metal rim
      x.save()
      x.shadowColor = '#00000055'
      x.shadowBlur = 6
      x.shadowOffsetY = 2
      const rim = x.createLinearGradient(cx - R, cy - R, cx + R, cy + R)
      rim.addColorStop(0, '#ffffff')
      rim.addColorStop(0.5, '#c9cdd3')
      rim.addColorStop(1, '#7f868f')
      x.fillStyle = rim
      x.beginPath()
      x.arc(cx, cy, R, 0, 7)
      x.fill()
      x.restore()
      // the coin face
      const face = x.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R * 0.86)
      face.addColorStop(0, '#fbfcfd')
      face.addColorStop(0.6, '#d4d8de')
      face.addColorStop(1, '#a9afb7')
      x.fillStyle = face
      x.beginPath()
      x.arc(cx, cy, R * 0.84, 0, 7)
      x.fill()
      // milled edge ticks
      x.strokeStyle = '#8a909a66'
      x.lineWidth = 1
      for (let k = 0; k < 28; k++) {
        const a2 = (k / 28) * Math.PI * 2
        x.beginPath()
        x.moveTo(cx + Math.cos(a2) * R * 0.86, cy + Math.sin(a2) * R * 0.86)
        x.lineTo(cx + Math.cos(a2) * R * 0.97, cy + Math.sin(a2) * R * 0.97)
        x.stroke()
      }
      // a coloured gem in the middle, with a question mark
      const gc = GEM[i % 5]
      const gem = x.createRadialGradient(cx - R * 0.15, cy - R * 0.18, R * 0.04, cx, cy, R * 0.42)
      gem.addColorStop(0, '#ffffff')
      gem.addColorStop(0.25, gc)
      gem.addColorStop(1, '#00000088')
      x.fillStyle = gc
      x.beginPath()
      x.arc(cx, cy, R * 0.42, 0, 7)
      x.fill()
      x.fillStyle = gem
      x.globalAlpha = 0.65
      x.fill()
      x.globalAlpha = 1
      x.fillStyle = '#ffffff'
      x.font = `${R * 0.62}px 'Lilita One', sans-serif`
      x.textAlign = 'center'
      x.textBaseline = 'middle'
      x.shadowColor = '#0006'
      x.shadowBlur = 2
      x.fillText('?', cx, cy + R * 0.03)
      x.shadowBlur = 0
    })
    cover.current = rects.current.map((_, i) => (tk && tk.open[i] ? Array(SUB * SUB).fill(true) : Array(SUB * SUB).fill(false)))
  }

  useLayoutEffect(paint, [t?.id])
  useEffect(() => {
    const ro = new ResizeObserver(() => paint())
    if (grid.current) ro.observe(grid.current)
    return () => ro.disconnect()
  }, [])
  // spots opened another way (Reveal all): clear their foil
  useEffect(() => {
    const c = cv.current
    if (!c || !t) return
    const x = c.getContext('2d')!
    t.open.forEach((o, i) => {
      const r = rects.current[i]
      if (o && r && !cover.current[i]?.every(Boolean)) {
        clearSpot(x, r)
        cover.current[i] = Array(SUB * SUB).fill(true)
      }
    })
  })

  function clearSpot(x: CanvasRenderingContext2D, r: DOMRect) {
    x.save()
    x.globalCompositeOperation = 'destination-out'
    x.fillRect(r.x - 2, r.y - 2, r.width + 4, r.height + 4)
    x.restore()
  }

  function scratchAt(px: number, py: number) {
    const c = cv.current
    const tk = game.ticket
    if (!c || !tk || tk.done) return
    const x = c.getContext('2d')!
    const rad = (rects.current[0]?.width ?? 40) * 0.26
    // a rasp at most every 70 ms while the coin is moving over foil
    const now = performance.now()
    if (now - lastRasp > 70 && rects.current.some((r, i) => !tk.open[i] && px >= r.x && px <= r.right && py >= r.y && py <= r.bottom)) {
      lastRasp = now
      SFX.scratch()
    }
    // a rough-edged scrape: a solid core plus jittered nicks around it
    x.save()
    x.globalCompositeOperation = 'destination-out'
    x.beginPath()
    x.arc(px, py, rad * 0.78, 0, 7)
    x.fill()
    for (let k = 0; k < 7; k++) {
      const a = Math.random() * Math.PI * 2
      const d = rad * (0.55 + Math.random() * 0.4)
      x.beginPath()
      x.ellipse(px + Math.cos(a) * d, py + Math.sin(a) * d, rad * (0.18 + Math.random() * 0.25), rad * (0.1 + Math.random() * 0.15), a, 0, 7)
      x.fill()
    }
    x.restore()
    flake(px, py)
    rects.current.forEach((r, i) => {
      if (tk.open[i]) return
      if (px < r.x - rad || px > r.right + rad || py < r.y - rad || py > r.bottom + rad) return
      const cv2 = cover.current[i]
      for (let a = 0; a < SUB; a++)
        for (let b = 0; b < SUB; b++) {
          const cx = r.x + ((a + 0.5) / SUB) * r.width
          const cy = r.y + ((b + 0.5) / SUB) * r.height
          if ((cx - px) ** 2 + (cy - py) ** 2 <= rad * rad) cv2[a * SUB + b] = true
        }
      if (cv2.filter(Boolean).length / cv2.length >= NEED) {
        clearSpot(x, r)
        cover.current[i] = Array(SUB * SUB).fill(true)
        game.open(i)
      }
    })
  }

  /** silver flakes that fall off the foil where the coin scrapes */
  const flakes = useRef<HTMLDivElement>(null)
  const lastFlake = useRef(0)
  function flake(px: number, py: number) {
    const box = flakes.current
    const now = performance.now()
    if (!box || now - lastFlake.current < 28 || box.childElementCount > 40) return
    lastFlake.current = now
    for (let k = 0; k < 2; k++) {
      const f = document.createElement('i')
      const sz = 3 + Math.random() * 5
      f.style.cssText = `left:${px}px;top:${py}px;width:${sz}px;height:${sz * (0.5 + Math.random() * 0.6)}px;--fx:${(Math.random() - 0.5) * 50}px;--fy:${20 + Math.random() * 40}px;--fr:${Math.random() * 540 - 270}deg;background:${Math.random() < 0.5 ? '#e8ebef' : '#aab0b8'}`
      f.addEventListener('animationend', () => f.remove())
      box.appendChild(f)
    }
  }
  /** the coin the player scrapes with: follows the pointer and tilts with the stroke */
  const coin = useRef<HTMLDivElement>(null)
  const showCoin = (p: { x: number; y: number }, on: boolean, dx = 0) => {
    const c = coin.current
    if (!c) return
    c.style.transform = `translate(${p.x}px,${p.y}px) translate(-50%,-50%) rotate(${Math.max(-35, Math.min(35, dx * 3)) - 20}deg)`
    c.classList.toggle('on', on)
  }

  const pos = (e: React.PointerEvent) => {
    const r = cv.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const move = (e: React.PointerEvent) => {
    if (!last.current) return
    const p = pos(e)
    const l = last.current
    const d = Math.hypot(p.x - l.x, p.y - l.y)
    const step = 4
    for (let s = step; s <= d; s += step) scratchAt(l.x + ((p.x - l.x) * s) / d, l.y + ((p.y - l.y) * s) / d)
    scratchAt(p.x, p.y)
    showCoin(p, true, p.x - l.x)
    last.current = p
  }

  const live = !!t && !t.done
  return (
    <>
    <canvas
      ref={cv}
      className={'foil' + (t && !t.done ? ' live' : '')}
      onPointerDown={e => {
        if (!game.ticket || game.ticket.done) return
        ;(e.target as Element).setPointerCapture(e.pointerId)
        last.current = pos(e)
        scratchAt(last.current.x, last.current.y)
        showCoin(last.current, true)
        coin.current?.classList.add('down')
      }}
      onPointerMove={e => {
        if (last.current) return move(e)
        // hovering with a mouse: the coin floats over the foil, ready
        if (e.pointerType === 'mouse' && game.ticket && !game.ticket.done) showCoin(pos(e), true)
      }}
      onPointerUp={e => {
        last.current = null
        showCoin(pos(e), e.pointerType === 'mouse' && live)
        coin.current?.classList.remove('down')
      }}
      onPointerLeave={() => coin.current?.classList.remove('on', 'down')}
      onPointerCancel={() => {
        last.current = null
        coin.current?.classList.remove('on', 'down')
      }}
      aria-hidden="true"
    />
    <div className="flakes" ref={flakes} aria-hidden="true" />
    <div className="coin" ref={coin} aria-hidden="true">
      <span>5</span>
    </div>
    </>
  )
}
