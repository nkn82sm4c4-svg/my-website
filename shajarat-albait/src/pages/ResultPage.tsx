import { Gift, Play, Trees } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Page } from '../components/layout/Page'
import { Tree3D } from '../components/tree/Tree3D'
import { AnimatedNumber } from '../components/ui/AnimatedNumber'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Confetti } from '../components/ui/Confetti'
import { ProgressBar } from '../components/ui/ProgressBar'
import { progressTo } from '../game/rewards'
import { navigate } from '../hooks/useHashRoute'
import { minutesLabel, num, pointsCount } from '../lib/format'
import { useGame } from '../store/GameContext'
import { EmptySession } from './EmptySession'

export function ResultPage() {
  const { lastResult, profile, discardSession } = useGame()
  const [celebrate, setCelebrate] = useState(0)
  const [showNew, setShowNew] = useState(false)

  useEffect(() => {
    // The completed session has been recorded — clear it from the live slot
    discardSession()
    const a = setTimeout(() => setCelebrate(1), 2300)
    const b = setTimeout(() => setShowNew(true), 2600)
    return () => {
      clearTimeout(a)
      clearTimeout(b)
    }
  }, [])

  if (!lastResult) return <EmptySession />
  const { session, tree, previousPoints, newPoints } = lastResult
  const reward = profile.rewards.find((r) => r.id === session.rewardId) ?? profile.rewards.find((r) => !r.claimedAt)
  const rp = reward ? progressTo(reward, newPoints) : null

  return (
    <Page className="max-w-5xl">
      <Confetti fire={celebrate} />
      <div className="grid items-center gap-6 lg:grid-cols-2">
        <div className="relative order-2 lg:order-1">
          <div className="relative mx-auto aspect-square w-full max-w-[480px]">
            <div className="absolute inset-[6%] rounded-full bg-[radial-gradient(circle,rgb(255_240_190/0.95),rgb(229_242_225/0.5)_55%,transparent_72%)]" />
            <Tree3D species={tree.species} seed={tree.seed} growth={1} fruit={tree.perfect ? 1 : 0} intro={{ from: 0.72, to: 1, seconds: 2.2 }} celebrate={celebrate} className="h-full w-full" />
          </div>
        </div>

        <div className="order-1 text-center lg:order-2 lg:text-start">
          <span className="inline-flex animate-pop items-center gap-2 rounded-full bg-mint px-3.5 py-1.5 text-sm font-bold text-forest">🌳 شجرة جديدة في حديقتكم</span>
          <h1 className="mt-4 animate-fade-up font-display text-3xl font-bold leading-snug text-forest sm:text-4xl" data-testid="result-title">
            أحسنتم يا أسرة {session.familyName} ❤️
          </h1>
          <p className="mt-2 animate-fade-up text-lg font-medium text-leaf [animation-delay:.15s]">اكتملت الجلسة ونمت شجرة جديدة 🌳</p>
          <p className="mt-1 text-sm text-muted">
            {minutesLabel(session.durationMin)} · {num(session.participants)} أفراد · {num(session.cardsUsed)} بطاقات حوار{session.demo ? ' · جلسة Demo' : ''}
          </p>

          <Card className="mt-6 p-5 text-start">
            <dl className="grid gap-3 text-[15px]">
              <div className="flex items-center justify-between">
                <dt className="text-ink-soft">الرصيد السابق</dt>
                <dd className="num font-display text-lg font-bold text-ink">{num(previousPoints)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-ink-soft">
                  نقاط الجلسة
                  <span className="ms-2 text-xs text-muted">
                    (إكمال الوقت {num(session.basePoints)}
                    {session.bonusPoints ? ` + الالتزام ${num(session.bonusPoints)}` : ' · لا مكافأة التزام'})
                  </span>
                </dt>
                <dd className="num font-display text-lg font-bold text-leaf" data-testid="session-points">
                  +{num(session.points)}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-forest/10 pt-3">
                <dt className="font-semibold text-forest">الرصيد الجديد</dt>
                <dd className="font-display text-3xl font-bold text-forest" data-testid="new-balance">
                  <AnimatedNumber value={newPoints} from={previousPoints} duration={1600} />
                </dd>
              </div>
            </dl>
          </Card>

          {reward && rp && (
            <Card className={`mt-4 p-5 text-start ${showNew ? 'animate-fade-up' : 'opacity-0'}`}>
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gold-soft text-3xl">{reward.emoji}</span>
                <div className="flex-1">
                  <p className="font-display font-bold text-forest">
                    {reward.title} عند {num(reward.points)} نقطة
                  </p>
                  <p className="text-sm font-semibold text-wood-2" data-testid="reward-remaining">
                    {rp.remaining > 0 ? `متبقي ${pointsCount(rp.remaining)}` : 'وصلتم للمكافأة! 🎉 استلموها من صفحة المكافآت'}
                  </p>
                </div>
                {rp.remaining === 0 && (
                  <Button variant="wood" onClick={() => navigate('rewards')} icon={<Gift size={18} />}>
                    استلام
                  </Button>
                )}
              </div>
              <ProgressBar value={rp.progress} tone="gold" className="mt-4" label="التقدم نحو المكافأة" />
            </Card>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button size="lg" onClick={() => navigate('setup')} icon={<Play size={20} fill="currentColor" />}>
              بدء جلسة جديدة
            </Button>
            <Button variant="secondary" size="lg" onClick={() => navigate('garden')} icon={<Trees size={20} />} data-testid="to-garden">
              الذهاب إلى حديقة الأسرة
            </Button>
          </div>
        </div>
      </div>
    </Page>
  )
}
