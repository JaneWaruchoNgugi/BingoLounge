import { SFX } from '../audio/sfx'
import { BASE_MULT, LEVELS, LINES, STAKES, START_POINTS, TILES, colOf, rnd, shuffle } from './constants'

export type Phase = 'ready' | 'play' | 'won' | 'bust'

/** A tile on the ice board: a number (0 = a crack). `ghost` tiles were turned over at game end. */
export interface Tile {
  n: number
  up: boolean
  ghost?: boolean
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

/**
 * Pot multiplier after `hits` card numbers with `cracks` cracks hidden: each safe flip pays the
 * odds of surviving it, so the pot grows faster the more cracks there are.
 */
export function mult(hits: number, cracks: number) {
  let m = BASE_MULT
  for (let i = 0; i < hits; i++) m *= (24 - i + cracks) / (24 - i)
  return m
}

/**
 * Flip Bingo: pay a stake, flip ice tiles to call numbers. Each number on your card grows the pot;
 * each finished line banks a bonus at once. A crack ends the game and loses the pot (banked lines
 * stay). Collect any time after the first hit.
 */
export class Game {
  pts = START_POINTS
  stake = STAKES[1]
  /** index into LEVELS */
  lvl = 1
  card = makeCard()
  tiles: Tile[] = []
  phase: Phase = 'ready'
  hits = 0
  lines = 0
  /** line bonuses banked this game */
  bank = 0
  /** what the last game paid in all */
  paid = 0
  /** index of the tile flipped last */
  last = -1
  /** card cells to flash: the lines just finished */
  flash = new Set<number>()
  history: HistoryRow[] = []
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
  /** What collecting now pays. */
  get pot() {
    return this.phase === 'play' && this.hits ? Math.round(this.stake * mult(this.hits, this.level.cracks)) : 0
  }
  /** What the pot becomes after one more hit. */
  get nextPot() {
    return Math.round(this.stake * mult((this.phase === 'play' ? this.hits : 0) + 1, this.level.cracks))
  }
  /** Card numbers flipped so far (0, the free centre, always counts). */
  get marked() {
    const s = new Set([0])
    this.tiles.forEach(t => t.up && !t.ghost && t.n && s.add(t.n))
    return s
  }
  /** Chance that the next flip is a crack. */
  get risk() {
    const down = this.tiles.filter(t => !t.up)
    return down.length ? down.filter(t => !t.n).length / down.length : 0
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
  /** Back to the face-down board (keeps the card). */
  reset() {
    if (this.phase !== 'play') {
      this.phase = 'ready'
      this.tiles = []
      this.flash = new Set()
    }
    this.emit()
  }

  /** Pays the stake and lays out a fresh board: the card's 24 numbers, decoys and the cracks. */
  start() {
    if (this.phase === 'play' || this.stake > this.pts) return
    // "Play again" after a game deals a new card
    if (this.phase !== 'ready') this.card = makeCard()
    const nums = this.card.filter(n => n)
    const others = shuffle(Array.from({ length: 75 }, (_, i) => i + 1).filter(n => !nums.includes(n)))
    const cracks = this.level.cracks
    const decoys = others.slice(0, TILES - 24 - cracks)
    this.tiles = shuffle([...nums, ...decoys, ...Array(cracks).fill(0)]).map(n => ({ n, up: false }))
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
    const done = LINES.filter(l => l.every(c => m.has(this.card[c])))
    if (done.length > this.lines) {
      const fresh = done.slice(-(done.length - this.lines))
      const bonus = Math.round(this.stake * this.level.line * (done.length - this.lines))
      this.lines = done.length
      this.bank += bonus
      this.pts += bonus
      this.flash = new Set(done.flat())
      if (bonus) this.toast(`LINE! +KES ${bonus} BANKED`)
      SFX.combo(Math.min(fresh.length + 1, 4))
    }
    // the whole card is in: collect automatically
    if (this.hits >= 24) return this.collect()
    this.emit()
  }

  /** Flips a random face-down tile. */
  auto() {
    const down = this.tiles.map((t, i) => (t.up ? -1 : i)).filter(i => i >= 0)
    if (down.length) this.flip(down[rnd(down.length)])
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

  /** Turns over every tile still face down, greyed out. */
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
      if (this.toastMsg?.id !== id) return
      this.toastMsg = null
      this.emit()
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
// Flip Bingo plays without the background music
SFX.set('music', false)
