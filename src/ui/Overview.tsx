import React from 'react';
import { Vehicle, FinancialProfile, OwnershipProfile, Driver, CalculatedEconomics } from '../types';
import { formatINR, formatCostPerKm } from '../utils/formatters';
import { evaluateJudgeProfileRecommendation } from '../utils/calculator';
import { Eyebrow, H1, Big, Row, Meter, NextStep, VehicleImage, Btn } from './kit';
import { Tab } from './Shell';

interface OverviewProps {
  vehicle: Vehicle;
  vehicles: Vehicle[];
  finance: FinancialProfile;
  drivers: Driver[];
  ownership: OwnershipProfile;
  eco: CalculatedEconomics;
  onGo: (t: Tab) => void;
  onPickVehicle: (id: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({
  vehicle,
  vehicles,
  finance,
  drivers,
  ownership,
  eco,
  onGo,
  onPickVehicle,
}) => {
  const judgeRec = evaluateJudgeProfileRecommendation(vehicles, finance, drivers, ownership);
  const topMatch = judgeRec.rankedCars[0];

  const parts = [
    ['Depreciation', eco.annualDepreciation, 'bg-accent'],
    ['Fuel / energy', eco.annualFuelCost, 'bg-ink'],
    ['Maintenance', eco.annualMaintenance, 'bg-ink/70'],
    ['Insurance', eco.annualInsurance, 'bg-ink/50'],
    ['Loan interest', eco.annualFinancingInterest, 'bg-ink/35'],
    ['Repairs & tyres', eco.annualRepairs + eco.annualTyres, 'bg-ink/20'],
  ] as const;
  const total = parts.reduce((s, p) => s + p[1], 0) || 1;
  const tone = eco.financialFitTier === 'COMFORTABLE' ? 'good' : eco.financialFitTier === 'STRETCHED' ? 'warn' : 'bad';
  return (
    <div className="space-y-12">
      {/* PROFILE MATCH RECOMMENDATION CARD */}
      {topMatch && (
        <div className="p-6 rounded-2xl bg-surface border border-line flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Eyebrow className="!text-ink">Recommended for Your Profile</Eyebrow>
              <span className="text-xs font-medium num px-2.5 py-0.5 rounded-full bg-sunk text-ink border border-line">
                {topMatch.matchScore}% Match Index
              </span>
            </div>
            <h3 className="font-display text-2xl text-ink">
              {topMatch.vehicle.make} {topMatch.vehicle.model} <span className="text-mute text-lg italic">{topMatch.vehicle.variant}</span>
            </h3>
            <p className="text-xs text-mute leading-relaxed max-w-2xl">
              {topMatch.reasons.join(' · ')}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {vehicle.id !== topMatch.vehicle.id ? (
              <Btn onClick={() => onPickVehicle(topMatch.vehicle.id)} className="whitespace-nowrap">
                Select {topMatch.vehicle.model} →
              </Btn>
            ) : (
              <span className="text-xs font-medium text-good px-3 py-2 rounded-full bg-sunk border border-good/40">
                ✓ Currently Active Selection
              </span>
            )}
          </div>
        </div>
      )}

      <section className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
        <VehicleImage vehicle={vehicle} priority />
        <div>
          <Eyebrow>{vehicle.year} · {vehicle.make}</Eyebrow>
          <H1>{vehicle.model} <span className="text-mute italic">{vehicle.variant}</span></H1>
          <div className="mt-8 flex items-end gap-6 flex-wrap">
            <div><Eyebrow>True cost per km</Eyebrow><Big className="text-6xl sm:text-7xl text-accent">{formatCostPerKm(eco.costPerKm)}</Big></div>
            <div className="pb-2 text-sm text-mute num"><p>{formatINR(eco.annualTotalCost)} / year</p><p>{formatINR(eco.monthlyOwnershipCost)} / month</p></div>
          </div>
          <p className="mt-6 text-sm"><span className={eco.keepSellDecision === 'KEEP' ? 'text-good font-semibold' : 'text-bad font-semibold'}>{eco.keepSellDecision}</span> <span className="text-mute">· {eco.keepSellReason}</span></p>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-10 lg:gap-14">
        <div>
          <Eyebrow>Where the money goes · per year</Eyebrow>
          <div className="flex h-3 rounded-full overflow-hidden mt-4" role="img" aria-label="Annual cost breakdown">
            {parts.map(p => <div key={p[0]} className={p[2]} style={{ width: `${(p[1] / total) * 100}%` }} />)}
          </div>
          <div className="mt-2">
            {parts.map(p => <Row key={p[0]} label={<span className="inline-flex items-center gap-2"><i className={`w-2.5 h-2.5 rounded-full ${p[2]}`} />{p[0]}</span>} value={`${formatINR(p[1])} · ${Math.round((p[1] / total) * 100)}%`} />)}
            <Row strong label="Total" value={formatINR(eco.annualTotalCost)} />
          </div>
        </div>
        <div>
          <Eyebrow>Can you afford it</Eyebrow>
          <p className="font-display text-3xl mt-3 capitalize">{eco.financialFitTier.toLowerCase()}</p>
          <div className="mt-4"><Meter pct={eco.incomeAllocationPercent} tone={tone} /></div>
          <p className="text-sm text-mute mt-2 num">{eco.incomeAllocationPercent.toFixed(1)}% of household income goes to cars</p>
          <p className="text-sm mt-4 leading-relaxed">{eco.financialFitSummary}</p>
          <div className="mt-6">
            <Row label="Monthly EMI" value={formatINR(eco.monthlyCarPayment)} />
            <Row label="Total monthly car commitment" value={formatINR(eco.totalMonthlyCarCommitment)} />
            <Row label={`${eco.tenureYears}-year ownership cost`} value={formatINR(eco.totalTenureCost)} />
          </div>
        </div>
      </section>
      <NextStep label="Know" title="See what drives this cost" onClick={() => onGo('mycar')} />
    </div>
  );
};
