# Deal Bingo

75-ball bingo where a dealer calls the numbers with playing cards. Each round deals 12 hands of
3 cards (36 numbers). A J, Q or K is wild: every card gets a free daub in that card's letter, on
the line closest to complete.

It grew out of Bingo 35 and shares its card picker, stakes, win popup, chat and sounds; the drum
machine is replaced by the dealer's table and the theme is navy and steel blue.

- `src/game/deal.ts` deals each hand (hot numbers come up 3× as often, 1 in 13 cards is wild)
- `src/game/store.ts` runs rounds, wild daubs, wins and payouts
- `src/components/Dealer.tsx` draws the table and animates the cards
- `src/styles/21-dealer.css` styles the table; `22-theme.css` holds the theme

Run it on its own with `npm install && npm run dev`, or rebuild it into the lobby from the repo
root with `npm run build:games -- deal-bingo`.
