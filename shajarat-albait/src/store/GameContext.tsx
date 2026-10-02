import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import { randomCard } from '../data/cards'
import { joinCode } from '../lib/random'
import { sessionReducer, type SessionAction } from '../game/engine'
import * as cloudApi from '../services/cloud'
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
  /** online = other devices can join with the code */
  cloud: CloudState
  setDemoMode: (on: boolean) => void
  setDetectLeaving: (on: boolean) => void
  createSession: (o: { familyName: string; durationMin: DurationMin; expected: number; cardId: string; rewardId: string; code?: string }) => Promise<void>
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

export type CloudState = 'connecting' | 'online' | 'offline'
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

  // ── Cloud: sign in, sync the family profile ────────────────────────────────
  const [cloud, setCloud] = useState<CloudState>('connecting')
  useEffect(() => {
    let alive = true
    cloudApi.connect().then(async (uid) => {
      if (!alive) return
      if (!uid) return setCloud('offline')
      try {
        const remote = await cloudApi.loadProfile()
        if (!alive) return
        if (remote) {
          family.saveProfile(remote)
          setProfile(remote)
        } else await cloudApi.saveProfile(profileRef.current)
        setCloud('online')
      } catch (e) {
        console.warn('cloud sync failed', e)
        setCloud('offline')
      }
    })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (cloud !== 'online') return
    const t = setTimeout(() => cloudApi.saveProfile(profile).catch(() => {}), 800)
    return () => clearTimeout(t)
  }, [profile, cloud])

  // ── Cloud: publish the session so member devices can follow it ────────────
  const lastPublish = useRef({ at: 0, key: '' })
  useEffect(() => {
    if (cloud !== 'online' || !session) return
    const key = `${session.id}|${session.status}|${session.participants.map((p) => p.id + p.status).join()}|${session.cardId}|${session.penaltyUntil}`
    const now = Date.now()
    if (key !== lastPublish.current.key || now - lastPublish.current.at > 1000) {
      lastPublish.current = { at: now, key }
      cloudApi.publishSession(session).catch(() => {})
    }
  }, [session, cloud])

  // ── Cloud: members joining / leaving from their own devices ────────────────
  const removedRemote = useRef(new Set<string>())
  /** Members who joined from their own phones (their presence comes from the cloud) */
  const remoteIds = useRef(new Set<string>())
  const watchCode = session && (session.status === 'lobby' || session.status === 'running' || session.status === 'paused') ? session.code : null
  useEffect(() => {
    if (cloud !== 'online' || !watchCode) return
    let unsub: (() => void) | null = null
    let alive = true
    cloudApi
      .watchMembers(watchCode, (members) => {
        const s = sessionRef.current
        if (!s) return
        const now = Date.now()
        for (const m of members) {
          remoteIds.current.add(m.uid)
          if (removedRemote.current.has(m.uid)) continue
          const p = s.participants.find((x) => x.id === m.uid)
          if (s.status === 'lobby') {
            if (!p || p.status !== 'connected' || p.name !== m.name) {
              dispatch({ type: 'remoteJoin', memberId: m.uid, name: m.name, avatar: m.avatar, now })
              if (!p) toast(`انضم ${m.name} من جهازه`, 'success', m.avatar)
            }
          } else if (p) {
            if (m.status === 'away' && p.status === 'connected') dispatch({ type: 'leave', memberId: m.uid, now })
            if (m.status === 'connected' && p.status === 'away') {
              dispatch({ type: 'return', memberId: m.uid, now })
              toast(`عاد ${p.name} إلى الجلسة 🌿`, 'success')
            }
          }
        }
      })
      .then((u) => (alive ? (unsub = u) : u()))
      .catch(() => {})
    return () => {
      alive = false
      unsub?.()
    }
  }, [cloud, watchCode, toast])

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
      // This device speaks for the first member who did not join from a phone
      const host = s.participants.find((p) => !remoteIds.current.has(p.id))
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
      cloud,
      setDemoMode: (on) => updateSettings({ demoMode: on }),
      setDetectLeaving: (on) => updateSettings({ detectLeaving: on }),
      createSession: async (o) => {
        let code = o.code ?? joinCode()
        if (cloud === 'online') {
          // Avoid colliding with another family's active session
          for (let i = 0; i < 6; i++) {
            const free = await cloudApi.codeIsFree(code).catch(() => true)
            if (free) break
            code = joinCode()
          }
        }
        removedRemote.current.clear()
        dispatch({ type: 'create', ...o, code, demo: settings.demoMode, now: Date.now() })
      },
      command: (c) => {
        if (c.type === 'removeMember') removedRemote.current.add(c.memberId)
        dispatch({ ...c, now: Date.now() } as SessionAction)
      },
      newCard: () => {
        const s = sessionRef.current
        if (s) dispatch({ type: 'card', cardId: randomCard([...s.cardsUsed, s.cardId]).id, now: Date.now() })
      },
      discardSession: () => {
        const s = sessionRef.current
        // Tell member devices the session ended before forgetting it locally
        if (cloud === 'online' && s && s.status !== 'completed' && s.status !== 'cancelled') {
          cloudApi.publishSession({ ...s, status: 'cancelled', tickAt: null, endedAt: Date.now() }).catch(() => {})
        }
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
    [profile, settings, session, lastResult, cloud, updateSettings, withProfile, toast],
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
