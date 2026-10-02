import { useGame } from '../../store/GameContext'

/** Always tells the user when timings are shortened */
export function DemoBanner() {
  const { settings } = useGame()
  if (!settings.demoMode) return null
  return (
    <div className="mx-auto mt-2 max-w-6xl px-3 sm:px-5" role="status">
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-gold/40 bg-gold-soft/85 px-4 py-2 text-center text-[13px] font-semibold text-wood-2 backdrop-blur">
        <span>🧪</span>
        <span className="sm:hidden">وضع العرض Demo فقط — ١٥ د = ٣٠ ث · ٣٠ د = ٦٠ ث · ٤٥ د = ٩٠ ث</span>
        <span className="hidden sm:inline">
          وضع العرض Demo فقط — الأوقات مختصرة للتجربة: ١٥ دقيقة = ٣٠ ثانية · ٣٠ دقيقة = ٦٠ ثانية · ٤٥ دقيقة = ٩٠ ثانية
        </span>
      </div>
    </div>
  )
}
