import { useMemo } from 'react'

/** Deterministic pseudo-random in [0,1) — keeps render pure. */
const rand = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

/** Lightweight CSS confetti burst (no dependencies). */
export function Confetti({ count = 60 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: rand(i, 1) * 100,
        delay: rand(i, 2) * 0.4,
        duration: 1.6 + rand(i, 3) * 1.4,
        rotate: rand(i, 4) * 360,
        color: ['#b3121f', '#e8a33d', '#2f8f4e', '#fbf6ef', '#f97316'][i % 5],
        size: 6 + rand(i, 5) * 6,
      })),
    [count],
  )
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <style>{`@keyframes confetti-fall{0%{transform:translateY(-20px) rotate(0)}100%{transform:translateY(110vh) rotate(720deg)}}`}</style>
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.45,
            background: p.color,
            transform: `rotate(${p.rotate}deg)`,
            animation: `confetti-fall ${p.duration}s ${p.delay}s cubic-bezier(.2,.6,.4,1) forwards`,
          }}
          className="absolute -top-4 rounded-[2px]"
        />
      ))}
    </div>
  )
}
