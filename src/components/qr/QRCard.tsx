import { QrCode } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { QR_PLACEMENTS, RESTAURANT } from '../../config/restaurant'
import { cx } from '../../lib/format'

/** URL encoded in the table QR: the live demo + table number deep link. */
// eslint-disable-next-line react-refresh/only-export-components
export function qrTarget(table: string = RESTAURANT.demo.defaultTable) {
  // A deployed build can pin the public address the QR should open (e.g. the hosted demo link).
  const publicUrl = import.meta.env.VITE_PUBLIC_URL as string | undefined
  if (publicUrl) return publicUrl
  const { origin, pathname } = window.location
  return `${origin}${pathname}?table=${table}#/`
}

const LOGO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#b3121f"/><text x="32" y="45" font-family="Tahoma,Arial" font-size="36" font-weight="700" fill="#fff5e6" text-anchor="middle">س</text></svg>',
  )

export function QRCode({ size = 148, table, className }: { size?: number; table?: string; className?: string }) {
  return (
    <div className={cx('rounded-2xl bg-white p-3 shadow-card', className)}>
      <QRCodeSVG
        value={qrTarget(table)}
        size={size}
        level="H"
        fgColor="#1a0f0c"
        bgColor="#ffffff"
        imageSettings={{ src: LOGO, height: size * 0.22, width: size * 0.22, excavate: true }}
      />
    </div>
  )
}

/** "امسح QR للوصول إلى منيو سنمار" — table tent mock-up. */
export function QRCard({ onSimulate }: { onSimulate?: () => void }) {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-line bg-white p-5 shadow-card">
      <div className="flex items-center gap-4">
        <QRCode size={104} className="shrink-0 !p-2 shadow-none ring-1 ring-line" />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-bold text-brand">
            <QrCode className="size-4" /> منيو QR
          </p>
          <h3 className="mt-1 text-lg leading-snug font-bold">امسح QR للوصول إلى منيو سنمار</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted">جرّبه الآن بكاميرا جوالك — يفتح المنيو مباشرة مع رقم الطاولة.</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {QR_PLACEMENTS.map((p, i) => (
          <div key={p.id} className="rounded-2xl bg-sand/70 px-1 py-2.5 text-center">
            <p className="text-lg">{['🪑', '🧾', '🛍️', '🪧'][i]}</p>
            <p className="mt-0.5 text-[11px] font-bold">{p.label}</p>
          </div>
        ))}
      </div>
      {onSimulate && (
        <button onClick={onSimulate} className="tap mt-3 w-full rounded-2xl bg-ink py-3 text-sm font-bold text-cream">
          شاهد تجربة المسح من البداية
        </button>
      )}
    </section>
  )
}
