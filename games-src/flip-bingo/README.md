# Flip Bingo

Instant bingo on ice. Pay a stake and flip tiles on an 8×5 board: 40 tiles hide your card's 24
numbers, some decoys and 1, 3 or 5 cracks. Every number on your card raises the pot, every line
you finish banks a bonus straight away, and a crack ends the game and loses the pot (banked lines
stay). Collect whenever you like after the first hit.

- `src/game/store.ts` holds the rules: the board, the pot multiplier (`mult`), lines and payouts
- `src/game/constants.ts` stakes, crack levels and line bonuses
- `src/components/` the board, card, pot and controls
- `src/styles/base.css` the look; `phones.css` the phone layouts (portrait, short screens, landscape)
- `src/audio/sfx.ts` sounds, shared with Bingo 35 (music is switched off in this game)

Run it on its own with `npm install && npm run dev`, or rebuild it into the lobby from the repo
root with `npm run build:games -- flip-bingo`.
