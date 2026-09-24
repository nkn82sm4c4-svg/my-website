import { CATEGORIES, PRODUCTS } from '../data/menu'
import { OFFERS } from '../data/offers'
import type { CategoryId, Product } from '../types'

/**
 * Menu service — reads mock data today.
 * Backend later: replace bodies with `fetch('/api/menu')` etc. The UI only
 * depends on these function signatures.
 */
export const menuService = {
  categories: () => CATEGORIES,
  offers: () => OFFERS,
  products: () => PRODUCTS,
  bestSellers: (limit = 6) =>
    [...PRODUCTS]
      .filter((p) => p.badges?.includes('bestseller') || (p.popularity ?? 0) >= 90)
      .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
      .slice(0, limit),
  featured: () => PRODUCTS.filter((p) => p.featured),
  byCategory: (id: CategoryId): Product[] => (id === 'best' ? menuService.bestSellers(8) : PRODUCTS.filter((p) => p.categoryId === id)),
  search: (q: string) => {
    const s = q.trim()
    if (!s) return []
    return PRODUCTS.filter((p) => p.name.includes(s) || p.description.includes(s))
  },
}
