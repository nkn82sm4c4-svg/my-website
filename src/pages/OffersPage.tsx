import { Crown } from 'lucide-react'
import { Container } from '../components/layout/Container'
import { Countdown } from '../components/offers/Countdown'
import { OfferCard } from '../components/offers/OfferCard'
import { menuService } from '../services/menuService'

export function OffersPage() {
  const offers = menuService.offers()
  const regular = offers.filter((o) => !o.membersOnly)
  const members = offers.filter((o) => o.membersOnly)

  return (
    <div className="pb-6">
      <div className="border-b border-line/60 bg-gradient-to-b from-brand-soft/70 to-transparent">
        <Container className="pt-4 pb-5 md:pt-10 md:pb-8">
          <h1 className="text-3xl font-extrabold md:text-5xl">🔥 عروض سنمار</h1>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-muted md:justify-start md:gap-4 md:text-base">
            <span>عروض اليوم لفترة محدودة</span>
            <Countdown className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand md:text-sm" />
          </div>
        </Container>
      </div>

      <Container>
        <div className="mt-6 grid grid-cols-1 gap-4 md:mt-10 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {regular.map((o, i) => (
            <div key={o.id} className="animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
              <OfferCard offer={o} />
            </div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 items-center gap-6 md:mt-16 md:grid-cols-[1fr_1.2fr] md:gap-12">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="size-6 text-gold" />
              <h2 className="text-2xl font-bold md:text-3xl">عرض خاص لأعضاء الولاء</h2>
            </div>
            <p className="mt-2 leading-relaxed text-muted">
              سبب إضافي يخلّي العميل يرجع — العروض الحصرية تظهر فقط لأعضاء برنامج ولاء سنمار.
            </p>
          </div>
          <div className="space-y-4">
            {members.map((o) => (
              <OfferCard key={o.id} offer={o} />
            ))}
          </div>
        </div>
      </Container>
    </div>
  )
}
