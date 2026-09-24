import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../../lib/format'

type Variant = 'primary' | 'dark' | 'ghost' | 'soft' | 'gold'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  block?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white shadow-[0_10px_24px_-10px_rgb(179_18_31/0.7)] hover:bg-brand-dark',
  dark: 'bg-ink text-cream hover:bg-black',
  ghost: 'bg-transparent text-ink hover:bg-sand',
  soft: 'bg-sand text-ink hover:bg-line',
  gold: 'bg-gold text-ink shadow-[0_10px_24px_-10px_rgb(232_163_61/0.8)]',
}
const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm rounded-xl gap-1.5',
  md: 'h-11 px-5 text-[15px] rounded-2xl gap-2',
  lg: 'h-14 px-6 text-base rounded-2xl gap-2.5',
}

export function Button({ variant = 'primary', size = 'md', icon, block, className, children, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={cx(
        'tap inline-flex items-center justify-center font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none select-none',
        variants[variant],
        sizes[size],
        block && 'w-full',
        className,
      )}
    >
      {icon}
      {children}
    </button>
  )
}
