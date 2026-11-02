import { useEffect, useState } from 'react'
import { imgUrl, posterUrl } from '../games'

interface Slide {
  img: string
  alt: string
  /** what tapping the slide does: a game id to play, or a page */
  to: string
}

const SLIDES: Slide[] = [
  { img: imgUrl('hero-new-player.webp'), alt: 'New player offer: 100% bonus up to KSh 1,000. Join now.', to: 'promotions' },
  { img: posterUrl('scratch-bingo'), alt: 'Scratch Bingo: scratch, reveal, win. Play now.', to: 'scratch-bingo' },
  { img: posterUrl('flip-bingo'), alt: 'Flip Bingo: flip ice tiles to call your own numbers. Play now.', to: 'flip-bingo' },
  { img: posterUrl('reel-bingo'), alt: 'Reel Bingo: spin the reels and complete your numbers. Play now.', to: 'reel-bingo' },
  { img: posterUrl('deal-bingo'), alt: 'Deal Bingo: the dealer turns 36 playing cards. Play now.', to: 'deal-bingo' },
]

/** The banner carousel: moves on every 6 seconds, pauses while hovered, dots to jump. */
export function Hero({ go }: { go: (h: string) => void }) {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setTimeout(() => setI(v => (v + 1) % SLIDES.length), 6000)
    return () => clearTimeout(t)
  }, [i, paused])

  return (
    <section className="hero" aria-roledescription="carousel" aria-label="Offers and featured games" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="hero-track" style={{ transform: `translateX(-${i * 100}%)` }}>
        {SLIDES.map((s, k) => (
          <button key={s.img} className="slide" aria-hidden={k !== i} tabIndex={k === i ? 0 : -1} onClick={() => go(s.to)} aria-label={s.alt}>
            <img src={s.img} alt="" loading={k ? 'lazy' : 'eager'} />
          </button>
        ))}
      </div>
      <div className="dots" role="tablist" aria-label="Choose a banner">
        {SLIDES.map((s, k) => (
          <button key={s.img} role="tab" aria-selected={k === i} aria-label={`Banner ${k + 1}`} className={k === i ? 'on' : ''} onClick={() => setI(k)} />
        ))}
      </div>
    </section>
  )
}
