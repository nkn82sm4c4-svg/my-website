import React, { useState } from 'react';
import { getRandomPrize, STANDARD_PRIZES } from '../../data/prizes';
import { Prize } from '../../types';
import { triggerConfetti } from '../../utils/confetti';
import { sounds } from '../../utils/sound';
import { PrizeRevealModal } from '../PrizeRevealModal';
import { Sparkles, Gift, RotateCcw, Lock, Eye } from 'lucide-react';

interface MysteryBoxGameProps {
  onBackToGrid: () => void;
}

interface BoxState {
  id: number;
  prize: Prize;
  opened: boolean;
}

export const MysteryBoxGame: React.FC<MysteryBoxGameProps> = ({ onBackToGrid }) => {
  const [boxes, setBoxes] = useState<BoxState[]>(() => generateBoxes());
  const [selectedBoxId, setSelectedBoxId] = useState<number | null>(null);
  const [showAllPrizes, setShowAllPrizes] = useState<boolean>(false);
  const [winningPrize, setWinningPrize] = useState<Prize | null>(null);

  function generateBoxes(): BoxState[] {
    // Pick 3 distinct prizes from standard list (ensuring at least 2 are good rewards)
    const shuffled = [...STANDARD_PRIZES].sort(() => 0.5 - Math.random());
    return [
      { id: 1, prize: shuffled[0], opened: false },
      { id: 2, prize: shuffled[1], opened: false },
      { id: 3, prize: shuffled[2], opened: false },
    ];
  }

  const handleBoxClick = (boxId: number) => {
    if (selectedBoxId !== null) return; // already chosen
    sounds.playClick();
    setSelectedBoxId(boxId);

    const chosen = boxes.find(b => b.id === boxId);
    if (!chosen) return;

    // Trigger box opening animation & sounds
    setTimeout(() => {
      setBoxes(prev => prev.map(b => b.id === boxId ? { ...b, opened: true } : b));
      setWinningPrize(chosen.prize);

      if (chosen.prize.type !== 'none') {
        sounds.playWin();
        triggerConfetti();
      } else {
        sounds.playMiss();
      }
    }, 450);
  };

  const resetGame = () => {
    sounds.playClick();
    setBoxes(generateBoxes());
    setSelectedBoxId(null);
    setShowAllPrizes(false);
    setWinningPrize(null);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto text-center">
      {/* Game Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>عنصر المفاجأة والتشويق 3D</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
          صناديق الحظ والمفاجآت 🎁
        </h2>
        <p className="text-sm text-neutral-400 max-w-md mx-auto">
          اختر أحد الصناديق الثلاثة أدناه بالضغط عليه وافتح هديتك الحصرية!
        </p>
      </div>

      {/* 3 Gift Boxes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-lg mb-8">
        {boxes.map((box) => {
          const isSelected = selectedBoxId === box.id;
          const isOther = selectedBoxId !== null && !isSelected;
          const isOpened = box.opened;

          return (
            <div
              key={box.id}
              onClick={() => handleBoxClick(box.id)}
              className={`relative flex flex-col items-center p-6 rounded-3xl border transition-all duration-500 select-none ${
                selectedBoxId === null
                  ? 'cursor-pointer bg-[#161820] border-amber-500/20 hover:border-amber-400 hover:scale-105 hover:shadow-xl hover:shadow-amber-500/10 active:scale-95 shadow-sm'
                  : isSelected
                  ? 'bg-[#1A1D26] border-amber-400 shadow-xl shadow-amber-500/20 scale-105 ring-2 ring-amber-400/40'
                  : 'bg-[#111318] border-neutral-800 opacity-50'
              }`}
            >
              {/* Box Number Tag */}
              <div className={`px-3 py-1 rounded-full text-xs font-bold mb-4 border ${
                isSelected 
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black border-amber-400 shadow-xs' 
                  : 'bg-[#1F222E] text-amber-300 border-amber-500/30'
              }`}>
                صندوق رقم {box.id}
              </div>

              {/* Graphic Representation of Box */}
              <div className="relative w-28 h-28 flex items-center justify-center my-2">
                {isOpened ? (
                  // Opened Box with glowing burst and emerging prize
                  <div className="relative flex flex-col items-center animate-in zoom-in duration-500">
                    <div className="absolute -top-12 w-24 h-24 bg-amber-500/20 rounded-full blur-xl animate-pulse" />
                    
                    {/* Prize Emerging from Box */}
                    <div className="relative z-10 -mt-6 flex flex-col items-center animate-bounce">
                      <span className="text-5xl filter drop-shadow-md">
                        {box.prize.icon}
                      </span>
                    </div>

                    {/* Open Box Base Graphic */}
                    <div className="relative w-24 h-16 bg-gradient-to-t from-[#14161D] to-[#222632] rounded-b-2xl border-2 border-amber-400 shadow-xl mt-2 flex items-center justify-center">
                      <div className="w-4 h-full bg-gradient-to-b from-amber-400 to-yellow-500 shadow" />
                      {/* Floating Open Lid */}
                      <div className="absolute -top-3 -right-2 w-28 h-5 bg-[#252936] rounded-md border border-amber-400 rotate-12 shadow" />
                    </div>
                  </div>
                ) : (
                  // Closed Box
                  <div className={`relative flex flex-col items-center transition-transform ${
                    selectedBoxId === null ? 'hover:-translate-y-1' : ''
                  }`}>
                    {/* Ribbon bow at top */}
                    <div className="w-8 h-4 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full shadow-md -mb-1 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-slate-950" />
                    </div>
                    {/* Box Lid */}
                    <div className="w-24 h-6 bg-[#252936] rounded-t-lg border-b-2 border-amber-500/50 shadow-md relative flex items-center justify-center">
                      <div className="w-4 h-full bg-gradient-to-b from-amber-400 to-yellow-500" />
                    </div>
                    {/* Box Body */}
                    <div className="w-22 h-18 bg-gradient-to-b from-[#1F222E] to-[#12141A] rounded-b-xl border-t border-amber-500/40 shadow-xl relative flex items-center justify-center">
                      {/* Vertical Ribbon */}
                      <div className="w-4 h-full bg-gradient-to-b from-amber-400 to-yellow-500" />
                      {/* Horizontal Ribbon */}
                      <div className="absolute w-full h-4 bg-gradient-to-r from-amber-400 to-yellow-500" />
                    </div>
                  </div>
                )}
              </div>

              {/* Status text below box */}
              <div className="mt-3 text-xs font-bold">
                {isOpened ? (
                  <span className="text-amber-400 font-extrabold">{box.prize.name}</span>
                ) : isOther ? (
                  showAllPrizes ? (
                    <span className="text-neutral-400">{box.prize.name} ({box.prize.icon})</span>
                  ) : (
                    <span className="text-neutral-500 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> مقفل
                    </span>
                  )
                ) : (
                  <span className="text-amber-300">اضغط للاختيار</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Auxiliary Buttons */}
      {selectedBoxId !== null && (
        <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
          <button
            id="btn-retry-mystery"
            type="button"
            onClick={resetGame}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm flex items-center gap-2 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>جرّب صندوقاً آخر</span>
          </button>

          {!showAllPrizes && (
            <button
              id="btn-reveal-other-boxes"
              type="button"
              onClick={() => {
                sounds.playClick();
                setShowAllPrizes(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#161820] hover:bg-[#1E222D] text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>ماذا كان في الصناديق الأخرى؟</span>
            </button>
          )}
        </div>
      )}

      {/* Prize Reveal Modal */}
      {winningPrize && (
        <PrizeRevealModal
          prize={winningPrize}
          onReset={resetGame}
          onBackToGrid={onBackToGrid}
          gameTitle="صناديق الحظ"
        />
      )}
    </div>
  );
};
