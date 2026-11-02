import { useCallback, useEffect, useState } from 'react'
import { GAMES } from './games'

/** Pages of the site besides the lobby. */
export const PAGES = ['my-cards', 'promotions', 'help', 'preferences'] as const
export type Page = 'lobby' | (typeof PAGES)[number]

/**
 * The URL hash holds where the player is: a page (#promotions) or an open game (#bingo90),
 * so both can be linked to directly and the browser Back button works.
 */
export function useHashRoute() {
  const read = () => {
    const h = window.location.hash.slice(1)
    if (GAMES.some(g => g.id === h)) return { page: 'lobby' as Page, game: h }
    if ((PAGES as readonly string[]).includes(h)) return { page: h as Page, game: null }
    return { page: 'lobby' as Page, game: null }
  }
  const [route, setRoute] = useState(read)

  useEffect(() => {
    const onHash = () => setRoute(read())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const go = useCallback((h: string | null) => {
    if (h) {
      if (window.location.hash !== '#' + h) window.location.hash = h
    } else history.replaceState(null, '', window.location.pathname + window.location.search)
    setRoute(read())
  }, [])

  return { ...route, go }
}
