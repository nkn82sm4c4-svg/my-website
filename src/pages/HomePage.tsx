import { ArrowLeft, Box, ChevronLeft, Gift, QrCode, ShoppingBag, Star } from 'lucide-react'
import { Container } from '../components/layout/Container'
import { LoyaltyCard } from '../components/loyalty/LoyaltyCard'
import { Countdown } from '../components/offers/Countdown'
import { OfferCard } from '../components/offers/OfferCard'
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
  { id: 'offers', emoji: '🔥', label: 'عروض اليوم', hint: 'خصومات لفترة محدودة' },
  { id: 'best', emoji: '🍔', label: 'الأكثر طلبًا', hint: 'اختيارات عملائنا' },
  { id: 'loyalty', emoji: '🎁', label: 'برنامج الولاء', hint: '5 طلبات = مكافأة' },
  { id: 'featured', emoji: '⭐', label: 'منتجات مميزة', hint: 'شاهدها بتجربة 3D' },
  { id: 'menu', emoji: '🛒', label: 'ابدأ الطلب', hint: 'تصفح المنيو كاملًا' },
] as const

const LOYALTY_STEPS = [
  { icon: ShoppingBag, title: 'اطلب', text: 'من الموقع أو عند الكاشير' },
  { icon: Star, title: 'اجمع', text: 'كل طلب = ختم في بطاقتك الرقمية' },
  { icon: Gift, title: 'استمتع', text: `بعد ${RESTAURANT.loyalty.goal} طلبات: ${RESTAURANT.loyalty.rewardTitle}` },
]

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
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-48 left-1/2 size-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgb(232_163_61/0.28),transparent_65%)] md:left-1/4" />
        <Container className="relative grid grid-cols-1 items-center gap-4 pt-2 md:grid-cols-2 md:gap-10 md:pt-10 md:pb-6">
          <div>
            <p className="animate-fade-up text-sm font-semibold text-brand md:text-base">
              مطعم {RESTAURANT.name} • {RESTAURANT.city}
            </p>
            <h1 className="mt-1 animate-fade-up font-display text-[44px] leading-none font-extrabold tracking-tight [animation-delay:60ms] md:text-7xl">
              {RESTAURANT.name}
            </h1>
            <p className="mt-3 max-w-md animate-fade-up text-lg leading-snug font-medium text-ink-soft [animation-delay:120ms] md:text-2xl">
              {RESTAURANT.tagline}
            </p>
            <div className="mt-6 hidden animate-fade-up flex-wrap gap-3 [animation-delay:180ms] md:flex">
              <button
                onClick={() => navigate('menu')}
                className="tap flex h-14 items-center gap-2 rounded-2xl bg-brand px-7 text-base font-bold text-white shadow-float"
              >
                تصفح المنيو <ArrowLeft className="size-5" />
              </button>
              <button
                onClick={() => navigate('offers')}
                className="tap flex h-14 items-center gap-2 rounded-2xl bg-white px-7 text-base font-bold shadow-card"
              >
                🔥 عروض اليوم
              </button>
            </div>
            <ul className="mt-6 hidden gap-5 text-sm font-semibold text-ink-soft md:flex">
              <li className="flex items-center gap-1.5">
                <QrCode className="size-4 text-brand" /> منيو QR بدون تطبيق
              </li>
              <li className="flex items-center gap-1.5">
                <Box className="size-4 text-brand" /> وجبات بتجربة 3D
              </li>
              <li className="flex items-center gap-1.5">
                <Gift className="size-4 text-brand" /> مكافآت للعملاء
              </li>
            </ul>
          </div>

          {/* live 3D hero */}
          <div className="relative h-[300px] animate-fade-up [animation-delay:180ms] md:h-[520px]">
            <div className="absolute inset-x-10 bottom-8 h-12 rounded-[50%] bg-ink/10 blur-xl" />
            <ModelViewer model="burger" compact />
            <div className="absolute bottom-3 left-0 flex items-center gap-2 rounded-2xl bg-white/90 p-2 pl-3 shadow-card backdrop-blur md:bottom-8">
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
        </Container>

        {/* quick sections */}
        <Container className="mt-4 md:mt-8">
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar md:mx-0 md:grid md:grid-cols-5 md:gap-4 md:overflow-visible md:px-0">
            {QUICK.map((q, i) => (
              <button
                key={q.id}
                onClick={() => jump(q.id)}
                style={{ animationDelay: `${220 + i * 50}ms` }}
                className="tap flex shrink-0 animate-fade-up items-center gap-2 rounded-2xl bg-white px-3.5 py-2.5 text-sm font-semibold shadow-card transition-shadow hover:shadow-float md:flex-col md:items-start md:gap-1 md:rounded-3xl md:p-5 md:text-start"
              >
                <span className="text-lg md:text-3xl">{q.emoji}</span>
                <span className="md:mt-2 md:text-base md:font-bold">{q.label}</span>
                <span className="hidden text-xs font-medium text-muted md:block">{q.hint}</span>
              </button>
            ))}
          </div>
        </Container>
      </section>

      {/* OFFERS */}
      <section className="mt-12 md:mt-20" id="sec-offers">
        <Container className="px-0 md:px-8">
          <SectionHeader
            emoji="🔥"
            title="عروض اليوم"
            subtitle={<Countdown className="inline-flex items-center gap-1 text-brand" />}
            action={{ label: 'كل العروض', onClick: () => navigate('offers') }}
          />
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-3 no-scrollbar md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0">
            {offers.slice(0, 3).map((o) => (
              <OfferCard key={o.id} offer={o} variant="carousel" />
            ))}
          </div>
        </Container>
      </section>

      {/* BEST SELLERS */}
      <section className="mt-10 md:mt-16" id="sec-best">
        <Container className="px-0 md:px-8">
          <SectionHeader
            emoji="🍔"
            title="الأكثر طلبًا"
            subtitle="اختيارات عملاء سنمار هذا الأسبوع"
            action={{ label: 'المنيو كامل', onClick: () => navigate('menu', 'best') }}
          />
          <div className="flex snap-x gap-3 overflow-x-auto px-5 pb-3 no-scrollbar md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 lg:grid-cols-6">
            {best.map((p, i) => (
              <ProductCard key={p.id} product={p} rank={i + 1} />
            ))}
          </div>
        </Container>
      </section>

      {/* LOYALTY */}
      <section className="mt-10 md:mt-20" id="sec-loyalty">
        <Container className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-14">
          <div className="order-2 md:order-1">
            <p className="text-sm font-bold text-brand">برنامج ولاء سنمار</p>
            <h2 className="mt-1 text-3xl leading-tight font-extrabold md:text-4xl">كل طلب يقرّبك من مكافأتك 🎁</h2>
            <p className="mt-3 max-w-md leading-relaxed text-ink-soft">
              بطاقة ختم رقمية تُحفظ تلقائيًا — بدون كروت ورقية وبدون تسجيل معقّد. اجمع {RESTAURANT.loyalty.goal} طلبات واحصل على مكافأة
              مجانية.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {LOYALTY_STEPS.map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl bg-white p-3 shadow-card md:p-4">
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand">
                    <Icon className="size-5" />
                  </span>
                  <p className="mt-2 font-display font-bold">{title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted md:text-xs">{text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="order-1 md:order-2">
            <LoyaltyCard onOpen={() => navigate('loyalty')} />
          </div>
        </Container>
      </section>

      {/* FEATURED */}
      <section className="mt-12 md:mt-20" id="sec-featured">
        <Container className="px-0 md:px-8">
          <SectionHeader emoji="⭐" title="منتجات مميزة" subtitle="اضغط وشاهد وجبتك بتجربة 3D من كل الزوايا" />
          <div className="grid grid-cols-2 gap-3 px-5 md:grid-cols-4 md:gap-5 md:px-0">
            {featured.slice(0, 4).map((p, i) => (
              <button
                key={p.id}
                onClick={() => openProduct(p.id, '3d')}
                style={{ animationDelay: `${i * 70}ms` }}
                className="tap group relative flex animate-fade-up flex-col overflow-hidden rounded-3xl bg-white p-3 text-start shadow-card transition-shadow hover:shadow-float md:p-5"
              >
                <span className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold text-cream">
                  <Box className="size-3" /> 3D
                </span>
                <ProductImage
                  src={p.image}
                  alt={p.name}
                  tint={p.tint}
                  className="h-32 transition-transform duration-500 group-hover:scale-105 md:h-48"
                />
                <span className="mt-1 line-clamp-1 font-bold md:text-lg">{p.name}</span>
                <Price value={p.price} size="sm" className="text-brand" />
              </button>
            ))}
          </div>
        </Container>
      </section>

      {/* QR */}
      <section className="mt-12 md:mt-20">
        <Container className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-14">
          <div>
            <p className="text-sm font-bold text-brand">منيو QR</p>
            <h2 className="mt-1 text-3xl leading-tight font-extrabold md:text-4xl">امسح… واطلب من مكانك</h2>
            <p className="mt-3 max-w-md leading-relaxed text-ink-soft">
              الموقع يفتح مباشرة من كاميرا الجوال — بدون تحميل أي تطبيق. رمز QR على الطاولات، وعند الكاشير، وعلى التغليف، وعلى الملصقات.
            </p>
          </div>
          <QRCard onSimulate={() => navigate('scan')} />
        </Container>
      </section>

      {/* START ORDER */}
      <section className="mt-12 md:mt-20">
        <Container>
          <button
            onClick={() => navigate('menu')}
            className="tap relative flex w-full items-center justify-between overflow-hidden rounded-[28px] bg-brand p-5 text-start text-white shadow-float md:p-10"
          >
            <span className="pointer-events-none absolute inset-y-0 w-1/3 animate-shine bg-gradient-to-l from-transparent via-white/20 to-transparent" />
            <span>
              <span className="block text-sm text-white/80 md:text-base">جاهز تطلب؟</span>
              <span className="block font-display text-2xl font-extrabold md:text-4xl">🛒 ابدأ الطلب</span>
            </span>
            <span className="grid size-12 place-items-center rounded-2xl bg-white/15 md:size-16">
              <ArrowLeft className="size-6 md:size-8" />
            </span>
          </button>
        </Container>
      </section>
    </div>
  )
}
