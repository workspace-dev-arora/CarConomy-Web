import React from 'react';
import { ArrowRight, Fuel, Wrench, Shield, TrendingDown, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Vehicle, Driver, FinancialProfile, OwnershipProfile, CalculatedEconomics } from '../types';
import { formatINR } from '../utils/formatters';

interface HomeDashboardProps {
  vehicle: Vehicle;
  drivers: Driver[];
  finance: FinancialProfile;
  ownership: OwnershipProfile;
  economics: CalculatedEconomics;
  onOpenKeepSell: () => void;
  onUpdateDrivers?: (drivers: Driver[]) => void;
  onUpdateFinance?: (finance: FinancialProfile) => void;
  onNavigateTab: (tab: string) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  vehicle,
  economics,
  onOpenKeepSell,
  onNavigateTab,
}) => {
  const isKeep = economics.keepSellDecision === 'KEEP';

  // Calculate percentages for stacked visualization
  const total = Math.max(1, economics.annualTotalCost);
  const fuelPct = Math.round((economics.annualFuelCost / total) * 100);
  const maintPct = Math.round((economics.annualMaintenance / total) * 100);
  const insPct = Math.round((economics.annualInsurance / total) * 100);
  const depPct = Math.max(5, 100 - (fuelPct + maintPct + insPct));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. TOP GREETING */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1 border-b border-white/8 pb-4">
        <div>
          <span className="text-xs font-medium text-zinc-400 block tracking-wide">
            Good morning, Abhinav
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
            Your {vehicle.make} {vehicle.model}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('MY_CAR')}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-all cursor-pointer"
          >
            Manage Vehicle &rarr;
          </button>
          <button
            onClick={() => onNavigateTab('CONSULTANCY')}
            className="px-4 py-2 rounded-xl bg-[#CCFF00] hover:bg-[#b8e600] text-black font-bold text-xs transition-all shadow-md shadow-[#CCFF00]/15 cursor-pointer"
          >
            Ask AI Advisor ✨
          </button>
        </div>
      </div>

      {/* 2. GRID CONTAINER FOR DESKTOP & MOBILE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* HERO METRIC POD (COL SPAN 2 ON DESKTOP) */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#131822] via-[#0E1219] to-[#0A0D12] border border-white/10 shadow-xl relative overflow-hidden flex flex-col justify-between">
          {/* Subtle ambient glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#CCFF00]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
              <div>
                <div className="text-4xl sm:text-6xl font-black text-white tracking-tight font-mono-numbers flex items-baseline gap-2">
                  <span className="text-[#CCFF00]">₹{economics.costPerKm.toFixed(1)}</span>
                  <span className="text-xl font-light text-zinc-400 font-sans tracking-normal">
                    / km
                  </span>
                </div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 mt-1 block">
                  TRUE COST OF OWNERSHIP PER KM
                </span>
              </div>

              <div className="sm:text-right">
                <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono-numbers block">
                  {formatINR(economics.annualTotalCost)}
                </span>
                <span className="text-zinc-400 text-xs font-semibold">Annual total cost</span>
              </div>
            </div>

            {/* COMPACT STACKED VISUALIZATION */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
                <span>Cost Breakdown Distribution</span>
                <button
                  onClick={() => onNavigateTab('COSTS')}
                  className="text-[#CCFF00] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Detailed breakdown</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Multi-segment progress bar */}
              <div className="h-3 w-full rounded-full bg-zinc-800 flex overflow-hidden">
                <div style={{ width: `${fuelPct}%` }} className={`${economics.energyType === 'ELECTRIC' ? 'bg-[#CCFF00]' : 'bg-amber-400'} h-full`} title={`${economics.energyMetricLabel} ${fuelPct}%`} />
                <div style={{ width: `${maintPct}%` }} className="bg-blue-400 h-full" title={`Maintenance ${maintPct}%`} />
                <div style={{ width: `${insPct}%` }} className="bg-emerald-400 h-full" title={`Insurance ${insPct}%`} />
                <div style={{ width: `${depPct}%` }} className="bg-rose-400 h-full" title={`Depreciation ${depPct}%`} />
              </div>

              {/* 4 Clean Breakdown Numbers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1.5 font-semibold">
                    <span className={`w-2 h-2 rounded-full ${economics.energyType === 'ELECTRIC' ? 'bg-[#CCFF00]' : 'bg-amber-400'}`} /> {economics.energyMetricLabel}
                  </span>
                  <span className="text-sm font-bold text-white font-mono-numbers block mt-1">
                    {formatINR(economics.annualFuelCost)}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1.5 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-blue-400" /> Maintenance
                  </span>
                  <span className="text-sm font-bold text-white font-mono-numbers block mt-1">
                    {formatINR(economics.annualMaintenance)}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1.5 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> Insurance
                  </span>
                  <span className="text-sm font-bold text-white font-mono-numbers block mt-1">
                    {formatINR(economics.annualInsurance)}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1.5 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-rose-400" /> Depreciation
                  </span>
                  <span className="text-sm font-bold text-white font-mono-numbers block mt-1">
                    {formatINR(economics.annualDepreciation)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: KEEP OR SELL + INSIGHT CARD */}
        <div className="space-y-5 flex flex-col justify-between">
          {/* KEEP OR SELL DECISION CARD */}
          <div className={`p-6 rounded-3xl border transition-all flex-1 flex flex-col justify-between ${
            isKeep 
              ? 'bg-gradient-to-br from-[#121B13] via-[#0E1410] to-[#0A0D12] border-emerald-500/30'
              : 'bg-gradient-to-br from-[#1B1612] via-[#14100E] to-[#0A0D12] border-amber-500/30'
          }`}>
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-400 block">
                    KEEP OR SELL?
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-3xl font-black tracking-tight ${
                      isKeep ? 'text-[#CCFF00]' : 'text-amber-400'
                    }`}>
                      {isKeep ? 'KEEP' : 'SELL'}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-zinc-300 font-semibold font-mono-numbers">
                      12M Verdict
                    </span>
                  </div>
                </div>

                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  isKeep ? 'bg-[#CCFF00]/15 text-[#CCFF00]' : 'bg-amber-400/15 text-amber-400'
                }`}>
                  {isKeep ? <ShieldCheck className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mt-3">
                {economics.keepSellReason}
              </p>
            </div>

            <button
              onClick={onOpenKeepSell}
              className="w-full mt-5 py-3 rounded-2xl bg-white/10 hover:bg-[#CCFF00] text-white hover:text-black font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[46px]"
            >
              <span>Explore 12M Cost Analysis</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* HOUSEHOLD INSIGHT CARD */}
          <div className="p-4 rounded-2xl bg-[#0F131A] border border-white/8 flex items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#CCFF00] uppercase tracking-wider block">
                HOUSEHOLD INSIGHT
              </span>
              <p className="text-xs text-zinc-300 leading-snug">
                Driving patterns add <strong className="text-white font-mono-numbers">+{formatINR(economics.householdAdditionalWear)}/yr</strong> in wear.
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('DRIVERS')}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-semibold whitespace-nowrap border border-white/10 transition-colors cursor-pointer shrink-0"
            >
              Drivers &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
