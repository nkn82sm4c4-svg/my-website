import { useToast } from '../../store/ToastContext'

const TONES = {
  info: 'bg-white/90 text-forest',
  success: 'bg-forest text-white',
  warn: 'bg-[#fff4e0] text-wood-2 border-gold/40',
}

export function Toasts() {
  const { toasts, dismiss } = useToast()
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-3" aria-live="polite">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={`pointer-events-auto flex max-w-md animate-pop items-center gap-2 rounded-2xl border border-white/60 px-4 py-3 text-sm font-semibold shadow-lift backdrop-blur-xl ${TONES[t.tone]}`}
        >
          {t.icon && <span className="text-lg">{t.icon}</span>}
          {t.text}
        </button>
      ))}
    </div>
  )
}
