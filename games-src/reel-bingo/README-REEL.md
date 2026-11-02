# Reel Bingo (prototype)

Slot-style bingo built on the bingo35 code. Same 5×5 card, lines and prize ladder.

## How it plays
- Buy up to 4 cards as before (pick or quick-stake chips).
- The draw is 7 spins of 5 reels. Reel B holds 1–15, I 16–30, N 31–45, G 46–60, O 61–75,
  so each spin calls one number per column. Called numbers leave their reel, so nothing repeats.
- Each reel can stop on a gold ★ Star instead (about 1 in 22 stops, ~1.6 per round).
  A Star gives every card (yours and the other players') a free daub in that column, on the
  cell that brings its closest line nearest to complete. Star daubs show gold with a ★ on the card.
- Prizes are unchanged: first card to 1, 2, 3, 4 lines and Full House wins price × 0.5 / 1.2 / 1.4 / 1.6 / 1.8.

## What changed from bingo35
- `src/game/cards.ts`: added `spinReels`, `starDaub`, `STAR`, `STAR_P`; `Card.wild` holds Star daubs.
- `src/game/store.ts`: `callBatch` now spins the reels and `settle` applies numbers and Stars;
  line checks use `marks(card)` (called numbers + that card's Star daubs). Drum/ball-machine code removed.
- `src/components/Reels.tsx` + `src/styles/21-reels.css`: the slot cabinet, replacing `Drum`/`DrumArt`.
- `TicketsPanel.tsx`, `LeftPanel.tsx`: per-card marks, spin counter.
- Added `tsconfig.json` (strict) so `npm run build` type-checks.

## Run
    npm install
    npm run dev        # or: npm run build → dist/index.html is a single playable file

## Not done yet
- Backend: `QuickBingo_Backend` still runs the ball draw. To go server-side, swap its `drawBatch`
  for a server copy of `spinReels`/`starDaub` and store Star daubs per card.
- The header art still says BINGO 35 (it is in `src/assets/stage.svg`).
- Payout tuning: Stars make lines come a little sooner; run a simulation before using real stakes.
