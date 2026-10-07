import React, { useMemo, useState } from 'react';
import { Vehicle, Driver, OwnershipProfile, FinancialProfile, CalculatedEconomics } from '../types';
import { calculateComparison, evaluateJudgeProfileRecommendation } from '../utils/calculator';
import { formatINR, formatCostPerKm } from '../utils/formatters';
import { Eyebrow, H1, Big, Row, Segmented, Chip, NextStep, VehicleImage, Meter, cx } from './kit';
import { Tab } from './Shell';

export const Decide: React.FC<{ vehicle: Vehicle; vehicles: Vehicle[]; eco: CalculatedEconomics; drivers: Driver[]; ownership: OwnershipProfile; finance: FinancialProfile; onGo: (t: Tab) => void }> = ({ vehicle, vehicles, eco, drivers, ownership, finance, onGo }) => {
  const [mode, setMode] = useState<'keep' | 'buy'>('keep');
  return (
    <div className="space-y-8">
      <div><Eyebrow>Decide</Eyebrow><H1>{mode === 'keep' ? 'Keep or sell' : 'Buy & compare'}</H1></div>
      <Segmented value={mode} onChange={setMode} options={[{ id: 'keep', label: `Your ${vehicle.model}: keep or sell` }, { id: 'buy', label: 'Compare with another car' }]} />
      {mode === 'keep' ? <KeepSell eco={eco} /> : <Buy vehicle={vehicle} vehicles={vehicles} drivers={drivers} ownership={ownership} finance={finance} />}
      <NextStep label="Act" title="Book a service or talk to an expert" onClick={() => onGo('services')} />
    </div>
  );
};

const KeepSell: React.FC<{ eco: CalculatedEconomics }> = ({ eco }) => {
  const k = eco.keepSellDetails; const keep = k.decision === 'KEEP';
  return (
    <section className="grid lg:grid-cols-2 gap-10 lg:gap-14">
      <div>
        <Big className={cx('text-7xl sm:text-8xl', keep ? 'text-good' : 'text-bad')}>{k.decision}</Big>
        <p className="font-display text-2xl mt-4 leading-snug">{k.headlineReason}</p>
        <p className="text-sm text-mute mt-3 leading-relaxed">{k.detailedReason}</p>
        <p className="text-sm mt-4 num">Break-even: <b>{k.breakEvenMonths > 0 ? `${k.breakEvenMonths} months` : k.breakEvenHorizon}</b> · difference {formatINR(Math.abs(k.breakEvenDifference))}</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-x-10 gap-y-8">
        <div><Eyebrow>Keep · next 12 months</Eyebrow>
          <Row label="Depreciation" value={formatINR(k.depreciation12M)} /><Row label="Fuel" value={formatINR(k.fuel12M)} /><Row label="Maintenance" value={formatINR(k.maintenance12M)} />
          <Row label="Insurance" value={formatINR(k.insurance12M)} /><Row label="Loan interest" value={formatINR(k.loanInterest12M)} /><Row strong label="Total" value={formatINR(k.costToKeep12M)} /></div>
        <div><Eyebrow>Sell & replace</Eyebrow>
          <Row label="Sell today for" value={formatINR(k.sellTodayValue)} /><Row label="Transaction cost" value={formatINR(k.transactionCost)} />
          <Row label="Replacement depreciation" value={formatINR(k.replacementDepreciation12M)} /><Row label="Replacement running" value={formatINR(k.replacementMaintenance12M + k.replacementInsurance12M + k.replacementInterest12M)} />
          <Row strong label="Total" value={formatINR(k.costToSellReplace12M)} /></div>
      </div>
    </section>
  );
};

const Buy: React.FC<{ vehicle: Vehicle; vehicles: Vehicle[]; drivers: Driver[]; ownership: OwnershipProfile; finance: FinancialProfile }> = ({ vehicle, vehicles, drivers, ownership, finance }) => {
  const others = vehicles.filter(v => v.id !== vehicle.id);
  const judgeRec = useMemo(() => evaluateJudgeProfileRecommendation(vehicles, finance, drivers, ownership), [vehicles, finance, drivers, ownership]);
  const defaultTargetId = (judgeRec.topCar && judgeRec.topCar.id !== vehicle.id) ? judgeRec.topCar.id : (others[0]?.id || vehicles[0].id);
  const [bId, setBId] = useState(defaultTargetId);
  const b = others.find(v => v.id === bId) || others[0] || vehicles[0];
  const cmp = useMemo(() => b ? calculateComparison(vehicle, b, drivers, ownership, finance) : null, [vehicle, b, drivers, ownership, finance]);
  if (!cmp || !b) return null;
  const { ecoA, ecoB } = cmp;
  const rows: { l: string; a: number; z: number; f: (n: number) => string; lowerBetter?: boolean }[] = [
    { l: 'Price', a: vehicle.purchasePrice, z: b.purchasePrice, f: formatINR, lowerBetter: true },
    { l: 'Cost per km', a: ecoA.costPerKm, z: ecoB.costPerKm, f: formatCostPerKm, lowerBetter: true },
    { l: 'Annual cost', a: ecoA.annualTotalCost, z: ecoB.annualTotalCost, f: formatINR, lowerBetter: true },
    { l: '5-year cost', a: ecoA.fiveYearTotalCost, z: ecoB.fiveYearTotalCost, f: formatINR, lowerBetter: true },
    { l: 'Monthly EMI', a: ecoA.monthlyCarPayment, z: ecoB.monthlyCarPayment, f: formatINR, lowerBetter: true },
    { l: 'Income used by cars', a: ecoA.incomeAllocationPercent, z: ecoB.incomeAllocationPercent, f: n => `${n.toFixed(1)}%`, lowerBetter: true },
  ];
  const win = (r: typeof rows[0], side: 'a' | 'z') => (r.a === r.z ? false : (side === 'a') === (r.a < r.z));
  const tone = (e: CalculatedEconomics) => e.financialFitTier === 'COMFORTABLE' ? 'good' : e.financialFitTier === 'STRETCHED' ? 'warn' : 'bad';
  return (
    <section className="space-y-8">
      <div><Eyebrow className="mb-3">Compare {vehicle.model} with</Eyebrow>
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0 sm:flex-wrap">
          {others.map(o => <Chip key={o.id} active={o.id === b.id} onClick={() => setBId(o.id)}>{o.make} {o.model}</Chip>)}</div></div>
      <div className="grid grid-cols-2 gap-4 sm:gap-8">
        {[vehicle, b].map(v => <div key={v.id}><VehicleImage vehicle={v} priority /><p className="mt-3 font-display text-xl sm:text-2xl">{v.make} {v.model}</p><p className="text-xs text-mute">{v.variant} · {v.year}</p></div>)}
      </div>
      <div className="max-w-3xl">
        {rows.map(r => (
          <div key={r.l} className="grid grid-cols-[1fr_1fr_1fr] gap-2 py-3 border-b border-line text-sm items-baseline">
            <span className="text-mute text-xs sm:text-sm">{r.l}</span>
            <span className={cx('num text-right', win(r, 'a') && 'text-good font-semibold')}>{r.f(r.a)}</span>
            <span className={cx('num text-right', win(r, 'z') && 'text-good font-semibold')}>{r.f(r.z)}</span>
          </div>))}
        <div className="grid grid-cols-2 gap-6 mt-5 text-xs text-mute"><div><Meter pct={ecoA.incomeAllocationPercent} tone={tone(ecoA)} /><p className="mt-1 capitalize">{ecoA.financialFitTier.toLowerCase()}</p></div><div><Meter pct={ecoB.incomeAllocationPercent} tone={tone(ecoB)} /><p className="mt-1 capitalize">{ecoB.financialFitTier.toLowerCase()}</p></div></div>
      </div>
      <div className="border-t border-ink pt-6 max-w-3xl">
        <Eyebrow>Verdict</Eyebrow>
        <p className="font-display text-3xl mt-1">{cmp.winnerCar.make} {cmp.winnerCar.model} costs less over 5 years</p>
        <p className="text-sm mt-2 num text-good font-semibold">{typeof cmp.savings === 'number' ? `Saves ${formatINR(Math.abs(cmp.savings))}` : ''}</p>
        <p className="text-sm text-mute mt-3 leading-relaxed">{cmp.verdictExplanation}</p>
      </div>
    </section>
  );
};
