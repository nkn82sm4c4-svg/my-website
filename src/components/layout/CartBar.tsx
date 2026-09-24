import { ShoppingBag } from 'lucide-react'
import { formatPrice } from '../../lib/format'
import { useCart } from '../../store/CartContext'
import { useUI } from '../../store/UIContext'

/** Floating "view cart" bar on small screens (larger screens use the header cart). */
export function CartBar() {
  const { route, navigate } = useUI()
  const { count, subtotal, addTick } = useCart()
  if (count === 0 || route.name === 'cart' || route.name === 'scan') return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-safe md:hidden">
      <button
        key={addTick}
        onClick={() => navigate('cart')}
        className="tap pointer-events-auto flex h-14 w-full animate-fade-up items-center justify-between rounded-2xl bg-brand px-4 text-white shadow-float"
      >
        <span className="flex items-center gap-2 font-bold">
          <span className="grid size-8 place-items-center rounded-xl bg-white/20 text-sm tabular-nums">{count}</span>
          <ShoppingBag className="size-4" />
          عرض السلة
        </span>
        <span className="font-display font-bold">{formatPrice(subtotal)}</span>
      </button>
    </div>
  )
}
