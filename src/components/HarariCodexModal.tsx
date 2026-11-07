import React, { useState } from 'react';
import { CodexEntry, HistoricalEra } from '../types/game';

interface HarariCodexModalProps {
  entries: CodexEntry[];
  onClose: () => void;
}

export const HarariCodexModal: React.FC<HarariCodexModalProps> = ({
  entries,
  onClose,
}) => {
  const [selectedEntry, setSelectedEntry] = useState<CodexEntry>(entries[0]);
  const [selectedEra, setSelectedEra] = useState<HistoricalEra | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEntries = entries.filter((entry) => {
    const matchesEra = selectedEra === 'all' || entry.era === selectedEra;
    const matchesSearch =
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.concept.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesEra && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-stone-900 border border-stone-700 text-stone-100 max-w-4xl w-full rounded-xl shadow-2xl p-5 sm:p-7 relative overflow-hidden flex flex-col h-[88vh]">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-stone-800 pb-3 shrink-0">
          <div>
            <div className="text-xs uppercase font-mono tracking-wider text-purple-400 font-bold">
              Encyclopedic Compendium
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-black text-amber-100 mt-0.5">
              Harari's Sapiens Codex
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 p-1.5 rounded transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-4 flex flex-wrap gap-2 items-center justify-between shrink-0">
          <div className="flex gap-1.5">
            {(['all', 'cognitive', 'agricultural', 'scientific'] as const).map((era) => (
              <button
                key={era}
                onClick={() => setSelectedEra(era)}
                className={`px-3 py-1 text-xs rounded font-mono uppercase transition cursor-pointer ${
                  selectedEra === era
                    ? 'bg-amber-600 text-stone-950 font-bold'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                {era}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search concepts, myths, theories..."
            className="bg-stone-950 border border-stone-700 px-3 py-1 text-xs rounded text-stone-200 placeholder-stone-500 w-full sm:w-64 focus:outline-none focus:border-amber-500 font-mono"
          />
        </div>

        {/* Main 2-column view */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0 overflow-hidden">
          {/* Left Column: Entries List */}
          <div className="space-y-2 overflow-y-auto pr-1 border-r border-stone-800 md:col-span-1">
            {filteredEntries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => setSelectedEntry(entry)}
                className={`w-full text-left p-3 rounded-lg border transition cursor-pointer block ${
                  selectedEntry.id === entry.id
                    ? 'bg-amber-600/20 border-amber-500 text-amber-100'
                    : 'bg-stone-950/60 border-stone-800 hover:border-stone-700 text-stone-300'
                }`}
              >
                <div className="text-[10px] font-mono uppercase text-amber-400">
                  {entry.era} era
                </div>
                <div className="font-serif font-bold text-sm text-stone-100 mt-0.5">
                  {entry.title}
                </div>
                <div className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">
                  {entry.concept}
                </div>
              </button>
            ))}

            {filteredEntries.length === 0 && (
              <div className="p-4 text-xs text-stone-500 italic text-center font-mono">
                No entries match your search.
              </div>
            )}
          </div>

          {/* Right Column: Detailed Reader */}
          <div className="overflow-y-auto p-2 sm:p-4 bg-stone-950/70 rounded-lg border border-stone-800 md:col-span-2 space-y-4">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded border border-amber-800">
                {selectedEntry.era} revolution
              </span>
              <h3 className="text-2xl font-serif font-black text-amber-100 mt-2">
                {selectedEntry.title}
              </h3>
              <p className="text-xs font-mono text-purple-300 mt-0.5">
                Core Concept: {selectedEntry.concept}
              </p>
            </div>

            <div className="text-xs sm:text-sm text-stone-200 leading-relaxed">
              {selectedEntry.summary}
            </div>

            <blockquote className="border-l-3 border-amber-500 pl-4 py-2 text-xs sm:text-sm italic text-amber-200/95 font-serif bg-stone-900/40 rounded-r">
              "{selectedEntry.harariQuote}"
              <div className="text-[10px] font-mono not-italic text-stone-400 mt-1 font-semibold">
                — Yuval Noah Harari
              </div>
            </blockquote>

            <div className="space-y-2 text-xs sm:text-sm text-stone-300 leading-relaxed">
              <h4 className="font-serif font-bold text-amber-100 text-sm">
                Historical & Evolutionary Impact:
              </h4>
              <p>{selectedEntry.discussion}</p>
            </div>

            <div className="p-3 bg-amber-950/30 border border-amber-700/50 rounded-lg text-xs font-mono text-amber-200">
              <span className="font-bold uppercase tracking-wider text-amber-400">Key Takeaway: </span>
              {selectedEntry.keyTakeaway}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
