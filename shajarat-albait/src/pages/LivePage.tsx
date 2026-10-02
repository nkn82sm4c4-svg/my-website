import { DoorOpen, Pause, Play, RotateCcw, Shuffle, Square, Undo2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Page } from '../components/layout/Page'
import { Tree3D } from '../components/tree/Tree3D'
import { AnimatedNumber } from '../components/ui/AnimatedNumber'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Modal } from '../components/ui/Modal'
import { ProgressBar } from '../components/ui/ProgressBar'
import { DEMO_SECONDS, GAME, STAGES, stageFor } from '../config/game'
import { cardById } from '../data/cards'
import { blockReason, penaltyLeft, presentCount, progressOf, remainingMs } from '../game/engine'
import { navigate } from '../hooks/useHashRoute'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useWakeLock } from '../hooks/useWakeLock'
import { clock, num } from '../lib/format'
import { useGame, useNow } from '../store/GameContext'
import { useToast } from '../store/ToastContext'
import { EmptySession } from './EmptySession'

export function LivePage() {
  const { session, command, newCard, discardSession } = useGame()
  const { toast } = useToast()
  const now = useNow(true, 250)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [alertKey, setAlertKey] = useState(0)
  const [cardAnim, setCardAnim] = useState(0)
  const live = session && (session.status === 'running' || session.status === 'paused')
  useWakeLock(!!live)
  // The dialog card sits under the tree on phones and in the side column on desktop
  const wide = useMediaQuery('(min-width: 1024px)')

  // Someone left → alert + a leaf falls (the scene reacts to fallenLeaves)
  const departures = useRef(session?.departures ?? 0)
  useEffect(() => {
    if (!session) return
    if (session.departures > departures.current) {
      setAlertKey((k) => k + 1)
      toast('غادر أحد أفراد الأسرة الجلسة', 'warn', '🍂')
      navigator.vibrate?.(200)
    }
    departures.current = session.departures
  }, [session, toast])

  // Completed → result screen (after the tree reaches 100 %)
  useEffect(() => {
    if (session?.status !== 'completed') return
    const t = setTimeout(() => navigate('result'), 900)
    return () => clearTimeout(t)
  }, [session?.status])

  const onMilestone = useCallback(
    (q: number) => {
      const st = STAGES[Math.min(q, STAGES.length - 1)]
      if (q > 0 && q < 4) toast(`${st.emoji} ${st.label}`, 'success')
    },
    [toast],
  )

  useEffect(() => {
    if (session?.status === 'lobby') navigate('lobby')
  }, [session?.status])

  if (!session || session.status === 'lobby' || session.status === 'cancelled') return <EmptySession />

  const progress = progressOf(session)
  const stage = stageFor(progress)
  const reason = session.status === 'completed' ? null : blockReason(session, now)
  const penalty = penaltyLeft(session, now)
  const present = presentCount(session)
  const away = session.participants.filter((p) => p.status === 'away')
  const perfect = session.departures === 0
  const potential = GAME.basePoints + (perfect ? GAME.perfectBonus : 0)
  const livePoints = Math.floor(progress * potential)
  const card = cardById(session.cardId)

  const dialogCard = (
    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-forest to-forest-2 p-6 text-white shadow-lift">
      <span className="absolute -end-4 -top-8 text-[120px] opacity-10" aria-hidden>
        💬
      </span>
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">بطاقة الحوار · {card.category}</span>
        <span className="text-xs text-white/60">{num(session.cardsUsed.length)} بطاقات</span>
      </div>
      <p key={cardAnim} className="mt-4 min-h-[84px] animate-fade-up font-display text-xl font-semibold leading-relaxed sm:text-2xl" data-testid="live-card">
        {card.text}
      </p>
      <button
        onClick={() => {
          newCard()
          setCardAnim((k) => k + 1)
        }}
        className="mt-4 inline-flex h-11 items-center gap-2 rounded-2xl bg-white/15 px-4 font-semibold transition hover:bg-white/25 active:scale-95"
      >
        <Shuffle size={17} /> بطاقة جديدة
      </button>
    </div>
  )

  return (
    <Page className="max-w-6xl !pt-4 sm:!pt-6">
      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr] lg:gap-6">
        {/* ── Tree column ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <Card className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${reason ? 'bg-gold' : 'animate-pulse-soft bg-leaf-2'}`} />
              <span className="font-display font-bold text-forest">الجلسة الآن</span>
              {session.demo && <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[11px] font-bold text-wood-2">Demo</span>}
            </div>
            <div className="text-center">
              <p className="text-xs text-muted">الوقت المتبقي</p>
              <p className="num font-display text-4xl font-bold text-forest sm:text-5xl" data-testid="timer" dir="ltr">
                {clock(remainingMs(session))}
              </p>
            </div>
            <div className="ms-auto text-end">
              <p className="font-display text-lg font-bold text-forest" data-testid="present-count">
                {num(present)} / {num(session.participants.length)} أفراد متصلون
              </p>
              <p className="text-xs text-muted">
                أسرة {session.familyName} · {num(session.durationMin)} دقيقة{session.demo ? ` (Demo ${num(DEMO_SECONDS[session.durationMin])} ث)` : ''}
              </p>
            </div>
          </Card>

          <Card className="relative overflow-hidden !rounded-[32px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgb(255_246_214/0.9),rgb(229_242_225/0.5)_50%,transparent_75%)]" />
            <Tree3D
              species={session.species}
              seed={session.seed}
              growth={progress}
              fruit={session.status === 'completed' && session.departures === 0 ? 1 : 0}
              blocked={!!reason}
              leafDrops={session.fallenLeaves}
              celebrate={session.status === 'completed' ? 1 : 0}
              onMilestone={onMilestone}
              className="h-[340px] sm:h-[440px] lg:h-[500px]"
            />
            <div className="absolute start-4 top-4 flex flex-col gap-2">
              <span className="glass animate-pop rounded-full px-3.5 py-1.5 text-sm font-semibold text-forest" key={stage.key} data-testid="stage">
                {stage.emoji} {stage.label}
              </span>
            </div>
            <div className="glass absolute end-4 top-4 rounded-2xl px-4 py-2 text-center">
              <p className="text-[11px] text-muted">نقاط الجلسة</p>
              <p className="font-display text-2xl font-bold text-forest">
                ⭐ <AnimatedNumber value={livePoints} duration={400} />
              </p>
            </div>

            {reason && session.status !== 'completed' && (
              <div className="absolute inset-x-4 bottom-4 flex justify-center">
                <div key={alertKey} className={`glass flex max-w-md items-center gap-3 rounded-2xl !bg-white/90 px-4 py-3 ${reason === 'penalty' ? 'animate-shake' : 'animate-fade-up'}`} role="alert" data-testid="block-alert">
                  <span className="text-2xl">{reason === 'paused' ? '⏸️' : '🍂'}</span>
                  <div className="text-sm">
                    {reason === 'paused' && <p className="font-bold text-forest">الجلسة متوقفة مؤقتًا</p>}
                    {reason === 'penalty' && (
                      <>
                        <p className="font-bold text-rose">غادر أحد أفراد الأسرة الجلسة</p>
                        <p className="text-ink-soft">
                          توقف نمو الشجرة مؤقتًا · <span className="num font-bold" dir="ltr">{clock(penalty)}</span>
                        </p>
                      </>
                    )}
                    {reason === 'away' && (
                      <>
                        <p className="font-bold text-rose">بانتظار عودة {away.map((a) => a.name).join('، ')}</p>
                        <p className="text-ink-soft">سيستمر النمو عند عودة الجميع</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>

          <div className="px-1">
            <ProgressBar value={progress} marks={[0.25, 0.5, 0.75]} label="تقدم الجلسة" />
            <div className="mt-2 grid grid-cols-5 text-center text-[11px] font-semibold text-muted sm:text-xs">
              {STAGES.map((s) => (
                <span key={s.key} className={progress >= s.at ? 'text-forest' : ''}>
                  {s.emoji}
                  <span className="hidden sm:inline"> {s.label}</span>
                </span>
              ))}
            </div>
          </div>
          {!wide && dialogCard}
        </div>

        {/* ── Side column ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {wide && dialogCard}

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-forest">أفراد الأسرة</h2>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${perfect ? 'bg-mint text-forest' : 'bg-rose-soft text-rose'}`}>{perfect ? `مكافأة الالتزام +${num(GAME.perfectBonus)} ✓` : 'فُقدت مكافأة الالتزام'}</span>
            </div>
            <ul className="grid gap-2" data-testid="live-members">
              {session.participants.map((p) => (
                <li key={p.id} className={`flex items-center gap-3 rounded-2xl p-2.5 transition ${p.status === 'away' ? 'bg-rose-soft/70' : 'bg-white/70'}`}>
                  <span className={`grid h-10 w-10 place-items-center rounded-xl text-2xl ${p.status === 'away' ? 'grayscale' : 'bg-mint'}`}>{p.avatar}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{p.name}</p>
                    <p className={`flex items-center gap-1.5 text-xs font-semibold ${p.status === 'away' ? 'text-rose' : 'text-leaf'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${p.status === 'away' ? 'bg-rose' : 'bg-leaf-2'}`} />
                      {p.status === 'away' ? 'غادر الجلسة' : 'متصل'}
                    </p>
                  </div>
                  {session.status !== 'completed' &&
                    (p.status === 'away' ? (
                      <button onClick={() => command({ type: 'return', memberId: p.id })} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-forest px-3 text-xs font-semibold text-white" aria-label={`عودة ${p.name}`}>
                        <Undo2 size={14} /> عاد
                      </button>
                    ) : (
                      <button onClick={() => command({ type: 'leave', memberId: p.id })} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-white px-3 text-xs font-semibold text-ink-soft ring-1 ring-line hover:text-rose" aria-label={`محاكاة مغادرة ${p.name}`}>
                        <DoorOpen size={14} /> مغادرة
                      </button>
                    ))}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[12px] leading-5 text-muted">زر "مغادرة" يحاكي خروج الفرد من التطبيق. الخروج من هذه الصفحة أو تبديل التطبيق يُحتسب مغادرة أيضًا.</p>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            {session.status === 'paused' ? (
              <Button size="lg" onClick={() => command({ type: 'resume' })} icon={<Play size={20} fill="currentColor" />} data-testid="resume">
                استئناف
              </Button>
            ) : (
              <Button variant="wood" size="lg" onClick={() => command({ type: 'pause' })} disabled={session.status !== 'running'} icon={<Pause size={20} />} data-testid="pause">
                إيقاف مؤقت
              </Button>
            )}
            <Button variant="danger" size="lg" onClick={() => setConfirmEnd(true)} disabled={session.status === 'completed'} icon={<Square size={18} />}>
              إنهاء الجلسة
            </Button>
          </div>
        </div>
      </div>

      <Modal open={confirmEnd} onClose={() => setConfirmEnd(false)} title="إنهاء الجلسة؟">
        <p className="leading-7 text-ink-soft">إذا أنهيتم الجلسة الآن لن تكتمل الشجرة ولن تحصلوا على نقاط هذه الجلسة. هل أنتم متأكدون؟</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button onClick={() => setConfirmEnd(false)} icon={<RotateCcw size={18} />}>
            متابعة الجلسة
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              command({ type: 'cancel' })
              discardSession()
              setConfirmEnd(false)
              toast('تم إنهاء الجلسة دون نقاط', 'info', '🍃')
              navigate('home')
            }}
          >
            إنهاء دون نقاط
          </Button>
        </div>
      </Modal>
    </Page>
  )
}
