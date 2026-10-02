import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getRandomPrize } from '../../data/prizes';
import { Prize } from '../../types';
import { triggerConfetti } from '../../utils/confetti';
import { sounds } from '../../utils/sound';
import { Sparkles, RotateCcw, HandMetal, Check } from 'lucide-react';
import { PrizeRevealModal } from '../PrizeRevealModal';

interface ScratchCardGameProps {
  onBackToGrid: () => void;
}

export const ScratchCardGame: React.FC<ScratchCardGameProps> = ({ onBackToGrid }) => {
  const [currentPrize, setCurrentPrize] = useState<Prize>(() => getRandomPrize(false));
  const [scratchPercent, setScratchPercent] = useState<number>(0);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [isScratching, setIsScratching] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize Canvas Coating
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Reset composite operation to normal for painting coating
    ctx.globalCompositeOperation = 'source-over';

    // Metallic gold foil gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#B8860B'); // Dark goldenrod
    grad.addColorStop(0.3, '#E5C158'); // Amber gold
    grad.addColorStop(0.5, '#FFF2B2'); // Bright shimmer
    grad.addColorStop(0.7, '#D4AF37'); // Metallic gold
    grad.addColorStop(1, '#996515'); // Deep bronze gold

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Decorative speckles / pattern on foil
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    for (let i = 0; i < 60; i++) {
      const rx = Math.random() * width;
      const ry = Math.random() * height;
      const r = Math.random() * 2 + 1;
      ctx.beginPath();
      ctx.arc(rx, ry, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Border on foil
    ctx.strokeStyle = '#6B4E12';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, width - 12, height - 12);

    // Overlay Instructions text
    ctx.fillStyle = '#2B1A00';
    ctx.font = 'bold 16px Tajawal, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🪙 اخدش هنا بالماوس أو بإصبعك 🪙', width / 2, height / 2 - 12);

    ctx.fillStyle = '#5A3D08';
    ctx.font = 'bold 12px Tajawal, sans-serif';
    ctx.fillText('امسح الطبقة الذهبية لتكشف هديتك', width / 2, height / 2 + 16);

    setScratchPercent(0);
    setIsRevealed(false);
  }, []);

  useEffect(() => {
    initCanvas();
  }, [initCanvas, currentPrize]);

  // Check how much is scratched
  const checkScratchedPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const width = canvas.width;
      const height = canvas.height;
      // Sample step for performance (check 1 in every 16 pixels)
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      let transparentPixels = 0;
      const totalPixels = data.length / 4;

      for (let i = 3; i < data.length; i += 16) {
        if (data[i] < 128) {
          transparentPixels++;
        }
      }

      const percentage = Math.round((transparentPixels / (totalPixels / 4)) * 100);
      setScratchPercent(Math.min(percentage, 100));

      if (percentage >= 45 && !isRevealed) {
        // Auto-reveal fully!
        setIsRevealed(true);
        sounds.playWin();
        triggerConfetti();
        // Clear canvas cleanly
        ctx.clearRect(0, 0, width, height);
      }
    } catch {
      // Ignored if canvas cross-origin or restricted
    }
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const scratchAt = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = 36;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    if (lastPointRef.current) {
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    lastPointRef.current = { x, y };
    sounds.playScratch();
  };

  const handleStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isRevealed) return;
    isDrawingRef.current = true;
    setIsScratching(true);
    const coords = getCanvasCoords(e);
    if (coords) {
      lastPointRef.current = coords;
      scratchAt(coords.x, coords.y);
    }
  };

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || isRevealed) return;
    if ('touches' in e) {
      // Prevent scrolling while scratching
      e.preventDefault();
    }
    const coords = getCanvasCoords(e);
    if (coords) {
      scratchAt(coords.x, coords.y);
      // Periodic check
      if (Math.random() < 0.3) {
        checkScratchedPercentage();
      }
    }
  };

  const handleEnd = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
    setIsScratching(false);
    checkScratchedPercentage();
  };

  const resetWithNewPrize = () => {
    sounds.playClick();
    setCurrentPrize(getRandomPrize(false));
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto text-center">
      {/* Game Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>تفاعل لمسي حقيقي (Touch & Drag)</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
          بطاقة الخدش والمفاجآت 🪙
        </h2>
        <p className="text-sm text-neutral-400 max-w-md mx-auto">
          حرّك الماوس أو إصبعك فوق المنطقة الذهبية لخدشها وكشف هديتك الخفية!
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="w-72 sm:w-80 mb-3 flex items-center justify-between text-xs text-neutral-400">
        <span>نسبة الخدش:</span>
        <span className="font-bold text-amber-400">{scratchPercent}%</span>
      </div>
      <div className="w-72 sm:w-80 h-2 bg-[#1A1D26] rounded-full mb-6 overflow-hidden border border-neutral-800">
        <div
          className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 transition-all duration-150"
          style={{ width: `${scratchPercent}%` }}
        />
      </div>

      {/* The Scratch Card Container */}
      <div className="relative w-80 h-52 sm:w-96 sm:h-60 rounded-3xl p-1 bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-500 shadow-2xl shadow-amber-500/15 select-none">
        <div className="relative w-full h-full rounded-[22px] overflow-hidden bg-[#161820] flex items-center justify-center border border-amber-500/30">
          {/* UNDERNEATH LAYER: The Revealed Prize */}
          <div className="absolute inset-0 p-5 flex flex-col items-center justify-center text-center bg-gradient-to-b from-[#181A22] via-[#14161D] to-[#181A22]">
            <div className="w-16 h-16 rounded-2xl bg-[#1F222E] border border-amber-500/30 flex items-center justify-center text-4xl mb-2 shadow-inner animate-bounce">
              {currentPrize.icon}
            </div>
            <div className="text-xs font-bold text-amber-400 mb-0.5">مبروك فزت بـ</div>
            <div className="text-xl sm:text-2xl font-black text-white mb-1">
              {currentPrize.name}
            </div>
            <div className="text-xs text-neutral-400 mb-2">
              {currentPrize.valueText}
            </div>
            {currentPrize.code && (
              <div className="px-3 py-1 bg-[#1A1D26] border border-dashed border-amber-500/40 rounded-lg text-amber-300 font-mono text-xs font-bold">
                كود: {currentPrize.code}
              </div>
            )}
          </div>

          {/* TOP LAYER: Canvas Scratch Surface */}
          <canvas
            ref={canvasRef}
            width={384}
            height={240}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            className={`absolute inset-0 w-full h-full cursor-crosshair touch-none transition-opacity duration-500 ${
              isRevealed ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          />
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-3 mt-6">
        <button
          id="btn-new-scratch-card"
          type="button"
          onClick={resetWithNewPrize}
          className="px-6 py-3 rounded-xl bg-[#161820] hover:bg-[#1E222D] text-amber-300 border border-amber-500/30 text-sm font-bold flex items-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-amber-400" />
          <span>بطاقة خدش جديدة</span>
        </button>

        {!isRevealed && (
          <button
            id="btn-auto-scratch"
            type="button"
            onClick={() => {
              sounds.playWin();
              triggerConfetti();
              setIsRevealed(true);
              setScratchPercent(100);
            }}
            className="px-4 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>كشف تلقائي سريع</span>
          </button>
        )}
      </div>

      {/* Prize Result Card */}
      {isRevealed && (
        <PrizeRevealModal
          prize={currentPrize}
          onReset={resetWithNewPrize}
          onBackToGrid={onBackToGrid}
          gameTitle="بطاقة الخدش"
        />
      )}
    </div>
  );
};
