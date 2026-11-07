import React from 'react';
import { GameResources } from '../types/game';

interface VictoryModalProps {
  resources: GameResources;
  turnCount: number;
  onRestart: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  resources,
  turnCount,
  onRestart,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
      <div className="bg-stone-900 border border-amber-500 text-stone-100 max-w-lg w-full rounded-xl shadow-2xl p-6 sm:p-8 text-center space-y-4">
        <div className="inline-block p-3 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 mb-1">
          <svg className="w-10 h-10 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>

        <h2 className="text-2xl sm:text-3xl font-serif font-black text-amber-100">
          From Insignificance to Gods
        </h2>
        <div className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
          Scientific Revolution Fulfilled · Homo Deus Horizon
        </div>

        <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-serif italic bg-stone-950/60 p-3 rounded border border-stone-800">
          "70,000 years ago, Homo sapiens was an insignificant animal minding its own business in a corner of Africa. In the millennia since, we have transformed ourselves into the masters of the entire planet and the terror of the ecosystem. Today we stand on the verge of becoming gods, poised to acquire not only eternal youth, but also divine abilities of creation and destruction."
          <span className="block not-italic font-mono text-[10px] text-stone-400 mt-1">
            — Yuval Noah Harari, Sapiens
          </span>
        </p>

        {/* Mastery Metrics */}
        <div className="grid grid-cols-3 gap-2 py-2 border-y border-stone-800 text-xs font-mono">
          <div className="bg-stone-950 p-2 rounded">
            <div className="text-stone-400 text-[10px]">Seasons</div>
            <div className="font-bold text-amber-300 text-base tabular-nums">{turnCount}</div>
          </div>
          <div className="bg-stone-950 p-2 rounded">
            <div className="text-stone-400 text-[10px]">Population</div>
            <div className="font-bold text-amber-300 text-base tabular-nums">{resources.population}</div>
          </div>
          <div className="bg-stone-950 p-2 rounded">
            <div className="text-stone-400 text-[10px]">Knowledge</div>
            <div className="font-bold text-amber-300 text-base tabular-nums">{resources.knowledge}</div>
          </div>
        </div>

        <button
          data-start="true"
          onClick={onRestart}
          className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs uppercase tracking-wide rounded shadow-lg transition active:scale-95 cursor-pointer"
        >
          Begin a New Human Odyssey
        </button>
      </div>
    </div>
  );
};

interface GameOverModalProps {
  resources: GameResources;
  turnCount: number;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  resources,
  turnCount,
  onRestart,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
      <div className="bg-stone-900 border border-rose-800 text-stone-100 max-w-lg w-full rounded-xl shadow-2xl p-6 sm:p-8 text-center space-y-4">
        <div className="inline-block p-3 bg-rose-500/10 border border-rose-500/30 rounded-full text-rose-400 mb-1">
          <svg className="w-10 h-10 mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>

        <h2 className="text-2xl sm:text-3xl font-serif font-black text-rose-200">
          The Extinction of the Clan
        </h2>
        <div className="text-xs font-mono uppercase tracking-wider text-rose-400 font-semibold">
          Famine & Social Dissolution
        </div>

        <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-serif italic bg-stone-950/60 p-3 rounded border border-stone-800">
          "Six human species once walked the Earth. Today, only Homo sapiens remains. But survival was never guaranteed. When bands lose their shared myth or exhaust their calories, nature reclaims their hearths without ceremony."
          <span className="block not-italic font-mono text-[10px] text-stone-400 mt-1">
            — Yuval Noah Harari
          </span>
        </p>

        {/* Progress Metrics */}
        <div className="grid grid-cols-2 gap-2 py-2 border-y border-stone-800 text-xs font-mono">
          <div className="bg-stone-950 p-2 rounded">
            <div className="text-stone-400 text-[10px]">Seasons Survived</div>
            <div className="font-bold text-stone-200 text-base tabular-nums">{turnCount}</div>
          </div>
          <div className="bg-stone-950 p-2 rounded">
            <div className="text-stone-400 text-[10px]">Knowledge Gathered</div>
            <div className="font-bold text-stone-200 text-base tabular-nums">{resources.knowledge}</div>
          </div>
        </div>

        <button
          data-start="true"
          onClick={onRestart}
          className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-stone-100 font-bold text-xs uppercase tracking-wide rounded shadow-lg transition active:scale-95 cursor-pointer"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onTitle: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onTitle,
  onToggleMute,
  isMuted,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-stone-900 border border-stone-700 text-stone-100 max-w-sm w-full rounded-xl shadow-2xl p-6 text-center space-y-4">
        <h2 className="text-2xl font-serif font-black text-amber-100">
          Game Paused
        </h2>
        <p className="text-xs text-stone-400 font-mono">
          Press Esc or Resume to return to the simulation
        </p>

        <div className="space-y-2 pt-2">
          <button
            onClick={onResume}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs uppercase tracking-wide rounded transition cursor-pointer"
          >
            Resume
          </button>
          <button
            onClick={onToggleMute}
            className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono rounded transition cursor-pointer"
          >
            {isMuted ? 'Unmute Sound' : 'Mute Sound'}
          </button>
          <button
            onClick={onRestart}
            className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono rounded transition cursor-pointer"
          >
            Restart Run
          </button>
          <button
            onClick={onTitle}
            className="w-full py-2 bg-stone-950 hover:bg-stone-900 border border-stone-800 text-stone-400 text-xs font-mono rounded transition cursor-pointer"
          >
            Return to Title
          </button>
        </div>
      </div>
    </div>
  );
};
