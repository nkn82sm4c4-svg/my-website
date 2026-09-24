import { ArrowLeft, Box, ChevronLeft } from 'lucide-react'
import { OfferCard } from '../components/offers/OfferCard'
import { Countdown } from '../components/offers/Countdown'
import { LoyaltyCard } from '../components/loyalty/LoyaltyCard'
import { ProductCard } from '../components/product/ProductCard'
import { ProductImage } from '../components/product/ProductImage'
import { QRCard } from '../components/qr/QRCard'
import { ModelViewer } from '../components/three/ModelViewer'
import { Price } from '../components/ui/Price'
import { SectionHeader } from '../components/ui/SectionHeader'
import { RESTAURANT } from '../config/restaurant'
import { productById } from '../data/menu'
import { menuService } from '../services/menuService'
import { useUI } from '../store/UIContext'

const QUICK = [
  { id: 'offers', emoji: '🔥', label: 'عروض اليوم' },
  { id: 'best', emoji: '🍔', label: 'الأكثر طلبًا' },
  { id: 'loyalty', emoji: '🎁', label: 'برنامج الولاء' },
  { id: 'featured', emoji: '⭐', label: 'منتجات مميزة' },
  { id: 'menu', emoji: '🛒', label: 'ابدأ الطلب' },
] as const

export function HomePage() {
  const { navigate, openProduct } = useUI()
  const offers = menuService.offers()
  const best = menuService.bestSellers(6)
  const featured = menuService.featured()
  const hero = productById('darba-classic')!

  const jump = (id: (typeof QUICK)[number]['id']) => {
    if (id === 'offers' || id === 'loyalty' || id === 'menu') return navigate(id)
    document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="pb-8">
      {/* HERO */}
      <section className="relative overflow-hidden px-5 pt-2">
        <div className="pointer-events-none absolute -top-40 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgb(232_163_61/0.3),transparent_65%)]" />
        <div className="relative">
          <p className="animate-fade-up text-sm font-semibold text-brand">أهلًا بك في</p>
          <h1 className="animate-fade-up font-display text-[44px] leading-none font-extrabold tracking-tight [animation-delay:60ms]">
            {RESTAURANT.name}
          </h1>
          <p className="mt-2 max-w-[18rem] animate-fade-up text-lg leading-snug font-medium text-ink-soft [animation-delay:120ms]">
            {RESTAURANT.tagline}
          </p>
        </div>

        {/* live 3D hero */}
        <div className="relative mt-3 h-[300px] animate-fade-up [animation-delay:180ms]">
          <div className="absolute inset-x-6 bottom-6 h-10 rounded-[50%] bg-ink/10 blur-xl" />
          <ModelViewer model="burger" compact />
          <div className="absolute bottom-3 left-0 flex items-center gap-2 rounded-2xl bg-white/90 p-2 pl-3 shadow-card backdrop-blur">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-soft">
              <Box className="size-5 text-brand" />
            </span>
            <span>
              <span className="block text-xs font-bold">{hero.name}</span>
              <Price value={hero.price} size="sm" />
            </span>
            <button
              onClick={() => openProduct(hero.id, '3d')}
              aria-label="افتح المنتج"
              className="tap mr-1 grid size-8 place-items-center rounded-lg bg-ink text-cream"
            >
              <ChevronLeft className="size-4" />
            </button>
          </div>
        </div>

        {/* quick sections */}
        <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar">
          {QUICK.map((q, i) => (
            <button
              key={q.id}
              onClick={() => jump(q.id)}
              style={{ animationDelay: `${220 + i * 50}ms` }}
              className="tap flex shrink-0 animate-fade-up items-center gap-2 rounded-2xl bg-white px-3.5 py-2.5 text-sm font-semibold shadow-card"
            >
              <span className="text-lg">{q.emoji}</span>
              {q.label}
            </button>
          ))}
        </div>
      </section>

      {/* OFFERS */}
      <section className="mt-8" id="sec-offers">
        <SectionHeader
          emoji="🔥"
          title="عروض اليوم"
          subtitle={<Countdown className="inline-flex items-center gap-1 text-brand" />}
          action={{ label: 'كل العروض', onClick: () => navigate('offers') }}
        />
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-3 no-scrollbar">
          {offers.slice(0, 3).map((o) => (
            <OfferCard key={o.id} offer={o} variant="carousel" />
          ))}
        </div>
      </section>

      {/* BEST SELLERS */}
      <section className="mt-6" id="sec-best">
        <SectionHeader emoji="🍔" title="الأكثر طلبًا" subtitle="اختيارات عملاء سنمار هذا الأسبوع" action={{ label: 'المنيو', onClick: () => navigate('menu', 'best') }} />
        <div className="flex snap-x gap-3 overflow-x-auto px-5 pb-3 no-scrollbar">
          {best.map((p, i) => (
            <ProductCard key={p.id} product={p} rank={i + 1} />
          ))}
        </div>
      </section>

      {/* LOYALTY */}
      <section className="mt-6 px-5" id="sec-loyalty">
        <LoyaltyCard onOpen={() => navigate('loyalty')} />
      </section>

      {/* FEATURED */}
      <section className="mt-8" id="sec-featured">
        <SectionHeader emoji="⭐" title="منتجات مميزة" subtitle="اضغط 3D وشاهد وجبتك من كل الزوايا" />
        <div className="grid grid-cols-2 gap-3 px-5">
          {featured.slice(0, 4).map((p, i) => (
            <button
              key={p.id}
              onClick={() => openProduct(p.id, '3d')}
              style={{ animationDelay: `${i * 70}ms` }}
              className="tap group relative flex animate-fade-up flex-col overflow-hidden rounded-3xl bg-white p-3 text-start shadow-card"
            >
              <span className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold text-cream">
                <Box className="size-3" /> 3D
              </span>
              <ProductImage src={p.image} alt={p.name} tint={p.tint} className="h-32" />
              <span className="mt-1 line-clamp-1 font-bold">{p.name}</span>
              <Price value={p.price} size="sm" className="text-brand" />
            </button>
          ))}
        </div>
      </section>

      {/* QR */}
      <section className="mt-8 px-5">
        <QRCard onSimulate={() => navigate('scan')} />
      </section>

      {/* START ORDER */}
      <section className="mt-6 px-5">
        <button
          onClick={() => navigate('menu')}
          className="tap relative flex w-full items-center justify-between overflow-hidden rounded-[28px] bg-brand p-5 text-start text-white shadow-float"
        >
          <span className="pointer-events-none absolute inset-y-0 w-1/3 animate-shine bg-gradient-to-l from-transparent via-white/20 to-transparent" />
          <span>
            <span className="block text-sm text-white/80">جاهز تطلب؟</span>
            <span className="block font-display text-2xl font-extrabold">🛒 ابدأ الطلب</span>
          </span>
          <span className="grid size-12 place-items-center rounded-2xl bg-white/15">
            <ArrowLeft className="size-6" />
          </span>
        </button>
        <p className="mt-6 text-center text-[11px] leading-relaxed text-muted">
          نموذج تجريبي (Demo) — الأسماء والأسعار والعروض للعرض فقط وليست أسعار سنمار الفعلية.
        </p>
      </section>
    </div>
  )
}
