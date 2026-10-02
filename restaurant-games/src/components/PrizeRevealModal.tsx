import React from 'react';
import { Prize } from '../types';
import { Sparkles, RotateCcw, ArrowRight } from 'lucide-react';
import { sounds } from '../utils/sound';

interface PrizeRevealModalProps {
  prize: Prize;
  onReset: () => void;
  onBackToGrid: () => void;
  gameTitle: string;
}

export const PrizeRevealModal: React.FC<PrizeRevealModalProps> = ({
  prize,
  onReset,
  onBackToGrid,
  gameTitle,
}) => {
  const isLoss = prize.type === 'none';

  return (
    <div className="w-full max-w-md mx-auto my-6 animate-in fade-in zoom-in-95 duration-300">
      <div className={`p-6 sm:p-8 rounded-3xl border text-center shadow-2xl relative overflow-hidden ${
        isLoss
          ? 'bg-[#161820] border-neutral-700 shadow-black'
          : 'bg-[#161820] border-amber-500/40 shadow-2xl shadow-black ring-1 ring-amber-500/20'
      }`}>
        {/* Glow ambient circle */}
        {!isLoss && (
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        )}

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold mb-4 bg-amber-500/10 border border-amber-500/30 text-amber-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>نتيجة تجربة {gameTitle}</span>
        </div>

        {/* Icon & Title */}
        <div className="w-20 h-20 mx-auto mb-3 rounded-2xl bg-[#1F222E] border border-amber-500/30 flex items-center justify-center text-4xl shadow-inner">
          {prize.icon}
        </div>

        <h3 className={`text-2xl font-black mb-1 ${isLoss ? 'text-neutral-400' : 'text-amber-400'}`}>
          {isLoss ? 'حظ أوفر هذه المرة!' : 'مبروك! فزت بـ'}
        </h3>
        
        <p className="text-xl font-bold text-white mb-2">
          {prize.name}
        </p>

        <p className="text-sm text-neutral-400 mb-5">
          {prize.valueText}
        </p>

        <div className="mb-6" />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onReset();
            }}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>جرّب اللعبة مرة أخرى</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onBackToGrid();
            }}
            className="px-5 py-3 rounded-xl bg-[#1F222E] hover:bg-[#282C3A] text-amber-300 font-bold text-sm flex items-center justify-center gap-2 transition-colors border border-amber-500/30 cursor-pointer"
          >
            <span>اختيار لعبة ثانية</span>
            <ArrowRight className="w-4 h-4 rotate-180 text-amber-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
