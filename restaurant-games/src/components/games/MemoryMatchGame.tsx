import React, { useState, useEffect } from 'react';
import { getRandomPrize } from '../../data/prizes';
import { Prize } from '../../types';
import { triggerConfetti } from '../../utils/confetti';
import { sounds } from '../../utils/sound';
import { PrizeRevealModal } from '../PrizeRevealModal';
import { Sparkles, RotateCcw, Brain, CheckCircle2 } from 'lucide-react';

interface MemoryMatchGameProps {
  onBackToGrid: () => void;
}

interface CardItem {
  id: number;
  symbol: string;
  name: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const FOOD_PAIRS = [
  { symbol: '🍔', name: 'برجر' },
  { symbol: '🍕', name: 'بيتزا' },
  { symbol: '🍟', name: 'بطاطس' },
  { symbol: '🥤', name: 'مشروب' },
  { symbol: '🌮', name: 'تاكو' },
  { symbol: '🍩', name: 'دونات' },
  { symbol: '🍦', name: 'آيسكريم' },
  { symbol: '☕', name: 'قهوة' },
];

export const MemoryMatchGame: React.FC<MemoryMatchGameProps> = ({ onBackToGrid }) => {
  const [cards, setCards] = useState<CardItem[]>(() => setupBoard());
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [movesCount, setMovesCount] = useState<number>(0);
  const [matchedCount, setMatchedCount] = useState<number>(0);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);

  function setupBoard(): CardItem[] {
    const deck: CardItem[] = [];
    FOOD_PAIRS.forEach((food, index) => {
      deck.push({ id: index * 2, symbol: food.symbol, name: food.name, isFlipped: false, isMatched: false });
      deck.push({ id: index * 2 + 1, symbol: food.symbol, name: food.name, isFlipped: false, isMatched: false });
    });
    // Shuffle
    return deck.sort(() => Math.random() - 0.5);
  }

  const handleCardClick = (index: number) => {
    const card = cards[index];
    // Ignore if card already flipped or matched, or if 2 cards already being compared
    if (card.isFlipped || card.isMatched || flippedIndices.length >= 2) {
      return;
    }

    sounds.playClick();
    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    setCards(prev => prev.map((c, i) => (i === index ? { ...c, isFlipped: true } : c)));

    if (newFlipped.length === 2) {
      setMovesCount(prev => prev + 1);
      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = cards[firstIdx];
      const secondCard = cards[secondIdx];

      if (firstCard.symbol === secondCard.symbol) {
        // MATCH!
        sounds.playSuccess();
        setTimeout(() => {
          setCards(prev =>
            prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, isMatched: true } : c
            )
          );
          setFlippedIndices([]);
          setMatchedCount(prev => {
            const nextCount = prev + 1;
            if (nextCount === FOOD_PAIRS.length) {
              // ALL MATCHED - VICTORY!
              sounds.playWin();
              triggerConfetti();
              setWonPrize(getRandomPrize(false));
            }
            return nextCount;
          });
        }, 350);
      } else {
        // NO MATCH -> Flip back after delay
        setTimeout(() => {
          sounds.playMiss();
          setCards(prev =>
            prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedIndices([]);
        }, 850);
      }
    }
  };

  const restart = () => {
    sounds.playClick();
    setCards(setupBoard());
    setFlippedIndices([]);
    setMovesCount(0);
    setMatchedCount(0);
    setWonPrize(null);
  };

  // Quick auto-solve for the demo presentation
  const autoSolveDemo = () => {
    sounds.playWin();
    triggerConfetti();
    setCards(prev => prev.map(c => ({ ...c, isFlipped: true, isMatched: true })));
    setMatchedCount(FOOD_PAIRS.length);
    setWonPrize(getRandomPrize(false));
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto text-center">
      {/* Game Header */}
      <div className="mb-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-2">
          <Brain className="w-3.5 h-3.5 text-amber-400" />
          <span>تفاعل ذهني وترويج لأطباق المنيو</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">
          لعبة ذاكرة المنيو 🧠
        </h2>
        <p className="text-sm text-neutral-400 max-w-md mx-auto">
          اقلب البطاقات وطابق أزواج أطباق المطعم لكشف جائزتك النهائية!
        </p>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center justify-between w-full max-w-sm mb-4 px-4 py-2.5 rounded-2xl bg-[#161820] border border-amber-500/30 text-xs sm:text-sm shadow-sm">
        <div className="flex items-center gap-1 text-neutral-400">
          <span>المحاولات:</span>
          <span className="font-bold text-amber-400">{movesCount}</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-400 font-bold">
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          <span>الأزواج: {matchedCount} من {FOOD_PAIRS.length}</span>
        </div>
        <button
          type="button"
          onClick={restart}
          className="text-neutral-400 hover:text-amber-400 flex items-center gap-1 text-xs cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>إعادة</span>
        </button>
      </div>

      {/* 4x4 Grid */}
      <div className="grid grid-cols-4 gap-2.5 sm:gap-3 w-full max-w-sm sm:max-w-md p-3 sm:p-4 rounded-3xl bg-[#161820] border border-amber-500/30 shadow-xl shadow-amber-500/10">
        {cards.map((card, index) => {
          const isOpen = card.isFlipped || card.isMatched;

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => handleCardClick(index)}
              disabled={card.isMatched || flippedIndices.length >= 2}
              className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative select-none transform ${
                card.isMatched
                  ? 'bg-amber-950/40 border-2 border-amber-400 text-white shadow-md scale-95 ring-1 ring-amber-400/30'
                  : isOpen
                  ? 'bg-[#1F222E] border-2 border-amber-400 shadow-md scale-100 rotate-0'
                  : 'bg-[#12141A] hover:bg-[#1A1D26] border border-amber-500/30 text-amber-400 hover:scale-105 active:scale-95 cursor-pointer shadow-xs'
              }`}
            >
              {isOpen ? (
                <div className="flex flex-col items-center animate-in zoom-in-75 duration-200">
                  <span className="text-3xl sm:text-4xl">{card.symbol}</span>
                  <span className="text-[10px] sm:text-xs font-bold text-neutral-200 mt-1">
                    {card.name}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-2xl text-amber-400 font-black">؟</span>
                  <span className="text-[9px] text-amber-500/80 font-bold mt-0.5">مطعمنا</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Demo fast-forward */}
      {matchedCount < FOOD_PAIRS.length && (
        <div className="mt-4">
          <button
            type="button"
            onClick={autoSolveDemo}
            className="text-xs text-amber-300 hover:text-amber-200 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#161820] border border-amber-500/30 hover:bg-[#1F222E] shadow-sm transition-colors cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>عرض توضيحي: إكمال اللعبة فوراً كفائز</span>
          </button>
        </div>
      )}

      {/* Prize Reveal Modal */}
      {wonPrize && (
        <PrizeRevealModal
          prize={wonPrize}
          onReset={restart}
          onBackToGrid={onBackToGrid}
          gameTitle="لعبة الذاكرة"
        />
      )}
    </div>
  );
};
