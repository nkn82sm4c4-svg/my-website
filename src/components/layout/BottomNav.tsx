import { Flame, Gift, Home, ShoppingBag, UtensilsCrossed } from 'lucide-react'
import type { RouteName } from '../../hooks/useHashRoute'
import { cx, formatPrice } from '../../lib/format'
import { useCart } from '../../store/CartContext'
import { useLoyalty } from '../../store/LoyaltyContext'
import { useUI } from '../../store/UIContext'

const TABS: { id: RouteName; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'الرئيسية', icon: Home },
  { id: 'menu', label: 'المنيو', icon: UtensilsCrossed },
  { id: 'offers', label: 'العروض', icon: Flame },
  { id: 'loyalty', label: 'الولاء', icon: Gift },
  { id: 'cart', label: 'السلة', icon: ShoppingBag },
]

export function BottomNav() {
  const { route, navigate } = useUI()
  const { count, subtotal, addTick } = useCart()
  const { state } = useLoyalty()

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[480px]">
      {/* floating "view cart" bar */}
      {count > 0 && route.name !== 'cart' && (
        <div className="pointer-events-auto px-4 pb-2">
          <button
            key={addTick}
            onClick={() => navigate('cart')}
            className="tap flex h-14 w-full animate-fade-up items-center justify-between rounded-2xl bg-brand px-4 text-white shadow-float"
          >
            <span className="flex items-center gap-2 font-bold">
              <span className="grid size-8 place-items-center rounded-xl bg-white/20 text-sm tabular-nums">{count}</span>
              عرض السلة
            </span>
            <span className="font-display font-bold">{formatPrice(subtotal)}</span>
          </button>
        </div>
      )}
      <nav className="pointer-events-auto border-t border-line/80 bg-cream/90 pb-safe backdrop-blur-xl">
        <ul className="grid grid-cols-5 pt-1.5">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = route.name === id
            return (
              <li key={id}>
                <button
                  onClick={() => navigate(id)}
                  className={cx('tap relative flex w-full flex-col items-center gap-0.5 py-1', active ? 'text-brand' : 'text-muted')}
                >
                  <span className={cx('grid h-8 w-12 place-items-center rounded-full transition-colors', active && 'bg-brand-soft')}>
                    <Icon className="size-[22px]" strokeWidth={active ? 2.4 : 1.8} />
                  </span>
                  <span className={cx('text-[11px]', active ? 'font-bold' : 'font-medium')}>{label}</span>
                  {id === 'cart' && count > 0 && (
                    <span key={addTick} className="absolute top-0 left-[calc(50%-20px)] grid h-4.5 min-w-4.5 animate-bump place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                      {count}
                    </span>
                  )}
                  {id === 'loyalty' && state.rewardReady && (
                    <span className="absolute top-0.5 left-[calc(50%-16px)] size-2.5 rounded-full bg-gold ring-2 ring-cream" />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
