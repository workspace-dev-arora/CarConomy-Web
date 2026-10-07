import { 
  Driver, 
  FinancialProfile, 
  OwnershipProfile, 
  Vehicle, 
  CalculatedEconomics, 
  KeepSellDecision, 
  FinancialFitTier,
  LoanAmortization,
  IndividualDriverImpact,
  KeepSellAnalysis,
  EnergyType
} from '../types';

/**
 * City-specific traffic and road congestion modifier coefficients
 */
const CITY_FACTORS: Record<string, { mileageMult: number; wearMult: number }> = {
  'Mumbai': { mileageMult: 0.88, wearMult: 1.25 },
  'Bengaluru': { mileageMult: 0.86, wearMult: 1.30 },
  'NCR / Delhi': { mileageMult: 0.92, wearMult: 1.15 },
  'NCR': { mileageMult: 0.92, wearMult: 1.15 },
  'Hyderabad': { mileageMult: 0.94, wearMult: 1.10 },
  'Chennai': { mileageMult: 0.93, wearMult: 1.12 },
  'Pune': { mileageMult: 0.91, wearMult: 1.18 },
  'Tier-2 / Highway': { mileageMult: 1.05, wearMult: 0.90 },
};

/**
 * 1. P0 #2: Standard Amortization Loan & EMI Calculator
 */
export function calculateEMI(principal: number, annualRatePercent: number, tenureYears: number): number {
  if (principal <= 0 || tenureYears <= 0) return 0;
  if (annualRatePercent <= 0) return Math.round(principal / (tenureYears * 12));

  const monthlyRate = annualRatePercent / 12 / 100;
  const totalMonths = tenureYears * 12;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
              (Math.pow(1 + monthlyRate, totalMonths) - 1);
  return Math.round(emi);
}

export function calculateLoan(
  purchasePrice: number,
  downPaymentInput: number,
  annualRatePercent: number,
  tenureYears: number,
  ownershipYears: number
): LoanAmortization {
  // Principal is strictly bounded by vehicle's own purchase price
  const downPayment = Math.min(purchasePrice, Math.max(0, downPaymentInput));
  const principal = Math.max(0, purchasePrice - downPayment);
  
  if (principal === 0 || tenureYears <= 0) {
    return {
      principal: 0,
      monthlyEMI: 0,
      totalPayments: 0,
      totalInterest: 0,
      totalLoanCost: 0,
      paymentsDuringOwnership: 0,
      principalPaidDuringOwnership: 0,
      interestPaidDuringOwnership: 0,
      remainingPrincipalAtExit: 0,
    };
  }

  const monthlyEMI = calculateEMI(principal, annualRatePercent, tenureYears);
  const totalMonths = tenureYears * 12;
  const totalPayments = monthlyEMI * totalMonths;
  const totalInterest = Math.max(0, totalPayments - principal);

  // Month-by-month amortization schedule to calculate balance at exit
  const monthlyRate = annualRatePercent / 12 / 100;
  let balance = principal;
  let cumPrincipal = 0;
  let cumInterest = 0;
  const ownershipMonths = Math.min(totalMonths, Math.max(1, Math.round(ownershipYears * 12)));

  for (let m = 1; m <= ownershipMonths; m++) {
    const interestPart = balance * monthlyRate;
    const principalPart = monthlyEMI - interestPart;
    cumInterest += interestPart;
    cumPrincipal += principalPart;
    balance = Math.max(0, balance - principalPart);
  }

  const paymentsDuringOwnership = monthlyEMI * ownershipMonths;

  return {
    principal,
    monthlyEMI,
    totalPayments,
    totalInterest,
    totalLoanCost: totalPayments,
    paymentsDuringOwnership: Math.round(paymentsDuringOwnership),
    principalPaidDuringOwnership: Math.round(cumPrincipal),
    interestPaidDuringOwnership: Math.round(cumInterest),
    remainingPrincipalAtExit: Math.round(balance),
  };
}

/**
 * Energy classification helper
 */
export function getVehicleEnergyType(vehicle: Vehicle): EnergyType {
  if (vehicle.energyType) return vehicle.energyType;
  if (vehicle.fuelType === 'EV') return 'ELECTRIC';
  if (vehicle.fuelType === 'Diesel') return 'DIESEL';
  if (vehicle.fuelType === 'Hybrid') return 'HYBRID';
  return 'PETROL';
}

/**
 * 2. Energy & Fuel Cost Calculator
 * - For Petrol/Diesel: (annualKm / kmPerLitre) * fuelPrice
 * - For CNG: (annualKm / kmPerKg) * cngPrice
 * - For EV: (annualKm / kmPerKwh) * electricityPrice (or annualKm * (kwhPer100km / 100) * electricityPrice)
 * Unit safe: returns cost in INR.
 */
export function calculateFuelCost(
  annualKm: number,
  effectiveMileage: number,
  fuelPrice: number,
  isElectric: boolean = false,
  electricityPrice: number = 9.5
): number {
  if (effectiveMileage <= 0) return 0;
  if (isElectric) {
    return Math.round((annualKm / effectiveMileage) * electricityPrice);
  }
  return Math.round((annualKm / effectiveMileage) * fuelPrice);
}

/**
 * 3. Driver & Household Intelligence Calculator
 */
export function calculateDriverImpact(
  drivers: Driver[],
  baseMileage: number,
  fuelPrice: number,
  city: string = 'NCR / Delhi',
  isEV: boolean = false,
  electricityPrice: number = 9.5
): {
  totalDailyKm: number;
  totalAnnualKm: number;
  effectiveMileage: number;
  additionalWearAnnual: number;
  aggressiveCount: number;
  driverImpacts: IndividualDriverImpact[];
} {
  const cityFactor = CITY_FACTORS[city] || { mileageMult: 0.94, wearMult: 1.12 };

  if (!drivers || drivers.length === 0) {
    const dailyKm = 40;
    const annualKm = dailyKm * 365;
    const effMileage = Math.max(isEV ? 2.5 : 5.0, Number((baseMileage * cityFactor.mileageMult).toFixed(1)));
    const annualFuel = calculateFuelCost(annualKm, effMileage, isEV ? electricityPrice : fuelPrice, isEV, electricityPrice);
    
    return {
      totalDailyKm: dailyKm,
      totalAnnualKm: annualKm,
      effectiveMileage: effMileage,
      additionalWearAnnual: 0,
      aggressiveCount: 0,
      driverImpacts: [
        {
          driverId: 'default',
          name: 'Primary Driver',
          role: 'Me',
          dailyKm,
          annualKm,
          effectiveMileage: effMileage,
          annualFuelCost: annualFuel,
          annualWearCost: 0,
          totalCostShare: annualFuel,
          drivingStyle: 'MODERATE',
        },
      ],
    };
  }

  const totalDailyKm = drivers.reduce((acc, d) => acc + d.dailyKm, 0);
  const totalAnnualKm = Math.max(1000, totalDailyKm * 365);

  let totalWeightedMileageRatio = 0;
  let aggressiveCount = 0;
  let totalHouseholdWear = 0;

  const driverImpacts: IndividualDriverImpact[] = drivers.map((driver) => {
    const driverAnnualKm = driver.dailyKm * 365;

    // Driving style coefficients
    let styleMileageMult = 1.0;
    let driverWearCost = 0;

    if (driver.drivingStyle === 'CONSERVATIVE') {
      // Gentle on brakes/tyres. For EV, regenerative braking recovers more range
      styleMileageMult = isEV ? 1.08 : 1.07;
      driverWearCost = Math.round(driverAnnualKm * (isEV ? 0.35 : 0.40));
    } else if (driver.drivingStyle === 'AGGRESSIVE') {
      // Hard acceleration & braking. For EV, instant motor torque burns more tyres and battery
      styleMileageMult = isEV ? 0.80 : 0.83;
      driverWearCost = Math.round(driverAnnualKm * (isEV ? 1.6 : 1.5) + (isEV ? 9000 : 8500));
      aggressiveCount++;
    } else {
      styleMileageMult = 1.0;
      driverWearCost = Math.round(driverAnnualKm * 0.75);
    }

    // City vs Highway split
    const cityRatio = driver.cityHighwaySplit / 100;
    // For EV: urban stop-and-go with regenerative braking is actually MORE efficient than high-speed highway cruising
    const splitMileageFactor = isEV 
      ? 0.94 + (cityRatio * 0.12)
      : 1.04 - (cityRatio * 0.16);

    const minEff = isEV ? 2.5 : 4.5;
    const driverEffMileage = Math.max(
      minEff,
      Number((baseMileage * styleMileageMult * splitMileageFactor * cityFactor.mileageMult).toFixed(1))
    );

    const tariff = isEV ? electricityPrice : fuelPrice;
    const driverFuelCost = calculateFuelCost(driverAnnualKm, driverEffMileage, tariff, isEV, electricityPrice);
    totalHouseholdWear += driverWearCost;

    const weight = totalDailyKm > 0 ? driver.dailyKm / totalDailyKm : 1 / drivers.length;
    totalWeightedMileageRatio += weight * (styleMileageMult * splitMileageFactor * cityFactor.mileageMult);

    return {
      driverId: driver.id,
      name: driver.name,
      role: driver.role,
      dailyKm: driver.dailyKm,
      annualKm: driverAnnualKm,
      effectiveMileage: driverEffMileage,
      annualFuelCost: driverFuelCost,
      annualWearCost: driverWearCost,
      totalCostShare: driverFuelCost + driverWearCost,
      drivingStyle: driver.drivingStyle,
    };
  });

  const minTotalEff = isEV ? 2.5 : 4.5;
  const effectiveMileage = Math.max(minTotalEff, Number((baseMileage * totalWeightedMileageRatio).toFixed(1)));

  return {
    totalDailyKm,
    totalAnnualKm,
    effectiveMileage,
    additionalWearAnnual: Math.round(totalHouseholdWear),
    aggressiveCount,
    driverImpacts,
  };
}

/**
 * 4. P0 #3: Depreciation Engine separating BUYING CAR vs CURRENT CAR
 */
export function calculateDepreciation(
  vehicle: Vehicle,
  ownershipYears: number,
  mode: 'CURRENT_CAR' | 'BUYING_CAR' = 'CURRENT_CAR'
): {
  annualDepreciation: number;
  fiveYearValueRemaining: number;
  fiveYearDepreciationTotal: number;
  tenureResaleValue: number;
  tenureDepreciationTotal: number;
  yearlyDepreciations: number[];
  yearlyValues: number[];
} {
  const years = Math.max(1, Math.min(10, Math.round(ownershipYears)));
  const baseRate = vehicle.depreciationRate || 0.11;

  if (mode === 'BUYING_CAR') {
    // BUYING MODE: starts strictly from purchasePrice
    const startValue = vehicle.purchasePrice;
    const year1Rate = vehicle.firstYearDepreciationRate || (baseRate * 1.55); // Brand new drop is steeper

    let currentValue = startValue;
    const yearlyDepreciations: number[] = [];
    const yearlyValues: number[] = [];

    for (let y = 1; y <= 5; y++) {
      let rate = baseRate;
      if (y === 1) rate = year1Rate;
      else if (y === 2) rate = baseRate * 1.05;
      else if (y === 3) rate = baseRate * 0.92;
      else if (y === 4) rate = baseRate * 0.82;
      else rate = baseRate * 0.72;

      const loss = Math.round(currentValue * rate);
      currentValue = Math.max(Math.round(startValue * 0.15), currentValue - loss);
      yearlyDepreciations.push(loss);
      yearlyValues.push(currentValue);
    }

    // For tenure specifically
    let tenureVal = startValue;
    for (let y = 1; y <= years; y++) {
      const idx = Math.min(y - 1, yearlyDepreciations.length - 1);
      tenureVal = yearlyValues[idx] || (tenureVal * 0.9);
    }

    return {
      annualDepreciation: yearlyDepreciations[0],
      fiveYearValueRemaining: yearlyValues[4],
      fiveYearDepreciationTotal: startValue - yearlyValues[4],
      tenureResaleValue: tenureVal,
      tenureDepreciationTotal: startValue - tenureVal,
      yearlyDepreciations,
      yearlyValues,
    };
  } else {
    // CURRENT CAR MODE: starts from current estimated market value
    const startValue = vehicle.currentValue;
    let currentValue = startValue;
    const yearlyDepreciations: number[] = [];
    const yearlyValues: number[] = [];

    for (let y = 1; y <= 5; y++) {
      // Car is already aged, depreciation curve is stabilizing
      const rate = Math.max(0.065, baseRate * Math.pow(0.88, y - 1));
      const loss = Math.round(currentValue * rate);
      currentValue = Math.max(Math.round(startValue * 0.2), currentValue - loss);
      yearlyDepreciations.push(loss);
      yearlyValues.push(currentValue);
    }

    const tenureVal = yearlyValues[Math.min(years - 1, 4)] || Math.round(startValue * 0.5);

    return {
      annualDepreciation: yearlyDepreciations[0],
      fiveYearValueRemaining: yearlyValues[4],
      fiveYearDepreciationTotal: startValue - yearlyValues[4],
      tenureResaleValue: tenureVal,
      tenureDepreciationTotal: startValue - tenureVal,
      yearlyDepreciations,
      yearlyValues,
    };
  }
}

/**
 * 5. P1 #1: Real Keep vs Sell Economic Comparison
 */
/**
 * Helper to compute precise vehicle age in months and years from purchaseDate or model year
 */
export function getVehicleAge(vehicle: Vehicle): { ageYears: number; ageMonths: number } {
  const currentYear = new Date().getFullYear();
  let ageMonths = 12;
  let ageYears = 1.0;

  if (vehicle.purchaseDate) {
    const parsed = new Date(vehicle.purchaseDate);
    if (!isNaN(parsed.getTime())) {
      const diffMs = Math.max(0, new Date().getTime() - parsed.getTime());
      ageMonths = Math.max(1, Math.round(diffMs / (30.4375 * 24 * 3600 * 1000)));
      ageYears = Math.max(0.1, Number((ageMonths / 12).toFixed(1)));
      return { ageYears, ageMonths };
    }
  }

  const diffYears = Math.max(0, currentYear - vehicle.year);
  ageYears = diffYears > 0 ? diffYears : 1.0;
  ageMonths = Math.round(ageYears * 12);
  return { ageYears, ageMonths };
}

/**
 * Calculates exact interest payable in the upcoming 12 months based on loan age and amortization schedule
 */
export function calculateNext12MonthsLoanInterest(
  principal: number,
  annualRatePercent: number,
  tenureYears: number,
  ageMonths: number
): {
  interestNext12M: number;
  remainingPrincipalNow: number;
  remainingPrincipalAfter12M: number;
} {
  if (principal <= 0 || annualRatePercent <= 0 || tenureYears <= 0) {
    return { interestNext12M: 0, remainingPrincipalNow: 0, remainingPrincipalAfter12M: 0 };
  }

  const monthlyRate = annualRatePercent / 12 / 100;
  const totalMonths = tenureYears * 12;
  const emi = calculateEMI(principal, annualRatePercent, tenureYears);

  // Amortize month by month from month 1 to current elapsed month
  let balance = principal;
  const elapsedMonths = Math.min(totalMonths, Math.max(0, ageMonths));

  for (let m = 1; m <= elapsedMonths; m++) {
    const interestPart = balance * monthlyRate;
    const principalPart = emi - interestPart;
    balance = Math.max(0, balance - principalPart);
  }

  const remainingPrincipalNow = Math.round(balance);

  // Next 12 months amortization
  let interestNext12M = 0;
  for (let m = elapsedMonths + 1; m <= Math.min(totalMonths, elapsedMonths + 12); m++) {
    const interestPart = balance * monthlyRate;
    const principalPart = emi - interestPart;
    interestNext12M += interestPart;
    balance = Math.max(0, balance - principalPart);
  }

  const remainingPrincipalAfter12M = Math.round(balance);

  return {
    interestNext12M: Math.round(interestNext12M),
    remainingPrincipalNow,
    remainingPrincipalAfter12M,
  };
}

/**
 * 5. P0 #4: Real Like-for-Like Keep vs Sell & Replace Economic Comparison
 * Evaluates identical 12-month horizon for both choices:
 * - KEEP: depreciation + maintenance cliff + insurance + fuel + loan interest
 * - SELL & REPLACE: transaction fees + replacement depreciation + replacement financing + replacement maintenance + replacement insurance + fuel
 * Strict invariant: decision is 'KEEP' if and only if costToKeep12M <= costToSellReplace12M.
 */
export function calculateKeepSell(
  vehicle: Vehicle,
  annualMaintenance: number,
  annualInsurance: number,
  annualFuelCost: number,
  loan: LoanAmortization,
  loanInterestRatePercent: number = 8.85,
  loanTenureYears: number = 5
): KeepSellAnalysis {
  const { ageYears, ageMonths } = getVehicleAge(vehicle);

  // OPTION A: KEEP for next 12 months
  // Next 12 months depreciation based on age curve
  const nextYearDepRate = Math.max(0.065, vehicle.depreciationRate * Math.pow(0.92, Math.max(0, ageYears - 1)));
  const depreciation12M = Math.round(vehicle.currentValue * nextYearDepRate);
  const expectedValueAfterOneYear = Math.max(0, vehicle.currentValue - depreciation12M);

  // Maintenance cliff for ageing car (odometer > 30k or age > 2 years)
  const odometerCliff = vehicle.odometerKm > 40000 ? 1.3 : vehicle.odometerKm > 25000 ? 1.18 : 1.0;
  const ageCliff = ageYears >= 4 ? 1.35 : ageYears >= 2 ? 1.18 : 1.0;
  const maintenance12M = Math.round(annualMaintenance * ageCliff * odometerCliff);

  const insurance12M = Math.round(annualInsurance * 0.92); // Slight depreciation on IDV
  const fuel12M = annualFuelCost;

  // Exact 12-month loan interest for current vehicle
  const loanInfo = calculateNext12MonthsLoanInterest(
    loan.principal,
    loanInterestRatePercent,
    loanTenureYears,
    ageMonths
  );
  const loanInterest12M = loanInfo.interestNext12M;

  const costToKeep12M = depreciation12M + maintenance12M + insurance12M + fuel12M + loanInterest12M;

  // OPTION B: SELL TODAY & REPLACE (Like-for-like 12-month horizon)
  // Sell current vehicle today:
  const transactionCost = Math.round(vehicle.currentValue * 0.035); // 3.5% broker, listing & transfer margin
  const sellTodayValue = vehicle.currentValue;
  const currentNetResale = Math.max(0, vehicle.currentValue - transactionCost - loanInfo.remainingPrincipalNow);

  // Replacement vehicle 12-month ownership costs:
  // 1. Replacement year-1 depreciation (brand new / newer vehicle experiences steeper year-1 drop ~15.5%)
  const replacementDepreciation12M = Math.round(vehicle.currentValue * 0.155);

  // 2. Replacement financing: year-1 front-loaded interest on 70% LTV loan
  const replacementPrincipal = Math.round(vehicle.currentValue * 0.7);
  const replacementLoanInfo = calculateNext12MonthsLoanInterest(
    replacementPrincipal,
    loanInterestRatePercent,
    loanTenureYears,
    0 // Year 1 starting at month 0
  );
  const replacementInterest12M = replacementLoanInfo.interestNext12M;

  // 3. Replacement maintenance (lower in year 1 under manufacturer warranty ~65% of mature baseline)
  const replacementMaintenance12M = Math.round(annualMaintenance * 0.65);

  // 4. Replacement insurance (brand new comprehensive zero-dep is ~1.12x of current IDV premium)
  const replacementInsurance12M = Math.round(annualInsurance * 1.12);

  // 5. Replacement fuel (identical usage pattern)
  const replacementFuel12M = annualFuelCost;

  // Total 12-month replacement cost including transaction exit friction
  const costToSellReplace12M = 
    transactionCost + 
    replacementDepreciation12M + 
    replacementInterest12M + 
    replacementMaintenance12M + 
    replacementInsurance12M + 
    replacementFuel12M;

  // Like-for-like comparison difference:
  const breakEvenDifference = Math.abs(costToKeep12M - costToSellReplace12M);

  // ABSOLUTE INVARIANT: Verdict is strictly derived from like-for-like 12-month total cost comparison
  const decision: KeepSellDecision = costToKeep12M <= costToSellReplace12M ? 'KEEP' : 'SELL';

  // Break-even horizon estimation in months
  let breakEvenMonths = 12;
  if (decision === 'KEEP') {
    breakEvenMonths = Math.min(36, Math.max(8, Math.round((costToSellReplace12M / Math.max(1, costToKeep12M)) * 12)));
  } else {
    breakEvenMonths = Math.max(1, Math.min(6, Math.round((transactionCost / Math.max(1, breakEvenDifference)) * 12)));
  }
  const breakEvenDate = new Date();
  breakEvenDate.setMonth(breakEvenDate.getMonth() + breakEvenMonths);
  const breakEvenHorizon = breakEvenDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

  let headlineReason = '';
  let detailedReason = '';

  if (decision === 'KEEP') {
    headlineReason = `Keeping is estimated to cost ₹${(breakEvenDifference / 100000).toFixed(1)}L less over the next 12 months.`;
    detailedReason = `Your ${vehicle.make} ${vehicle.model} has stabilized its depreciation curve (~${(nextYearDepRate * 100).toFixed(1)}%/yr). Selling prematurely triggers ₹${(transactionCost / 100000).toFixed(1)}L in transaction friction and ₹${(replacementDepreciation12M / 100000).toFixed(1)}L in year-1 replacement vehicle depreciation.`;
  } else {
    headlineReason = `Selling is estimated to save ₹${(breakEvenDifference / 100000).toFixed(1)}L over the next 12 months.`;
    detailedReason = `Upcoming maintenance cliff (₹${(maintenance12M / 100000).toFixed(1)}L) and depreciation loss exceed replacement economics. Selling today locks in ₹${(sellTodayValue / 100000).toFixed(1)}L in residual market value before steeper valuation cuts.`;
  }

  return {
    costToKeep12M,
    depreciation12M,
    maintenance12M,
    insurance12M,
    fuel12M,
    loanInterest12M,
    costToSellNow: costToSellReplace12M,
    costToSellReplace12M,
    sellTodayValue,
    currentNetResale,
    expectedValueAfterOneYear,
    transactionCost,
    replacementCost12M: costToSellReplace12M,
    replacementDepreciation12M,
    replacementInterest12M,
    replacementMaintenance12M,
    replacementInsurance12M,
    breakEvenDifference,
    breakEvenMonths,
    breakEvenHorizon,
    decision,
    headlineReason,
    detailedReason,
  };
}

/**
 * 6. P1 #5: Financial Fit & Affordability Breakdown
 */
export function calculateFinancialFit(
  monthlyCarPayment: number,
  monthlyFuelCost: number,
  annualMaintenance: number,
  annualInsurance: number,
  householdIncome: number,
  existingEmis: number,
  otherCommitments: number = 0
): {
  monthlyAutomotiveBurden: number;
  totalMonthlyCommitments: number;
  incomeAllocationPercent: number;
  tier: FinancialFitTier;
  summary: string;
} {
  const monthlyMaintenanceReserve = Math.round((annualMaintenance + annualInsurance) / 12);
  const monthlyAutomotiveBurden = monthlyCarPayment + monthlyFuelCost + monthlyMaintenanceReserve;
  const totalMonthlyCommitments = monthlyAutomotiveBurden + existingEmis + otherCommitments;

  const incomeAllocationPercent = Number(
    ((totalMonthlyCommitments / Math.max(1, householdIncome)) * 100).toFixed(1)
  );

  let tier: FinancialFitTier = 'COMFORTABLE';
  let summary = '';

  if (incomeAllocationPercent <= 24) {
    tier = 'COMFORTABLE';
    summary = `Healthy cashflow allocation: car commitments represent ${incomeAllocationPercent}% of household income, leaving ample buffer for wealth building.`;
  } else if (incomeAllocationPercent <= 36) {
    tier = 'STRETCHED';
    summary = `This car is affordable, but consumes ${incomeAllocationPercent}% of your household monthly income across EMI, fuel, and upkeep.`;
  } else {
    tier = 'AGGRESSIVE';
    summary = `High exposure warning: ${incomeAllocationPercent}% of monthly household income is committed to EMIs and automotive overhead.`;
  }

  return {
    monthlyAutomotiveBurden,
    totalMonthlyCommitments,
    incomeAllocationPercent,
    tier,
    summary,
  };
}

/**
 * 7. P0 #1: Master Authoritative Carconomy True Cost Engine
 */
export function calculateTrueCost(
  vehicle: Vehicle,
  drivers: Driver[],
  ownership: OwnershipProfile,
  finance: FinancialProfile,
  mode: 'CURRENT_CAR' | 'BUYING_CAR' = 'CURRENT_CAR'
): CalculatedEconomics {
  // 1. Energy Type & Tariff Resolution
  const energyType = getVehicleEnergyType(vehicle);
  const isEV = energyType === 'ELECTRIC';
  const elecPrice = ownership.electricityPrice ?? 9.50;
  const cngPrice = ownership.cngPrice ?? 82.0;
  const tariff = isEV ? elecPrice : (energyType === 'CNG' ? cngPrice : ownership.fuelPrice);

  // 2. Driver & Household calculation
  const household = calculateDriverImpact(drivers, vehicle.expectedMileage, tariff, ownership.city, isEV, elecPrice);
  const annualKm = household.totalAnnualKm;
  const effectiveMileage = household.effectiveMileage;

  // 3. Fuel / Energy cost
  const annualFuelCost = calculateFuelCost(annualKm, effectiveMileage, tariff, isEV, elecPrice);
  const monthlyFuelCost = Math.round(annualFuelCost / 12);
  const energyCostPerKm = Number((annualFuelCost / Math.max(1, annualKm)).toFixed(2));

  // Formatted energy display indicators
  const energyMetricLabel = isEV ? 'Energy' : (energyType === 'CNG' ? 'CNG' : 'Fuel');
  const energyEfficiencyDisplay = isEV
    ? `${(100 / Math.max(0.1, effectiveMileage)).toFixed(1)} kWh/100 km (${effectiveMileage.toFixed(1)} km/kWh)`
    : (energyType === 'CNG' ? `${effectiveMileage.toFixed(1)} km/kg` : `${effectiveMileage.toFixed(1)} km/L`);
  const energyTariffDisplay = isEV
    ? `₹${elecPrice.toFixed(2)}/kWh`
    : (energyType === 'CNG' ? `₹${cngPrice.toFixed(2)}/kg` : `₹${ownership.fuelPrice.toFixed(2)}/L`);

  // 4. Maintenance & Wear with Odometer Milestones
  const odoKm = vehicle.odometerKm || 0;
  let odoMaintMult = 1.0;
  if (odoKm > 90000) {
    odoMaintMult = 1.35 + Math.min(0.35, ((odoKm - 90000) / 100000) * 0.2);
  } else if (odoKm > 50000) {
    odoMaintMult = 1.15 + ((odoKm - 50000) / 40000) * 0.2;
  } else if (odoKm > 20000) {
    odoMaintMult = 1.0 + ((odoKm - 20000) / 30000) * 0.15;
  }
  const baseMaint = (ownership.maintenanceAnnual || vehicle.maintenanceEstimate) * odoMaintMult;
  const annualMaintenance = Math.round(baseMaint + household.additionalWearAnnual);

  // 5. Insurance
  const annualInsurance = ownership.insuranceAnnual || vehicle.insuranceEstimate;

  // 6. Real Loan Amortization tailored specifically to THIS vehicle's price
  const downPaymentForThisCar = finance.downPaymentPercent 
    ? Math.round(vehicle.purchasePrice * (finance.downPaymentPercent / 100))
    : Math.min(vehicle.purchasePrice * 0.9, Math.max(vehicle.purchasePrice * 0.1, finance.downPayment));

  const loan = calculateLoan(
    vehicle.purchasePrice,
    downPaymentForThisCar,
    finance.interestRate,
    finance.loanTenureYears,
    ownership.ownershipYears
  );

  // 7. Depreciation & Resale Projections
  const dep = calculateDepreciation(vehicle, ownership.ownershipYears, mode);
  const annualDepreciation = dep.annualDepreciation;

  // 8. Repairs & Tyres with Odometer Wear Factor
  const odoRepairFactor = odoKm > 50000 ? (1 + Math.min(0.5, (odoKm - 50000) / 100000)) : 1.0;
  const annualRepairs = Math.round((ownership.repairsAnnual || Math.round(vehicle.purchasePrice * 0.0035 + 8000)) * odoRepairFactor);
  const annualTyres = ownership.tyresAnnual || Math.round(annualKm * (isEV ? 1.05 : 0.95)); // EVs slightly heavier on tyres

  // 9. Annual Financed Interest (Year 1)
  const y1InterestInfo = calculateNext12MonthsLoanInterest(
    loan.principal,
    finance.interestRate,
    finance.loanTenureYears,
    0
  );
  const annualFinancingInterest = y1InterestInfo.interestNext12M;

  // 10. Total Annual Ownership Cost (Year 1)
  const annualTotalCost = 
    annualFuelCost +
    annualMaintenance +
    annualInsurance +
    annualDepreciation +
    annualFinancingInterest +
    annualRepairs +
    annualTyres +
    (ownership.parkingTollsAnnual || 0);

  const costPerKm = Number((annualTotalCost / Math.max(1, annualKm)).toFixed(1));
  const monthlyOwnershipCost = Math.round(annualTotalCost / 12);

  // 11. Multi-year Coherent Financial Engine (Years 1 to 5 strictly reconciled)
  const yearlyData: YearlyFinancialBreakdown[] = [];
  const yearlyCumulativeTCO: number[] = [];
  let runningCumulative = 0;

  for (let yr = 1; yr <= 5; yr++) {
    const inflation = Math.pow(1.04, yr - 1);
    const yrFuel = Math.round(annualFuelCost * inflation);
    const yrMaint = Math.round(annualMaintenance * (1 + (yr - 1) * 0.08) * Math.pow(1.02, yr - 1));
    const yrIns = Math.round(annualInsurance * Math.pow(0.92, yr - 1));
    const yrDep = dep.yearlyDepreciations[yr - 1] || Math.round(annualDepreciation * Math.pow(0.85, yr - 1));
    
    // Exact financing interest for year yr
    const yrLoanInfo = calculateNext12MonthsLoanInterest(
      loan.principal,
      finance.interestRate,
      finance.loanTenureYears,
      (yr - 1) * 12
    );
    const yrInterest = yrLoanInfo.interestNext12M;
    
    const yrRepairsTyres = Math.round((annualRepairs + annualTyres) * inflation);
    const yrParkingTolls = Math.round((ownership.parkingTollsAnnual || 0) * inflation);
    
    const yearTotal = yrFuel + yrMaint + yrIns + yrDep + yrInterest + yrRepairsTyres + yrParkingTolls;
    runningCumulative += yearTotal;
    
    yearlyCumulativeTCO.push(runningCumulative);
    yearlyData.push({
      year: yr,
      fuel: yrFuel,
      maintenance: yrMaint,
      insurance: yrIns,
      depreciation: yrDep,
      financingInterest: yrInterest,
      repairsAndTyres: yrRepairsTyres,
      parkingAndTolls: yrParkingTolls,
      yearTotal,
      cumulativeTCO: runningCumulative,
      vehicleValueAtYearEnd: dep.yearlyValues[yr - 1] || Math.round(vehicle.purchasePrice * 0.3),
    });
  }

  // Strictly reconciled 5-Year Totals directly summing yearlyData[0..4]
  const fiveYearTotalCost = yearlyData.reduce((acc, d) => acc + d.yearTotal, 0);
  const fiveYearFuelTotal = yearlyData.reduce((acc, d) => acc + d.fuel, 0);
  const fiveYearMaintenanceTotal = yearlyData.reduce((acc, d) => acc + d.maintenance, 0);
  const fiveYearInsuranceTotal = yearlyData.reduce((acc, d) => acc + d.insurance, 0);
  const fiveYearDepreciationTotal = yearlyData.reduce((acc, d) => acc + d.depreciation, 0);
  const fiveYearInterestTotal = yearlyData.reduce((acc, d) => acc + d.financingInterest, 0);
  const fiveYearRepairsTyresTotal = yearlyData.reduce((acc, d) => acc + d.repairsAndTyres, 0);
  const fiveYearParkingTollsTotal = yearlyData.reduce((acc, d) => acc + d.parkingAndTolls, 0);

  const fiveYearValueRemaining = dep.fiveYearValueRemaining;
  const fiveYearTotalKm = annualKm * 5;
  const fiveYearCostPerKm = Number((fiveYearTotalCost / Math.max(1, fiveYearTotalKm)).toFixed(1));

  // 12. Ownership Tenure Cost (Honestly bounded to 1 to 5 years)
  const tenureYearsBounded = Math.max(1, Math.min(5, Math.round(ownership.ownershipYears)));
  const totalTenureCost = yearlyData.slice(0, tenureYearsBounded).reduce((acc, d) => acc + d.yearTotal, 0);
  const tenureResaleValue = yearlyData[tenureYearsBounded - 1].vehicleValueAtYearEnd;
  const totalTenureDepreciation = yearlyData.slice(0, tenureYearsBounded).reduce((acc, d) => acc + d.depreciation, 0);
  const tenureKm = annualKm * tenureYearsBounded;
  const tenureCostPerKm = Number((totalTenureCost / Math.max(1, tenureKm)).toFixed(1));

  // 13. Keep or Sell Analysis
  const keepSellDetails = calculateKeepSell(
    vehicle,
    annualMaintenance,
    annualInsurance,
    annualFuelCost,
    loan,
    finance.interestRate,
    finance.loanTenureYears
  );

  // 14. Financial Affordability Fit
  const fit = calculateFinancialFit(
    loan.monthlyEMI,
    monthlyFuelCost,
    annualMaintenance,
    annualInsurance,
    finance.householdIncome,
    finance.existingEmis,
    finance.otherCommitments
  );

  return {
    annualKm,
    effectiveMileage,
    annualFuelCost,
    monthlyFuelCost,
    annualMaintenance,
    annualInsurance,
    annualDepreciation,
    annualFinancingInterest,
    annualRepairs,
    annualTyres,
    annualTotalCost,
    costPerKm,
    monthlyOwnershipCost,

    energyType,
    energyMetricLabel,
    energyEfficiencyDisplay,
    energyTariffDisplay,
    energyCostPerKm,

    householdDailyKm: household.totalDailyKm,
    householdAdditionalWear: household.additionalWearAnnual,
    aggressiveDriversCount: household.aggressiveCount,
    driverImpacts: household.driverImpacts,

    loan,

    tenureYears: tenureYearsBounded,
    totalTenureCost,
    totalTenureDepreciation,
    tenureResaleValue,
    tenureCostPerKm,

    yearlyData,

    fiveYearTotalCost,
    fiveYearValueRemaining,
    fiveYearCostPerKm,
    fiveYearDepreciationTotal,
    fiveYearFuelTotal,
    fiveYearMaintenanceTotal,
    fiveYearInsuranceTotal,
    fiveYearInterestTotal,
    fiveYearRepairsTyresTotal,
    fiveYearParkingTollsTotal,
    yearlyCumulativeTCO,

    nextYearValue: keepSellDetails.expectedValueAfterOneYear,
    nextYearDepreciation: keepSellDetails.depreciation12M,
    nextYearMaintenance: keepSellDetails.maintenance12M,
    nextYearKeepingCost: keepSellDetails.costToKeep12M,
    keepSellDecision: keepSellDetails.decision,
    keepSellReason: keepSellDetails.headlineReason,
    keepSellDetails,

    monthlyCarPayment: loan.monthlyEMI,
    totalMonthlyCarCommitment: fit.monthlyAutomotiveBurden,
    incomeAllocationPercent: fit.incomeAllocationPercent,
    financialFitTier: fit.tier,
    financialFitSummary: fit.summary,
  };
}

/**
 * 8. Comparison Engine between 2 or 3 cars with Dynamic Financial Verdict
 */
export function calculateComparison(
  carA: Vehicle,
  carB: Vehicle,
  drivers: Driver[],
  ownership: OwnershipProfile,
  finance: FinancialProfile,
  carC?: Vehicle
) {
  const ecoA = calculateTrueCost(carA, drivers, ownership, finance, 'BUYING_CAR');
  const ecoB = calculateTrueCost(carB, drivers, ownership, finance, 'BUYING_CAR');
  const ecoC = carC ? calculateTrueCost(carC, drivers, ownership, finance, 'BUYING_CAR') : undefined;

  const diff5Year = Math.abs(ecoA.fiveYearTotalCost - ecoB.fiveYearTotalCost);
  const winnerIsA = ecoA.fiveYearTotalCost <= ecoB.fiveYearTotalCost;
  const winnerCar = winnerIsA ? carA : carB;
  const loserCar = winnerIsA ? carB : carA;
  const winnerEco = winnerIsA ? ecoA : ecoB;
  const loserEco = winnerIsA ? ecoB : ecoA;
  const savings = diff5Year;

  // Synthesize dynamic explanation of WHY winner makes more financial sense
  const diffDep = loserEco.fiveYearDepreciationTotal - winnerEco.fiveYearDepreciationTotal;
  const diffFuel = loserEco.fiveYearFuelTotal - winnerEco.fiveYearFuelTotal;
  const diffMaint = (loserEco.fiveYearMaintenanceTotal + loserEco.fiveYearRepairsTyresTotal) - 
                    (winnerEco.fiveYearMaintenanceTotal + winnerEco.fiveYearRepairsTyresTotal);
  const diffInterest = loserEco.fiveYearInterestTotal - winnerEco.fiveYearInterestTotal;

  const reasons: string[] = [];
  if (diffDep > 50000) {
    reasons.push(`lower depreciation (saving ₹${(diffDep / 100000).toFixed(1)}L)`);
  }
  if (diffFuel > 40000) {
    const energyLabel = winnerEco.energyType === 'ELECTRIC' ? 'running energy' : 'fuel';
    reasons.push(`lower ${energyLabel} costs (saving ₹${(diffFuel / 100000).toFixed(1)}L)`);
  }
  if (diffMaint > 30000) {
    reasons.push(`lower scheduled maintenance & wear (saving ₹${(diffMaint / 100000).toFixed(1)}L)`);
  }
  if (diffInterest > 40000) {
    reasons.push(`lower financing interest (saving ₹${(diffInterest / 100000).toFixed(1)}L)`);
  }

  let verdictExplanation = '';
  if (reasons.length > 0) {
    verdictExplanation = `${winnerCar.make} ${winnerCar.model} wins primarily because of ${reasons.slice(0, 2).join(' and ')} over 5 years.`;
  } else {
    verdictExplanation = `${winnerCar.make} ${winnerCar.model} has lower overall acquisition and running costs over a 5-year ownership horizon.`;
  }

  return {
    carA,
    carB,
    carC,
    ecoA,
    ecoB,
    ecoC,
    winnerIsA,
    winnerCar,
    loserCar,
    winnerEco,
    loserEco,
    savings,
    verdictTitle: `${winnerCar.make.toUpperCase()} ${winnerCar.model.toUpperCase()} WINS`,
    verdictExplanation,
    diffDep,
    diffFuel,
    diffMaint,
    diffInterest,
  };
}

export interface TaxTacticsAnalysis {
  taxBracketPercent: number;
  isCorporateLease: boolean;
  isBusinessDepreciationClaimed: boolean;
  annualCorporateLeaseTaxSavings: number;
  annualSec80EEASavings: number;
  annualDepreciationTaxShield: number;
  totalAnnualTaxSavings: number;
  netAnnualOutlayAfterTax: number;
  netCostPerKmAfterTax: number;
}

export function calculateTaxTactics(
  vehicle: Vehicle,
  finance: FinancialProfile,
  eco: CalculatedEconomics
): TaxTacticsAnalysis {
  const bracket = finance.taxBracketPercent || 30; // default 30% tax bracket
  const taxRate = bracket / 100;
  
  // 1. Corporate Lease / Salary Sacrifice Tax Savings (EMI + Fuel + Maint pre-tax deduction)
  const isLease = !!finance.isCorporateLease;
  const annualLeaseEligibleOutlay = eco.annualFinancingInterest + eco.annualFuelCost + eco.annualMaintenance;
  const annualCorporateLeaseTaxSavings = isLease ? Math.round(annualLeaseEligibleOutlay * taxRate) : 0;

  // 2. Section 80EEA EV Tax Savings (Interest deduction up to ₹1.5L for EV loans)
  const isEV = eco.energyType === 'ELECTRIC';
  const claimableEVInterest = Math.min(150000, eco.annualFinancingInterest);
  const annualSec80EEASavings = isEV ? Math.round(claimableEVInterest * taxRate) : 0;

  // 3. Business Depreciation Tax Shield (15% for ICE, 40% for EV)
  const isBiz = !!finance.isBusinessDepreciationClaimed;
  const bizDepRate = isEV ? 0.40 : 0.15;
  const annualDepShieldAmount = vehicle.purchasePrice * bizDepRate;
  const annualDepreciationTaxShield = isBiz ? Math.round(annualDepShieldAmount * taxRate) : 0;

  const totalAnnualTaxSavings = annualCorporateLeaseTaxSavings + annualSec80EEASavings + annualDepreciationTaxShield;
  const netAnnualOutlayAfterTax = Math.max(0, eco.annualTotalCost - totalAnnualTaxSavings);
  const netCostPerKmAfterTax = eco.annualKm > 0 ? Number((netAnnualOutlayAfterTax / eco.annualKm).toFixed(2)) : eco.costPerKm;

  return {
    taxBracketPercent: bracket,
    isCorporateLease: isLease,
    isBusinessDepreciationClaimed: isBiz,
    annualCorporateLeaseTaxSavings,
    annualSec80EEASavings,
    annualDepreciationTaxShield,
    totalAnnualTaxSavings,
    netAnnualOutlayAfterTax,
    netCostPerKmAfterTax,
  };
}

export interface ReplacementRecommendation {
  targetHorizonYears: number;
  recommendedYearToSell: number;
  estimatedResaleAtSellYear: number;
  recommendedUpgradeCar: Vehicle | null;
  equityAtExit: number;
  recommendationReason: string;
}

export function calculateReplacementRecommendation(
  vehicle: Vehicle,
  eco: CalculatedEconomics,
  finance: FinancialProfile,
  allVehicles: Vehicle[]
): ReplacementRecommendation {
  const targetYears = finance.targetReplacementYears || 4;
  
  // Find year where depreciation slows down and maintenance rises
  let recommendedYear = 4;
  
  if (eco.yearlyData && eco.yearlyData.length > 0) {
    let prevValue = vehicle.purchasePrice;
    for (const yrData of eco.yearlyData) {
      const yearDep = prevValue - yrData.vehicleValueAtYearEnd;
      if (yrData.maintenance > yearDep * 0.7) {
        recommendedYear = yrData.year;
        break;
      }
      prevValue = yrData.vehicleValueAtYearEnd;
    }
  }

  const yrIndex = Math.min(eco.yearlyData.length - 1, Math.max(0, recommendedYear - 1));
  const estimatedResale = eco.yearlyData[yrIndex]?.vehicleValueAtYearEnd || vehicle.currentValue * 0.5;

  const loanExit = eco.loan.remainingPrincipalAtExit || 0;
  const equityAtExit = Math.max(0, estimatedResale - loanExit);

  // Pick suitable upgrade car from catalog
  const upgradeCar = allVehicles.find(v => v.id === finance.targetUpgradeCarId) || 
                     allVehicles.find(v => v.id !== vehicle.id) || null;

  const reason = `Optimal resale timing for ${vehicle.make} ${vehicle.model} is at Year ${recommendedYear} (approx. ₹${(estimatedResale / 100000).toFixed(1)}L residual market value). Equity left after paying off remaining loan balance will be ₹${(equityAtExit / 100000).toFixed(1)}L.`;

  return {
    targetHorizonYears: targetYears,
    recommendedYearToSell: recommendedYear,
    estimatedResaleAtSellYear: estimatedResale,
    recommendedUpgradeCar: upgradeCar,
    equityAtExit,
    recommendationReason: reason,
  };
}

export interface VehicleMatchRank {
  vehicle: Vehicle;
  matchScore: number; // 0 to 100
  taxSavingsAnnual: number;
  costPerKm: number;
  monthlyCommitment: number;
  incomeAllocationPercent: number;
  financialFitTier: FinancialFitTier;
  reasons: string[];
}

export interface DynamicJudgeRecommendation {
  topCar: Vehicle;
  topScore: number;
  topReason: string;
  rankedCars: VehicleMatchRank[];
}

export function evaluateJudgeProfileRecommendation(
  allVehicles: Vehicle[],
  finance: FinancialProfile,
  drivers: Driver[],
  ownership: OwnershipProfile
): DynamicJudgeRecommendation {
  if (!allVehicles || allVehicles.length === 0) {
    throw new Error("No vehicles available for evaluation");
  }

  const demo = finance.demographics;
  const targetPriority = demo?.primaryCarPriority || 'SAFETY';
  const consultingGoal = demo?.consultingFocusGoal || 'MINIMIZE_TCO';
  const hasKids = (demo?.kidsCount || 0) > 0;
  const hasSeniors = (demo?.seniorParentsCount || 0) > 0;
  const isCorporate = !!finance.isCorporateLease || !!finance.isBusinessDepreciationClaimed;

  const rankedCars: VehicleMatchRank[] = allVehicles.map(v => {
    const eco = calculateTrueCost(v, drivers, ownership, finance, 'TARGET_BUY');
    const tax = calculateTaxTactics(v, finance, eco);
    let score = 50;
    const reasons: string[] = [];

    // 1. Affordability Score (Up to 30 pts)
    const alloc = eco.incomeAllocationPercent;
    if (alloc <= 18) {
      score += 30;
      reasons.push(`Comfortable budget (${alloc.toFixed(1)}% income)`);
    } else if (alloc <= 28) {
      score += 20;
      reasons.push(`Manageable budget (${alloc.toFixed(1)}% income)`);
    } else if (alloc <= 38) {
      score += 10;
    } else {
      score -= 15;
    }

    // 2. Tax Shield Optimization (Up to 25 pts)
    if (isCorporate) {
      if (v.energyType === 'ELECTRIC') {
        score += 25;
        reasons.push(`Max EV Tax Shield (Saves ₹${(tax.totalAnnualTaxSavings / 100000).toFixed(1)}L/yr)`);
      } else if (v.purchasePrice >= 3500000) {
        score += 20;
        reasons.push(`High Corporate Lease Write-off (Saves ₹${(tax.totalAnnualTaxSavings / 100000).toFixed(1)}L/yr)`);
      }
    }

    // 3. Family / Passenger Capacity (Up to 15 pts)
    if ((hasKids || hasSeniors || (demo?.householdSize || 1) >= 4) && (v.model.includes('Fortuner') || v.model.includes('XUV700') || v.model.includes('Camry') || v.model.includes('Creta'))) {
      score += 15;
      reasons.push('Spacious cabin for family & seniors');
    }

    // 4. Priority Alignment (Up to 20 pts)
    if (targetPriority === 'EFFICIENCY' && (v.energyType === 'ELECTRIC' || v.energyType === 'HYBRID')) {
      score += 20;
      reasons.push(`High Efficiency (${eco.energyEfficiencyDisplay})`);
    } else if (targetPriority === 'RESALE' && v.depreciationRate <= 0.09) {
      score += 20;
      reasons.push('Exceptional Resale Value Retention');
    } else if (targetPriority === 'STATUS' && (v.make === 'BMW' || v.make === 'Mercedes-Benz' || v.make === 'Porsche')) {
      score += 20;
      reasons.push('Luxury Badge & Executive Status');
    } else if (targetPriority === 'PERFORMANCE' && parseFloat(v.specs.zeroToHundred || '99') <= 6.5) {
      score += 20;
      reasons.push(`Thrilling Acceleration (${v.specs.zeroToHundred} 0-100)`);
    } else if (targetPriority === 'SAFETY') {
      score += 15;
      reasons.push('High Safety & Warranty');
    }

    // 5. Consulting Goal Bonus
    if (consultingGoal === 'EV_TRANSITION' && v.energyType === 'ELECTRIC') {
      score += 15;
    }

    const finalScore = Math.min(99, Math.max(25, Math.round(score)));

    return {
      vehicle: v,
      matchScore: finalScore,
      taxSavingsAnnual: tax.totalAnnualTaxSavings,
      costPerKm: eco.costPerKm,
      monthlyCommitment: eco.totalMonthlyCarCommitment,
      incomeAllocationPercent: eco.incomeAllocationPercent,
      financialFitTier: eco.financialFitTier,
      reasons,
    };
  });

  rankedCars.sort((a, b) => b.matchScore - a.matchScore);

  const topMatch = rankedCars[0];
  const topCar = topMatch.vehicle;
  const topScore = topMatch.matchScore;
  const topReason = `${topCar.make} ${topCar.model} is your #1 match (${topScore}% Match Score): ${topMatch.reasons.join(', ')}.`;

  return {
    topCar,
    topScore,
    topReason,
    rankedCars,
  };
}
