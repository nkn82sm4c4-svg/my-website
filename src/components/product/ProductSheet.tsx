import { Box, Check, Clock, Flame, Image as ImageIcon, X } from 'lucide-react'
import { useState } from 'react'
import { productById } from '../../data/menu'
import { getUpsells } from '../../data/upsell'
import { useAddToCart } from '../../hooks/useAddToCart'
import { cx, formatPrice } from '../../lib/format'
import { useUI } from '../../store/UIContext'
import type { AddOn } from '../../types'
import { ModelViewer } from '../three/ModelViewer'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Price } from '../ui/Price'
import { QuantityStepper } from '../ui/QuantityStepper'
import { Sheet } from '../ui/Sheet'
import { ProductImage } from './ProductImage'

export function ProductSheet() {
  const { productSheet } = useUI()
  if (!productSheet) return null
  // keyed so local state (qty, add-ons, view) resets for every product opened
  return <ProductSheetBody key={`${productSheet.productId}:${productSheet.view}`} productId={productSheet.productId} initialView={productSheet.view} />
}

function ProductSheetBody({ productId, initialView }: { productId: string; initialView: 'photo' | '3d' }) {
  const { closeProduct, openProduct } = useUI()
  const add = useAddToCart()
  const product = productById(productId)
  const [view, setView] = useState<'photo' | '3d'>(initialView)
  const [qty, setQty] = useState(1)
  const [addOns, setAddOns] = useState<AddOn[]>([])

  if (!product) return null

  const unit = product.price + addOns.reduce((s, a) => s + a.price, 0)
  const pairs = getUpsells(product.id, [], 3)
  const toggle = (a: AddOn) =>
    setAddOns((cur) => (cur.some((x) => x.id === a.id) ? cur.filter((x) => x.id !== a.id) : [...cur, a]))

  return (
    <Sheet open onClose={closeProduct} bare>
      {/* media */}
      <div className="relative -mt-7 h-[min(46dvh,380px)] bg-gradient-to-b from-[#fff3e2] to-cream">
        {view === '3d' && product.model ? (
          <ModelViewer key={product.model} model={product.model} tint={product.tint} />
        ) : (
          <ProductImage
            src={product.image}
            alt={product.name}
            tint={product.tint}
            eager
            className="absolute inset-x-8 inset-y-6 animate-pop"
          />
        )}
        <button
          onClick={closeProduct}
          aria-label="إغلاق"
          className={cx(
            'tap absolute z-10 grid size-9 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur',
            view === '3d' ? 'top-12 right-3' : 'top-4 left-4',
          )}
        >
          <X className="size-4" />
        </button>
      </div>

      {product.model && (
        <div className="relative z-10 -mt-5 flex justify-center">
          <div className="flex rounded-2xl bg-white p-1 shadow-card">
            <SegBtn active={view === 'photo'} onClick={() => setView('photo')} icon={<ImageIcon className="size-4" />}>
              صورة
            </SegBtn>
            <SegBtn active={view === '3d'} onClick={() => setView('3d')} icon={<Box className="size-4" />}>
              تجربة 3D
            </SegBtn>
          </div>
        </div>
      )}

      <div className="space-y-5 px-5 pt-4 pb-32">
        <div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {product.badges?.map((b) => <Badge key={b} kind={b} />)}
          </div>
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-2xl leading-tight font-extrabold">{product.name}</h2>
            <Price value={product.price} size="lg" className="shrink-0 text-brand" />
          </div>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{product.description}</p>
          <div className="mt-3 flex gap-4 text-xs text-muted">
            {product.calories && (
              <span className="flex items-center gap-1">
                <Flame className="size-3.5" /> {product.calories} سعرة
              </span>
            )}
            {product.prepMinutes && (
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" /> التحضير ≈ {product.prepMinutes} دقائق
              </span>
            )}
          </div>
        </div>

        {product.addOns && product.addOns.length > 0 && (
          <section>
            <h3 className="mb-2 text-base font-bold">الإضافات</h3>
            <div className="divide-y divide-line overflow-hidden rounded-2xl bg-white shadow-card">
              {product.addOns.map((a) => {
                const on = addOns.some((x) => x.id === a.id)
                return (
                  <button key={a.id} onClick={() => toggle(a)} className="flex w-full items-center gap-3 px-4 py-3 text-start">
                    <span
                      className={cx(
                        'grid size-6 place-items-center rounded-lg border-2 transition-colors',
                        on ? 'border-brand bg-brand text-white' : 'border-line',
                      )}
                    >
                      {on && <Check className="size-4 animate-pop" />}
                    </span>
                    <span className="flex-1 text-sm font-medium">{a.name}</span>
                    <span className="text-sm text-muted">{a.price ? `+${formatPrice(a.price)}` : 'مجانًا'}</span>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {pairs.length > 0 && (
          <section>
            <h3 className="mb-2 text-base font-bold">⭐ الأكثر طلبًا مع هذا المنتج</h3>
            <div className="-mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1 no-scrollbar">
              {pairs.map(({ product: p }) => (
                <button
                  key={p.id}
                  onClick={() => openProduct(p.id)}
                  className="tap flex shrink-0 items-center gap-2 rounded-2xl bg-white p-2 pl-3 shadow-card"
                >
                  <ProductImage src={p.image} alt="" tint={p.tint} glow={false} className="size-12" />
                  <span className="text-start">
                    <span className="block text-xs font-bold">{p.name}</span>
                    <span className="text-xs text-muted">{formatPrice(p.price)}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* sticky CTA */}
      <div className="sticky bottom-0 z-20 flex items-center gap-3 border-t border-line bg-cream/95 px-5 pt-3 pb-safe backdrop-blur">
        <QuantityStepper value={qty} onChange={setQty} />
        <Button
          block
          size="lg"
          onClick={() => {
            add(product, { quantity: qty, addOns })
            closeProduct()
          }}
        >
          أضف للسلة • {formatPrice(unit * qty)}
        </Button>
      </div>
    </Sheet>
  )
}

function SegBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'tap flex h-10 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition-colors',
        active ? 'bg-ink text-cream' : 'text-ink-soft',
      )}
    >
      {icon}
      {children}
    </button>
  )
}
