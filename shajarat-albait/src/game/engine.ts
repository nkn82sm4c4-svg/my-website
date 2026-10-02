import { GAME, sessionTargetMs } from '../config/game'
import { MEMBER_PRESETS } from '../data/members'
import { joinCode, randomSeed, uid } from '../lib/random'
import type { DurationMin, LiveSession, Participant, TreeSpecies } from '../types'

/**
 * The session state machine — pure functions with explicit `now`, so the
 * same logic can run on a server later (or be unit tested) without changes.
 *
 *   lobby ──start──▶ running ⇄ paused
 *                       │
 *                       ├─ growth reaches target ─▶ completed
 *                       └─ cancel ─────────────────▶ cancelled
 *
 * The tree only grows while: status is running, every participant is
 * present, and no departure penalty is active.
 */
export type SessionAction =
  | { type: 'create'; familyName: string; durationMin: DurationMin; demo: boolean; expected: number; cardId: string; rewardId: string; code?: string; now: number }
  | { type: 'join'; memberId: string; now: number }
  | { type: 'joinAll'; now: number }
  | { type: 'addMember'; name: string; avatar: string; now: number }
  | { type: 'removeMember'; memberId: string; now: number }
  | { type: 'start'; now: number }
  | { type: 'tick'; now: number }
  | { type: 'pause'; now: number }
  | { type: 'resume'; now: number }
  | { type: 'leave'; memberId: string; now: number }
  | { type: 'return'; memberId: string; now: number }
  | { type: 'card'; cardId: string; now: number }
  | { type: 'cancel'; now: number }
  | { type: 'restore'; session: LiveSession | null }

const SPECIES: TreeSpecies[] = ['oak', 'blossom', 'pine', 'olive', 'citrus']

export function createSession(a: Extract<SessionAction, { type: 'create' }>): LiveSession {
  const expected = Math.min(GAME.maxParticipants, Math.max(GAME.minParticipants, a.expected))
  const participants: Participant[] = Array.from({ length: expected }, (_, i) => {
    const preset = MEMBER_PRESETS[i % MEMBER_PRESETS.length]
    return { id: uid('m'), name: preset.name, avatar: preset.avatar, status: 'waiting', departures: 0 }
  })
  return {
    id: uid('s'),
    code: a.code && /^\d{4}$/.test(a.code) ? a.code : joinCode(),
    familyName: a.familyName.trim() || 'أسرتنا',
    durationMin: a.durationMin,
    demo: a.demo,
    targetMs: sessionTargetMs(a.durationMin, a.demo),
    growthMs: 0,
    tickAt: null,
    status: 'lobby',
    participants,
    cardId: a.cardId,
    cardsUsed: [a.cardId],
    rewardId: a.rewardId,
    penaltyUntil: null,
    penaltyMs: a.demo ? GAME.demoPenaltyMs : GAME.penaltyMs,
    departures: 0,
    fallenLeaves: 0,
    species: SPECIES[Math.floor(Math.random() * SPECIES.length)],
    seed: randomSeed(),
    createdAt: a.now,
    startedAt: null,
    endedAt: null,
    events: [],
  }
}

export const presentCount = (s: LiveSession) => s.participants.filter((p) => p.status === 'connected').length
export const canStart = (s: LiveSession) => s.status === 'lobby' && presentCount(s) >= GAME.minParticipants
export const progressOf = (s: LiveSession) => Math.min(1, s.growthMs / s.targetMs)
export const remainingMs = (s: LiveSession) => Math.max(0, s.targetMs - s.growthMs)
export const penaltyLeft = (s: LiveSession, now: number) => (s.penaltyUntil && s.penaltyUntil > now ? s.penaltyUntil - now : 0)

export type BlockReason = 'paused' | 'penalty' | 'away' | null

/** Why the tree is not growing right now (null = it is growing) */
export function blockReason(s: LiveSession, now: number): BlockReason {
  if (s.status === 'paused') return 'paused'
  if (penaltyLeft(s, now) > 0) return 'penalty'
  if (s.participants.some((p) => p.status === 'away')) return 'away'
  return null
}

export function sessionPoints(s: Pick<LiveSession, 'departures' | 'status'>) {
  const base = s.status === 'completed' ? GAME.basePoints : 0
  const bonus = s.status === 'completed' && s.departures === 0 ? GAME.perfectBonus : 0
  return { base, bonus, total: base + bonus }
}

/** Advances growth time up to `now` and completes the session at 100 % */
function advance(s: LiveSession, now: number): LiveSession {
  if (s.status !== 'running' || s.tickAt === null) return s
  const from = s.tickAt
  let gained = 0
  if (!s.participants.some((p) => p.status === 'away')) {
    // Only count the part of the interval after the penalty expired
    const growFrom = s.penaltyUntil ? Math.max(from, s.penaltyUntil) : from
    gained = Math.max(0, now - growFrom)
  }
  const growthMs = Math.min(s.targetMs, s.growthMs + gained)
  const penaltyUntil = s.penaltyUntil && s.penaltyUntil <= now ? null : s.penaltyUntil
  if (growthMs >= s.targetMs) {
    return { ...s, growthMs, penaltyUntil, tickAt: null, status: 'completed', endedAt: now, events: [...s.events, { at: now, type: 'complete' }] }
  }
  return { ...s, growthMs, penaltyUntil, tickAt: now }
}

const setMember = (s: LiveSession, id: string, patch: (p: Participant) => Participant) => ({
  ...s,
  participants: s.participants.map((p) => (p.id === id ? patch(p) : p)),
})

export function sessionReducer(s: LiveSession | null, a: SessionAction): LiveSession | null {
  if (a.type === 'create') return createSession(a)
  if (a.type === 'restore') return a.session
  if (!s) return s

  switch (a.type) {
    case 'join':
      if (s.status !== 'lobby') return s
      return { ...setMember(s, a.memberId, (p) => ({ ...p, status: 'connected' })), events: [...s.events, { at: a.now, type: 'join', memberId: a.memberId }] }
    case 'joinAll':
      if (s.status !== 'lobby') return s
      return { ...s, participants: s.participants.map((p) => ({ ...p, status: 'connected' })) }
    case 'addMember': {
      if (s.status !== 'lobby' || s.participants.length >= GAME.maxParticipants) return s
      const name = a.name.trim()
      if (!name) return s
      const m: Participant = { id: uid('m'), name, avatar: a.avatar, status: 'connected', departures: 0 }
      return { ...s, participants: [...s.participants, m], events: [...s.events, { at: a.now, type: 'join', memberId: m.id }] }
    }
    case 'removeMember':
      if (s.status !== 'lobby') return s
      return { ...s, participants: s.participants.filter((p) => p.id !== a.memberId), events: [...s.events, { at: a.now, type: 'remove', memberId: a.memberId }] }
    case 'start':
      if (!canStart(s)) return s
      return {
        ...s,
        status: 'running',
        // Members who never joined are not part of this session
        participants: s.participants.filter((p) => p.status === 'connected'),
        startedAt: a.now,
        tickAt: a.now,
        events: [...s.events, { at: a.now, type: 'start' }],
      }
    case 'tick':
      return advance(s, a.now)
    case 'pause': {
      if (s.status !== 'running') return s
      const t = advance(s, a.now)
      if (t.status !== 'running') return t
      return { ...t, status: 'paused', tickAt: null, events: [...t.events, { at: a.now, type: 'pause' }] }
    }
    case 'resume':
      if (s.status !== 'paused') return s
      return { ...s, status: 'running', tickAt: a.now, events: [...s.events, { at: a.now, type: 'resume' }] }
    case 'leave': {
      if (s.status !== 'running' && s.status !== 'paused') return s
      const m = s.participants.find((p) => p.id === a.memberId)
      if (!m || m.status !== 'connected') return s
      const t = advance(s, a.now)
      if (t.status === 'completed') return t
      return {
        ...setMember(t, a.memberId, (p) => ({ ...p, status: 'away', departures: p.departures + 1 })),
        departures: t.departures + 1,
        fallenLeaves: t.fallenLeaves + 1,
        penaltyUntil: a.now + t.penaltyMs,
        events: [...t.events, { at: a.now, type: 'leave', memberId: a.memberId }],
      }
    }
    case 'return': {
      const m = s.participants.find((p) => p.id === a.memberId)
      if (!m || m.status !== 'away') return s
      const t = advance(s, a.now)
      return { ...setMember(t, a.memberId, (p) => ({ ...p, status: 'connected' })), events: [...t.events, { at: a.now, type: 'return', memberId: a.memberId }] }
    }
    case 'card':
      return { ...s, cardId: a.cardId, cardsUsed: s.cardsUsed.includes(a.cardId) ? s.cardsUsed : [...s.cardsUsed, a.cardId], events: [...s.events, { at: a.now, type: 'card' }] }
    case 'cancel':
      if (s.status === 'completed') return s
      return { ...s, status: 'cancelled', tickAt: null, endedAt: a.now, events: [...s.events, { at: a.now, type: 'cancel' }] }
  }
}
