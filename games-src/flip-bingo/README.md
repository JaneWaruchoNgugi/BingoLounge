# Flip Bingo (prototype)

A solo, mines-style bingo in an ice theme. There is no shared draw: the player calls numbers by flipping tiles.
This one is a small standalone React + Vite app (it does not use the bingo35 room code), reusing only your sound engine.

## How it plays
- Pick a stake (KES 10 to 100) and a level: Easy (1 crack), Medium (3), Hard (5). Press Play.
- The board hides 40 ice tiles: your card's 24 numbers, some decoy numbers and the cracks.
- Each tile you flip calls its number. A number on your card daubs it and raises the pot. A decoy does nothing.
- Each line you complete banks a line bonus at once (kept even if you crack later).
- A crack ends the game and the pot is lost. Collect whenever you like after your first hit.
- "Flip random" flips a tile for you; "New card" deals another card between games.

## Balance (tools/sim_flip.py)
- The pot is stake × 0.90 × the fair odds of every hit so far, like mines. So every way of choosing when to collect returns
  90% from the pot alone, and the sim confirms it (0.90 for collecting after 1, 3, 6 or 10 hits).
- Line bonuses add up to about 6% more for a player who never collects early: Easy ×0.03, Medium ×0.25, Hard ×1.0 per line.
  Total return is 90 to 96% depending on play.
- Pot after 5 / 10 / 15 hits: Easy ×1.13 / ×1.50 / ×2.25, Medium ×1.71 / ×3.87 / ×11.97, Hard ×2.51 / ×9.19 / ×53.39.
- `RTP` and `LEVELS` in `src/game.ts` are the knobs. Easy's line bonus is small (KES 1 on a KES 20 stake), so if you want
  Easy to feel more like bingo, raise it and lower `RTP` for Easy to keep the total.
- A real-money version must deal the board on the server and reveal one tile per request, so the client never knows where the cracks are.

## Files
- `src/game.ts`: board, pot maths, lines, collect and crack. `src/App.tsx`: the board, card, pot and controls. `src/styles.css`: the ice theme.

## Run
    npm install
    npm run dev        # or: npm run build → dist/index.html is a single playable file
