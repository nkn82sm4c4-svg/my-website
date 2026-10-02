import { DEFAULT_REWARDS } from '../data/rewards'
import type { DurationMin, FamilyProfile, SessionRecord, TreeRecord, TreeSpecies } from '../types'

/**
 * بيانات تجريبية: أسرة لديها 6 جلسات مكتملة ورصيد 160 نقطة،
 * حتى تُجرَّب الحديقة والمكافآت مباشرة.
 */
export function createDemoProfile(): FamilyProfile {
  const plan: { daysAgo: number; d: DurationMin; perfect: boolean; people: number; species: TreeSpecies }[] = [
    { daysAgo: 12, d: 15, perfect: false, people: 3, species: 'oak' },
    { daysAgo: 10, d: 30, perfect: true, people: 4, species: 'blossom' },
    { daysAgo: 7, d: 45, perfect: true, people: 4, species: 'pine' },
    { daysAgo: 5, d: 15, perfect: false, people: 2, species: 'olive' },
    { daysAgo: 3, d: 30, perfect: true, people: 4, species: 'oak' },
    { daysAgo: 1, d: 30, perfect: true, people: 5, species: 'citrus' },
  ]
  const sessions: SessionRecord[] = []
  const trees: TreeRecord[] = []
  plan.forEach((p, i) => {
    const date = new Date(Date.now() - p.daysAgo * 86_400_000).toISOString()
    const bonus = p.perfect ? 10 : 0
    const id = `demo-s${i + 1}`
    sessions.push({
      id,
      familyName: 'آل سالم',
      date,
      durationMin: p.d,
      demo: false,
      participants: p.people,
      points: 20 + bonus,
      basePoints: 20,
      bonusPoints: bonus,
      departures: p.perfect ? 0 : 1,
      cardsUsed: 2 + (i % 3),
      rewardId: 'r-outing',
    })
    trees.push({ id: `demo-t${i + 1}`, sessionId: id, species: p.species, seed: 1000 + i * 7919, perfect: p.perfect, plantedAt: date })
  })
  return {
    familyName: 'آل سالم',
    totalPoints: sessions.reduce((s, x) => s + x.points, 0), // 160
    sessions,
    trees,
    rewards: DEFAULT_REWARDS.map((r) => ({ ...r })),
    goalRewardId: 'r-outing',
  }
}

export function createEmptyProfile(familyName = ''): FamilyProfile {
  return {
    familyName,
    totalPoints: 0,
    sessions: [],
    trees: [],
    rewards: DEFAULT_REWARDS.map((r) => ({ ...r })),
    goalRewardId: 'r-outing',
  }
}
