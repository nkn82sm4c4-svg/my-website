import React from 'react';
import { GameDefinition, FeedbackStatus } from '../types';
import { 
  Disc, 
  Sparkles, 
  Gift, 
  Coins, 
  Brain, 
  Flame, 
  HelpCircle, 
  Award,
  ArrowLeft,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { sounds } from '../utils/sound';

interface GameCardProps {
  game: GameDefinition;
  feedbackStatus: FeedbackStatus;
  onSelectGame: (gameId: string) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Disc: <Disc className="w-7 h-7" />,
  Sparkles: <Sparkles className="w-7 h-7" />,
  Gift: <Gift className="w-7 h-7" />,
  Coins: <Coins className="w-7 h-7" />,
  Brain: <Brain className="w-7 h-7" />,
  Flame: <Flame className="w-7 h-7" />,
  HelpCircle: <HelpCircle className="w-7 h-7" />,
  Award: <Award className="w-7 h-7" />,
};

export const GameCard: React.FC<GameCardProps> = ({
  game,
  feedbackStatus,
  onSelectGame,
}) => {
  return (
    <div
      id={`card-${game.id}`}
      className={`group relative rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between border ${
        feedbackStatus === 'liked'
          ? 'bg-amber-950/25 border-amber-400 shadow-xl shadow-amber-500/10 ring-2 ring-amber-400/30'
          : feedbackStatus === 'disliked'
          ? 'bg-[#111318] border-neutral-800 opacity-50'
          : 'bg-[#161820] hover:bg-[#1B1E28] border-amber-500/20 hover:border-amber-400/60 shadow-md hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1'
      }`}
    >
      {/* Top Bar: Icon + Badge */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs"
            style={{
              backgroundColor: `${game.accentColor}18`,
              color: game.accentColor,
              border: `1px solid ${game.accentColor}40`,
            }}
          >
            {ICON_MAP[game.iconName] || <Sparkles className="w-7 h-7" />}
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
              {game.badge}
            </span>

            {/* Owner Feedback Tag if decided */}
            {feedbackStatus === 'liked' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/40">
                <CheckCircle2 className="w-3 h-3 text-amber-400" /> معتمدة
              </span>
            )}
            {feedbackStatus === 'disliked' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded-full border border-neutral-700">
                <XCircle className="w-3 h-3 text-neutral-500" /> مستبعدة
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-black text-white mb-2 group-hover:text-amber-400 transition-colors">
          {game.title}
        </h3>

        {/* Short Description (Single Sentence as requested) */}
        <p className="text-sm text-neutral-400 leading-relaxed mb-6 font-normal">
          {game.shortDesc}
        </p>
      </div>

      {/* Button: "جرّب اللعبة" */}
      <div>
        <button
          id={`btn-try-${game.id}`}
          type="button"
          onClick={() => {
            sounds.playClick();
            onSelectGame(game.id);
          }}
          className="w-full py-3 px-4 rounded-2xl bg-[#1E222E] group-hover:bg-gradient-to-r group-hover:from-amber-500 group-hover:via-amber-400 group-hover:to-yellow-500 text-amber-300 group-hover:text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-xs group-hover:shadow-amber-500/25 border border-amber-500/30 group-hover:border-transparent active:scale-95 cursor-pointer"
        >
          <span>جرّب اللعبة</span>
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 text-amber-400 group-hover:text-slate-950" />
        </button>
      </div>
    </div>
  );
};
