# Scratch Bingo (prototype)

An instant, solo bingo scratch ticket in a candy sunset theme. A small standalone React + Vite app that reuses only your sound engine.

## How it plays
- Tap "Pick your cards" to open the card picker: swipe (or use the arrows) through 6 cards, tap to take up to 2,
  and "New cards" deals a fresh set. Taking a card slides on to the next free one; at 2 cards the picker shows LIMIT REACHED.
- Quick buy: tap a price (10, 20, 50, 100) to open the picker with 1 or 2 cards (see the radio below) at that price already taken; one tap on Approve buys them. Each card has its own price (KES 10, 20, 20, 50, 50, 100; `PRICES` in `src/game.ts`)
- 1 card / 2 cards: the radio above Quick buy sets how many cards a ticket holds. Quick buy deals that many cards, and with 1 card picked, tapping another card in the picker switches to it.
  and its prizes are multiples of that price, so dearer cards pay bigger prizes. "Approve & buy" buys the ticket with the
  cards you took. The 30 calls are drawn only after you buy, so picking cards does not change the odds.
- Scratch the spots (drag with a finger or the mouse). Each spot hides a called number. Numbers on your card are daubed.
- "Reveal all" opens the rest at once.
- Each card pays the better of its two prizes, as a multiple of that card's price:
  - Lines: 1 line ×2.5, 2 lines ×15, 3 or more ×150
  - Numbers matched: 10 pays half the card price, and each extra number adds 15% (on a KES 100 card: 10 → 50, 11 → 65, 12 → 80, 13 → 95 and so on)
- The result is fixed when the ticket is bought (30 numbers drawn from 75); scratching only reveals it.

## Balance (tools/sim_scratch.py, 400,000 cards)
- 30 spots, line prizes ×2.5 / ×15 / ×150, and Charles's match table (10 matched = 50% of the price, +15% per extra number).
- About 54% of cards win something; the return is about 86%.

## Sound
- Your sound engine from the other games, but with its own tune (a candy-pop loop in D major at 124 BPM, in `beat()` in `src/audio/sfx.ts`),
  so it doesn't sound like your other game. It gets busier while a ticket is being scratched.
- Each scratch stroke rasps, a spot that matches your card plays a hit, others a soft ding; wins get the fanfare and cheer.
- Music and sound effects are switched on or off in the settings panel (gear in the top bar) and are remembered. Audio starts on the first tap (a browser rule).
- `LINE_PAY` and `MATCH_PAY` in `src/game.ts` are the knobs; rerun the sim after changing them.
- A real-money version must draw the ticket on the server and send the numbers only as spots are opened, or at least
  only after purchase, so the browser can't be inspected for the outcome before paying.

## Files
- `src/game.ts`: tickets, prize tables, scoring. `src/Foil.tsx`: the scratch foil (one canvas; a spot opens once 55% is scratched).
- `src/App.tsx`: the ticket, prize table and controls. `src/styles.css`: the theme.

## Run
    npm install
    npm run dev        # or: npm run build → dist/index.html is a single playable file

## Engagement extras
- Near-miss glow: while a ticket is being scratched, any line that is one number short glows and its missing cell gets a pulsing ring, with a heartbeat sound when a new near-miss appears.
- Bonus star: about 1 ticket in 40 (`STAR_CHANCE` in `src/game.ts`) hides a BONUS ★ in one of the 30 spots, in place of a number. When it is uncovered, the player taps any unmarked number on a card to mark it. The ticket only finishes once the star is placed, and the wins are worked out at the end. `tools/sim_star.py` checks the odds, assuming the player always puts the star on the best cell: return about 0.93 at 1 in 40 (0.87 without the star).
- Win roll-up: the prize counts up from 0 with coin sounds and a burst of coins. A win of 10× the ticket price or more (`BIG_WIN`) gets a full-screen confetti moment (BIG / SUPER / MEGA WIN); tap it to carry on.

## Look: paper scratch ticket
The game is styled as a printed paper ticket on a wooden counter. It has perforated top and bottom edges, an INSTANT tag, and a stamped price box. One silver foil sheet (drawn in `src/Foil.tsx`) covers the 30 calls. The prize table and history are paper slips, and the picker cards are printed too. The skin is the last block of `src/styles.css` ("paper scratch ticket skin"), so removing that block brings back the candy-sunset look, apart from the foil.

## Look: velvet and gold lounge (current)
The paper ticket skin was followed by a velvet and gold theme. The game sits on a burgundy velvet table. The ticket is ivory card stock in a gold foil frame, and the side panels are dark velvet with gold trim. The buttons are gold, and the picker cards sit in gold frames with an embossed gold price medallion and a small coloured gem for the price tier. It is the last blocks of `src/styles.css` (the "velvet and gold" sections); the paper ticket rules above them still apply underneath.
