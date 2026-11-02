#!/usr/bin/env bash
# Rebuild every game in games-src/ and copy it to public/games/<name>.html for the lobby.
# usage: npm run build:games            (all games)
#        npm run build:games -- bingo90 (just one)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG="$ROOT/scripts/vite.game.config.ts"
GAMES=("$@")
[ ${#GAMES[@]} -eq 0 ] && GAMES=($(ls "$ROOT/games-src"))
for g in "${GAMES[@]}"; do
  dir="$ROOT/games-src/$g"
  echo "== $g"
  [ -d "$dir/node_modules" ] || (cd "$dir" && npm install --no-audit --no-fund)
  (cd "$dir" && { [ ! -f tsconfig.json ] || npx tsc --noEmit; } && "$ROOT/node_modules/.bin/vite" build --config "$CONFIG")
  cp "$dir/dist/index.html" "$ROOT/public/games/$g.html"
done
echo "Done. Run npm run dev to see the lobby."
