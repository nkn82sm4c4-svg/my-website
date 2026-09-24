import { RESTAURANT } from '../config/restaurant'
import type { LoyaltyState } from '../types'
import { storage } from './storage'

const KEY = 'loyalty'

export const initialLoyalty = (): LoyaltyState => ({
  memberName: RESTAURANT.demo.memberName,
  stamps: RESTAURANT.demo.initialStamps,
  goal: RESTAURANT.loyalty.goal,
  rewardsEarned: 0,
  rewardsRedeemed: 0,
  rewardReady: false,
})

/**
 * Loyalty service — stamps live in localStorage for the demo.
 * Backend later: tie to the customer's phone number (OTP) and persist server-side.
 */
export const loyaltyService = {
  load: (): LoyaltyState => storage.get<LoyaltyState>(KEY, initialLoyalty()),
  save: (s: LoyaltyState) => storage.set(KEY, s),

  /** Adds one stamp. Returns the new state and whether the reward just unlocked. */
  addStamp(s: LoyaltyState): { next: LoyaltyState; unlocked: boolean } {
    if (s.rewardReady) return { next: s, unlocked: false }
    const stamps = Math.min(s.goal, s.stamps + 1)
    const unlocked = stamps >= s.goal
    return {
      next: { ...s, stamps, rewardReady: unlocked, rewardsEarned: s.rewardsEarned + (unlocked ? 1 : 0) },
      unlocked,
    }
  },

  redeem(s: LoyaltyState): LoyaltyState {
    const code = 'SN-' + Math.random().toString(36).slice(2, 6).toUpperCase()
    return { ...s, stamps: 0, rewardReady: false, rewardsRedeemed: s.rewardsRedeemed + 1, lastRewardCode: code }
  },
}
