import { BookOpen, Play, Sprout, Trees } from 'lucide-react'
import { DemoSwitch } from '../components/layout/DemoSwitch'
import { Page } from '../components/layout/Page'
import { Tree3D } from '../components/tree/Tree3D'
import { AnimatedNumber } from '../components/ui/AnimatedNumber'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ProgressBar } from '../components/ui/ProgressBar'
import { navigate } from '../hooks/useHashRoute'
import { num, pointsCount } from '../lib/format'
import { nextReward } from '../game/rewards'
import { useGame } from '../store/GameContext'

const FEATURES = [
  { icon: '📵', title: 'ضعوا الهواتف جانبًا', text: 'جلسة قصيرة يلتزم فيها الجميع بالبقاء معًا دون انشغال بالشاشات.' },
  { icon: '💬', title: 'تحدثوا من القلب', text: 'بطاقات حوار عائلية تفتح أحاديث جميلة وذكريات لا تُنسى.' },
  { icon: '🌳', title: 'ازرعوا حديقتكم', text: 'كل جلسة مكتملة تنبت شجرة جديدة وتمنحكم نقاطًا ومكافآت حقيقية.' },
]

export function HomePage() {
  const { profile, session } = useGame()
  const active = session && (session.status === 'running' || session.status === 'paused')
  const goal = nextReward(profile)

  return (
    <Page>
      {active && (
        <button onClick={() => navigate('live')} className="mb-6 flex w-full animate-fade-up items-center gap-3 rounded-[22px] bg-forest px-5 py-4 text-start text-white shadow-lift">
          <span className="h-2.5 w-2.5 animate-pulse-soft rounded-full bg-sprout" />
          <span className="flex-1 font-semibold">لديكم جلسة جارية لأسرة {session.familyName} — اضغطوا للعودة إليها</span>
          <Play size={18} />
        </button>
      )}

      <section className="grid items-center gap-6 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
        <div className="order-1 animate-fade-up text-center lg:text-start">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3.5 py-1.5 text-[13px] font-semibold text-leaf ring-1 ring-white">
            <Sprout size={15} /> لعبة أسرية لتقليل استخدام الهواتف
          </span>
          <h1 className="mt-4 font-display text-5xl font-bold leading-[1.15] text-forest sm:text-6xl lg:text-7xl">شجرة البيت</h1>
          <p className="mt-4 font-display text-xl font-medium text-leaf sm:text-2xl">كل جلسة هادئة تنبت شجرة جديدة 🌱</p>
          <p className="mx-auto mt-4 max-w-lg text-[15px] leading-8 text-ink-soft sm:text-base lg:mx-0">
            اجتمعوا، ضعوا هواتفكم جانبًا، وتحدثوا معًا. كلما التزمت الأسرة كلها بالجلسة نمت شجرتكم أمام أعينكم، وجمعتم نقاطًا تقرّبكم من مكافأة عائلية جميلة.
          </p>
        </div>

        <div className="relative order-2 lg:row-span-2">
          <div className="relative mx-auto aspect-square w-full max-w-[560px]">
            <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgb(255_244_204/0.9),rgb(214_236_214/0.4)_55%,transparent_70%)]" />
            <Tree3D species="oak" seed={2024} growth={1} fruit={1} intro={{ from: 0.02, to: 1, seconds: 5.5 }} className="h-full w-full" />
            <div className="glass absolute end-2 top-6 animate-float rounded-2xl px-4 py-2.5 text-center sm:end-6">
              <div className="text-xs text-muted">رصيد الأسرة</div>
              <div className="font-display text-xl font-bold text-forest">
                ⭐ <AnimatedNumber value={profile.totalPoints} from={0} duration={1600} />
              </div>
            </div>
            <div className="glass absolute bottom-10 start-2 animate-float rounded-2xl px-4 py-2.5 text-center [animation-delay:1.2s] sm:start-6">
              <div className="text-xs text-muted">أشجار الحديقة</div>
              <div className="font-display text-xl font-bold text-forest">🌳 {num(profile.trees.length)}</div>
            </div>
          </div>
        </div>

        <div className="order-3 mx-auto flex w-full max-w-md flex-col gap-3 lg:mx-0">
          <Button size="xl" block onClick={() => navigate('setup')} icon={<Play size={22} fill="currentColor" />} data-testid="start-session">
            ابدأ جلسة
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" size="lg" onClick={() => navigate('garden')} icon={<Trees size={20} />}>
              حديقة الأسرة
            </Button>
            <Button variant="wood" size="lg" onClick={() => navigate('how')} icon={<BookOpen size={20} />}>
              طريقة اللعب
            </Button>
          </div>
          <button onClick={() => navigate('join')} className="text-center text-[15px] font-semibold text-forest underline-offset-4 hover:underline">
            عندك رمز جلسة؟ انضم من جوالك ←
          </button>
          <DemoSwitch variant="card" />
        </div>
      </section>

      <section className="mt-14 grid gap-4 sm:grid-cols-3">
        {FEATURES.map((f, i) => (
          <Card key={f.title} className="animate-fade-up p-6" style={{ animationDelay: `${0.1 + i * 0.1}s` }}>
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-b from-white to-mint text-3xl shadow-sm">{f.icon}</div>
            <h3 className="mt-4 text-lg font-bold text-forest">{f.title}</h3>
            <p className="mt-1.5 text-[15px] leading-7 text-ink-soft">{f.text}</p>
          </Card>
        ))}
      </section>

      <section className="mt-6">
        <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-7">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] bg-gradient-to-b from-gold-soft to-[#f5e2b8] text-4xl">{goal?.reward.emoji ?? '🎁'}</div>
            <div>
              <p className="text-sm text-muted">الهدف القادم لأسرة {profile.familyName || 'البيت'}</p>
              <p className="font-display text-xl font-bold text-forest">{goal ? `${goal.reward.title} عند ${num(goal.reward.points)} نقطة` : 'حققتم كل المكافآت! أضيفوا مكافأة جديدة'}</p>
            </div>
          </div>
          {goal && (
            <div className="flex-1">
              <div className="mb-2 flex justify-between text-sm font-semibold">
                <span className="text-forest">
                  {num(profile.totalPoints)} / {num(goal.reward.points)}
                </span>
                <span className="text-wood-2">{goal.remaining > 0 ? `متبقي ${pointsCount(goal.remaining)}` : 'جاهزة للاستلام 🎉'}</span>
              </div>
              <ProgressBar value={goal.progress} tone="gold" label="التقدم نحو المكافأة" />
            </div>
          )}
          <Button variant="secondary" onClick={() => navigate('rewards')}>
            المكافآت
          </Button>
        </Card>
      </section>
    </Page>
  )
}
