import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

export type ToastTone = 'info' | 'success' | 'warn'
interface Toast {
  id: number
  text: string
  tone: ToastTone
  icon?: string
}

interface ToastApi {
  toasts: Toast[]
  toast: (text: string, tone?: ToastTone, icon?: string) => void
  dismiss: (id: number) => void
}

const Ctx = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])
  const toast = useCallback(
    (text: string, tone: ToastTone = 'info', icon?: string) => {
      const id = nextId.current++
      setToasts((t) => [...t.slice(-2), { id, text, tone, icon }])
      setTimeout(() => dismiss(id), 3800)
    },
    [dismiss],
  )
  const value = useMemo(() => ({ toasts, toast, dismiss }), [toasts, toast, dismiss])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useToast() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useToast outside ToastProvider')
  return c
}
