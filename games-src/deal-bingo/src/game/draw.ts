import { MAXCALL, PER, rnd } from './constants'

/**
 * Deal Bingo's draw: each hand the dealer deals PER cards from the shoe. A number card calls its
 * number (its suit is its letter). A face card (J, Q or K) calls nothing: every card gets a free
 * daub in the face card's letter.
 */
export const BATCHES = MAXCALL / PER
export const BATCH_GAP = 1300
export const FALLBACK_MS = 2000
export const GAME_INTRO = `Dealer is live: ${BATCHES} hands of ${PER} cards. A J, Q or K is wild: a free daub in its letter!`
/** chance a dealt card is a face card */
const FACE_P = 1 / 13
const RANKS = ['J', 'Q', 'K']

export interface Item {
  n: number
  col: number
  wild?: number
  /** set on a face card */
  rank?: string
}
export interface Batch {
  items: Item[]
}

export function makeBatch(called: Set<number>, hot: Set<number>): Batch {
  const taken = new Set(called)
  const items: Item[] = []
  for (let k = 0; k < PER; k++) {
    if (Math.random() < FACE_P) {
      const col = rnd(5)
      items.push({ n: -1, col, wild: col, rank: RANKS[rnd(3)] })
      continue
    }
    const left: number[] = []
    for (let n = 1; n <= 75; n++) if (!taken.has(n)) left.push(n)
    const w = left.map(n => (hot.has(n) ? 3 : 1))
    let r = Math.random() * w.reduce((a, b) => a + b, 0)
    let n = left[left.length - 1]
    for (let i = 0; i < left.length; i++) {
      r -= w[i]
      if (r <= 0) {
        n = left[i]
        break
      }
    }
    taken.add(n)
    items.push({ n, col: Math.floor((n - 1) / 15) })
  }
  return { items }
}
