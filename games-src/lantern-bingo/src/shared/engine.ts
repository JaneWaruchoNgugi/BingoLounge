// Shared 75-ball instant bingo engine used by every prototype.
// Pure functions + a reducer, so a game can be dropped into games-src/<id>/ with this file beside it.

export const LETTERS = ['B', 'I', 'N', 'G', 'O'] as const;
export const START_BALANCE = 2420;
export const CALLS_PER_ROUND = 30;

/** Line ladder: the 1st line pays 1x stake, the 2nd 2x, 3rd 4x, 4th 8x, every later line 10x. */
export const LADDER = [1, 2, 4, 8, 10];
export const FULL_CARD_MULT = 500;

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const colOf = (n: number) => Math.min(4, Math.floor((n - 1) / 15));
export const letterOf = (n: number) => LETTERS[colOf(n)];

/** 25 cells, row-major. Centre (index 12) is the free space, stored as 0. */
export function makeCard(rng: Rng): number[] {
  const cols: number[][] = [];
  for (let c = 0; c < 5; c++) {
    const pool = Array.from({ length: 15 }, (_, i) => c * 15 + i + 1);
    cols.push(shuffle(pool, rng).slice(0, 5).sort((x, y) => x - y));
  }
  const card: number[] = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) card.push(cols[c][r]);
  card[12] = 0;
  return card;
}

export function drawCalls(count: number, rng: Rng): number[] {
  return shuffle(Array.from({ length: 75 }, (_, i) => i + 1), rng).slice(0, count);
}

export const LINES: number[][] = (() => {
  const l: number[][] = [];
  for (let r = 0; r < 5; r++) l.push([0, 1, 2, 3, 4].map((c) => r * 5 + c));
  for (let c = 0; c < 5; c++) l.push([0, 1, 2, 3, 4].map((r) => r * 5 + c));
  l.push([0, 6, 12, 18, 24]);
  l.push([4, 8, 12, 16, 20]);
  return l;
})();

export const completeLines = (daubed: boolean[]) =>
  LINES.map((line, i) => (line.every((c) => daubed[c]) ? i : -1)).filter((i) => i >= 0);

export const linePrize = (k: number, stake: number) => LADDER[Math.min(k, LADDER.length - 1)] * stake;

/** Where a free daub helps most: finishes the most lines, then sits on the fullest lines. */
export function bestFreeCell(daubed: boolean[]): number {
  let best = -1;
  let bestScore = -1;
  for (let i = 0; i < 25; i++) {
    if (daubed[i]) continue;
    let score = 0;
    for (const line of LINES) {
      if (!line.includes(i)) continue;
      const have = line.filter((c) => daubed[c]).length;
      score += have === 4 ? 100 : have * have;
    }
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return best;
}

// ---------------------------------------------------------------- tokens

export type TokenKind = 'number' | 'free' | 'double' | 'mult';

/** One thing the player uncovers: a balloon, coconut, box, stone, lantern or falling ball. */
export interface Token {
  i: number;
  n: number | null; // called number, null for a pure free daub
  kind: TokenKind;
  mult?: number; // gift box multiplier
  tone?: number; // game-specific visual variant (lantern colour, balloon colour...)
}

export const numberTokens = (calls: number[]): Token[] =>
  calls.map((n, i) => ({ i, n, kind: 'number' as const }));

// ---------------------------------------------------------------- round state

/** Card prices offered in the picker (KSh). Prizes scale with the price of the card that wins. */
export const PRICES = [10, 20, 30, 50, 100, 200];
export const MAX_CARDS = 4;

export interface LineWin {
  card: number;
  line: number;
  prize: number;
  doubled: boolean;
}

export interface CardState {
  nums: number[];
  price: number;
  daubed: boolean[];
  full: boolean;
}

export interface CardPick {
  nums: number[];
  price: number;
}

export interface RoundState {
  phase: 'idle' | 'playing' | 'done';
  roundId: number;
  stake: number; // total paid for this round
  balance: number;
  cards: CardState[];
  card: number[]; // every number across the cards, for "is this on my card?" checks
  tokens: Token[];
  revealed: boolean[];
  lost: boolean[];
  pendingFree: number;
  doubleArmed: boolean;
  multiplier: number;
  lineWins: LineWin[];
  bonusCash: number;
  credited: number;
  lastToken: Token | null;
  justDaubed: number[]; // card * 25 + cell
  lastPrices: number[];
}

export type Action =
  | { type: 'buy'; picks: CardPick[]; tokens: (calls: number[], rng: Rng) => Token[]; seed?: number; calls?: number }
  | { type: 'reveal'; i: number }
  | { type: 'lose'; i: number }
  | { type: 'revealAll' }
  | { type: 'placeFree'; card: number; cell: number }
  | { type: 'bonus'; amount: number }
  | { type: 'topUp' };

const freshCard = (nums: number[], price: number): CardState => ({ nums, price, daubed: nums.map((n) => n === 0), full: false });

export function initialState(balance: number): RoundState {
  const card = makeCard(mulberry32(7));
  return {
    phase: 'idle',
    roundId: 0,
    stake: 0,
    balance,
    cards: [freshCard(card, 20)],
    card,
    tokens: [],
    revealed: [],
    lost: [],
    pendingFree: 0,
    doubleArmed: false,
    multiplier: 1,
    lineWins: [],
    bonusCash: 0,
    credited: 0,
    lastToken: null,
    justDaubed: [],
    lastPrices: [],
  };
}

export function totalWin(s: RoundState): number {
  const lines = s.lineWins.reduce((a, w) => a + w.prize, 0);
  const full = s.cards.reduce((a, c) => a + (c.full ? FULL_CARD_MULT * c.price : 0), 0);
  return (lines + full) * s.multiplier + s.bonusCash;
}

/** marks: card * 25 + cell */
function applyDaub(s: RoundState, marks: number[]): RoundState {
  if (!marks.length) return { ...s, justDaubed: [] };
  const lineWins = s.lineWins.slice();
  let anyFresh = false;
  const doubled = s.doubleArmed;
  const cards = s.cards.map((c, ci) => {
    const mine = marks.filter((m) => Math.floor(m / 25) === ci).map((m) => m % 25);
    if (!mine.length) return c;
    const daubed = c.daubed.slice();
    mine.forEach((cell) => (daubed[cell] = true));
    const before = new Set(lineWins.filter((w) => w.card === ci).map((w) => w.line));
    for (const line of completeLines(daubed)) {
      if (before.has(line)) continue;
      const k = lineWins.filter((w) => w.card === ci).length;
      lineWins.push({ card: ci, line, prize: linePrize(k, c.price) * (doubled ? 2 : 1), doubled });
      anyFresh = true;
    }
    return { ...c, daubed, full: daubed.every(Boolean) };
  });
  return { ...s, cards, lineWins, doubleArmed: anyFresh ? false : s.doubleArmed, justDaubed: marks };
}

function settle(s: RoundState): RoundState {
  if (s.phase !== 'playing') return s;
  const allOut = s.tokens.every((_, i) => s.revealed[i] || s.lost[i]);
  if (!allOut || s.pendingFree > 0) return s;
  const win = totalWin(s);
  return { ...s, phase: 'done', balance: s.balance + win, credited: win };
}

function revealOne(s: RoundState, i: number): RoundState {
  if (s.phase !== 'playing' || s.revealed[i] || s.lost[i] || !s.tokens[i]) return s;
  const t = s.tokens[i];
  const revealed = s.revealed.slice();
  revealed[i] = true;
  let next: RoundState = { ...s, revealed, lastToken: t };
  if (t.kind === 'free') next.pendingFree += 1;
  if (t.kind === 'double') next.doubleArmed = true;
  if (t.kind === 'mult' && t.mult) next.multiplier *= t.mult;
  const marks: number[] = [];
  if (t.n != null)
    next.cards.forEach((c, ci) => {
      const cell = c.nums.indexOf(t.n!);
      if (cell >= 0 && !c.daubed[cell]) marks.push(ci * 25 + cell);
    });
  return applyDaub(next, marks);
}

function bestFreeMark(s: RoundState): number {
  let best = -1;
  let bestScore = -1;
  s.cards.forEach((c, ci) => {
    const cell = bestFreeCell(c.daubed);
    if (cell < 0) return;
    const trial = c.daubed.slice();
    trial[cell] = true;
    const score = completeLines(trial).length * 1000 * c.price + c.price;
    if (score > bestScore) {
      bestScore = score;
      best = ci * 25 + cell;
    }
  });
  return best;
}

export function reducer(s: RoundState, a: Action): RoundState {
  switch (a.type) {
    case 'buy': {
      const stake = a.picks.reduce((x, p) => x + p.price, 0);
      if (s.phase === 'playing' || !a.picks.length || s.balance < stake) return s;
      const rng = mulberry32(a.seed ?? Math.floor(Math.random() * 2 ** 31));
      const tokens = a.tokens(drawCalls(a.calls ?? CALLS_PER_ROUND, rng), rng);
      const cards = a.picks.map((p) => freshCard(p.nums, p.price));
      return {
        ...initialState(s.balance - stake),
        phase: 'playing',
        roundId: s.roundId + 1,
        stake,
        cards,
        card: cards.flatMap((c) => c.nums).filter((n) => n > 0),
        tokens,
        revealed: tokens.map(() => false),
        lost: tokens.map(() => false),
        lastPrices: a.picks.map((p) => p.price),
      };
    }
    case 'reveal':
      return settle(revealOne(s, a.i));
    case 'lose': {
      if (s.phase !== 'playing' || s.revealed[a.i] || s.lost[a.i]) return s;
      const lost = s.lost.slice();
      lost[a.i] = true;
      return settle({ ...s, lost, justDaubed: [] });
    }
    case 'revealAll': {
      let next = s;
      s.tokens.forEach((_, i) => (next = revealOne(next, i)));
      const placed: number[] = [];
      while (next.pendingFree > 0) {
        const mark = bestFreeMark(next);
        next = { ...next, pendingFree: next.pendingFree - 1 };
        if (mark < 0) continue;
        next = applyDaub(next, [mark]);
        placed.push(mark);
      }
      return settle({ ...next, justDaubed: placed });
    }
    case 'placeFree': {
      const c = s.cards[a.card];
      if (s.pendingFree <= 0 || !c || c.daubed[a.cell]) return s;
      return settle(applyDaub({ ...s, pendingFree: s.pendingFree - 1 }, [a.card * 25 + a.cell]));
    }
    case 'bonus': {
      const next = { ...s, bonusCash: s.bonusCash + a.amount };
      if (s.phase === 'done') return { ...next, balance: s.balance + a.amount, credited: s.credited + a.amount };
      return next;
    }
    case 'topUp':
      return s.phase === 'playing' ? s : { ...s, balance: START_BALANCE };
  }
}

export const newPicks = (prices: number[], rng: Rng = Math.random): CardPick[] => prices.map((price) => ({ price, nums: makeCard(rng) }));
