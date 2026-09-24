/**
 * Domain types. They intentionally mirror what a future REST/GraphQL backend
 * would return, so the mock services in `src/services` can be swapped for real
 * API calls without touching the UI.
 */

export type CategoryId =
  | 'best'
  | 'darbat'
  | 'sawareekh'
  | 'double'
  | 'sharing'
  | 'monsafat'
  | 'shawarma'
  | 'pizza'
  | 'sinmariya'
  | 'fatayer'
  | 'fries'
  | 'drinks'

export interface Category {
  id: CategoryId
  name: string
  emoji: string
  /** Virtual categories (e.g. "best sellers") are computed from product flags. */
  virtual?: boolean
}

export type BadgeKind = 'bestseller' | 'new' | 'spicy' | 'chef' | 'value' | 'sharing'

export interface AddOn {
  id: string
  name: string
  price: number
}

/** Key of a 3D model in `src/config/models.ts` (maps to /public/models/*.glb). */
export type ModelKey =
  | 'burger'
  | 'double-burger'
  | 'fries'
  | 'drink'
  | 'sauce'
  | 'wrap'
  | 'sub'
  | 'pizza'
  | 'fatayer'
  | 'pie-boat'

export interface Product {
  id: string
  name: string
  description: string
  price: number
  categoryId: Exclude<CategoryId, 'best'>
  image: string
  model?: ModelKey
  badges?: BadgeKind[]
  calories?: number
  prepMinutes?: number
  addOns?: AddOn[]
  /** Product ids that are frequently ordered together with this one. */
  pairsWith?: string[]
  featured?: boolean
  popularity?: number
  /** CSS filter used to visually differentiate variants sharing one render. */
  tint?: string
}

export interface Offer {
  id: string
  title: string
  subtitle: string
  description: string
  price: number
  originalPrice: number
  image: string
  model?: ModelKey
  includes: string[]
  tag: string
  membersOnly?: boolean
  accent: 'brand' | 'gold' | 'ink'
}

export interface CartLine {
  lineId: string
  kind: 'product' | 'offer' | 'reward'
  refId: string
  name: string
  image: string
  unitPrice: number
  quantity: number
  addOns: AddOn[]
  note?: string
  /** Where this line came from — lets us measure upselling impact. */
  source?: 'menu' | 'upsell' | 'offer' | 'reward'
  tint?: string
}

export interface Order {
  id: string
  number: string
  lines: CartLine[]
  subtotal: number
  total: number
  createdAt: string
  table?: string
  upsellRevenue: number
}

export interface LoyaltyState {
  memberName: string
  stamps: number
  goal: number
  rewardsEarned: number
  rewardsRedeemed: number
  /** Reward that reached 5/5 and waits to be used. */
  rewardReady: boolean
  lastRewardCode?: string
}
