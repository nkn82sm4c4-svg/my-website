import type { DurationMin } from '../types'

/**
 * All game rules in one place. Change numbers here — UI and engine read them.
 */
export const GAME = {
  durations: [15, 30, 45] as DurationMin[],
  /** Points for finishing the session time */
  basePoints: 20,
  /** Extra points when nobody left the session */
  perfectBonus: 10,
  /** Growth is frozen for this long after a member leaves */
  penaltyMs: 30_000,
  /** In Demo mode the freeze is shortened so a 30 s demo stays playable */
  demoPenaltyMs: 6_000,
  minParticipants: 1,
  maxParticipants: 10,
  defaultParticipants: 4,
} as const

/** Demo mode: 15 min → 30 s, 30 min → 60 s, 45 min → 90 s */
export const DEMO_SECONDS: Record<DurationMin, number> = { 15: 30, 30: 60, 45: 90 }

export function sessionTargetMs(durationMin: DurationMin, demo: boolean): number {
  return demo ? DEMO_SECONDS[durationMin] * 1000 : durationMin * 60_000
}

/** Visual growth stages of the tree (fraction of the session) */
export const STAGES = [
  { at: 0, key: 'sprout', label: 'بذرة تنبت', emoji: '🌱' },
  { at: 0.25, key: 'branches', label: 'ظهرت الأغصان', emoji: '🌿' },
  { at: 0.5, key: 'leaves', label: 'أوراق كثيرة', emoji: '🍃' },
  { at: 0.75, key: 'big', label: 'الشجرة تكبر', emoji: '🌳' },
  { at: 1, key: 'complete', label: 'اكتملت الشجرة', emoji: '✨' },
] as const

export function stageFor(progress: number) {
  let current: (typeof STAGES)[number] = STAGES[0]
  for (const s of STAGES) if (progress >= s.at) current = s
  return current
}

/** Garden levels — the garden scene evolves as trees accumulate */
export const GARDEN_LEVELS = [
  { min: 0, title: 'أرض جديدة', desc: 'ازرعوا أول شجرة في حديقتكم', next: 1 },
  { min: 1, title: 'بستان ناشئ', desc: 'بداية جميلة — استمروا!', next: 10 },
  { min: 10, title: 'حديقة صغيرة', desc: 'ظهرت الأزهار والممرات', next: 25 },
  { min: 25, title: 'حديقة جميلة', desc: 'بركة ماء ومقعد للعائلة', next: 50 },
  { min: 50, title: 'حديقة كبيرة', desc: 'غابة الأسرة مكتملة', next: null },
] as const

export function gardenLevel(trees: number) {
  let lvl: (typeof GARDEN_LEVELS)[number] = GARDEN_LEVELS[0]
  for (const l of GARDEN_LEVELS) if (trees >= l.min) lvl = l
  return lvl
}
