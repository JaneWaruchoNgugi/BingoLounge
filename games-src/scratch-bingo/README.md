# Scratch Bingo

Instant scratch-card bingo. Pick one or two cards (each has its own price), buy the ticket, then
scratch the 30 silver spots with the coin. Every number that lands on a card is daubed; a card
pays its best prize, either for finished lines or for how many of its numbers came up. A ticket
can hide a bonus ★ that the player places on any number they still need.

- `src/game/store.ts` holds the rules: the picker, buying, scratching, scoring (`score`) and near lines
- `src/game/constants.ts` card prices, line and match prizes, quick-buy prices
- `src/components/` the ticket, the silver foil (`Foil.tsx`, a canvas), cards, picker, prizes, settings and the win banners
- `src/styles/base.css` the look; `phones.css` the phone layouts added later
- `src/audio/sfx.ts` sounds and the background tune (built on the Bingo 35 engine)

Run it on its own with `npm install && npm run dev`, or rebuild it into the lobby from the repo
root with `npm run build:games -- scratch-bingo`.
