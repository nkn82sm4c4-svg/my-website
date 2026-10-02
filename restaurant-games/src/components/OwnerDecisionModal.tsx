import React from 'react';
import { OwnerFeedbackState, GameDefinition } from '../types';
import { GAMES_CATALOG } from '../data/games';
import { CheckCircle2, XCircle, X, Sparkles, Share2, Printer, Check } from 'lucide-react';
import { sounds } from '../utils/sound';

interface OwnerDecisionModalProps {
  feedback: OwnerFeedbackState;
  onClose: () => void;
  onSelectGame: (gameId: string) => void;
}

export const OwnerDecisionModal: React.FC<OwnerDecisionModalProps> = ({
  feedback,
  onClose,
  onSelectGame,
}) => {
  const [copied, setCopied] = React.useState(false);

  const likedGames = GAMES_CATALOG.filter(g => feedback[g.id] === 'liked');
  const dislikedGames = GAMES_CATALOG.filter(g => feedback[g.id] === 'disliked');
  const pendingGames = GAMES_CATALOG.filter(g => !feedback[g.id]);

  const copySummaryText = () => {
    sounds.playClick();
    const text = `تقرير خيارات الألعاب التفاعلية للمطعم:
الأفكار المعتمدة (${likedGames.length}):
${likedGames.map(g => `- ${g.title}: ${g.shortDesc}`).join('\n')}

الأفكار المستبعدة (${dislikedGames.length}):
${dislikedGames.map(g => `- ${g.title}`).join('\n')}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#161820] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 left-5 w-9 h-9 rounded-full bg-[#1F222E] hover:bg-[#282C3A] text-amber-400 flex items-center justify-center transition-colors cursor-pointer border border-amber-500/30"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-right mb-6">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/10 text-amber-300 text-xs font-bold mb-2 border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>ملخص قرارات صاحب المطعم</span>
          </div>
          <h3 className="text-2xl font-black text-white">
            قائمتك المختارة للألعاب التفاعلية
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            ملخص تفاعلي بالأفكار التي نالت إعجابك وتلك المستبعدة تمهيداً لبرمجتها في موقع مطعمك.
          </p>
        </div>

        {/* Liked List */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 text-sm font-bold text-amber-300">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>الأفكار المعتمدة التي أعجبتك ({likedGames.length} أفكار):</span>
          </div>

          {likedGames.length === 0 ? (
            <div className="p-4 rounded-2xl bg-[#1A1D26] border border-neutral-800 text-xs text-neutral-400 text-center">
              لم تختر أي فكرة بعد. جرّب الألعاب واضغط على "أعجبتني هذه الفكرة ✅"!
            </div>
          ) : (
            <div className="space-y-2.5">
              {likedGames.map(game => (
                <div
                  key={game.id}
                  onClick={() => {
                    onClose();
                    onSelectGame(game.id);
                  }}
                  className="p-3.5 rounded-2xl bg-[#1A1D26] border border-amber-500/30 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#222632] transition-colors shadow-xs"
                >
                  <div className="text-right">
                    <span className="font-bold text-white text-sm block">{game.title}</span>
                    <span className="text-xs text-neutral-400">{game.shortDesc}</span>
                  </div>
                  <span className="text-xs font-bold text-amber-400 shrink-0">
                    معاينة 👈
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Disliked List */}
        {dislikedGames.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 text-sm font-bold text-neutral-400">
              <XCircle className="w-4 h-4 text-neutral-500" />
              <span>الأفكار المستبعدة ({dislikedGames.length}):</span>
            </div>
            <div className="space-y-2">
              {dislikedGames.map(game => (
                <div
                  key={game.id}
                  className="p-3 rounded-xl bg-[#12141A] border border-neutral-800 text-xs text-neutral-400 flex items-center justify-between"
                >
                  <span>{game.title}</span>
                  <span className="text-[11px] text-neutral-500">تم الاستبعاد</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending count */}
        {pendingGames.length > 0 && (
          <div className="text-xs text-neutral-400 mb-6 bg-[#1A1D26] p-3 rounded-xl border border-neutral-800 text-center">
            متبقي <span className="font-bold text-amber-400">{pendingGames.length}</span> أفكار لم تقم بتقييمها بعد.
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-amber-500/20">
          <button
            type="button"
            onClick={copySummaryText}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 transition-colors shadow-md shadow-amber-500/20 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-slate-950 stroke-[2.5]" /> : <Share2 className="w-4 h-4 text-slate-950 stroke-[2.5]" />}
            <span>{copied ? 'تم نسخ التقرير بنجاح! ✅' : 'نسخ ملخص الأفكار لمشاركته'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-3 px-5 rounded-xl bg-[#1F222E] hover:bg-[#282C3A] text-neutral-300 font-bold text-sm transition-colors cursor-pointer border border-neutral-700"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
