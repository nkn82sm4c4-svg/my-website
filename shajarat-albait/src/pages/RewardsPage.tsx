import { Gift, Plus, Target, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Page } from '../components/layout/Page'
import { AnimatedNumber } from '../components/ui/AnimatedNumber'
import { Button } from '../components/ui/Button'
import { Card, SectionTitle } from '../components/ui/Card'
import { Confetti } from '../components/ui/Confetti'
import { ProgressBar } from '../components/ui/ProgressBar'
import { GAME } from '../config/game'
import { REWARD_EMOJIS } from '../data/rewards'
import { progressTo, rewardStatus } from '../game/rewards'
import { dateLabel, num, pointsCount } from '../lib/format'
import { useGame } from '../store/GameContext'
import { useToast } from '../store/ToastContext'

export function RewardsPage() {
  const { profile, addReward, removeReward, claimReward, setGoal } = useGame()
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [points, setPoints] = useState('250')
  const [emoji, setEmoji] = useState(REWARD_EMOJIS[0])
  const [fire, setFire] = useState(0)
  const pts = Number(points)
  const valid = title.trim().length >= 2 && Number.isFinite(pts) && pts >= 10 && pts <= 100_000
  const rewards = [...profile.rewards].sort((a, b) => a.points - b.points)

  const submit = () => {
    if (!valid) return
    addReward({ title: title.trim(), points: Math.round(pts), emoji })
    toast(`أُضيفت مكافأة «${title.trim()}»`, 'success', emoji)
    setTitle('')
  }

  return (
    <Page>
      <Confetti fire={fire} />
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div>
          <SectionTitle eyebrow="نظام النقاط" title="المكافآت" desc={`كل جلسة مكتملة = ${num(GAME.basePoints)} نقطة، و${num(GAME.perfectBonus)} نقاط إضافية إذا لم يغادر أحد. اجمعوا النقاط واستلموا مكافآتكم العائلية.`} />

          <ul className="mt-6 grid gap-3" data-testid="rewards-list">
            {rewards.map((r) => {
              const status = rewardStatus(r, profile.totalPoints)
              const { progress, remaining } = progressTo(r, profile.totalPoints)
              const isGoal = r.id === profile.goalRewardId
              return (
                <li key={r.id} className={`glass rounded-[24px] p-4 sm:p-5 ${isGoal && status !== 'claimed' ? 'ring-2 ring-gold/60' : ''}`}>
                  <div className="flex items-center gap-4">
                    <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-[20px] text-4xl ${status === 'locked' ? 'bg-sand-2/70' : 'bg-gradient-to-b from-gold-soft to-[#f5e2b8]'}`}>{r.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-wood-2">🎯 {num(r.points)} نقطة</p>
                      <p className="font-display text-lg font-bold text-forest">
                        {r.title}
                        {r.custom && <span className="ms-2 rounded-full bg-mint px-2 py-0.5 align-middle text-[11px] font-semibold text-forest">مخصصة</span>}
                        {isGoal && status !== 'claimed' && <span className="ms-2 rounded-full bg-gold-soft px-2 py-0.5 align-middle text-[11px] font-semibold text-wood-2">هدفنا</span>}
                      </p>
                      <p className="text-[13px] text-muted">
                        {status === 'claimed' ? `تم الاستلام ${dateLabel(r.claimedAt!)} ✓` : status === 'ready' ? 'جاهزة للاستلام 🎉' : `متبقي ${pointsCount(remaining)}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                      {status === 'ready' && (
                        <Button
                          variant="primary"
                          onClick={() => {
                            claimReward(r.id)
                            setFire((f) => f + 1)
                            toast(`استمتعوا بـ«${r.title}» 🎉`, 'success', r.emoji)
                          }}
                          icon={<Gift size={18} />}
                        >
                          استلام
                        </Button>
                      )}
                      {status === 'locked' && !isGoal && (
                        <Button variant="ghost" className="!h-9 !px-3 text-sm" onClick={() => setGoal(r.id)} icon={<Target size={16} />}>
                          اجعلها هدفنا
                        </Button>
                      )}
                      {r.custom && (
                        <button onClick={() => removeReward(r.id)} className="grid h-9 w-9 place-items-center rounded-xl text-muted hover:bg-rose-soft hover:text-rose" aria-label={`حذف ${r.title}`}>
                          <Trash2 size={17} />
                        </button>
                      )}
                    </div>
                  </div>
                  {status === 'locked' && <ProgressBar value={progress} tone="gold" className="mt-4" label={`التقدم نحو ${r.title}`} />}
                </li>
              )
            })}
          </ul>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="overflow-hidden p-6 text-center">
            <p className="text-sm text-muted">رصيد أسرة {profile.familyName || 'البيت'}</p>
            <p className="mt-1 font-display text-5xl font-bold text-forest" data-testid="rewards-balance">
              <AnimatedNumber value={profile.totalPoints} />
            </p>
            <p className="text-sm font-semibold text-leaf">نقطة</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-2xl bg-white/70 p-3">
                <p className="font-display text-xl font-bold text-forest">{num(profile.rewards.filter((r) => r.claimedAt).length)}</p>
                <p className="text-muted">مكافآت مستلمة</p>
              </div>
              <div className="rounded-2xl bg-white/70 p-3">
                <p className="font-display text-xl font-bold text-forest">{num(profile.sessions.length)}</p>
                <p className="text-muted">جلسات</p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-bold text-forest">
              <Plus size={18} /> إضافة مكافأة مخصصة
            </h2>
            <label className="mt-4 block text-sm font-semibold text-ink-soft" htmlFor="rw-title">
              اسم المكافأة
            </label>
            <input
              id="rw-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: رحلة إلى البحر"
              maxLength={30}
              className="mt-1.5 h-12 w-full rounded-2xl border border-line bg-white/85 px-4 outline-none focus:border-leaf-2 focus:ring-4 focus:ring-leaf-2/15"
            />
            <label className="mt-3 block text-sm font-semibold text-ink-soft" htmlFor="rw-points">
              النقاط المطلوبة
            </label>
            <input
              id="rw-points"
              value={points}
              onChange={(e) => setPoints(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              dir="ltr"
              className="num mt-1.5 h-12 w-full rounded-2xl border border-line bg-white/85 px-4 text-end outline-none focus:border-leaf-2 focus:ring-4 focus:ring-leaf-2/15"
            />
            <p className="mt-3 text-sm font-semibold text-ink-soft">الرمز</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5" role="radiogroup" aria-label="رمز المكافأة">
              {REWARD_EMOJIS.map((e) => (
                <button key={e} role="radio" aria-checked={e === emoji} onClick={() => setEmoji(e)} className={`grid h-10 w-10 place-items-center rounded-xl text-2xl transition ${e === emoji ? 'bg-white shadow ring-2 ring-gold' : 'hover:bg-white/60'}`}>
                  {e}
                </button>
              ))}
            </div>
            <Button block className="mt-4" onClick={submit} disabled={!valid} icon={<Plus size={18} />} data-testid="add-reward">
              إضافة المكافأة
            </Button>
            {!valid && title.length > 0 && <p className="mt-2 text-xs text-muted">النقاط بين ١٠ و ١٠٠٬٠٠٠</p>}
          </Card>
        </aside>
      </div>
    </Page>
  )
}
