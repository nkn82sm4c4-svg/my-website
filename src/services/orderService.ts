import type { CartLine, Order } from '../types'
import { lineTotal } from '../lib/format'
import { storage } from './storage'

const KEY = 'orders'

/**
 * Order service — simulates the POS / backend. No payment is taken.
 * Backend later: `POST /api/orders` and return the created order.
 */
export const orderService = {
  list: (): Order[] => storage.get<Order[]>(KEY, []),

  async place(lines: CartLine[], table?: string): Promise<Order> {
    await new Promise((r) => setTimeout(r, 1100)) // simulated network / kitchen ack
    const orders = orderService.list()
    const subtotal = lines.reduce((s, l) => s + lineTotal(l), 0)
    const upsellRevenue = lines.filter((l) => l.source === 'upsell').reduce((s, l) => s + lineTotal(l), 0)
    const seq = 1040 + orders.length + 1
    const order: Order = {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      number: `S-${seq}`,
      lines,
      subtotal,
      total: subtotal,
      createdAt: new Date().toISOString(),
      table,
      upsellRevenue,
    }
    storage.set(KEY, [order, ...orders].slice(0, 50))
    return order
  },
}
