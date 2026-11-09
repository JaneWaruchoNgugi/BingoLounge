import { SFX } from '../audio/sfx'
import { LINE_PAYS, LINES, MATCH_PAYS, MAX_CARDS, POOL, PRICES, SPOTS, STAR_CHANCE, START_POINTS, colOf, rnd, shuffle } from './constants'

/**
 * A bought ticket: up to two cards, the 30 numbers under the silver (0 = the bonus star),
 * which spots are scratched, and what each card won.
 */
export interface Ticket {
  id: number
  cards: number[][]
  spots: number[]
  open: boolean[]
  stakes: number[]
  wins: number[]
  win: number
  done: boolean
  /** spot index of the bonus star, or -1 */
  star: number
  /** where the player put the star: card k, cell i */
  starAt: { k: number; i: number } | null
}
export interface HistoryRow { id: number; txt: string; win: boolean }

/** A fresh card: 25 cells row-major, five numbers per column, 0 = the free centre. */
export function makeCard(): number[] {
  const cols = [0, 1, 2, 3, 4].map(c =>
    shuffle(Array.from({ length: 15 }, (_, i) => c * 15 + i + 1))
      .slice(0, 5)
      .sort((a, b) => a - b),
  )
  const card: number[] = []
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) card.push(r === 2 && c === 2 ? 0 : cols[c][r])
  return card
}

/** The pay of the highest step of a [count, pay] table that `n` reaches (0 if none). */
const payFor = (table: [number, number][], n: number) => [...table].reverse().find(([k]) => n >= k)?.[1] ?? 0

/** How card `card` does with numbers `got`: its finished lines, matches and best prize (× stake). */
export function score(card: number[], got: Set<number>) {
  const m = new Set(got)
  m.add(0)
  const lines = LINES.filter(l => l.every(i => m.has(card[i])))
  const matches = card.filter(n => n && got.has(n)).length
  const lx = payFor(LINE_PAYS, lines.length)
  const mx = payFor(MATCH_PAYS, matches)
  return { lines, matches, lx, mx, x: Math.max(lx, mx) }
}

/** Lines one number short: their cells (`cells`) and the missing cell of each (`missing`). */
export function nearLines(card: number[], got: Set<number>) {
  const m = new Set(got)
  m.add(0)
  const cells = new Set<number>()
  const missing = new Set<number>()
  for (const l of LINES) {
    const open = l.filter(i => !m.has(card[i]))
    if (open.length === 1) {
      l.forEach(i => cells.add(i))
      missing.add(open[0])
    }
  }
  return { cells, missing }
}

function loadPref(k: string) {
  try {
    return localStorage.getItem('scratch-' + k) !== '0'
  } catch {
    return true
  }
}
function savePref(k: string, on: boolean) {
  try {
    localStorage.setItem('scratch-' + k, on ? '1' : '0')
  } catch {
    /* storage unavailable */
  }
}

/**
 * Scratch Bingo: pick one or two cards, buy a ticket, scratch 30 silver spots to reveal the calls.
 * Each card pays its best prize, by lines or by numbers matched. One ticket in 40 hides a bonus
 * star the player places on any number of their cards.
 */
export class Game {
  pts = START_POINTS
  /** cards on offer in the picker */
  pool: number[][] = []
  prices = PRICES
  /** pool indexes taken, in order */
  picked: number[] = []
  /** card at the front of the picker */
  idx = 0
  pickOpen = false
  ticket: Ticket | null = null
  history: HistoryRow[] = []
  sound = loadPref('sfx')
  music = loadPref('music')
  /** spot that just popped (a hit or the star), for its animation */
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

  /** test hook: the next ticket hides the star */
  forceStar = false
  /** quick buy price, or 0 when picking freely */
  quick = 0
  /** cards per ticket (1 or 2) */
  maxCards = MAX_CARDS
  /** bumps when the card limit is hit, to replay its animation */
  limitKey = 0
  /** lines one short last time, so the "so close" sound only plays when it grows */
  private nearN = 0
  private advT: number | undefined

  /** The numbers revealed, plus the cell card `k` got from the star. */
  marks(k: number) {
    const t = this.ticket
    const s = this.revealed
    if (t?.starAt && t.starAt.k === k) s.add(t.cards[k][t.starAt.i])
    return s
  }
  /** The star is uncovered and waiting to be placed. */
  get starWaiting() {
    const t = this.ticket
    return !!t && !t.done && t.star >= 0 && t.open[t.star] && !t.starAt
  }
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
  get revealed() {
    const t = this.ticket
    return new Set(t ? t.spots.filter((_, i) => t.open[i]) : [])
  }
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
  /** Quick buy: fresh cards all at `price`, the first `maxCards` already taken. */
  openQuick(price: number) {
    if ((this.ticket && !this.ticket.done) || price * this.maxCards > this.pts) return
    this.pool = Array.from({ length: POOL }, makeCard)
    this.prices = Array(POOL).fill(price)
    this.quick = price
    this.picked = Array.from({ length: this.maxCards }, (_, i) => i)
    this.idx = 0
    this.limitKey = 1
    this.pickOpen = true
    SFX.deal()
    setTimeout(() => SFX.coin(), 200)
    this.emit()
  }
  setMax(n: number) {
    if (n === this.maxCards) return
    this.maxCards = n
    this.picked = this.picked.slice(0, n)
    SFX.pop()
    this.emit()
  }
  closePicker() {
    this.pickOpen = false
    this.emit()
  }
  newPool() {
    this.pool = Array.from({ length: POOL }, makeCard)
    this.picked = this.quick ? Array.from({ length: this.maxCards }, (_, i) => i) : []
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
  /** Takes card `i` (or puts it back); with room left, moves on to the next free card. */
  pick(i: number) {
    clearTimeout(this.advT)
    const at = this.picked.indexOf(i)
    if (at >= 0) {
      this.picked.splice(at, 1)
      SFX.pop()
      return this.emit()
    }
    if (this.maxCards === 1 && this.picked.length) {
      this.picked = [i]
      SFX.coin()
      return this.emit()
    }
    if (this.picked.length >= this.maxCards) {
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
    if (this.picked.length < this.maxCards)
      this.advT = window.setTimeout(() => {
        if (!this.pickOpen || this.idx !== i) return
        for (let d = 1; d < POOL; d++) {
          const j = (i + d) % POOL
          if (!this.picked.includes(j)) return this.go(j - i > POOL / 2 ? j - i - POOL : j - i)
        }
      }, 420)
  }

  /** Pays for the picked cards and lays out a fresh ticket of 30 silver spots. */
  buy() {
    if (!this.canBuy) return
    const cards = this.picked.map(i => this.pool[i])
    this.pickOpen = false
    const star = this.forceStar || Math.random() < STAR_CHANCE
    this.forceStar = false
    const spots = shuffle(Array.from({ length: 75 }, (_, i) => i + 1)).slice(0, SPOTS - (star ? 1 : 0))
    const at = star ? rnd(SPOTS) : -1
    if (star) spots.splice(at, 0, 0)
    const stakes = this.picked.map(i => this.prices[i])
    this.pts -= this.price
    this.ticket = {
      id: ++this.uid,
      cards,
      spots,
      open: spots.map(() => false),
      stakes,
      wins: cards.map(() => 0),
      win: 0,
      done: false,
      star: at,
      starAt: null,
    }
    this.pop = -1
    this.nearN = 0
    SFX.deal()
    this.emit()
  }

  // ---- scratching ----
  /** Spot `i` is scratched clear. */
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
  private nearCheck(n: number) {
    const t = this.ticket!
    if (!t.cards.some(c => c.includes(n))) return
    const near = t.cards.reduce((a, c, k) => a + nearLines(c, this.marks(k)).missing.size, 0)
    if (near > this.nearN && !t.open.every(Boolean)) setTimeout(() => SFX.near(), 250)
    this.nearN = near
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

  // ---- settings ----
  toggleSound() {
    this.sound = !this.sound
    SFX.set('sfx', this.sound)
    savePref('sfx', this.sound)
    this.emit()
  }
  toggleMusic() {
    this.music = !this.music
    SFX.set('music', this.music)
    savePref('music', this.music)
    this.emit()
  }
}

export const game = new Game()
SFX.set('sfx', game.sound)
SFX.set('music', game.music)
// the music livens up while a ticket is being scratched
SFX.bindDrawing(() => !!game.ticket && !game.ticket.done)
// browsers only let sound start from a tap or key press
const unlock = () => SFX.init()
window.addEventListener('pointerdown', unlock, { capture: true })
window.addEventListener('keydown', unlock, { capture: true })
