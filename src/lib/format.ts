import { RESTAURANT } from '../config/restaurant'
import type { CartLine } from '../types'

export const formatPrice = (n: number) =>
  `${Number.isInteger(n) ? n : n.toFixed(2)} ${RESTAURANT.currency}`

export const lineUnitPrice = (l: CartLine) => l.unitPrice + l.addOns.reduce((s, a) => s + a.price, 0)

export const lineTotal = (l: CartLine) => lineUnitPrice(l) * l.quantity

export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ')

export const uid = () => Math.random().toString(36).slice(2, 10)
