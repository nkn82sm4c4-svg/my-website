import React, { useState } from 'react';
import { GameId, OwnerFeedbackState, FeedbackStatus } from './types';
import { GAMES_CATALOG } from './data/games';
import { GameCard } from './components/GameCard';
import { OwnerDecisionModal } from './components/OwnerDecisionModal';

// Game components
import { SpinWheelGame } from './components/games/SpinWheelGame';
import { ScratchCardGame } from './components/games/ScratchCardGame';
import { MysteryBoxGame } from './components/games/MysteryBoxGame';
import { SlotMachineGame } from './components/games/SlotMachineGame';
import { MemoryMatchGame } from './components/games/MemoryMatchGame';
import { GuessDishGame } from './components/games/GuessDishGame';

import { 
  UtensilsCrossed, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Volume2, 
  VolumeX 
} from 'lucide-react';
import { sounds } from './utils/sound';

export default function App() {
  const [activeGameId, setActiveGameId] = useState<GameId | null>(null);
  const [feedback, setFeedback] = useState<OwnerFeedbackState>({});
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showDecisionModal, setShowDecisionModal] = useState<boolean>(false);

  // Toggle Sound
  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    sounds.enabled = nextState;
    if (nextState) sounds.playClick();
  };

  // Handle owner feedback for a game
  const handleFeedback = (gameId: GameId, status: FeedbackStatus) => {
    setFeedback(prev => ({
      ...prev,
      [gameId]: status,
    }));
  };

  const activeGame = GAMES_CATALOG.find(g => g.id === activeGameId);
  const activeGameIndex = activeGameId 
    ? GAMES_CATALOG.findIndex(g => g.id === activeGameId) 
    : -1;

  // Liked count
  const likedCount = Object.values(feedback).filter(s => s === 'liked').length;

  // Next / Prev Game navigation
  const navigateGame = (direction: 'next' | 'prev') => {
    sounds.playClick();
    if (activeGameIndex === -1) return;
    let nextIndex = direction === 'next' ? activeGameIndex + 1 : activeGameIndex - 1;
    if (nextIndex < 0) nextIndex = GAMES_CATALOG.length - 1;
    if (nextIndex >= GAMES_CATALOG.length) nextIndex = 0;
    setActiveGameId(GAMES_CATALOG[nextIndex].id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0D0E12] text-neutral-100 flex flex-col font-['Tajawal',sans-serif]">
      {/* Top Brand Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#13151B]/95 backdrop-blur-md border-b border-amber-500/20 px-4 sm:px-6 py-3.5 shadow-lg shadow-black/40 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo / Brand Name */}
          <div 
            onClick={() => {
              sounds.playClick();
              setActiveGameId(null);
            }}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform font-bold">
              <UtensilsCrossed className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-black text-lg text-white group-hover:text-amber-400 transition-colors">
                معرض ألعاب المطاعم
              </span>
            </div>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sound Toggle */}
            <button
              id="btn-sound-toggle"
              type="button"
              onClick={toggleSound}
              title={soundEnabled ? 'كتم المؤثرات الصوتية' : 'تشغيل المؤثرات الصوتية'}
              className="w-10 h-10 rounded-xl bg-[#1A1D26] hover:bg-[#222632] border border-amber-500/20 text-amber-400 hover:text-amber-300 flex items-center justify-center transition-colors shadow-xs"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-amber-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-neutral-500" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* VIEW 1: HOME PAGE GRID (8 Cards) */}
        {!activeGameId ? (
          <div>
            {/* Grid of 8 Games */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-2 mb-8">
              {GAMES_CATALOG.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  feedbackStatus={feedback[game.id] || null}
                  onSelectGame={(id) => {
                    setActiveGameId(id as GameId);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          /* VIEW 2: ACTIVE GAME INTERACTIVE PLAYGROUND */
          <div className="w-full py-2">
            {/* Top Navigation Bar inside Game View */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-amber-500/20">
              <button
                id="btn-back-to-home"
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setActiveGameId(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-4 py-2.5 rounded-2xl bg-[#161820] hover:bg-[#1E222D] text-amber-300 border border-amber-500/30 hover:border-amber-400/60 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors shadow-sm group cursor-pointer"
              >
                <ArrowRight className="w-4 h-4 text-amber-400 transition-transform group-hover:translate-x-1" />
                <span>العودة لجميع الأفكار</span>
              </button>

              {/* Prev / Next Game Switcher */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400 font-bold hidden sm:inline">
                  الفكرة {activeGameIndex + 1} من {GAMES_CATALOG.length}
                </span>

                <div className="flex items-center gap-1 bg-[#161820] p-1 rounded-2xl border border-amber-500/30 shadow-xs">
                  <button
                    type="button"
                    onClick={() => navigateGame('prev')}
                    title="الفكرة السابقة"
                    className="w-8 h-8 rounded-xl hover:bg-[#222632] flex items-center justify-center text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateGame('next')}
                    title="الفكرة التالية"
                    className="w-8 h-8 rounded-xl hover:bg-[#222632] flex items-center justify-center text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Game Component Container */}
            <div className="min-h-[460px] flex flex-col justify-center">
              {activeGameId === 'wheel' && (
                <SpinWheelGame onBackToGrid={() => setActiveGameId(null)} />
              )}
              {activeGameId === 'scratch' && (
                <ScratchCardGame onBackToGrid={() => setActiveGameId(null)} />
              )}
              {activeGameId === 'mystery' && (
                <MysteryBoxGame onBackToGrid={() => setActiveGameId(null)} />
              )}
              {activeGameId === 'slot' && (
                <SlotMachineGame onBackToGrid={() => setActiveGameId(null)} />
              )}
              {activeGameId === 'memory' && (
                <MemoryMatchGame onBackToGrid={() => setActiveGameId(null)} />
              )}
              {activeGameId === 'guess' && (
                <GuessDishGame onBackToGrid={() => setActiveGameId(null)} />
              )}
            </div>

          </div>
        )}
      </main>

      {/* Decision Summary Modal */}
      {showDecisionModal && (
        <OwnerDecisionModal
          feedback={feedback}
          onClose={() => setShowDecisionModal(false)}
          onSelectGame={(id) => {
            setActiveGameId(id as GameId);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}
    </div>
  );
}
