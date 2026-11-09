import React, { useState } from 'react';
import { GameResources, HistoricalEra, Quest, RunStats, SapiensLandscape } from '../types/game';

interface HUDProps {
  resources: GameResources;
  era: HistoricalEra;
  activeQuest: Quest | null;
  runStats: RunStats;
  currentLandscape: SapiensLandscape;
  onSelectLandscape: (landscape: SapiensLandscape) => void;
  onOpenDilemmas: () => void;
  onOpenTechTree: () => void;
  onOpenCodex: () => void;
  onOpenAchievements: () => void;
  unlockedAchievementsCount: number;
  onTriggerJump: () => void;
  onTriggerSlide: () => void;
  onTriggerLaneLeft: () => void;
  onTriggerLaneRight: () => void;
  onToggleSprint: () => void;
  isSprinting: boolean;
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
  currentLandscape,
  onSelectLandscape,
  onOpenDilemmas,
  onOpenTechTree,
  onOpenCodex,
  onOpenAchievements,
  unlockedAchievementsCount,
  onTriggerJump,
  onTriggerSlide,
  onTriggerLaneLeft,
  onTriggerLaneRight,
  onToggleSprint,
  isSprinting,
  onToggleMute,
  isMuted,
  onPause,
  onEndTurn,
  turnCount,
}) => {
  const [dockCollapsed, setDockCollapsed] = useState(false);

  const landscapeLabels: Record<SapiensLandscape, { name: string; icon: string }> = {
    river_meadow: {
      name: 'Sunlit River Meadow',
      icon: '🌾',
    },
    wetland_oasis: {
      name: 'Water Lilies Wetland',
      icon: '🪷',
    },
    mountain_pass: {
      name: 'Mountain Canyon Arch',
      icon: '🏔️',
    },
  };

  const eraLabels: Record<HistoricalEra, string> = {
    cognitive: 'Cognitive Revolution (~70,000 BCE)',
    agricultural: 'Agricultural Trap (~10,000 BCE)',
    scientific: 'Scientific Revolution (~1500 CE)',
  };

  const comboMultiplier = Math.min(5, Math.max(1, Math.floor(runStats.comboStreak / 4) + 1));

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-2.5 sm:p-4 select-none font-sans">
      {/* TOP BAR: Natural Earth / Sapiens HUD */}
      <div className="flex justify-between items-start w-full gap-2">
        {/* Top-Left: Sapiens Band & Landscape Card */}
        <div className="pointer-events-auto bg-stone-950/90 border border-amber-600/40 rounded-xl p-2 sm:p-2.5 shadow-2xl backdrop-blur-md flex items-center gap-3">
          {/* Sapiens Chieftain Badge */}
          <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden border-2 border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.3)] flex-shrink-0 bg-stone-900 flex items-center justify-center">
            <span className="text-2xl">🏃</span>
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-stone-950 to-transparent py-0.5 text-center">
              <span className="text-[8px] font-mono uppercase text-amber-200 font-bold tracking-tighter">
                Sapiens
              </span>
            </div>
          </div>

          {/* Landscape Selector & Band Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                <span>{landscapeLabels[currentLandscape].icon}</span>
                <span>{landscapeLabels[currentLandscape].name}</span>
              </span>
            </div>

            {/* Landscape Quick Toggle Pills */}
            <div className="flex items-center gap-1">
              {(['river_meadow', 'wetland_oasis', 'mountain_pass'] as SapiensLandscape[]).map(l => (
                <button
                  key={l}
                  onClick={() => onSelectLandscape(l)}
                  className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded transition cursor-pointer border ${
                    currentLandscape === l
                      ? 'bg-amber-500/30 text-amber-200 border-amber-400 font-bold shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                      : 'bg-stone-900/60 text-stone-400 border-stone-800 hover:text-stone-200'
                  }`}
                >
                  {l === 'river_meadow' ? '🌾 Meadow' : l === 'wetland_oasis' ? '🪷 Oasis' : '🏔️ Mountain'}
                </button>
              ))}
            </div>

            {/* Band Size & Dunbar Limit */}
            <div className="flex items-center gap-2 text-[10px] font-mono text-stone-300 pt-0.5">
              <span>Band: <strong className="text-amber-300">{resources.population}</strong> / {resources.dunbarLimit} max</span>
              <span>•</span>
              <span>Season: <strong className="text-stone-200">#{turnCount}</strong></span>
            </div>
          </div>
        </div>

        {/* Top-Center: Shared Myth Combo Gauge & Beast Warning */}
        <div className="pointer-events-auto flex flex-col items-center gap-1 max-w-sm w-full mx-auto">
          {/* Sabertooth Predator Pursuit Alert */}
          {runStats.beastAlert && (
            <div className="w-full bg-rose-950/95 border-2 border-rose-500 rounded px-3 py-1 text-center shadow-xl animate-pulse">
              <span className="text-xs sm:text-sm font-black font-mono text-rose-200 uppercase tracking-widest flex items-center justify-center gap-1.5">
                <span>⚠️</span> SABERTOOTH CAT PURSUIT! JUMP / SLIDE TO SURVIVE!
              </span>
            </div>
          )}

          {/* Shared Myth / Cooperation Combo Gauge */}
          <div className="bg-stone-950/90 border border-amber-600/40 rounded-full px-3 py-1 flex items-center gap-2 shadow-xl backdrop-blur-md">
            <span className="text-[10px] font-mono uppercase text-amber-400 font-bold tracking-wider">
              Shared Myth
            </span>
            <div className="w-24 sm:w-36 h-2 bg-stone-900 rounded-full overflow-hidden border border-amber-900/60">
              <div
                className="h-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-300 transition-all duration-150 shadow-[0_0_8px_#f59e0b]"
                style={{ width: `${Math.min(100, (runStats.comboStreak % 4) * 25 || (runStats.comboStreak > 0 ? 100 : 0))}%` }}
              />
            </div>
            <span className="text-xs font-black font-mono text-amber-300 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-700 tabular-nums">
              x{comboMultiplier}
            </span>
          </div>

          {/* Active Power-Up Banner */}
          {runStats.activePowerUp && (
            <div className="bg-amber-950/90 border border-amber-400 rounded-full px-3 py-0.5 text-[10px] font-mono text-amber-200 uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.5)]">
              <span>
                {runStats.activePowerUp === 'magnet' && '🔥 Prometheus Fire Torch Magnet'}
                {runStats.activePowerUp === 'shield' && '🛡️ Lion-Man Ivory Amulet'}
                {runStats.activePowerUp === 'surge' && '⚡ Cognitive Fire Surge'}
              </span>
              <span className="font-bold tabular-nums">
                {runStats.powerUpTimeLeft > 0 ? `${runStats.powerUpTimeLeft.toFixed(1)}s` : 'Active'}
              </span>
            </div>
          )}
        </div>

        {/* Top-Right: Amber Pickups, Distance, Sound & Pause */}
        <div className="pointer-events-auto bg-stone-950/90 border border-amber-600/40 rounded-xl p-2 sm:p-2.5 shadow-2xl backdrop-blur-md flex items-center gap-2.5">
          {/* Amber Gems / Pickups */}
          <div className="flex items-center gap-1.5 bg-amber-950/60 border border-amber-500/50 px-2 py-1 rounded-lg">
            <span className="text-base">🔸</span>
            <span className="text-sm font-black font-mono text-amber-200 tabular-nums">
              {runStats.pickupsCollected}
            </span>
          </div>

          {/* Exploration Distance */}
          <div className="hidden sm:flex flex-col items-end px-1 font-mono text-right">
            <span className="text-[9px] text-stone-400 uppercase">Migration</span>
            <span className="text-xs font-bold text-amber-200 tabular-nums">
              {Math.floor(runStats.distanceTraveled)}m
            </span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleMute}
            className="p-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 rounded-lg transition active:scale-95 cursor-pointer"
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
            className="p-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 rounded-lg transition active:scale-95 cursor-pointer"
            title="Pause Game [Esc]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          </button>
        </div>
      </div>

      {/* ACTIVE HARARI QUEST BANNER */}
      {activeQuest && (
        <div className="pointer-events-auto self-center max-w-lg w-full bg-stone-950/85 border border-amber-700/50 rounded-lg p-2 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between text-[10px] font-mono text-amber-300 border-b border-stone-800 pb-1">
            <span className="font-bold uppercase tracking-wider">
              Quest: {activeQuest.title}
            </span>
            <span className="text-stone-400">{activeQuest.harariChapter}</span>
          </div>
          <p className="text-xs text-stone-200 mt-1 leading-snug">
            {activeQuest.description}
          </p>
          <div className="text-[10px] font-mono text-amber-400/90 mt-1 flex items-center justify-between">
            <span>Objective: {activeQuest.objective}</span>
            <span className="text-stone-400">{eraLabels[era]}</span>
          </div>
        </div>
      )}

      {/* BOTTOM RUNNER CONTROLS & DOCK */}
      <div className="flex flex-col items-center gap-2.5 w-full">
        {/* Temple Run Locomotion Controls */}
        <div className="pointer-events-auto flex items-center justify-center gap-1.5 sm:gap-3 bg-stone-950/85 border border-amber-600/40 rounded-2xl px-3 py-2 shadow-2xl backdrop-blur-md">
          {/* Shift Left */}
          <button
            onClick={onTriggerLaneLeft}
            className="px-3 py-2 bg-stone-900 hover:bg-stone-800 active:bg-amber-600 active:scale-95 border border-stone-700 text-stone-200 text-xs font-bold rounded-xl flex items-center gap-1 transition cursor-pointer"
            title="Shift Left Lane [A / Left Arrow]"
          >
            <span>⬅️</span>
            <span className="hidden sm:inline">Left [A]</span>
          </button>

          {/* Jump Over Logs */}
          <button
            onClick={onTriggerJump}
            className="px-3.5 py-2 bg-amber-600/30 hover:bg-amber-600/50 active:bg-amber-500 active:scale-95 border border-amber-400 text-amber-100 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.3)]"
            title="Leap Over Logs [Space / W / Up Arrow]"
          >
            <span>🪵</span>
            <span>Jump [Space]</span>
          </button>

          {/* Slide Under Stone Arch */}
          <button
            onClick={onTriggerSlide}
            className="px-3.5 py-2 bg-stone-800 hover:bg-amber-900/40 active:bg-amber-700 active:scale-95 border border-amber-600 text-amber-100 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.2)]"
            title="Slide Under Stone Arches [S / Down Arrow / C]"
          >
            <span>🏛️</span>
            <span>Slide [S]</span>
          </button>

          {/* Shift Right */}
          <button
            onClick={onTriggerLaneRight}
            className="px-3 py-2 bg-stone-900 hover:bg-stone-800 active:bg-amber-600 active:scale-95 border border-stone-700 text-stone-200 text-xs font-bold rounded-xl flex items-center gap-1 transition cursor-pointer"
            title="Shift Right Lane [D / Right Arrow]"
          >
            <span className="hidden sm:inline">Right [D]</span>
            <span>➡️</span>
          </button>

          {/* Sprint Boost */}
          <button
            onClick={onToggleSprint}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
              isSprinting
                ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-[0_0_15px_#f59e0b]'
                : 'bg-stone-900 hover:bg-stone-800 border-stone-700 text-amber-300'
            }`}
            title="Sprint Boost [Shift]"
          >
            <span>⚡</span>
            <span className="hidden sm:inline">Sprint</span>
          </button>

          {/* Stamina Meter */}
          <div className="hidden md:flex items-center gap-1.5 pl-1 text-[10px] font-mono text-amber-300">
            <span>Stamina:</span>
            <div className="w-16 h-2 bg-stone-900 rounded-full overflow-hidden border border-amber-900">
              <div
                className="h-full bg-amber-400 transition-all duration-100"
                style={{ width: `${runStats.sprintEnergy}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tactical Dock: Tribal Dilemma, Discoveries, Sapiens Codex & Advance Season */}
        <div className="pointer-events-auto flex flex-col items-center">
          <button
            onClick={() => setDockCollapsed(prev => !prev)}
            className="text-[10px] font-mono text-amber-400 hover:text-amber-200 bg-stone-950/80 px-2.5 py-0.5 rounded-t border border-b-0 border-amber-900/60 transition cursor-pointer"
          >
            {dockCollapsed ? '▲ Expand Sapiens Council' : '▼ Collapse Dock'}
          </button>

          {!dockCollapsed && (
            <div className="bg-stone-950/90 border border-amber-900/60 rounded-xl p-1.5 sm:p-2 shadow-2xl flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
              <button
                onClick={onOpenDilemmas}
                className="px-2.5 py-1.5 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-700/60 text-amber-200 text-xs font-medium rounded-lg flex items-center gap-1 transition cursor-pointer"
              >
                <span>👥</span>
                <span>Tribal Council [D]</span>
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
                className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 active:scale-95 text-stone-950 text-xs font-black uppercase rounded-lg shadow-[0_0_12px_rgba(245,158,11,0.4)] transition cursor-pointer"
              >
                Next Season &gt;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
