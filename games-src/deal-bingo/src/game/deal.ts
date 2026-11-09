import { MAXCALL, PER, rnd } from './constants'

/** One dealt card: a number, or a court card (J, Q or K) that is wild in one letter's column. */
export interface DealCard {
  /** the number called, or -1 for a court card */
  n: number
  /** column 0–4 (B I N G O) the card belongs to */
  col: number
  /** court cards only: the column that gets a free daub */
  wild?: number
  rank?: string
}

export interface Hand {
  items: DealCard[]
}

/** Hands dealt per round. */
export const HANDS = MAXCALL / PER
/** ms between one hand settling and the next being dealt */
export const HAND_GAP = 1300
/** ms a hand takes when the table isn't on screen to animate it */
export const DEAL_MS = 2000
export const INTRO = `Dealer is live: ${HANDS} hands of ${PER} cards. A J, Q or K is wild: a free daub in its letter!`
/** chance that a dealt card is a court card */
const WILD_CHANCE = 1 / 13
const RANKS = ['J', 'Q', 'K']

/** Deals one hand of PER cards. Numbers not yet called; hot numbers come up 3× as often. */
export function dealHand(called: Set<number>, hot: Set<number>): Hand {
  const ex = new Set(called)
  const items: DealCard[] = []
  for (let k = 0; k < PER; k++) {
    if (Math.random() < WILD_CHANCE) {
      const col = rnd(5)
      items.push({ n: -1, col, wild: col, rank: RANKS[rnd(3)] })
      continue
    }
    const left: number[] = []
    for (let n = 1; n <= 75; n++) if (!ex.has(n)) left.push(n)
    const w = left.map(n => (hot.has(n) ? 3 : 1))
    let r = Math.random() * w.reduce((a, b) => a + b, 0)
    let pick = left[left.length - 1]
    for (let i = 0; i < left.length; i++) {
      r -= w[i]
      if (r <= 0) {
        pick = left[i]
        break
      }
    }
    ex.add(pick)
    items.push({ n: pick, col: Math.floor((pick - 1) / 15) })
  }
  return { items }
}
