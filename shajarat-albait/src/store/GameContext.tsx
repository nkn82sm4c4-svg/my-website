import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import { randomCard } from '../data/cards'
import { sessionReducer, type SessionAction } from '../game/engine'
import * as family from '../services/familyService'
import { load, remove, save } from '../services/storage'
import type { DurationMin, FamilyProfile, LiveSession, Reward, SessionResult, Settings } from '../types'
import { useToast } from './ToastContext'

type Dist<T> = T extends unknown ? Omit<T, 'now'> : never
export type SessionCommand = Dist<Exclude<SessionAction, { type: 'create' | 'restore' }>>

interface GameApi {
  profile: FamilyProfile
  settings: Settings
  session: LiveSession | null
  lastResult: SessionResult | null
  setDemoMode: (on: boolean) => void
  setDetectLeaving: (on: boolean) => void
  createSession: (o: { familyName: string; durationMin: DurationMin; expected: number; cardId: string; rewardId: string; code?: string }) => void
  command: (c: SessionCommand) => void
  newCard: () => void
  discardSession: () => void
  addReward: (r: Omit<Reward, 'id' | 'custom'>) => void
  removeReward: (id: string) => void
  claimReward: (id: string) => void
  setGoal: (id: string) => void
  resetDemo: () => void
  resetEmpty: () => void
}

const Ctx = createContext<GameApi | null>(null)
const RESULT_KEY = 'last-result'

/** Restores a saved session; a running one comes back paused (time away is not counted) */
function restore(): LiveSession | null {
  const s = family.loadLiveSession()
  if (!s || s.status === 'completed' || s.status === 'cancelled') return null
  if (s.status === 'running') return { ...s, status: 'paused', tickAt: null }
  return s
}

export function GameProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast()
  const [profile, setProfile] = useState<FamilyProfile>(family.loadProfile)
  const [settings, setSettings] = useState<Settings>(family.loadSettings)
  const [session, dispatch] = useReducer(sessionReducer, null, restore)
  const [lastResult, setLastResult] = useState<SessionResult | null>(() => load<SessionResult | null>(RESULT_KEY, null))
  // Latest values for callbacks/listeners that must not re-subscribe on every tick
  const profileRef = useRef(profile)
  const sessionRef = useRef(session)
  useLayoutEffect(() => {
    profileRef.current = profile
    sessionRef.current = session
  }, [profile, session])

  // ── Clock: advance growth while the session runs ───────────────────────────
  const running = session?.status === 'running'
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => dispatch({ type: 'tick', now: Date.now() }), 200)
    return () => window.clearInterval(id)
  }, [running])

  // ── Persist the live session (growth ticks are throttled to 1/s) ───────────
  const lastSave = useRef({ at: 0, key: '' })
  useEffect(() => {
    if (!session || session.status === 'completed' || session.status === 'cancelled') {
      family.saveLiveSession(null)
      return
    }
    const key = `${session.status}|${session.participants.map((p) => p.status).join()}|${session.cardId}|${session.departures}`
    const now = Date.now()
    if (key !== lastSave.current.key || now - lastSave.current.at > 1000) {
      family.saveLiveSession(session)
      lastSave.current = { at: now, key }
    }
  }, [session])

  // ── Completion: award points, plant the tree, store the result (once) ──────
  const recorded = useRef<string | null>(null)
  useEffect(() => {
    if (session?.status !== 'completed' || recorded.current === session.id) return
    recorded.current = session.id
    if (profileRef.current.sessions.some((s) => s.id === session.id)) return
    const { profile: next, result } = family.recordCompletedSession(profileRef.current, session)
    setProfile(next)
    setLastResult(result)
    save(RESULT_KEY, result)
  }, [session])

  // ── Leaving detection: hiding the tab / switching apps = this member left ──
  const awayByVisibility = useRef<string | null>(null)
  useEffect(() => {
    if (!settings.detectLeaving) return
    const onVis = () => {
      const s = sessionRef.current
      if (!s || (s.status !== 'running' && s.status !== 'paused')) return
      const host = s.participants[0]
      if (!host) return
      if (document.hidden) {
        if (host.status === 'connected') {
          awayByVisibility.current = host.id
          dispatch({ type: 'leave', memberId: host.id, now: Date.now() })
        }
      } else if (awayByVisibility.current) {
        dispatch({ type: 'return', memberId: awayByVisibility.current, now: Date.now() })
        awayByVisibility.current = null
        toast(`عاد ${host.name} — شكرًا لالتزامكم 🌿`, 'success')
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [settings.detectLeaving, toast])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => {
      const next = { ...s, ...patch }
      family.saveSettings(next)
      return next
    })
  }, [])

  const withProfile = useCallback((fn: (p: FamilyProfile) => FamilyProfile) => setProfile(fn(profileRef.current)), [])

  const api = useMemo<GameApi>(
    () => ({
      profile,
      settings,
      session,
      lastResult,
      setDemoMode: (on) => updateSettings({ demoMode: on }),
      setDetectLeaving: (on) => updateSettings({ detectLeaving: on }),
      createSession: (o) => dispatch({ type: 'create', ...o, demo: settings.demoMode, now: Date.now() }),
      command: (c) => dispatch({ ...c, now: Date.now() } as SessionAction),
      newCard: () => {
        const s = sessionRef.current
        if (s) dispatch({ type: 'card', cardId: randomCard([...s.cardsUsed, s.cardId]).id, now: Date.now() })
      },
      discardSession: () => {
        dispatch({ type: 'restore', session: null })
        family.saveLiveSession(null)
      },
      addReward: (r) => withProfile((p) => family.addReward(p, r)),
      removeReward: (id) => withProfile((p) => family.removeReward(p, id)),
      claimReward: (id) => withProfile((p) => family.claimReward(p, id)),
      setGoal: (id) => withProfile((p) => family.setGoal(p, id)),
      resetDemo: () => {
        setProfile(family.resetToDemo())
        setLastResult(null)
        remove(RESULT_KEY)
      },
      resetEmpty: () => {
        setProfile(family.resetToEmpty(''))
        setLastResult(null)
        remove(RESULT_KEY)
      },
    }),
    [profile, settings, session, lastResult, updateSettings, withProfile],
  )

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useGame() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useGame outside GameProvider')
  return c
}

/** Re-renders on an interval — for countdowns that depend on wall-clock time */
export function useNow(active: boolean, ms = 250) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => setNow(Date.now()), ms)
    return () => window.clearInterval(id)
  }, [active, ms])
  return now
}
