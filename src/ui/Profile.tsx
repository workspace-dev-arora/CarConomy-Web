import React, { useState } from 'react';
import { Vehicle, FinancialProfile, OwnershipProfile, CalculatedEconomics, Driver, DrivingStyle, DriverRole } from '../types';
import { calculateTaxTactics, calculateReplacementRecommendation } from '../utils/calculator';
import { formatINR } from '../utils/formatters';
import { Eyebrow, H1, Btn, Rule, Row, Chip } from './kit';
import { NumField } from './fields';
import { useTheme } from './theme';
import { ProfileSetupWizard } from '../components/ProfileSetupWizard';

interface ProfileProps {
  vehicle: Vehicle;
  eco: CalculatedEconomics;
  drivers: Driver[];
  vehicles: Vehicle[];
  finance: FinancialProfile;
  ownership: OwnershipProfile;
  onDrivers: (d: Driver[]) => void;
  onFinance: (f: FinancialProfile) => void;
  onOwnership: (o: OwnershipProfile) => void;
  onReset: () => void;
}

export const Profile: React.FC<ProfileProps> = ({
  vehicle,
  eco,
  drivers,
  vehicles,
  finance,
  ownership,
  onDrivers,
  onFinance,
  onOwnership,
  onReset,
}) => {
  const { theme, toggle } = useTheme();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const f = (k: keyof FinancialProfile) => (n: number) => onFinance({ ...finance, [k]: n });

  const taxAnalysis = calculateTaxTactics(vehicle, finance, eco);
  const replacementRec = calculateReplacementRecommendation(vehicle, eco, finance, vehicles);

  const updateDriver = (id: string, key: keyof Driver, val: any) => {
    onDrivers(drivers.map(d => (d.id === id ? { ...d, [key]: val } : d)));
  };

  const addDriver = () => {
    const newId = `driver-${Date.now()}`;
    const newDriver: Driver = {
      id: newId,
      name: 'Family Driver',
      role: 'Wife / Husband',
      dailyKm: 20,
      cityHighwaySplit: 70,
      drivingStyle: 'MODERATE',
    };
    onDrivers([...drivers, newDriver]);
  };

  const removeDriver = (id: string) => {
    if (drivers.length <= 1) return;
    onDrivers(drivers.filter(d => d.id !== id));
  };

  return (
    <div className="space-y-12 max-w-3xl">
      <div>
        <Eyebrow>Personalised Input Profile</Eyebrow>
        <H1>Your numbers & strategy</H1>
        <p className="text-sm text-mute mt-2">
          Configure household drivers, tax savings tactics, and optimal replacement timeline.
        </p>
      </div>

      {/* DEEP CONSULTING SETUP WIZARD BANNER */}
      <div className="p-5 rounded-2xl bg-sunk border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-accent block">Deep Consulting Setup</span>
          <p className="text-sm font-semibold text-ink mt-0.5">
            {finance.demographics?.isProfileWizardCompleted ? '✓ Deep Consulting Profile Completed' : 'Complete your demographic profile for personalized consulting'}
          </p>
          <p className="text-xs text-mute mt-0.5">
            Configures household driver wear, tax brackets, corporate leases & optimal sell recommendations.
          </p>
        </div>
        <Btn onClick={() => setIsWizardOpen(true)} className="whitespace-nowrap">
          {finance.demographics?.isProfileWizardCompleted ? 'Edit Wizard' : '✨ Start Profile Wizard'}
        </Btn>
      </div>

      <ProfileSetupWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        finance={finance}
        ownership={ownership}
        drivers={drivers}
        vehicles={vehicles}
        onSaveProfile={(updatedFinance, updatedDrivers) => {
          onFinance(updatedFinance);
          onDrivers(updatedDrivers);
        }}
      />

      {/* 1. HOUSEHOLD & FAMILY DRIVERS SECTION */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Eyebrow>Household & Family Drivers</Eyebrow>
            <p className="text-sm font-semibold text-ink mt-0.5">Who drives the car & how</p>
          </div>
          <Btn variant="ghost" onClick={addDriver} className="text-xs min-h-9 px-3">
            + Add Family Driver
          </Btn>
        </div>

        <div className="space-y-4">
          {drivers.map(d => (
            <div key={d.id} className="p-4 rounded-2xl bg-surface border border-line space-y-4">
              <div className="flex items-center justify-between gap-4">
                <input
                  type="text"
                  value={d.name}
                  onChange={e => updateDriver(d.id, 'name', e.target.value)}
                  className="font-display text-lg bg-transparent border-b border-transparent focus:border-ink outline-none"
                />
                {drivers.length > 1 && (
                  <button
                    onClick={() => removeDriver(d.id)}
                    className="text-xs text-bad hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <label className="block">
                  <span className="text-xs text-mute">Family Role</span>
                  <select
                    value={d.role}
                    onChange={e => updateDriver(d.id, 'role', e.target.value as DriverRole)}
                    className="mt-1 w-full bg-sunk border border-line rounded-lg px-3 min-h-10 text-sm cursor-pointer"
                  >
                    <option value="Me">Me (Primary)</option>
                    <option value="Wife / Husband">Spouse</option>
                    <option value="Children">Child</option>
                    <option value="Parents">Parent</option>
                    <option value="Chauffeur">Chauffeur</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <NumField
                  label="Daily distance"
                  suffix="km/day"
                  value={d.dailyKm}
                  onChange={n => updateDriver(d.id, 'dailyKm', Math.max(0, n))}
                />

                <label className="block">
                  <span className="text-xs text-mute">Driving Style</span>
                  <select
                    value={d.drivingStyle}
                    onChange={e => updateDriver(d.id, 'drivingStyle', e.target.value as DrivingStyle)}
                    className="mt-1 w-full bg-sunk border border-line rounded-lg px-3 min-h-10 text-sm cursor-pointer"
                  >
                    <option value="CONSERVATIVE">Conservative (Low Wear)</option>
                    <option value="MODERATE">Moderate (Standard)</option>
                    <option value="AGGRESSIVE">Aggressive (+30% Wear)</option>
                  </select>
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Rule />

      {/* 2. TAX BRACKET & TAX SAVINGS TACTICS SECTION */}
      <section className="space-y-6">
        <div>
          <Eyebrow>Tax Bracket & Savings Tactics</Eyebrow>
          <p className="text-sm font-semibold text-ink mt-0.5">Optimize car outlays against income tax & corporate structures</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-x-10 gap-y-6">
          <label className="block">
            <span className="text-xs text-mute">Income Tax Slab</span>
            <select
              value={finance.taxBracketPercent || 30}
              onChange={e => onFinance({ ...finance, taxBracketPercent: Number(e.target.value) })}
              className="mt-1 w-full bg-sunk border border-line rounded-lg px-3 min-h-11 text-sm cursor-pointer"
            >
              <option value={10}>10% Tax Slab</option>
              <option value={20}>20% Tax Slab</option>
              <option value={30}>30% Highest Tax Slab</option>
              <option value={39}>39% Surcharge & Corporate Slab</option>
            </select>
          </label>

          <NumField
            label="Household monthly income"
            prefix="₹"
            value={finance.householdIncome}
            onChange={n => onFinance({ ...finance, householdIncome: n, monthlyIncome: n })}
          />
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-line space-y-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-mute">Tax Tactics Checkbox Toggles</p>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!finance.isCorporateLease}
              onChange={e => onFinance({ ...finance, isCorporateLease: e.target.checked })}
              className="mt-1 w-4 h-4 rounded accent-accent cursor-pointer"
            />
            <div>
              <p className="text-sm font-semibold text-ink">Corporate Lease / Salary Sacrifice Program</p>
              <p className="text-xs text-mute mt-0.5">
                Deducts EMI, fuel, and service outlays pre-tax from salary. Saves up to {finance.taxBracketPercent || 30}% on annual vehicle outlays.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!finance.isBusinessDepreciationClaimed}
              onChange={e => onFinance({ ...finance, isBusinessDepreciationClaimed: e.target.checked })}
              className="mt-1 w-4 h-4 rounded accent-accent cursor-pointer"
            />
            <div>
              <p className="text-sm font-semibold text-ink">Business / Professional Depreciation Claim</p>
              <p className="text-xs text-mute mt-0.5">
                Claims 15% (Petrol/Diesel) or 40% (Electric) depreciation as business expense to reduce taxable business income.
              </p>
            </div>
          </label>
        </div>

        {/* REAL-TIME TAX SAVINGS DYNAMIC SUMMARY CARD */}
        <div className="p-5 rounded-2xl bg-sunk border border-line space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium uppercase tracking-widest text-mute">Tax Savings Output</span>
            <span className="text-lg font-bold text-good num">
              {formatINR(taxAnalysis.totalAnnualTaxSavings)} / year saved
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <Row label="Corporate Lease Tax Savings" value={formatINR(taxAnalysis.annualCorporateLeaseTaxSavings)} />
            {eco.energyType === 'ELECTRIC' && (
              <Row label="Section 80EEA EV Interest Deduction" value={formatINR(taxAnalysis.annualSec80EEASavings)} />
            )}
            <Row label="Business Depreciation Tax Shield" value={formatINR(taxAnalysis.annualDepreciationTaxShield)} />
            <Row strong label="Net Outlay After Tax" value={`${formatINR(taxAnalysis.netAnnualOutlayAfterTax)} / year (₹${taxAnalysis.netCostPerKmAfterTax}/km)`} />
          </div>
        </div>
      </section>

      <Rule />

      {/* 3. REPLACEMENT HORIZON & RECOMMENDATION ENGINE SECTION */}
      <section className="space-y-6">
        <div>
          <Eyebrow>Replacement Horizon & Upgrade Advisor</Eyebrow>
          <p className="text-sm font-semibold text-ink mt-0.5">Set targeted tenure & get automated resale timing advice</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-x-10 gap-y-6">
          <NumField
            label="Targeted ownership tenure"
            suffix="years"
            value={finance.targetReplacementYears || 4}
            onChange={n => onFinance({ ...finance, targetReplacementYears: Math.max(1, Math.min(10, n)) })}
          />

          <label className="block">
            <span className="text-xs text-mute">Target Upgrade Vehicle</span>
            <select
              value={finance.targetUpgradeCarId || vehicles.find(v => v.id !== vehicle.id)?.id}
              onChange={e => onFinance({ ...finance, targetUpgradeCarId: e.target.value })}
              className="mt-1 w-full bg-sunk border border-line rounded-lg px-3 min-h-11 text-sm cursor-pointer"
            >
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.make} {v.model} ({v.variant})
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* DYNAMIC RECOMMENDATION CARD */}
        <div className="p-5 rounded-2xl bg-surface border border-line space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-accent">Upgrade Recommendation</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-sunk text-ink font-semibold">
              Sweet Spot: Year {replacementRec.recommendedYearToSell}
            </span>
          </div>

          <p className="text-sm text-ink leading-relaxed font-medium">
            {replacementRec.recommendationReason}
          </p>

          <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-line text-xs">
            <div>
              <span className="text-mute block">Estimated Resale at Exit</span>
              <span className="text-base font-bold text-ink num mt-0.5 block">
                {formatINR(replacementRec.estimatedResaleAtSellYear)}
              </span>
            </div>
            <div>
              <span className="text-mute block">Net Equity (After Loan Payoff)</span>
              <span className="text-base font-bold text-good num mt-0.5 block">
                {formatINR(replacementRec.equityAtExit)}
              </span>
            </div>
          </div>

          {replacementRec.recommendedUpgradeCar && (
            <div className="p-3 rounded-xl bg-sunk flex items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-mute block">Recommended Next Upgrade</span>
                <span className="font-semibold text-ink">
                  {replacementRec.recommendedUpgradeCar.make} {replacementRec.recommendedUpgradeCar.model} ({replacementRec.recommendedUpgradeCar.variant})
                </span>
              </div>
              <span className="text-accent font-bold">₹{replacementRec.recommendedUpgradeCar.purchasePrice / 100000}L</span>
            </div>
          )}
        </div>
      </section>

      <Rule />

      {/* 4. FINANCING & COMMITMENTS */}
      <section className="space-y-6">
        <Eyebrow>Loan & Financing Terms</Eyebrow>
        <div className="grid sm:grid-cols-2 gap-x-10 gap-y-6">
          <NumField label="Existing EMIs" prefix="₹" value={finance.existingEmis} onChange={f('existingEmis')} />
          <NumField label="Other commitments" prefix="₹" value={finance.otherCommitments} onChange={f('otherCommitments')} />
          <NumField label="Down payment" prefix="₹" value={finance.downPayment} onChange={f('downPayment')} />
          <NumField label="Loan interest rate" suffix="% p.a." step={0.05} value={finance.interestRate} onChange={f('interestRate')} />
          <NumField label="Loan tenure" suffix="years" value={finance.loanTenureYears} onChange={n => onFinance({ ...finance, loanTenureYears: Math.max(1, Math.min(10, n)) })} />
        </div>
      </section>

      <Rule />

      <section className="flex flex-wrap gap-3 items-center">
        <Btn variant="ghost" onClick={toggle}>
          Appearance: {theme === 'light' ? 'Light' : 'Dark'} Mode
        </Btn>
        <Btn variant="ghost" onClick={onReset}>
          Reset demo data
        </Btn>
      </section>
    </div>
  );
};
