import { Play } from 'lucide-react'
import { Page } from '../components/layout/Page'
import { Button } from '../components/ui/Button'
import { Card, SectionTitle } from '../components/ui/Card'
import { DEMO_SECONDS, GAME, STAGES } from '../config/game'
import { navigate } from '../hooks/useHashRoute'
import { num } from '../lib/format'

const STEPS = [
  { icon: '📝', title: 'أنشئوا الجلسة', text: 'اكتبوا اسم الأسرة، اختاروا المدة (١٥ أو ٣٠ أو ٤٥ دقيقة) وبطاقة الحوار والمكافأة.' },
  { icon: '🔢', title: 'شاركوا الرمز', text: 'يظهر رمز من ٤ أرقام. ينضم به أفراد الأسرة، ولا تبدأ الجلسة قبل انضمام مشارك واحد على الأقل.' },
  { icon: '📵', title: 'ضعوا الهواتف جانبًا', text: 'اتركوا التطبيق مفتوحًا في المنتصف، وتحدثوا باستخدام بطاقات الحوار.' },
  { icon: '🌳', title: 'شاهدوا الشجرة تنمو', text: 'تنمو الشجرة مع مرور الوقت وتظهر الأغصان والأوراق حتى تكتمل في نهاية الجلسة.' },
]

export function HowPage() {
  return (
    <Page className="max-w-4xl">
      <SectionTitle eyebrow="دليل سريع" title="طريقة اللعب" desc="شجرة البيت لعبة بسيطة: كلما بقيتم معًا دون هواتف، نمت شجرتكم وكبرت حديقتكم." />

      <ol className="mt-8 grid gap-4 sm:grid-cols-2">
        {STEPS.map((s, i) => (
          <Card key={s.title} className="flex animate-fade-up gap-4 p-5" style={{ animationDelay: `${i * 0.08}s` }}>
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-b from-white to-mint text-3xl">{s.icon}</span>
            <div>
              <p className="text-xs font-bold text-leaf">الخطوة {num(i + 1)}</p>
              <h2 className="font-display text-lg font-bold text-forest">{s.title}</h2>
              <p className="mt-1 text-[15px] leading-7 text-ink-soft">{s.text}</p>
            </div>
          </Card>
        ))}
      </ol>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-forest">مراحل نمو الشجرة</h2>
          <ul className="mt-4 grid gap-2.5">
            {STAGES.map((s) => (
              <li key={s.key} className="flex items-center gap-3 rounded-2xl bg-white/60 px-4 py-2.5">
                <span className="text-2xl">{s.emoji}</span>
                <span className="flex-1 font-semibold text-ink">{s.label}</span>
                <span className="num font-display font-bold text-leaf">{num(s.at * 100)}٪</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-bold text-forest">النقاط</h2>
          <ul className="mt-4 grid gap-2.5 text-[15px]">
            <li className="flex justify-between rounded-2xl bg-white/60 px-4 py-3">
              <span>إكمال وقت الجلسة</span>
              <b className="text-leaf">+{num(GAME.basePoints)}</b>
            </li>
            <li className="flex justify-between rounded-2xl bg-white/60 px-4 py-3">
              <span>لم يغادر أي مشارك</span>
              <b className="text-leaf">+{num(GAME.perfectBonus)}</b>
            </li>
            <li className="flex justify-between rounded-2xl bg-mint px-4 py-3 font-bold text-forest">
              <span>المجموع</span>
              <span>{num(GAME.basePoints + GAME.perfectBonus)} نقطة</span>
            </li>
          </ul>
          <p className="mt-4 text-sm leading-7 text-ink-soft">الجلسات المثالية تُثمر شجرتها 🍎 في الحديقة.</p>
        </Card>
      </div>

      <Card className="mt-4 border-rose/20 p-6">
        <h2 className="text-lg font-bold text-forest">🍂 إذا غادر أحد أفراد الأسرة</h2>
        <ul className="mt-3 grid list-disc gap-1.5 ps-5 text-[15px] leading-7 text-ink-soft">
          <li>يظهر تنبيه: «غادر أحد أفراد الأسرة الجلسة».</li>
          <li>يتوقف نمو الشجرة مؤقتًا لمدة {num(GAME.penaltyMs / 1000)} ثانية، وتسقط ورقة من الشجرة.</li>
          <li>يستمر النمو بعد انتهاء المدة وعودة الفرد، ويتوقف الوقت المتبقي أثناء التوقف.</li>
          <li>تُفقد مكافأة الالتزام (+{num(GAME.perfectBonus)}) لهذه الجلسة.</li>
        </ul>
      </Card>

      <Card className="mt-4 border-gold/30 bg-gold-soft/60 p-6">
        <h2 className="text-lg font-bold text-wood-2">🧪 وضع العرض Demo</h2>
        <p className="mt-2 text-[15px] leading-7 text-ink-soft">
          لتجربة اللعبة بسرعة دون انتظار: ١٥ دقيقة = {num(DEMO_SECONDS[15])} ثانية · ٣٠ دقيقة = {num(DEMO_SECONDS[30])} ثانية · ٤٥ دقيقة = {num(DEMO_SECONDS[45])} ثانية، ومدة توقف النمو بعد المغادرة {num(GAME.demoPenaltyMs / 1000)} ثوانٍ. يظهر شريط واضح في أعلى الصفحة طوال تفعيله، والنقاط والأشجار تُحفظ فعليًا.
        </p>
      </Card>

      <div className="mt-8 flex justify-center">
        <Button size="xl" onClick={() => navigate('setup')} icon={<Play size={22} fill="currentColor" />}>
          ابدأ جلسة
        </Button>
      </div>
    </Page>
  )
}
