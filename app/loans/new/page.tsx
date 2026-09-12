'use client';

import React, { useState, useEffect, useContext, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Landmark, 
  UserPlus, 
  Calendar, 
  Shield, 
  Check, 
  AlertCircle, 
  RefreshCw,
  Calculator,
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Customer, InterestCalculationType, RepaymentFrequency, Settings, Loan } from '@/lib/types';
import { calculateLoan, LoanCalculationResult } from '@/lib/loan-calculator';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CustomerModal } from '@/components/customers/CustomerModal';
import { PaymentContext } from '@/components/AppLayout';

function NewLoanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCustomerId = searchParams.get('customer_id');
  const preselectedSettleLoanId = searchParams.get('settle_loan_id');

  const { settings } = useContext(PaymentContext);
  const currency = settings?.currency || '₹';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(preselectedCustomerId || '');
  const [customerActiveLoans, setCustomerActiveLoans] = useState<Loan[]>([]);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Top-Up / Settle Old Loan State
  const [shouldSettleOldLoan, setShouldSettleOldLoan] = useState<boolean>(Boolean(preselectedSettleLoanId));
  const [selectedSettleLoanId, setSelectedSettleLoanId] = useState<string>(preselectedSettleLoanId || '');
  const [settleAmount, setSettleAmount] = useState<string>('0');

  // Input Mode: 'by_rate' vs 'by_emi'
  const [inputMode, setInputMode] = useState<'by_rate' | 'by_emi'>('by_emi');
  const [customEmi, setCustomEmi] = useState<string>('4050');

  // Loan parameters
  const [principal, setPrincipal] = useState<string>('60000');
  const [calculationType, setCalculationType] = useState<InterestCalculationType>('flat');
  const [interestRate, setInterestRate] = useState<string>('1.75'); // 1.75% monthly
  const [rateType, setRateType] = useState<'monthly' | 'annual'>('monthly');
  const [frequency, setFrequency] = useState<RepaymentFrequency>('monthly');
  const [tenureValue, setTenureValue] = useState<string>('20');
  const [tenureUnit, setTenureUnit] = useState<'months' | 'weeks' | 'days'>('months');
  
  const today = new Date().toISOString().split('T')[0];
  const [disbursalDate, setDisbursalDate] = useState<string>(today);

  // Calculate default next payment date (1 month ahead)
  const defaultFirstPayment = useMemo(() => {
    const d = new Date(disbursalDate || today);
    if (frequency === 'monthly') d.setMonth(d.getMonth() + 1);
    else if (frequency === 'biweekly') d.setDate(d.getDate() + 14);
    else if (frequency === 'weekly') d.setDate(d.getDate() + 7);
    else if (frequency === 'daily') d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, [disbursalDate, frequency]);

  const [firstPaymentDate, setFirstPaymentDate] = useState<string>(defaultFirstPayment);

  useEffect(() => {
    setFirstPaymentDate(defaultFirstPayment);
  }, [defaultFirstPayment]);

  const [processingFee, setProcessingFee] = useState<string>('5000');
  const [collateralDetails, setCollateralDetails] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Customers list
  const fetchCustomers = () => {
    fetch('/api/customers')
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setCustomers(res.data);
          if (!selectedCustomerId && res.data.length > 0) {
            setSelectedCustomerId(String(res.data[0].id));
          }
        }
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Fetch active loans when borrower changes
  useEffect(() => {
    if (selectedCustomerId) {
      fetch(`/api/customers/${selectedCustomerId}`)
        .then((res) => res.json())
        .then((res) => {
          if (res.success && res.data?.loans) {
            const active = res.data.loans.filter((l: Loan) => l.balance > 0 && ['active', 'overdue'].includes(l.status));
            setCustomerActiveLoans(active);
            if (active.length > 0) {
              const defaultLoan = preselectedSettleLoanId 
                ? active.find((l: Loan) => String(l.id) === preselectedSettleLoanId) || active[0]
                : active[0];
              setSelectedSettleLoanId(String(defaultLoan.id));
              setSettleAmount(String(defaultLoan.balance));
              setShouldSettleOldLoan(true);
            } else {
              setSelectedSettleLoanId('');
              setSettleAmount('0');
              setShouldSettleOldLoan(false);
            }
          }
        })
        .catch((err) => console.error(err));
    } else {
      setCustomerActiveLoans([]);
      setSelectedSettleLoanId('');
      setSettleAmount('0');
      setShouldSettleOldLoan(false);
    }
  }, [selectedCustomerId, preselectedSettleLoanId]);

  // When selected settle loan changes, update settleAmount
  const handleSettleLoanSelect = (loanId: string) => {
    setSelectedSettleLoanId(loanId);
    const found = customerActiveLoans.find((l) => String(l.id) === loanId);
    if (found) {
      setSettleAmount(String(found.balance));
    }
  };

  // Sync EMI & Rate when in 'by_emi' mode
  useEffect(() => {
    if (inputMode === 'by_emi') {
      const p = parseFloat(principal);
      const emi = parseFloat(customEmi);
      const t = parseInt(tenureValue, 10);
      if (p > 0 && emi > 0 && t > 0) {
        const totalPay = emi * t;
        const totalInt = Math.max(0, totalPay - p);
        // Periodic monthly rate = (totalInt / p) / t * 100
        const monthlyRate = (totalInt / p / t) * 100;
        setInterestRate(monthlyRate.toFixed(2));
        setRateType('monthly');
      }
    }
  }, [inputMode, customEmi, principal, tenureValue]);

  // Compute live calculation result
  const calculationResult: LoanCalculationResult | null = useMemo(() => {
    const p = parseFloat(principal);
    const t = parseInt(tenureValue, 10);

    if (isNaN(p) || p <= 0 || isNaN(t) || t <= 0) return null;

    if (inputMode === 'by_emi') {
      const emi = parseFloat(customEmi);
      if (isNaN(emi) || emi <= 0) return null;

      const totalPayable = emi * t;
      const totalInterest = Math.max(0, totalPayable - p);
      const pDue = Math.floor(p / t);
      const pRemainder = p - (pDue * t);
      const iDue = Math.floor(totalInterest / t);
      const iRemainder = totalInterest - (iDue * t);

      let remaining = totalPayable;
      const schedule = [];

      for (let i = 0; i < t; i++) {
        const thisP = pDue + (i === t - 1 ? pRemainder : 0);
        const thisI = iDue + (i === t - 1 ? iRemainder : 0);
        const thisT = thisP + thisI;
        remaining -= thisT;

        const d = new Date(firstPaymentDate || today);
        d.setMonth(d.getMonth() + i);

        schedule.push({
          installmentNumber: i + 1,
          dueDate: d.toISOString().split('T')[0],
          principalDue: thisP,
          interestDue: thisI,
          totalDue: thisT,
          remainingBalance: Math.max(0, remaining),
        });
      }

      return {
        principal: p,
        totalInterest,
        totalPayable,
        installmentAmount: emi,
        numberOfInstallments: t,
        schedule,
      };
    } else {
      const r = parseFloat(interestRate);
      if (isNaN(r) || r < 0) return null;
      try {
        return calculateLoan({
          principal: p,
          interestRate: r,
          rateType,
          calculationType,
          frequency,
          tenureValue: t,
          tenureUnit,
          firstPaymentDate,
        });
      } catch {
        return null;
      }
    }
  }, [inputMode, customEmi, principal, interestRate, rateType, calculationType, frequency, tenureValue, tenureUnit, firstPaymentDate]);

  // Financial Deductions Breakdown
  const principalAmount = parseFloat(principal) || 0;
  const feeAmount = parseFloat(processingFee) || 0;
  const oldLoanDeduction = shouldSettleOldLoan ? (parseFloat(settleAmount) || 0) : 0;
  const netInHandDisbursed = Math.max(0, principalAmount - feeAmount - oldLoanDeduction);

  const selectedOldLoan = customerActiveLoans.find((l) => String(l.id) === selectedSettleLoanId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedCustomerId) {
      setError('Please select or create a borrower.');
      return;
    }

    if (principalAmount <= 0) {
      setError('Principal amount must be greater than 0.');
      return;
    }

    if (shouldSettleOldLoan && oldLoanDeduction > principalAmount) {
      setError('Old loan settlement amount cannot be greater than the new loan principal.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: Number(selectedCustomerId),
          principal: principalAmount,
          interest_rate: parseFloat(interestRate) || 0,
          rate_type: rateType,
          calculation_type: calculationType,
          frequency,
          tenure_value: parseInt(tenureValue, 10),
          tenure_unit: tenureUnit,
          disbursal_date: disbursalDate,
          first_payment_date: firstPaymentDate,
          processing_fee: feeAmount,
          collateral_details: collateralDetails,
          notes: notes.trim(),
          settle_loan_id: shouldSettleOldLoan && selectedSettleLoanId ? Number(selectedSettleLoanId) : undefined,
          settle_amount: shouldSettleOldLoan ? oldLoanDeduction : undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to disburse loan');
      }

      router.push(`/loans/${data.data.id}`);
    } catch (err: any) {
      setError(err.message || 'Error disbursing loan');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerCreated = (newCust: Customer) => {
    setCustomers((prev) => [newCust, ...prev]);
    setSelectedCustomerId(String(newCust.id));
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back button & Title */}
      <div className="flex items-center justify-between">
        <Link
          href="/loans"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Loans</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 md:p-8">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5 mb-6">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              {shouldSettleOldLoan ? 'Top-Up & Renewal Loan' : 'Disburse New Loan'}
            </h1>
            <p className="text-xs text-slate-500">
              Configure loan amount, monthly EMI, deduct previous loan balance, and compute net in-hand
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Select Borrower */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">1</span>
                <span>Select Borrower (Customer)</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(true)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>+ Add New Borrower</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full text-xs font-medium border border-slate-200 rounded-xl p-3 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              >
                <option value="">-- Choose Borrower --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) - {c.id_type ? `${c.id_type}: ${c.id_number}` : 'No ID'}
                  </option>
                ))}
              </select>

              {/* Selected Customer Preview Card */}
              {selectedCustomerId && (
                <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs flex items-center justify-between">
                  {(() => {
                    const c = customers.find((item) => String(item.id) === selectedCustomerId);
                    if (!c) return null;
                    return (
                      <>
                        <div>
                          <p className="font-bold text-slate-900">{c.name}</p>
                          <p className="text-slate-500 text-[11px]">{c.phone} {c.address && `• ${c.address}`}</p>
                        </div>
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
                          {c.status}
                        </span>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Top-Up / Settle Old Loan Box (Appears when customer has an active unpaid loan) */}
          {customerActiveLoans.length > 0 && (
            <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                    <RefreshCw className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <span>Existing Active Loan Detected! (Top-Up / Renewal Available)</span>
                    </h3>
                    <p className="text-xs text-amber-900">
                      This customer has an active loan. You can automatically deduct their remaining balance from the new loan and close the old loan.
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-amber-300 shadow-sm shrink-0">
                  <input
                    type="checkbox"
                    checked={shouldSettleOldLoan}
                    onChange={(e) => setShouldSettleOldLoan(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <span className="text-xs font-bold text-slate-900">Deduct & Settle Old Loan</span>
                </label>
              </div>

              {shouldSettleOldLoan && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-amber-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Select Old Loan to Close
                    </label>
                    <select
                      value={selectedSettleLoanId}
                      onChange={(e) => handleSettleLoanSelect(e.target.value)}
                      className="w-full text-xs font-bold border border-amber-300 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      {customerActiveLoans.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.loan_code} — Remaining Bal: {formatCurrency(l.balance, currency)} (Sanctioned: {formatCurrency(l.principal, currency)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Deduction / Settlement Amount ({currency})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currency}</span>
                      <input
                        type="number"
                        step="any"
                        value={settleAmount}
                        onChange={(e) => setSettleAmount(e.target.value)}
                        placeholder="0"
                        className="w-full pl-8 pr-3 py-2 text-xs font-extrabold text-rose-700 border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                    {selectedOldLoan && (
                      <p className="text-[10px] text-amber-800 mt-1">
                        Full remaining balance on {selectedOldLoan.loan_code} is <b>{formatCurrency(selectedOldLoan.balance, currency)}</b>.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: New Loan Financial Terms & Custom EMI Mode */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">2</span>
                <span>New Loan Configuration & EMI Setting</span>
              </label>

              {/* Mode Switcher */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setInputMode('by_emi')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    inputMode === 'by_emi' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Set Custom EMI (₹) Directly
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('by_rate')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    inputMode === 'by_rate' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Calculate by Rate (%)
                </button>
              </div>
            </div>

            {/* Principal, Tenure & EMI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {/* Principal */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Sanctioned Loan ({currency}) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currency}</span>
                  <input
                    type="number"
                    step="any"
                    value={principal}
                    onChange={(e) => setPrincipal(e.target.value)}
                    placeholder="60000"
                    className="w-full pl-8 pr-3 py-2.5 text-xs font-extrabold text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Tenure (Months) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Tenure / Months <span className="text-rose-500">*</span>
                </label>
                <div className="flex">
                  <input
                    type="number"
                    value={tenureValue}
                    onChange={(e) => setTenureValue(e.target.value)}
                    placeholder="20"
                    className="w-full rounded-l-xl border border-r-0 border-slate-200 p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                  <span className="rounded-r-xl border border-slate-200 bg-slate-50 px-3 flex items-center text-xs font-semibold text-slate-600">
                    EMIs / Months
                  </span>
                </div>
              </div>

              {/* Monthly EMI Input (Mode: by_emi) or Interest Rate (Mode: by_rate) */}
              {inputMode === 'by_emi' ? (
                <div>
                  <label className="block text-xs font-semibold text-indigo-700 mb-1 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-indigo-600" />
                    <span>Monthly EMI Amount ({currency})</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 font-bold">{currency}</span>
                    <input
                      type="number"
                      step="any"
                      value={customEmi}
                      onChange={(e) => setCustomEmi(e.target.value)}
                      placeholder="4050"
                      className="w-full pl-8 pr-3 py-2.5 text-xs font-extrabold text-indigo-700 border-2 border-indigo-200 bg-indigo-50/30 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Effective rate: <span className="font-bold">{interestRate}% / month</span>
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Interest Rate (%) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex">
                    <input
                      type="number"
                      step="0.01"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      placeholder="1.75"
                      className="w-full rounded-l-xl border border-r-0 border-slate-200 p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      required
                    />
                    <select
                      value={rateType}
                      onChange={(e) => setRateType(e.target.value as any)}
                      className="rounded-r-xl border border-slate-200 bg-slate-50 px-2.5 text-[11px] font-semibold text-slate-700 focus:outline-none"
                    >
                      <option value="monthly">% / Month</option>
                      <option value="annual">% / Year</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Dates & File Charge */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Disbursal Date
                </label>
                <input
                  type="date"
                  value={disbursalDate}
                  onChange={(e) => setDisbursalDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  First Installment Date
                </label>
                <input
                  type="date"
                  value={firstPaymentDate}
                  onChange={(e) => setFirstPaymentDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  File Charge / Processing Fee ({currency})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currency}</span>
                  <input
                    type="number"
                    step="any"
                    value={processingFee}
                    onChange={(e) => setProcessingFee(e.target.value)}
                    placeholder="5000"
                    className="w-full pl-8 pr-3 py-2.5 text-xs font-medium text-slate-800 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Collateral & Remarks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Collateral / Security Details
                </label>
                <input
                  type="text"
                  value={collateralDetails}
                  onChange={(e) => setCollateralDetails(e.target.value)}
                  placeholder="e.g. Signed Promissory Note & Blank Cheque"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Loan Notes / Purpose
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Top-up personal loan"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Live In-Hand Disbursal Math Box */}
          <div className="p-5 bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-50 border-2 border-emerald-300 rounded-2xl shadow-sm space-y-3">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
              <Calculator className="h-4 w-4 text-emerald-700" />
              <span>Customer Disbursal & In-Hand Calculation</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Sanctioned Loan</span>
                <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
                  {formatCurrency(principalAmount, currency)}
                </span>
              </div>

              {shouldSettleOldLoan && (
                <div className="p-3 bg-white rounded-xl border border-rose-200">
                  <span className="text-[10px] uppercase font-bold text-rose-500 block">Old Loan Deducted</span>
                  <span className="text-base font-extrabold text-rose-600 mt-0.5 block">
                    -{formatCurrency(oldLoanDeduction, currency)}
                  </span>
                  <span className="text-[10px] text-slate-400">Previous balance cleared</span>
                </div>
              )}

              <div className="p-3 bg-white rounded-xl border border-rose-200">
                <span className="text-[10px] uppercase font-bold text-rose-500 block">File Charge Deducted</span>
                <span className="text-base font-extrabold text-rose-600 mt-0.5 block">
                  -{formatCurrency(feeAmount, currency)}
                </span>
                <span className="text-[10px] text-slate-400">Processing fee</span>
              </div>

              <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-md">
                <span className="text-[10px] uppercase font-bold text-emerald-100 block">Net In-Hand Disbursed</span>
                <span className="text-lg font-black text-white mt-0.5 block">
                  {formatCurrency(netInHandDisbursed, currency)}
                </span>
                <span className="text-[10px] text-emerald-100">Customer ko hath mein mila</span>
              </div>
            </div>
          </div>

          {/* Step 3: Real-Time Amortization & Repayment Preview */}
          {calculationResult && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span className="h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">3</span>
                  <span>New Repayment Schedule ({calculationResult.numberOfInstallments} Installments)</span>
                </label>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                  Monthly EMI: {formatCurrency(calculationResult.installmentAmount, currency)}
                </span>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Principal</p>
                  <p className="text-base font-extrabold text-slate-900 mt-0.5">
                    {formatCurrency(calculationResult.principal, currency)}
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Total Interest</p>
                  <p className="text-base font-extrabold text-emerald-700 mt-0.5">
                    +{formatCurrency(calculationResult.totalInterest, currency)}
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Total Repayable</p>
                  <p className="text-base font-extrabold text-slate-900 mt-0.5">
                    {formatCurrency(calculationResult.totalPayable, currency)}
                  </p>
                </div>

                <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100">
                  <p className="text-[10px] uppercase font-bold text-indigo-600">Fixed Monthly EMI</p>
                  <p className="text-base font-extrabold text-indigo-700 mt-0.5">
                    {formatCurrency(calculationResult.installmentAmount, currency)}
                    <span className="text-[10px] font-normal text-indigo-500"> / mo</span>
                  </p>
                </div>
              </div>

              {/* Schedule Table Preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold sticky top-0">
                    <tr>
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Due Date</th>
                      <th className="py-2 px-3">Principal Due</th>
                      <th className="py-2 px-3">Interest Due</th>
                      <th className="py-2 px-3">Total Installment</th>
                      <th className="py-2 px-3 text-right">Balance After</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {calculationResult.schedule.map((item) => (
                      <tr key={item.installmentNumber} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-slate-500">#{item.installmentNumber}</td>
                        <td className="py-2 px-3 font-medium text-slate-900">{formatDate(item.dueDate)}</td>
                        <td className="py-2 px-3 text-slate-600">{formatCurrency(item.principalDue, currency)}</td>
                        <td className="py-2 px-3 text-slate-600">{formatCurrency(item.interestDue, currency)}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{formatCurrency(item.totalDue, currency)}</td>
                        <td className="py-2 px-3 text-right font-medium text-slate-600">{formatCurrency(item.remainingBalance, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Link
              href="/loans"
              className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-700/20 transition active:scale-95"
            >
              {loading ? (
                <span>Disbursing Loan...</span>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>
                    {shouldSettleOldLoan ? 'Settle Old Loan & Disburse Top-Up' : 'Confirm & Disburse Loan'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Customer Modal to add borrower inline */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSuccess={handleCustomerCreated}
      />
    </div>
  );
}

export default function NewLoanPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading loan configurator...</div>}>
      <NewLoanContent />
    </Suspense>
  );
}
