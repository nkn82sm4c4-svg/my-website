import type { FamilyProfile, LiveSession, Reward, SessionResult, Settings, TreeRecord } from '../types'
import { uid } from '../lib/random'
import { createDemoProfile, createEmptyProfile } from './demoData'
import { load, remove, save } from './storage'
import { sessionPoints } from '../game/engine'

/**
 * The only layer that touches persistence. To move to a real backend,
 * replace these functions with fetch('/api/...') calls — components and the
 * game engine stay unchanged.
 */
const PROFILE = 'profile'
const SETTINGS = 'settings'
const LIVE = 'live-session'

export const DEFAULT_SETTINGS: Settings = { demoMode: true, detectLeaving: true }

export function loadProfile(): FamilyProfile {
  const p = load<FamilyProfile | null>(PROFILE, null)
  if (p && Array.isArray(p.sessions) && Array.isArray(p.rewards)) return p
  const demo = createDemoProfile()
  save(PROFILE, demo)
  return demo
}

export const saveProfile = (p: FamilyProfile) => save(PROFILE, p)

export const loadSettings = (): Settings => ({ ...DEFAULT_SETTINGS, ...load<Partial<Settings>>(SETTINGS, {}) })
export const saveSettings = (s: Settings) => save(SETTINGS, s)

export const loadLiveSession = () => load<LiveSession | null>(LIVE, null)
export function saveLiveSession(s: LiveSession | null) {
  if (s) save(LIVE, s)
  else remove(LIVE)
}

export const resetToDemo = (): FamilyProfile => {
  const p = createDemoProfile()
  saveProfile(p)
  return p
}

export const resetToEmpty = (familyName: string): FamilyProfile => {
  const p = createEmptyProfile(familyName)
  saveProfile(p)
  return p
}

/** Turns a completed live session into stored points, a session record and a tree */
export function recordCompletedSession(profile: FamilyProfile, s: LiveSession): { profile: FamilyProfile; result: SessionResult } {
  const pts = sessionPoints(s)
  const date = new Date(s.endedAt ?? Date.now()).toISOString()
  const session = {
    id: s.id,
    familyName: s.familyName,
    date,
    durationMin: s.durationMin,
    demo: s.demo,
    participants: s.participants.filter((p) => p.status !== 'waiting').length,
    points: pts.total,
    basePoints: pts.base,
    bonusPoints: pts.bonus,
    departures: s.departures,
    cardsUsed: s.cardsUsed.length,
    rewardId: s.rewardId,
  }
  const tree: TreeRecord = {
    id: uid('tree'),
    sessionId: s.id,
    species: s.species,
    seed: s.seed,
    perfect: pts.bonus > 0,
    plantedAt: date,
  }
  const next: FamilyProfile = {
    ...profile,
    familyName: s.familyName || profile.familyName,
    totalPoints: profile.totalPoints + pts.total,
    sessions: [...profile.sessions, session],
    trees: [...profile.trees, tree],
    goalRewardId: s.rewardId || profile.goalRewardId,
  }
  saveProfile(next)
  return { profile: next, result: { session, tree, previousPoints: profile.totalPoints, newPoints: next.totalPoints } }
}

export function addReward(profile: FamilyProfile, r: Omit<Reward, 'id' | 'custom'>): FamilyProfile {
  const next = { ...profile, rewards: [...profile.rewards, { ...r, id: uid('r'), custom: true }].sort((a, b) => a.points - b.points) }
  saveProfile(next)
  return next
}

export function removeReward(profile: FamilyProfile, id: string): FamilyProfile {
  const rewards = profile.rewards.filter((r) => r.id !== id)
  const goalRewardId = profile.goalRewardId === id ? (rewards[0]?.id ?? '') : profile.goalRewardId
  const next = { ...profile, rewards, goalRewardId }
  saveProfile(next)
  return next
}

export function claimReward(profile: FamilyProfile, id: string): FamilyProfile {
  const next = {
    ...profile,
    rewards: profile.rewards.map((r) => (r.id === id ? { ...r, claimedAt: new Date().toISOString() } : r)),
  }
  saveProfile(next)
  return next
}

export function setGoal(profile: FamilyProfile, id: string): FamilyProfile {
  const next = { ...profile, goalRewardId: id }
  saveProfile(next)
  return next
}
