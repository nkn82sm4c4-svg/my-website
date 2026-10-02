import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../../three/webgl'

/** Leaf & petal confetti over the page; re-fires whenever `fire` changes */
export function Confetti({ fire }: { fire: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (!fire || prefersReducedMotion()) return
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    c.width = window.innerWidth * dpr
    c.height = window.innerHeight * dpr
    ctx.scale(dpr, dpr)
    const colors = ['#5fae6e', '#9fd18b', '#3f8a55', '#d9a441', '#f2b3c6', '#ffffff']
    const parts = Array.from({ length: 140 }, () => ({
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
      y: window.innerHeight * 0.4,
      vx: (Math.random() - 0.5) * 14,
      vy: -Math.random() * 14 - 4,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      s: 6 + Math.random() * 7,
      c: colors[Math.floor(Math.random() * colors.length)],
    }))
    let raf = 0
    const t0 = performance.now()
    const draw = (t: number) => {
      const age = (t - t0) / 1000
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      for (const p of parts) {
        p.vy += 0.35
        p.vx *= 0.99
        p.x += p.vx
        p.y += p.vy
        p.r += p.vr
        ctx.save()
        ctx.globalAlpha = Math.max(0, 1 - age / 3.2)
        ctx.translate(p.x, p.y)
        ctx.rotate(p.r)
        ctx.fillStyle = p.c
        ctx.beginPath()
        ctx.ellipse(0, 0, p.s, p.s * 0.45, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
      if (age < 3.4) raf = requestAnimationFrame(draw)
      else ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [fire])
  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[55] h-full w-full" />
}
