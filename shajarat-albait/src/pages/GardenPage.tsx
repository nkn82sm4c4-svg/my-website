import { Database, Play, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Page } from '../components/layout/Page'
import { Garden3D, SPECIES_EMOJI } from '../components/tree/Garden3D'
import { AnimatedNumber } from '../components/ui/AnimatedNumber'
import { Button } from '../components/ui/Button'
import { Card, SectionTitle } from '../components/ui/Card'
import { Modal } from '../components/ui/Modal'
import { ProgressBar } from '../components/ui/ProgressBar'
import { GARDEN_LEVELS, gardenLevel } from '../config/game'
import { familyStats } from '../game/stats'
import { navigate } from '../hooks/useHashRoute'
import { dateLabel, minutesLabel, num, treesLabel } from '../lib/format'
import { useGame } from '../store/GameContext'
import { useToast } from '../store/ToastContext'

const SPECIES_NAME: Record<string, string> = { oak: 'بلوط', pine: 'صنوبر', blossom: 'كرز مزهر', olive: 'زيتون', citrus: 'برتقال' }

export function GardenPage() {
  const { profile, settings, setDetectLeaving, resetDemo, resetEmpty } = useGame()
  const { toast } = useToast()
  const [confirm, setConfirm] = useState<'demo' | 'empty' | null>(null)
  const st = familyStats(profile)
  const level = gardenLevel(st.trees)
  const prevMin = level.min
  const levelProgress = level.next ? (st.trees - prevMin) / (level.next - prevMin) : 1
  const nextLevel = GARDEN_LEVELS.find((l) => l.min === level.next)
  const sessionsById = new Map(profile.sessions.map((s) => [s.id, s]))

  const stats = [
    { label: 'عدد الأشجار', value: st.trees, icon: '🌳', testid: 'stat-trees' },
    { label: 'مجموع النقاط', value: st.points, icon: '⭐', testid: 'stat-points' },
    { label: 'عدد الجلسات', value: st.sessions, icon: '👨‍👩‍👧‍👦', testid: 'stat-sessions' },
    { label: 'إجمالي الدقائق', value: st.minutes, icon: '⏱️', testid: 'stat-minutes' },
    { label: 'أطول جلسة', value: st.longest, icon: '🏆', suffix: 'دقيقة', testid: 'stat-longest' },
  ]

  return (
    <Page>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionTitle eyebrow={`أسرة ${profile.familyName || 'البيت'}`} title="حديقة الأسرة" desc="كل جلسة مكتملة تضيف شجرة جديدة لحديقتكم. الأشجار المثمرة نمت في جلسات لم يغادرها أحد." />
        <Button onClick={() => navigate('setup')} icon={<Play size={18} fill="currentColor" />}>
          ازرعوا شجرة جديدة
        </Button>
      </div>

      <Card className="relative mt-6 overflow-hidden !rounded-[32px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgb(255_246_214/0.85),rgb(229_242_225/0.45)_55%,transparent_80%)]" />
        <Garden3D trees={profile.trees} className="h-[360px] sm:h-[480px] lg:h-[540px]" />
        <div className="glass absolute start-4 top-4 max-w-[75%] rounded-2xl px-4 py-3">
          <p className="font-display text-lg font-bold text-forest" data-testid="garden-level">
            {level.title}
          </p>
          <p className="text-xs text-ink-soft">{level.desc}</p>
        </div>
        {st.trees === 0 && (
          <div className="absolute inset-x-0 bottom-6 text-center">
            <span className="glass rounded-full px-4 py-2 text-sm font-semibold text-forest">الحديقة بانتظار أول شجرة 🌱</span>
          </div>
        )}
      </Card>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label} className="p-4 sm:p-5">
            <span className="text-2xl">{s.icon}</span>
            <p className="mt-2 font-display text-3xl font-bold text-forest" data-testid={s.testid}>
              <AnimatedNumber value={s.value} />
              {s.suffix && <span className="ms-1 text-sm font-semibold text-muted">{s.suffix}</span>}
            </p>
            <p className="text-sm text-ink-soft">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-forest">تطور الحديقة</h2>
          <span className="text-sm font-semibold text-wood-2">{nextLevel ? `${treesLabel(nextLevel.min - st.trees)} حتى «${nextLevel.title}»` : 'وصلتم لأعلى مستوى 🏆'}</span>
        </div>
        <ProgressBar value={levelProgress} className="mt-4" label="التقدم نحو المستوى التالي" />
        <ol className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {GARDEN_LEVELS.slice(1).map((l) => {
            const done = st.trees >= l.min
            return (
              <li key={l.min} className={`rounded-2xl p-3 text-center ring-1 ${done ? 'bg-mint ring-leaf-2/30' : 'bg-white/50 ring-white'}`}>
                <p className="text-2xl">{done ? '✅' : '🔒'}</p>
                <p className="mt-1 font-display font-semibold text-forest">{l.title}</p>
                <p className="text-xs text-muted">{treesLabel(l.min)}</p>
              </li>
            )
          })}
        </ol>
      </Card>

      <section className="mt-8">
        <h2 className="mb-4 text-xl font-bold text-forest">سجل الأشجار</h2>
        {profile.trees.length === 0 ? (
          <Card className="p-8 text-center text-ink-soft">لم تُزرع أي شجرة بعد. ابدؤوا جلستكم الأولى!</Card>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="tree-list">
            {[...profile.trees].reverse().map((t) => {
              const s = sessionsById.get(t.sessionId)
              return (
                <li key={t.id} className="glass flex items-center gap-3 rounded-[22px] p-3.5">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-b from-white to-mint text-3xl">{SPECIES_EMOJI[t.species]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-semibold text-ink">
                      شجرة {SPECIES_NAME[t.species]} {t.perfect && <span title="جلسة مثالية">🍎</span>}
                    </p>
                    <p className="text-xs text-muted">
                      {dateLabel(t.plantedAt)}
                      {s ? ` · ${minutesLabel(s.durationMin)} · ${num(s.participants)} أفراد` : ''}
                    </p>
                  </div>
                  <div className="text-end">
                    {s && <p className="font-display font-bold text-leaf">+{num(s.points)}</p>}
                    {s?.demo && <span className="rounded-full bg-gold-soft px-1.5 py-0.5 text-[10px] font-bold text-wood-2">Demo</span>}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <Card className="mt-8 p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-forest">
          <Database size={20} /> البيانات والإعدادات
        </h2>
        <p className="mt-1 text-sm text-muted">تُحفظ النقاط والجلسات والأشجار والمكافآت على هذا الجهاز (localStorage).</p>
        <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-2xl bg-white/60 p-4">
          <span>
            <span className="block font-semibold text-ink">احتساب الخروج من التطبيق كمغادرة</span>
            <span className="block text-[13px] text-muted">عند تبديل التطبيق أو إخفاء الصفحة أثناء الجلسة يتوقف النمو</span>
          </span>
          <input type="checkbox" checked={settings.detectLeaving} onChange={(e) => setDetectLeaving(e.target.checked)} className="h-6 w-6 accent-[#3f8a55]" />
        </label>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setConfirm('demo')} icon={<RotateCcw size={18} />}>
            استعادة البيانات التجريبية
          </Button>
          <Button variant="danger" onClick={() => setConfirm('empty')} icon={<Trash2 size={18} />}>
            البدء من الصفر
          </Button>
        </div>
      </Card>

      <Modal open={confirm !== null} onClose={() => setConfirm(null)} title={confirm === 'demo' ? 'استعادة البيانات التجريبية؟' : 'مسح كل البيانات؟'}>
        <p className="leading-7 text-ink-soft">
          {confirm === 'demo' ? 'ستُستبدل بياناتكم الحالية بأسرة تجريبية لديها ٦ أشجار و١٦٠ نقطة.' : 'ستُحذف كل الأشجار والنقاط والجلسات وتبدأ حديقة فارغة.'}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => setConfirm(null)}>
            إلغاء
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (confirm === 'demo') resetDemo()
              else resetEmpty()
              toast(confirm === 'demo' ? 'تمت استعادة البيانات التجريبية' : 'بدأت حديقة جديدة', 'success', '🌱')
              setConfirm(null)
            }}
          >
            تأكيد
          </Button>
        </div>
      </Modal>
    </Page>
  )
}
