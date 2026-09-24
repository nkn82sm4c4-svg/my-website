import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { useHashRoute, type Route, type RouteName } from '../hooks/useHashRoute'

export interface Toast {
  id: number
  message: string
  icon?: string
}

interface ProductSheetState {
  productId: string
  view: 'photo' | '3d'
}

interface UIApi {
  route: Route
  navigate: (name: RouteName, param?: string) => void
  table?: string
  toasts: Toast[]
  toast: (message: string, icon?: string) => void
  productSheet: ProductSheetState | null
  openProduct: (productId: string, view?: ProductSheetState['view']) => void
  closeProduct: () => void
  upsellFor: string | null
  showUpsell: (productId: string) => void
  closeUpsell: () => void
  rewardCelebration: boolean
  setRewardCelebration: (v: boolean) => void
  managerOpen: boolean
  setManagerOpen: (v: boolean) => void
}

const UIContext = createContext<UIApi | null>(null)

/** Table number comes from the QR deep link, e.g. https://…/?table=7 */
const readTable = () => new URLSearchParams(window.location.search).get('table') ?? undefined

export function UIProvider({ children }: { children: ReactNode }) {
  const { route, navigate } = useHashRoute()
  const [toasts, setToasts] = useState<Toast[]>([])
  const [productSheet, setProductSheet] = useState<ProductSheetState | null>(null)
  const [upsellFor, setUpsellFor] = useState<string | null>(null)
  const [rewardCelebration, setRewardCelebration] = useState(false)
  const [managerOpen, setManagerOpen] = useState(false)
  const [table] = useState(readTable)
  const nextId = useRef(1)

  const toast = useCallback((message: string, icon?: string) => {
    const id = nextId.current++
    setToasts((t) => [...t.slice(-2), { id, message, icon }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600)
  }, [])

  const openProduct = useCallback((productId: string, view: ProductSheetState['view'] = 'photo') => {
    setProductSheet({ productId, view })
  }, [])

  const api = useMemo<UIApi>(
    () => ({
      route,
      navigate,
      table,
      toasts,
      toast,
      productSheet,
      openProduct,
      closeProduct: () => setProductSheet(null),
      upsellFor,
      showUpsell: setUpsellFor,
      closeUpsell: () => setUpsellFor(null),
      rewardCelebration,
      setRewardCelebration,
      managerOpen,
      setManagerOpen,
    }),
    [route, navigate, table, toasts, toast, productSheet, openProduct, upsellFor, rewardCelebration, managerOpen],
  )
  return <UIContext.Provider value={api}>{children}</UIContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used inside UIProvider')
  return ctx
}
