import { useSyncExternalStore } from 'react'
import { game, type Game } from '../game/store'

/** Re-renders the calling component whenever the game state changes. */
export function useGame(): Game {
  useSyncExternalStore(game.subscribe, game.get)
  return game
}

// end-to-end tests drive the game directly when the page is opened with ?test
if (location.search.includes('test')) (window as unknown as { __game: Game }).__game = game
