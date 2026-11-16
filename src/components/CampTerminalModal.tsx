import React, { useState } from 'react';
import {
  SimProductType,
  SimRackState,
  SimState,
} from '../types/game';
import {
  SIM_CATALOG,
  SIM_EXPANSIONS,
  SIM_RACK_COST,
  SIM_STAFF_OPTIONS,
  calculateCustomerDemandMultiplier,
  calculateOrderCost,
} from '../game/rules';

interface CampTerminalModalProps {
  simState: SimState;
  racks: SimRackState[];
  onOrderCrate: (productType: SimProductType, qty: number) => void;
  onAdjustPrice: (productType: SimProductType, delta: number) => void;
  onBuyRack: (productType: SimProductType) => void;
  onExpandCamp: (tier: number) => void;
  onHireStaff: (role: 'restocker' | 'barterer') => void;
  onClose: () => void;
}

export const CampTerminalModal: React.FC<CampTerminalModalProps> = ({
  simState,
  racks,
  onOrderCrate,
  onAdjustPrice,
  onBuyRack,
  onExpandCamp,
  onHireStaff,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'supply' | 'build' | 'staff'>('supply');
  const currentTier = SIM_EXPANSIONS.find(e => e.tier === simState.expansionTier) || SIM_EXPANSIONS[0];
  const products = Object.values(SIM_CATALOG);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-stone-950/75 p-3 sm:p-6">
      <div className="w-full max-w-4xl max-h-[88vh] flex flex-col bg-stone-900 border-2 border-amber-600/60 rounded-2xl shadow-2xl overflow-hidden text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-stone-950 border-b border-amber-700/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/60 flex items-center justify-center text-xl">
              🏺
            </div>
            <div>
              <h2 className="font-serif font-black text-lg sm:text-xl text-amber-200 tracking-wide">
                Chronicle &amp; Supply Terminal
              </h2>
              <p className="text-[11px] font-mono text-stone-400">
                Cowrie Shell Ledger · {currentTier.name} (Racks: {racks.length}/{currentTier.maxRacks})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-amber-950/80 border border-amber-500/50 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
              <span>🐚</span>
              <span className="font-mono font-black text-amber-200 text-sm tabular-nums">
                {simState.shells} Shells
              </span>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-200 text-xs font-mono font-bold cursor-pointer"
            >
              Close [Esc]
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 px-4 sm:px-6 py-2.5 bg-stone-950/70 border-b border-stone-800">
          {[
            { id: 'supply' as const, label: '📦 Supply & Prices', badge: `${simState.dockCratesCount} at Dock` },
            { id: 'build' as const, label: '🏗️ Racks & Territory', badge: `${racks.length}/${currentTier.maxRacks}` },
            { id: 'staff' as const, label: '👥 Band Helpers', badge: `${Number(simState.restockerHired) + Number(simState.bartererHired)}/2` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition cursor-pointer border ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-stone-950 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                  : 'bg-stone-900 text-stone-300 border-stone-700 hover:border-stone-500'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                activeTab === tab.id ? 'bg-stone-950/20 text-stone-950' : 'bg-stone-800 text-amber-300'
              }`}>
                {tab.badge}
              </span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeTab === 'supply' && (
            <>
              <div className="bg-amber-950/30 border border-amber-700/40 rounded-xl p-3 text-xs text-amber-100/90 flex items-start gap-2.5">
                <span className="text-base">💡</span>
                <div>
                  <strong className="text-amber-300">Harari&apos;s Barter &amp; Trust Rule:</strong> Ordered crates arrive immediately on your{' '}
                  <span className="text-amber-200 font-semibold">Riverbank Supply Dock</span>. Walk up and press{' '}
                  <kbd className="bg-stone-950 border border-stone-700 px-1.5 py-0.5 rounded text-[10px] font-mono">E</kbd>{' '}
                  to carry crates to matching racks, then serve visiting tribespeople at the Barter Counter!
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {products.map(item => {
                  const setPrice = simState.prices[item.id];
                  const demand = calculateCustomerDemandMultiplier(item.id, setPrice);
                  const singleCost = calculateOrderCost(item.id, 1);
                  const doubleCost = calculateOrderCost(item.id, 2);
                  const currentStock = racks
                    .filter(r => r.productType === item.id)
                    .reduce((sum, r) => sum + r.stock, 0);
                  const hasRack = racks.some(r => r.productType === item.id);

                  return (
                    <div
                      key={item.id}
                      className="bg-stone-950/80 border border-stone-800 rounded-xl p-4 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-lg bg-stone-900 border border-stone-700 flex items-center justify-center text-2xl">
                              {item.icon}
                            </div>
                            <div>
                              <h3 className="font-bold text-sm text-amber-100">{item.name}</h3>
                              <div className="text-[10px] font-mono text-amber-400">
                                {item.eraLabel} · {item.crateUnits} units/crate
                              </div>
                            </div>
                          </div>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-300">
                            Stock: <strong className="text-amber-300">{currentStock}</strong>
                          </span>
                        </div>

                        <p className="text-[11px] text-stone-400 mt-2 leading-relaxed">
                          {item.harariMeaning}
                        </p>
                      </div>

                      {/* Price Control Row */}
                      <div className="bg-stone-900/90 border border-stone-800 rounded-lg p-2.5 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-mono uppercase text-stone-400">
                            Barter Price (Market: {item.baseBarterPrice} 🐚)
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono font-black text-sm text-amber-200">
                              {setPrice} Shells / unit
                            </span>
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                                demand.fairLabel === 'Bargain'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                  : demand.fairLabel === 'Fair Value'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-700'
                                  : 'bg-rose-950 text-rose-300 border border-rose-700'
                              }`}
                            >
                              {demand.fairLabel}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onAdjustPrice(item.id, -1)}
                            className="w-7 h-7 rounded bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-200 font-bold cursor-pointer"
                          >
                            -
                          </button>
                          <button
                            onClick={() => onAdjustPrice(item.id, 1)}
                            className="w-7 h-7 rounded bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-200 font-bold cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Order Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          disabled={simState.shells < singleCost}
                          onClick={() => onOrderCrate(item.id, 1)}
                          className="flex-1 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-stone-800 disabled:text-stone-500 text-stone-950 font-mono font-bold text-xs transition cursor-pointer disabled:cursor-not-allowed"
                        >
                          Order 1 Crate ({singleCost} 🐚)
                        </button>
                        <button
                          disabled={simState.shells < doubleCost}
                          onClick={() => onOrderCrate(item.id, 2)}
                          className="py-2 px-3 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-40 border border-amber-600/50 text-amber-200 font-mono font-bold text-xs transition cursor-pointer disabled:cursor-not-allowed"
                        >
                          x2 ({doubleCost} 🐚)
                        </button>
                      </div>

                      {!hasRack && (
                        <div className="text-[10px] font-mono text-amber-400">
                          Tip: Build a {item.name.split(' ')[0]} Rack in &ldquo;Racks &amp; Territory&rdquo; to display this item!
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === 'build' && (
            <div className="space-y-5">
              {/* Placeable Camp Display Racks */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-amber-300 font-bold mb-2.5">
                  Build Display Racks ({SIM_RACK_COST} Shells each · Enters Green/Red 3D Placement Mode)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {products.map(item => {
                    const atLimit = racks.length >= currentTier.maxRacks;
                    const canAfford = simState.shells >= SIM_RACK_COST && !atLimit;
                    return (
                      <div
                        key={item.id}
                        className="bg-stone-950/85 border border-stone-800 rounded-xl p-3.5 flex flex-col justify-between gap-2.5"
                      >
                        <div>
                          <div className="text-2xl mb-1">{item.icon}</div>
                          <div className="font-bold text-sm text-amber-100">
                            {item.name.split(' ')[0]} Rack
                          </div>
                          <div className="text-[11px] text-stone-400 mt-0.5">
                            Holds {item.crateUnits} {item.name.toLowerCase()} for visiting tribes.
                          </div>
                        </div>
                        <button
                          disabled={!canAfford}
                          onClick={() => onBuyRack(item.id)}
                          className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-stone-800 disabled:text-stone-500 text-stone-950 font-mono font-black text-xs transition cursor-pointer disabled:cursor-not-allowed"
                        >
                          {atLimit ? 'Expand Camp First' : `Place (${SIM_RACK_COST} 🐚)`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Camp Territory Expansions */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-amber-300 font-bold mb-2.5">
                  Settlement Territory Expansions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {SIM_EXPANSIONS.map(exp => {
                    const owned = simState.expansionTier >= exp.tier;
                    const isNext = simState.expansionTier + 1 === exp.tier;
                    const canAfford = isNext && simState.shells >= exp.cost;

                    return (
                      <div
                        key={exp.tier}
                        className={`rounded-xl p-4 border flex flex-col justify-between gap-3 ${
                          owned
                            ? 'bg-amber-950/35 border-amber-500/60'
                            : 'bg-stone-950/80 border-stone-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                              Tier {exp.tier}
                            </span>
                            {owned && (
                              <span className="text-[10px] font-mono bg-amber-500 text-stone-950 px-1.5 py-0.5 rounded font-bold">
                                Active
                              </span>
                            )}
                          </div>
                          <h4 className="font-serif font-bold text-base text-amber-100 mt-1">
                            {exp.name}
                          </h4>
                          <p className="text-xs text-stone-400 mt-1 font-mono">
                            Max Racks: {exp.maxRacks} · Radius: {exp.radius}m
                          </p>
                        </div>

                        {!owned && (
                          <button
                            disabled={!canAfford}
                            onClick={() => onExpandCamp(exp.tier)}
                            className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-stone-800 disabled:text-stone-500 text-stone-950 font-mono font-bold text-xs transition cursor-pointer disabled:cursor-not-allowed"
                          >
                            {isNext ? `Expand Territory (${exp.cost} 🐚)` : 'Unlock Previous Tier'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SIM_STAFF_OPTIONS.map(staff => {
                const isHired =
                  staff.role === 'restocker' ? simState.restockerHired : simState.bartererHired;
                const canAfford = !isHired && simState.shells >= staff.cost;

                return (
                  <div
                    key={staff.id}
                    className={`rounded-xl p-4 border flex flex-col justify-between gap-3 ${
                      isHired
                        ? 'bg-emerald-950/30 border-emerald-500/60'
                        : 'bg-stone-950/80 border-stone-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">
                          {staff.role === 'restocker' ? '🧺' : '📜'}
                        </span>
                        {isHired && (
                          <span className="text-[10px] font-mono bg-emerald-500 text-stone-950 px-2 py-0.5 rounded font-black uppercase">
                            Active in Camp
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-base text-amber-100 mt-2">{staff.name}</h3>
                      <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                        {staff.description}
                      </p>
                    </div>

                    {!isHired && (
                      <button
                        disabled={!canAfford}
                        onClick={() => onHireStaff(staff.role)}
                        className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-stone-800 disabled:text-stone-500 text-stone-950 font-mono font-black text-xs transition cursor-pointer disabled:cursor-not-allowed"
                      >
                        Hire Band Helper ({staff.cost} 🐚)
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
