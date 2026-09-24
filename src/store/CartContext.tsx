import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { RESTAURANT } from '../config/restaurant'
import { img } from '../config/models'
import { lineTotal, uid } from '../lib/format'
import { analytics } from '../services/analyticsService'
import { storage } from '../services/storage'
import type { AddOn, CartLine, Offer, Product } from '../types'

interface CartApi {
  lines: CartLine[]
  count: number
  subtotal: number
  /** Monotonic counter — lets UI animate the cart badge on every add. */
  addTick: number
  addProduct: (p: Product, opts?: { quantity?: number; addOns?: AddOn[]; source?: CartLine['source']; note?: string }) => void
  addOffer: (o: Offer) => void
  addReward: () => void
  setQuantity: (lineId: string, quantity: number) => void
  toggleAddOn: (lineId: string, addOn: AddOn) => void
  remove: (lineId: string) => void
  clear: () => void
  has: (refId: string) => boolean
}

const CartContext = createContext<CartApi | null>(null)
const KEY = 'cart'

const sameAddOns = (a: AddOn[], b: AddOn[]) => a.length === b.length && a.every((x) => b.some((y) => y.id === x.id))

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => storage.get<CartLine[]>(KEY, []))
  const [addTick, setAddTick] = useState(0)

  useEffect(() => storage.set(KEY, lines), [lines])

  const push = useCallback((line: Omit<CartLine, 'lineId'>) => {
    setLines((prev) => {
      const existing = prev.find(
        (l) => l.kind === line.kind && l.refId === line.refId && sameAddOns(l.addOns, line.addOns) && l.source === line.source,
      )
      if (existing) {
        return prev.map((l) => (l === existing ? { ...l, quantity: l.quantity + line.quantity } : l))
      }
      return [...prev, { ...line, lineId: uid() }]
    })
    setAddTick((t) => t + 1)
  }, [])

  const addProduct: CartApi['addProduct'] = useCallback(
    (p, opts = {}) => {
      const source = opts.source ?? 'menu'
      const quantity = opts.quantity ?? 1
      const addOns = opts.addOns ?? []
      push({
        kind: 'product',
        refId: p.id,
        name: p.name,
        image: p.image,
        unitPrice: p.price,
        quantity,
        addOns,
        note: opts.note,
        source,
        tint: p.tint,
      })
      if (source === 'upsell') {
        analytics.track('upsellAccepted')
        analytics.track('upsellRevenue', (p.price + addOns.reduce((s, a) => s + a.price, 0)) * quantity)
      }
    },
    [push],
  )

  const addOffer = useCallback(
    (o: Offer) =>
      push({ kind: 'offer', refId: o.id, name: o.title, image: o.image, unitPrice: o.price, quantity: 1, addOns: [], source: 'offer' }),
    [push],
  )

  const addReward = useCallback(
    () =>
      push({
        kind: 'reward',
        refId: 'loyalty-reward',
        name: `🎁 مكافأة الولاء: ${RESTAURANT.loyalty.rewardTitle}`,
        image: img('fries'),
        unitPrice: 0,
        quantity: 1,
        addOns: [],
        source: 'reward',
      }),
    [push],
  )

  const setQuantity = useCallback((lineId: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0 ? prev.filter((l) => l.lineId !== lineId) : prev.map((l) => (l.lineId === lineId ? { ...l, quantity } : l)),
    )
  }, [])

  const toggleAddOn = useCallback((lineId: string, addOn: AddOn) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.lineId !== lineId) return l
        const has = l.addOns.some((a) => a.id === addOn.id)
        return { ...l, addOns: has ? l.addOns.filter((a) => a.id !== addOn.id) : [...l.addOns, addOn] }
      }),
    )
  }, [])

  const remove = useCallback((lineId: string) => setLines((prev) => prev.filter((l) => l.lineId !== lineId)), [])
  const clear = useCallback(() => setLines([]), [])

  const api = useMemo<CartApi>(
    () => ({
      lines,
      count: lines.reduce((s, l) => s + l.quantity, 0),
      subtotal: lines.reduce((s, l) => s + lineTotal(l), 0),
      addTick,
      addProduct,
      addOffer,
      addReward,
      setQuantity,
      toggleAddOn,
      remove,
      clear,
      has: (refId) => lines.some((l) => l.refId === refId),
    }),
    [lines, addTick, addProduct, addOffer, addReward, setQuantity, toggleAddOn, remove, clear],
  )

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
