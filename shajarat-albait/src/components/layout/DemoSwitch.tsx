import { FlaskConical } from 'lucide-react'
import { useGame } from '../../store/GameContext'
import { useToast } from '../../store/ToastContext'

/** "وضع العرض Demo" toggle — shortens sessions so the whole game can be tried in a minute */
export function DemoSwitch({ variant = 'pill' }: { variant?: 'pill' | 'card' }) {
  const { settings, setDemoMode, session } = useGame()
  const { toast } = useToast()
  const on = settings.demoMode
  const locked = !!session && session.status !== 'lobby'
  const toggle = () => {
    if (locked) {
      toast('لا يمكن تغيير الوضع أثناء جلسة جارية', 'warn', '⏳')
      return
    }
    setDemoMode(!on)
    toast(on ? 'تم إيقاف وضع العرض — الجلسات بمدتها الحقيقية' : 'وضع العرض Demo: ١٥ دقيقة = ٣٠ ثانية', on ? 'info' : 'success', on ? '⏱️' : '🧪')
  }

  if (variant === 'card') {
    return (
      <button
        onClick={toggle}
        role="switch"
        aria-checked={on}
        className={`group flex w-full items-center gap-3 rounded-[22px] border px-4 py-3 text-start transition ${on ? 'border-gold/50 bg-gold-soft/90' : 'border-white/80 bg-white/60 hover:bg-white/80'}`}
      >
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${on ? 'bg-gold text-white' : 'bg-forest/10 text-forest'}`}>
          <FlaskConical size={22} />
        </span>
        <span className="flex-1">
          <span className="block font-display font-semibold text-ink">وضع العرض Demo</span>
          <span className="block text-[13px] text-ink-soft">{on ? 'مفعّل: ١٥ د = ٣٠ ث · ٣٠ د = ٦٠ ث · ٤٥ د = ٩٠ ث' : 'جرّب جلسة كاملة خلال ثوانٍ'}</span>
        </span>
        <Knob on={on} />
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      role="switch"
      aria-checked={on}
      aria-label="وضع العرض Demo"
      className={`flex h-10 items-center gap-2 rounded-full border px-3 text-[13px] font-semibold transition ${on ? 'border-gold/50 bg-gold-soft text-wood-2' : 'border-white/80 bg-white/60 text-ink-soft hover:bg-white'}`}
    >
      <FlaskConical size={16} />
      <span>Demo</span>
      <Knob on={on} small />
    </button>
  )
}

function Knob({ on, small }: { on: boolean; small?: boolean }) {
  const w = small ? 'h-5 w-9' : 'h-7 w-12'
  const d = small ? 'h-4 w-4' : 'h-6 w-6'
  return (
    <span className={`relative inline-flex shrink-0 items-center rounded-full p-0.5 transition ${w} ${on ? 'bg-gold' : 'bg-forest/20'}`}>
      <span className={`${d} rounded-full bg-white shadow transition-transform ${on ? (small ? '-translate-x-4' : '-translate-x-5') : 'translate-x-0'}`} />
    </span>
  )
}
