import { Timer } from 'lucide-react'
import { useEffect, useState } from 'react'

const pad = (n: number) => String(n).padStart(2, '0')

/** Time left until midnight — "today's offers end in…" urgency cue. */
export function Countdown({ className }: { className?: string }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const end = new Date(now)
  end.setHours(24, 0, 0, 0)
  const s = Math.max(0, Math.floor((end.getTime() - now) / 1000))
  return (
    <span className={className}>
      <Timer className="size-3.5" />
      ينتهي خلال
      <span className="font-display font-bold tabular-nums" dir="ltr">
        {pad(Math.floor(s / 3600))}:{pad(Math.floor((s % 3600) / 60))}:{pad(s % 60)}
      </span>
    </span>
  )
}
