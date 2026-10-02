import React, { useState } from 'react';
import { getRandomPrize } from '../../data/prizes';
import { Prize } from '../../types';
import { triggerConfetti } from '../../utils/confetti';
import { sounds } from '../../utils/sound';
import { PrizeRevealModal } from '../PrizeRevealModal';
import { Sparkles, HelpCircle, CheckCircle2, XCircle, RotateCcw, ArrowRight } from 'lucide-react';

interface GuessDishGameProps {
  onBackToGrid: () => void;
}

interface DishQuestion {
  id: number;
  emoji: string;
  mysteryHint: string;
  zoomClass: string;
  options: string[];
  correctIndex: number;
  ingredientsClue: string;
}

const QUESTIONS: DishQuestion[] = [
  {
    id: 1,
    emoji: '🍔',
    mysteryHint: 'شريحتان من اللحم البقري المشوي على اللهب، تعلوهما جبنة شيدر ذائبة مع صوص المدخن الخاص.',
    zoomClass: 'scale-150',
    options: [
      'برجر دبل بيف بلاك أنجوس بالجبن',
      'ساندوتش كودو دجاج سبايسي',
      'برجر سمك فيليه مقرمش',
      'تشيز ستيك مشروم لحم',
    ],
    correctIndex: 0,
    ingredientsClue: 'لحم بقري فاخر، جبن شيدر، خبز بريوش، صوص سموكي',
  },
  {
    id: 2,
    emoji: '🍕',
    mysteryHint: 'عجينة رقيقة مخبوزة على الحطب الإيطالي، مغطاة بقطع البيبروني المتبلة وجبنة الموزاريلا الفاخرة.',
    zoomClass: 'scale-150',
    options: [
      'فطيرة زعتر بالجبن البلدي',
      'بيتزا بيبروني نابوليتانا كلاسيك',
      'كساديا دجاج مكسيكية',
      'مناقيش لحمة بعجين',
    ],
    correctIndex: 1,
    ingredientsClue: 'صلصة طماطم سان مارزانو، موزاريلا، شرائح بيبروني مقرمشة',
  },
  {
    id: 3,
    emoji: '🌮',
    mysteryHint: 'خبز تورتيلا دافئ محشو بشرائح الدجاج المتبل مع هالبينو وصوص الجواكامولي الطازج.',
    zoomClass: 'scale-150',
    options: [
      'شاورما دجاج صاروخ بالثوم',
      'ساندوتش فلافل مشكل',
      'تاكو دجاج كرسبي مع جواكامولي',
      'بريتو لحم مفروم بالجبن',
    ],
    correctIndex: 2,
    ingredientsClue: 'تورتيلا مقرمشة، دجاج متبل، جواكامولي، صوص ليمون',
  },
];

export const GuessDishGame: React.FC<GuessDishGameProps> = ({ onBackToGrid }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);

  const question = QUESTIONS[currentQuestionIndex];

  const handleSelectOption = (idx: number) => {
    if (isAnswered && isCorrect) return; // already solved correctly
    sounds.playClick();
    setSelectedOption(idx);
    setIsAnswered(true);

    if (idx === question.correctIndex) {
      // Correct!
      setIsCorrect(true);
      sounds.playWin();
      triggerConfetti();
      setWonPrize(getRandomPrize(false));
    } else {
      // Wrong!
      setIsCorrect(false);
      sounds.playMiss();
    }
  };

  const nextQuestion = () => {
    sounds.playClick();
    const nextIdx = (currentQuestionIndex + 1) % QUESTIONS.length;
    setCurrentQuestionIndex(nextIdx);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrect(false);
    setWonPrize(null);
  };

  const restartCurrent = () => {
    sounds.playClick();
    setSelectedOption(null);
    setIsAnswered(false);
    setIsCorrect(false);
    setWonPrize(null);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto text-center">
      {/* Game Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-2">
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>تحدي المعرفة بأصناف المطعم</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
          خمّن الطبق المجهول 🔍
        </h2>
        <p className="text-sm text-neutral-400 max-w-md mx-auto">
          انظر إلى تفاصيل ومكونات الطبق المقطوعة، واختر الاسم الصحيح لتربح هديتك الفورية!
        </p>
      </div>

      {/* Question Counter */}
      <div className="w-full max-w-md flex items-center justify-between text-xs text-neutral-400 mb-3 px-1">
        <span>سؤال {currentQuestionIndex + 1} من {QUESTIONS.length}</span>
        <span className="text-amber-400 font-bold">مستوى الصعوبة: متوسط ⭐</span>
      </div>

      {/* Mystery Dish Card Viewer */}
      <div className="w-full max-w-md bg-[#161820] border border-amber-500/30 rounded-3xl p-5 shadow-xl shadow-amber-500/10 relative overflow-hidden mb-6">
        {/* The Mystery Zoomed Viewport */}
        <div className="relative w-full h-44 rounded-2xl bg-[#0E1015] border border-amber-500/30 overflow-hidden flex items-center justify-center shadow-inner">
          {/* Zoomed / Cropped Emoji Visual */}
          <div className={`transition-all duration-700 flex items-center justify-center ${
            isCorrect ? 'scale-100' : 'scale-200 blur-[2px]'
          }`}>
            <span className="text-8xl select-none filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
              {question.emoji}
            </span>
          </div>

          {/* Silhouette overlay if not solved */}
          {!isCorrect && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-amber-400/80 bg-[#161820]/80 flex items-center justify-center">
                <span className="text-3xl text-amber-400 font-black animate-pulse">؟</span>
              </div>
            </div>
          )}

          {/* Reveal badge upon winning */}
          {isCorrect && (
            <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-lg animate-in zoom-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
              <span>تم كشف الطبق بنجاح!</span>
            </div>
          )}
        </div>

        {/* Dish Clues */}
        <div className="mt-4 text-right bg-[#1A1D26] p-3.5 rounded-2xl border border-amber-500/20">
          <div className="text-xs font-bold text-amber-300 mb-1">
            💡 لمحة عن مكونات الطبق:
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed mb-2">
            {question.mysteryHint}
          </p>
          <div className="text-[11px] text-neutral-400">
            <span className="text-amber-400 font-bold">المكونات:</span> {question.ingredientsClue}
          </div>
        </div>
      </div>

      {/* 4 Choices */}
      <div className="w-full max-w-md grid grid-cols-1 gap-2.5 mb-6">
        {question.options.map((option, idx) => {
          const isSelected = selectedOption === idx;
          const isThisCorrect = idx === question.correctIndex;

          let btnStyle = 'bg-[#161820] border-amber-500/20 text-neutral-200 hover:border-amber-400 hover:bg-[#1E222D]';

          if (isAnswered) {
            if (isThisCorrect) {
              btnStyle = 'bg-amber-950/40 border-amber-400 text-amber-300 ring-2 ring-amber-400/40 shadow-md';
            } else if (isSelected && !isThisCorrect) {
              btnStyle = 'bg-red-950/40 border-red-500 text-red-300 ring-1 ring-red-400/40';
            }
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectOption(idx)}
              className={`w-full p-3.5 rounded-2xl border text-right font-bold text-sm transition-all flex items-center justify-between gap-3 shadow-xs cursor-pointer ${btnStyle}`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#1F222E] text-xs flex items-center justify-center font-mono text-amber-400 font-bold border border-amber-500/30">
                  {idx + 1}
                </span>
                <span>{option}</span>
              </div>

              {isAnswered && (
                <div>
                  {isThisCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-amber-400" />
                  ) : isSelected ? (
                    <XCircle className="w-5 h-5 text-red-400" />
                  ) : null}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Answer Feedback Banner */}
      {isAnswered && !isCorrect && (
        <div className="w-full max-w-md p-3 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-bold mb-4 flex items-center justify-between">
          <span>إجابة خاطئة! حاول مرة ثانية واختر طبقاً آخر ❌</span>
          <button
            type="button"
            onClick={restartCurrent}
            className="text-xs underline hover:text-red-200 cursor-pointer text-red-300"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Question Navigation */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={nextQuestion}
          className="px-5 py-2.5 rounded-xl bg-[#161820] hover:bg-[#1E222D] text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>السؤال التالي</span>
          <ArrowRight className="w-3.5 h-3.5 rotate-180 text-amber-400" />
        </button>
      </div>

      {/* Prize Reveal Modal */}
      {wonPrize && (
        <PrizeRevealModal
          prize={wonPrize}
          onReset={restartCurrent}
          onBackToGrid={onBackToGrid}
          gameTitle="خمّن الطبق"
        />
      )}
    </div>
  );
};
