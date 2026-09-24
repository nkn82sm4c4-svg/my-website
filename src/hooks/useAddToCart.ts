import { useCallback } from 'react'
import { getUpsells } from '../data/upsell'
import { analytics } from '../services/analyticsService'
import { useCart } from '../store/CartContext'
import { useUI } from '../store/UIContext'
import type { AddOn, Product } from '../types'

/**
 * Single entry point for "add to cart" so every button in the app triggers the
 * same feedback + upsell flow.
 */
export function useAddToCart() {
  const cart = useCart()
  const ui = useUI()

  return useCallback(
    (p: Product, opts: { quantity?: number; addOns?: AddOn[]; upsell?: boolean; source?: 'menu' | 'upsell' } = {}) => {
      cart.addProduct(p, { quantity: opts.quantity, addOns: opts.addOns, source: opts.source })
      ui.toast(`أُضيف ${p.name} إلى السلة`, '✅')
      const wantsUpsell = opts.upsell ?? opts.source !== 'upsell'
      if (wantsUpsell) {
        const inCart = cart.lines.map((l) => l.refId)
        if (getUpsells(p.id, inCart).length > 0) {
          analytics.track('upsellShown')
          setTimeout(() => ui.showUpsell(p.id), 350)
        }
      }
    },
    [cart, ui],
  )
}
