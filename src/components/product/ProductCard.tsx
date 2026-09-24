import { Box, Plus } from 'lucide-react'
import { useAddToCart } from '../../hooks/useAddToCart'
import { cx } from '../../lib/format'
import { useUI } from '../../store/UIContext'
import type { Product } from '../../types'
import { Badge } from '../ui/Badge'
import { Price } from '../ui/Price'
import { ProductImage } from './ProductImage'

/** Vertical card used in horizontal carousels on the home page. */
export function ProductCard({ product, className, rank }: { product: Product; className?: string; rank?: number }) {
  const { openProduct } = useUI()
  const add = useAddToCart()
  const badge = product.badges?.[0]

  return (
    <article
      className={cx(
        'group relative flex w-[172px] shrink-0 snap-start flex-col overflow-hidden rounded-3xl bg-white shadow-card transition-shadow hover:shadow-float md:w-auto',
        className,
      )}
    >
      <button
        onClick={() => openProduct(product.id)}
        className="relative block h-[150px] bg-gradient-to-b md:h-[180px] from-sand/70 to-white text-start"
      >
        <ProductImage src={product.image} alt={product.name} tint={product.tint} className="absolute inset-2 group-active:scale-95" />
        {badge && <Badge kind={badge} className="absolute top-2.5 right-2.5" />}
        {rank && <span className="absolute bottom-1 left-3 font-display text-4xl font-extrabold text-ink/10">{rank}</span>}
        {product.model && (
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation()
              openProduct(product.id, '3d')
            }}
            className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold text-ink shadow-sm"
          >
            <Box className="size-3 text-brand" /> 3D
          </span>
        )}
      </button>
      <div className="flex flex-1 flex-col gap-1 p-3 pt-2">
        <h3 className="line-clamp-1 text-[15px] font-bold">{product.name}</h3>
        <p className="line-clamp-2 min-h-[2.5em] text-xs leading-relaxed text-muted">{product.description}</p>
        <div className="mt-auto flex items-center justify-between pt-1">
          <Price value={product.price} />
          <button
            aria-label={`أضف ${product.name}`}
            onClick={() => add(product)}
            className="tap grid size-9 place-items-center rounded-xl bg-brand text-white shadow-[0_8px_16px_-8px_rgb(179_18_31/0.8)]"
          >
            <Plus className="size-5" />
          </button>
        </div>
      </div>
    </article>
  )
}
