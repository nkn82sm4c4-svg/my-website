import { Box, Clock, Plus } from 'lucide-react'
import { useAddToCart } from '../../hooks/useAddToCart'
import { useCart } from '../../store/CartContext'
import { useUI } from '../../store/UIContext'
import type { Product } from '../../types'
import { Badge } from '../ui/Badge'
import { Price } from '../ui/Price'
import { ProductImage } from './ProductImage'

/** Horizontal list item used in the full menu. */
export function ProductRow({ product }: { product: Product }) {
  const { openProduct } = useUI()
  const add = useAddToCart()
  const { lines } = useCart()
  const qty = lines.filter((l) => l.refId === product.id).reduce((s, l) => s + l.quantity, 0)

  return (
    <article className="flex animate-fade-up gap-3 rounded-3xl bg-white p-3 shadow-card">
      <button
        onClick={() => openProduct(product.id)}
        className="relative size-[112px] shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-sand to-white"
      >
        <ProductImage src={product.image} alt={product.name} tint={product.tint} className="absolute inset-1.5" />
        {product.model && (
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation()
              openProduct(product.id, '3d')
            }}
            className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-full bg-white/95 px-1.5 py-0.5 text-[10px] font-bold shadow-sm"
          >
            <Box className="size-3 text-brand" /> 3D
          </span>
        )}
      </button>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap gap-1">
          {product.badges?.slice(0, 2).map((b) => <Badge key={b} kind={b} />)}
        </div>
        <button onClick={() => openProduct(product.id)} className="mt-1 text-start">
          <h3 className="text-[15px] leading-snug font-bold">{product.name}</h3>
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted">{product.description}</p>
        </button>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Price value={product.price} />
            {product.prepMinutes && (
              <span className="flex items-center gap-0.5 text-[11px] text-muted">
                <Clock className="size-3" />
                {product.prepMinutes} د
              </span>
            )}
          </div>
          <button
            onClick={() => add(product)}
            className="tap relative flex h-9 items-center gap-1 rounded-xl bg-brand px-3 text-sm font-semibold text-white"
          >
            <Plus className="size-4" /> أضف
            {qty > 0 && (
              <span key={qty} className="absolute -top-2 -left-2 grid size-5 animate-pop place-items-center rounded-full bg-gold text-[11px] font-bold text-ink">
                {qty}
              </span>
            )}
          </button>
        </div>
      </div>
    </article>
  )
}
