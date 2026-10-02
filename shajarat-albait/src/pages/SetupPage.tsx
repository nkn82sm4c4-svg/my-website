import { ArrowLeft, RefreshCw, Shuffle } from 'lucide-react'
import { useState } from 'react'
import { Page } from '../components/layout/Page'
import { Button } from '../components/ui/Button'
import { Card, SectionTitle } from '../components/ui/Card'
import { Stepper } from '../components/ui/Stepper'
import { DEMO_SECONDS, GAME } from '../config/game'
import { cardById, randomCard } from '../data/cards'
import { rewardStatus } from '../game/rewards'
import { navigate } from '../hooks/useHashRoute'
import { minutesLabel, num } from '../lib/format'
import { joinCode } from '../lib/random'
import { useGame } from '../store/GameContext'
import type { DurationMin } from '../types'

function Field({ n, title, children, hint }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-forest font-display text-sm font-bold text-white">{num(n)}</span>
        <h2 className="text-lg font-bold text-forest">{title}</h2>
        {hint && <span className="ms-auto text-xs font-medium text-muted">{hint}</span>}
      </div>
      {children}
    </Card>
  )
}

export function SetupPage() {
  const { profile, settings, session, createSession, command } = useGame()
  const [familyName, setFamilyName] = useState(profile.familyName)
  const [code, setCode] = useState(joinCode)
  const [expected, setExpected] = useState<number>(GAME.defaultParticipants)
  const [duration, setDuration] = useState<DurationMin>(30)
  const [cardId, setCardId] = useState(() => randomCard().id)
  const openRewards = profile.rewards.filter((r) => !r.claimedAt)
  const [rewardId, setRewardId] = useState(() => (openRewards.some((r) => r.id === profile.goalRewardId) ? profile.goalRewardId : (openRewards[0]?.id ?? '')))
  const [touched, setTouched] = useState(false)
  const active = session && (session.status === 'running' || session.status === 'paused')
  const nameOk = familyName.trim().length >= 2

  const submit = () => {
    setTouched(true)
    if (!nameOk) return
    if (active) command({ type: 'cancel' })
    createSession({ familyName, durationMin: duration, expected, cardId, rewardId, code })
    navigate('lobby')
  }

  return (
    <Page className="max-w-3xl">
      <SectionTitle eyebrow="جلسة جديدة" title="إعداد الجلسة الأسرية" desc="اختاروا مدة الجلسة وبطاقة الحوار والمكافأة التي تعملون من أجلها، ثم شاركوا الرمز مع أفراد الأسرة." />

      {active && (
        <div className="mt-5 rounded-2xl border border-gold/40 bg-gold-soft/80 px-4 py-3 text-sm font-semibold text-wood-2">
          لديكم جلسة جارية. بدء جلسة جديدة سيُلغي الجلسة الحالية دون نقاط.{' '}
          <button className="underline" onClick={() => navigate('live')}>
            العودة إليها
          </button>
        </div>
      )}

      <div className="mt-6 grid gap-4">
        <Field n={1} title="اسم الأسرة">
          <input
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            placeholder="مثال: آل سالم"
            maxLength={30}
            aria-label="اسم الأسرة"
            aria-invalid={touched && !nameOk}
            className="h-14 w-full rounded-2xl border border-line bg-white/85 px-4 font-display text-lg text-ink outline-none transition placeholder:text-muted/70 focus:border-leaf-2 focus:ring-4 focus:ring-leaf-2/15"
          />
          {touched && !nameOk && <p className="mt-2 text-sm font-semibold text-rose">اكتبوا اسم الأسرة (حرفان على الأقل)</p>}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field n={2} title="رمز الانضمام">
            <div className="flex items-center justify-between gap-3">
              <span className="num font-display text-4xl font-bold tracking-[0.25em] text-forest" data-testid="setup-code" dir="ltr">
                {code}
              </span>
              <button onClick={() => setCode(joinCode())} className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-forest ring-1 ring-line active:rotate-180 transition" aria-label="توليد رمز جديد">
                <RefreshCw size={18} />
              </button>
            </div>
            <p className="mt-2 text-[13px] text-muted">يُولَّد تلقائيًا — شاركوه مع أفراد الأسرة</p>
          </Field>
          <Field n={3} title="عدد المشاركين">
            <div className="flex items-center justify-between gap-3">
              <Stepper value={expected} min={GAME.minParticipants} max={GAME.maxParticipants} onChange={setExpected} label="عدد المشاركين" />
              <span className="text-2xl" aria-hidden>
                {['👨', '👩', '👦', '👧'].slice(0, Math.min(expected, 4)).join('')}
              </span>
            </div>
          </Field>
        </div>

        <Field n={4} title="مدة الجلسة" hint={settings.demoMode ? '🧪 وضع العرض مفعّل' : undefined}>
          <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="مدة الجلسة">
            {GAME.durations.map((d) => {
              const sel = d === duration
              return (
                <button
                  key={d}
                  role="radio"
                  aria-checked={sel}
                  onClick={() => setDuration(d)}
                  className={`rounded-[22px] border-2 px-2 py-4 text-center transition ${sel ? 'border-leaf bg-gradient-to-b from-mint to-white shadow-lift' : 'border-transparent bg-white/70 hover:bg-white'}`}
                >
                  <span className="block font-display text-3xl font-bold text-forest">{num(d)}</span>
                  <span className="block text-sm font-semibold text-ink-soft">دقيقة</span>
                  {settings.demoMode && <span className="mt-1.5 inline-block rounded-full bg-gold-soft px-2 py-0.5 text-[11px] font-bold text-wood-2">Demo: {num(DEMO_SECONDS[d])} ث</span>}
                </button>
              )
            })}
          </div>
          <p className="mt-3 text-[13px] text-muted">
            {settings.demoMode ? `في وضع العرض تُختصر ${minutesLabel(duration)} إلى ${num(DEMO_SECONDS[duration])} ثانية فقط.` : `الجلسة ستستمر ${minutesLabel(duration)} فعلية.`}
          </p>
        </Field>

        <Field n={5} title="بطاقة الحوار العائلية">
          <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-forest to-forest-2 p-6 text-white">
            <span className="absolute -start-6 -top-6 text-8xl opacity-10" aria-hidden>
              💬
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{cardById(cardId).category}</span>
            <p className="mt-3 font-display text-xl font-semibold leading-relaxed sm:text-2xl" data-testid="setup-card">
              {cardById(cardId).text}
            </p>
          </div>
          <Button variant="ghost" className="mt-3" onClick={() => setCardId(randomCard([cardId]).id)} icon={<Shuffle size={18} />}>
            بطاقة عشوائية أخرى
          </Button>
        </Field>

        <Field n={6} title="مكافأة الأسرة" hint={`رصيدكم ${num(profile.totalPoints)} نقطة`}>
          {openRewards.length === 0 ? (
            <p className="text-sm text-muted">لا توجد مكافآت مفتوحة — أضيفوا مكافأة من صفحة المكافآت.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="radiogroup" aria-label="مكافأة الأسرة">
              {openRewards.map((r) => {
                const sel = r.id === rewardId
                const ready = rewardStatus(r, profile.totalPoints) === 'ready'
                return (
                  <button
                    key={r.id}
                    role="radio"
                    aria-checked={sel}
                    onClick={() => setRewardId(r.id)}
                    className={`rounded-[22px] border-2 p-4 text-center transition ${sel ? 'border-gold bg-gradient-to-b from-gold-soft to-white shadow-lift' : 'border-transparent bg-white/70 hover:bg-white'}`}
                  >
                    <span className="block text-4xl">{r.emoji}</span>
                    <span className="mt-2 block font-display font-semibold text-ink">{r.title}</span>
                    <span className="mt-1 block text-xs font-bold text-wood-2">{ready ? 'جاهزة 🎉' : `${num(r.points)} نقطة`}</span>
                  </button>
                )
              })}
            </div>
          )}
        </Field>
      </div>

      <div className="sticky bottom-3 z-10 mt-6">
        <Button size="xl" block onClick={submit} icon={<ArrowLeft size={22} />} className="flex-row-reverse" data-testid="create-session">
          ابدؤوا جلستكم الأسرية
        </Button>
      </div>
    </Page>
  )
}
