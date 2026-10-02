/** 2D tree used when WebGL is unavailable — follows the same growth stages */
export function FallbackTree({ growth, fruit = 0 }: { growth: number; fruit?: number }) {
  const g = Math.min(1, Math.max(0, growth))
  const trunkH = 30 + g * 70
  const blobs = [
    { x: 100, y: 70, r: 34, at: 0.3 },
    { x: 70, y: 88, r: 26, at: 0.45 },
    { x: 130, y: 88, r: 26, at: 0.5 },
    { x: 84, y: 58, r: 22, at: 0.62 },
    { x: 118, y: 58, r: 22, at: 0.7 },
    { x: 100, y: 46, r: 22, at: 0.8 },
  ]
  return (
    <svg viewBox="0 0 200 220" className="h-full w-full" role="img" aria-label="شجرة الأسرة">
      <ellipse cx="100" cy="196" rx="80" ry="16" fill="#7fb36a" />
      <ellipse cx="100" cy="204" rx="70" ry="12" fill="#a07a55" />
      <rect x={100 - 4 - g * 4} y={190 - trunkH} width={8 + g * 8} height={trunkH} rx="5" fill="#7d5136" />
      {g < 0.35 && (
        <g transform={`translate(100 ${190 - trunkH})`} opacity={1 - g / 0.35}>
          <ellipse cx="-12" cy="-4" rx="12" ry="6" fill="#6dbb6f" transform="rotate(-25)" />
          <ellipse cx="12" cy="-4" rx="12" ry="6" fill="#6dbb6f" transform="rotate(25)" />
        </g>
      )}
      <g transform={`translate(0 ${(1 - g) * 70})`}>
        {blobs.map((b, i) => {
          const s = Math.min(1, Math.max(0, (g - b.at) / 0.12))
          return <circle key={i} cx={b.x} cy={b.y} r={b.r * s} fill={['#4f9a5a', '#5fae6e', '#3f8a4f', '#78c285'][i % 4]} style={{ transition: 'r .4s' }} />
        })}
        {fruit > 0.5 && [[80, 80], [120, 64], [108, 96], [92, 52]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5" fill="#d9493b" />)}
      </g>
    </svg>
  )
}
