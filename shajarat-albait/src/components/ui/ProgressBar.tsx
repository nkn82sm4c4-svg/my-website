export function ProgressBar({ value, marks = [], tone = 'leaf', label, className = '' }: { value: number; marks?: number[]; tone?: 'leaf' | 'gold'; label?: string; className?: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 1000) / 10
  const fill = tone === 'gold' ? 'from-[#f1cf7d] to-gold' : 'from-sprout via-leaf-2 to-leaf'
  return (
    <div
      className={`relative h-4 w-full overflow-hidden rounded-full bg-forest/10 shadow-[inset_0_2px_4px_rgb(31_77_54/0.15)] ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label={label}
    >
      <div className={`h-full rounded-full bg-gradient-to-l ${fill} transition-[width] duration-500 ease-out`} style={{ width: `${pct}%` }}>
        <div className="h-1/2 rounded-full bg-white/35" />
      </div>
      {marks.map((m) => (
        <span key={m} className="absolute top-1/2 h-2 w-2 -translate-y-1/2 translate-x-1/2 rounded-full bg-white/90 shadow" style={{ right: `${m * 100}%` }} />
      ))}
    </div>
  )
}
