import React from 'react';
import { HistoricalEra } from '../types/game';

interface TitleScreenProps {
  onStartGame: (era: HistoricalEra) => void;
  selectedEra: HistoricalEra;
  onSelectEra: (era: HistoricalEra) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  selectedEra,
  onSelectEra,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between pointer-events-none p-6 sm:p-12 select-none">
      {/* Top Left: Bespoke Title Lockup over 35% Negative Space */}
      <div className="pointer-events-auto max-w-xl animate-fade-in">
        {/* Bespoke inline SVG emblem */}
        <div className="flex items-center gap-3 mb-3">
          <svg className="w-10 h-10 text-amber-500 shrink-0" viewBox="0 0 48 48" fill="none">
            {/* Ancient Handprint & Stadel Lion-Man Emblem */}
            <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" />
            <path
              d="M17 28C17 22 20 18 24 18C28 18 31 22 31 28M24 14V17M20 15L22 17M28 15L26 17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M19 33C21 35 27 35 29 33"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="24" cy="24" r="2" fill="currentColor" />
          </svg>
          <div className="text-xs uppercase tracking-[0.28em] text-amber-400/90 font-medium font-mono">
            Yuval Noah Harari's Thesis
          </div>
        </div>

        <h1 className="text-4xl sm:text-6xl font-serif font-black tracking-tight text-amber-100 drop-shadow-md leading-tight">
          SAPIENS
        </h1>
        <p className="text-sm sm:text-base font-serif italic text-amber-200/80 mt-1">
          A Brief History of Humankind · The Simulation
        </p>

        <p className="text-xs sm:text-sm text-stone-300/90 mt-4 leading-relaxed max-w-md bg-stone-950/70 p-4 border-l-2 border-amber-600/60 rounded-r">
          70,000 years ago, Homo sapiens was an insignificant ape in East Africa.
          Through cognitive mutation, shared fiction, and collective belief, our ancestors conquered the planet.
          Will your tribe transcend Dunbar's limit of 150, survive the Wheat Trap, and unlock the Scientific Revolution?
        </p>

        {/* Era Starting Choice */}
        <div className="mt-5 space-y-2">
          <div className="text-[11px] uppercase tracking-wider text-stone-400 font-mono">
            Select Starting Era
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'cognitive' as const, label: 'Cognitive Revolution', years: '70,000 BCE' },
              { id: 'agricultural' as const, label: 'Agricultural Revolution', years: '10,000 BCE' },
              { id: 'scientific' as const, label: 'Scientific Revolution', years: '1500 CE' },
            ].map(era => (
              <button
                key={era.id}
                onClick={() => onSelectEra(era.id)}
                className={`px-3 py-1.5 text-xs text-left rounded transition border ${
                  selectedEra === era.id
                    ? 'bg-amber-600/30 border-amber-500 text-amber-200'
                    : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:border-stone-600'
                }`}
              >
                <div className="font-semibold">{era.label}</div>
                <div className="text-[10px] opacity-75 font-mono">{era.years}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Primary CTA Button */}
        <div className="mt-6 flex items-center gap-4">
          <button
            data-start="true"
            onClick={() => onStartGame(selectedEra)}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-sm tracking-wide uppercase rounded shadow-lg transition active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <span>Begin Humankind's Odyssey</span>
            <span className="text-xs bg-stone-950/20 px-1.5 py-0.5 rounded font-mono font-normal">
              Enter / Space
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Center: Flat Single Control Hint Line */}
      <div className="pointer-events-auto self-center text-center">
        <p className="text-xs font-mono text-stone-400/90 tracking-wide bg-stone-950/80 px-4 py-2 rounded-full border border-stone-800">
          WASD / Arrow Keys Move · Space Gather · Esc Pause · C Codex · D Dilemmas · V AI Studio
        </p>
      </div>
    </div>
  );
};
