import { useEffect, useRef, useState } from 'react'
import { num } from '../../lib/format'

/** Counts smoothly to `value`; bumps when it increases */
export function AnimatedNumber({ value, duration = 900, from, className = '' }: { value: number; duration?: number; from?: number; className?: string }) {
  const [shown, setShown] = useState(from ?? value)
  const [bump, setBump] = useState(0)
  const prev = useRef(from ?? value)
  const shownRef = useRef(from ?? value)
  useEffect(() => {
    const start = shownRef.current
    if (start === value) return
    const t0 = performance.now()
    let raf = 0
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / duration)
      const e = 1 - (1 - k) ** 3
      shownRef.current = Math.round(start + (value - start) * e)
      setShown(shownRef.current)
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    if (value > prev.current) setBump((b) => b + 1)
    prev.current = value
    return () => cancelAnimationFrame(raf)
  }, [value, duration])
  return (
    <span key={bump} className={`num inline-block ${bump ? 'animate-bump' : ''} ${className}`}>
      {num(shown)}
    </span>
  )
}
