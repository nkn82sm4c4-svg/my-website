import { Minus, Plus } from 'lucide-react'
import { num } from '../../lib/format'

export function Stepper({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (v: number) => void; label: string }) {
  const btn = 'grid h-11 w-11 place-items-center rounded-2xl bg-white text-forest shadow-sm ring-1 ring-line transition active:scale-95 disabled:opacity-40'
  return (
    <div className="flex items-center gap-3" role="group" aria-label={label}>
      <button className={btn} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="إنقاص">
        <Minus size={18} />
      </button>
      <span className="num w-10 text-center font-display text-2xl font-bold text-forest" aria-live="polite">
        {num(value)}
      </span>
      <button className={btn} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="زيادة">
        <Plus size={18} />
      </button>
    </div>
  )
}
