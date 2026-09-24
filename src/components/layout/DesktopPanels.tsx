import { RESTAURANT } from '../../config/restaurant'
import { VALUE_PILLARS } from '../manager/valuePillars'
import { QRCode } from '../qr/QRCard'

/**
 * Only visible on wide screens (presenting from a laptop): the pitch on one
 * side, a live QR on the other so the manager can open the demo on their phone.
 */
export function DesktopPanels() {
  return (
    <>
      <aside className="fixed top-8 right-8 hidden w-[300px] 2xl:right-16 2xl:w-[340px] min-[1180px]:block">
        <p className="font-display text-sm font-bold text-brand">{RESTAURANT.nameLatin} DIGITAL</p>
        <h2 className="mt-2 text-3xl leading-tight font-extrabold">
          ليس مجرد منيو.
          <br />
          نظام يزيد مبيعاتك.
        </h2>
        <ul className="mt-6 space-y-3">
          {VALUE_PILLARS.map((p) => (
            <li key={p.title} className="flex gap-3">
              <span className="text-xl">{p.emoji}</span>
              <span>
                <span className="block font-bold">{p.title}</span>
                <span className="block text-xs leading-relaxed text-muted">{p.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </aside>
      <aside className="fixed top-8 left-8 hidden w-[260px] text-center 2xl:left-16 min-[1180px]:block">
        <div className="rounded-[28px] bg-white p-6 shadow-card">
          <p className="font-display text-lg font-bold">جرّبه على جوالك</p>
          <p className="mt-1 text-xs text-muted">امسح الرمز بكاميرا الجوال</p>
          <QRCode size={180} className="mx-auto mt-4 inline-block shadow-none" />
          <p className="mt-3 text-[11px] text-muted">يفتح المنيو مباشرة • طاولة {RESTAURANT.demo.defaultTable}</p>
        </div>
      </aside>
    </>
  )
}
