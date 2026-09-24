import { Clock, MapPin, Phone } from 'lucide-react'
import { RESTAURANT } from '../../config/restaurant'
import { useUI } from '../../store/UIContext'
import { QRCode } from '../qr/QRCard'
import { Container } from './Container'
import { NAV_LINKS } from './nav'

export function SiteFooter() {
  const { navigate } = useUI()
  return (
    <footer className="mt-16 bg-ink text-cream">
      <Container className="grid grid-cols-1 gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr_auto]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-11 place-items-center rounded-2xl bg-brand font-display text-2xl font-extrabold">س</span>
            <span className="font-display text-2xl font-extrabold">{RESTAURANT.name}</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-cream/70">{RESTAURANT.tagline}</p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-bold text-gold">روابط</h3>
          <ul className="space-y-2 text-sm">
            {NAV_LINKS.map((l) => (
              <li key={l.id}>
                <button onClick={() => navigate(l.id)} className="text-cream/75 hover:text-cream">
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-bold text-gold">زورونا</h3>
          <ul className="space-y-2.5 text-sm text-cream/75">
            <li className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0" /> {RESTAURANT.city}، القصيم
            </li>
            <li className="flex items-center gap-2">
              <Clock className="size-4 shrink-0" /> يوميًا (أوقات تجريبية)
            </li>
            <li className="flex items-center gap-2">
              <Phone className="size-4 shrink-0" /> رقم التواصل يُضاف لاحقًا
            </li>
          </ul>
        </div>
        <div className="flex items-center gap-4 md:flex-col md:items-start">
          <QRCode size={96} className="!p-2" />
          <p className="text-xs leading-relaxed text-cream/60">
            امسح لفتح الموقع
            <br />
            على جوالك
          </p>
        </div>
      </Container>
      <div className="border-t border-white/10">
        <Container className="py-5 text-center text-[11px] leading-relaxed text-cream/50">
          نموذج تجريبي (Demo) — الأسماء والأسعار والعروض للعرض فقط وليست أسعار سنمار الفعلية. لا يتم تنفيذ أي دفع.
        </Container>
      </div>
    </footer>
  )
}
