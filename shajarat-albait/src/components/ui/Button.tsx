import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'wood' | 'danger'
type Size = 'md' | 'lg' | 'xl'

const VARIANTS: Record<Variant, string> = {
  primary:
    'text-white bg-gradient-to-b from-leaf-2 via-leaf to-forest-2 shadow-3d hover:brightness-105 active:translate-y-[4px] active:shadow-[0_2px_0_0_rgb(23_58_40)] disabled:opacity-45 disabled:active:translate-y-0',
  secondary:
    'text-forest glass hover:bg-white/90 active:scale-[0.98] disabled:opacity-50',
  wood: 'text-wood-2 bg-gradient-to-b from-[#fffaf1] to-wood-soft border border-[#e8d8bf] shadow-3d-wood active:translate-y-[3px] active:shadow-none disabled:opacity-50',
  ghost: 'text-forest hover:bg-forest/5 active:bg-forest/10 disabled:opacity-40',
  danger: 'text-rose bg-rose-soft hover:bg-[#f8d5db] active:scale-[0.98] disabled:opacity-50',
}

const SIZES: Record<Size, string> = {
  md: 'h-11 px-5 text-[15px] rounded-2xl gap-2',
  lg: 'h-14 px-4 sm:px-7 text-base sm:text-[17px] rounded-[20px] gap-2',
  xl: 'h-16 sm:h-[72px] px-9 text-lg sm:text-xl rounded-[24px] gap-3',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  block?: boolean
}

export function Button({ variant = 'primary', size = 'md', icon, block, className = '', children, ...rest }: Props) {
  return (
    <button
      type="button"
      {...rest}
      className={`relative inline-flex select-none whitespace-nowrap items-center justify-center overflow-hidden font-display font-semibold transition-all duration-150 ${VARIANTS[variant]} ${SIZES[size]} ${block ? 'w-full' : ''} ${className}`}
    >
      {variant === 'primary' && (
        <span aria-hidden className="pointer-events-none absolute inset-y-0 w-1/3 animate-shine bg-gradient-to-l from-transparent via-white/25 to-transparent" />
      )}
      {icon}
      <span className="relative">{children}</span>
    </button>
  )
}
