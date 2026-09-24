import { ChevronLeft, CreditCard, Loader2, MapPin, Plus, ShoppingBag, Sparkles, Star, X } from 'lucide-react'
import { useState } from 'react'
import { OrderSuccess } from '../components/cart/OrderSuccess'
import { Container } from '../components/layout/Container'
import { ProductImage } from '../components/product/ProductImage'
import { Button } from '../components/ui/Button'
import { Price } from '../components/ui/Price'
import { QuantityStepper } from '../components/ui/QuantityStepper'
import { RESTAURANT } from '../config/restaurant'
import { productById } from '../data/menu'
import { getUpsells } from '../data/upsell'
import { useAddToCart } from '../hooks/useAddToCart'
import { useLoyaltyActions } from '../hooks/useLoyaltyActions'
import { cx, formatPrice, lineTotal, lineUnitPrice } from '../lib/format'
import { orderService } from '../services/orderService'
import { useCart } from '../store/CartContext'
import { useLoyalty } from '../store/LoyaltyContext'
import { useUI } from '../store/UIContext'
import type { Order } from '../types'

export function CartPage() {
  const cart = useCart()
  const { state } = useLoyalty()
  const { stamp } = useLoyaltyActions()
  const { navigate, table } = useUI()
  const add = useAddToCart()
  const [placing, setPlacing] = useState(false)
  const [order, setOrder] = useState<Order | null>(null)
  const [stampAdded, setStampAdded] = useState(false)
  const [note, setNote] = useState('')

  // "You may also like" — based on the main item in the cart
  const inCart = cart.lines.map((l) => l.refId)
  const anchor = cart.lines.find((l) => l.kind === 'product' && productById(l.refId))?.refId ?? 'darba-classic'
  const suggestions = getUpsells(anchor, inCart, 4)

  const vat = cart.subtotal - cart.subtotal / (1 + RESTAURANT.vatRate)
  const nextStamps = Math.min(state.goal, state.stamps + 1)

  const confirm = async () => {
    setPlacing(true)
    const lines = note ? cart.lines.map((l, i) => (i === 0 ? { ...l, note } : l)) : cart.lines
    const placed = await orderService.place(lines, table ?? RESTAURANT.demo.defaultTable)
    const added = stamp(true)
    setStampAdded(added)
    cart.clear()
    setNote('')
    setPlacing(false)
    setOrder(placed)
  }

  if (order)
    return (
      <Container className="max-w-2xl">
        <OrderSuccess order={order} stampAdded={stampAdded} onDone={() => setOrder(null)} />
      </Container>
    )

  if (cart.lines.length === 0) {
    return (
      <div className="flex min-h-[70dvh] flex-col items-center justify-center px-8 text-center">
        <span className="grid size-24 place-items-center rounded-full bg-sand">
          <ShoppingBag className="size-10 text-muted" />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold">سلتك فاضية</h1>
        <p className="mt-1 text-muted">ابدأ طلبك من المنيو — وكل طلب يقربك من مكافأتك 🎁</p>
        <Button className="mt-6" size="lg" onClick={() => navigate('menu')}>
          تصفح المنيو
        </Button>
      </div>
    )
  }

  return (
    <Container className="pt-4 pb-28 md:pt-10 lg:pb-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold md:text-5xl">سلتك</h1>
          <p className="text-sm text-muted">{cart.count} منتجات</p>
        </div>
        <button onClick={() => navigate('menu')} className="tap flex items-center gap-1 text-sm font-semibold text-brand">
          <Plus className="size-4" /> أضف المزيد
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 md:mt-8 lg:grid-cols-[1.5fr_1fr] lg:items-start lg:gap-10">
        <div>
          {/* lines */}
          <ul className="space-y-3">
            {cart.lines.map((l) => {
              const product = l.kind === 'product' ? productById(l.refId) : undefined
              return (
                <li
                  key={l.lineId}
                  className={cx('animate-fade-up rounded-3xl bg-white p-3 shadow-card', l.kind === 'reward' && 'ring-2 ring-gold')}
                >
                  <div className="flex gap-3">
                    <div className="relative size-20 shrink-0 rounded-2xl bg-gradient-to-br from-sand to-white">
                      <ProductImage src={l.image} alt="" tint={l.tint} glow={false} className="absolute inset-1" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold leading-snug">{l.name}</p>
                        <button
                          onClick={() => cart.remove(l.lineId)}
                          aria-label="حذف"
                          className="tap grid size-7 shrink-0 place-items-center rounded-full bg-sand text-muted"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                      {l.source === 'upsell' && (
                        <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-leaf">
                          <Sparkles className="size-3" /> من اقتراحات "أكمل وجبتك"
                        </span>
                      )}
                      {l.kind === 'offer' && <span className="mt-0.5 block text-[11px] font-semibold text-brand">🔥 عرض</span>}
                      {l.addOns.length > 0 && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted">+ {l.addOns.map((a) => a.name).join('، ')}</p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <Price value={lineTotal(l)} />
                        {l.kind !== 'reward' && (
                          <QuantityStepper size="sm" value={l.quantity} allowRemove onChange={(q) => cart.setQuantity(l.lineId, q)} />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* editable add-ons */}
                  {product?.addOns && product.addOns.length > 0 && (
                    <div className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-0.5 no-scrollbar">
                      {product.addOns.map((a) => {
                        const on = l.addOns.some((x) => x.id === a.id)
                        return (
                          <button
                            key={a.id}
                            onClick={() => cart.toggleAddOn(l.lineId, a)}
                            className={cx(
                              'tap shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors',
                              on ? 'border-brand bg-brand-soft text-brand' : 'border-line text-ink-soft',
                            )}
                          >
                            {on ? '✓ ' : '+ '}
                            {a.name}
                            {a.price ? ` (${a.price})` : ''}
                          </button>
                        )
                      })}
                    </div>
                  )}
                  {l.quantity > 1 && (
                    <p className="mt-1 text-[11px] text-muted">
                      {formatPrice(lineUnitPrice(l))} × {l.quantity}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>

          {/* upsell strip */}
          {suggestions.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-2 font-display font-bold">قد يعجبك أيضًا 😋</h2>
              <div className="-mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1 no-scrollbar">
                {suggestions.map(({ product: p, reason }) => (
                  <div key={p.id} className="flex w-36 shrink-0 flex-col rounded-2xl bg-white p-2.5 shadow-card">
                    <ProductImage src={p.image} alt={p.name} tint={p.tint} className="h-20" />
                    <p className="mt-1 line-clamp-1 text-[13px] font-bold">{p.name}</p>
                    <p className="line-clamp-1 text-[10px] text-muted">{reason}</p>
                    <button
                      onClick={() => add(p, { source: 'upsell', upsell: false })}
                      className="tap mt-2 flex h-8 items-center justify-center gap-1 rounded-xl bg-brand-soft text-xs font-bold text-brand"
                    >
                      <Plus className="size-3.5" /> {formatPrice(p.price)}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* checkout column */}
        <aside className="lg:sticky lg:top-[96px]">
          {/* order details */}
          <section className="space-y-3">
            <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card">
              <span className="grid size-10 place-items-center rounded-xl bg-sand">
                <MapPin className="size-5 text-brand" />
              </span>
              <div className="flex-1">
                <p className="text-xs text-muted">نوع الطلب</p>
                <p className="font-bold">داخل المطعم • طاولة {table ?? RESTAURANT.demo.defaultTable}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card">
              <span className="grid size-10 place-items-center rounded-xl bg-sand">
                <CreditCard className="size-5 text-ink-soft" />
              </span>
              <div className="flex-1">
                <p className="text-xs text-muted">الدفع</p>
                <p className="font-bold">عند الكاشير</p>
              </div>
              <span className="rounded-full bg-sand px-2 py-1 text-[10px] font-semibold text-muted">عرض تجريبي</span>
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ملاحظة للمطبخ (اختياري) — مثال: بدون بصل"
              rows={2}
              className="w-full resize-none rounded-2xl bg-white p-4 text-sm shadow-card outline-none placeholder:text-muted/70"
            />
          </section>

          {/* summary */}
          <section className="mt-4 rounded-3xl bg-white p-4 shadow-card">
            <Row label="المجموع الفرعي" value={formatPrice(Math.round(cart.subtotal * 100) / 100)} />
            <Row label="ضريبة القيمة المضافة (مشمولة)" value={formatPrice(Math.round(vat * 100) / 100)} muted />
            <div className="my-3 border-t border-dashed border-line" />
            <Row label="الإجمالي" value={formatPrice(cart.subtotal)} big />
            <div className="mt-3 flex items-center gap-2 rounded-2xl bg-gold-soft p-3 text-sm">
              <Star className="size-5 shrink-0 fill-gold text-gold" />
              {state.rewardReady ? (
                <span className="font-medium text-amber-900">لديك مكافأة جاهزة — استخدمها من صفحة الولاء 🎁</span>
              ) : (
                <span className="font-medium text-amber-900">
                  هذا الطلب يضيف <b>+1 نقطة ولاء</b> ({state.stamps}/{state.goal} ← {nextStamps}/{state.goal})
                </span>
              )}
            </div>
          </section>

          {/* confirm: fixed bar on phones, inside the summary column on desktop */}
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-cream/95 px-4 pt-3 pb-safe backdrop-blur md:px-8 lg:static lg:mt-4 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            <Button size="lg" block disabled={placing} onClick={confirm} className="h-16 text-lg">
              {placing ? (
                <>
                  <Loader2 className="size-5 animate-spin" /> جاري إرسال طلبك…
                </>
              ) : (
                <>
                  تأكيد الطلب • {formatPrice(cart.subtotal)}
                  <ChevronLeft className="size-5" />
                </>
              )}
            </Button>
          </div>
        </aside>
      </div>
    </Container>
  )
}

function Row({ label, value, muted, big }: { label: string; value: string; muted?: boolean; big?: boolean }) {
  return (
    <div className={cx('flex items-center justify-between py-1', muted && 'text-xs text-muted', big && 'text-lg')}>
      <span className={big ? 'font-bold' : ''}>{label}</span>
      <span className={cx('font-display tabular-nums', big ? 'font-extrabold text-brand' : 'font-semibold')}>{value}</span>
    </div>
  )
}
