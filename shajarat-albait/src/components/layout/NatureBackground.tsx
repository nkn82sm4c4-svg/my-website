/** Fixed natural backdrop: warm sky glow and layered soft hills */
export function NatureBackground() {
  return (
    <div className="nature-bg" aria-hidden>
      <svg className="hills" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path d="M0 170 C 240 110 420 150 640 130 C 880 108 1080 60 1440 120 L1440 320 L0 320 Z" fill="#dcead2" opacity="0.8" />
        <path d="M0 220 C 300 170 520 230 760 200 C 1000 170 1200 150 1440 190 L1440 320 L0 320 Z" fill="#c9dfbd" opacity="0.75" />
        <path d="M0 270 C 260 240 560 285 860 262 C 1100 244 1300 250 1440 262 L1440 320 L0 320 Z" fill="#e8dcc4" />
      </svg>
    </div>
  )
}
