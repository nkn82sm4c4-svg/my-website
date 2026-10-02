import type { FamilyProfile } from '../types'

/** Garden statistics derived from the stored history */
export function familyStats(p: FamilyProfile) {
  const minutes = p.sessions.reduce((s, x) => s + x.durationMin, 0)
  const longest = p.sessions.reduce((m, x) => Math.max(m, x.durationMin), 0)
  const perfect = p.sessions.filter((s) => s.departures === 0).length
  return { trees: p.trees.length, points: p.totalPoints, sessions: p.sessions.length, minutes, longest, perfect }
}
