import { BarChart3, MapPin, Menu, ShoppingBag, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { RouteName } from '../../hooks/useHashRoute'
import { RESTAURANT } from '../../config/restaurant'
import { cx } from '../../lib/format'
import { useCart } from '../../store/CartContext'
import { useLoyalty } from '../../store/LoyaltyContext'
import { useUI } from '../../store/UIContext'
import { Container } from './Container'
import { NAV_LINKS } from './nav'

export function SiteHeader() {
  const { route, navigate, table, setManagerOpen } = useUI()
  const { count, addTick } = useCart()
  const { state } = useLoyalty()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 16)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  const go = (id: RouteName) => {
    setMenuOpen(false)
    navigate(id)
  }

  return (
    <header
      className={cx(
        'sticky top-0 z-40 transition-colors duration-300',
        scrolled || menuOpen ? 'border-b border-line/70 bg-cream/90 backdrop-blur-xl' : 'bg-cream/0',
      )}
    >
      <Container className="flex h-16 items-center gap-3 md:h-[72px]">
        <button onClick={() => go('home')} className="flex items-center gap-2.5" aria-label="الرئيسية">
          <span className="grid size-10 place-items-center rounded-2xl bg-brand font-display text-xl font-extrabold text-cream shadow-[0_8px_20px_-8px_rgb(179_18_31/0.8)]">
            س
          </span>
          <span className="text-start leading-tight">
            <span className="block font-display text-lg font-extrabold">{RESTAURANT.name}</span>
            <span className="flex items-center gap-1 text-[11px] text-muted">
              <MapPin className="size-3" />
              {RESTAURANT.city}
              {table && <span className="font-semibold text-brand"> • طاولة {table}</span>}
            </span>
          </span>
        </button>

        {/* desktop navigation */}
        <nav className="ms-8 hidden items-center gap-1 lg:flex" aria-label="التنقل الرئيسي">
          {NAV_LINKS.map((l) => (
            <button
              key={l.id}
              onClick={() => go(l.id)}
              aria-current={route.name === l.id ? 'page' : undefined}
              className={cx(
                'relative rounded-xl px-3.5 py-2 text-[15px] font-semibold transition-colors',
                route.name === l.id ? 'text-brand' : 'text-ink-soft hover:bg-sand hover:text-ink',
              )}
            >
              {l.label}
              {l.id === 'loyalty' && state.rewardReady && <span className="absolute top-1.5 left-1.5 size-2 rounded-full bg-gold" />}
              {route.name === l.id && <span className="absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full bg-brand" />}
            </button>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <button
            onClick={() => setManagerOpen(true)}
            className="tap flex h-10 items-center gap-1.5 rounded-2xl bg-white px-3 text-xs font-bold text-ink shadow-card"
          >
            <BarChart3 className="size-4 text-brand" />
            للمدير
          </button>
          <button
            onClick={() => go('menu')}
            className="tap hidden h-10 items-center rounded-2xl bg-brand px-5 text-sm font-bold text-white shadow-[0_8px_20px_-8px_rgb(179_18_31/0.8)] md:flex"
          >
            اطلب الآن
          </button>
          <button
            onClick={() => go('cart')}
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
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="القائمة"
            aria-expanded={menuOpen}
            className="tap grid size-10 place-items-center rounded-2xl bg-white shadow-card lg:hidden"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </Container>

      {/* mobile menu */}
      {menuOpen && (
        <nav className="animate-fade border-t border-line/70 lg:hidden" aria-label="قائمة الجوال">
          <Container className="grid grid-cols-1 gap-1 py-3">
            {NAV_LINKS.map((l) => (
              <button
                key={l.id}
                onClick={() => go(l.id)}
                className={cx(
                  'flex items-center justify-between rounded-2xl px-4 py-3 text-start text-base font-semibold',
                  route.name === l.id ? 'bg-brand-soft text-brand' : 'text-ink hover:bg-sand',
                )}
              >
                {l.label}
                {l.id === 'loyalty' && (
                  <span className="text-xs font-bold text-muted" dir="ltr">
                    {state.stamps} / {state.goal}
                  </span>
                )}
              </button>
            ))}
          </Container>
        </nav>
      )}
    </header>
  )
}
