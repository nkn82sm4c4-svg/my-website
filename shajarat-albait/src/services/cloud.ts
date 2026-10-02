import type { Unsubscribe } from 'firebase/firestore'
import { FIREBASE_CONFIG } from '../config/firebase'
import type { FamilyProfile, LiveSession } from '../types'

/**
 * Cloud layer (Firebase Auth + Firestore). Loaded lazily so the game starts
 * instantly; every call fails soft — without a connection the game keeps
 * working on this device only.
 *
 *   families/{uid}                 the family profile of a host device
 *   sessions/{code}                live session, written by its host
 *   sessions/{code}/members/{uid}  one doc per member device (presence)
 */

export type MemberPresence = 'connected' | 'away'
export interface MemberDoc {
  uid: string
  name: string
  avatar: string
  status: MemberPresence
}
export interface SessionDoc extends Omit<LiveSession, 'events'> {
  hostUid: string
  updatedAt: number
}

let fbPromise: Promise<Fb> | null = null
type Fb = Awaited<ReturnType<typeof boot>>

async function boot() {
  const [{ initializeApp }, auth, fs] = await Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/firestore')])
  const app = initializeApp(FIREBASE_CONFIG)
  const a = auth.getAuth(app)
  const db = fs.getFirestore(app)
  const user = a.currentUser ?? (await new Promise<import('firebase/auth').User | null>((res) => auth.onAuthStateChanged(a, res)))
  const uid = user?.uid ?? (await auth.signInAnonymously(a)).user.uid
  return { db, fs, uid }
}

function fb(): Promise<Fb> {
  fbPromise ??= boot().catch((e) => {
    fbPromise = null
    throw e
  })
  return fbPromise
}

/** Signs in anonymously; resolves to the device's uid or null when offline */
export async function connect(): Promise<string | null> {
  try {
    return (await fb()).uid
  } catch (e) {
    console.warn('cloud unavailable', e)
    return null
  }
}

// Firestore rejects `undefined` fields — strip them through JSON
const clean = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T

export async function loadProfile(): Promise<FamilyProfile | null> {
  const { db, fs, uid } = await fb()
  const snap = await fs.getDoc(fs.doc(db, 'families', uid))
  return snap.exists() ? (snap.data().profile as FamilyProfile) : null
}

export async function saveProfile(p: FamilyProfile) {
  const { db, fs, uid } = await fb()
  await fs.setDoc(fs.doc(db, 'families', uid), { profile: clean(p), updatedAt: Date.now() })
}

/** A code is free when no other host has an active session on it */
export async function codeIsFree(code: string): Promise<boolean> {
  const { db, fs, uid } = await fb()
  const snap = await fs.getDoc(fs.doc(db, 'sessions', code))
  if (!snap.exists()) return true
  const d = snap.data() as SessionDoc
  const active = d.status === 'lobby' || d.status === 'running' || d.status === 'paused'
  return d.hostUid === uid || !active || Date.now() - d.updatedAt > 6 * 3600_000
}

export async function publishSession(s: LiveSession) {
  const { db, fs, uid } = await fb()
  const { events: _events, ...rest } = s
  await fs.setDoc(fs.doc(db, 'sessions', s.code), clean({ ...rest, hostUid: uid, updatedAt: Date.now() }))
}

export async function watchMembers(code: string, cb: (members: MemberDoc[]) => void): Promise<Unsubscribe> {
  const { db, fs } = await fb()
  return fs.onSnapshot(fs.collection(db, 'sessions', code, 'members'), (snap) => cb(snap.docs.map((d) => ({ ...(d.data() as Omit<MemberDoc, 'uid'>), uid: d.id }))))
}

// ── Member device ──────────────────────────────────────────────────────────
export async function myUid() {
  return (await fb()).uid
}

export async function findSession(code: string): Promise<SessionDoc | null> {
  const { db, fs } = await fb()
  const snap = await fs.getDoc(fs.doc(db, 'sessions', code))
  return snap.exists() ? (snap.data() as SessionDoc) : null
}

export async function watchSession(code: string, cb: (s: SessionDoc | null) => void): Promise<Unsubscribe> {
  const { db, fs } = await fb()
  return fs.onSnapshot(fs.doc(db, 'sessions', code), (snap) => cb(snap.exists() ? (snap.data() as SessionDoc) : null))
}

export async function joinAsMember(code: string, name: string, avatar: string) {
  const { db, fs, uid } = await fb()
  await fs.setDoc(fs.doc(db, 'sessions', code, 'members', uid), { name, avatar, status: 'connected', updatedAt: Date.now() })
  return uid
}

export async function setPresence(code: string, status: MemberPresence) {
  const { db, fs, uid } = await fb()
  await fs.updateDoc(fs.doc(db, 'sessions', code, 'members', uid), { status, updatedAt: Date.now() })
}
