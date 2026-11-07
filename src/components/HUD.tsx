import React, { useState } from 'react';
import { GameResources, HistoricalEra, Quest } from '../types/game';

interface HUDProps {
  resources: GameResources;
  era: HistoricalEra;
  activeQuest: Quest | null;
  onOpenDilemmas: () => void;
  onOpenTechTree: () => void;
  onOpenCodex: () => void;
  onOpenAIStudio: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
  onPause: () => void;
  onEndTurn: () => void;
  turnCount: number;
}

export const HUD: React.FC<HUDProps> = ({
  resources,
  era,
  activeQuest,
  onOpenDilemmas,
  onOpenTechTree,
  onOpenCodex,
  onOpenAIStudio,
  onToggleMute,
  isMuted,
  onPause,
  onEndTurn,
  turnCount,
}) => {
  const [dockCollapsed, setDockCollapsed] = useState(false);

  // Dunbar limit status
  const isOverDunbar = resources.population > resources.dunbarLimit;
  const dunbarFriction = isOverDunbar ? resources.population - resources.dunbarLimit : 0;

  const eraLabels: Record<HistoricalEra, { name: string; color: string }> = {
    cognitive: { name: 'Cognitive Revolution (70,000 BCE)', color: 'text-amber-400 border-amber-600' },
    agricultural: { name: 'Agricultural Revolution (10,000 BCE)', color: 'text-emerald-400 border-emerald-600' },
    scientific: { name: 'Scientific Revolution (1500 CE)', color: 'text-cyan-400 border-cyan-600' },
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 sm:p-5 select-none font-sans">
      {/* TOP BAR: World-matched perimeter clusters */}
      <div className="flex justify-between items-start w-full">
        {/* Top-Left Cluster: Primary Readouts (Tabular Numerals) */}
        <div className="pointer-events-auto bg-stone-950/85 border border-stone-800 rounded-lg p-2.5 sm:p-3.5 shadow-lg max-w-sm space-y-2">
          {/* Era Header */}
          <div className="flex items-center justify-between gap-2 border-b border-stone-800 pb-1.5">
            <span className={`text-[10px] sm:text-xs uppercase font-mono font-bold tracking-wider ${eraLabels[era].color}`}>
              {eraLabels[era].name}
            </span>
            <span className="text-[10px] font-mono text-stone-400">
              Season #{turnCount}
            </span>
          </div>

          {/* Primary Population & Dunbar Limit */}
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-mono uppercase text-stone-400">Band Population</span>
              <span className="text-xl sm:text-2xl font-serif font-black text-amber-200 tabular-nums">
                {resources.population}
              </span>
            </div>
            {/* Dunbar Threshold status indicator */}
            <div className="flex items-center justify-between text-[10px] font-mono mt-0.5">
              <span className="text-stone-400">Dunbar Limit:</span>
              <span className={`font-semibold tabular-nums ${isOverDunbar ? 'text-rose-400' : 'text-emerald-400'}`}>
                {resources.dunbarLimit} max {isOverDunbar && `(Friction +${dunbarFriction})`}
              </span>
            </div>
            {isOverDunbar && (
              <p className="text-[9px] text-amber-300/80 font-mono italic mt-0.5">
                Band exceeds 150 without enough shared myths. Factions may fracture!
              </p>
            )}
          </div>

          {/* Secondary Metric Grid */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-800/80 text-[11px]">
            {/* Myth Power / Shared Fiction */}
            <div className="bg-stone-900/60 p-1.5 rounded border border-stone-800">
              <div className="text-[9px] font-mono uppercase text-purple-300">Shared Fiction</div>
              <div className="text-sm font-bold text-purple-200 tabular-nums flex items-center justify-between">
                <span>{resources.mythPower}</span>
                <span className="text-[9px] text-stone-400 font-normal">Belief</span>
              </div>
            </div>

            {/* Caloric Sustenance */}
            <div className="bg-stone-900/60 p-1.5 rounded border border-stone-800">
              <div className="text-[9px] font-mono uppercase text-amber-400">Calories</div>
              <div className="text-sm font-bold text-amber-200 tabular-nums flex items-center justify-between">
                <span>{resources.calories}</span>
                <span className={`text-[9px] ${resources.calories < 50 ? 'text-rose-400 font-bold' : 'text-stone-400 font-normal'}`}>
                  {resources.calories < 50 ? 'Starving!' : 'Stores'}
                </span>
              </div>
            </div>

            {/* Flint & Tools */}
            <div className="bg-stone-900/60 p-1.5 rounded border border-stone-800">
              <div className="text-[9px] font-mono uppercase text-stone-300">Flint & Ivory</div>
              <div className="text-sm font-bold text-stone-200 tabular-nums">
                {resources.flintAndStone}
              </div>
            </div>

            {/* Knowledge & Discoveries */}
            <div className="bg-stone-900/60 p-1.5 rounded border border-stone-800">
              <div className="text-[9px] font-mono uppercase text-sky-300">Discoveries</div>
              <div className="text-sm font-bold text-sky-200 tabular-nums">
                {resources.knowledge}
              </div>
            </div>
          </div>
        </div>

        {/* Top-Right Cluster: Action Buttons & Utilities */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 bg-stone-950/85 border border-stone-800 rounded-lg p-1.5 sm:p-2 shadow-lg">
          {/* AI Visualizer & Video Studio */}
          <button
            onClick={onOpenAIStudio}
            className="px-2.5 py-1.5 bg-gradient-to-r from-amber-600/30 to-purple-600/30 hover:from-amber-600/50 hover:to-purple-600/50 border border-amber-500/50 text-amber-200 text-xs font-medium rounded flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="Generate AI Historical Images & Animate Videos"
          >
            <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span className="hidden sm:inline">AI Studio</span>
          </button>

          {/* Harari Codex Button */}
          <button
            onClick={onOpenCodex}
            className="px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 text-xs font-medium rounded flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="Read Harari's Sapiens Codex [C]"
          >
            <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span className="hidden sm:inline">Codex [C]</span>
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={onToggleMute}
            className="p-1.5 sm:p-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 rounded transition active:scale-95 cursor-pointer"
            title="Toggle Sound [M]"
          >
            {isMuted ? (
              <svg className="w-4 h-4 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="p-1.5 sm:p-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 rounded transition active:scale-95 cursor-pointer"
            title="Pause Game [Esc]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          </button>
        </div>
      </div>

      {/* ACTIVE QUEST TICKER: Compact, world-matched banner */}
      {activeQuest && (
        <div className="pointer-events-auto self-center max-w-lg w-full bg-stone-950/85 border border-amber-700/60 rounded-md p-2 shadow-md">
          <div className="flex items-center justify-between text-[10px] font-mono text-amber-400/90 border-b border-stone-800 pb-1">
            <span className="font-bold uppercase tracking-wider">Current Quest: {activeQuest.title}</span>
            <span className="text-stone-400 font-normal">{activeQuest.harariChapter}</span>
          </div>
          <p className="text-xs text-stone-200 mt-1 leading-snug">
            {activeQuest.description}
          </p>
          <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 mt-1.5">
            <span className="text-amber-200 font-medium">Objective: {activeQuest.objective}</span>
            {activeQuest.completed && (
              <span className="text-emerald-400 font-bold uppercase">Ready to Advance!</span>
            )}
          </div>
        </div>
      )}

      {/* COLLAPSIBLE BOTTOM DOCK: Consolidated controls <= 15% footprint */}
      <div className="pointer-events-auto self-center w-full max-w-3xl flex flex-col items-center">
        {/* Collapse / Expand Tab */}
        <button
          onClick={() => setDockCollapsed(!dockCollapsed)}
          className="text-[10px] font-mono bg-stone-950/90 text-stone-400 hover:text-stone-200 px-3 py-1 rounded-t-md border-t border-x border-stone-800 transition cursor-pointer"
        >
          {dockCollapsed ? '▲ Show Command Dock' : '▼ Collapse Dock'}
        </button>

        {!dockCollapsed && (
          <div className="w-full bg-stone-950/90 border border-stone-800 rounded-b-lg rounded-t-sm p-2 sm:p-3 shadow-2xl flex flex-wrap items-center justify-between gap-2">
            {/* Left Nav Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Tribal Council & Dilemmas */}
              <button
                onClick={onOpenDilemmas}
                className="px-3 py-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-amber-500 text-stone-100 text-xs font-semibold rounded flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <svg className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>Tribal Dilemmas [D]</span>
              </button>

              {/* Technologies & Discoveries */}
              <button
                onClick={onOpenTechTree}
                className="px-3 py-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-sky-500 text-stone-100 text-xs font-semibold rounded flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <svg className="w-4 h-4 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <span>Discoveries [T]</span>
              </button>

              {/* Harari Codex */}
              <button
                onClick={onOpenCodex}
                className="px-3 py-2 bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-purple-500 text-stone-100 text-xs font-semibold rounded flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              >
                <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
                <span>Codex [C]</span>
              </button>
            </div>

            {/* Right: End Season / Turn Button */}
            <button
              onClick={onEndTurn}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs uppercase tracking-wide rounded shadow transition active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>Advance Season</span>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
