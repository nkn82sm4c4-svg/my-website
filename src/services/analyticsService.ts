import { storage } from './storage'

/**
 * Lightweight demo analytics — lets the "manager view" show the impact of
 * upselling and loyalty using what happened during the demo.
 * Backend later: send these events to your analytics pipeline.
 */
export interface DemoStats {
  upsellShown: number
  upsellAccepted: number
  upsellRevenue: number
  productViews3d: number
  qrScans: number
}

const KEY = 'stats'
const empty: DemoStats = { upsellShown: 0, upsellAccepted: 0, upsellRevenue: 0, productViews3d: 0, qrScans: 0 }

export const analytics = {
  get: (): DemoStats => ({ ...empty, ...storage.get<Partial<DemoStats>>(KEY, {}) }),
  track(event: keyof DemoStats, amount = 1) {
    const s = analytics.get()
    s[event] += amount
    storage.set(KEY, s)
  },
}
