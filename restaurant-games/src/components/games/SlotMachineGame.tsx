import React, { useState, useEffect, useRef } from 'react';
import { triggerConfetti } from '../../utils/confetti';
import { sounds } from '../../utils/sound';
import { Prize } from '../../types';
import { PrizeRevealModal } from '../PrizeRevealModal';
import { Sparkles, Play, RotateCcw, Award } from 'lucide-react';

interface SlotMachineGameProps {
  onBackToGrid: () => void;
}

const SYMBOLS = ['🍔', '🍕', '🥤', '⭐', '🎁', '🍟'];

export const SlotMachineGame: React.FC<SlotMachineGameProps> = ({ onBackToGrid }) => {
  const [reels, setReels] = useState<[string, string, string]>(['🍔', '🍕', '🥤']);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [spinState, setSpinState] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);
  const [forceWinDemo, setForceWinDemo] = useState<boolean>(false);

  const animationIntervals = useRef<(number | null)[]>([null, null, null]);

  const spinReels = () => {
    if (isSpinning) return;
    sounds.playClick();
    setIsSpinning(true);
    setResultMessage(null);
    setWonPrize(null);
    setSpinState([true, true, true]);

    // Choose outcome
    let finalSymbols: [string, string, string];
    if (forceWinDemo || Math.random() < 0.4) {
      // Guaranteed 3 matches
      const luckySym = SYMBOLS[Math.floor(Math.random() * (SYMBOLS.length - 1))];
      finalSymbols = [luckySym, luckySym, luckySym];
    } else {
      // Random symbols
      finalSymbols = [
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ];
      // If by pure chance all 3 matched and forceWinDemo wasn't on, change one unless random allows
      if (finalSymbols[0] === finalSymbols[1] && finalSymbols[1] === finalSymbols[2] && Math.random() > 0.3) {
        finalSymbols[2] = SYMBOLS[(SYMBOLS.indexOf(finalSymbols[2]) + 1) % SYMBOLS.length];
      }
    }

    // Start cycling reel symbols rapidly
    for (let i = 0; i < 3; i++) {
      animationIntervals.current[i] = window.setInterval(() => {
        setReels(prev => {
          const next = [...prev] as [string, string, string];
          next[i] = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
          return next;
        });
        sounds.playTick(500 + i * 80);
      }, 75);
    }

    // Sequential stop
    // Reel 1 stop after 1.4s
    setTimeout(() => {
      if (animationIntervals.current[0]) clearInterval(animationIntervals.current[0]);
      setReels(prev => [finalSymbols[0], prev[1], prev[2]]);
      setSpinState([false, true, true]);
      sounds.playTick(600);
    }, 1300);

    // Reel 2 stop after 2.1s
    setTimeout(() => {
      if (animationIntervals.current[1]) clearInterval(animationIntervals.current[1]);
      setReels(prev => [finalSymbols[0], finalSymbols[1], prev[2]]);
      setSpinState([false, false, true]);
      sounds.playTick(680);
    }, 2000);

    // Reel 3 stop after 2.8s
    setTimeout(() => {
      if (animationIntervals.current[2]) clearInterval(animationIntervals.current[2]);
      setReels([finalSymbols[0], finalSymbols[1], finalSymbols[2]]);
      setSpinState([false, false, false]);
      setIsSpinning(false);
      sounds.playTick(800);

      // Evaluate match
      const [s1, s2, s3] = finalSymbols;
      if (s1 === s2 && s2 === s3) {
        // 3 of a kind WIN!
        sounds.playWin();
        triggerConfetti();
        const symbolPrizes: Record<string, Prize> = {
          '🍔': { id: 'slot-burger', name: 'وجبة برجر مجانية 🍔', type: 'free_meal', icon: '🍔', color: '#EF4444', valueText: 'وجبة برجر دبل مجانية!', code: 'SLOT-BURGER-VIP' },
          '🍕': { id: 'slot-pizza', name: 'بيتزا مجانية 🍕', type: 'free_meal', icon: '🍕', color: '#F59E0B', valueText: 'بيتزا وسط من اختيارك مجاناً!', code: 'SLOT-PIZZA-WIN' },
          '🥤': { id: 'slot-drink', name: 'مشروب مجاني كبير 🥤', type: 'free_drink', icon: '🥤', color: '#06B6D4', valueText: 'مشروب غازي أو موخيتو مجاناً!', code: 'SLOT-DRINK-FREE' },
          '⭐': { id: 'slot-cash', name: 'كاش باك 20 ريال ⭐', type: 'cashback', icon: '⭐', color: '#EAB308', valueText: 'رصيد 20 ريال فوري في المحفظة!', code: 'SLOT-20CASH' },
          '🎁': { id: 'slot-vip', name: 'خصم 20% على إجمالي الفاتورة 🎁', type: 'discount', icon: '🎁', color: '#8B5CF6', valueText: 'خصم 20% لكامل طلبك!', code: 'SLOT-SAVE20' },
          '🍟': { id: 'slot-fries', name: 'بطاطس مقلية مجانية 🍟', type: 'free_meal', icon: '🍟', color: '#F97316', valueText: 'بطاطس مقرمشة مجاناً!', code: 'SLOT-FRIES-FREE' },
        };
        const prize = symbolPrizes[s1] || {
          id: 'slot-win',
          name: 'وجبة مجانية كبرى!',
          type: 'free_meal',
          icon: s1,
          color: '#10B981',
          valueText: 'مبروك تطابق الثلاث رموز!',
          code: 'JACKPOT-WIN',
        };
        setWonPrize(prize);
        setResultMessage(`جاكبوت! تطابقت الرموز الثلاثة (${s1} ${s2} ${s3}) 🎉`);
      } else if (s1 === s2 || s2 === s3 || s1 === s3) {
        sounds.playSuccess();
        setResultMessage('قريب جداً! تطابق رمزان من 3.. حظ أوفر في اللفة القادمة!');
      } else {
        sounds.playMiss();
        setResultMessage('حظ أوفر هذه المرة! جرّب لفة جديدة 🍀');
      }
    }, 2700);
  };

  useEffect(() => {
    return () => {
      animationIntervals.current.forEach(int => {
        if (int) clearInterval(int);
      });
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto text-center">
      {/* Game Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>آلة الحظ الكلاسيكية (Slot Machine)</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
          آلة السلوت للمطاعم 🎰
        </h2>
        <p className="text-sm text-neutral-400 max-w-md mx-auto">
          اضغط على "شغّل الآلة" وطابق الرموز الثلاثة لتربح وجبتك المجانية!
        </p>
      </div>

      {/* Demo helper toggle for the restaurant owner */}
      <div className="mb-4 inline-flex items-center gap-2 bg-[#161820] border border-amber-500/30 px-3 py-1.5 rounded-full text-xs text-neutral-300 shadow-sm">
        <span>ميزة المعاينة لصاحب المطعم:</span>
        <button
          type="button"
          onClick={() => setForceWinDemo(!forceWinDemo)}
          className={`px-2.5 py-0.5 rounded-full font-bold transition-colors cursor-pointer ${
            forceWinDemo
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-xs'
              : 'bg-[#1F222E] text-amber-300 hover:bg-[#282C3A] border border-amber-500/30'
          }`}
        >
          {forceWinDemo ? 'وضع الفوز المضمون مفعّل ✅' : 'وضع الفوز العشوائي'}
        </button>
      </div>

      {/* The Slot Machine Frame */}
      <div className="relative w-80 sm:w-96 rounded-3xl p-5 bg-[#161820] border-4 border-amber-400/80 shadow-2xl shadow-amber-500/15 ring-2 ring-amber-400/20">
        {/* Top Header Marquee */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 rounded-xl py-2 px-4 mb-4 border border-amber-300/40 shadow-inner flex items-center justify-between text-slate-950">
          <span className="text-xs font-black tracking-widest uppercase flex items-center gap-1">
            ⭐ JACKPOT ⭐
          </span>
          <div className="flex gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${isSpinning ? 'bg-white animate-ping' : 'bg-slate-950'}`} />
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
            <span className="w-2.5 h-2.5 rounded-full bg-slate-950" />
          </div>
        </div>

        {/* The 3 Reels Display Window */}
        <div className="bg-[#0E1015] rounded-2xl p-4 border-2 border-amber-500/30 shadow-inner grid grid-cols-3 gap-3 relative overflow-hidden">
          {/* Payline gold guide line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-amber-400/60 z-10 pointer-events-none" />

          {reels.map((symbol, idx) => {
            const isReelSpinning = spinState[idx];
            return (
              <div
                key={idx}
                className="h-28 sm:h-32 rounded-xl bg-[#1A1D26] border border-amber-500/30 flex items-center justify-center relative overflow-hidden shadow-xs"
              >
                {/* Visual blur effect while spinning */}
                <span
                  className={`text-5xl sm:text-6xl select-none transition-transform duration-75 ${
                    isReelSpinning ? 'scale-110 blur-[1px]' : 'scale-100'
                  }`}
                >
                  {symbol}
                </span>

                {/* Reel curvature reflection */}
                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-black/40 pointer-events-none" />
              </div>
            );
          })}
        </div>

        {/* Machine Status Screen */}
        <div className="mt-4 p-2.5 rounded-xl bg-[#13151C] border border-amber-500/30 text-xs font-bold min-h-[38px] flex items-center justify-center text-amber-300">
          {isSpinning ? (
            <span className="text-amber-400 animate-pulse">البكرات تدور الآن... راقب التطابق!</span>
          ) : resultMessage ? (
            <span className={resultMessage.includes('جاكبوت') ? 'text-amber-400 font-black' : 'text-neutral-300'}>
              {resultMessage}
            </span>
          ) : (
            <span className="text-neutral-400">اضغط "شغّل الآلة" للبدء</span>
          )}
        </div>
      </div>

      {/* Spin CTA Button */}
      <div className="mt-6">
        <button
          id="btn-spin-slot"
          type="button"
          onClick={spinReels}
          disabled={isSpinning}
          className={`px-8 py-3.5 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 shadow-xl cursor-pointer ${
            isSpinning
              ? 'bg-[#1A1D26] text-neutral-500 cursor-not-allowed border border-neutral-800'
              : 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-amber-500/20 active:scale-95 ring-2 ring-amber-400/50'
          }`}
        >
          <Play className="w-5 h-5 fill-current text-slate-950" />
          <span>{isSpinning ? 'جارِ التدوير...' : 'شغّل الآلة الآن 🎰'}</span>
        </button>
      </div>

      {/* Prize Reveal Modal */}
      {wonPrize && (
        <PrizeRevealModal
          prize={wonPrize}
          onReset={spinReels}
          onBackToGrid={onBackToGrid}
          gameTitle="آلة السلوت"
        />
      )}
    </div>
  );
};
