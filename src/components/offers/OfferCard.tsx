import { Box, Check, Crown, ShoppingBag } from 'lucide-react'
import { useCart } from '../../store/CartContext'
import { useUI } from '../../store/UIContext'
import { cx } from '../../lib/format'
import type { Offer } from '../../types'
import { ProductImage } from '../product/ProductImage'
import { Price } from '../ui/Price'

const ACCENTS: Record<Offer['accent'], string> = {
  brand: 'from-[#c8141f] to-[#8c0d17] text-white',
  ink: 'from-[#2a1a14] to-[#120a08] text-cream',
  gold: 'from-[#f6c26b] to-[#e39a2c] text-ink',
}

interface Props {
  offer: Offer
  /** Horizontal carousel size vs full width list size. */
  variant?: 'carousel' | 'full'
}

export function OfferCard({ offer, variant = 'full' }: Props) {
  const cart = useCart()
  const { toast, openProduct } = useUI()
  const inCart = cart.has(offer.id)
  const dark = offer.accent !== 'gold'
  const savings = offer.originalPrice - offer.price

  const order = () => {
    cart.addOffer(offer)
    toast(`أُضيف "${offer.title}" إلى السلة`, '🔥')
  }

  return (
    <article
      className={cx(
        'relative isolate flex shrink-0 snap-center flex-col overflow-hidden rounded-[28px] bg-gradient-to-br p-5 shadow-float',
        ACCENTS[offer.accent],
        variant === 'carousel' ? 'w-[86%] max-w-[340px] md:w-auto md:max-w-none' : 'w-full',
        offer.membersOnly && 'ring-2 ring-gold ring-offset-2 ring-offset-cream',
      )}
    >
      <div className="pointer-events-none absolute -bottom-16 -left-16 -z-10 size-56 rounded-full bg-white/15 blur-2xl" />

      <div className="flex items-start justify-between gap-2">
        <span
          className={cx(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold',
            dark ? 'bg-white/15 text-white' : 'bg-ink/10 text-ink',
          )}
        >
          {offer.membersOnly && <Crown className="size-3.5" />}
          {offer.tag}
        </span>
        {offer.model && (
          <button
            onClick={() => openProduct(offerProductFor(offer), '3d')}
            className={cx('tap flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold', dark ? 'bg-white/15' : 'bg-ink/10')}
          >
            <Box className="size-3.5" /> 3D
          </button>
        )}
      </div>

      <div className="relative -mx-2 mt-1 h-40 md:h-52">
        <ProductImage src={offer.image} alt={offer.title} glow={false} className="absolute inset-0" />
      </div>

      <p className={cx('text-xs font-medium', dark ? 'text-white/70' : 'text-ink/70')}>{offer.subtitle}</p>
      <h3 className="mt-0.5 text-xl leading-tight font-extrabold">{offer.title}</h3>
      <p className={cx('mt-1 text-sm leading-relaxed', dark ? 'text-white/80' : 'text-ink/80')}>{offer.description}</p>

      {variant === 'full' && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {offer.includes.map((i) => (
            <li key={i} className={cx('rounded-full px-2.5 py-1 text-[11px] font-medium', dark ? 'bg-white/10' : 'bg-ink/10')}>
              {i}
            </li>
          ))}
        </ul>
      )}

      {offer.membersOnly && (
        <p className={cx('mt-3 flex items-center gap-1.5 text-xs font-bold', dark ? 'text-gold' : 'text-ink')}>
          <Check className="size-4" /> مفعّل لك كعضو في برنامج الولاء
        </p>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <div>
          <Price value={offer.price} original={offer.originalPrice} size="lg" className={dark ? '[&_.text-muted]:text-white/60' : ''} />
          <p className={cx('text-[11px] font-semibold', dark ? 'text-gold' : 'text-brand-dark')}>توفير {savings} ر.س</p>
        </div>
        <button
          onClick={order}
          className={cx(
            'tap flex h-12 items-center gap-2 rounded-2xl px-5 text-sm font-bold shadow-lg',
            dark ? 'bg-cream text-ink' : 'bg-ink text-cream',
          )}
        >
          {inCart ? <Check className="size-4" /> : <ShoppingBag className="size-4" />}
          {inCart ? 'أضف مرة أخرى' : 'اطلب الآن'}
        </button>
      </div>
    </article>
  )
}

/** Opens a representative product for the offer's 3D model. */
function offerProductFor(offer: Offer) {
  const map: Record<string, string> = {
    burger: 'darba-classic',
    'double-burger': 'double-sinmar',
    pizza: 'pizza-pepperoni',
    'pie-boat': 'sinmariya-cheese',
  }
  return map[offer.model ?? 'burger'] ?? 'darba-classic'
}
