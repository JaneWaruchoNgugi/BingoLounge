import { ChevronDown, Coins, Megaphone, Plus, UserRound, ArrowRight } from 'lucide-react'
import { Logo } from './Logo'

/** The bar along the top: the welcome offer, the balance and the player. */
export function TopBar({ onLearn }: { onLearn: () => void }) {
  return (
    <header className="topbar">
      <div className="tb-logo">
        <Logo compact />
      </div>
      <div className="news">
        <Megaphone className="horn" />
        <span>Welcome to Bingo Lounge! Get 100% bonus on your first deposit!</span>
        <button className="learn" onClick={onLearn}>
          Learn more <ArrowRight />
        </button>
      </div>
      <div className="wallet">
        <Coins className="coins" />
        <b>KSh 1,250</b>
        <button className="topup" aria-label="Deposit">
          <Plus /> <span>Deposit</span>
        </button>
      </div>
      <button className="user">
        <span className="avatar">
          <UserRound />
        </span>
        <span className="uname">BingoPlayer</span>
        <ChevronDown />
      </button>
    </header>
  )
}
