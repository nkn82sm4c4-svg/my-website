import { Gift, ShoppingBag, Ticket } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { RESTAURANT } from '../../config/restaurant'
import { useLoyaltyActions } from '../../hooks/useLoyaltyActions'
import { useLoyalty } from '../../store/LoyaltyContext'
import { useUI } from '../../store/UIContext'
import { ProductImage } from '../product/ProductImage'
import { img } from '../../config/models'
import { Button } from '../ui/Button'
import { Confetti } from '../ui/Confetti'

/** 🎉 Reward unlocked → use it → coupon code. */
export function RewardModal() {
  const { rewardCelebration } = useUI()
  return rewardCelebration ? <RewardDialog /> : null
}

function RewardDialog() {
  const { setRewardCelebration, navigate, toast } = useUI()
  const { state } = useLoyalty()
  const { redeemReward } = useLoyaltyActions()
  const [code, setCode] = useState<string | null>(null)

  const close = () => setRewardCelebration(false)

  return createPortal(
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-5" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade bg-ink/70 backdrop-blur-sm" onClick={close} />
      <Confetti />
      <div className="relative w-full max-w-sm animate-pop overflow-hidden rounded-[32px] bg-cream p-6 text-center shadow-float">
        <div className="pointer-events-none absolute -top-24 left-1/2 size-64 -translate-x-1/2 rounded-full bg-gold/30 blur-3xl" />
        {!code ? (
          <div className="relative">
            <p className="text-5xl">🎉</p>
            <h2 className="mt-2 text-3xl font-extrabold">مبروك!</h2>
            <p className="mt-1 text-lg font-semibold text-ink-soft">مكافأتك أصبحت جاهزة</p>
            <ProductImage src={img('combo-meal')} alt="" className="mx-auto mt-3 h-36 w-48 animate-float" />
            <div className="mx-auto mt-2 inline-flex items-center gap-2 rounded-2xl bg-gold-soft px-4 py-2 text-sm font-bold text-amber-900">
              <Gift className="size-4" /> {RESTAURANT.loyalty.rewardTitle}
            </div>
            <p className="mt-3 text-xs text-muted">أكملت {state.goal} طلبات — شكرًا لأنك من عائلة سنمار</p>
            <Button
              variant="primary"
              size="lg"
              block
              className="mt-5"
              icon={<Gift className="size-5" />}
              onClick={() => {
                const c = redeemReward()
                setCode(c)
                toast('أضفنا المكافأة إلى سلتك مجانًا', '🎁')
              }}
            >
              استخدم المكافأة
            </Button>
            <button onClick={close} className="mt-3 text-sm font-medium text-muted">
              لاحقًا
            </button>
          </div>
        ) : (
          <div className="relative">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-leaf text-white">
              <Ticket className="size-8" />
            </span>
            <h2 className="mt-3 text-2xl font-extrabold">تم تفعيل مكافأتك</h2>
            <p className="mt-1 text-sm text-muted">أضفناها لسلتك مجانًا، أو اعرض الكود للكاشير</p>
            <div className="mt-4 rounded-2xl border-2 border-dashed border-gold bg-white p-4">
              <p className="text-xs text-muted">كود المكافأة</p>
              <p className="font-display text-3xl font-extrabold tracking-widest" dir="ltr">
                {code}
              </p>
            </div>
            <p className="mt-3 text-xs text-muted">بدأت بطاقة ولاء جديدة: 0 / {state.goal}</p>
            <Button
              size="lg"
              block
              className="mt-5"
              icon={<ShoppingBag className="size-5" />}
              onClick={() => {
                close()
                navigate('cart')
              }}
            >
              اذهب للسلة
            </Button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
