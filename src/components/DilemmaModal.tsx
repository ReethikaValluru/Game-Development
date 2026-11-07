import React from 'react';
import { HistoricalDilemma, DilemmaChoice } from '../types/game';

interface DilemmaModalProps {
  dilemma: HistoricalDilemma;
  onSelectChoice: (choice: DilemmaChoice) => void;
  onClose: () => void;
}

export const DilemmaModal: React.FC<DilemmaModalProps> = ({
  dilemma,
  onSelectChoice,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-stone-900 border border-stone-700 text-stone-100 max-w-2xl w-full rounded-xl shadow-2xl p-5 sm:p-7 relative overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-stone-800 pb-3">
          <div>
            <div className="text-xs uppercase font-mono tracking-wider text-amber-500 font-bold">
              Tribal Council Dilemma · {dilemma.chapterRef}
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-black text-amber-100 mt-0.5">
              {dilemma.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 p-1.5 rounded transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Historical Context & Harari Quote */}
        <div className="mt-4 space-y-3">
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            {dilemma.historicalContext}
          </p>

          <blockquote className="bg-stone-950/70 border-l-3 border-amber-500 p-3 rounded-r text-xs sm:text-sm italic text-amber-200/90 font-serif">
            "{dilemma.bookQuote}"
            <div className="text-[10px] font-mono not-italic text-stone-400 mt-1 font-semibold">
              — Yuval Noah Harari, Sapiens
            </div>
          </blockquote>
        </div>

        {/* Choices */}
        <div className="mt-6 space-y-3">
          <div className="text-xs font-mono uppercase tracking-wider text-stone-400 font-semibold">
            Choose the Path of Your People:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dilemma.choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => onSelectChoice(choice)}
                className="bg-stone-950 hover:bg-stone-800 border border-stone-800 hover:border-amber-500 text-left p-4 rounded-lg transition active:scale-[0.98] cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-serif font-bold text-sm text-amber-200 mb-1.5 leading-snug">
                    {choice.label}
                  </h3>
                  <p className="text-xs text-stone-300 leading-relaxed mb-3">
                    {choice.description}
                  </p>
                  <p className="text-[11px] text-amber-300/80 italic font-mono bg-stone-900/60 p-2 rounded border border-stone-800">
                    💡 <span className="font-semibold">Harari's Theory:</span> {choice.harariTheory}
                  </p>
                </div>

                {/* Effect Badges */}
                <div className="mt-4 pt-2 border-t border-stone-800/80 flex flex-wrap gap-1.5 text-[10px] font-mono">
                  {choice.effects.population && (
                    <span className={choice.effects.population > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      Pop: {choice.effects.population > 0 ? `+${choice.effects.population}` : choice.effects.population}
                    </span>
                  )}
                  {choice.effects.dunbarLimit && (
                    <span className={choice.effects.dunbarLimit > 0 ? 'text-cyan-400' : 'text-rose-400'}>
                      Dunbar: {choice.effects.dunbarLimit > 0 ? `+${choice.effects.dunbarLimit}` : choice.effects.dunbarLimit}
                    </span>
                  )}
                  {choice.effects.mythPower && (
                    <span className={choice.effects.mythPower > 0 ? 'text-purple-400' : 'text-rose-400'}>
                      Myth: {choice.effects.mythPower > 0 ? `+${choice.effects.mythPower}` : choice.effects.mythPower}
                    </span>
                  )}
                  {choice.effects.calories && (
                    <span className={choice.effects.calories > 0 ? 'text-amber-400' : 'text-rose-400'}>
                      Calories: {choice.effects.calories > 0 ? `+${choice.effects.calories}` : choice.effects.calories}
                    </span>
                  )}
                  {choice.effects.knowledge && (
                    <span className={choice.effects.knowledge > 0 ? 'text-sky-400' : 'text-rose-400'}>
                      Knowledge: {choice.effects.knowledge > 0 ? `+${choice.effects.knowledge}` : choice.effects.knowledge}
                    </span>
                  )}
                  {choice.effects.flintAndStone && (
                    <span className={choice.effects.flintAndStone > 0 ? 'text-stone-300' : 'text-rose-400'}>
                      Flint: {choice.effects.flintAndStone > 0 ? `+${choice.effects.flintAndStone}` : choice.effects.flintAndStone}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
