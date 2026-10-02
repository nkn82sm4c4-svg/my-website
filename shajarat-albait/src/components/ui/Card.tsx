import type { HTMLAttributes } from 'react'

export function Card({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={`glass rounded-[28px] ${className}`} />
}

export function SectionTitle({ eyebrow, title, desc, className = '' }: { eyebrow?: string; title: string; desc?: string; className?: string }) {
  return (
    <div className={className}>
      {eyebrow && <p className="mb-1.5 text-sm font-semibold text-leaf">{eyebrow}</p>}
      <h1 className="text-[28px] font-bold leading-tight text-forest sm:text-4xl">{title}</h1>
      {desc && <p className="mt-2 max-w-2xl text-[15px] leading-7 text-ink-soft sm:text-base">{desc}</p>}
    </div>
  )
}
