import { RESTAURANT } from '../../config/restaurant'
import { cx } from '../../lib/format'

export function Price({
  value,
  original,
  size = 'md',
  className,
}: {
  value: number
  original?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const s = { sm: 'text-sm', md: 'text-base', lg: 'text-2xl' }[size]
  return (
    <span className={cx('inline-flex items-baseline gap-1.5 font-display font-bold tabular-nums', s, className)}>
      {value === 0 ? (
        <span className="text-leaf">مجانًا</span>
      ) : (
        <span>
          {value} <span className="text-[0.7em] font-semibold opacity-70">{RESTAURANT.currency}</span>
        </span>
      )}
      {original && original > value ? (
        <span className="text-[0.7em] font-medium text-muted line-through decoration-brand/60">{original}</span>
      ) : null}
    </span>
  )
}
