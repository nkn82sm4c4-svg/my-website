import { ArrowLeft, Camera, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { QRCode } from '../components/qr/QRCard'
import { Button } from '../components/ui/Button'
import { QR_PLACEMENTS, RESTAURANT } from '../config/restaurant'
import { analytics } from '../services/analyticsService'
import { useUI } from '../store/UIContext'

/**
 * Entry of the customer journey: the QR table tent.
 * "Simulate scan" plays the scan animation then opens the menu home.
 */
export function ScanPage() {
  const { navigate, toast, table } = useUI()
  const [scanning, setScanning] = useState(false)

  const simulate = () => {
    setScanning(true)
    analytics.track('qrScans')
    setTimeout(() => {
      navigate('home')
      toast(`مرحبًا بك في سنمار 👋 طاولة ${table ?? RESTAURANT.demo.defaultTable}`)
    }, 1700)
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-ink px-6 pt-10 pb-10 text-cream">
      <div className="pointer-events-none absolute -top-32 left-1/2 size-[480px] -translate-x-1/2 rounded-full bg-brand/40 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-20 size-[380px] rounded-full bg-gold/20 blur-[90px]" />

      <div className="relative text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand font-display text-3xl font-extrabold shadow-float">
          س
        </span>
        <h1 className="mt-4 font-display text-4xl font-extrabold">{RESTAURANT.name}</h1>
        <p className="mt-1 text-cream/70">{RESTAURANT.tagline}</p>
      </div>

      {/* table tent */}
      <div className="relative mx-auto mt-8 max-w-[300px]">
        <div className="rounded-[32px] bg-cream p-6 text-center text-ink shadow-float">
          <p className="text-xs font-bold tracking-wide text-brand">طاولة {table ?? RESTAURANT.demo.defaultTable}</p>
          <p className="mt-1 font-display text-lg leading-snug font-bold">امسح QR للوصول إلى منيو سنمار</p>
          <div className="relative mx-auto mt-4 w-fit">
            <QRCode size={180} className="shadow-none ring-1 ring-line" />
            {scanning && (
              <>
                <span className="absolute inset-0 rounded-2xl ring-4 ring-brand/70" />
                <span className="absolute inset-x-2 h-1 animate-scan rounded-full bg-brand shadow-[0_0_20px_4px_rgb(179_18_31/0.6)]" />
              </>
            )}
            {/* corner marks */}
            {['top-0 right-0 border-t-4 border-r-4', 'top-0 left-0 border-t-4 border-l-4', 'bottom-0 right-0 border-b-4 border-r-4', 'bottom-0 left-0 border-b-4 border-l-4'].map((c) => (
              <span key={c} className={`absolute size-6 rounded-md border-brand ${c}`} />
            ))}
          </div>
          <p className="mt-3 text-[11px] text-muted">منيو • عروض • مكافآت — بدون تحميل تطبيق</p>
        </div>
      </div>

      <div className="relative mx-auto mt-8 max-w-[340px] space-y-3">
        <Button variant="gold" size="lg" block onClick={simulate} disabled={scanning} icon={<Camera className="size-5" />}>
          {scanning ? 'جاري المسح…' : 'محاكاة مسح QR'}
        </Button>
        <button onClick={() => navigate('home')} className="tap flex w-full items-center justify-center gap-1 py-2 text-sm font-medium text-cream/70">
          تخطي إلى المنيو <ArrowLeft className="size-4" />
        </button>
      </div>

      <div className="relative mx-auto mt-8 max-w-[380px]">
        <p className="mb-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-cream/60">
          <Smartphone className="size-4" /> أماكن QR المقترحة في سنمار
        </p>
        <div className="grid grid-cols-2 gap-2">
          {QR_PLACEMENTS.map((p, i) => (
            <div key={p.id} className="rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
              <p className="text-xl">{['🪑', '🧾', '🛍️', '🪧'][i]}</p>
              <p className="mt-1 text-sm font-bold">{p.label}</p>
              <p className="text-[11px] text-cream/60">{p.hint}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
