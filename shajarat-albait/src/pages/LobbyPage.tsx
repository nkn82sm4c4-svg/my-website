import { Copy, LogIn, Play, Share2, UserPlus, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Page } from '../components/layout/Page'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { DEMO_SECONDS, GAME } from '../config/game'
import { AVATARS } from '../data/members'
import { cardById } from '../data/cards'
import { canStart, presentCount } from '../game/engine'
import { navigate } from '../hooks/useHashRoute'
import { minutesLabel, num } from '../lib/format'
import { useGame } from '../store/GameContext'
import { useToast } from '../store/ToastContext'
import { EmptySession } from './EmptySession'

export function LobbyPage() {
  const { session, command, profile } = useGame()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[0])
  const [joinInput, setJoinInput] = useState('')
  const [joinError, setJoinError] = useState(false)

  useEffect(() => {
    if (session && (session.status === 'running' || session.status === 'paused')) navigate('live')
  }, [session])

  if (!session || session.status !== 'lobby') return <EmptySession />

  const connected = presentCount(session)
  const reward = profile.rewards.find((r) => r.id === session.rewardId)
  const full = session.participants.length >= GAME.maxParticipants

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(session.code)
      toast('تم نسخ رمز الجلسة', 'success', '📋')
    } catch {
      toast(`رمز الجلسة: ${session.code}`, 'info')
    }
  }
  const share = async () => {
    const text = `انضموا إلى جلسة "شجرة البيت" لأسرة ${session.familyName} 🌱 — رمز الجلسة: ${session.code}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'شجرة البيت', text })
      } catch {
        /* cancelled */
      }
    } else copy()
  }
  const add = () => {
    if (!name.trim()) return
    command({ type: 'addMember', name, avatar })
    toast(`انضم ${name.trim()} إلى الجلسة`, 'success', avatar)
    setName('')
  }
  const joinByCode = () => {
    const waiting = session.participants.find((p) => p.status === 'waiting')
    if (joinInput.trim() !== session.code) {
      setJoinError(true)
      return
    }
    setJoinError(false)
    setJoinInput('')
    if (waiting) {
      command({ type: 'join', memberId: waiting.id })
      toast(`انضم ${waiting.name} بالرمز ${session.code}`, 'success', waiting.avatar)
    } else {
      command({ type: 'addMember', name: `فرد ${num(session.participants.length + 1)}`, avatar: '🧑' })
      toast('انضم فرد جديد بالرمز', 'success', '🧑')
    }
  }
  const start = () => {
    command({ type: 'start' })
    navigate('live')
  }

  return (
    <Page className="max-w-5xl">
      <div className="grid gap-5 lg:grid-cols-[1fr_1.25fr]">
        <div className="flex flex-col gap-5">
          <Card className="relative overflow-hidden p-7 text-center">
            <div className="absolute inset-x-0 -top-24 mx-auto h-48 w-48 rounded-full bg-sprout/30 blur-3xl" aria-hidden />
            <p className="relative font-display text-lg font-semibold text-ink-soft">رمز الجلسة</p>
            <p className="num relative mt-2 font-display text-7xl font-bold tracking-[0.18em] text-forest sm:text-8xl" dir="ltr" data-testid="lobby-code">
              {session.code}
            </p>
            <p className="relative mt-3 text-[15px] font-medium text-ink-soft">شارك الرمز مع أفراد أسرتك</p>
            <div className="relative mt-5 flex justify-center gap-2">
              <Button variant="secondary" onClick={copy} icon={<Copy size={17} />}>
                نسخ
              </Button>
              <Button variant="secondary" onClick={share} icon={<Share2 size={17} />}>
                مشاركة
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="flex items-center gap-2 font-bold text-forest">
              <LogIn size={18} /> الانضمام برمز
            </h3>
            <p className="mt-1 text-[13px] text-muted">جرّبوا كيف ينضم فرد من جهازه بإدخال الرمز</p>
            <div className="mt-3 flex gap-2">
              <input
                value={joinInput}
                onChange={(e) => {
                  setJoinInput(e.target.value.replace(/\D/g, '').slice(0, 4))
                  setJoinError(false)
                }}
                inputMode="numeric"
                placeholder="----"
                dir="ltr"
                aria-label="أدخل رمز الجلسة"
                className={`num h-12 w-full rounded-2xl border bg-white/85 px-4 text-center font-display text-xl tracking-[0.4em] outline-none focus:ring-4 ${joinError ? 'animate-shake border-rose ring-rose/15' : 'border-line focus:border-leaf-2 focus:ring-leaf-2/15'}`}
              />
              <Button onClick={joinByCode} disabled={joinInput.length !== 4}>
                انضمام
              </Button>
            </div>
            {joinError && <p className="mt-2 text-sm font-semibold text-rose">الرمز غير صحيح</p>}
          </Card>

          <Card className="p-5 text-[15px]">
            <dl className="grid gap-3">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">الأسرة</dt>
                <dd className="font-semibold text-forest">{session.familyName}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">المدة</dt>
                <dd className="font-semibold text-forest">
                  {minutesLabel(session.durationMin)}
                  {session.demo && <span className="ms-2 rounded-full bg-gold-soft px-2 py-0.5 text-xs text-wood-2">Demo {num(DEMO_SECONDS[session.durationMin])} ث</span>}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">المكافأة</dt>
                <dd className="font-semibold text-forest">
                  {reward ? `${reward.emoji} ${reward.title}` : '—'}
                </dd>
              </div>
              <div className="border-t border-forest/10 pt-3">
                <dt className="text-muted">بطاقة الحوار الأولى</dt>
                <dd className="mt-1 font-display font-semibold leading-relaxed text-forest">{cardById(session.cardId).text}</dd>
              </div>
            </dl>
          </Card>
        </div>

        <Card className="flex flex-col p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-xl font-bold text-forest">
              <Users size={22} /> المشاركون
            </h2>
            <span className="rounded-full bg-mint px-3 py-1 text-sm font-bold text-forest" data-testid="lobby-count">
              {num(connected)} / {num(session.participants.length)} متصل
            </span>
          </div>

          <ul className="mt-4 grid gap-2.5" data-testid="participants">
            {session.participants.map((p) => (
              <li key={p.id} className="flex animate-fade-up items-center gap-3 rounded-[20px] bg-white/75 p-3 ring-1 ring-white">
                <span className={`grid h-12 w-12 place-items-center rounded-2xl text-3xl ${p.status === 'connected' ? 'bg-mint' : 'bg-sand-2/70 grayscale-[0.6]'}`}>{p.avatar}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display font-semibold text-ink">{p.name}</p>
                  {p.status === 'connected' ? (
                    <p className="flex items-center gap-1.5 text-[13px] font-semibold text-leaf">
                      <span className="h-2 w-2 rounded-full bg-leaf-2" /> متصل
                    </p>
                  ) : (
                    <p className="flex items-center gap-1.5 text-[13px] font-medium text-muted">
                      <span className="h-2 w-2 animate-pulse-soft rounded-full bg-muted/60" /> بانتظار الانضمام
                    </p>
                  )}
                </div>
                {p.status === 'waiting' && (
                  <Button variant="secondary" className="!h-9 !rounded-xl !px-3 text-sm" onClick={() => command({ type: 'join', memberId: p.id })} aria-label={`انضمام ${p.name}`}>
                    انضمام
                  </Button>
                )}
                <button onClick={() => command({ type: 'removeMember', memberId: p.id })} className="grid h-9 w-9 place-items-center rounded-xl text-muted hover:bg-rose-soft hover:text-rose" aria-label={`إزالة ${p.name}`}>
                  <X size={18} />
                </button>
              </li>
            ))}
            {session.participants.length === 0 && <li className="rounded-2xl bg-white/50 p-6 text-center text-muted">أضيفوا أفراد الأسرة للبدء</li>}
          </ul>

          {session.participants.some((p) => p.status === 'waiting') && (
            <button onClick={() => command({ type: 'joinAll' })} className="mt-3 self-start text-sm font-semibold text-leaf underline-offset-4 hover:underline">
              محاكاة انضمام الجميع
            </button>
          )}

          <div className="mt-5 rounded-[22px] bg-sand/80 p-4">
            <p className="mb-3 flex items-center gap-2 font-semibold text-forest">
              <UserPlus size={18} /> إضافة فرد
            </p>
            <div className="mb-3 flex flex-wrap gap-1.5" role="radiogroup" aria-label="الصورة">
              {AVATARS.map((a) => (
                <button key={a} role="radio" aria-checked={a === avatar} onClick={() => setAvatar(a)} className={`grid h-10 w-10 place-items-center rounded-xl text-2xl transition ${a === avatar ? 'bg-white shadow ring-2 ring-leaf-2' : 'hover:bg-white/60'}`}>
                  {a}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && add()}
                placeholder="الاسم (مثال: سارة)"
                maxLength={20}
                aria-label="اسم الفرد"
                disabled={full}
                className="h-12 w-full rounded-2xl border border-line bg-white px-4 outline-none focus:border-leaf-2 focus:ring-4 focus:ring-leaf-2/15"
              />
              <Button onClick={add} disabled={!name.trim() || full}>
                إضافة
              </Button>
            </div>
            {full && <p className="mt-2 text-xs text-muted">الحد الأقصى {num(GAME.maxParticipants)} مشاركين</p>}
          </div>

          <div className="mt-auto pt-6">
            <Button size="xl" block disabled={!canStart(session)} onClick={start} icon={<Play size={22} fill="currentColor" />} data-testid="start-live">
              ابدؤوا الجلسة
            </Button>
            <p className="mt-2 text-center text-[13px] text-muted">
              {canStart(session) ? `ستبدأ الجلسة مع ${num(connected)} من أفراد الأسرة المتصلين` : 'يجب أن ينضم مشارك واحد على الأقل قبل البدء'}
            </p>
          </div>
        </Card>
      </div>
    </Page>
  )
}
