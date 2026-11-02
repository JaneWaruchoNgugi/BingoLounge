import { Volume2, VolumeX, Shuffle, Sparkles } from 'lucide-react'
import { game, useGame, LEVELS, STAKES, LC, colOf, mult } from './game'

const L = 'BINGO'

function Board() {
  const g = useGame()
  const over = g.phase === 'bust' || g.phase === 'won'
  if (!g.tiles.length)
    return (
      <div className="board idle">
        {Array.from({ length: 40 }, (_, i) => (
          <div key={i} className="tile" style={{ animationDelay: (i % 8) * 0.06 + Math.floor(i / 8) * 0.05 + 's' }}>
            <div className="back" />
          </div>
        ))}
        <div className="idle-msg">
          <b>Pick a stake and press Play</b>
          <small>
            40 ice tiles hide your card's 24 numbers, some decoys and {g.level.cracks} crack{g.level.cracks > 1 ? 's' : ''}.
          </small>
        </div>
      </div>
    )
  return (
    <div className={'board' + (over ? ' over' : '') + (g.phase === 'bust' ? ' bust' : '')}>
      {g.tiles.map((t, i) => {
        const mine = t.n > 0 && g.card.includes(t.n)
        const cls = 'tile' + (t.up ? ' up' : '') + (t.ghost ? ' ghost' : '') + (!t.n ? ' crack' : mine ? ' mine' : ' miss') + (g.last === i ? ' last' : '')
        return (
          <button key={i} className={cls} disabled={t.up || g.phase !== 'play'} onClick={() => game.flip(i)} aria-label={t.up ? (t.n ? `${L[colOf(t.n)]} ${t.n}` : 'crack') : 'face-down tile'}>
            <div className="back" />
            <div className="face" style={t.n ? ({ '--lc': LC[colOf(t.n)] } as React.CSSProperties) : undefined}>
              {t.n ? (
                <>
                  <small>{L[colOf(t.n)]}</small>
                  <b>{t.n}</b>
                </>
              ) : (
                <svg viewBox="0 0 40 40" aria-hidden="true">
                  <path d="M20 2 L17 14 L24 18 L15 27 L19 38 M17 14 L6 10 M24 18 L36 14 M15 27 L4 30 M19 38" />
                </svg>
              )}
            </div>
          </button>
        )
      })}
      {g.toastMsg && (
        <div className="toast" key={g.toastMsg.id}>
          {g.toastMsg.txt}
        </div>
      )}
      {over && (
        <div className={'result ' + g.phase}>
          <b>{g.phase === 'won' ? 'COLLECTED' : 'CRACKED!'}</b>
          <span>{g.phase === 'won' ? `+KES ${g.paid}` : g.bank ? `Lines kept KES ${g.bank}` : 'Pot lost'}</span>
          <button className="btn play" onClick={() => game.start()}>
            Play again · KES {g.stake}
          </button>
        </div>
      )}
    </div>
  )
}

function Card() {
  const g = useGame()
  const m = g.marked
  return (
    <div className="card">
      <div className="chead">
        {[...L].map((l, c) => (
          <span key={c} style={{ background: LC[c] }}>
            {l}
          </span>
        ))}
      </div>
      <div className="cgrid">
        {g.card.map((n, i) => (
          <div key={i} className={'cell' + (n === 0 ? ' free' : m.has(n) && g.tiles.length ? ' hit' : '') + (g.flash.has(i) ? ' line' : '')} style={{ '--lc': LC[i % 5] } as React.CSSProperties}>
            {n === 0 ? '❄' : n}
          </div>
        ))}
      </div>
      <div className="cfoot">
        <span>
          Hits <b>{g.hits}/24</b>
        </span>
        <span>
          Lines <b>{g.lines}</b>
        </span>
      </div>
    </div>
  )
}

function Pot() {
  const g = useGame()
  const playing = g.phase === 'play'
  const c = g.level.cracks
  return (
    <div className="pot">
      <div className="pv">
        <small>{playing ? 'Pot' : 'First hit pays'}</small>
        <b>KES {playing ? g.pot : Math.round(g.stake * mult(1, c))}</b>
        <em>×{mult(playing ? g.hits : 1, c).toFixed(2)}</em>
      </div>
      <div className="pmeta">
        <span>
          Next hit <b>KES {g.nextPot}</b>
        </span>
        <span>
          Crack risk <b>{playing ? Math.round(g.risk * 100) : Math.round((c / 40) * 100)}%</b>
        </span>
        <span>
          Line bonus <b>KES {Math.round(g.stake * g.level.line)}</b>
        </span>
      </div>
      {playing ? (
        <div className="pbtns">
          <button className="btn collect" disabled={!g.hits} onClick={() => game.collect()}>
            {g.hits ? `Collect KES ${g.pot}` : 'Hit your card to collect'}
          </button>
          <button className="btn ghostbtn" onClick={() => game.auto()}>
            <Sparkles /> Flip random
          </button>
        </div>
      ) : (
        <div className="pbtns">
          <button className="btn play" disabled={g.stake > g.pts} onClick={() => game.start()}>
            Play · KES {g.stake}
          </button>
        </div>
      )}
    </div>
  )
}

function Controls() {
  const g = useGame()
  const lock = g.phase === 'play'
  return (
    <div className={'controls' + (lock ? ' lock' : '')}>
      <div className="grp">
        <small>Stake</small>
        <div className="seg">
          {STAKES.map(v => (
            <button key={v} className={g.stake === v ? 'on' : ''} disabled={lock} onClick={() => game.setStake(v)}>
              {v}
            </button>
          ))}
        </div>
      </div>
      <div className="grp">
        <small>Cracks</small>
        <div className="seg">
          {LEVELS.map((lv, i) => (
            <button key={i} className={g.lvl === i ? 'on' : ''} disabled={lock} onClick={() => game.setLevel(i)}>
              {lv.name} · {lv.cracks}
            </button>
          ))}
        </div>
      </div>
      <button className="btn ghostbtn newcard" disabled={lock} onClick={() => game.newCard()}>
        <Shuffle /> New card
      </button>
    </div>
  )
}

export default function App() {
  const g = useGame()
  return (
    <div className="app">
      <header>
        <div className="logo" aria-label="Flip Bingo">
          <span>FLIP</span>
          <span>BINGO</span>
        </div>
        <div className="hright">
          <button className="snd" onClick={() => game.toggleSound()} aria-label={g.sound ? 'Mute sound' : 'Turn sound on'}>
            {g.sound ? <Volume2 /> : <VolumeX />}
          </button>
          <div className="bal">
            <small>Balance</small>
            <b>KES {g.pts.toLocaleString()}</b>
          </div>
        </div>
      </header>
      <main>
        <section className="left">
          <Card />
          <Controls />
        </section>
        <section className="mid">
          <Board />
        </section>
        <section className="right">
          <Pot />
          <div className="hist">
            <small>Last games</small>
            <div>
              {g.history.length ? g.history.map(h => <span key={h.id} className={h.win ? 'w' : 'l'}>{h.txt}</span>) : <i>No games yet</i>}
            </div>
          </div>
          <div className="how">
            <b>How to play</b>
            <p>Flip tiles to call numbers. Every number on your card raises the pot. Every line you finish banks a bonus at once. A crack ends the game and the pot is lost, so collect when you're happy.</p>
          </div>
        </section>
      </main>
    </div>
  )
}
