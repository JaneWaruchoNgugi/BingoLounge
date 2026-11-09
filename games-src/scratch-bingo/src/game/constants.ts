/** Scratch spots on a ticket. */
export const SPOTS = 30
/** Prices of the cards on offer in the picker, in KES (one card per slot). */
export const PRICES = [10, 20, 20, 50, 50, 100]
/** Line prizes: [lines, × stake]. */
export const LINE_PAYS: [number, number][] = [
  [1, 2.5],
  [2, 15],
  [3, 150],
]
/** Number prizes start at this many card numbers matched… */
export const MATCH_MIN = 10
const MATCH_BASE = 0.5
export const MATCH_STEP = 0.15
/** …and pay × stake from 0.5 at 10 matches, +0.15 for each one after, up to all 24. */
export const MATCH_PAYS: [number, number][] = Array.from({ length: 24 - MATCH_MIN + 1 }, (_, i) => [MATCH_MIN + i, MATCH_BASE + MATCH_STEP * i])
/** Letter colours: B blue, I pink, N amber, G purple, O green. */
export const LC = ['#22b8f0', '#ff4f7b', '#ffb320', '#a35cff', '#22c77a']
export const START_POINTS = 2450
/** Cards in the picker. */
export const POOL = PRICES.length
/** Quick play: tap a price for cards all at that price. */
export const QUICK_PRICES = [10, 20, 50, 100]
/** Cards a ticket holds unless the player changes it (1–2). */
export const MAX_CARDS = 2
/** Chance a ticket hides the ★ star, a free daub the player places. */
export const STAR_CHANCE = 1 / 40
/** A win of at least this many times the ticket price gets the full-screen big-win show. */
export const BIG_WIN_X = 10

/** The 12 lines of a 5×5 card as cell indexes (row-major): rows, columns, two diagonals. */
export const LINES: number[][] = [
  ...[0, 1, 2, 3, 4].map(r => [0, 1, 2, 3, 4].map(c => r * 5 + c)),
  ...[0, 1, 2, 3, 4].map(c => [0, 1, 2, 3, 4].map(r => r * 5 + c)),
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
]

export const rnd = (n: number) => Math.floor(Math.random() * n)

export const shuffle = <T,>(a: T[]) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Column 0–4 (B I N G O) of a number. */
export const colOf = (n: number) => Math.floor((n - 1) / 15)
