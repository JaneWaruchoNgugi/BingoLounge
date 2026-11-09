# Reel Bingo

75-ball bingo drawn by a five-reel slot cabinet. Each round is 7 spins; every spin stops one
reel per letter (B I N G O), so 35 numbers in all. A reel can land on the ★ Star instead: every
card then gets a free daub in that letter, on the line closest to complete.

It grew out of Bingo 35 and shares its card picker, stakes, win popup, chat and sounds; the drum
machine is replaced by the reels, and the look is the "Sapphire Reels" theme (navy and ice blue
with tangerine accents).

- `src/game/reels.ts` spins the reels (hot numbers come up 3× as often, 1 reel in 22 is a Star)
- `src/game/store.ts` runs rounds, Star daubs, wins and payouts
- `src/components/Reels.tsx` draws the cabinet and the spinning reels
- `src/styles/21-reels.css` styles the cabinet; `29-sapphire-theme.css` is the theme, loaded last

Run it on its own with `npm install && npm run dev`, or rebuild it into the lobby from the repo
root with `npm run build:games -- reel-bingo`.
