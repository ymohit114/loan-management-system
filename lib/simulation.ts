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
}

export function generateSimulationData(config?: SimulationConfig): SimulationMonthData[] {
  const initialLoans = config?.initialLoans ?? 43;
  const sanctionedAmount = config?.sanctionedAmount ?? 60000;
  const fileCharge = config?.fileCharge ?? 5000;
  const inHandRequired = sanctionedAmount - fileCharge; // 55000
  const monthlyEmi = config?.monthlyEmi ?? 4050;
  const tenureMonths = config?.tenureMonths ?? 20;
  const totalMonths = config?.totalMonths ?? 20;
  const startDateStr = config?.startDate ?? new Date().toISOString().split('T')[0];
  const reinvestFileCharges = config?.reinvestFileCharges ?? false;

  // Active loan cohorts: each cohort tracks count and months remaining
  let cohorts: { count: number; monthsLeft: number }[] = [
    { count: initialLoans, monthsLeft: tenureMonths }
  ];

  let surplus = 0;
  let cumulativeCollected = 0;
  let cumulativeDisbursed = initialLoans * inHandRequired; // initial base deployed
  let cumulativeFileCharges = initialLoans * fileCharge; // initial base fee

  const results: SimulationMonthData[] = [];

  const startDate = new Date(startDateStr);

  for (let m = 1; m <= totalMonths; m++) {
    // Current date for this simulation month
    const currentDate = new Date(startDate);
    currentDate.setMonth(currentDate.getMonth() + m);
    const dateStr = currentDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    // 1. Active paying loans this month
    const activePayingLoans = cohorts.reduce((acc, c) => acc + c.count, 0);

    // 2. Total EMI collected this month (100% on-time assumption)
    const emiCollected = activePayingLoans * monthlyEmi;
    cumulativeCollected += emiCollected;

    // 3. Pool of cash available to lend
    const surplusBefore = surplus;
    let pool = surplusBefore + emiCollected;

    // 4. Calculate how many new 60,000 loans can be funded (requires 55,000 in-hand cash)
    let newLoansFunded = Math.floor(pool / inHandRequired);
    let newDisbursedInHand = newLoansFunded * inHandRequired;
    let newFileChargesEarned = newLoansFunded * fileCharge;

    if (reinvestFileCharges && newFileChargesEarned > 0) {
      // If reinvesting file charges into lending pool
      pool += newFileChargesEarned;
      newLoansFunded = Math.floor(pool / inHandRequired);
      newDisbursedInHand = newLoansFunded * inHandRequired;
      newFileChargesEarned = newLoansFunded * fileCharge;
    }

    surplus = pool - newDisbursedInHand;

    cumulativeDisbursed += newDisbursedInHand;
    cumulativeFileCharges += newFileChargesEarned;

    // 5. Age cohorts & remove finished loans
    for (const c of cohorts) {
      c.monthsLeft--;
    }
    cohorts = cohorts.filter((c) => c.monthsLeft > 0);

    // 6. Add newly funded loans cohort (they will start paying next month)
    if (newLoansFunded > 0) {
      cohorts.push({ count: newLoansFunded, monthsLeft: tenureMonths });
    }

    const nextMonthActiveLoans = cohorts.reduce((acc, c) => acc + c.count, 0);

    results.push({
      month: m,
      dateStr,
      activePayingLoans,
      emiCollected,
      availablePool: pool,
      surplusBefore,
      newLoansFunded,
      newDisbursedInHand,
      newFileChargesEarned,
      surplusRemaining: surplus,
      nextMonthActiveLoans,
      cumulativeCollected,
      cumulativeDisbursed,
      cumulativeFileCharges,
    });
  }

  return results;
}
