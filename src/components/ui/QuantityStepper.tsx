import { Minus, Plus, Trash2 } from 'lucide-react'
import { cx } from '../../lib/format'

interface Props {
  value: number
  onChange: (v: number) => void
  min?: number
  size?: 'sm' | 'md'
  allowRemove?: boolean
}

export function QuantityStepper({ value, onChange, min = 1, size = 'md', allowRemove }: Props) {
  const btn = size === 'sm' ? 'size-8' : 'size-10'
  const showTrash = allowRemove && value <= 1
  return (
    <div className="inline-flex items-center gap-1 rounded-2xl bg-sand p-1">
      <button
        aria-label="زيادة"
        onClick={() => onChange(value + 1)}
        className={cx('tap grid place-items-center rounded-xl bg-white text-ink shadow-sm', btn)}
      >
        <Plus className="size-4" />
      </button>
      <span key={value} className="w-7 animate-pop text-center font-display font-bold tabular-nums">
        {value}
      </span>
      <button
        aria-label={showTrash ? 'حذف' : 'إنقاص'}
        onClick={() => onChange(value - 1)}
        disabled={!allowRemove && value <= min}
        className={cx(
          'tap grid place-items-center rounded-xl disabled:opacity-40',
          showTrash ? 'bg-brand-soft text-brand' : 'bg-white text-ink shadow-sm',
          btn,
        )}
      >
        {showTrash ? <Trash2 className="size-4" /> : <Minus className="size-4" />}
      </button>
    </div>
  )
}
