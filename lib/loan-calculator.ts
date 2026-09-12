import { InterestCalculationType, RepaymentFrequency } from './types';

export interface CalculationParams {
  principal: number;
  interestRate: number; // in percentage e.g. 2 for 2% monthly or 24 for 24% annual
  rateType: 'monthly' | 'annual';
  calculationType: InterestCalculationType;
  frequency: RepaymentFrequency;
  tenureValue: number;
  tenureUnit: 'months' | 'weeks' | 'days';
  firstPaymentDate: string; // YYYY-MM-DD
}

export interface CalculatedScheduleItem {
  installmentNumber: number;
  dueDate: string;
  principalDue: number;
  interestDue: number;
  totalDue: number;
  remainingBalance: number;
}

export interface LoanCalculationResult {
  principal: number;
  totalInterest: number;
  totalPayable: number;
  installmentAmount: number; // Regular installment amount
  numberOfInstallments: number;
  schedule: CalculatedScheduleItem[];
}

export function calculateLoan(params: CalculationParams): LoanCalculationResult {
  const {
    principal,
    interestRate,
    rateType,
    calculationType,
    frequency,
    tenureValue,
    tenureUnit,
    firstPaymentDate
  } = params;

  // 1. Determine number of installments
  let numberOfInstallments = tenureValue;
  if (tenureUnit === 'months') {
    if (frequency === 'monthly') numberOfInstallments = tenureValue;
    else if (frequency === 'biweekly') numberOfInstallments = tenureValue * 2;
    else if (frequency === 'weekly') numberOfInstallments = Math.round(tenureValue * 4.33);
    else if (frequency === 'daily') numberOfInstallments = tenureValue * 30;
  } else if (tenureUnit === 'weeks') {
    if (frequency === 'weekly') numberOfInstallments = tenureValue;
    else if (frequency === 'biweekly') numberOfInstallments = Math.ceil(tenureValue / 2);
    else if (frequency === 'daily') numberOfInstallments = tenureValue * 7;
    else if (frequency === 'monthly') numberOfInstallments = Math.ceil(tenureValue / 4.33);
  } else if (tenureUnit === 'days') {
    if (frequency === 'daily') numberOfInstallments = tenureValue;
    else if (frequency === 'weekly') numberOfInstallments = Math.ceil(tenureValue / 7);
    else if (frequency === 'monthly') numberOfInstallments = Math.ceil(tenureValue / 30);
  }

  if (numberOfInstallments < 1) numberOfInstallments = 1;

  // 2. Determine periodic interest rate
  // Convert interest rate to effective periodic decimal rate
  const annualRate = rateType === 'annual' ? interestRate : interestRate * 12;
  let periodicRate = 0;
  if (frequency === 'monthly') {
    periodicRate = (annualRate / 100) / 12;
  } else if (frequency === 'biweekly') {
    periodicRate = (annualRate / 100) / 26;
  } else if (frequency === 'weekly') {
    periodicRate = (annualRate / 100) / 52;
  } else if (frequency === 'daily') {
    periodicRate = (annualRate / 100) / 365;
  }

  const schedule: CalculatedScheduleItem[] = [];
  let totalInterest = 0;
  let totalPayable = 0;
  let regularInstallment = 0;

  // Helper to increment date by installment frequency
  const getDueDate = (startDateStr: string, index: number): string => {
    const d = new Date(startDateStr);
    if (frequency === 'monthly') {
      d.setMonth(d.getMonth() + index);
    } else if (frequency === 'biweekly') {
      d.setDate(d.getDate() + (index * 14));
    } else if (frequency === 'weekly') {
      d.setDate(d.getDate() + (index * 7));
    } else if (frequency === 'daily') {
      d.setDate(d.getDate() + index);
    }
    return d.toISOString().split('T')[0];
  };

  if (calculationType === 'flat') {
    // Flat Rate Interest:
    // Total interest = Principal * periodicRate * numberOfInstallments
    totalInterest = Math.round(principal * periodicRate * numberOfInstallments);
    totalPayable = principal + totalInterest;
    
    const basePrincipalPerInstallment = Math.floor(principal / numberOfInstallments);
    const baseInterestPerInstallment = Math.floor(totalInterest / numberOfInstallments);
    
    const principalRemainder = principal - (basePrincipalPerInstallment * numberOfInstallments);
    const interestRemainder = totalInterest - (baseInterestPerInstallment * numberOfInstallments);

    let remaining = totalPayable;

    for (let i = 0; i < numberOfInstallments; i++) {
      const pDue = basePrincipalPerInstallment + (i === numberOfInstallments - 1 ? principalRemainder : 0);
      const iDue = baseInterestPerInstallment + (i === numberOfInstallments - 1 ? interestRemainder : 0);
      const tDue = pDue + iDue;
      remaining -= tDue;

      schedule.push({
        installmentNumber: i + 1,
        dueDate: getDueDate(firstPaymentDate, i),
        principalDue: pDue,
        interestDue: iDue,
        totalDue: tDue,
        remainingBalance: Math.max(0, remaining),
      });
    }

    regularInstallment = schedule[0]?.totalDue || 0;

  } else if (calculationType === 'reducing') {
    // Reducing Balance (Standard EMI)
    const n = numberOfInstallments;
    const r = periodicRate;

    if (r === 0) {
      // 0% interest
      const pDue = Math.round(principal / n);
      totalPayable = principal;
      totalInterest = 0;
      let remaining = principal;

      for (let i = 0; i < n; i++) {
        const thisP = i === n - 1 ? remaining : pDue;
        remaining -= thisP;
        schedule.push({
          installmentNumber: i + 1,
          dueDate: getDueDate(firstPaymentDate, i),
          principalDue: thisP,
          interestDue: 0,
          totalDue: thisP,
          remainingBalance: Math.max(0, remaining),
        });
      }
      regularInstallment = pDue;
    } else {
      // EMI = P * r * (1+r)^n / ((1+r)^n - 1)
      const emiFactor = Math.pow(1 + r, n);
      const emiExact = (principal * r * emiFactor) / (emiFactor - 1);
      const emi = Math.round(emiExact);

      let remainingPrincipal = principal;
      totalInterest = 0;

      for (let i = 0; i < n; i++) {
        const interestForPeriod = Math.round(remainingPrincipal * r);
        let principalForPeriod = emi - interestForPeriod;

        if (i === n - 1 || remainingPrincipal - principalForPeriod <= 0) {
          // Final installment adjustment
          principalForPeriod = remainingPrincipal;
        }

        const totalThis = principalForPeriod + interestForPeriod;
        remainingPrincipal -= principalForPeriod;
        totalInterest += interestForPeriod;

        schedule.push({
          installmentNumber: i + 1,
          dueDate: getDueDate(firstPaymentDate, i),
          principalDue: principalForPeriod,
          interestDue: interestForPeriod,
          totalDue: totalThis,
          remainingBalance: Math.max(0, remainingPrincipal),
        });
      }

      totalPayable = principal + totalInterest;
      regularInstallment = emi;
    }

  } else if (calculationType === 'interest_only') {
    // Borrower pays periodic interest, full principal due at the end
    const periodicInterest = Math.round(principal * periodicRate);
    totalInterest = periodicInterest * numberOfInstallments;
    totalPayable = principal + totalInterest;
    regularInstallment = periodicInterest;

    let remainingPrincipal = principal;

    for (let i = 0; i < numberOfInstallments; i++) {
      const isLast = i === numberOfInstallments - 1;
      const pDue = isLast ? principal : 0;
      const iDue = periodicInterest;
      const tDue = pDue + iDue;

      if (isLast) remainingPrincipal = 0;

      schedule.push({
        installmentNumber: i + 1,
        dueDate: getDueDate(firstPaymentDate, i),
        principalDue: pDue,
        interestDue: iDue,
        totalDue: tDue,
        remainingBalance: remainingPrincipal,
      });
    }
  }

  return {
    principal,
    totalInterest,
    totalPayable,
    installmentAmount: regularInstallment,
    numberOfInstallments,
    schedule,
  };
}
