import React from 'react';
import { HistoricalEra, SapiensLandscape } from '../types/game';

interface TitleScreenProps {
  onStartGame: (era: HistoricalEra, landscape: SapiensLandscape) => void;
  selectedEra: HistoricalEra;
  onSelectEra: (era: HistoricalEra) => void;
  selectedLandscape: SapiensLandscape;
  onSelectLandscape: (landscape: SapiensLandscape) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  selectedEra,
  onSelectEra,
  selectedLandscape,
  onSelectLandscape,
}) => {
  const landscapes: {
    id: SapiensLandscape;
    name: string;
    subtitle: string;
    image: string;
    icon: string;
    features: string;
  }[] = [
    {
      id: 'river_meadow',
      name: 'Sunlit River Meadow',
      subtitle: 'Wildflower Valleys & Ancient Oaks',
      image: '/assets/aistudio/image_9c8be576.png',
      icon: '🌾',
      features: 'Winding stream, blooming poppy beds, lush grass banks',
    },
    {
      id: 'wetland_oasis',
      name: 'Wetland Oasis',
      subtitle: 'Water Lilies & Crystal Lagoons',
      image: '/assets/aistudio/image_883a9828.png',
      icon: '🪷',
      features: 'Monet lotus blooms, floating circular pads, freshwater reeds',
    },
    {
      id: 'mountain_pass',
      name: 'Mountain Canyon Pass',
      subtitle: 'Sunlit Ridge & Stone Bridge Arch',
      image: '/assets/aistudio/image_6a1d8418.png',
      icon: '🏔️',
      features: 'Golden canopy trees, misty valley gorges, natural rock span',
    },
  ];

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-between pointer-events-none p-3 sm:p-8 select-none overflow-y-auto">
      {/* Top Section: Harari Sapiens Header & Book Inspiration */}
      <div className="pointer-events-auto max-w-2xl animate-fade-in space-y-2.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-amber-500/70 bg-stone-900/90 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <span className="text-xl">🔥</span>
          </div>
          <div>
            <div className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-amber-400 font-bold font-mono">
              Yuval Noah Harari's Masterpiece
            </div>
            <div className="text-[11px] text-stone-300 font-mono">
              Cognitive Revolution · Shared Myths · Dunbar's Limit 150
            </div>
          </div>
        </div>

        <div>
          <h1 className="text-3xl sm:text-5xl font-serif font-black tracking-tight text-amber-100 drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] leading-none">
            SAPIENS
          </h1>
          <p className="text-sm sm:text-base font-serif italic text-amber-200/90 mt-1">
            A Brief History of Humankind — The Cognitive Odyssey
          </p>
        </div>

        <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-xl bg-stone-950/80 p-2.5 rounded-lg border border-amber-900/40 backdrop-blur-sm">
          Run as a prehistoric Sapiens band leader through Earth&apos;s untamed wilderness. Leap over fallen logs, slide beneath natural stone arches, gather flint, berries, and ivory, while evading the prowling sabertooth predator. Shape humanity&apos;s destiny through shared fiction, fire, and cooperation.
        </p>

        {/* 3 Natural Earth Landscape Previews (Images attached by user) */}
        <div className="space-y-1.5 pt-1">
          <div className="text-[11px] uppercase tracking-wider text-amber-300 font-mono font-bold flex items-center justify-between">
            <span>Choose Starting Landscape:</span>
            <span className="text-[9px] text-stone-400 font-normal">Switchable any time during run</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {landscapes.map(l => {
              const isSelected = selectedLandscape === l.id;
              return (
                <button
                  key={l.id}
                  onClick={() => onSelectLandscape(l.id)}
                  className={`text-left rounded-xl transition border overflow-hidden p-1.5 group cursor-pointer ${
                    isSelected
                      ? 'bg-amber-950/70 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.35)]'
                      : 'bg-stone-900/75 border-stone-800 hover:border-stone-600'
                  }`}
                >
                  <div className="relative h-20 sm:h-24 rounded-lg overflow-hidden border border-stone-700/60 mb-1.5 bg-stone-950">
                    <img
                      src={l.image}
                      alt={l.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-1 left-1 bg-stone-950/80 rounded px-1.5 py-0.5 text-[10px] font-mono font-bold text-amber-300 border border-stone-700">
                      {l.icon} {l.name}
                    </div>
                  </div>
                  <div className="px-1">
                    <div className="text-xs font-bold text-amber-100 flex items-center justify-between">
                      <span>{l.name}</span>
                      {isSelected && (
                        <span className="text-[9px] font-mono bg-amber-400 text-stone-950 px-1 rounded font-bold">
                          Selected
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-stone-400 font-mono line-clamp-1 mt-0.5">
                      {l.features}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Historical Era Selector */}
        <div className="space-y-1 pt-1">
          <div className="text-[10px] uppercase tracking-wider text-amber-300 font-mono font-bold">
            Starting Era:
          </div>
          <div className="flex gap-2">
            {[
              { id: 'cognitive' as const, label: 'Cognitive Revolution', period: '~70,000 BCE' },
              { id: 'agricultural' as const, label: 'Agricultural Trap', period: '~10,000 BCE' },
              { id: 'scientific' as const, label: 'Scientific Revolution', period: '~1500 CE' },
            ].map(e => (
              <button
                key={e.id}
                onClick={() => onSelectEra(e.id)}
                className={`px-2.5 py-1 text-xs rounded-lg font-mono transition border cursor-pointer ${
                  selectedEra === e.id
                    ? 'bg-amber-500/20 text-amber-200 border-amber-500 font-bold'
                    : 'bg-stone-900/60 text-stone-400 border-stone-800 hover:text-stone-200'
                }`}
              >
                <div>{e.label}</div>
                <div className="text-[9px] opacity-70">{e.period}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Start Game Button */}
        <div className="pt-2 flex items-center gap-3">
          <button
            data-start="true"
            onClick={() => onStartGame(selectedEra, selectedLandscape)}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black text-sm tracking-wide uppercase rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.4)] transition active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <span>Begin Humankind&apos;s Run</span>
            <span className="text-xs bg-stone-950/25 px-2 py-0.5 rounded font-mono font-normal">
              Enter / Space
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Hint Bar */}
      <div className="pointer-events-auto self-center text-center mt-3">
        <p className="text-xs font-mono text-amber-200/90 tracking-wide bg-stone-950/90 px-5 py-2 rounded-full border border-amber-700/50 shadow-xl backdrop-blur-md">
          A / D Lane Shift · Space / W Jump Over Logs · S / C Slide Under Stone Arches · Shift Sprint · Esc Pause
        </p>
      </div>
    </div>
  );
};
