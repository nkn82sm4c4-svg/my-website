import { X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../../lib/format'

interface Props {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: ReactNode
  className?: string
  /** Hide default close button (e.g. when content provides its own). */
  bare?: boolean
}

/**
 * Mobile bottom sheet: slides up, drag-down or backdrop tap to dismiss,
 * locks body scroll, closes on Escape.
 */
export function Sheet({ open, onClose, children, title, className, bare }: Props) {
  const [drag, setDrag] = useState(0)
  const start = useRef<number | null>(null)
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  const onTouchStart = (e: React.TouchEvent) => {
    // only start drag from the handle area or when content is scrolled to top
    if ((panel.current?.scrollTop ?? 0) > 0) return
    start.current = e.touches[0].clientY
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (start.current == null) return
    setDrag(Math.max(0, e.touches[0].clientY - start.current))
  }
  const onTouchEnd = () => {
    if (drag > 110) onClose()
    setDrag(0)
    start.current = null
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 animate-fade bg-ink/55 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={panel}
        style={{ transform: drag ? `translateY(${drag}px)` : undefined, transition: drag ? 'none' : undefined }}
        className={cx(
          'relative z-10 max-h-[92dvh] w-full max-w-[480px] animate-sheet-up overflow-y-auto overscroll-contain rounded-t-[28px] bg-cream no-scrollbar',
          className,
        )}
      >
        <div
          className="sticky top-0 z-20 flex justify-center pt-2.5 pb-1"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <span className="h-1.5 w-11 rounded-full bg-ink/15" />
        </div>
        {!bare && (
          <div className="flex items-center justify-between px-5 pb-2">
            <div className="font-display text-lg font-bold">{title}</div>
            <button onClick={onClose} aria-label="إغلاق" className="tap grid size-9 place-items-center rounded-full bg-sand">
              <X className="size-4" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  )
}
