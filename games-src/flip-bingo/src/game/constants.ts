/** Ice tiles on the board: the card's 24 numbers, decoys, and the cracks. */
export const TILES = 40
/** Stakes a player can pick, in KES. */
export const STAKES = [10, 20, 50, 100]
/** Pot multiplier before the first hit; each hit grows it by the odds of surviving that flip. */
export const BASE_MULT = 0.9

export interface Level {
  cracks: number
  name: string
  /** line bonus, as a share of the stake */
  line: number
}

/** Difficulty: more cracks hidden in the ice pay more per hit and per line. */
export const LEVELS: Level[] = [
  { cracks: 1, name: 'Easy', line: 0.03 },
  { cracks: 3, name: 'Medium', line: 0.25 },
  { cracks: 5, name: 'Hard', line: 1 },
]

/** Letter colours: B blue, I red, N yellow, G purple, O green. */
export const LC = ['#38bdf8', '#f87171', '#facc15', '#c084fc', '#4ade80']
export const START_POINTS = 2450

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
