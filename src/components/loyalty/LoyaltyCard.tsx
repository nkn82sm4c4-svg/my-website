import { Gift, Sparkles, Zap } from 'lucide-react'
import { RESTAURANT } from '../../config/restaurant'
import { remainingText, useLoyaltyActions } from '../../hooks/useLoyaltyActions'
import { cx } from '../../lib/format'
import { useLoyalty } from '../../store/LoyaltyContext'
import { useUI } from '../../store/UIContext'
import { Stamps } from './Stamps'

interface Props {
  /** Show the "simulate order" demo button. */
  demoControls?: boolean
  className?: string
  onOpen?: () => void
}

export function LoyaltyCard({ demoControls = true, className, onOpen }: Props) {
  const { state, remaining } = useLoyalty()
  const { stamp } = useLoyaltyActions()
  const { setRewardCelebration } = useUI()
  const ready = state.rewardReady

  return (
    <section
      className={cx(
        'relative overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#2a1510_0%,#1a0f0c_55%,#3a1a0e_100%)] p-5 text-cream shadow-float',
        className,
      )}
    >
      {/* decorative glows */}
      <div className="pointer-events-none absolute -top-16 -left-10 size-48 rounded-full bg-gold/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 -bottom-20 size-48 rounded-full bg-brand/40 blur-3xl" />
      <span className="pointer-events-none absolute inset-y-0 w-1/4 animate-shine bg-gradient-to-l from-transparent via-white/10 to-transparent" />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <button onClick={onOpen} className="text-start" disabled={!onOpen}>
            <p className="flex items-center gap-1.5 text-xs font-medium text-gold">
              <Sparkles className="size-3.5" /> {RESTAURANT.nameLatin} REWARDS
            </p>
            <h3 className="mt-1 text-lg font-bold">🎁 برنامج ولاء سنمار</h3>
            <p className="text-sm text-cream/70">اجمع {state.goal} طلبات واحصل على مكافأة</p>
          </button>
          <div className="text-left" key={state.stamps}>
            <p className="animate-pop font-display text-4xl font-extrabold tabular-nums" dir="ltr">
              {state.stamps}
              <span className="text-xl text-cream/40"> / {state.goal}</span>
            </p>
          </div>
        </div>

        <div className="mt-5">
          <Stamps stamps={state.stamps} goal={state.goal} />
        </div>

        <p className={cx('mt-4 text-sm font-medium', ready ? 'text-gold' : 'text-cream/85')}>{remainingText(remaining)}</p>

        {demoControls && (
          <div className="mt-4 flex gap-2">
            {ready ? (
              <button
                onClick={() => setRewardCelebration(true)}
                className="tap flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-gold font-bold text-ink shadow-[0_10px_30px_-10px_rgb(232_163_61/0.9)]"
              >
                <Gift className="size-5" /> استخدم المكافأة
              </button>
            ) : (
              <button
                onClick={() => stamp()}
                className="tap flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-cream font-bold text-ink"
              >
                <Zap className="size-4 text-brand" /> محاكاة طلب
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
