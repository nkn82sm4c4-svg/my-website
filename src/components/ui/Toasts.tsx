import { useUI } from '../../store/UIContext'

export function Toasts() {
  const { toasts } = useUI()
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[70] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex animate-fade-up items-center gap-2 rounded-2xl bg-ink/95 px-4 py-3 text-sm font-medium text-cream shadow-float backdrop-blur"
        >
          {t.icon && <span className="text-base">{t.icon}</span>}
          {t.message}
        </div>
      ))}
    </div>
  )
}
