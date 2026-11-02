/** The Bingo Lounge mark: three balls under a crown, the name, and the tagline. */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={'logo' + (compact ? ' compact' : '')} aria-label="Bingo Lounge">
      <div className="logo-balls" aria-hidden="true">
        <span className="crown">♛</span>
        <i style={{ '--b': '#e8304a' } as React.CSSProperties}>7</i>
        <i style={{ '--b': '#2bb24c' } as React.CSSProperties}>3</i>
        <i style={{ '--b': '#2f7de1' } as React.CSSProperties}>5</i>
      </div>
      <b>
        BINGO
        <br />
        LOUNGE
      </b>
      {!compact && <small>— PLAY • WIN • SMILE —</small>}
    </div>
  )
}
