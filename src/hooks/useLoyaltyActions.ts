import { useCallback } from 'react'
import { useCart } from '../store/CartContext'
import { useLoyalty } from '../store/LoyaltyContext'
import { useUI } from '../store/UIContext'

/** Shared loyalty actions used by the card, the order flow and the reward modal. */
export function useLoyaltyActions() {
  const loyalty = useLoyalty()
  const cart = useCart()
  const ui = useUI()

  /** Adds a stamp (used by "simulate order" and by real order confirmation). */
  const stamp = useCallback(
    (silent = false) => {
      if (loyalty.state.rewardReady) {
        if (!silent) ui.toast('مكافأتك جاهزة — استخدمها أولًا 🎁')
        ui.setRewardCelebration(true)
        return false
      }
      const unlocked = loyalty.addStamp()
      if (!silent) ui.toast('+1 نقطة ولاء', '⭐')
      if (unlocked) setTimeout(() => ui.setRewardCelebration(true), silent ? 1400 : 500)
      return true
    },
    [loyalty, ui],
  )

  const redeemReward = useCallback(() => {
    const code = loyalty.redeem()
    cart.addReward()
    return code
  }, [loyalty, cart])

  return { stamp, redeemReward }
}

/** Arabic count phrasing for "remaining orders". */
export function remainingText(n: number) {
  if (n <= 0) return 'مكافأتك جاهزة! 🎉'
  if (n === 1) return 'بقي لك طلب واحد للحصول على مكافأتك 🎁'
  if (n === 2) return 'بقي لك طلبان للحصول على مكافأتك 🎁'
  return `بقي لك ${n} طلبات للحصول على مكافأتك 🎁`
}
