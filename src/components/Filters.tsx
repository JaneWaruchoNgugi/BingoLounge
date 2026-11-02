import { KIND_LABEL, type Kind } from '../games'

export type Filter = 'all' | Kind
const ORDER: Kind[] = ['live', 'instant', 'hybrid']

/** All / Live draw / Instant / Hybrid chips. */
export function Filters({ value, total, onChange }: { value: Filter; total: number; onChange: (f: Filter) => void }) {
  return (
    <div className="chips" role="group" aria-label="Filter games">
      <button className="chip" aria-pressed={value === 'all'} onClick={() => onChange('all')}>
        All {total}
      </button>
      {ORDER.map(k => (
        <button key={k} className="chip" aria-pressed={value === k} onClick={() => onChange(k)}>
          {KIND_LABEL[k]}
        </button>
      ))}
    </div>
  )
}
