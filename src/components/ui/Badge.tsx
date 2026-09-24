import type { BadgeKind } from '../../types'
import { cx } from '../../lib/format'

const META: Record<BadgeKind, { label: string; cls: string }> = {
  bestseller: { label: '🔥 الأكثر مبيعًا', cls: 'bg-brand text-white' },
  new: { label: 'جديد', cls: 'bg-leaf text-white' },
  spicy: { label: '🌶️ حار', cls: 'bg-orange-100 text-orange-800' },
  chef: { label: '⭐ مميز', cls: 'bg-gold-soft text-amber-900' },
  value: { label: 'قيمة أعلى', cls: 'bg-ink text-cream' },
  sharing: { label: 'للمشاركة', cls: 'bg-sky-100 text-sky-900' },
}

export function Badge({ kind, className }: { kind: BadgeKind; className?: string }) {
  const m = META[kind]
  return (
    <span className={cx('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold leading-5 whitespace-nowrap', m.cls, className)}>
      {m.label}
    </span>
  )
}

export function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', className)}>{children}</span>
  )
}
