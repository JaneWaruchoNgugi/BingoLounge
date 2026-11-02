import { ArrowRight } from 'lucide-react'
import { GAMES, KIND_LABEL, imgUrl } from '../games'

/** Promotions: the new player offer and what is coming. */
export function Promotions({ go }: { go: (h: string | null) => void }) {
  return (
    <section className="page">
      <h2>Promotions</h2>
      <img className="page-hero" src={imgUrl('hero-new-player.webp')} alt="New player offer: 100% bonus up to KSh 1,000" />
      <div className="cards3">
        <div className="pcard">
          <b>100% first deposit bonus</b>
          <p>Deposit and we match it, up to KSh 1,000, to play any game in the lounge.</p>
        </div>
        <div className="pcard">
          <b>Scratch Bingo bonus star</b>
          <p>About one ticket in 40 hides a bonus star. Place it on any number on your card.</p>
          <button className="play-now" onClick={() => go('scratch-bingo')}>
            Play Scratch Bingo <ArrowRight />
          </button>
        </div>
        <div className="pcard">
          <b>Weekend jackpot rounds</b>
          <p>Bigger prizes on Quick Bingo, Bingo 35 and Bingo 90 every Saturday and Sunday.</p>
        </div>
      </div>
      <p className="fine">Offer terms are placeholders until your real promotion rules are added.</p>
    </section>
  )
}

/** My Cards: where cards live today. */
export function MyCards({ go }: { go: (h: string | null) => void }) {
  return (
    <section className="page">
      <h2>My Cards</h2>
      <p className="lead">Your cards are bought inside each game. Open a game to buy cards for its next round.</p>
      <div className="mini-list">
        {GAMES.map(g => (
          <button key={g.id} onClick={() => go(g.id)}>
            <b>{g.name}</b>
            <small>{KIND_LABEL[g.kind]}</small>
            <ArrowRight />
          </button>
        ))}
      </div>
    </section>
  )
}

/** Help: one line per game on how it plays. */
export function Help() {
  return (
    <section className="page">
      <h2>Help</h2>
      <p className="lead">Every game uses a bingo card. Here is what makes each one different.</p>
      <dl className="help">
        {GAMES.map(g => (
          <div key={g.id}>
            <dt>{g.name}</dt>
            <dd>
              {g.blurb} <span>{g.facts.join(' · ')}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/** Settings: sound lives inside each game for now. */
export function Preferences() {
  return (
    <section className="page">
      <h2>Settings</h2>
      <p className="lead">Music and sound effects are set inside each game, from its own gear or speaker button.</p>
    </section>
  )
}
