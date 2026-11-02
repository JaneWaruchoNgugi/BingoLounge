# Bingo Lounge

A lobby website for seven bingo games, written in React 18 + TypeScript with Vite.

## Run it
```bash
npm install
npm run dev        # lobby at http://localhost:5173
npm run build      # production build in dist/ (upload dist/ to any static host)
```

## How it is put together
```
src/
  main.tsx              entry
  App.tsx               the lobby page: featured game, filters, game grid, open game
  games.ts              the list of games (name, type, description, facts) — edit this to add or change games
  useHashGame.ts        keeps the open game in the URL (#bingo90) so games can be linked to directly
  components/
    Marquee.tsx         header with the chasing bulbs
    Featured.tsx        the spotlight game at the top
    Filters.tsx         All / Live draw / Instant / Hybrid
    GameCard.tsx        one game tile
    GameStage.tsx       full-screen player with Lobby / previous / next
  styles.css
public/
  games/<id>.html       each game as one self-contained file (built from games-src/)
  thumbs/<id>.jpg       lobby screenshots
games-src/              the full React + TypeScript source of every game
  scratch-bingo  flip-bingo  reel-bingo  deal-bingo  quick-bingo  bingo35  bingo90
scripts/
  build-games.sh        rebuilds games-src/* into public/games/
  vite.game.config.ts   the single-file build config the script uses
```

Each game is its own React app with its own state, styles and sounds, so the lobby opens it in a full-screen frame rather than mounting it inside the lobby. That keeps the games from clashing with each other's CSS and timers, and lets you work on one game without touching the others.

## Changing a game
1. Edit its source in `games-src/<id>/src/` (you can also run it alone: `cd games-src/<id> && npm install && npm run dev`).
2. Rebuild it into the lobby: `npm run build:games -- <id>` (or `npm run build:games` for all seven).
3. `npm run dev` and open the lobby.

## Adding a game
Put its source in `games-src/<id>/`, run `npm run build:games -- <id>`, add a screenshot as `public/thumbs/<id>.jpg`, and add an entry to `GAMES` in `src/games.ts`.

## Notes
- Every game keeps its own practice balance; there is no shared wallet, login or backend connection yet. `QuickBingo_Backend` is not included here.
- Quick Bingo, Bingo 35 and Bingo 90 are your original games, unchanged.
