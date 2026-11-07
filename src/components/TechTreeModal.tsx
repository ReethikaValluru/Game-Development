import React from 'react';
import { DiscoveryTech, GameResources } from '../types/game';
import { canUnlockTech } from '../game/rules';

interface TechTreeModalProps {
  techs: DiscoveryTech[];
  resources: GameResources;
  onUnlockTech: (tech: DiscoveryTech) => void;
  onClose: () => void;
}

export const TechTreeModal: React.FC<TechTreeModalProps> = ({
  techs,
  resources,
  onUnlockTech,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-stone-900 border border-stone-700 text-stone-100 max-w-3xl w-full rounded-xl shadow-2xl p-5 sm:p-7 relative overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-stone-800 pb-3">
          <div>
            <div className="text-xs uppercase font-mono tracking-wider text-sky-400 font-bold">
              Evolutionary Breakthroughs & Discoveries
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-black text-amber-100 mt-0.5">
              The Cognitive & Cultural Tree
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 p-1.5 rounded transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Current Pool Banner */}
        <div className="mt-4 bg-stone-950/70 p-3 rounded-lg border border-stone-800 flex flex-wrap gap-4 text-xs font-mono">
          <div>Knowledge: <span className="text-sky-300 font-bold tabular-nums">{resources.knowledge}</span></div>
          <div>Shared Myth: <span className="text-purple-300 font-bold tabular-nums">{resources.mythPower}</span></div>
          <div>Flint & Stone: <span className="text-stone-300 font-bold tabular-nums">{resources.flintAndStone}</span></div>
        </div>

        {/* Tech Grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {techs.map((tech) => {
            const canUnlock = canUnlockTech(tech, resources);

            return (
              <div
                key={tech.id}
                className={`p-4 rounded-lg border transition flex flex-col justify-between ${
                  tech.unlocked
                    ? 'bg-stone-950/60 border-emerald-600/60 text-stone-300'
                    : canUnlock
                    ? 'bg-stone-950 border-amber-500/80 hover:border-amber-400 shadow-md'
                    : 'bg-stone-950/40 border-stone-800 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400">
                      {tech.era} era
                    </span>
                    {tech.unlocked ? (
                      <span className="text-[10px] font-mono uppercase bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                        Unlocked
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-amber-300">
                        Requires: {tech.cost.knowledge} Knw
                        {tech.cost.mythPower ? `, ${tech.cost.mythPower} Myth` : ''}
                        {tech.cost.flintAndStone ? `, ${tech.cost.flintAndStone} Flint` : ''}
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif font-bold text-sm sm:text-base text-amber-100">
                    {tech.name}
                  </h3>
                  <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                    {tech.description}
                  </p>

                  <div className="mt-2 text-[11px] font-mono text-stone-400 italic bg-stone-900/60 p-2 rounded">
                    "{tech.harariInsight}"
                  </div>
                </div>

                {!tech.unlocked && (
                  <button
                    disabled={!canUnlock}
                    onClick={() => onUnlockTech(tech)}
                    className={`mt-4 w-full py-2 px-3 text-xs font-bold uppercase rounded transition cursor-pointer ${
                      canUnlock
                        ? 'bg-amber-600 hover:bg-amber-500 text-stone-950 shadow active:scale-95'
                        : 'bg-stone-800 text-stone-500 cursor-not-allowed'
                    }`}
                  >
                    {canUnlock ? 'Manifest Discovery' : 'Insufficient Resources'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
