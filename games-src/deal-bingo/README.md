# Deal Bingo (prototype)

Card-table bingo built on the bingo35 code, in a royal blue felt theme. Same 5×5 card, lines and prize ladder.

## How it plays
- 12 hands of 3 cards (36 cards). The dealer's shoe deals each card face down onto the felt, then it flips.
- A number card calls its number. Its suit is its letter: ◆ B, ♥ I, ★ N, ♠ G, ♣ O.
- About 1 card in 13 is a face card (J, Q or K) in one of the letters. It calls no number; every card
  gets a free daub in that letter (shown gold on the card).
- The number on each card is always one not yet called (hot numbers 3× as likely, as in your other games).
- Prizes are unchanged: first card to 1, 2, 3, 4 lines and Full House.

## Files
- `src/game/draw.ts`: the deal. `src/components/DealTable.tsx` + `src/styles/21-deal.css`: the table, shoe and card flips.
- `src/game/store.ts`: shared machine store.
- Theme: gold/green colours in `src/styles` re-coloured to blue and silver; the logo reads DEAL BINGO.

## Run
    npm install
    npm run dev        # or: npm run build → dist/index.html is a single playable file
