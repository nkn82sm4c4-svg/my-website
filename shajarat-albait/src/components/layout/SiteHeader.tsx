import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { navigate, type RouteName } from '../../hooks/useHashRoute'
import { useGame } from '../../store/GameContext'
import { AnimatedNumber } from '../ui/AnimatedNumber'
import { Logo } from '../ui/Logo'
import { DemoSwitch } from './DemoSwitch'

const LINKS: { to: RouteName; label: string }[] = [
  { to: 'home', label: 'الرئيسية' },
  { to: 'garden', label: 'حديقة الأسرة' },
  { to: 'rewards', label: 'المكافآت' },
  { to: 'how', label: 'طريقة اللعب' },
]

export function SiteHeader({ route }: { route: RouteName }) {
  const { profile, session } = useGame()
  const [open, setOpen] = useState(false)
  const go = (to: RouteName) => {
    setOpen(false)
    navigate(to)
  }
  const activeSession = session && (session.status === 'running' || session.status === 'paused')

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5">
      <div className="glass mx-auto flex h-16 max-w-6xl items-center gap-3 rounded-[22px] px-3 sm:px-5">
        <button onClick={() => go('home')} aria-label="شجرة البيت — الرئيسية" className="shrink-0">
          <Logo compact />
        </button>
        <nav className="ms-4 hidden items-center gap-1 md:flex" aria-label="التنقل">
          {LINKS.map((l) => (
            <button
              key={l.to}
              onClick={() => go(l.to)}
              aria-current={route === l.to ? 'page' : undefined}
              className={`rounded-xl px-3.5 py-2 text-[15px] font-semibold transition ${route === l.to ? 'bg-forest text-white' : 'text-ink-soft hover:bg-forest/5'}`}
            >
              {l.label}
            </button>
          ))}
        </nav>
        <div className="ms-auto flex items-center gap-2">
          {activeSession && route !== 'live' && (
            <button onClick={() => go('live')} className="hidden h-10 items-center gap-2 rounded-full bg-forest px-3.5 text-[13px] font-semibold text-white sm:flex">
              <span className="h-2 w-2 animate-pulse-soft rounded-full bg-sprout" /> العودة للجلسة
            </button>
          )}
          <button onClick={() => go('rewards')} className="hidden h-10 items-center gap-1.5 rounded-full bg-white/70 px-3.5 text-[13px] font-semibold text-forest ring-1 ring-white sm:flex" aria-label="رصيد النقاط">
            <span>⭐</span>
            <AnimatedNumber value={profile.totalPoints} />
            <span className="text-muted">نقطة</span>
          </button>
          <DemoSwitch />
          <button onClick={() => setOpen((o) => !o)} className="grid h-10 w-10 place-items-center rounded-full text-forest hover:bg-forest/5 md:hidden" aria-label="القائمة" aria-expanded={open}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="glass mx-auto mt-2 max-w-6xl animate-fade-up rounded-[22px] p-2 md:hidden" aria-label="التنقل">
          {activeSession && (
            <button onClick={() => go('live')} className="mb-1 flex w-full items-center gap-2 rounded-2xl bg-forest px-4 py-3 text-start font-semibold text-white">
              <span className="h-2 w-2 animate-pulse-soft rounded-full bg-sprout" /> العودة للجلسة الجارية
            </button>
          )}
          {LINKS.map((l) => (
            <button
              key={l.to}
              onClick={() => go(l.to)}
              className={`block w-full rounded-2xl px-4 py-3 text-start font-semibold ${route === l.to ? 'bg-forest/10 text-forest' : 'text-ink-soft'}`}
            >
              {l.label}
            </button>
          ))}
          <div className="mt-1 flex items-center justify-between rounded-2xl bg-white/60 px-4 py-3 text-sm font-semibold text-forest">
            <span>رصيد الأسرة</span>
            <span>
              ⭐ <AnimatedNumber value={profile.totalPoints} /> نقطة
            </span>
          </div>
        </nav>
      )}
    </header>
  )
}
