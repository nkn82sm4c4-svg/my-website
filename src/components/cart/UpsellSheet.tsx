import { Check, ChevronLeft, Plus, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { productById } from '../../data/menu'
import { getUpsells, isMainDish, MEAL_UPGRADE, MEAL_UPGRADE_PRODUCT } from '../../data/upsell'
import { useAddToCart } from '../../hooks/useAddToCart'
import { cx, formatPrice } from '../../lib/format'
import { useCart } from '../../store/CartContext'
import { useUI } from '../../store/UIContext'
import { ProductImage } from '../product/ProductImage'
import { Button } from '../ui/Button'
import { Sheet } from '../ui/Sheet'

/**
 * "أكمل وجبتك؟" — shown right after an item is added. This is the core
 * average-order-value lever of the system.
 */
export function UpsellSheet() {
  const { upsellFor } = useUI()
  return upsellFor ? <UpsellBody key={upsellFor} productId={upsellFor} /> : null
}

function UpsellBody({ productId }: { productId: string }) {
  const { closeUpsell, navigate } = useUI()
  const cart = useCart()
  const add = useAddToCart()
  const [added, setAdded] = useState<string[]>([])
  // freeze what was in the cart when the sheet opened so cards don't vanish once added
  const [snapshot] = useState(() => cart.lines.map((l) => l.refId))

  const source = productById(productId)
  if (!source) return null

  const suggestions = getUpsells(source.id, snapshot, 3)
  const showMeal = isMainDish(source) && !snapshot.includes(MEAL_UPGRADE_PRODUCT.id)
  const saving = MEAL_UPGRADE.separatePrice - MEAL_UPGRADE.price

  const accept = (id: string) => {
    const p = id === MEAL_UPGRADE_PRODUCT.id ? MEAL_UPGRADE_PRODUCT : productById(id)
    if (!p) return
    add(p, { source: 'upsell', upsell: false })
    setAdded((a) => [...a, id])
  }

  return (
    <Sheet open onClose={closeUpsell} bare>
      <div className="px-5 pt-2 pb-safe">
        <div className="flex items-center gap-3 rounded-2xl bg-leaf-soft p-3">
          <span className="grid size-9 animate-pop place-items-center rounded-full bg-leaf text-white">
            <Check className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-leaf">تمت الإضافة للسلة</p>
            <p className="truncate font-bold">{source.name}</p>
          </div>
          <ProductImage src={source.image} alt="" tint={source.tint} glow={false} className="size-12" />
        </div>

        <h2 className="mt-5 text-2xl font-extrabold">أكمل وجبتك؟ 😋</h2>
        <p className="mt-1 text-sm text-muted">الأكثر طلبًا مع {source.name}</p>

        {showMeal && (
          <button
            onClick={() => !added.includes(MEAL_UPGRADE_PRODUCT.id) && accept(MEAL_UPGRADE_PRODUCT.id)}
            className={cx(
              'tap relative mt-4 flex w-full items-center gap-3 overflow-hidden rounded-3xl p-4 text-start text-white transition-colors',
              added.includes(MEAL_UPGRADE_PRODUCT.id) ? 'bg-leaf' : 'bg-ink',
            )}
          >
            <span className="pointer-events-none absolute inset-y-0 w-1/3 animate-shine bg-gradient-to-l from-transparent via-white/15 to-transparent" />
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gold text-ink">
              <Sparkles className="size-6" />
            </span>
            <span className="flex-1">
              <span className="block font-display text-base font-bold">حوّلها وجبة كاملة</span>
              <span className="block text-xs text-cream/75">
                بطاطس + مشروب بـ {formatPrice(MEAL_UPGRADE.price)} بدل {formatPrice(MEAL_UPGRADE.separatePrice)} — وفّر {saving} ر.س
              </span>
            </span>
            <span className="grid size-9 place-items-center rounded-xl bg-white/15">
              {added.includes(MEAL_UPGRADE_PRODUCT.id) ? <Check className="size-5" /> : <Plus className="size-5" />}
            </span>
          </button>
        )}

        <div className="mt-3 grid grid-cols-3 gap-2.5">
          {suggestions.map(({ product: p, reason }) => {
            const done = added.includes(p.id)
            return (
              <div key={p.id} className="flex flex-col rounded-2xl bg-white p-2.5 shadow-card">
                <ProductImage src={p.image} alt={p.name} tint={p.tint} className="h-20" />
                <p className="mt-1 line-clamp-1 text-[13px] font-bold">{p.name}</p>
                <p className="line-clamp-1 text-[10px] text-muted">{reason}</p>
                <button
                  onClick={() => !done && accept(p.id)}
                  className={cx(
                    'tap mt-2 flex h-8 items-center justify-center gap-1 rounded-xl text-xs font-bold transition-colors',
                    done ? 'bg-leaf text-white' : 'bg-brand-soft text-brand',
                  )}
                >
                  {done ? (
                    <>
                      <Check className="size-3.5" /> أُضيف
                    </>
                  ) : (
                    <>
                      <Plus className="size-3.5" /> {formatPrice(p.price)}
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        <div className="mt-5 flex gap-2.5 pb-2">
          <Button variant="soft" size="lg" className="flex-1 whitespace-nowrap px-3" onClick={closeUpsell}>
            متابعة
          </Button>
          <Button
            size="lg"
            className="flex-[1.3] whitespace-nowrap"
            onClick={() => {
              closeUpsell()
              navigate('cart')
            }}
          >
            السلة • {formatPrice(cart.subtotal)}
            <ChevronLeft className="size-4" />
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
