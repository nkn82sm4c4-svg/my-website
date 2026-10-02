import React from 'react';
import { ThumbsUp, ThumbsDown, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { FeedbackStatus } from '../types';
import { sounds } from '../utils/sound';

interface GameFeedbackBarProps {
  gameTitle: string;
  businessBenefit: string;
  status: FeedbackStatus;
  onFeedback: (status: FeedbackStatus) => void;
  onBackToGrid: () => void;
}

export const GameFeedbackBar: React.FC<GameFeedbackBarProps> = ({
  gameTitle,
  businessBenefit,
  status,
  onFeedback,
  onBackToGrid,
}) => {
  return (
    <div className="w-full mt-10 pt-6 border-t border-amber-500/20 space-y-4">
      {/* Business benefit pill */}
      <div className="bg-[#161820] p-4 rounded-2xl border border-amber-500/20 flex items-start gap-3 text-right shadow-sm">
        <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl shrink-0 mt-0.5 border border-amber-500/30">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-amber-300 mb-1">
            لماذا يختار المطاعم فكرة "{gameTitle}"؟
          </h4>
          <p className="text-xs text-neutral-400 leading-relaxed">
            {businessBenefit}
          </p>
        </div>
      </div>

      {/* Decision Section for Restaurant Owner */}
      <div className="bg-[#161820] p-4 sm:p-5 rounded-2xl border border-amber-500/20 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-right">
          <span className="text-xs text-neutral-400 block mb-0.5">رأي صاحب المطعم في هذه الفكرة:</span>
          <span className="text-sm font-bold text-white">
            {status === 'liked' ? (
              <span className="text-amber-400 inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400" /> تم اختيارها كفكرة معتمدة للمطعم
              </span>
            ) : status === 'disliked' ? (
              <span className="text-neutral-400 inline-flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-neutral-500" /> تم استبعادها حالياً
              </span>
            ) : (
              'هل تناسب هوية وفئة عملاء مطعمك؟'
            )}
          </span>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            id="btn-feedback-disliked"
            type="button"
            onClick={() => {
              sounds.playClick();
              onFeedback(status === 'disliked' ? null : 'disliked');
            }}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border cursor-pointer ${
              status === 'disliked'
                ? 'bg-[#1E222E] border-neutral-600 text-neutral-300 ring-2 ring-neutral-500/30'
                : 'bg-[#12141A] hover:bg-[#1A1D26] border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <ThumbsDown className="w-4 h-4 text-neutral-500" />
            <span>ما تناسبني ❌</span>
          </button>

          <button
            id="btn-feedback-liked"
            type="button"
            onClick={() => {
              sounds.playWin();
              onFeedback(status === 'liked' ? null : 'liked');
            }}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border shadow-sm cursor-pointer ${
              status === 'liked'
                ? 'bg-amber-400 border-amber-400 text-slate-950 ring-2 ring-amber-400/50 shadow-amber-500/25'
                : 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 border-transparent text-slate-950 font-black shadow-amber-500/20'
            }`}
          >
            <ThumbsUp className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>أعجبتني هذه الفكرة ✅</span>
          </button>
        </div>
      </div>
    </div>
  );
};
