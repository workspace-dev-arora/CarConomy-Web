import React, { useState } from 'react';
import { FinancialProfile, OwnershipProfile, Driver, Vehicle, DeepDemographicProfile, DriverRole, DrivingStyle } from '../types';
import { Eyebrow, H1, Btn, Rule, Row } from '../ui/kit';
import { NumField } from '../ui/fields';
import { formatINR } from '../utils/formatters';

interface ProfileSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  finance: FinancialProfile;
  ownership: OwnershipProfile;
  drivers: Driver[];
  vehicles: Vehicle[];
  onSaveProfile: (updatedFinance: FinancialProfile, updatedDrivers: Driver[]) => void;
}

export const ProfileSetupWizard: React.FC<ProfileSetupWizardProps> = ({
  isOpen,
  onClose,
  finance,
  drivers: initialDrivers,
  vehicles,
  onSaveProfile,
}) => {
  const [step, setStep] = useState(1);

  // Local Wizard State
  const [localFinance, setLocalFinance] = useState<FinancialProfile>(() => ({
    ...finance,
    taxBracketPercent: finance.taxBracketPercent || 30,
    isCorporateLease: !!finance.isCorporateLease,
    isBusinessDepreciationClaimed: !!finance.isBusinessDepreciationClaimed,
    targetReplacementYears: finance.targetReplacementYears || 4,
    demographics: finance.demographics || {
      householdSize: 4,
      primaryScenario: 'OFFICE_COMMUTE',
      hasChauffeur: false,
      kidsCount: 2,
      seniorParentsCount: 0,
      consultingFocusGoal: 'KEEP_OR_SELL',
      primaryCarPriority: 'SAFETY',
      companyAllowanceMonthly: 0,
      isProfileWizardCompleted: false,
    },
  }));

  const [localDrivers, setLocalDrivers] = useState<Driver[]>(initialDrivers);

  if (!isOpen) return null;

  const demo = localFinance.demographics!;

  const updateDemo = (key: keyof DeepDemographicProfile, val: any) => {
    setLocalFinance(prev => ({
      ...prev,
      demographics: { ...prev.demographics!, [key]: val },
    }));
  };

  const updateDriver = (id: string, key: keyof Driver, val: any) => {
    setLocalDrivers(prev => prev.map(d => (d.id === id ? { ...d, [key]: val } : d)));
  };

  const addDriver = () => {
    const newDriver: Driver = {
      id: `driver-${Date.now()}`,
      name: 'Family Driver',
      role: 'Wife / Husband',
      dailyKm: 25,
      cityHighwaySplit: 70,
      drivingStyle: 'MODERATE',
    };
    setLocalDrivers([...localDrivers, newDriver]);
  };

  const removeDriver = (id: string) => {
    if (localDrivers.length <= 1) return;
    setLocalDrivers(localDrivers.filter(d => d.id !== id));
  };

  const handleFinish = () => {
    const finalFinance: FinancialProfile = {
      ...localFinance,
      demographics: {
        ...localFinance.demographics!,
        isProfileWizardCompleted: true,
      },
    };
    onSaveProfile(finalFinance, localDrivers);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-paper border border-line rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* WIZARD HEADER & PROGRESS INDICATOR */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div>
            <Eyebrow>Deep Consulting Setup · Step {step} of 4</Eyebrow>
            <h2 className="font-display text-2xl sm:text-3xl text-ink mt-0.5">
              {step === 1 && 'Household Demographics'}
              {step === 2 && 'Driver Roles & Usage'}
              {step === 3 && 'Financials & Tax Tactics'}
              {step === 4 && 'Consulting Goal & Strategy'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-mute hover:text-ink text-sm font-bold min-h-9 px-3 cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        {/* STEP 1: HOUSEHOLD DEMOGRAPHICS */}
        {step === 1 && (
          <div className="space-y-6">
            <p className="text-sm text-mute">
              Tell us about your household setup to calibrate passenger safety, comfort, and wear profiles.
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              <NumField
                label="Total Household Members"
                suffix="people"
                value={demo.householdSize}
                onChange={n => updateDemo('householdSize', Math.max(1, n))}
              />

              <label className="block">
                <span className="text-xs text-mute">Primary Usage Scenario</span>
                <select
                  value={demo.primaryScenario}
                  onChange={e => updateDemo('primaryScenario', e.target.value)}
                  className="mt-1 w-full bg-sunk border border-line rounded-lg px-3 min-h-11 text-sm cursor-pointer"
                >
                  <option value="OFFICE_COMMUTE">Daily City Office Commute</option>
                  <option value="FAMILY_TRIPS">Family Weekend Road Trips</option>
                  <option value="SCHOOL_RUNS">School Runs & City Chores</option>
                  <option value="LUXURY_CLIENT">Executive / Client Meetings</option>
                  <option value="HIGHWAY_TOURING">Inter-state Highway Touring</option>
                </select>
              </label>

              <NumField
                label="Number of Children"
                suffix="kids"
                value={demo.kidsCount}
                onChange={n => updateDemo('kidsCount', Math.max(0, n))}
              />

              <NumField
                label="Senior Family Members (Parents)"
                suffix="seniors"
                value={demo.seniorParentsCount}
                onChange={n => updateDemo('seniorParentsCount', Math.max(0, n))}
              />
            </div>

            <label className="flex items-center gap-3 p-4 rounded-2xl bg-sunk border border-line cursor-pointer">
              <input
                type="checkbox"
                checked={demo.hasChauffeur}
                onChange={e => updateDemo('hasChauffeur', e.target.checked)}
                className="w-4 h-4 accent-accent cursor-pointer"
              />
              <div>
                <p className="text-sm font-semibold text-ink">Household Chauffeur Driven</p>
                <p className="text-xs text-mute">Vehicle is driven by a professional driver for family commutes.</p>
              </div>
            </label>
          </div>
        )}

        {/* STEP 2: DRIVER ROLES & USAGE */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-mute">Assign daily mileage and driving styles to family drivers.</p>
              <Btn variant="ghost" onClick={addDriver} className="text-xs min-h-9 px-3">
                + Add Driver
              </Btn>
            </div>

            <div className="space-y-4">
              {localDrivers.map(d => (
                <div key={d.id} className="p-4 rounded-2xl bg-sunk border border-line space-y-4">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={d.name}
                      onChange={e => updateDriver(d.id, 'name', e.target.value)}
                      className="font-display text-base bg-transparent border-b border-transparent focus:border-ink outline-none"
                    />
                    {localDrivers.length > 1 && (
                      <button onClick={() => removeDriver(d.id)} className="text-xs text-bad hover:underline cursor-pointer">
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
                        className="mt-1 w-full bg-paper border border-line rounded-lg px-2 min-h-10 text-xs cursor-pointer"
                      >
                        <option value="Me">Me (Primary)</option>
                        <option value="Wife / Husband">Spouse</option>
                        <option value="Children">Child</option>
                        <option value="Parents">Parent</option>
                        <option value="Chauffeur">Chauffeur</option>
                      </select>
                    </label>

                    <NumField
                      label="Daily Distance"
                      suffix="km/day"
                      value={d.dailyKm}
                      onChange={n => updateDriver(d.id, 'dailyKm', Math.max(0, n))}
                    />

                    <label className="block">
                      <span className="text-xs text-mute">Driving Style</span>
                      <select
                        value={d.drivingStyle}
                        onChange={e => updateDriver(d.id, 'drivingStyle', e.target.value as DrivingStyle)}
                        className="mt-1 w-full bg-paper border border-line rounded-lg px-2 min-h-10 text-xs cursor-pointer"
                      >
                        <option value="CONSERVATIVE">Conservative (Low Wear)</option>
                        <option value="MODERATE">Moderate</option>
                        <option value="AGGRESSIVE">Aggressive (+30% Wear)</option>
                      </select>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: FINANCIALS & TAX TACTICS */}
        {step === 3 && (
          <div className="space-y-6">
            <p className="text-sm text-mute">
              Configure income, tax brackets, and corporate tax optimization models.
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              <NumField
                label="Monthly Household Income"
                prefix="₹"
                value={localFinance.householdIncome}
                onChange={n => setLocalFinance({ ...localFinance, householdIncome: n, monthlyIncome: n })}
              />

              <label className="block">
                <span className="text-xs text-mute">Income Tax Slab</span>
                <select
                  value={localFinance.taxBracketPercent || 30}
                  onChange={e => setLocalFinance({ ...localFinance, taxBracketPercent: Number(e.target.value) })}
                  className="mt-1 w-full bg-sunk border border-line rounded-lg px-3 min-h-11 text-sm cursor-pointer"
                >
                  <option value={10}>10% Tax Bracket</option>
                  <option value={20}>20% Tax Bracket</option>
                  <option value={30}>30% Highest Tax Bracket</option>
                  <option value={39}>39% Surcharge / Corporate Bracket</option>
                </select>
              </label>

              <NumField
                label="Monthly Existing EMIs"
                prefix="₹"
                value={localFinance.existingEmis}
                onChange={n => setLocalFinance({ ...localFinance, existingEmis: n })}
              />

              <NumField
                label="Company Car Allowance (Monthly)"
                prefix="₹"
                value={demo.companyAllowanceMonthly || 0}
                onChange={n => updateDemo('companyAllowanceMonthly', n)}
              />
            </div>

            <div className="p-4 rounded-2xl bg-sunk border border-line space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-mute">Tax Shield Options</p>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!localFinance.isCorporateLease}
                  onChange={e => setLocalFinance({ ...localFinance, isCorporateLease: e.target.checked })}
                  className="mt-1 w-4 h-4 accent-accent cursor-pointer"
                />
                <div>
                  <p className="text-sm font-semibold text-ink">Corporate Salary Sacrifice Lease</p>
                  <p className="text-xs text-mute">Pays EMI & fuel pre-tax, saving up to {localFinance.taxBracketPercent}% income tax.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!localFinance.isBusinessDepreciationClaimed}
                  onChange={e => setLocalFinance({ ...localFinance, isBusinessDepreciationClaimed: e.target.checked })}
                  className="mt-1 w-4 h-4 accent-accent cursor-pointer"
                />
                <div>
                  <p className="text-sm font-semibold text-ink">Business / Professional Income Depreciation</p>
                  <p className="text-xs text-mute">Claims 15% (Petrol/Diesel) or 40% (EV) depreciation against business tax.</p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* STEP 4: GOAL & STRATEGY */}
        {step === 4 && (
          <div className="space-y-6">
            <p className="text-sm text-mute">Select your primary consulting focus and target vehicle goals.</p>

            <div className="grid sm:grid-cols-2 gap-6">
              <label className="block">
                <span className="text-xs text-mute">Primary Consulting Goal</span>
                <select
                  value={demo.consultingFocusGoal}
                  onChange={e => updateDemo('consultingFocusGoal', e.target.value)}
                  className="mt-1 w-full bg-sunk border border-line rounded-lg px-3 min-h-11 text-sm cursor-pointer"
                >
                  <option value="KEEP_OR_SELL">Decide Whether to Keep or Sell Current Car</option>
                  <option value="MINIMIZE_TCO">Minimize 5-Year Total Cost of Ownership</option>
                  <option value="TAX_OPTIMIZATION">Maximize Tax Shield & Corporate Savings</option>
                  <option value="EV_TRANSITION">Evaluate Transition from Petrol to EV</option>
                  <option value="LUXURY_UPGRADE">Find Most Affordable Luxury Car Upgrade</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs text-mute">Primary Car Purchase Priority</span>
                <select
                  value={demo.primaryCarPriority}
                  onChange={e => updateDemo('primaryCarPriority', e.target.value)}
                  className="mt-1 w-full bg-sunk border border-line rounded-lg px-3 min-h-11 text-sm cursor-pointer"
                >
                  <option value="SAFETY">5-Star Safety & Build Quality</option>
                  <option value="EFFICIENCY">High Mileage / EV Battery Range</option>
                  <option value="RESALE">Strong Resale & Retained Value</option>
                  <option value="STATUS">Luxury Brand & Status</option>
                  <option value="PERFORMANCE">Driving Dynamics & Acceleration</option>
                </select>
              </label>

              <NumField
                label="Target Replacement Horizon"
                suffix="years"
                value={localFinance.targetReplacementYears || 4}
                onChange={n => setLocalFinance({ ...localFinance, targetReplacementYears: Math.max(1, Math.min(10, n)) })}
              />

              <label className="block">
                <span className="text-xs text-mute">Target Upgrade Model</span>
                <select
                  value={localFinance.targetUpgradeCarId || vehicles[0]?.id}
                  onChange={e => setLocalFinance({ ...localFinance, targetUpgradeCarId: e.target.value })}
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

            <div className="p-5 rounded-2xl bg-sunk border border-line space-y-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-accent">Consulting Profile Ready</span>
              <p className="text-sm font-semibold text-ink">
                Your deep demographic profile is configured.
              </p>
              <p className="text-xs text-mute">
                CarConomy algorithms will tailor all cost per km, tax shield, driver wear, and Keep/Sell recommendations based on these exact numbers.
              </p>
            </div>
          </div>
        )}

        {/* WIZARD FOOTER NAVIGATION */}
        <div className="flex items-center justify-between border-t border-line pt-5">
          {step > 1 ? (
            <Btn variant="ghost" onClick={() => setStep(step - 1)}>
              ← Back
            </Btn>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <Btn onClick={() => setStep(step + 1)}>
              Next Step →
            </Btn>
          ) : (
            <Btn onClick={handleFinish}>
              Complete & Save Profile ✓
            </Btn>
          )}
        </div>
      </div>
    </div>
  );
};
