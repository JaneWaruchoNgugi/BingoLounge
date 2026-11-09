import { LINE_IDX, type Grid } from './cards'

/** A reel that lands on the Star instead of a number. */
export const STAR = -1
/** chance that a reel lands on the Star */
const STAR_CHANCE = 1 / 22

/**
 * One spin: a number for each reel (column B, I, N, G, O) that has not been called yet, or the
 * Star. Hot numbers come up 3× as often. A column with nothing left lands on the Star.
 */
export function spinReels(called: Set<number>, hot: Set<number>): number[] {
  return [0, 1, 2, 3, 4].map(c => {
    const left: number[] = []
    for (let n = 1 + c * 15; n <= 15 + c * 15; n++) if (!called.has(n)) left.push(n)
    if (!left.length || Math.random() < STAR_CHANCE) return STAR
    const w = left.map(n => (hot.has(n) ? 3 : 1))
    let r = Math.random() * w.reduce((a, b) => a + b, 0)
    for (let i = 0; i < left.length; i++) {
      r -= w[i]
      if (r <= 0) return left[i]
    }
    return left[left.length - 1]
  })
}

/**
 * The number the Star daubs for free in column `col`: the open cell of that column that
 * sits on the line closest to complete. Null when the column has no open cell left.
 */
export function wildTarget(rows: Grid, set: Set<number>, col: number): number | null {
  const v = rows.flat()
  const marked = (i: number) => v[i] === 0 || set.has(v[i])
  let best: number | null = null
  let bc = -1
  LINE_IDX.forEach(l => {
    const open = l.find(i => i % 5 === col && !marked(i))
    if (open === undefined) return
    const c = l.filter(marked).length
    if (c > bc) {
      bc = c
      best = v[open]
    }
  })
  return best
}
