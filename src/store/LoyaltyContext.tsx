import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { initialLoyalty, loyaltyService } from '../services/loyaltyService'
import type { LoyaltyState } from '../types'

interface LoyaltyApi {
  state: LoyaltyState
  remaining: number
  /** Adds a stamp; returns true when this stamp unlocked the reward. */
  addStamp: () => boolean
  redeem: () => string
  reset: () => void
}

const LoyaltyContext = createContext<LoyaltyApi | null>(null)

export function LoyaltyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LoyaltyState>(() => loyaltyService.load())

  useEffect(() => loyaltyService.save(state), [state])

  const addStamp = useCallback(() => {
    const { next, unlocked } = loyaltyService.addStamp(state)
    setState(next)
    return unlocked
  }, [state])

  const redeem = useCallback(() => {
    const next = loyaltyService.redeem(state)
    setState(next)
    return next.lastRewardCode ?? ''
  }, [state])

  const reset = useCallback(() => setState(initialLoyalty()), [])

  const api = useMemo<LoyaltyApi>(
    () => ({ state, remaining: Math.max(0, state.goal - state.stamps), addStamp, redeem, reset }),
    [state, addStamp, redeem, reset],
  )
  return <LoyaltyContext.Provider value={api}>{children}</LoyaltyContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLoyalty() {
  const ctx = useContext(LoyaltyContext)
  if (!ctx) throw new Error('useLoyalty must be used inside LoyaltyProvider')
  return ctx
}
