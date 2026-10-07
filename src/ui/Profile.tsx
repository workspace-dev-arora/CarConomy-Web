import React from 'react';
import { FinancialProfile, OwnershipProfile } from '../types';
import { Eyebrow, H1, Btn, Rule } from './kit';
import { NumField } from './fields';
import { useTheme } from './theme';

export const Profile: React.FC<{ finance: FinancialProfile; ownership: OwnershipProfile; onFinance: (f: FinancialProfile) => void; onOwnership: (o: OwnershipProfile) => void; onReset: () => void }> = ({ finance, ownership, onFinance, onOwnership, onReset }) => {
  const { theme, toggle } = useTheme();
  const f = (k: keyof FinancialProfile) => (n: number) => onFinance({ ...finance, [k]: n });
  return (
    <div className="space-y-10 max-w-2xl">
      <div><Eyebrow>Profile</Eyebrow><H1>Your numbers</H1></div>
      <section>
        <Eyebrow className="mb-4">Income & commitments · monthly</Eyebrow>
        <div className="grid sm:grid-cols-2 gap-x-10 gap-y-6">
          <NumField label="Household income" prefix="₹" value={finance.householdIncome} onChange={n => onFinance({ ...finance, householdIncome: n, monthlyIncome: n })} />
          <NumField label="Existing EMIs" prefix="₹" value={finance.existingEmis} onChange={f('existingEmis')} />
          <NumField label="Other commitments" prefix="₹" value={finance.otherCommitments} onChange={f('otherCommitments')} />
          <NumField label="Down payment" prefix="₹" value={finance.downPayment} onChange={f('downPayment')} />
        </div>
      </section>
      <section>
        <Eyebrow className="mb-4">Loan terms</Eyebrow>
        <div className="grid sm:grid-cols-2 gap-x-10 gap-y-6">
          <NumField label="Interest rate" suffix="% p.a." step={0.05} value={finance.interestRate} onChange={f('interestRate')} />
          <NumField label="Tenure" suffix="years" value={finance.loanTenureYears} onChange={n => onFinance({ ...finance, loanTenureYears: Math.max(1, Math.min(10, n)) })} />
        </div>
      </section>
      <Rule />
      <section className="flex flex-wrap gap-3 items-center">
        <Btn variant="ghost" onClick={toggle}>Appearance: {theme === 'light' ? 'Light' : 'Dark'}</Btn>
        <Btn variant="ghost" onClick={onReset}>Reset demo data</Btn>
      </section>
    </div>
  );
};
