import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { INITIAL_VEHICLES, INITIAL_DRIVERS, INITIAL_FINANCIAL_PROFILE, INITIAL_OWNERSHIP_PROFILE } from './data/mockData';
import { Vehicle, Driver, FinancialProfile, OwnershipProfile } from './types';
import { calculateTrueCost } from './utils/calculator';
import { runEngineTests } from './utils/calculator.test';
import { SplashLoader } from './components/SplashLoader';
import { ThemeProvider } from './ui/theme';
import { Shell, Tab } from './ui/Shell';
import { Overview } from './ui/Overview';
import { MyCar } from './ui/MyCar';
import { Decide } from './ui/Decide';
import { Services } from './ui/Services';
import { Profile } from './ui/Profile';

const KEY = 'carconomy_v5';
function load<T>(k: string, fallback: T): T {
  try { const s = localStorage.getItem(`${KEY}_${k}`); return s ? (JSON.parse(s) as T) : fallback; } catch { return fallback; }
}

export default function App() {
  const [tab, setTab] = useState<Tab>('overview');
  const [booting, setBooting] = useState(() => { try { return !sessionStorage.getItem('cc_booted'); } catch { return false; } });
  const handleBooted = useCallback(() => { try { sessionStorage.setItem('cc_booted', '1'); } catch {} setBooting(false); }, []);

  // Catalog always comes from code (single source of truth); only user edits persist.
  const vehicles: Vehicle[] = INITIAL_VEHICLES;
  const [activeId, setActiveId] = useState<string>(() => { const id = load('active', 'bmw-3-series'); return INITIAL_VEHICLES.some(v => v.id === id) ? id : INITIAL_VEHICLES[0].id; });
  const [drivers, setDrivers] = useState<Driver[]>(() => load('drivers', INITIAL_DRIVERS));
  const [finance, setFinance] = useState<FinancialProfile>(() => load('finance', INITIAL_FINANCIAL_PROFILE));
  const [ownership, setOwnership] = useState<OwnershipProfile>(() => load('ownership', INITIAL_OWNERSHIP_PROFILE));

  useEffect(() => { if (import.meta.env.DEV) { const r = runEngineTests(); if (!r.success) console.warn('Engine tests:', r.results); } }, []);
  useEffect(() => {
    try { [['active', activeId], ['drivers', drivers], ['finance', finance], ['ownership', ownership]].forEach(([k, v]) => localStorage.setItem(`${KEY}_${k}`, JSON.stringify(v))); } catch {}
  }, [activeId, drivers, finance, ownership]);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [tab]);

  const vehicle = vehicles.find(v => v.id === activeId) || vehicles[0];
  const eco = useMemo(() => calculateTrueCost(vehicle, drivers, ownership, finance, 'CURRENT_CAR'), [vehicle, drivers, ownership, finance]);

  const reset = () => { setActiveId('bmw-3-series'); setDrivers(INITIAL_DRIVERS); setFinance(INITIAL_FINANCIAL_PROFILE); setOwnership(INITIAL_OWNERSHIP_PROFILE); setTab('overview'); };

  return (
    <ThemeProvider>
      {booting && <SplashLoader onDone={handleBooted} />}
      <Shell tab={tab} onTab={setTab} vehicles={vehicles} activeId={vehicle.id} onPick={setActiveId}>
        {tab === 'overview' && (
          <Overview
            vehicle={vehicle}
            vehicles={vehicles}
            finance={finance}
            drivers={drivers}
            ownership={ownership}
            eco={eco}
            onGo={setTab}
            onPickVehicle={setActiveId}
          />
        )}
        {tab === 'mycar' && <MyCar vehicle={vehicle} eco={eco} drivers={drivers} ownership={ownership} onDrivers={setDrivers} onOwnership={setOwnership} onGo={setTab} />}
        {tab === 'decide' && <Decide vehicle={vehicle} vehicles={vehicles} eco={eco} drivers={drivers} ownership={ownership} finance={finance} onGo={setTab} />}
        {tab === 'services' && <Services vehicle={vehicle} />}
        {tab === 'profile' && (
          <Profile
            vehicle={vehicle}
            eco={eco}
            drivers={drivers}
            vehicles={vehicles}
            finance={finance}
            ownership={ownership}
            onDrivers={setDrivers}
            onFinance={setFinance}
            onOwnership={setOwnership}
            onReset={reset}
          />
        )}
      </Shell>
    </ThemeProvider>
  );
}
