import type { Product } from '../types'
import { PRODUCTS, productById } from './menu'

/**
 * Upsell engine (rule based for the demo).
 *
 * Production idea: replace `getUpsells` with an endpoint that ranks suggestions
 * using real "frequently bought together" data from past orders.
 */

const MAIN_CATEGORIES = new Set(['darbat', 'sawareekh', 'double', 'monsafat', 'shawarma', 'pizza', 'sinmariya'])

export interface UpsellSuggestion {
  product: Product
  reason: string
}

export function getUpsells(productId: string, excludeIds: string[] = [], limit = 3): UpsellSuggestion[] {
  const source = productById(productId)
  if (!source) return []
  const exclude = new Set([productId, ...excludeIds])

  const paired = (source.pairsWith ?? [])
    .map((id) => productById(id))
    .filter((p): p is Product => !!p && !exclude.has(p.id))

  const reasons: Record<string, string> = {
    fries: 'يكمّل وجبتك',
    drinks: 'انتعش معها',
    fatayer: 'إضافة خفيفة',
  }

  const list: UpsellSuggestion[] = paired.map((p) => ({
    product: p,
    reason: p.id.startsWith('sauce') ? 'يُطلب مع 8 من كل 10 طلبات' : reasons[p.categoryId] ?? 'الأكثر طلبًا معه',
  }))

  // Fill with popular sides if the product has few pairings.
  if (list.length < limit) {
    const fallback = PRODUCTS.filter(
      (p) => ['fries', 'drinks'].includes(p.categoryId) && !exclude.has(p.id) && !list.some((s) => s.product.id === p.id),
    ).sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    for (const p of fallback) {
      if (list.length >= limit) break
      list.push({ product: p, reason: 'الأكثر طلبًا معه' })
    }
  }
  return list.slice(0, limit)
}

export const isMainDish = (p: Product) => MAIN_CATEGORIES.has(p.categoryId)

/** Meal upgrade: bundle fries + drink at a discount vs buying separately. */
export const MEAL_UPGRADE = {
  price: 9,
  items: ['fries-classic', 'drink-soda'],
  get separatePrice() {
    return this.items.reduce((sum, id) => sum + (productById(id)?.price ?? 0), 0)
  },
}

/** Pseudo-product used when the customer accepts the meal upgrade. */
export const MEAL_UPGRADE_PRODUCT: Product = {
  id: 'meal-upgrade',
  name: 'ترقية لوجبة: بطاطس + مشروب',
  description: 'بطاطس كلاسيك ومشروب غازي بسعر الوجبة.',
  price: MEAL_UPGRADE.price,
  categoryId: 'fries',
  image: `${import.meta.env.BASE_URL}images/products/combo-meal.webp`,
}
