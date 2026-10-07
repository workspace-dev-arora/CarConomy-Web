import React from 'react';
import { Car, ShieldCheck } from 'lucide-react';
import { Vehicle, CalculatedEconomics } from '../types';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  activeVehicle: Vehicle;
  economics: CalculatedEconomics;
  onOpenKeepSell: () => void;
  onResetDemo?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  activeVehicle,
  economics,
  onOpenKeepSell,
}) => {
  const desktopNavTabs = [
    { id: 'HOME', label: 'Dashboard' },
    { id: 'MY_CAR', label: 'My Garage' },
    { id: 'BUY', label: 'Buy Wizard' },
    { id: 'COMPARE', label: 'Compare' },
    { id: 'COSTS', label: 'Cost Breakdown' },
    { id: 'INSIGHTS', label: 'Insights' },
    { id: 'CONSULTANCY', label: 'AI Advisor' },
    { id: 'SERVICES', label: 'Services' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#08090C]/90 backdrop-blur-xl border-b border-white/8 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <button
          onClick={() => onSelectTab('HOME')}
          className="flex items-center gap-2.5 group text-left cursor-pointer shrink-0"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#CCFF00] to-[#88B800] flex items-center justify-center text-black font-black text-sm shadow-lg shadow-[#CCFF00]/20 group-hover:scale-105 transition-transform">
            C
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black tracking-tight text-white text-base font-sans">
              CARCONOMY
            </span>
            <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-2xl border border-white/8">
          {desktopNavTabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#CCFF00] text-black shadow-md shadow-[#CCFF00]/15 scale-102'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Buy Car, Active Vehicle & Keep/Sell */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onSelectTab('BUY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              currentTab === 'BUY'
                ? 'bg-[#CCFF00] text-black shadow-sm shadow-[#CCFF00]/20'
                : 'bg-white/10 text-white hover:bg-[#CCFF00] hover:text-black border border-white/10'
            }`}
            title="Pre-purchase affordability wizard"
          >
            <span className="font-mono-numbers text-xs">+ Buy Car</span>
          </button>

          <button
            onClick={() => onSelectTab('MY_CAR')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
          >
            <Car className="w-3.5 h-3.5 text-[#CCFF00]" />
            <span className="max-w-[90px] sm:max-w-[140px] truncate">{activeVehicle.model}</span>
          </button>

          <button
            onClick={onOpenKeepSell}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
              economics.keepSellDecision === 'KEEP'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/25 hover:bg-amber-500/20'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">{economics.keepSellDecision}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
