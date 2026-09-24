import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  emoji?: string
  title: string
  subtitle?: ReactNode
  action?: { label: string; onClick: () => void }
}

export function SectionHeader({ emoji, title, subtitle, action }: Props) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3 px-5 md:mb-6 md:px-0">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight md:text-3xl">
          {emoji && <span className="text-[1.1em]">{emoji}</span>}
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action && (
        <button onClick={action.onClick} className="tap flex shrink-0 items-center gap-0.5 text-sm font-semibold text-brand">
          {action.label}
          <ChevronLeft className="size-4" />
        </button>
      )}
    </div>
  )
}
