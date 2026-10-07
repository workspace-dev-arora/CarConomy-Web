import React from 'react';
import { Home, Car, Scale, PieChart, MoreHorizontal } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const items = [
    { id: 'HOME', label: 'HOME', icon: Home },
    { id: 'MY_CAR', label: 'MY CAR', icon: Car },
    { id: 'COMPARE', label: 'COMPARE', icon: Scale },
    { id: 'COSTS', label: 'COSTS', icon: PieChart },
    { id: 'MORE', label: 'MORE', icon: MoreHorizontal },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#090C11]/95 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all cursor-pointer min-h-[48px] ${
                isActive
                  ? 'text-[#CCFF00]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <div className={`p-1 rounded-lg transition-transform ${isActive ? 'bg-[#CCFF00]/15 scale-110' : ''}`}>
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] tracking-wider mt-0.5 ${isActive ? 'font-black text-[#CCFF00]' : 'font-semibold'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
