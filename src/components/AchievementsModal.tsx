import React from 'react';
import { Achievement } from '../types/game';

interface AchievementsModalProps {
  achievements: Achievement[];
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  achievements,
  onClose,
}) => {
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const progressPercent = Math.round((unlockedCount / achievements.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-stone-900 border border-stone-700 text-stone-100 max-w-3xl w-full rounded-xl shadow-2xl p-5 sm:p-7 relative overflow-hidden flex flex-col h-[88vh]">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-stone-800 pb-3 shrink-0">
          <div>
            <div className="text-xs uppercase font-mono tracking-wider text-amber-500 font-bold">
              Evolutionary Milestones
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-black text-amber-100 mt-0.5">
              Humankind Achievements & Fun Facts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 p-1.5 rounded transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Progress Bar Banner */}
        <div className="mt-4 bg-stone-950/80 p-3.5 rounded-lg border border-stone-800 shrink-0">
          <div className="flex items-center justify-between text-xs font-mono mb-1.5">
            <span className="text-stone-300 font-bold">
              Milestones Unlocked: <span className="text-amber-400">{unlockedCount}</span> / {achievements.length}
            </span>
            <span className="text-amber-300 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full bg-stone-900 rounded-full h-2.5 overflow-hidden border border-stone-800">
            <div
              className="bg-gradient-to-r from-amber-600 to-yellow-400 h-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="mt-4 flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-4 rounded-lg border transition ${
                ach.unlocked
                  ? 'bg-stone-950/80 border-amber-600/70 shadow-md'
                  : 'bg-stone-950/30 border-stone-800/80 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 border ${
                    ach.unlocked
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-stone-900 border-stone-800 text-stone-600'
                  }`}
                >
                  {ach.unlocked ? ach.icon : '🔒'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`font-serif font-bold text-sm sm:text-base ${
                        ach.unlocked ? 'text-amber-100' : 'text-stone-400'
                      }`}
                    >
                      {ach.title}
                    </h3>
                    {ach.unlocked ? (
                      <span className="text-[10px] font-mono uppercase bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                        Season #{ach.unlockedAtSeason || 1}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono uppercase text-stone-500">
                        Locked
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-300 mt-0.5 leading-snug">
                    {ach.description}
                  </p>

                  {/* Fun Fact */}
                  <div className="mt-2 text-xs font-serif italic text-amber-200/90 bg-stone-900/70 p-2.5 rounded border border-stone-800/80">
                    <span className="font-sans font-bold text-amber-400 text-[10px] uppercase not-italic block font-mono mb-0.5">
                      💡 Harari Fun Fact:
                    </span>
                    "{ach.funFact}"
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
