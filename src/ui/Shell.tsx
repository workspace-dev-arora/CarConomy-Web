import React from 'react';
import { Gauge, Car, Scale, Wrench, Settings, Sun, Moon } from 'lucide-react';
import { Vehicle } from '../types';
import { useTheme } from './theme';
import { cx } from './kit';

export type Tab = 'overview' | 'mycar' | 'decide' | 'services' | 'profile';
const NAV: { id: Tab; label: string; icon: React.ElementType; group: string }[] = [
  { id: 'overview', label: 'Overview', icon: Gauge, group: 'Know' },
  { id: 'mycar', label: 'My Car', icon: Car, group: 'Know' },
  { id: 'decide', label: 'Decide', icon: Scale, group: 'Decide' },
  { id: 'services', label: 'Services', icon: Wrench, group: 'Act' },
];

export const Shell: React.FC<{ tab: Tab; onTab: (t: Tab) => void; vehicles: Vehicle[]; activeId: string; onPick: (id: string) => void; children: React.ReactNode }> = ({ tab, onTab, vehicles, activeId, onPick, children }) => {
  const { theme, toggle } = useTheme();
  const picker = (
    <label className="block">
      <span className="sr-only">Active vehicle</span>
      <select value={activeId} onChange={e => onPick(e.target.value)}
        className="w-full bg-transparent border border-line rounded-full px-4 min-h-11 text-sm cursor-pointer focus:border-ink">
        {vehicles.map(v => <option key={v.id} value={v.id} className="bg-surface text-ink">{v.make} {v.model} · {v.variant}</option>)}
      </select>
    </label>
  );
  const ThemeBtn = (
    <button onClick={toggle} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      className="w-11 h-11 rounded-full border border-line flex items-center justify-center hover:border-ink cursor-pointer">
      {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </button>
  );
  let lastGroup = '';
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17rem_1fr]">
      {/* Desktop rail */}
      <aside className="hidden lg:flex flex-col sticky top-0 h-screen border-r border-line px-6 py-8">
        <p className="font-display text-3xl tracking-tight">Car<span className="text-accent">conomy</span></p>
        <nav className="mt-10 flex-1" aria-label="Primary">
          {NAV.map(n => {
            const head = n.group !== lastGroup; lastGroup = n.group;
            return (
              <div key={n.id}>
                {head && <p className="text-[11px] uppercase tracking-[0.16em] text-mute mt-6 mb-2">{n.group}</p>}
                <button onClick={() => onTab(n.id)} aria-current={tab === n.id ? 'page' : undefined}
                  className={cx('w-full flex items-center gap-3 px-3 min-h-11 rounded-lg text-sm cursor-pointer transition-colors',
                    tab === n.id ? 'bg-sunk font-semibold' : 'text-mute hover:text-ink')}>
                  <n.icon className="w-4 h-4" />{n.label}
                </button>
              </div>
            );
          })}
        </nav>
        <div className="space-y-3">
          {picker}
          <div className="flex gap-2">
            <button onClick={() => onTab('profile')} className={cx('flex-1 flex items-center justify-center gap-2 min-h-11 rounded-full border text-sm cursor-pointer', tab === 'profile' ? 'border-ink' : 'border-line hover:border-ink')}><Settings className="w-4 h-4" />Profile</button>
            {ThemeBtn}
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 bg-paper/90 backdrop-blur border-b border-line px-4 py-3 flex items-center gap-3">
          <p className="font-display text-2xl tracking-tight shrink-0">C<span className="text-accent">.</span></p>
          <div className="flex-1 min-w-0">{picker}</div>
          {ThemeBtn}
          <button onClick={() => onTab('profile')} aria-label="Profile" className="w-11 h-11 rounded-full border border-line flex items-center justify-center cursor-pointer"><Settings className="w-4 h-4" /></button>
        </header>
        <main className="px-5 sm:px-8 lg:px-12 py-8 lg:py-12 pb-28 lg:pb-16 max-w-6xl">{children}</main>
        {/* Mobile bottom nav */}
        <nav aria-label="Primary" className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-paper/95 backdrop-blur border-t border-line grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
          {NAV.map(n => (
            <button key={n.id} onClick={() => onTab(n.id)} aria-current={tab === n.id ? 'page' : undefined}
              className={cx('flex flex-col items-center gap-1 py-2.5 text-[11px] min-h-14 cursor-pointer', tab === n.id ? 'text-accent font-semibold' : 'text-mute')}>
              <n.icon className="w-5 h-5" />{n.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};
