import React, { useState, useRef, useEffect } from 'react';
import { STANDARD_PRIZES } from '../../data/prizes';
import { Prize } from '../../types';
import { triggerConfetti } from '../../utils/confetti';
import { sounds } from '../../utils/sound';
import { PrizeRevealModal } from '../PrizeRevealModal';
import { RotateCw, Sparkles } from 'lucide-react';

interface SpinWheelGameProps {
  onBackToGrid: () => void;
}

export const SpinWheelGame: React.FC<SpinWheelGameProps> = ({ onBackToGrid }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const lastTickRef = useRef<number>(0);

  const prizes = STANDARD_PRIZES;
  const numSlices = prizes.length;
  const sliceAngle = 360 / numSlices;

  // Wheel slice background colors in luxury black and gold palette
  const sliceColors = [
    '#D4AF37', // Pure gold
    '#1A1D26', // Obsidian dark
    '#F59E0B', // Amber gold
    '#252936', // Charcoal dark
    '#EAB308', // Warm yellow gold
    '#323748', // Deep slate dark
  ];

  const spin = () => {
    if (isSpinning) return;
    sounds.playClick();
    setIsSpinning(true);
    setSelectedPrize(null);

    // Pick random prize index
    const prizeIndex = Math.floor(Math.random() * numSlices);
    const winningPrize = prizes[prizeIndex];

    // Calculate rotation:
    // In our SVG/canvas coordinate system, pointer is at the TOP (270 deg or -90 deg).
    // The winning slice center needs to align with the pointer at top.
    // Let's add 5-8 full spins (1800 - 2880 deg) + angle to land in center of slice.
    const fullSpins = 360 * (5 + Math.floor(Math.random() * 3));
    
    // Slice angle offset: slice i spans [i * sliceAngle, (i + 1) * sliceAngle]
    // Top pointer corresponds to 270 degrees in standard math (or -90 deg)
    const sliceCenterAngle = prizeIndex * sliceAngle + sliceAngle / 2;
    // To align sliceCenterAngle with 270 deg (top):
    const targetAngle = 270 - sliceCenterAngle;
    const finalRotation = rotation + fullSpins + ((targetAngle - (rotation % 360) + 360) % 360);

    const startTime = performance.now();
    const duration = 4500; // 4.5 seconds spin
    const startRotation = rotation;
    const totalDelta = finalRotation - startRotation;

    // Cubic ease out function
    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3);
    };

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const currentRot = startRotation + totalDelta * easedProgress;

      // Tick sound every time a pin is crossed (every sliceAngle degrees)
      const currentPin = Math.floor(currentRot / sliceAngle);
      if (currentPin !== lastTickRef.current) {
        lastTickRef.current = currentPin;
        // Frequency changes slightly as it slows
        sounds.playTick(450 + (1 - progress) * 150);
      }

      setRotation(currentRot);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        setSelectedPrize(winningPrize);
        if (winningPrize.type !== 'none') {
          triggerConfetti();
          sounds.playWin();
        } else {
          sounds.playMiss();
        }
      }
    };

    requestAnimationFrame(animate);
  };

  const reset = () => {
    setSelectedPrize(null);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto text-center">
      {/* Game Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>الأكثر طلباً لمواقع المطاعم</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
          عجلة الحظ الدوّارة 🎡
        </h2>
        <p className="text-sm text-neutral-400 max-w-md mx-auto">
          اضغط على "دوّر العجلة" واكتشف هديتك الفورية لزيارتك القادمة للمطعم!
        </p>
      </div>

      {/* Wheel Stage */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 my-4 flex items-center justify-center">
        {/* Outer glowing ring & gold border */}
        <div className="absolute inset-0 rounded-full border-4 border-amber-400/80 shadow-[0_0_35px_rgba(245,158,11,0.25)] bg-[#12141A] pointer-events-none" />

        {/* Decorative perimeter bulbs */}
        <div className="absolute inset-1 rounded-full border border-amber-500/30 pointer-events-none flex items-center justify-center">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 rounded-full transition-colors duration-300 ${
                isSpinning
                  ? i % 2 === 0 ? 'bg-amber-400 shadow-[0_0_8px_#FBBF24]' : 'bg-yellow-200 shadow-[0_0_8px_#FEF08A]'
                  : 'bg-amber-600'
              }`}
              style={{
                transform: `rotate(${i * 30}deg) translateY(-138px)`,
              }}
            />
          ))}
        </div>

        {/* Pointer at the TOP */}
        <div className="absolute -top-3 z-30 flex flex-col items-center pointer-events-none">
          <div className="w-6 h-8 bg-gradient-to-b from-amber-400 to-yellow-600 shadow-xl clip-triangle filter drop-shadow-[0_4px_6px_rgba(245,158,11,0.5)]" 
               style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }} />
          <div className="w-3.5 h-3.5 rounded-full bg-slate-950 -mt-7 shadow-md border border-amber-400" />
        </div>

        {/* The Rotating Wheel (SVG) */}
        <svg
          viewBox="0 0 300 300"
          className="w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden shadow-inner select-none"
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: '50% 50%',
          }}
        >
          <g transform="translate(150, 150)">
            {prizes.map((prize, idx) => {
              const startAngle = (idx * sliceAngle * Math.PI) / 180;
              const endAngle = ((idx + 1) * sliceAngle * Math.PI) / 180;
              const radius = 145;

              const x1 = radius * Math.cos(startAngle);
              const y1 = radius * Math.sin(startAngle);
              const x2 = radius * Math.cos(endAngle);
              const y2 = radius * Math.sin(endAngle);

              const textAngle = idx * sliceAngle + sliceAngle / 2;

              return (
                <g key={prize.id}>
                  {/* Slice Path */}
                  <path
                    d={`M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`}
                    fill={sliceColors[idx % sliceColors.length]}
                    stroke="#D4AF37"
                    strokeWidth="1.5"
                  />
                  {/* Slice Content (Icon + Text) */}
                  <g transform={`rotate(${textAngle}) translate(92, 0)`}>
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="Tajawal, sans-serif"
                      transform="rotate(90)"
                      className="select-none pointer-events-none drop-shadow"
                    >
                      {prize.name}
                    </text>
                    <text
                      x="0"
                      y="-22"
                      textAnchor="middle"
                      fontSize="18"
                      transform="rotate(90)"
                      className="select-none pointer-events-none"
                    >
                      {prize.icon}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Center Hub Button */}
        <button
          id="btn-spin-wheel-center"
          type="button"
          onClick={spin}
          disabled={isSpinning}
          className={`absolute z-20 w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl flex flex-col items-center justify-center border-4 border-[#12141A] transition-all ${
            isSpinning 
              ? 'opacity-80 scale-95 cursor-not-allowed' 
              : 'hover:scale-105 active:scale-95 cursor-pointer shadow-amber-500/30 animate-pulse'
          }`}
        >
          <RotateCw className={`w-4 h-4 mb-0.5 text-slate-950 stroke-[2.5] ${isSpinning ? 'animate-spin' : ''}`} />
          <span>{isSpinning ? '...' : 'دوّر'}</span>
        </button>
      </div>

      {/* Main Spin CTA Button */}
      <div className="mt-4">
        <button
          id="btn-spin-wheel"
          type="button"
          onClick={spin}
          disabled={isSpinning}
          className={`px-8 py-3.5 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2 shadow-xl cursor-pointer ${
            isSpinning
              ? 'bg-[#1A1D26] text-neutral-500 cursor-not-allowed border border-neutral-800'
              : 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-amber-500/20 active:scale-95 hover:shadow-amber-500/30 ring-2 ring-amber-400/50'
          }`}
        >
          <RotateCw className={`w-5 h-5 text-slate-950 stroke-[2.5] ${isSpinning ? 'animate-spin' : ''}`} />
          <span>{isSpinning ? 'العجلة تدور الآن...' : 'دوّر العجلة واربح!'}</span>
        </button>
      </div>

      {/* Prize Reveal Modal */}
      {selectedPrize && (
        <PrizeRevealModal
          prize={selectedPrize}
          onReset={reset}
          onBackToGrid={onBackToGrid}
          gameTitle="عجلة الحظ"
        />
      )}
    </div>
  );
};
