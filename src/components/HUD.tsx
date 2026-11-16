import React, { useState } from 'react';
import {
  GameResources,
  HistoricalEra,
  Quest,
  RunStats,
  SapiensLandscape,
  SimState,
} from '../types/game';
import { SIM_CATALOG } from '../game/rules';

interface HUDProps {
  resources: GameResources;
  era: HistoricalEra;
  activeQuest: Quest | null;
  runStats: RunStats;
  simState: SimState;
  currentLandscape: SapiensLandscape;
  firstPerson: boolean;
  onSelectLandscape: (landscape: SapiensLandscape) => void;
  onToggleCampOpen: () => void;
  onOpenTerminal: () => void;
  onToggleCameraView: () => void;
  onTriggerInteract: () => void;
  onRotatePlacement: () => void;
  onCancelPlacement: () => void;
  onTriggerMythSurge: () => void;
  onTriggerSeasonEvent: () => void;
  onOpenDilemmas: () => void;
  onOpenTechTree: () => void;
  onOpenCodex: () => void;
  onOpenAchievements: () => void;
  unlockedAchievementsCount: number;
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
  runStats,
  simState,
  currentLandscape,
  firstPerson,
  onSelectLandscape,
  onToggleCampOpen,
  onOpenTerminal,
  onToggleCameraView,
  onTriggerInteract,
  onRotatePlacement,
  onCancelPlacement,
  onTriggerMythSurge,
  onTriggerSeasonEvent,
  onOpenDilemmas,
  onOpenTechTree,
  onOpenCodex,
  onOpenAchievements,
  unlockedAchievementsCount,
  onToggleMute,
  isMuted,
  onPause,
  onEndTurn,
  turnCount,
}) => {
  const [dockCollapsed, setDockCollapsed] = useState(false);

  const landscapeLabels: Record<SapiensLandscape, { name: string; icon: string }> = {
    river_meadow: { name: 'Sunlit River Meadow', icon: '🌾' },
    wetland_oasis: { name: 'Water Lilies Wetland', icon: '🪷' },
    mountain_pass: { name: 'Mountain Canyon Arch', icon: '🏔️' },
  };

  const eraLabels: Record<HistoricalEra, string> = {
    cognitive: 'Cognitive Revolution',
    agricultural: 'Agricultural Trap',
    scientific: 'Scientific Revolution',
  };

  const xpPercent = Math.min(100, Math.round((simState.campXp / Math.max(1, simState.nextLevelXp)) * 100));

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-2.5 sm:p-4 select-none font-sans">
      {/* TOP BAR */}
      <div className="flex justify-between items-start w-full gap-2">
        {/* Top-Left: Settlement Card + Docked Quest */}
        <div className="flex flex-col gap-2 max-w-[270px] sm:max-w-xs">
          <div className="pointer-events-auto bg-stone-950/92 border border-amber-600/45 rounded-xl p-2.5 shadow-xl flex items-center gap-2.5">
            <div className="relative w-10 h-10 rounded-lg border-2 border-amber-500/80 bg-stone-900 flex items-center justify-center shrink-0">
              <span className="text-xl">🔥</span>
              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-stone-950 text-[9px] font-mono font-black px-1 rounded">
                L{simState.campLevel}
              </span>
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1 text-[10px] font-mono font-bold text-amber-300">
                <span className="truncate">
                  {landscapeLabels[currentLandscape].icon} {landscapeLabels[currentLandscape].name}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {(['river_meadow', 'wetland_oasis', 'mountain_pass'] as SapiensLandscape[]).map(l => (
                  <button
                    key={l}
                    onClick={() => onSelectLandscape(l)}
                    className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded transition cursor-pointer border ${
                      currentLandscape === l
                        ? 'bg-amber-500/30 text-amber-200 border-amber-400 font-bold'
                        : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
                    }`}
                  >
                    {l === 'river_meadow' ? 'Meadow' : l === 'wetland_oasis' ? 'Oasis' : 'Mountain'}
                  </button>
                ))}
              </div>

              {/* Camp XP & Band */}
              <div className="flex items-center gap-2 text-[10px] font-mono text-stone-300">
                <span>Band <strong className="text-amber-300">{resources.population}</strong>/{resources.dunbarLimit}</span>
                <span>•</span>
                <span>S#{turnCount}</span>
              </div>
              <div className="w-full h-1.5 bg-stone-900 rounded-full overflow-hidden border border-stone-800">
                <div className="h-full bg-amber-400 transition-all duration-200" style={{ width: `${xpPercent}%` }} />
              </div>
            </div>
          </div>

          {activeQuest && (
            <div className="pointer-events-auto bg-stone-950/90 border border-amber-700/50 rounded-xl p-2 shadow-lg">
              <div className="flex items-center justify-between text-[10px] font-mono text-amber-300 border-b border-stone-800 pb-1">
                <span className="font-bold uppercase tracking-wider truncate pr-1">
                  Quest: {activeQuest.title}
                </span>
                <span className="text-stone-400 shrink-0">{eraLabels[era].split(' ')[0]}</span>
              </div>
              <p className="text-[11px] text-stone-200 mt-1 leading-snug line-clamp-2">
                {activeQuest.objective}
              </p>
            </div>
          )}
        </div>

        {/* Top-Center: Economy Ledger, Camp Open/Closed, Myth Surge & Dynamic Alerts */}
        <div className="pointer-events-auto flex flex-col items-center gap-1.5 max-w-xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {/* Cowrie Shells Ledger */}
            <div className="bg-stone-950/92 border border-amber-500/55 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-lg">
              <span className="text-sm">🐚</span>
              <span className="text-xs font-mono font-black text-amber-200 tabular-nums">
                {simState.shells} Shells
              </span>
            </div>

            {/* Camp OPEN / CLOSED Sign */}
            <button
              onClick={onToggleCampOpen}
              className={`rounded-full px-3 py-1 text-[10px] font-mono font-black uppercase tracking-wider border shadow-lg transition cursor-pointer ${
                simState.isCampOpen
                  ? 'bg-emerald-950/95 text-emerald-300 border-emerald-500/70 hover:bg-emerald-900'
                  : 'bg-rose-950/95 text-rose-300 border-rose-500/70 hover:bg-rose-900'
              }`}
              title="Toggle whether visiting tribes enter your camp to barter"
            >
              {simState.isCampOpen ? 'Camp: OPEN' : 'Camp: CLOSED'}
            </button>

            {/* Queue Counter */}
            <div className="bg-stone-950/92 border border-stone-700 rounded-full px-2.5 py-1 text-[10px] font-mono text-stone-200 shadow-lg">
              Queue: <strong className="text-amber-300 tabular-nums">{simState.queueLength}</strong> · Dock: <strong className="text-amber-300 tabular-nums">{simState.dockCratesCount}</strong>
            </div>

            {/* Myth Surge Trigger */}
            <button
              onClick={onTriggerMythSurge}
              className="bg-stone-950/92 hover:bg-amber-950 active:scale-95 border border-amber-500/60 rounded-full px-2.5 py-1 flex items-center gap-1 shadow-lg transition cursor-pointer"
              title="Trigger Shared Myth Surge Shader & Golden Ember Vortex [F]"
            >
              <span className="text-xs">✨</span>
              <span className="text-[10px] font-mono uppercase text-amber-300 font-bold">
                Myth [F] {Math.floor(runStats.mythSurge)}%
              </span>
            </button>

            {/* Dynamic Environmental Event Trigger */}
            <button
              onClick={onTriggerSeasonEvent}
              className="bg-stone-950/92 hover:bg-emerald-950 active:scale-95 border border-emerald-500/50 rounded-full px-2.5 py-1 flex items-center gap-1 shadow-lg transition cursor-pointer"
              title="Trigger Location Environmental Event [G]"
            >
              <span className="text-xs">🌦️</span>
              <span className="text-[10px] font-mono uppercase text-emerald-300 font-bold">
                Event [G]
              </span>
            </button>
          </div>

          {/* 2-Bump & Respawn Alerts */}
          {runStats.bumpCount === 1 && (
            <div className="bg-rose-950/95 border-2 border-rose-500 rounded-lg px-3 py-1 text-center shadow-xl animate-bounce">
              <span className="text-xs font-black font-mono text-rose-200 uppercase tracking-wider">
                💥 BUMP 1/2! One more wilderness hazard hit forces a Hearth Respawn!
              </span>
            </div>
          )}
          {runStats.isRespawning && (
            <div className="bg-amber-950/95 border-2 border-yellow-400 rounded-lg px-3 py-1 text-center shadow-xl">
              <span className="text-xs font-black font-mono text-yellow-200 uppercase tracking-wider">
                ⚡ RESPAWNED AT HEARTH! 3s Invulnerability Halo Active
              </span>
            </div>
          )}

          {/* Carried Crate Status */}
          {simState.carriedCrate && (
            <div className="bg-amber-950/95 border border-amber-400 rounded-full px-3.5 py-1 text-[11px] font-mono text-amber-100 shadow-lg">
              📦 Carrying <strong>{SIM_CATALOG[simState.carriedCrate.productType].name}</strong> ({simState.carriedCrate.units} units) — Walk to matching rack &amp; press <kbd className="bg-stone-950 px-1 rounded border border-amber-600">E</kbd>
            </div>
          )}

          {/* Placement Mode Banner */}
          {simState.placementMode && (
            <div className="bg-emerald-950/95 border border-emerald-400 rounded-full px-3.5 py-1 text-[11px] font-mono text-emerald-100 shadow-lg flex items-center gap-2">
              <span>🏗️ Placement Mode ({SIM_CATALOG[simState.placementMode.productType].name.split(' ')[0]} Rack)</span>
              <button
                onClick={onRotatePlacement}
                className="bg-stone-900 hover:bg-stone-800 border border-emerald-500 px-2 py-0.5 rounded text-[10px] cursor-pointer"
              >
                Rotate [R]
              </button>
              <button
                onClick={onCancelPlacement}
                className="bg-rose-900 hover:bg-rose-800 border border-rose-500 px-2 py-0.5 rounded text-[10px] cursor-pointer"
              >
                Cancel [Esc]
              </button>
            </div>
          )}

          {/* Dynamic Environmental Location Event Banner */}
          {runStats.activeEvent && runStats.activeEvent.active && (
            <div className="bg-amber-950/95 border border-amber-400 rounded-xl px-3 py-1 shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between text-[11px] font-mono text-amber-300 font-bold">
                <span>
                  {runStats.activeEvent.weatherStyle === 'rain' ? '🌧️' : runStats.activeEvent.weatherStyle === 'storm' ? '⛈️' : '🦣'}{' '}
                  {runStats.activeEvent.title}
                </span>
                <span className="bg-amber-500/25 border border-amber-400/50 px-1.5 rounded text-[10px] text-amber-200 tabular-nums">
                  {Math.ceil(runStats.activeEvent.remainingTime)}s
                </span>
              </div>
              <p className="text-[10px] text-stone-200 line-clamp-1">
                {runStats.activeEvent.perkDescription}
              </p>
            </div>
          )}
        </div>

        {/* Top-Right: Simulator Shortcuts & System Controls */}
        <div className="pointer-events-auto bg-stone-950/92 border border-amber-600/45 rounded-xl p-2 shadow-xl flex items-center gap-1.5">
          <button
            onClick={onOpenTerminal}
            className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono font-black text-xs rounded-lg transition cursor-pointer"
            title="Open Supply & Chronicle Terminal [Tab / B]"
          >
            🏺 Terminal [Tab]
          </button>

          <button
            onClick={onToggleCameraView}
            className={`px-2 py-1.5 border rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
              firstPerson
                ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                : 'bg-stone-900 border-stone-700 text-stone-300 hover:bg-stone-800'
            }`}
            title="Switch 1st / 3rd Person Camera [V]"
          >
            {firstPerson ? '1P' : '3P'} [V]
          </button>

          <button
            onClick={onToggleMute}
            className="p-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 rounded-lg transition cursor-pointer"
            title="Toggle Sound [M]"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          <button
            onClick={onPause}
            className="p-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 rounded-lg transition cursor-pointer"
            title="Pause Game [Esc]"
          >
            ⏸️
          </button>
        </div>
      </div>

      {/* BOTTOM PROXIMITY PROMPT + ACTIVITY FEED + DOCK */}
      <div className="flex flex-col items-center gap-2 w-full">
        {/* Roblox-style Interactive [E] Proximity Prompt */}
        {simState.activePrompt && (
          <button
            onClick={onTriggerInteract}
            className="pointer-events-auto bg-stone-950/95 hover:bg-stone-900 active:scale-95 border-2 border-amber-400 rounded-2xl px-5 py-2.5 shadow-2xl flex items-center gap-3 transition cursor-pointer"
          >
            <span className="w-8 h-8 rounded-lg bg-amber-500 text-stone-950 font-mono font-black text-sm flex items-center justify-center shadow">
              {simState.activePrompt.key}
            </span>
            <div className="text-left">
              <div className="text-xs sm:text-sm font-bold text-amber-100">
                {simState.activePrompt.label}
              </div>
              {simState.activePrompt.sublabel && (
                <div className="text-[10px] font-mono text-stone-400">
                  {simState.activePrompt.sublabel}
                </div>
              )}
            </div>
          </button>
        )}

        <div className="w-full flex items-end justify-between gap-3">
          {/* Compact Activity Feed Bottom-Left */}
          <div className="hidden lg:flex flex-col gap-1 max-w-xs">
            {simState.feedMessages.slice(-2).map(msg => (
              <div
                key={msg.id}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border bg-stone-950/90 ${
                  msg.tone === 'myth'
                    ? 'border-amber-500/60 text-amber-200'
                    : msg.tone === 'warn'
                    ? 'border-rose-500/60 text-rose-200'
                    : 'border-emerald-600/50 text-emerald-200'
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* Center Controls & Harari Council Dock */}
          <div className="pointer-events-auto flex flex-col items-center mx-auto">
            <button
              onClick={() => setDockCollapsed(prev => !prev)}
              className="text-[10px] font-mono text-amber-400 hover:text-amber-200 bg-stone-950/90 px-2.5 py-0.5 rounded-t border border-b-0 border-amber-900/60 transition cursor-pointer"
            >
              {dockCollapsed ? '▲ Expand Settlement Dock' : '▼ Collapse Dock'}
            </button>

            {!dockCollapsed && (
              <div className="bg-stone-950/92 border border-amber-900/60 rounded-xl p-1.5 sm:p-2 shadow-2xl flex flex-wrap items-center justify-center gap-1.5">
                <span className="hidden xl:inline text-[10px] font-mono text-stone-400 px-2">
                  WASD Walk · Drag/Q-Z Orbit · E Interact · Space Jump
                </span>

                <button
                  onClick={onOpenDilemmas}
                  className="px-2.5 py-1.5 bg-amber-950/50 hover:bg-amber-900/70 border border-amber-700/60 text-amber-200 text-xs font-medium rounded-lg flex items-center gap-1 transition cursor-pointer"
                >
                  <span>👥</span>
                  <span>Council [D]</span>
                </button>

                <button
                  onClick={onOpenTechTree}
                  className="px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 border border-amber-700/60 text-amber-200 text-xs font-medium rounded-lg flex items-center gap-1 transition cursor-pointer"
                >
                  <span>💡</span>
                  <span>Discoveries [T]</span>
                </button>

                <button
                  onClick={onOpenCodex}
                  className="px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 text-xs font-medium rounded-lg flex items-center gap-1 transition cursor-pointer"
                >
                  <span>📖</span>
                  <span>Codex [X]</span>
                </button>

                <button
                  onClick={onOpenAchievements}
                  className="px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 text-xs font-medium rounded-lg flex items-center gap-1 transition cursor-pointer"
                >
                  <span>🏆</span>
                  <span>Milestones ({unlockedAchievementsCount})</span>
                </button>

                <button
                  onClick={onEndTurn}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 active:scale-95 text-stone-950 text-xs font-black uppercase rounded-lg transition cursor-pointer"
                >
                  Next Season &gt;
                </button>
              </div>
            )}
          </div>

          <div className="hidden lg:block w-40" />
        </div>
      </div>
    </div>
  );
};
