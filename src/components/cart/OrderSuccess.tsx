import { Check, Clock, Gift, Home, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { remainingText } from '../../hooks/useLoyaltyActions'
import { formatPrice } from '../../lib/format'
import { useLoyalty } from '../../store/LoyaltyContext'
import { useUI } from '../../store/UIContext'
import type { Order } from '../../types'
import { Stamps } from '../loyalty/Stamps'
import { Button } from '../ui/Button'
import { Confetti } from '../ui/Confetti'

/** 🎉 "تم تسجيل طلبك" → "+1 نقطة ولاء" → live stamp card update. */
export function OrderSuccess({ order, stampAdded, onDone }: { order: Order; stampAdded: boolean; onDone: () => void }) {
  const { state, remaining } = useLoyalty()
  const { navigate, setRewardCelebration } = useUI()
  // show the card *before* the new stamp, then animate it in
  const [shown, setShown] = useState(stampAdded ? Math.max(0, state.stamps - 1) : state.stamps)
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    window.scrollTo({ top: 0 })
    const t1 = setTimeout(() => setPhase(1), 700)
    const t2 = setTimeout(() => {
      setShown(state.stamps)
      setPhase(2)
    }, 1300)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const items = order.lines.reduce((s, l) => s + l.quantity, 0)

  return (
    <div className="relative min-h-[85dvh] overflow-hidden px-5 pt-6 pb-10 text-center">
      <Confetti count={50} />
      <span className="relative mx-auto grid size-24 animate-pop place-items-center rounded-full bg-leaf text-white shadow-[0_20px_40px_-15px_rgb(47_143_78/0.8)]">
        <span className="absolute inset-0 animate-ping rounded-full bg-leaf/30 [animation-iteration-count:2]" />
        <Check className="size-12" strokeWidth={3} />
      </span>
      <h1 className="mt-5 animate-fade-up text-3xl font-extrabold">🎉 تم تسجيل طلبك</h1>
      <p className="mt-1 animate-fade-up text-muted [animation-delay:100ms]">
        طلب رقم <b className="font-display text-ink">#{order.number}</b> • طاولة {order.table}
      </p>

      <div className="mt-5 grid animate-fade-up grid-cols-3 gap-2 [animation-delay:200ms]">
        <Info label="المنتجات" value={String(items)} />
        <Info label="الإجمالي" value={formatPrice(order.total)} />
        <Info label="التحضير" value="≈ 12 د" icon={<Clock className="size-3.5" />} />
      </div>

      {/* loyalty update */}
      <div className="relative mt-6 overflow-hidden rounded-[28px] bg-ink p-5 text-start text-cream shadow-float">
        <div className="pointer-events-none absolute -top-10 -left-10 size-40 rounded-full bg-gold/25 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <p className="font-display font-bold">🎁 برنامج ولاء سنمار</p>
          {stampAdded && phase >= 1 && (
            <span className="flex animate-pop items-center gap-1 rounded-full bg-gold px-3 py-1 text-sm font-extrabold text-ink">
              <Star className="size-4 fill-ink" /> +1 نقطة ولاء
            </span>
          )}
        </div>
        <p className="relative mt-1 font-display text-3xl font-extrabold tabular-nums" dir="ltr" key={shown}>
          <span className="inline-block animate-pop">{shown}</span>
          <span className="text-lg text-cream/40"> / {state.goal}</span>
        </p>
        <div className="relative mt-3">
          <Stamps stamps={shown} goal={state.goal} />
        </div>
        <p className="relative mt-3 text-sm text-cream/85">{phase >= 2 ? remainingText(remaining) : '…'}</p>
        {state.rewardReady && phase >= 2 && (
          <button
            onClick={() => setRewardCelebration(true)}
            className="tap relative mt-3 flex h-12 w-full animate-pop items-center justify-center gap-2 rounded-2xl bg-gold font-bold text-ink"
          >
            <Gift className="size-5" /> استخدم المكافأة
          </button>
        )}
      </div>

      <p className="mt-5 text-xs text-muted">هذا عرض تجريبي — لم يتم تنفيذ أي دفع حقيقي.</p>

      <div className="mt-5 flex gap-2.5">
        <Button
          variant="soft"
          size="lg"
          className="flex-1"
          icon={<Home className="size-5" />}
          onClick={() => {
            onDone()
            navigate('home')
          }}
        >
          الرئيسية
        </Button>
        <Button
          size="lg"
          className="flex-1"
          icon={<Gift className="size-5" />}
          onClick={() => {
            onDone()
            navigate('loyalty')
          }}
        >
          بطاقة الولاء
        </Button>
      </div>
    </div>
  )
}

function Info({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-card">
      <p className="flex items-center justify-center gap-1 text-[11px] text-muted">
        {icon}
        {label}
      </p>
      <p className="font-display font-bold">{value}</p>
    </div>
  )
}
