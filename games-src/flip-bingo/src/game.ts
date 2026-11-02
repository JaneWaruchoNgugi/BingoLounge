import { useSyncExternalStore } from 'react'
import { SFX } from './audio/sfx'

/**
 * Flip Bingo: a solo, mines-style bingo. The board hides 40 ice tiles: your card's 24 numbers,
 * some decoy numbers and a few cracks. Every tile you flip calls its number. Each hit on your card
 * raises the pot; a crack ends the game and the pot is lost. Each line you complete banks a bonus
 * at once (kept even if you hit a crack). Collect whenever you like.
 */
export const TILES = 40
export const STAKES = [10, 20, 50, 100]
/** the pot is worth stake × RTP before any hit; every hit raises it by the fair odds of that hit */
export const RTP = 0.9
export interface Level {
  cracks: number
  name: string
  /** banked at once for each completed line, × stake */
  line: number
}
export const LEVELS: Level[] = [
  { cracks: 1, name: 'Easy', line: 0.03 },
  { cracks: 3, name: 'Medium', line: 0.25 },
  { cracks: 5, name: 'Hard', line: 1 },
]
export const LC = ['#38bdf8', '#f87171', '#facc15', '#c084fc', '#4ade80']
export const START_POINTS = 2450

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

/** A 5×5 card, row by row; 0 is the free centre. */
function makeCard(): number[] {
  const cols = [0, 1, 2, 3, 4].map(c => shuffle(Array.from({ length: 15 }, (_, k) => c * 15 + k + 1)).slice(0, 5).sort((a, b) => a - b))
  const g: number[] = []
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) g.push(r === 2 && c === 2 ? 0 : cols[c][r])
  return g
}

/** Pot multiplier after `h` hits with `c` cracks on the board. */
export function mult(h: number, c: number) {
  let m = RTP
  for (let i = 0; i < h; i++) m *= (24 - i + c) / (24 - i)
  return m
}

export interface Tile {
  /** the number, or 0 for a crack */
  n: number
  up: boolean
  /** shown after the game ends, not flipped by the player */
  ghost?: boolean
}
export type Phase = 'ready' | 'play' | 'bust' | 'won'
export interface Result { id: number; txt: string; win: boolean }

class Game {
  pts = START_POINTS
  stake = STAKES[1]
  lvl = 1
  card = makeCard()
  tiles: Tile[] = []
  phase: Phase = 'ready'
  hits = 0
  lines = 0
  /** line bonuses banked this game */
  bank = 0
  /** what the last game paid in total */
  paid = 0
  /** a tile that just hit the card or cracked (for effects) */
  last = -1
  /** the card cells that just completed a line */
  flash = new Set<number>()
  history: Result[] = []
  sound = true
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

  get level() {
    return LEVELS[this.lvl]
  }
  get pot() {
    return this.phase === 'play' && this.hits ? Math.round(this.stake * mult(this.hits, this.level.cracks)) : 0
  }
  get nextPot() {
    return Math.round(this.stake * mult((this.phase === 'play' ? this.hits : 0) + 1, this.level.cracks))
  }
  get marked() {
    const m = new Set<number>([0])
    this.tiles.forEach(t => t.up && !t.ghost && t.n && m.add(t.n))
    return m
  }
  /** chance the next flip is a crack */
  get risk() {
    const left = this.tiles.filter(t => !t.up)
    return left.length ? left.filter(t => !t.n).length / left.length : 0
  }

  setStake(v: number) {
    if (this.phase === 'play') return
    this.stake = v
    SFX.pop()
    this.reset()
  }
  setLevel(i: number) {
    if (this.phase === 'play') return
    this.lvl = i
    SFX.pop()
    this.reset()
  }
  newCard() {
    if (this.phase === 'play') return
    this.card = makeCard()
    SFX.swipe()
    this.reset()
  }
  /** clear a finished board, back to ready */
  private reset() {
    if (this.phase !== 'play') {
      this.phase = 'ready'
      this.tiles = []
      this.flash = new Set()
    }
    this.emit()
  }

  start() {
    if (this.phase === 'play' || this.stake > this.pts) return
    if (this.phase !== 'ready') this.card = makeCard()
    const mine = this.card.filter(n => n)
    const others = shuffle(Array.from({ length: 75 }, (_, k) => k + 1).filter(n => !mine.includes(n)))
    const c = this.level.cracks
    const decoys = others.slice(0, TILES - 24 - c)
    this.tiles = shuffle([...mine, ...decoys, ...Array(c).fill(0)]).map(n => ({ n, up: false }))
    this.pts -= this.stake
    this.phase = 'play'
    this.hits = 0
    this.lines = 0
    this.bank = 0
    this.paid = 0
    this.last = -1
    this.flash = new Set()
    SFX.coin()
    this.emit()
  }

  flip(i: number) {
    const t = this.tiles[i]
    if (this.phase !== 'play' || !t || t.up) return
    t.up = true
    this.last = i
    if (!t.n) return this.bust()
    if (!this.card.includes(t.n)) {
      SFX.ding(colOf(t.n))
      return this.emit()
    }
    this.hits++
    SFX.hit()
    const m = this.marked
    const done = LINES.filter(L => L.every(k => m.has(this.card[k])))
    if (done.length > this.lines) {
      const fresh = done.slice(-(done.length - this.lines))
      const gain = Math.round(this.stake * this.level.line * (done.length - this.lines))
      this.lines = done.length
      this.bank += gain
      this.pts += gain
      this.flash = new Set(done.flat())
      if (gain) this.toast(`LINE! +KES ${gain} BANKED`)
      SFX.combo(Math.min(fresh.length + 1, 4))
    }
    if (this.hits >= 24) return this.collect()
    this.emit()
  }

  /** flip a random face-down tile */
  auto() {
    const left = this.tiles.map((t, i) => (t.up ? -1 : i)).filter(i => i >= 0)
    if (left.length) this.flip(left[rnd(left.length)])
  }

  collect() {
    if (this.phase !== 'play' || !this.hits) return
    const pot = this.pot
    this.pts += pot
    this.paid = pot + this.bank
    this.phase = 'won'
    this.reveal()
    this.log(`KES ${this.paid}`, true)
    SFX.bingo()
    setTimeout(() => SFX.cheer(true), 500)
    this.emit()
  }

  private bust() {
    this.phase = 'bust'
    this.paid = this.bank
    this.reveal()
    this.log(this.bank ? `CRACK · KES ${this.bank}` : 'CRACK', false)
    SFX.aww()
    this.emit()
  }

  private reveal() {
    this.tiles.forEach(t => {
      if (!t.up) {
        t.up = true
        t.ghost = true
      }
    })
  }

  toastMsg: { id: number; txt: string } | null = null
  private toast(txt: string) {
    const id = ++this.uid
    this.toastMsg = { id, txt }
    setTimeout(() => {
      if (this.toastMsg?.id === id) {
        this.toastMsg = null
        this.emit()
      }
    }, 1600)
  }
  private log(txt: string, win: boolean) {
    this.history.unshift({ id: ++this.uid, txt, win })
    if (this.history.length > 8) this.history.length = 8
  }

  toggleSound() {
    this.sound = !this.sound
    SFX.set('sfx', this.sound)
    this.emit()
  }
}

export const game = new Game()
SFX.set('music', false)
export function useGame() {
  useSyncExternalStore(game.subscribe, game.get)
  return game
}
