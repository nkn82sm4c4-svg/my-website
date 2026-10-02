import type { ReactNode } from 'react'

export function Page({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <main className={`mx-auto w-full max-w-6xl px-4 pt-6 sm:px-5 sm:pt-10 ${className}`}>{children}</main>
}
