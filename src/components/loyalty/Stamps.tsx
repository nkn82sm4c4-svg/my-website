import { Check, Gift } from 'lucide-react'
import { cx } from '../../lib/format'

/** ● ● ● ○ ○ — the visual stamp card. The last slot is the gift. */
export function Stamps({ stamps, goal, size = 'md' }: { stamps: number; goal: number; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'size-8' : 'size-12'
  return (
    <div className="flex items-center justify-between gap-1.5" aria-label={`${stamps} من ${goal}`}>
      {Array.from({ length: goal }, (_, i) => {
        const filled = i < stamps
        const last = i === goal - 1
        return (
          <div key={i} className="flex flex-1 items-center gap-1.5 last:flex-none">
            <span
              key={filled ? `f${i}` : `e${i}`}
              className={cx(
                'relative grid shrink-0 place-items-center rounded-full border-2 transition-all duration-500',
                dim,
                filled
                  ? 'animate-pop border-gold bg-gradient-to-br from-[#ffd07a] to-gold text-ink shadow-[0_0_18px_rgb(232_163_61/0.55)]'
                  : 'border-dashed border-cream/30 text-cream/40',
              )}
            >
              {last ? <Gift className={size === 'sm' ? 'size-4' : 'size-5'} /> : filled ? <Check className="size-5" strokeWidth={3} /> : <span className="text-xs font-bold">{i + 1}</span>}
            </span>
            {i < goal - 1 && (
              <span className={cx('h-0.5 flex-1 rounded-full transition-colors duration-500', i < stamps - 1 ? 'bg-gold' : 'bg-cream/15')} />
            )}
          </div>
        )
      })}
    </div>
  )
}
