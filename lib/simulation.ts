/**
 * Cashflow Compounding & Loan Reinvestment Simulation Engine
 * Used for Investor / Client View Model Presentations.
 */

export interface SimulationMonthData {
  month: number;
  dateStr: string;
  activePayingLoans: number;
  emiCollected: number;
  availablePool: number;
  surplusBefore: number;
  newLoansFunded: number;
  newDisbursedInHand: number;
  newFileChargesEarned: number;
  surplusRemaining: number;
  nextMonthActiveLoans: number;
  cumulativeCollected: number;
  cumulativeDisbursed: number;
  cumulativeFileCharges: number;

  // Live Market Portfolio Metrics
  marketOutstandingCash: number;        // Total future EMIs to be collected from market: sum(count * monthsLeft * emi)
  activeCapitalDeployed: number;        // Total active loan principal deployed in market: sum(count * principal)
  newLoansMarketValue: number;          // Total future repayment value injected this month (e.g. 8 * 4050 * 20 = 6,48,000)
  newLoansMarketBreakdown: string;      // Breakdown text for presentation (e.g. "8 Loans (8 × ₹4,050 × 20m = ₹6,48,000)")

  // Refinancing Specific Metadata
  refinanceTriggered?: boolean;
  refinanceBorrowers?: number;
  refinanceSanctionedPerPerson?: number;
  refinanceFileChargePerPerson?: number;
  refinanceOldEmisRemaining?: number;
  refinanceOldSettledPerPerson?: number;
  refinanceNetInHandPerPerson?: number;
  refinanceTotalNetRequired?: number;
  refinanceIsDeficit?: boolean;
  refinanceDeficitAmount?: number;
  refinanceMaxAffordable?: number;
  refinanceFileChargesTotal?: number;
  refinanceOldSettledTotal?: number;
}

export interface MonthRefinanceConfig {
  count: number;
  borrowerIds?: number[];
  sanctioned?: number;
  fileCharge?: number;
  monthlyEmi?: number;
  tenureMonths?: number;
}

export interface SimulationConfig {
  initialLoans?: number;
  sanctionedAmount?: number;
  fileCharge?: number;
  monthlyEmi?: number;
  tenureMonths?: number;
  totalMonths?: number;
  startDate?: string;
  reinvestFileCharges?: boolean;

  // Single Refinancing Configuration (Fallback)
  refinanceEnabled?: boolean;
  refinanceAtMonth?: number;
  refinanceCount?: number;
  refinanceSanctioned?: number;
  refinanceFileCharge?: number;
  refinanceMonthlyEmi?: number;
  refinanceTenureMonths?: number;

  // Multi-Month Refinancing Map (Keyed by Month number e.g. 16, 17, 18...)
  monthlyRefinances?: Record<number, MonthRefinanceConfig>;
}

interface LoanCohort {
  count: number;
  monthsLeft: number;
  emi: number;
  principal: number;
  isInitial?: boolean;
}

export function generateSimulationData(config?: SimulationConfig): SimulationMonthData[] {
  const initialLoans = config?.initialLoans ?? 43;
  const sanctionedAmount = config?.sanctionedAmount ?? 60000;
  const fileCharge = config?.fileCharge ?? 5000;
  const inHandRequired = sanctionedAmount - fileCharge; // 55000
  const monthlyEmi = config?.monthlyEmi ?? 4050;
  const tenureMonths = config?.tenureMonths ?? 20;
  const totalMonths = config?.totalMonths ?? 30; // extended to 30 months
  const startDateStr = config?.startDate ?? new Date().toISOString().split('T')[0];
  const reinvestFileCharges = config?.reinvestFileCharges ?? false;

  // Refinancing parameters (defaults & multi-month mapping)
  const refinanceEnabled = config?.refinanceEnabled ?? true;
  const refinanceAtMonth = config?.refinanceAtMonth ?? 16;
  const refinanceCount = config?.refinanceCount ?? 8;
  const refinanceSanctioned = config?.refinanceSanctioned ?? 80000;
  const refinanceFileCharge = config?.refinanceFileCharge ?? 6000;
  const refinanceMonthlyEmi = config?.refinanceMonthlyEmi ?? 4050;
  const refinanceTenureMonths = config?.refinanceTenureMonths ?? 30;

  // Build map of refinance events per month
  const monthlyRefinancesMap: Record<number, MonthRefinanceConfig> = {};
  if (config?.monthlyRefinances) {
    Object.assign(monthlyRefinancesMap, config.monthlyRefinances);
  } else if (refinanceEnabled && refinanceAtMonth) {
    monthlyRefinancesMap[refinanceAtMonth] = {
      count: refinanceCount,
      sanctioned: refinanceSanctioned,
      fileCharge: refinanceFileCharge,
      monthlyEmi: refinanceMonthlyEmi,
      tenureMonths: refinanceTenureMonths,
    };
  }

  // Active loan cohorts: tracks count, months remaining, EMI, and sanctioned principal
  let cohorts: LoanCohort[] = [
    { count: initialLoans, monthsLeft: tenureMonths, emi: monthlyEmi, principal: sanctionedAmount, isInitial: true }
  ];

  let surplus = 0;
  let cumulativeCollected = 0;
  let cumulativeDisbursed = initialLoans * inHandRequired; // initial base deployed
  let cumulativeFileCharges = initialLoans * fileCharge; // initial base fee

  const results: SimulationMonthData[] = [];
  const startDate = new Date(startDateStr);

  for (let m = 1; m <= totalMonths; m++) {
    const currentDate = new Date(startDate);
    currentDate.setMonth(currentDate.getMonth() + m);
    const dateStr = currentDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    // 1. Active paying loans this month
    const activePayingLoans = cohorts.reduce((acc, c) => acc + c.count, 0);

    // 2. Total EMI collected this month
    const emiCollected = cohorts.reduce((acc, c) => acc + c.count * c.emi, 0);
    cumulativeCollected += emiCollected;

    // Existing active cohorts have paid 1 installment this month
    for (const c of cohorts) {
      c.monthsLeft--;
    }

    // 3. Pool of cash available to lend
    const surplusBefore = surplus;
    let pool = surplusBefore + emiCollected;

    // Refinance tracking variables for this month
    let refinanceTriggered = false;
    let refBorrowers = 0;
    let refSanctionedPerPerson = refinanceSanctioned;
    let refFileChargePerPerson = refinanceFileCharge;
    let refOldEmisRemaining = 0;
    let refOldSettledPerPerson = 0;
    let refNetInHandPerPerson = 0;
    let refTotalNetRequired = 0;
    let refIsDeficit = false;
    let refDeficitAmount = 0;
    let refMaxAffordable = 0;
    let refFileChargesTotal = 0;
    let refOldSettledTotal = 0;

    let newLoansFunded = 0;
    let newDisbursedInHand = 0;
    let newFileChargesEarned = 0;

    // Check if this month has a refinancing event configured
    const currentMonthRefinance = refinanceEnabled ? monthlyRefinancesMap[m] : undefined;
    if (currentMonthRefinance && currentMonthRefinance.count > 0) {
      refinanceTriggered = true;
      refBorrowers = currentMonthRefinance.count;
      refSanctionedPerPerson = currentMonthRefinance.sanctioned ?? refinanceSanctioned;
      refFileChargePerPerson = currentMonthRefinance.fileCharge ?? refinanceFileCharge;
      const refEmi = currentMonthRefinance.monthlyEmi ?? refinanceMonthlyEmi;
      const refTenure = currentMonthRefinance.tenureMonths ?? refinanceTenureMonths;

      // Calculate remaining EMIs for the initial base cohort at Month m
      // e.g. At Month 16: paid 16 EMIs, remaining = 20 - 16 = 4 EMIs (4 * 4050 = 16,200)
      // e.g. At Month 17: paid 17 EMIs, remaining = 20 - 17 = 3 EMIs (3 * 4050 = 12,150)
      // e.g. At Month 18: paid 18 EMIs, remaining = 20 - 18 = 2 EMIs (2 * 4050 = 8,100)
      refOldEmisRemaining = Math.max(0, tenureMonths - m);
      refOldSettledPerPerson = refOldEmisRemaining * monthlyEmi;
      refNetInHandPerPerson = refSanctionedPerPerson - refFileChargePerPerson - refOldSettledPerPerson;
      refTotalNetRequired = refBorrowers * refNetInHandPerPerson;

      refMaxAffordable = refNetInHandPerPerson > 0 ? Math.floor(pool / refNetInHandPerPerson) : 0;
      refIsDeficit = refTotalNetRequired > pool;
      refDeficitAmount = Math.max(0, refTotalNetRequired - pool);

      refFileChargesTotal = refBorrowers * refFileChargePerPerson;
      refOldSettledTotal = refBorrowers * refOldSettledPerPerson;

      if (!refIsDeficit) {
        // Disburse refinancing loans
        pool -= refTotalNetRequired;
        newDisbursedInHand += refTotalNetRequired;
        newFileChargesEarned += refFileChargesTotal;
        cumulativeDisbursed += refTotalNetRequired;

        // Deduct refinanced borrowers from initial cohort
        const initialCohort = cohorts.find((c) => c.isInitial);
        if (initialCohort) {
          initialCohort.count = Math.max(0, initialCohort.count - refBorrowers);
        }

        // Add refinanced cohort (starts paying next month)
        cohorts.push({
          count: refBorrowers,
          monthsLeft: refTenure,
          emi: refEmi,
          principal: refSanctionedPerPerson,
          isInitial: false,
        });
      } else {
        // In deficit scenario: disburse up to maxAffordable
        const affordableCount = Math.min(refBorrowers, refMaxAffordable);
        if (affordableCount > 0) {
          const disbursed = affordableCount * refNetInHandPerPerson;
          pool -= disbursed;
          newDisbursedInHand += disbursed;
          const fee = affordableCount * refFileChargePerPerson;
          newFileChargesEarned += fee;
          cumulativeDisbursed += disbursed;

          const initialCohort = cohorts.find((c) => c.isInitial);
          if (initialCohort) {
            initialCohort.count = Math.max(0, initialCohort.count - affordableCount);
          }

          cohorts.push({
            count: affordableCount,
            monthsLeft: refTenure,
            emi: refEmi,
            principal: refSanctionedPerPerson,
            isInitial: false,
          });
        }
      }
    }

    // 4. Calculate how many regular 60,000 loans can be funded with remaining pool
    if (pool >= inHandRequired) {
      newLoansFunded = Math.floor(pool / inHandRequired);
      const regularDisbursed = newLoansFunded * inHandRequired;
      const regularFees = newLoansFunded * fileCharge;

      newDisbursedInHand += regularDisbursed;
      newFileChargesEarned += regularFees;
      pool -= regularDisbursed;
      cumulativeDisbursed += regularDisbursed;

      if (newLoansFunded > 0) {
        cohorts.push({
          count: newLoansFunded,
          monthsLeft: tenureMonths,
          emi: monthlyEmi,
          principal: sanctionedAmount,
          isInitial: false,
        });
      }
    }

    if (reinvestFileCharges && newFileChargesEarned > 0) {
      pool += newFileChargesEarned;
      const extraLoans = Math.floor(pool / inHandRequired);
      if (extraLoans > 0) {
        const extraDisbursed = extraLoans * inHandRequired;
        const extraFees = extraLoans * fileCharge;
        newLoansFunded += extraLoans;
        newDisbursedInHand += extraDisbursed;
        newFileChargesEarned += extraFees;
        pool -= extraDisbursed;
        cumulativeDisbursed += extraDisbursed;

        cohorts.push({
          count: extraLoans,
          monthsLeft: tenureMonths,
          emi: monthlyEmi,
          principal: sanctionedAmount,
          isInitial: false,
        });
      }
    }

    surplus = pool;
    cumulativeFileCharges += newFileChargesEarned;

    // Filter finished loans whose tenure has expired
    cohorts = cohorts.filter((c) => c.monthsLeft > 0 && c.count > 0);

    const nextMonthActiveLoans = cohorts.reduce((acc, c) => acc + c.count, 0);

    // Total future cash to be collected from all active loans in the market
    const marketOutstandingCash = cohorts.reduce((acc, c) => acc + c.count * c.monthsLeft * c.emi, 0);

    // Total active loan principal deployed in the market
    const activeCapitalDeployed = cohorts.reduce((acc, c) => acc + c.count * c.principal, 0);

    // Repayment value injected into the market this month
    const actualRefBorrowers = refinanceTriggered 
      ? (!refIsDeficit ? refBorrowers : Math.min(refBorrowers, refMaxAffordable)) 
      : 0;
    const refMarketEmi = currentMonthRefinance?.monthlyEmi ?? refinanceMonthlyEmi;
    const refMarketTenure = currentMonthRefinance?.tenureMonths ?? refinanceTenureMonths;
    const refMarketValue = actualRefBorrowers * refMarketEmi * refMarketTenure;
    const regMarketValue = newLoansFunded * monthlyEmi * tenureMonths;
    const newLoansMarketValue = refMarketValue + regMarketValue;

    let newLoansMarketBreakdown = '';
    if (actualRefBorrowers > 0 && newLoansFunded > 0) {
      newLoansMarketBreakdown = `${actualRefBorrowers} Renewed (${actualRefBorrowers}×₹${refMarketEmi.toLocaleString('en-IN')}×${refMarketTenure}m = ₹${refMarketValue.toLocaleString('en-IN')}) + ${newLoansFunded} New (${newLoansFunded}×₹${monthlyEmi.toLocaleString('en-IN')}×${tenureMonths}m = ₹${regMarketValue.toLocaleString('en-IN')})`;
    } else if (actualRefBorrowers > 0) {
      newLoansMarketBreakdown = `${actualRefBorrowers} Renewed (${actualRefBorrowers} × ₹${refMarketEmi.toLocaleString('en-IN')} × ${refMarketTenure}m = ₹${refMarketValue.toLocaleString('en-IN')})`;
    } else if (newLoansFunded > 0) {
      newLoansMarketBreakdown = `${newLoansFunded} Loans (${newLoansFunded} × ₹${monthlyEmi.toLocaleString('en-IN')} × ${tenureMonths}m = ₹${regMarketValue.toLocaleString('en-IN')})`;
    } else {
      newLoansMarketBreakdown = 'No new loans';
    }

    results.push({
      month: m,
      dateStr,
      activePayingLoans,
      emiCollected,
      availablePool: surplusBefore + emiCollected,
      surplusBefore,
      newLoansFunded,
      newDisbursedInHand,
      newFileChargesEarned,
      surplusRemaining: surplus,
      nextMonthActiveLoans,
      cumulativeCollected,
      cumulativeDisbursed,
      cumulativeFileCharges,
      // Market metrics
      marketOutstandingCash,
      activeCapitalDeployed,
      newLoansMarketValue,
      newLoansMarketBreakdown,
      // Refinance data
      refinanceTriggered,
      refinanceBorrowers: refBorrowers,
      refinanceSanctionedPerPerson: refSanctionedPerPerson,
      refinanceFileChargePerPerson: refFileChargePerPerson,
      refinanceOldEmisRemaining: refOldEmisRemaining,
      refinanceOldSettledPerPerson: refOldSettledPerPerson,
      refinanceNetInHandPerPerson: refNetInHandPerPerson,
      refinanceTotalNetRequired: refTotalNetRequired,
      refinanceIsDeficit: refIsDeficit,
      refinanceDeficitAmount: refDeficitAmount,
      refinanceMaxAffordable: refMaxAffordable,
      refinanceFileChargesTotal: refFileChargesTotal,
      refinanceOldSettledTotal: refOldSettledTotal,
    });
  }

  return results;
}
