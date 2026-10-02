import React, { useState } from 'react';
import { STANDARD_PRIZES } from '../../data/prizes';
import { Prize } from '../../types';
import { triggerConfetti } from '../../utils/confetti';
import { sounds } from '../../utils/sound';
import { PrizeRevealModal } from '../PrizeRevealModal';
import { Sparkles, Flame, Check, Trophy, CalendarCheck, RotateCcw } from 'lucide-react';

interface DailyStreakGameProps {
  onBackToGrid: () => void;
}

interface DayItem {
  id: number;
  name: string;
  rewardText: string;
  isGrandReward?: boolean;
}

const DAYS: DayItem[] = [
  { id: 1, name: 'السبت', rewardText: '10 نقاط' },
  { id: 2, name: 'الأحد', rewardText: '15 نقطة' },
  { id: 3, name: 'الإثنين', rewardText: 'قهوة مجانية ☕' },
  { id: 4, name: 'الثلاثاء', rewardText: '25 نقطة' },
  { id: 5, name: 'الأربعاء', rewardText: 'بطاطس مقلية 🍟' },
  { id: 6, name: 'الخميس', rewardText: 'مشروب كبير 🥤' },
  { id: 7, name: 'الجمعة', rewardText: 'وجبة مجانية VIP 🍔👑', isGrandReward: true },
];

export const DailyStreakGame: React.FC<DailyStreakGameProps> = ({ onBackToGrid }) => {
  // Start with 4 days already checked so the restaurant owner can immediately see both states
  const [attendedDays, setAttendedDays] = useState<number[]>([1, 2, 3, 4]);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);

  const currentStreak = attendedDays.length;
  const isFullStreak = currentStreak === 7;

  const handleCheckInToday = () => {
    if (isFullStreak) return;

    sounds.playSuccess();
    const nextDay = currentStreak + 1;
    const newAttended = [...attendedDays, nextDay];
    setAttendedDays(newAttended);

    if (nextDay === 7) {
      // Completed 7 days streak!
      setTimeout(() => {
        sounds.playWin();
        triggerConfetti();
        setWonPrize(STANDARD_PRIZES.find(p => p.id === 'free-meal') || STANDARD_PRIZES[1]);
      }, 500);
    }
  };

  const resetStreak = () => {
    sounds.playClick();
    setAttendedDays([1, 2, 3, 4]);
    setWonPrize(null);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto text-center">
      {/* Game Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-2">
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>بناء عادة يومية لولاء العملاء</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
          عداد الحضور المتتالي (Daily Streak) 🔥
        </h2>
        <div className="p-3 bg-[#161820] rounded-2xl border border-amber-500/30 max-w-lg mx-auto mb-2">
          <p className="text-sm font-bold text-amber-300">
            "احضر 7 أيام متتالية واربح جائزة كبرى"
          </p>
        </div>
        <p className="text-xs text-neutral-400 max-w-md mx-auto">
          جرّب الضغط على زر "تسجيل حضور اليوم" لمعاينة كيفية تفاعل العميل وزيادة حماسه لإكمال الأيام!
        </p>
      </div>

      {/* Streak Badge & Status */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#161820] border border-amber-500/30 shadow-sm">
          <Flame className={`w-5 h-5 ${currentStreak > 0 ? 'text-amber-400 animate-bounce' : 'text-neutral-500'}`} />
          <span className="text-sm font-bold text-neutral-300">سلسلة الحضور الحالية:</span>
          <span className="text-lg font-black text-amber-400 font-mono">{currentStreak} / 7 أيام</span>
        </div>
      </div>

      {/* 7 Days Path Bar */}
      <div className="w-full bg-[#161820] border border-amber-500/30 rounded-3xl p-5 sm:p-7 shadow-xl shadow-amber-500/10 relative mb-8">
        {/* Progress connector line */}
        <div className="absolute top-1/2 left-8 right-8 -translate-y-6 h-1.5 bg-[#1F222E] rounded-full z-0 hidden sm:block">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 rounded-full transition-all duration-500"
            style={{ width: `${((currentStreak - 1) / 6) * 100}%` }}
          />
        </div>

        {/* Days items container */}
        <div className="grid grid-cols-2 sm:grid-cols-7 gap-3 sm:gap-2 relative z-10">
          {DAYS.map((day) => {
            const isAttended = attendedDays.includes(day.id);
            const isNext = !isAttended && day.id === currentStreak + 1;

            return (
              <div
                key={day.id}
                className={`flex flex-col items-center p-3 rounded-2xl border transition-all duration-300 ${
                  isAttended
                    ? 'bg-amber-950/30 border-amber-400/60 text-amber-300 shadow-xs'
                    : isNext
                    ? 'bg-[#1F222E] border-amber-400 text-amber-300 ring-2 ring-amber-400/40 animate-pulse'
                    : 'bg-[#12141A] border-neutral-800 text-neutral-500'
                }`}
              >
                <span className="text-xs font-bold mb-2">{day.name}</span>

                {/* Day Circle */}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm mb-2 shadow-inner transition-transform ${
                    isAttended
                      ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 scale-105'
                      : isNext
                      ? 'bg-amber-400 text-slate-950 font-black scale-110'
                      : day.isGrandReward
                      ? 'bg-[#1A1D26] text-amber-400 border border-amber-500/40'
                      : 'bg-[#1A1D26] text-neutral-400'
                  }`}
                >
                  {isAttended ? (
                    <Check className="w-6 h-6 stroke-[3] text-slate-950" />
                  ) : day.isGrandReward ? (
                    <Trophy className="w-5 h-5 text-amber-400" />
                  ) : (
                    <span>{day.id}</span>
                  )}
                </div>

                {/* Day Mini Reward */}
                <span className={`text-[10px] text-center leading-tight font-medium ${
                  day.isGrandReward ? 'text-amber-400 font-bold' : ''
                }`}>
                  {day.rewardText}
                </span>

                {isNext && (
                  <span className="mt-1 px-1.5 py-0.5 rounded text-[9px] bg-amber-400 text-slate-950 font-black">
                    اليوم
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Action Button */}
      <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
        <button
          id="btn-checkin-streak"
          type="button"
          onClick={handleCheckInToday}
          disabled={isFullStreak}
          className={`px-8 py-3.5 rounded-2xl font-black text-sm sm:text-base transition-all flex items-center justify-center gap-2 shadow-xl cursor-pointer ${
            isFullStreak
              ? 'bg-[#1F222E] text-amber-400 border border-amber-500/40 cursor-default'
              : 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-amber-500/20 active:scale-95 ring-2 ring-amber-400/50'
          }`}
        >
          <CalendarCheck className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          <span>
            {isFullStreak
              ? 'تم إكمال الـ 7 أيام بنجاح! 🏆'
              : `تسجيل حضور اليوم (${DAYS[currentStreak]?.name || 'اليوم'}) كتجربة توضيحية`}
          </span>
        </button>

        <button
          type="button"
          onClick={resetStreak}
          className="px-4 py-3.5 rounded-2xl bg-[#161820] hover:bg-[#1E222D] text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-amber-400" />
          <span>إعادة ضبط الشريط</span>
        </button>
      </div>

      {/* Prize Reveal Modal */}
      {wonPrize && (
        <PrizeRevealModal
          prize={wonPrize}
          onReset={resetStreak}
          onBackToGrid={onBackToGrid}
          gameTitle="تحدي الحضور المتتالي"
        />
      )}
    </div>
  );
};
