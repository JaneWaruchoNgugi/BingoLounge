import { useSyncExternalStore } from 'react'
import { SFX } from './audio/sfx'

/**
 * Scratch Bingo: an instant ticket. Each ticket has a bingo card and 30 foil spots, each hiding a
 * called number. Scratch the spots: every number on your card is daubed. The ticket pays the better
 * of its line prize and its match prize. The outcome is fixed when the ticket is bought.
 */
export const SPOTS = 30
/** the price of each card in the picker, cheapest first: dearer cards pay bigger prizes */
export const PRICES = [10, 20, 20, 50, 50, 100]
/** × stake by completed lines (the last entry is "or more") */
export const LINE_PAY: [number, number][] = [
  [1, 2.5],
  [2, 15],
  [3, 150],
]
/** × stake by numbers matched on the card: 10 matched pays half the card price, and each extra number adds 0.15 */
export const MATCH_FROM = 10
export const MATCH_BASE = 0.5
export const MATCH_STEP = 0.15
export const MATCH_PAY: [number, number][] = Array.from({ length: 24 - MATCH_FROM + 1 }, (_, k) => [MATCH_FROM + k, MATCH_BASE + MATCH_STEP * k])
export const LC = ['#22b8f0', '#ff4f7b', '#ffb320', '#a35cff', '#22c77a']
export const START_POINTS = 2450
/** cards offered in the picker, and how many one ticket can take */
export const POOL = PRICES.length
/** quick buy: two cards at one of these prices */
export const QUICK_PRICES = [10, 20, 50, 100]
export const MAX_CARDS = 2
/** chance that one of the 30 spots hides a bonus star instead of a number (see tools/sim_star.py) */
export const STAR_CHANCE = 1 / 40
/** a win of at least this many times the ticket price gets the full-screen celebration */
export const BIG_WIN = 10

const LINES = [
  ...[0, 1, 2, 3, 4].map(r => [0, 1, 2, 3, 4].map(c => r * 5 + c)),
  ...[0, 1, 2, 3, 4].map(c => [0, 1, 2, 3, 4].map(r => r * 5 + c)),
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20],
]
const rnd = (n: number) => Math.floor(Math.random() * n)
const shuffle = <T,>(a: T[]) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
export const colOf = (n: number) => Math.floor((n - 1) / 15)

function makeCard(): number[] {
  const cols = [0, 1, 2, 3, 4].map(c => shuffle(Array.from({ length: 15 }, (_, k) => c * 15 + k + 1)).slice(0, 5).sort((a, b) => a - b))
  const g: number[] = []
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) g.push(r === 2 && c === 2 ? 0 : cols[c][r])
  return g
}
const tierOf = (table: [number, number][], v: number) => [...table].reverse().find(([k]) => v >= k)?.[1] ?? 0

/** Lines and matches of `card` against the numbers in `m`, and what that pays (× stake). */
export function score(card: number[], m: Set<number>) {
  const marked = new Set(m)
  marked.add(0)
  const lines = LINES.filter(L => L.every(k => marked.has(card[k])))
  const matches = card.filter(n => n && m.has(n)).length
  const lx = tierOf(LINE_PAY, lines.length)
  const mx = tierOf(MATCH_PAY, matches)
  return { lines, matches, lx, mx, x: Math.max(lx, mx) }
}

/** the lines on `card` that are one cell short of done, and that missing cell, given the marked numbers */
export function nearLines(card: number[], m: Set<number>) {
  const marked = new Set(m)
  marked.add(0)
  const cells = new Set<number>()
  const missing = new Set<number>()
  for (const L of LINES) {
    const open = L.filter(k => !marked.has(card[k]))
    if (open.length !== 1) continue
    L.forEach(k => cells.add(k))
    missing.add(open[0])
  }
  return { cells, missing }
}

export interface Ticket {
  id: number
  /** one or two bingo cards, all played against the same spots */
  cards: number[][]
  spots: number[]
  open: boolean[]
  /** the price of each card (prizes are multiples of it) */
  stakes: number[]
  /** what each card pays, worked out when the ticket is finished */
  wins: number[]
  /** the spot holding the bonus star (its number is 0), or -1 */
  star: number
  /** where the player put the star: card k, cell i */
  starAt: { k: number; i: number } | null
  /** total paid */
  win: number
  done: boolean
}
export interface Result { id: number; txt: string; win: boolean }

function load(k: string) {
  try {
    return localStorage.getItem('scratch-' + k) !== '0'
  } catch {
    return true
  }
}
function save(k: string, v: boolean) {
  try {
    localStorage.setItem('scratch-' + k, v ? '1' : '0')
  } catch {
    /* storage unavailable */
  }
}

class Game {
  pts = START_POINTS
  /** the card picker: cards on offer, which are taken (in order), the one in front, and whether it is open */
  pool: number[][] = []
  prices = PRICES
  picked: number[] = []
  idx = 0
  pickOpen = false
  ticket: Ticket | null = null
  history: Result[] = []
  sound = load('sfx')
  music = load('music')
  /** a spot that just matched the card */
  pop = -1
  private uid = 0
  private version = 0
  private ls = new Set<() => void>()
  subscribe = (l: () => void) => {
    this.ls.add(l)
    return () => this.ls.delete(l)
  }
  get = () => this.version
  emit() {
    this.version++
    this.ls.forEach(l => l())
  }

  /** the numbers marked on card k: the opened spots, plus the cell the star went on */
  marks(k: number) {
    const t = this.ticket
    const m = this.revealed
    if (t?.starAt && t.starAt.k === k) m.add(t.cards[k][t.starAt.i])
    return m
  }
  /** the star is uncovered but not placed yet */
  get starWaiting() {
    const t = this.ticket
    return !!t && !t.done && t.star >= 0 && t.open[t.star] && !t.starAt
  }
  /** put the star on cell i of card k (a cell not marked yet) */
  placeStar(k: number, i: number) {
    const t = this.ticket
    if (!t || !this.starWaiting) return
    const n = t.cards[k][i]
    if (!n || this.revealed.has(n)) return
    t.starAt = { k, i }
    SFX.star(3)
    setTimeout(() => SFX.hit(), 120)
    if (t.open.every(Boolean)) this.finish()
    this.emit()
  }
  /** test hook: the next ticket hides a star */
  forceStar = false

  get revealed() {
    const t = this.ticket
    return new Set(t ? t.spots.filter((_, i) => t.open[i]) : [])
  }
  /** what the cards taken in the picker cost together */
  get price() {
    return this.picked.reduce((a, i) => a + this.prices[i], 0)
  }
  get canBuy() {
    return this.pickOpen && this.picked.length > 0 && this.price <= this.pts && (!this.ticket || this.ticket.done)
  }

  // ---- card picker ----
  openPicker() {
    if (this.ticket && !this.ticket.done) return
    this.pool = Array.from({ length: POOL }, makeCard)
    this.prices = PRICES
    this.quick = 0
    this.picked = []
    this.idx = 0
    this.limitKey = 0
    this.pickOpen = true
    SFX.deal()
    this.emit()
  }
  /** quick buy: deal cards all at `price`, with the first two already taken, ready to approve */
  openQuick(price: number) {
    if ((this.ticket && !this.ticket.done) || price * this.maxCards > this.pts) return
    this.pool = Array.from({ length: POOL }, makeCard)
    this.prices = Array(POOL).fill(price)
    this.quick = price
    this.picked = Array.from({ length: this.maxCards }, (_, k) => k)
    this.idx = 0
    this.limitKey = 1
    this.pickOpen = true
    SFX.deal()
    setTimeout(() => SFX.coin(), 200)
    this.emit()
  }
  /** the price of a quick buy in progress (0 for a normal pick) */
  quick = 0
  /** cards per ticket the player chose (the 1 card / 2 cards radio): quick buy deals this many, the picker allows this many */
  maxCards = MAX_CARDS
  setMax(n: number) {
    if (n === this.maxCards) return
    this.maxCards = n
    // keep only as many taken cards as the new limit allows
    this.picked = this.picked.slice(0, n)
    SFX.pop()
    this.emit()
  }
  closePicker() {
    this.pickOpen = false
    this.emit()
  }
  /** a fresh set of cards to choose from */
  newPool() {
    this.pool = Array.from({ length: POOL }, makeCard)
    this.picked = this.quick ? Array.from({ length: this.maxCards }, (_, k) => k) : []
    SFX.shimmer()
    this.emit()
  }
  go(d: number) {
    this.idx = (((this.idx + d) % POOL) + POOL) % POOL
    SFX.swipe()
    this.emit()
  }
  focus(i: number) {
    if (i === this.idx) return
    this.idx = i
    SFX.swipe()
    this.emit()
  }
  /** take card i, or put it back; at most maxCards. Taking a card slides on to the next free one. */
  pick(i: number) {
    clearTimeout(this.advT)
    const at = this.picked.indexOf(i)
    if (at >= 0) {
      this.picked.splice(at, 1)
      SFX.pop()
      return this.emit()
    }
    if (this.maxCards === 1 && this.picked.length) {
      // one card only: taking another card switches to it
      this.picked = [i]
      SFX.coin()
      return this.emit()
    }
    if (this.picked.length >= this.maxCards) {
      // the limit: shake the badge and say so
      this.limitKey++
      SFX.near()
      return this.emit()
    }
    this.picked.push(i)
    SFX.coin()
    if (this.picked.length >= this.maxCards) {
      this.limitKey++
      setTimeout(() => SFX.shimmer(), 250)
    }
    this.emit()
    // move on to the next card nobody has taken yet
    if (this.picked.length < this.maxCards)
      this.advT = window.setTimeout(() => {
        if (!this.pickOpen || this.idx !== i) return
        for (let d = 1; d < POOL; d++) {
          const j = (i + d) % POOL
          if (!this.picked.includes(j)) return this.go(j - i > POOL / 2 ? j - i - POOL : j - i)
        }
      }, 420)
  }
  /** bumps when the card limit is hit, to replay its animation */
  limitKey = 0
  private advT: number | undefined

  buy() {
    if (!this.canBuy) return
    const cards = this.picked.map(i => this.pool[i])
    this.pickOpen = false
    // the calls are drawn only now, after the cards were approved
    const hasStar = this.forceStar || Math.random() < STAR_CHANCE
    this.forceStar = false
    const spots = shuffle(Array.from({ length: 75 }, (_, k) => k + 1)).slice(0, SPOTS - (hasStar ? 1 : 0))
    const star = hasStar ? rnd(SPOTS) : -1
    if (hasStar) spots.splice(star, 0, 0)
    const stakes = this.picked.map(i => this.prices[i])
    this.pts -= this.price
    this.ticket = { id: ++this.uid, cards, spots, open: spots.map(() => false), stakes, wins: cards.map(() => 0), win: 0, done: false, star, starAt: null }
    this.pop = -1
    this.nearN = 0
    SFX.deal()
    this.emit()
  }

  open(i: number) {
    const t = this.ticket
    if (!t || t.done || t.open[i]) return
    t.open[i] = true
    const n = t.spots[i]
    if (n === 0) {
      this.pop = i
      SFX.star(2)
      setTimeout(() => SFX.shimmer(), 300)
    } else if (t.cards.some(c => c.includes(n))) {
      this.pop = i
      SFX.hit()
      this.nearCheck(n)
    } else SFX.ding(colOf(n))
    if (t.open.every(Boolean) && !this.starWaiting) this.finish()
    this.emit()
  }
  /** a heartbeat when the number just opened leaves a line one cell short */
  private nearN = 0
  private nearCheck(n: number) {
    const t = this.ticket!
    if (!t.cards.some(c => c.includes(n))) return
    const total = t.cards.reduce((a, c, k) => a + nearLines(c, this.marks(k)).missing.size, 0)
    if (total > this.nearN && !t.open.every(Boolean)) setTimeout(() => SFX.near(), 250)
    this.nearN = total
  }

  revealAll() {
    const t = this.ticket
    if (!t || t.done) return
    t.open = t.open.map(() => true)
    if (!this.starWaiting) this.finish()
    this.emit()
  }

  private finish() {
    const t = this.ticket!
    t.wins = t.cards.map((c, k) => Math.round(t.stakes[k] * score(c, this.marks(k)).x))
    t.win = t.wins.reduce((a, b) => a + b, 0)
    t.done = true
    this.pts += t.win
    this.history.unshift({ id: ++this.uid, txt: t.win ? `KES ${t.win}` : 'No win', win: t.win > 0 })
    if (this.history.length > 8) this.history.length = 8
    if (t.win) {
      SFX.bingo()
      setTimeout(() => SFX.cheer(true), 500)
    } else SFX.aww()
  }

  toggleSound() {
    this.sound = !this.sound
    SFX.set('sfx', this.sound)
    save('sfx', this.sound)
    this.emit()
  }
  toggleMusic() {
    this.music = !this.music
    SFX.set('music', this.music)
    save('music', this.music)
    this.emit()
  }
}

export const game = new Game()
SFX.set('sfx', game.sound)
SFX.set('music', game.music)
// the music gets busier while a ticket is being scratched
SFX.bindDrawing(() => !!game.ticket && !game.ticket.done)
// browsers only allow sound after a tap or key press: start (or resume) audio on the first one
const unlock = () => SFX.init()
window.addEventListener('pointerdown', unlock, { capture: true })
window.addEventListener('keydown', unlock, { capture: true })
export function useGame() {
  useSyncExternalStore(game.subscribe, game.get)
  return game
}
if (import.meta.env.DEV || location.search.includes('test')) (window as unknown as { __game: Game }).__game = game
