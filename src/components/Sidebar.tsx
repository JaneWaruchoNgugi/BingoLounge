import { CircleHelp, Gift, House, Settings, Trophy, WalletCards } from 'lucide-react'
import type { Page } from '../useHashGame'
import { Logo } from './Logo'

export const NAV: { page: Page; label: string; Icon: typeof House; badge?: number }[] = [
  { page: 'lobby', label: 'Lobby', Icon: House },
  { page: 'my-cards', label: 'My Cards', Icon: WalletCards },
  { page: 'promotions', label: 'Promotions', Icon: Gift, badge: 3 },
  { page: 'help', label: 'Help', Icon: CircleHelp },
  { page: 'preferences', label: 'Settings', Icon: Settings },
]

/** The left rail on wide screens: logo, pages, a promotions box and the responsible-play note. */
export function Sidebar({ page, go }: { page: Page; go: (h: string | null) => void }) {
  return (
    <aside className="side">
      <Logo />
      <nav aria-label="Main">
        {NAV.map(({ page: p, label, Icon, badge }) => (
          <button key={p} className={'nav' + (page === p ? ' on' : '')} aria-current={page === p ? 'page' : undefined} onClick={() => go(p === 'lobby' ? null : p)}>
            <Icon /> {label}
            {badge ? <em>{badge}</em> : null}
          </button>
        ))}
      </nav>
      <div className="side-promo">
        <Trophy className="cup" />
        <b>
          Play more,
          <br />
          win more!
        </b>
        <button onClick={() => go('promotions')}>View Promotions</button>
      </div>
      <div className="side-foot">
        <span className="age">18+</span> Play responsibly
      </div>
      <div className="flag" aria-hidden="true" />
    </aside>
  )
}

/** The same pages as a bar along the bottom on phones. */
export function BottomNav({ page, go }: { page: Page; go: (h: string | null) => void }) {
  return (
    <nav className="bottom-nav" aria-label="Main">
      {NAV.slice(0, 4).map(({ page: p, label, Icon, badge }) => (
        <button key={p} className={page === p ? 'on' : ''} aria-current={page === p ? 'page' : undefined} onClick={() => go(p === 'lobby' ? null : p)}>
          <Icon />
          <span>{label}</span>
          {badge ? <em>{badge}</em> : null}
        </button>
      ))}
    </nav>
  )
}
