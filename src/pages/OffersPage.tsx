import { Crown } from 'lucide-react'
import { Countdown } from '../components/offers/Countdown'
import { OfferCard } from '../components/offers/OfferCard'
import { menuService } from '../services/menuService'

export function OffersPage() {
  const offers = menuService.offers()
  const regular = offers.filter((o) => !o.membersOnly)
  const members = offers.filter((o) => o.membersOnly)

  return (
    <div className="px-5 pt-3 pb-10">
      <h1 className="text-3xl font-extrabold">🔥 عروض سنمار</h1>
      <div className="mt-1 flex items-center justify-between text-sm text-muted">
        <span>عروض اليوم لفترة محدودة</span>
        <Countdown className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand" />
      </div>

      <div className="mt-5 space-y-4">
        {regular.map((o, i) => (
          <div key={o.id} className="animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
            <OfferCard offer={o} />
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-2">
        <Crown className="size-5 text-gold" />
        <h2 className="text-xl font-bold">عرض خاص لأعضاء الولاء</h2>
      </div>
      <p className="mb-4 text-sm text-muted">سبب إضافي يخلي العميل يرجع — العروض الحصرية تظهر فقط للأعضاء.</p>
      <div className="space-y-4">
        {members.map((o) => (
          <OfferCard key={o.id} offer={o} />
        ))}
      </div>
    </div>
  )
}
