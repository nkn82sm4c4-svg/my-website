import { cx } from '../../lib/format'

interface Props {
  src: string
  alt: string
  tint?: string
  className?: string
  /** Show the warm "plate" glow behind the product render. */
  glow?: boolean
  eager?: boolean
}

export function ProductImage({ src, alt, tint, className, glow = true, eager }: Props) {
  return (
    // callers may position it absolutely; only fall back to `relative` otherwise
    <div className={cx(!/\b(absolute|fixed)\b/.test(className ?? '') && 'relative', className)}>
      {glow && (
        <div className="absolute inset-[12%] rounded-full bg-[radial-gradient(circle,rgb(232_163_61/0.28)_0%,transparent_70%)]" />
      )}
      <img
        src={src}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        style={{ filter: tint }}
        className="absolute inset-0 size-full object-contain drop-shadow-[0_14px_18px_rgb(26_15_12/0.18)] transition-transform duration-500"
      />
    </div>
  )
}
