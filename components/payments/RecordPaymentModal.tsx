'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, CreditCard, Landmark, AlertCircle } from 'lucide-react';
import { Loan, Payment, Settings } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import confetti from 'canvas-confetti';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedLoan?: Loan | null;
  settings?: Settings | null;
  onPaymentSuccess?: (payment: Payment, updatedLoan: Loan) => void;
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  preselectedLoan,
  settings,
  onPaymentSuccess,
}: RecordPaymentModalProps) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [selectedLoanId, setSelectedLoanId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'other'>('upi');
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [penalty, setPenalty] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currency = settings?.currency || '₹';

  // Fetch active loans if not preselected
  useEffect(() => {
    if (isOpen) {
      if (preselectedLoan) {
        setSelectedLoanId(String(preselectedLoan.id));
        // Find next due amount if any or standard installment
        const suggested = preselectedLoan.balance > 0 ? Math.min(preselectedLoan.balance, Math.round(preselectedLoan.total_payable / (preselectedLoan.tenure_value || 1))) : 0;
        setAmount(String(suggested || preselectedLoan.balance));
      } else {
        fetch('/api/loans?status=active')
          .then((res) => res.json())
          .then((res) => {
            if (res.success) {
              setLoans(res.data);
              if (res.data.length > 0) {
                setSelectedLoanId(String(res.data[0].id));
                const first = res.data[0];
                const suggested = first.balance > 0 ? Math.min(first.balance, Math.round(first.total_payable / (first.tenure_value || 1))) : 0;
                setAmount(String(suggested || first.balance));
              }
            }
          })
          .catch((err) => console.error(err));
      }
    }
  }, [isOpen, preselectedLoan]);

  const activeLoan = preselectedLoan || loans.find((l) => String(l.id) === selectedLoanId);

  const handleSelectLoan = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedLoanId(id);
    const found = loans.find((l) => String(l.id) === id);
    if (found) {
      const suggested = found.balance > 0 ? Math.min(found.balance, Math.round(found.total_payable / (found.tenure_value || 1))) : 0;
      setAmount(String(suggested || found.balance));
    }
  };

  const handleSetFullBalance = () => {
    if (activeLoan) {
      setAmount(String(activeLoan.balance));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Please enter a valid payment amount greater than 0.');
      return;
    }

    if (!selectedLoanId) {
      setError('Please select a loan to record payment for.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loan_id: Number(selectedLoanId),
          amount: parsedAmount,
          payment_date: paymentDate,
          payment_method: paymentMethod,
          reference_no: referenceNo,
          notes: notes,
          penalty: parseFloat(penalty) || 0,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to record payment');
      }

      // Check if loan was completely settled
      if (data.data.loan.balance <= 0) {
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch {
          // ignore if canvas-confetti fails
        }
      }

      if (onPaymentSuccess) {
        onPaymentSuccess(data.data.payment, data.data.loan);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Record Repayment</h3>
              <p className="text-xs text-slate-500">Collect loan installment or custom payment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Select Loan if not preselected */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Loan & Borrower
            </label>
            {preselectedLoan ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <p className="font-bold text-slate-900">{preselectedLoan.loan_code} - {preselectedLoan.customer_name}</p>
                <p className="text-slate-500 mt-0.5">Principal: {formatCurrency(preselectedLoan.principal, currency)} | Balance: <span className="font-semibold text-emerald-700">{formatCurrency(preselectedLoan.balance, currency)}</span></p>
              </div>
            ) : (
              <select
                value={selectedLoanId}
                onChange={handleSelectLoan}
                className="w-full text-xs font-medium border border-slate-200 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              >
                {loans.length === 0 ? (
                  <option value="">No active loans found</option>
                ) : (
                  loans.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.loan_code} — {l.customer_name} (Bal: {formatCurrency(l.balance, currency)})
                    </option>
                  ))
                )}
              </select>
            )}
          </div>

          {/* Amount & Balance Preview */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Amount Received ({currency})
              </label>
              {activeLoan && activeLoan.balance > 0 && (
                <button
                  type="button"
                  onClick={handleSetFullBalance}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold underline"
                >
                  Pay Full Balance ({formatCurrency(activeLoan.balance, currency)})
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                {currency}
              </span>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-2.5 text-base font-bold text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Payment Method & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Payment Mode
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none capitalize font-medium"
              >
                <option value="upi">UPI / GPay / PhonePe</option>
                <option value="cash">Cash in Hand</option>
                <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="cheque">Cheque</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Payment Date
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Reference No & Penalty */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Ref / Txn / Cheque No.
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="e.g. UPI-98124 or CHQ-001"
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Late Fee / Penalty ({currency})
              </label>
              <input
                type="number"
                step="any"
                value={penalty}
                onChange={(e) => setPenalty(e.target.value)}
                placeholder="0"
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Remarks / Collection Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Month 2 EMI received on time"
              className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-700/20 transition active:scale-95"
            >
              {loading ? (
                <span>Recording...</span>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Collect & Generate Receipt</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
