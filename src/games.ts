/** The games in the lobby. Each one is a single-file build at public/games/<id>.html with a poster at public/img/posters/<id>.webp. */
export type Kind = 'live' | 'instant' | 'hybrid'

export interface Game {
  id: string
  name: string
  kind: Kind
  isNew?: boolean
  blurb: string
  facts: string[]
  /** a poster in public/img/posters/<id>.webp; a game without one shows its name over a screenshot in public/thumbs/<id>.webp */
  poster?: boolean
}

export const KIND_LABEL: Record<Kind, string> = { live: 'Live draw', instant: 'Instant', hybrid: 'Hybrid' }

export const GAMES: Game[] = [
  {
    id: 'scratch-bingo',
    poster: true,
    name: 'Scratch Bingo',
    kind: 'instant',
    isNew: true,
    blurb: 'Scratch 30 calls off the foil and daub your cards. Lines and matches both pay.',
    facts: ['75-ball', '30 calls', '1–2 cards', 'KES 10–100'],
  },
  {
    id: 'flip-bingo',
    poster: true,
    name: 'Flip Bingo',
    kind: 'instant',
    isNew: true,
    blurb: 'Flip ice tiles to call your own numbers. Each hit grows the pot, but a crack ends the game. Collect whenever you like.',
    facts: ['Solo', '40 tiles', 'Easy · Medium · Hard'],
  },
  {
    id: 'reel-bingo',
    poster: true,
    name: 'Reel Bingo',
    kind: 'hybrid',
    isNew: true,
    blurb: 'Five slot reels, one per BINGO column. Each of the 7 spins calls five numbers at once.',
    facts: ['75-ball', '5 reels', '7 spins', 'Up to 4 cards'],
  },
  {
    id: 'deal-bingo',
    poster: true,
    name: 'Deal Bingo',
    kind: 'hybrid',
    isNew: true,
    blurb: 'The dealer turns 36 playing cards on blue felt. Each card calls a number, and its suit is the letter. Face cards give every card a free daub.',
    facts: ['75-ball', '12 hands', 'Face-card daubs'],
  },
  {
    id: 'quick-bingo',
    poster: true,
    name: 'Quick Bingo',
    kind: 'live',
    blurb: 'The classic hall round: buy before the timer ends, then watch six pipes drop the balls.',
    facts: ['75-ball', '36 calls', '6 pipes', 'Up to 4 cards'],
  },
  {
    id: 'bingo35',
    poster: true,
    name: 'Bingo 35',
    kind: 'live',
    blurb: 'A faster round with 35 calls through five tubes. Lines pay by how many you complete.',
    facts: ['75-ball', '35 calls', '5 tubes'],
  },
  {
    id: 'bingo90',
    poster: true,
    name: 'Bingo 90',
    kind: 'live',
    blurb: 'Traditional 90-ball strips. Every card pays from one line up to five.',
    facts: ['90-ball', '56 calls', '1–5 lines'],
  },
]

export const FEATURED_ID = 'scratch-bingo'

const base = import.meta.env.BASE_URL
export const gameUrl = (id: string) => `${base}games/${id}.html`
export const thumbUrl = (id: string) => `${base}thumbs/${id}.webp`
export const posterUrl = (id: string) => `${base}img/posters/${id}.webp`
export const imgUrl = (file: string) => `${base}img/${file}`
