import { Gift, Receipt, ShoppingBag, Star } from 'lucide-react'
import { Container } from '../components/layout/Container'
import { LoyaltyCard } from '../components/loyalty/LoyaltyCard'
import { OfferCard } from '../components/offers/OfferCard'
import { RESTAURANT } from '../config/restaurant'
import { formatPrice } from '../lib/format'
import { menuService } from '../services/menuService'
import { orderService } from '../services/orderService'
import { useLoyalty } from '../store/LoyaltyContext'

const STEPS = [
  { icon: ShoppingBag, title: 'اطلب', text: 'من المنيو أو عند الكاشير' },
  { icon: Star, title: 'اجمع', text: 'كل طلب = ختم في بطاقتك' },
  { icon: Gift, title: 'استمتع', text: `بعد ${RESTAURANT.loyalty.goal} طلبات: مكافأة مجانية` },
]

export function LoyaltyPage() {
  const { state } = useLoyalty()
  const orders = orderService.list()
  const memberOffer = menuService.offers().find((o) => o.membersOnly)

  return (
    <div className="pb-6">
      <div className="border-b border-line/60 bg-gradient-to-b from-gold-soft to-transparent">
        <Container className="pt-4 pb-5 md:pt-10 md:pb-8">
          <h1 className="text-3xl font-extrabold md:text-5xl">🎁 برنامج الولاء</h1>
          <p className="mt-1 text-sm text-muted md:text-base">أهلًا {state.memberName} — بطاقتك الرقمية دائمًا معك</p>
        </Container>
      </div>

      <Container className="mt-6 grid grid-cols-1 gap-8 md:mt-10 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
        <div>
          <LoyaltyCard />

          <div className="mt-4 rounded-2xl bg-gold-soft p-4 text-sm">
            <p className="font-bold text-amber-900">مكافأتك القادمة</p>
            <p className="mt-0.5 text-amber-900/80">{RESTAURANT.loyalty.rewardTitle}</p>
          </div>

          <h2 className="mt-8 mb-3 text-xl font-bold">كيف يعمل؟</h2>
          <div className="grid grid-cols-3 gap-2.5">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <div
                key={title}
                className="animate-fade-up rounded-2xl bg-white p-3 text-center shadow-card"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="mx-auto grid size-11 place-items-center rounded-xl bg-brand-soft text-brand">
                  <Icon className="size-5" />
                </span>
                <p className="mt-2 font-display font-bold">{title}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl bg-white p-4 shadow-card">
              <p className="text-xs text-muted">مكافآت حصلت عليها</p>
              <p className="font-display text-2xl font-extrabold">{state.rewardsEarned}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-card">
              <p className="text-xs text-muted">مكافآت استخدمتها</p>
              <p className="font-display text-2xl font-extrabold">{state.rewardsRedeemed}</p>
            </div>
          </div>
        </div>

        <div>
          {memberOffer && (
            <>
              <h2 className="mb-3 text-xl font-bold">👑 عرض خاص لأعضاء الولاء</h2>
              <OfferCard offer={memberOffer} />
            </>
          )}

          <h2 className="mt-8 mb-3 text-xl font-bold">طلباتك الأخيرة</h2>
          {orders.length === 0 ? (
            <p className="rounded-2xl bg-white p-5 text-center text-sm text-muted shadow-card">
              لا توجد طلبات بعد — أكّد أول طلب من السلة واكسب نقطة ⭐
            </p>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-white shadow-card">
              {orders.slice(0, 6).map((o) => (
                <li key={o.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-sand">
                    <Receipt className="size-5 text-ink-soft" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-bold">طلب #{o.number}</span>
                    <span className="block text-xs text-muted">
                      {new Date(o.createdAt).toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </span>
                  <span className="text-left">
                    <span className="block font-display text-sm font-bold">{formatPrice(o.total)}</span>
                    <span className="block text-[11px] font-semibold text-leaf">+1 نقطة</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </div>
  )
}
