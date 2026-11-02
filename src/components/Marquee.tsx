/** The lobby header: the name and a row of chasing bulbs. */
export function Marquee() {
  return (
    <header className="top">
      <div className="brand">
        <h1>Bingo Lounge</h1>
        <p>Seven bingo games, one hall. Pick a seat.</p>
      </div>
      <div className="bulbs" aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => (
          <i key={i} />
        ))}
      </div>
    </header>
  )
}
