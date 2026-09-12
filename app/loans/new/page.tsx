'use client';

import React, { useState, useEffect, useContext, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Landmark, 
  UserPlus, 
  Calendar, 
  DollarSign, 
  Percent, 
  Shield, 
  Check, 
  AlertCircle, 
  Info,
  ChevronRight,
  Calculator
} from 'lucide-react';
import { Customer, InterestCalculationType, RepaymentFrequency, Settings } from '@/lib/types';
import { calculateLoan, LoanCalculationResult } from '@/lib/loan-calculator';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CustomerModal } from '@/components/customers/CustomerModal';
import { PaymentContext } from '@/components/AppLayout';

function NewLoanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCustomerId = searchParams.get('customer_id');

  const { settings } = useContext(PaymentContext);
  const currency = settings?.currency || '₹';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(preselectedCustomerId || '');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Loan parameters
  const [principal, setPrincipal] = useState<string>('50000');
  const [calculationType, setCalculationType] = useState<InterestCalculationType>('flat');
  const [interestRate, setInterestRate] = useState<string>('2'); // 2%
  const [rateType, setRateType] = useState<'monthly' | 'annual'>('monthly');
  const [frequency, setFrequency] = useState<RepaymentFrequency>('monthly');
  const [tenureValue, setTenureValue] = useState<string>('6');
  const [tenureUnit, setTenureUnit] = useState<'months' | 'weeks' | 'days'>('months');
  
  const today = new Date().toISOString().split('T')[0];
  const [disbursalDate, setDisbursalDate] = useState<string>(today);

  // Calculate default next payment date (1 month or 1 week ahead)
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

  const [processingFee, setProcessingFee] = useState<string>('1000');
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

  // Compute live calculation result
  const calculationResult: LoanCalculationResult | null = useMemo(() => {
    const p = parseFloat(principal);
    const r = parseFloat(interestRate);
    const t = parseInt(tenureValue, 10);

    if (isNaN(p) || p <= 0 || isNaN(r) || isNaN(t) || t <= 0) return null;

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
  }, [principal, interestRate, rateType, calculationType, frequency, tenureValue, tenureUnit, firstPaymentDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedCustomerId) {
      setError('Please select or create a borrower.');
      return;
    }

    const p = parseFloat(principal);
    if (!p || p <= 0) {
      setError('Principal amount must be greater than 0.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: Number(selectedCustomerId),
          principal: p,
          interest_rate: parseFloat(interestRate) || 0,
          rate_type: rateType,
          calculation_type: calculationType,
          frequency,
          tenure_value: parseInt(tenureValue, 10),
          tenure_unit: tenureUnit,
          disbursal_date: disbursalDate,
          first_payment_date: firstPaymentDate,
          processing_fee: parseFloat(processingFee) || 0,
          collateral_details: collateralDetails,
          notes,
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
    <div className="space-y-6">
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
            <h1 className="text-2xl font-extrabold text-slate-900">Disburse New Loan</h1>
            <p className="text-xs text-slate-500">Configure interest scheme, generate repayment schedule, and disburse</p>
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

          {/* Step 2: Loan Financial Terms */}
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span className="h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">2</span>
              <span>Loan Amount & Calculation Scheme</span>
            </label>

            {/* Scheme Selector Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Flat Rate */}
              <div
                onClick={() => setCalculationType('flat')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                  calculationType === 'flat'
                    ? 'border-indigo-600 bg-indigo-50/40 text-indigo-950 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <p className="font-bold text-xs">Flat Rate (Simple)</p>
                  {calculationType === 'flat' && <Check className="h-4 w-4 text-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Fixed interest charged on the initial principal throughout tenure. Most popular in money lending.
                </p>
              </div>

              {/* Reducing Balance */}
              <div
                onClick={() => setCalculationType('reducing')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                  calculationType === 'reducing'
                    ? 'border-indigo-600 bg-indigo-50/40 text-indigo-950 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <p className="font-bold text-xs">Reducing Balance (EMI)</p>
                  {calculationType === 'reducing' && <Check className="h-4 w-4 text-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Standard amortized banking EMI where interest decreases as principal is gradually repaid.
                </p>
              </div>

              {/* Interest Only */}
              <div
                onClick={() => setCalculationType('interest_only')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                  calculationType === 'interest_only'
                    ? 'border-indigo-600 bg-indigo-50/40 text-indigo-950 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <p className="font-bold text-xs">Interest-Only (Bullet)</p>
                  {calculationType === 'interest_only' && <Check className="h-4 w-4 text-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Borrower pays only interest periodically; entire principal is paid at maturity or closing.
                </p>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {/* Principal */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Principal Amount ({currency}) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">{currency}</span>
                  <input
                    type="number"
                    step="any"
                    value={principal}
                    onChange={(e) => setPrincipal(e.target.value)}
                    placeholder="50000"
                    className="w-full pl-8 pr-3 py-2.5 text-xs font-bold text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Interest Rate & Period */}
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
                    placeholder="2"
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

              {/* Tenure */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Loan Tenure <span className="text-rose-500">*</span>
                </label>
                <div className="flex">
                  <input
                    type="number"
                    value={tenureValue}
                    onChange={(e) => setTenureValue(e.target.value)}
                    placeholder="6"
                    className="w-full rounded-l-xl border border-r-0 border-slate-200 p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                  <select
                    value={tenureUnit}
                    onChange={(e) => setTenureUnit(e.target.value as any)}
                    className="rounded-r-xl border border-slate-200 bg-slate-50 px-2.5 text-[11px] font-semibold text-slate-700 focus:outline-none capitalize"
                  >
                    <option value="months">Months</option>
                    <option value="weeks">Weeks</option>
                    <option value="days">Days</option>
                  </select>
                </div>
              </div>

              {/* Repayment Frequency */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Repayment Frequency
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none capitalize"
                >
                  <option value="monthly">Monthly</option>
                  <option value="biweekly">Every 2 Weeks (Bi-weekly)</option>
                  <option value="weekly">Weekly</option>
                  <option value="daily">Daily</option>
                </select>
              </div>
            </div>

            {/* Dates & Fees Grid */}
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
                <input
                  type="number"
                  step="any"
                  value={processingFee}
                  onChange={(e) => setProcessingFee(e.target.value)}
                  placeholder="5000"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Net in-hand: <span className="font-bold text-emerald-700">{formatCurrency(Math.max(0, (parseFloat(principal) || 0) - (parseFloat(processingFee) || 0)), currency)}</span>
                </p>
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
                  placeholder="e.g. 15g Gold Ring / Original Property Registry / Signed PDC Cheque"
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
                  placeholder="e.g. Stock purchase for retail shop expansion"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Step 3: Real-Time Amortization & Repayment Preview */}
          {calculationResult && (
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span className="h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">3</span>
                  <span>Calculated Repayment Summary & Schedule</span>
                </label>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                  {calculationResult.numberOfInstallments} Installments
                </span>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Principal Lent</p>
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
                  <p className="text-[10px] uppercase font-bold text-slate-400">Total Payable</p>
                  <p className="text-base font-extrabold text-slate-900 mt-0.5">
                    {formatCurrency(calculationResult.totalPayable, currency)}
                  </p>
                </div>

                <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100">
                  <p className="text-[10px] uppercase font-bold text-indigo-600">Installment Due</p>
                  <p className="text-base font-extrabold text-indigo-700 mt-0.5">
                    {formatCurrency(calculationResult.installmentAmount, currency)}
                    <span className="text-[10px] font-normal text-indigo-500"> / {frequency}</span>
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
                        <td className="py-2 px-3 font-semibold text-slate-500">{item.installmentNumber}</td>
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
                  <span>Confirm & Disburse Loan</span>
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
