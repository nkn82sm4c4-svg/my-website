import type { ReactNode } from 'react'
import { cx } from '../../lib/format'

/** Standard website content width. */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('mx-auto w-full max-w-7xl px-5 md:px-8', className)}>{children}</div>
}
