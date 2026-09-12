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

export interface SimulationConfig {
  initialLoans?: number;
  sanctionedAmount?: number;
  fileCharge?: number;
  monthlyEmi?: number;
  tenureMonths?: number;
  totalMonths?: number;
  startDate?: string;
  reinvestFileCharges?: boolean;

  // Refinancing Configuration
  refinanceEnabled?: boolean;
  refinanceAtMonth?: number;
  refinanceCount?: number;
  refinanceSanctioned?: number;
  refinanceFileCharge?: number;
  refinanceMonthlyEmi?: number;
  refinanceTenureMonths?: number;
}

interface LoanCohort {
  count: number;
  monthsLeft: number;
  emi: number;
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

  // Refinancing parameters
  const refinanceEnabled = config?.refinanceEnabled ?? true;
  const refinanceAtMonth = config?.refinanceAtMonth ?? 16;
  const refinanceCount = config?.refinanceCount ?? 8;
  const refinanceSanctioned = config?.refinanceSanctioned ?? 80000;
  const refinanceFileCharge = config?.refinanceFileCharge ?? 6000;
  const refinanceMonthlyEmi = config?.refinanceMonthlyEmi ?? 4050;
  const refinanceTenureMonths = config?.refinanceTenureMonths ?? 30;

  // Active loan cohorts: tracks count, months remaining, and EMI
  let cohorts: LoanCohort[] = [
    { count: initialLoans, monthsLeft: tenureMonths, emi: monthlyEmi, isInitial: true }
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

    // Check if this month is the refinancing month
    if (refinanceEnabled && m === refinanceAtMonth) {
      refinanceTriggered = true;
      refBorrowers = refinanceCount;

      // Calculate remaining EMIs for the initial base cohort
      // At Month 16, they have paid 16 EMIs. Remaining = 20 - 16 = 4 EMIs.
      refOldEmisRemaining = Math.max(0, tenureMonths - m);
      refOldSettledPerPerson = refOldEmisRemaining * monthlyEmi; // 4 * 4050 = 16,200
      refNetInHandPerPerson = refSanctionedPerPerson - refFileChargePerPerson - refOldSettledPerPerson; // 80000 - 6000 - 16200 = 57,800
      refTotalNetRequired = refBorrowers * refNetInHandPerPerson; // e.g. 8 * 57800 = 462,400

      refMaxAffordable = refNetInHandPerPerson > 0 ? Math.floor(pool / refNetInHandPerPerson) : 0;
      refIsDeficit = refTotalNetRequired > pool;
      refDeficitAmount = Math.max(0, refTotalNetRequired - pool);

      refFileChargesTotal = refBorrowers * refFileChargePerPerson;
      refOldSettledTotal = refBorrowers * refOldSettledPerPerson;

      if (!refIsDeficit) {
        // Disburse refinancing loans
        pool -= refTotalNetRequired;
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
          monthsLeft: refinanceTenureMonths,
          emi: refinanceMonthlyEmi,
          isInitial: false,
        });
      } else {
        // In deficit scenario: simulation can disburse up to maxAffordable,
        // or record the deficit so the user can adjust in UI.
        const affordableCount = Math.min(refBorrowers, refMaxAffordable);
        if (affordableCount > 0) {
          const disbursed = affordableCount * refNetInHandPerPerson;
          pool -= disbursed;
          const fee = affordableCount * refFileChargePerPerson;
          newFileChargesEarned += fee;
          cumulativeDisbursed += disbursed;

          const initialCohort = cohorts.find((c) => c.isInitial);
          if (initialCohort) {
            initialCohort.count = Math.max(0, initialCohort.count - affordableCount);
          }

          cohorts.push({
            count: affordableCount,
            monthsLeft: refinanceTenureMonths,
            emi: refinanceMonthlyEmi,
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
          isInitial: false,
        });
      }
    }

    surplus = pool;
    cumulativeFileCharges += newFileChargesEarned;

    // 5. Age cohorts & remove finished loans
    for (const c of cohorts) {
      c.monthsLeft--;
    }
    cohorts = cohorts.filter((c) => c.monthsLeft > 0 && c.count > 0);

    const nextMonthActiveLoans = cohorts.reduce((acc, c) => acc + c.count, 0);

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
