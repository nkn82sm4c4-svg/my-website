import type { FamilyProfile, Reward } from '../types'

/** Rewards are milestones on the family's lifetime points; claiming does not spend points */
export function rewardStatus(r: Reward, points: number): 'claimed' | 'ready' | 'locked' {
  if (r.claimedAt) return 'claimed'
  return points >= r.points ? 'ready' : 'locked'
}

export function progressTo(r: Reward, points: number) {
  return { progress: Math.min(1, points / r.points), remaining: Math.max(0, r.points - points) }
}

/** The family's chosen goal if still open, otherwise the closest unclaimed reward */
export function nextReward(p: FamilyProfile): { reward: Reward; progress: number; remaining: number } | null {
  const goal = p.rewards.find((r) => r.id === p.goalRewardId && !r.claimedAt)
  const open = [...p.rewards].filter((r) => !r.claimedAt).sort((a, b) => a.points - b.points)
  const reward = goal ?? open.find((r) => r.points > p.totalPoints) ?? open[0]
  return reward ? { reward, ...progressTo(reward, p.totalPoints) } : null
}
