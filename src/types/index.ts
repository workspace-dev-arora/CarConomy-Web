export type FuelType = 'Petrol' | 'Diesel' | 'Hybrid' | 'EV';

export type EnergyType = 'PETROL' | 'DIESEL' | 'CNG' | 'ELECTRIC' | 'HYBRID';

export type DrivingStyle = 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';

export type DriverRole = 'Me' | 'Wife / Husband' | 'Children' | 'Parents' | 'Chauffeur' | 'Other';

export type KeepSellDecision = 'KEEP' | 'SELL';

export type FinancialFitTier = 'COMFORTABLE' | 'STRETCHED' | 'AGGRESSIVE';

export interface VehicleImages {
  hero: string;
  front?: string;
  rear?: string;
  side?: string;
  interior?: string;
  gallery?: string[];
  sourceAttribution?: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  variant: string;
  year: number;
  generation?: string;
  fuelType: FuelType;
  energyType?: EnergyType;
  energyConsumptionKwhPer100Km?: number; // e.g. 17.2 for BMW i4
  batteryCapacityKwh?: number; // e.g. 83.9 for BMW i4
  purchasePrice: number; // in INR
  currentValue: number; // in INR (for current car)
  expectedMileage: number; // km/L for ICE/Hybrid, or km/kWh for EV
  maintenanceEstimate: number; // annual in INR
  insuranceEstimate: number; // annual in INR
  depreciationRate: number; // annual rate e.g. 0.11
  firstYearDepreciationRate?: number; // e.g. 0.18 for brand new cars
  resaleEstimate?: number;
  image: string;
  images?: VehicleImages;
  color?: string;
  colorName?: string;
  odometerKm: number;
  purchaseDate: string;
  specs: {
    engine: string;
    power: string;
    torque: string;
    transmission: string;
    zeroToHundred: string;
    fuelTankLiters: number;
    warrantyYears: number;
  };
}

export interface Driver {
  id: string;
  name: string;
  role: DriverRole;
  dailyKm: number;
  cityHighwaySplit: number; // % city e.g. 70 means 70% city, 30% highway
  drivingStyle: DrivingStyle;
}

export interface DeepDemographicProfile {
  householdSize: number;
  primaryScenario: 'OFFICE_COMMUTE' | 'FAMILY_TRIPS' | 'SCHOOL_RUNS' | 'LUXURY_CLIENT' | 'HIGHWAY_TOURING';
  hasChauffeur: boolean;
  kidsCount: number;
  seniorParentsCount: number;
  consultingFocusGoal: 'MINIMIZE_TCO' | 'KEEP_OR_SELL' | 'TAX_OPTIMIZATION' | 'EV_TRANSITION' | 'LUXURY_UPGRADE';
  primaryCarPriority: 'SAFETY' | 'EFFICIENCY' | 'RESALE' | 'STATUS' | 'PERFORMANCE';
  companyAllowanceMonthly?: number;
  isProfileWizardCompleted?: boolean;
}

export interface FinancialProfile {
  monthlyIncome: number; // in INR
  householdIncome: number; // in INR
  existingEmis: number; // in INR monthly
  otherCommitments: number; // in INR monthly
  downPayment: number; // in INR (applied when evaluating target car)
  downPaymentPercent?: number; // e.g. 25%
  loanAmount?: number; // in INR
  interestRate: number; // % annual e.g. 8.85
  loanTenureYears: number;
  // Deep Tax & Consulting Demographics
  taxBracketPercent?: number;
  isCorporateLease?: boolean;
  isBusinessDepreciationClaimed?: boolean;
  targetReplacementYears?: number;
  targetUpgradeCarId?: string;
  demographics?: DeepDemographicProfile;
}

export interface OwnershipProfile {
  annualKm: number;
  fuelPrice: number; // per liter in INR (for Petrol/Diesel)
  electricityPrice?: number; // per kWh in INR (default e.g. 9.5 for EV)
  cngPrice?: number; // per kg in INR (default e.g. 82.0 for CNG)
  ownershipYears: number;
  city: string; // e.g. "Mumbai", "NCR", "Bengaluru", "Pune", "Expressway"
  maintenanceAnnual?: number;
  insuranceAnnual?: number;
  repairsAnnual?: number;
  tyresAnnual?: number;
  parkingTollsAnnual?: number;
}

export interface IndividualDriverImpact {
  driverId: string;
  name: string;
  role: DriverRole;
  dailyKm: number;
  annualKm: number;
  effectiveMileage: number;
  annualFuelCost: number;
  annualWearCost: number;
  totalCostShare: number;
  drivingStyle: DrivingStyle;
}

export interface KeepSellAnalysis {
  costToKeep12M: number;
  depreciation12M: number;
  maintenance12M: number;
  insurance12M: number;
  fuel12M: number;
  loanInterest12M: number;
  costToSellNow: number;
  costToSellReplace12M: number;
  sellTodayValue: number;
  currentNetResale: number;
  expectedValueAfterOneYear: number;
  transactionCost: number;
  replacementCost12M: number;
  replacementDepreciation12M: number;
  replacementInterest12M: number;
  replacementMaintenance12M: number;
  replacementInsurance12M: number;
  breakEvenDifference: number; // Difference in INR
  breakEvenMonths: number;
  breakEvenHorizon: string;
  decision: KeepSellDecision;
  headlineReason: string;
  detailedReason: string;
}

export interface LoanAmortization {
  principal: number;
  monthlyEMI: number;
  totalPayments: number;
  totalInterest: number;
  totalLoanCost: number;
  paymentsDuringOwnership: number;
  principalPaidDuringOwnership: number;
  interestPaidDuringOwnership: number;
  remainingPrincipalAtExit: number;
}

export interface YearlyFinancialBreakdown {
  year: number;
  fuel: number;
  maintenance: number;
  insurance: number;
  depreciation: number;
  financingInterest: number;
  repairsAndTyres: number;
  parkingAndTolls: number;
  yearTotal: number;
  cumulativeTCO: number;
  vehicleValueAtYearEnd: number;
}

export interface CalculatedEconomics {
  // Annual figures (Year 1)
  annualKm: number;
  effectiveMileage: number;
  annualFuelCost: number; // Represents annual energy/fuel outlay in INR
  monthlyFuelCost: number;
  annualMaintenance: number;
  annualInsurance: number;
  annualDepreciation: number;
  annualFinancingInterest: number;
  annualRepairs: number;
  annualTyres: number;
  annualTotalCost: number;
  costPerKm: number;
  monthlyOwnershipCost: number;

  // Energy & Fuel Intelligence
  energyType: EnergyType;
  energyMetricLabel: string; // "Fuel" or "Energy"
  energyEfficiencyDisplay: string; // e.g. "17.2 kWh/100 km" (EV) or "13.8 km/L" (ICE)
  energyTariffDisplay: string; // e.g. "₹9.5/kWh" (EV) or "₹100.0/L" (Petrol)
  energyCostPerKm: number; // in INR

  // Household driver impacts
  householdDailyKm: number;
  householdAdditionalWear: number; // in INR
  aggressiveDriversCount: number;
  driverImpacts: IndividualDriverImpact[];

  // Real Loan calculation for THIS specific vehicle
  loan: LoanAmortization;

  // Ownership tenure projections (based on ownershipYears)
  tenureYears: number;
  totalTenureCost: number;
  totalTenureDepreciation: number;
  tenureResaleValue: number;
  tenureCostPerKm: number;

  // Reconciled multi-year data
  yearlyData: YearlyFinancialBreakdown[];

  // 5 Year Projections (strictly reconciled: sum of yearlyData 1..5)
  fiveYearTotalCost: number;
  fiveYearValueRemaining: number;
  fiveYearCostPerKm: number;
  fiveYearDepreciationTotal: number;
  fiveYearFuelTotal: number;
  fiveYearMaintenanceTotal: number;
  fiveYearInsuranceTotal: number;
  fiveYearInterestTotal: number;
  fiveYearRepairsTyresTotal: number;
  fiveYearParkingTollsTotal: number;
  yearlyCumulativeTCO: number[]; // [yr1, yr2, yr3, yr4, yr5]

  // Keep or Sell analysis
  nextYearValue: number;
  nextYearDepreciation: number;
  nextYearMaintenance: number;
  nextYearKeepingCost: number;
  keepSellDecision: KeepSellDecision;
  keepSellReason: string;
  keepSellDetails: KeepSellAnalysis;

  // Financial Fit
  monthlyCarPayment: number; // Loan EMI for this car
  totalMonthlyCarCommitment: number; // EMI + Fuel + Maintenance + Insurance
  incomeAllocationPercent: number; // (Car commitments + existing EMIs) / household income
  financialFitTier: FinancialFitTier;
  financialFitSummary: string;
}

export interface ServiceItem {
  id: string;
  categoryId: string;
  categoryName: string;
  providerName: string;
  providerType: 'Authorized Service' | 'Premium Independent' | 'Verified Local Garage';
  price: number;
  rating: number;
  reviewsCount: number;
  distanceKm: number;
  estimatedTime: string;
  verified: boolean;
  warrantyMonths: number;
  features: string[];
}

export interface ConsultancyPackage {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  duration: string;
  badge?: string;
  description: string;
  deliverables: string[];
  recommendedFor: string;
}
