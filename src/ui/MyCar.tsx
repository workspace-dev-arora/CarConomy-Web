import React, { useState } from 'react';
import { Vehicle, Driver, OwnershipProfile, CalculatedEconomics } from '../types';
import { formatINR } from '../utils/formatters';
import { Eyebrow, H1, Row, Segmented, NextStep, Meter } from './kit';
import { NumField } from './fields';
import { Tab } from './Shell';

type Sub = 'costs' | 'drivers' | 'assumptions';

export const MyCar: React.FC<{ vehicle: Vehicle; eco: CalculatedEconomics; drivers: Driver[]; ownership: OwnershipProfile; onDrivers: (d: Driver[]) => void; onOwnership: (o: OwnershipProfile) => void; onGo: (t: Tab) => void }> = ({ vehicle, eco, drivers, ownership, onDrivers, onOwnership, onGo }) => {
  const [sub, setSub] = useState<Sub>('costs');
  const max = Math.max(...eco.yearlyData.map(y => y.cumulativeTCO), 1);
  return (
    <div className="space-y-8">
      <div><Eyebrow>Know · My car</Eyebrow><H1>{vehicle.make} {vehicle.model}</H1></div>
      <Segmented value={sub} onChange={setSub} options={[{ id: 'costs', label: 'Cost over time' }, { id: 'drivers', label: 'Drivers' }, { id: 'assumptions', label: 'Assumptions' }]} />

      {sub === 'costs' && (
        <section className="space-y-8">
          <div className="flex items-end gap-2 h-40" role="img" aria-label="Cumulative cost by year">
            {eco.yearlyData.map(y => (
              <div key={y.year} className="flex-1 flex flex-col justify-end items-center gap-2 h-full">
                <span className="text-xs num text-mute">{formatINR(y.cumulativeTCO)}</span>
                <div className="w-full bg-accent rounded-t-md" style={{ height: `${(y.cumulativeTCO / max) * 100}%`, opacity: 0.35 + 0.65 * (y.year / eco.yearlyData.length) }} />
                <span className="text-xs text-mute">Y{y.year}</span>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm num min-w-[480px]">
              <thead><tr className="text-left text-xs text-mute"><th className="py-2 font-medium">Year</th><th className="font-medium text-right">Running</th><th className="font-medium text-right">Depreciation</th><th className="font-medium text-right">Total</th><th className="font-medium text-right">Car value</th></tr></thead>
              <tbody>{eco.yearlyData.map(y => (
                <tr key={y.year} className="border-t border-line">
                  <td className="py-3">Year {y.year}</td>
                  <td className="text-right">{formatINR(y.fuel + y.maintenance + y.insurance + y.repairsAndTyres + y.parkingAndTolls + y.financingInterest)}</td>
                  <td className="text-right">{formatINR(y.depreciation)}</td>
                  <td className="text-right font-semibold">{formatINR(y.yearTotal)}</td>
                  <td className="text-right text-mute">{formatINR(y.vehicleValueAtYearEnd)}</td>
                </tr>))}</tbody>
            </table>
          </div>
          <div className="max-w-md"><Row strong label="Five-year total" value={formatINR(eco.fiveYearTotalCost)} sub={`${formatINR(eco.fiveYearValueRemaining)} resale value remaining`} /></div>
        </section>
      )}

      {sub === 'drivers' && (
        <section className="max-w-2xl">
          <p className="text-sm text-mute mb-2">Who drives changes wear, fuel use and cost. Adjust daily km to see it update.</p>
          {eco.driverImpacts.map(di => {
            const d = drivers.find(x => x.id === di.driverId);
            return (
              <div key={di.driverId} className="py-5 border-b border-line">
                <div className="flex justify-between gap-4">
                  <div><p className="font-medium">{di.name}</p><p className="text-xs text-mute capitalize">{di.role} · {di.drivingStyle.toLowerCase()} · {di.effectiveMileage.toFixed(1)} km/unit</p></div>
                  <p className="num text-sm text-right">{formatINR(di.totalCostShare)}<span className="block text-xs text-mute">per year</span></p>
                </div>
                {d && <label className="mt-3 flex items-center gap-4 text-xs text-mute"><span className="w-20 num">{d.dailyKm} km/day</span>
                  <input type="range" min={0} max={200} value={d.dailyKm} aria-label={`${d.name} daily km`} className="flex-1 accent-[var(--accent)]"
                    onChange={e => onDrivers(drivers.map(x => x.id === d.id ? { ...x, dailyKm: +e.target.value } : x))} /></label>}
              </div>
            );
          })}
          {eco.aggressiveDriversCount > 0 && <p className="text-sm text-warn mt-4">Aggressive driving adds {formatINR(eco.householdAdditionalWear)} in extra wear per year.</p>}
        </section>
      )}

      {sub === 'assumptions' && (
        <section className="grid sm:grid-cols-2 gap-x-10 gap-y-6 max-w-2xl">
          <NumField label="Distance driven per year" suffix="km" value={ownership.annualKm} onChange={n => onOwnership({ ...ownership, annualKm: n })} />
          <NumField label="Keep the car for" suffix="years" value={ownership.ownershipYears} onChange={n => onOwnership({ ...ownership, ownershipYears: Math.max(1, Math.min(10, n)) })} />
          <NumField label="Fuel price" prefix="₹" suffix="/L" value={ownership.fuelPrice} onChange={n => onOwnership({ ...ownership, fuelPrice: n })} />
          <NumField label="Electricity price" prefix="₹" suffix="/kWh" value={ownership.electricityPrice ?? 0} onChange={n => onOwnership({ ...ownership, electricityPrice: n })} />
          <NumField label="Maintenance per year" prefix="₹" value={ownership.maintenanceAnnual ?? 0} onChange={n => onOwnership({ ...ownership, maintenanceAnnual: n })} />
          <NumField label="Insurance per year" prefix="₹" value={ownership.insuranceAnnual ?? 0} onChange={n => onOwnership({ ...ownership, insuranceAnnual: n })} />
        </section>
      )}
      <NextStep label="Decide" title="Keep, sell, or buy something else?" onClick={() => onGo('decide')} />
    </div>
  );
};
