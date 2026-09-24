import { BarChart3, MapPin, ShoppingBag } from 'lucide-react'
import { RESTAURANT } from '../../config/restaurant'
import { cx } from '../../lib/format'
import { useCart } from '../../store/CartContext'
import { useUI } from '../../store/UIContext'
import { useEffect, useState } from 'react'

export function TopBar({ transparent }: { transparent?: boolean }) {
  const { navigate, table, setManagerOpen } = useUI()
  const { count, addTick } = useCart()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  const solid = !transparent || scrolled

  return (
    <header
      className={cx(
        'sticky top-0 z-40 transition-colors duration-300',
        solid ? 'border-b border-line/70 bg-cream/85 backdrop-blur-xl' : 'bg-transparent',
      )}
    >
      <div className="flex h-16 items-center gap-3 px-5">
        <button onClick={() => navigate('home')} className="flex items-center gap-2.5" aria-label="الرئيسية">
          <span className="grid size-10 place-items-center rounded-2xl bg-brand font-display text-xl font-extrabold text-cream shadow-[0_8px_20px_-8px_rgb(179_18_31/0.8)]">
            س
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-extrabold">{RESTAURANT.name}</span>
            <span className="flex items-center gap-1 text-[11px] text-muted">
              <MapPin className="size-3" />
              {RESTAURANT.city}
              {table && <span className="font-semibold text-brand"> • طاولة {table}</span>}
            </span>
          </span>
        </button>
        <div className="ms-auto flex items-center gap-2">
          <button
            onClick={() => setManagerOpen(true)}
            className="tap flex h-10 items-center gap-1.5 rounded-2xl bg-white px-3 text-xs font-bold text-ink shadow-card"
          >
            <BarChart3 className="size-4 text-brand" />
            للمدير
          </button>
          <button
            onClick={() => navigate('cart')}
            aria-label="السلة"
            className="tap relative grid size-10 place-items-center rounded-2xl bg-ink text-cream"
          >
            <ShoppingBag className="size-5" />
            {count > 0 && (
              <span
                key={addTick}
                className="absolute -top-1.5 -left-1.5 grid h-5 min-w-5 animate-bump place-items-center rounded-full bg-gold px-1 text-[11px] font-bold text-ink ring-2 ring-cream"
              >
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
