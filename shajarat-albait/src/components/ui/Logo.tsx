export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <defs>
        <linearGradient id="lg-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b6446" />
          <stop offset="1" stopColor="#173a28" />
        </linearGradient>
        <linearGradient id="lg-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9fd18b" />
          <stop offset="1" stopColor="#4f9a5a" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#lg-bg)" />
      {/* house roof */}
      <path d="M14 33 32 18l18 15" fill="none" stroke="#e9dcc3" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="29.5" y="36" width="5" height="16" rx="2.5" fill="#c49a6c" />
      <circle cx="32" cy="31" r="10" fill="url(#lg-leaf)" />
      <circle cx="25" cy="35" r="6.5" fill="#5fae6e" />
      <circle cx="39" cy="35" r="6.5" fill="#78c285" />
      <path d="M16 52h32" stroke="#e9dcc3" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={compact ? 36 : 42} />
      <span className="leading-none">
        <span className="block font-display text-[19px] font-bold text-forest sm:text-xl">شجرة البيت</span>
        {!compact && <span className="mt-1 block text-[11px] font-medium text-muted">جلسات عائلية بلا هواتف</span>}
      </span>
    </span>
  )
}
