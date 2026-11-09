import { useGame } from '../hooks/useGame'
import { SettingsPanel } from './SettingsPanel'

/** The header: settings gear, the 3D logo and the player's balance. */
export function TopBar() {
  const g = useGame()
  return (
    <header className="topbar">
      <div className="trow">
        <SettingsPanel />
        <div className="tlogo" aria-label="Reel Bingo">
          <span className="l1">REEL</span>
          <span className="l2">BINGO</span>
        </div>
        <div className="tbal">
          <em>Your balance</em>
          <b>KES {g.pts.toLocaleString('en-US', { minimumFractionDigits: 2 })}</b>
        </div>
      </div>
    </header>
  )
}
