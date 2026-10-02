/** Domain model of "شجرة البيت". Shapes mirror what a future API would return. */

export type DurationMin = 15 | 30 | 45

export type MemberStatus = 'waiting' | 'connected' | 'away'

export interface Participant {
  id: string
  name: string
  avatar: string
  status: MemberStatus
  /** How many times this member left during the live session */
  departures: number
}

export interface DialogCard {
  id: string
  text: string
  category: 'ذكريات' | 'أحلام' | 'ضحك' | 'امتنان' | 'تعارف'
}

export interface Reward {
  id: string
  title: string
  emoji: string
  points: number
  custom?: boolean
  /** ISO date when the family claimed it */
  claimedAt?: string
}

export type TreeSpecies = 'oak' | 'pine' | 'blossom' | 'olive' | 'citrus'

/** A tree grown by one completed session — the unit of the family garden */
export interface TreeRecord {
  id: string
  sessionId: string
  species: TreeSpecies
  seed: number
  /** Perfect session (nobody left) → the tree bears fruit */
  perfect: boolean
  plantedAt: string
}

export interface SessionRecord {
  id: string
  familyName: string
  date: string
  durationMin: DurationMin
  demo: boolean
  participants: number
  points: number
  basePoints: number
  bonusPoints: number
  departures: number
  cardsUsed: number
  rewardId: string
}

export interface FamilyProfile {
  familyName: string
  totalPoints: number
  sessions: SessionRecord[]
  trees: TreeRecord[]
  rewards: Reward[]
  /** Reward chosen as the current family goal */
  goalRewardId: string
}

export interface Settings {
  demoMode: boolean
  /** Treat hiding the tab / switching apps as "leaving the session" */
  detectLeaving: boolean
}

export type SessionStatus = 'lobby' | 'running' | 'paused' | 'completed' | 'cancelled'

export interface SessionEvent {
  at: number
  type: 'start' | 'pause' | 'resume' | 'leave' | 'return' | 'card' | 'complete' | 'cancel' | 'join' | 'remove'
  memberId?: string
}

/** The session currently being set up or played on this device */
export interface LiveSession {
  id: string
  code: string
  familyName: string
  durationMin: DurationMin
  demo: boolean
  /** Real milliseconds of uninterrupted growth needed to finish */
  targetMs: number
  /** Growth time collected so far */
  growthMs: number
  /** Last time the clock was advanced while running (null when not running) */
  tickAt: number | null
  status: SessionStatus
  participants: Participant[]
  cardId: string
  cardsUsed: string[]
  rewardId: string
  /** Wall-clock time until which growth is frozen after someone left */
  penaltyUntil: number | null
  penaltyMs: number
  departures: number
  /** Fallen leaves (one per departure) — rendered by the tree */
  fallenLeaves: number
  species: TreeSpecies
  seed: number
  createdAt: number
  startedAt: number | null
  endedAt: number | null
  events: SessionEvent[]
}

/** What the result screen needs after a session ends */
export interface SessionResult {
  session: SessionRecord
  tree: TreeRecord
  previousPoints: number
  newPoints: number
}
