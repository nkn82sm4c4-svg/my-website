import { LogIn, WifiOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Page } from '../components/layout/Page'
import { Tree3D } from '../components/tree/Tree3D'
import { Button } from '../components/ui/Button'
import { Card, SectionTitle } from '../components/ui/Card'
import { ProgressBar } from '../components/ui/ProgressBar'
import { stageFor } from '../config/game'
import { cardById } from '../data/cards'
import { AVATARS } from '../data/members'
import { blockReason, sessionPoints } from '../game/engine'
import { hashParam, navigate } from '../hooks/useHashRoute'
import { useWakeLock } from '../hooks/useWakeLock'
import { clock, num } from '../lib/format'
import * as cloud from '../services/cloud'
import { load, remove, save } from '../services/storage'
import { useGame, useNow } from '../store/GameContext'

/**
 * A family member's own phone: join with the code, then follow the shared
 * tree. Leaving this page (switching apps, locking into another app) marks
 * the member as away and freezes the family's tree.
 */
const MEMBER_KEY = 'member'
interface Membership {
  code: string
  name: string
  avatar: string
}

export function JoinPage() {
  const { cloud: cloudState } = useGame()
  const [membership, setMembership] = useState<Membership | null>(() => {
    const m = load<Membership | null>(MEMBER_KEY, null)
    const fromLink = hashParam()
    return m && (!fromLink || fromLink === m.code) ? m : null
  })

  if (cloudState === 'offline') {
    return (
      <Page className="max-w-md">
        <Card className="p-8 text-center">
          <WifiOff className="mx-auto text-muted" size={40} />
          <h1 className="mt-4 text-xl font-bold text-forest">لا يوجد اتصال بالإنترنت</h1>
          <p className="mt-2 text-ink-soft">الانضمام من جهاز آخر يحتاج اتصالًا. تأكد من الإنترنت ثم أعد تحميل الصفحة.</p>
        </Card>
      </Page>
    )
  }

  if (!membership)
    return (
      <JoinForm
        onJoined={(m) => {
          save(MEMBER_KEY, m)
          setMembership(m)
        }}
      />
    )
  return (
    <MemberView
      membership={membership}
      onLeave={() => {
        remove(MEMBER_KEY)
        setMembership(null)
      }}
    />
  )
}

function JoinForm({ onJoined }: { onJoined: (m: Membership) => void }) {
  const [code, setCode] = useState(hashParam().replace(/\D/g, '').slice(0, 4))
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[2])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (busy) return
    setError('')
    if (code.length !== 4) return setError('رمز الجلسة من 4 أرقام')
    if (name.trim().length < 2) return setError('اكتب اسمك (حرفان على الأقل)')
    setBusy(true)
    try {
      const s = await cloud.findSession(code)
      if (!s || s.status === 'cancelled') setError('لا توجد جلسة بهذا الرمز. تأكد من الرمز مع صاحب الجلسة.')
      else if (s.status === 'completed') setError('هذه الجلسة انتهت.')
      else {
        const uid = await cloud.myUid()
        if (s.status !== 'lobby' && !s.participants.some((p) => p.id === uid)) setError('بدأت الجلسة بالفعل، لا يمكن الانضمام الآن.')
        else {
          await cloud.joinAsMember(code, name.trim(), avatar)
          onJoined({ code, name: name.trim(), avatar })
        }
      }
    } catch (e) {
      console.warn(e)
      setError('تعذر الاتصال. حاول مرة أخرى.')
    }
    setBusy(false)
  }

  return (
    <Page className="max-w-md">
      <SectionTitle eyebrow="من جوالك" title="الانضمام إلى جلسة" desc="أدخل الرمز الذي يظهر على جهاز الأسرة، ثم اكتب اسمك." />
      <Card className="mt-6 grid gap-5 p-6">
        <div>
          <label htmlFor="jn-code" className="text-sm font-semibold text-ink-soft">
            رمز الجلسة
          </label>
          <input
            id="jn-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
            inputMode="numeric"
            dir="ltr"
            placeholder="----"
            className="num mt-1.5 h-16 w-full rounded-2xl border border-line bg-white/85 text-center font-display text-4xl font-bold tracking-[0.4em] text-forest outline-none focus:border-leaf-2 focus:ring-4 focus:ring-leaf-2/15"
          />
        </div>
        <div>
          <label htmlFor="jn-name" className="text-sm font-semibold text-ink-soft">
            اسمك
          </label>
          <input
            id="jn-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            placeholder="مثال: سارة"
            className="mt-1.5 h-12 w-full rounded-2xl border border-line bg-white/85 px-4 outline-none focus:border-leaf-2 focus:ring-4 focus:ring-leaf-2/15"
          />
        </div>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="الصورة">
          {AVATARS.map((a) => (
            <button key={a} role="radio" aria-checked={a === avatar} onClick={() => setAvatar(a)} className={`grid h-11 w-11 place-items-center rounded-xl text-2xl transition ${a === avatar ? 'bg-white shadow ring-2 ring-leaf-2' : 'hover:bg-white/60'}`}>
              {a}
            </button>
          ))}
        </div>
        {error && <p className="rounded-2xl bg-rose-soft px-4 py-3 text-sm font-semibold text-rose">{error}</p>}
        <Button size="lg" block onClick={submit} disabled={busy} icon={<LogIn size={20} />}>
          {busy ? 'جارٍ الانضمام…' : 'انضمام'}
        </Button>
      </Card>
    </Page>
  )
}

function MemberView({ membership, onLeave }: { membership: Membership; onLeave: () => void }) {
  const [s, setS] = useState<cloud.SessionDoc | null | undefined>(undefined)
  const received = useRef(Date.now())
  const now = useNow(true, 250)
  const active = s?.status === 'running' || s?.status === 'paused'
  useWakeLock(active)
  const [uid, setUid] = useState<string | null>(null)

  useEffect(() => {
    let unsub: (() => void) | null = null
    let alive = true
    cloud.myUid().then(setUid).catch(() => {})
    cloud
      .watchSession(membership.code, (doc) => {
        received.current = Date.now()
        setS(doc)
      })
      .then((u) => (alive ? (unsub = u) : u()))
      .catch(() => setS(null))
    return () => {
      alive = false
      unsub?.()
    }
  }, [membership.code])

  // Presence: leaving this page = leaving the family session
  useEffect(() => {
    const set = (st: cloud.MemberPresence) => cloud.setPresence(membership.code, st).catch(() => {})
    const onVis = () => set(document.hidden ? 'away' : 'connected')
    const onHide = () => set('away')
    set('connected')
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('pagehide', onHide)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('pagehide', onHide)
    }
  }, [membership.code])

  if (s === undefined)
    return (
      <Page className="max-w-md">
        <Card className="p-8 text-center text-ink-soft">
          <span className="block animate-float text-5xl">🌱</span>
          <p className="mt-3">جارٍ الاتصال بالجلسة…</p>
        </Card>
      </Page>
    )

  if (s === null || s.status === 'cancelled' || s.status === 'completed') {
    const pts = s ? sessionPoints(s) : null
    return (
      <Page className="max-w-md">
        <Card className="p-8 text-center">
          <span className="text-6xl">{s?.status === 'completed' ? '🌳' : '🍃'}</span>
          <h1 className="mt-4 text-2xl font-bold text-forest">{s?.status === 'completed' ? `أحسنتم يا أسرة ${s.familyName} ❤️` : 'انتهت الجلسة'}</h1>
          {s?.status === 'completed' && pts && <p className="mt-2 text-lg font-semibold text-leaf">نمت شجرة جديدة · +{num(pts.total)} نقطة</p>}
          <Button
            className="mt-6"
            onClick={() => {
              onLeave()
              navigate('home')
            }}
          >
            العودة للرئيسية
          </Button>
        </Card>
      </Page>
    )
  }

  const me = s.participants.find((p) => p.id === uid)
  const reason = blockReason(s, now)
  const growing = s.status === 'running' && !reason
  const growthMs = Math.min(s.targetMs, s.growthMs + (growing ? now - received.current : 0))
  const progress = growthMs / s.targetMs
  const stage = stageFor(progress)

  return (
    <Page className="max-w-md !pt-4">
      <Card className="flex items-center justify-between gap-3 px-5 py-4">
        <div>
          <p className="text-xs text-muted">أسرة {s.familyName}</p>
          <p className="flex items-center gap-2 font-display font-bold text-forest">
            <span className="text-2xl">{membership.avatar}</span> {membership.name}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-bold ${me ? 'bg-mint text-forest' : 'bg-sand-2 text-ink-soft'}`}>{me ? '● متصل' : 'بانتظار الانضمام…'}</span>
      </Card>

      {s.status === 'lobby' ? (
        <Card className="mt-4 p-8 text-center">
          <span className="block animate-sway text-6xl">🌱</span>
          <h1 className="mt-4 text-xl font-bold text-forest">انضممت إلى الجلسة</h1>
          <p className="mt-2 text-ink-soft">بانتظار بدء الجلسة من جهاز الأسرة… ({num(s.participants.filter((p) => p.status === 'connected').length)} متصلون)</p>
        </Card>
      ) : (
        <>
          <Card className="mt-4 p-4 text-center">
            <p className="text-xs text-muted">الوقت المتبقي</p>
            <p className="num font-display text-5xl font-bold text-forest" dir="ltr">
              {clock(s.targetMs - growthMs)}
            </p>
          </Card>
          <Card className="relative mt-4 overflow-hidden !rounded-[32px]">
            <Tree3D species={s.species} seed={s.seed} growth={progress} blocked={!!reason} leafDrops={s.fallenLeaves} className="h-[320px]" />
            <span className="glass absolute start-3 top-3 rounded-full px-3 py-1 text-sm font-semibold text-forest">
              {stage.emoji} {stage.label}
            </span>
            {reason && (
              <div className="glass absolute inset-x-3 bottom-3 rounded-2xl !bg-white/90 px-4 py-3 text-center text-sm font-bold text-rose">
                {reason === 'paused' ? 'الجلسة متوقفة مؤقتًا' : 'غادر أحد أفراد الأسرة الجلسة — توقف النمو'}
              </div>
            )}
          </Card>
          <ProgressBar value={progress} marks={[0.25, 0.5, 0.75]} className="mt-4" label="تقدم الجلسة" />
          <div className="mt-4 rounded-[28px] bg-gradient-to-br from-forest to-forest-2 p-6 text-white">
            <p className="text-xs text-white/70">بطاقة الحوار</p>
            <p className="mt-2 font-display text-xl font-semibold leading-relaxed">{cardById(s.cardId).text}</p>
          </div>
          <p className="mt-4 text-center text-sm text-ink-soft">📵 اترك هذه الصفحة مفتوحة وضع الجوال جانبًا. الخروج منها يوقف نمو شجرة الأسرة.</p>
        </>
      )}
    </Page>
  )
}
