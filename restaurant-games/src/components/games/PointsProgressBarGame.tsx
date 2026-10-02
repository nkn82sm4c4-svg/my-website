import React, { useState } from 'react';
import { STANDARD_PRIZES } from '../../data/prizes';
import { Prize } from '../../types';
import { triggerConfetti } from '../../utils/confetti';
import { sounds } from '../../utils/sound';
import { PrizeRevealModal } from '../PrizeRevealModal';
import { Sparkles, Award, Plus, RotateCcw, Check, Lock, ChevronRight, Gift } from 'lucide-react';

interface PointsProgressBarGameProps {
  onBackToGrid: () => void;
}

interface Milestone {
  points: number;
  title: string;
  icon: string;
  rewardCode: string;
  isGrand?: boolean;
}

const MILESTONES: Milestone[] = [
  { points: 100, title: 'مشروب منعش', icon: '🥤', rewardCode: 'DRINK-100' },
  { points: 250, title: 'بطاطس مقلية', icon: '🍟', rewardCode: 'FRIES-250' },
  { points: 400, title: 'خصم 20%', icon: '🏷️', rewardCode: 'SAVE-20-400' },
  { points: 500, title: 'وجبة VIP مجانية', icon: '🍔👑', rewardCode: 'VIP-MEAL-500', isGrand: true },
];

export const PointsProgressBarGame: React.FC<PointsProgressBarGameProps> = ({ onBackToGrid }) => {
  // Starts at 350 / 500 points as requested in prompt!
  const [points, setPoints] = useState<number>(350);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);

  const maxPoints = 500;
  const progressPercent = Math.min((points / maxPoints) * 100, 100);

  const addPoints = (amount: number) => {
    sounds.playClick();
    const prevPoints = points;
    const nextPoints = Math.min(points + amount, maxPoints);
    setPoints(nextPoints);

    // Check if unlocked a milestone
    MILESTONES.forEach(m => {
      if (prevPoints < m.points && nextPoints >= m.points) {
        // Milestone newly unlocked!
        setTimeout(() => {
          sounds.playSuccess();
          if (m.isGrand) {
            sounds.playWin();
            triggerConfetti();
            setWonPrize(STANDARD_PRIZES.find(p => p.id === 'free-meal') || STANDARD_PRIZES[1]);
          } else if (m.points === 400) {
            sounds.playWin();
            triggerConfetti();
            setWonPrize(STANDARD_PRIZES.find(p => p.id === 'discount-20') || STANDARD_PRIZES[4]);
          }
        }, 300);
      }
    });
  };

  const resetPoints = () => {
    sounds.playClick();
    setPoints(350);
    setWonPrize(null);
  };

  // Find next locked milestone
  const nextMilestone = MILESTONES.find(m => m.points > points);
  const pointsToNext = nextMilestone ? nextMilestone.points - points : 0;

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto text-center">
      {/* Game Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-2">
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>تحفيز بصري لرفع متوسط الفاتورة</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
          شريط نقاط الولاء المرئي 🏆
        </h2>
        <p className="text-sm text-neutral-400 max-w-md mx-auto">
          يعرض للزبون تقدم نقاطه نحو المكافآت القادمة، مما يدفعه لإضافة أصناف إضافية للوصول لهدفه!
        </p>
      </div>

      {/* Points Counter Badge */}
      <div className="flex flex-col items-center mb-8">
        <div className="px-6 py-3 rounded-3xl bg-[#161820] border border-amber-500/30 shadow-xl shadow-amber-500/10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center text-2xl">
            ⭐
          </div>
          <div className="text-right">
            <span className="text-xs text-neutral-400 block font-medium">رصيد نقاط الزبون الحالي</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                {points}
              </span>
              <span className="text-xs text-neutral-400 font-bold">/ {maxPoints} نقطة</span>
            </div>
          </div>
        </div>

        {nextMilestone && (
          <div className="mt-3 text-xs text-amber-300 font-bold flex items-center gap-1">
            <span>متبقي فقط {pointsToNext} نقطة لفتح مكافأة "{nextMilestone.title}"!</span>
          </div>
        )}
      </div>

      {/* The Animated Progress Bar Component */}
      <div className="w-full bg-[#161820] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-xl shadow-amber-500/10 relative mb-8">
        {/* Track Line */}
        <div className="relative w-full h-4 bg-[#0E1015] rounded-full border border-amber-500/30 overflow-hidden mb-12">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full transition-all duration-700 ease-out relative shadow-[0_0_15px_rgba(245,158,11,0.4)]"
            style={{ width: `${progressPercent}%` }}
          >
            {/* Shimmer light bar */}
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        </div>

        {/* Milestone Pins on the Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 relative">
          {MILESTONES.map((milestone) => {
            const isUnlocked = points >= milestone.points;

            return (
              <div
                key={milestone.points}
                className={`flex flex-col items-center p-3.5 rounded-2xl border transition-all duration-300 ${
                  isUnlocked
                    ? 'bg-amber-950/30 border-amber-400/60 shadow-xs'
                    : 'bg-[#12141A] border-neutral-800 opacity-60'
                }`}
              >
                {/* Milestone Target Points */}
                <span className="text-[11px] font-mono font-bold text-neutral-400 mb-2">
                  {milestone.points} نقطة
                </span>

                {/* Milestone Icon */}
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-2 transition-transform ${
                    isUnlocked
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50 scale-105 shadow-xs'
                      : 'bg-[#1A1D26] text-neutral-500'
                  }`}
                >
                  {milestone.icon}
                </div>

                {/* Milestone Name */}
                <span className="text-xs font-bold text-white mb-1">
                  {milestone.title}
                </span>

                {/* Status tag */}
                <div className="mt-1">
                  {isUnlocked ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-400/40">
                      <Check className="w-3 h-3 stroke-[3] text-amber-400" /> متاح للاستخدام
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-neutral-500 bg-[#1A1D26] px-2 py-0.5 rounded-full border border-neutral-800">
                      <Lock className="w-2.5 h-2.5" /> مقفل
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Demonstration Controls for Restaurant Owner */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          id="btn-add-50-points"
          type="button"
          onClick={() => addPoints(50)}
          disabled={points >= maxPoints}
          className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-md cursor-pointer ${
            points >= maxPoints
              ? 'bg-[#1A1D26] text-neutral-500 cursor-not-allowed border border-neutral-800'
              : 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black active:scale-95 shadow-amber-500/20'
          }`}
        >
          <Plus className="w-4 h-4 text-slate-950 stroke-[2.5]" />
          <span>أضف 50 نقطة تجريبية (طلب وجبة)</span>
        </button>

        <button
          id="btn-add-100-points"
          type="button"
          onClick={() => addPoints(100)}
          disabled={points >= maxPoints}
          className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all border cursor-pointer ${
            points >= maxPoints
              ? 'bg-[#1A1D26] text-neutral-500 cursor-not-allowed border border-neutral-800'
              : 'bg-[#161820] hover:bg-[#1E222D] text-amber-300 border-amber-500/30 active:scale-95'
          }`}
        >
          <Gift className="w-4 h-4 text-amber-400" />
          <span>+100 نقطة (عزومة أصدقاء)</span>
        </button>

        <button
          id="btn-reset-points"
          type="button"
          onClick={resetPoints}
          className="px-4 py-3 rounded-xl bg-[#161820] hover:bg-[#1E222D] text-neutral-400 hover:text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>إعادة ضبط (350 نقطة)</span>
        </button>
      </div>

      {/* Prize Reveal Modal */}
      {wonPrize && (
        <PrizeRevealModal
          prize={wonPrize}
          onReset={resetPoints}
          onBackToGrid={onBackToGrid}
          gameTitle="نقاط الولاء"
        />
      )}
    </div>
  );
};
