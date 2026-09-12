'use client';

import React, { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Landmark, 
  User, 
  Phone, 
  Calendar, 
  CreditCard, 
  Printer, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Shield, 
  MessageCircle, 
  Receipt,
  FileText,
  RefreshCw
} from 'lucide-react';
import { Loan, Customer, ScheduleItem, Payment, Settings } from '@/lib/types';
import { formatCurrency, formatDate, generateWhatsAppReminderUrl } from '@/lib/utils';
import { PaymentContext } from '@/components/AppLayout';

export default function LoanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const loanId = params?.id as string;

  const { openRecordPayment, showReceipt, settings } = useContext(PaymentContext);
  const currency = settings?.currency || '₹';

  const [loan, setLoan] = useState<(Loan & { customer: Customer; schedule: ScheduleItem[]; payments: Payment[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'schedule' | 'payments'>('schedule');

  const fetchLoan = () => {
    setLoading(true);
    fetch(`/api/loans/${loanId}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setLoan(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (loanId) fetchLoan();
  }, [loanId]);

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading loan statement...</div>;
  }

  if (!loan) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        <p className="font-bold text-base text-slate-800">Loan account not found</p>
        <Link href="/loans" className="mt-3 inline-block text-indigo-600 font-semibold underline">
          Back to Loans
        </Link>
      </div>
    );
  }

  const progress = loan.total_payable > 0 ? Math.min(100, Math.round((loan.total_paid / loan.total_payable) * 100)) : 0;

  const handlePrintStatement = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Controls (hidden during print) */}
      <div className="flex items-center justify-between no-print">
        <Link
          href="/loans"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Loans</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handlePrintStatement}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition shadow-sm"
          >
            <Printer className="h-4 w-4 text-slate-500" />
            <span>Print</span>
          </button>

          {loan.status !== 'completed' && loan.balance > 0 && (
            <>
              <Link
                href={`/loans/new?customer_id=${loan.customer_id}&settle_loan_id=${loan.id}`}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Top-Up</span>
              </Link>
              <button
                onClick={() => openRecordPayment(loan)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95"
              >
                <CreditCard className="h-4 w-4" />
                <span>Collect Repayment</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Printable Statement Header & Branding (Official Statement View) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 md:p-8 print:p-0 print:border-none print-shadow-none">
        {/* Print only header */}
        <div className="hidden print:block border-b-2 border-slate-800 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{settings?.lender_name || 'Apex Financial Services'}</h2>
              <p className="text-xs text-slate-500">{settings?.address}</p>
              <p className="text-xs text-slate-500">Contact: {settings?.phone} | {settings?.email}</p>
            </div>
            <div className="text-right">
              <span className="inline-block bg-slate-100 text-slate-800 font-bold px-3 py-1 rounded text-xs uppercase">
                Official Loan Statement
              </span>
              <p className="text-xs font-bold mt-1">Loan Code: {loan.loan_code}</p>
              <p className="text-xs text-slate-500">Statement Date: {formatDate(new Date().toISOString())}</p>
            </div>
          </div>
        </div>

        {/* Loan Title & Meta */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900 font-mono">{loan.loan_code}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  loan.status === 'active'
                    ? 'bg-emerald-100 text-emerald-800'
                    : loan.status === 'completed'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {loan.status}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                {loan.calculation_type} Scheme
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Disbursed on {formatDate(loan.disbursal_date)} • First installment due {formatDate(loan.first_payment_date)}
            </p>
          </div>

          {/* Borrower mini card */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <User className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900">{loan.customer.name}</p>
              <p className="text-slate-500 text-[11px] flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span>{loan.customer.phone}</span>
              </p>
            </div>
            <Link
              href={`/customers/${loan.customer_id}`}
              className="ml-2 text-indigo-600 hover:text-indigo-800 text-[11px] font-semibold underline no-print"
            >
              Profile
            </Link>
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-6">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-[10px] font-bold uppercase text-slate-400">Principal</p>
            <p className="text-lg font-extrabold text-slate-900 mt-0.5">
              {formatCurrency(loan.principal, currency)}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">{loan.interest_rate}% {loan.rate_type}</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-[10px] font-bold uppercase text-slate-400">Total Interest</p>
            <p className="text-lg font-extrabold text-emerald-700 mt-0.5">
              +{formatCurrency(loan.total_interest, currency)}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">File Charge: {formatCurrency(loan.processing_fee, currency)}</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-[10px] font-bold uppercase text-slate-400">Total Payable</p>
            <p className="text-lg font-extrabold text-slate-900 mt-0.5">
              {formatCurrency(loan.total_payable, currency)}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">{loan.tenure_value} {loan.tenure_unit}</p>
          </div>

          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <p className="text-[10px] font-bold uppercase text-emerald-700">Total Paid</p>
            <p className="text-lg font-extrabold text-emerald-800 mt-0.5">
              {formatCurrency(loan.total_paid, currency)}
            </p>
            <p className="text-[10px] text-emerald-700 mt-0.5">{progress}% repaid</p>
          </div>

          <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-100 col-span-2 sm:col-span-1">
            <p className="text-[10px] font-bold uppercase text-amber-700">Balance Due</p>
            <p className="text-lg font-extrabold text-amber-800 mt-0.5">
              {loan.balance <= 0 ? 'NIL (CLOSED)' : formatCurrency(loan.balance, currency)}
            </p>
            <p className="text-[10px] text-amber-700 mt-0.5">Remaining</p>
          </div>
        </div>

        {/* Net In-Hand Disbursal Breakdown Box */}
        <div className="mt-4 p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Sanctioned Principal</span>
              <span className="font-bold text-slate-900 text-sm">{formatCurrency(loan.principal, currency)}</span>
            </div>
            <span className="text-slate-400 font-bold hidden sm:inline">-</span>
            <div>
              <span className="text-rose-600 block text-[10px] uppercase font-semibold">File Charge Deducted</span>
              <span className="font-bold text-rose-600 text-sm">-{formatCurrency(loan.processing_fee, currency)}</span>
            </div>
            <span className="text-slate-400 font-bold hidden sm:inline">=</span>
            <div>
              <span className="text-emerald-800 block text-[10px] uppercase font-semibold">Net In-Hand Disbursed</span>
              <span className="font-extrabold text-emerald-700 text-sm">
                {formatCurrency(loan.principal - loan.processing_fee, currency)}
              </span>
            </div>
          </div>
          <div className="text-slate-600 sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-emerald-200/60">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Repayment Term</span>
            <span className="font-bold text-slate-900">{loan.tenure_value} EMIs of {formatCurrency(Math.round(loan.total_payable / loan.tenure_value), currency)}/mo</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6 space-y-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-600">Repayment Progress ({progress}%)</span>
            <span className="text-slate-900">{formatCurrency(loan.total_paid, currency)} / {formatCurrency(loan.total_payable, currency)}</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                loan.status === 'completed' ? 'bg-indigo-600' : 'bg-emerald-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Collateral & Security Details */}
        {loan.collateral_details && (
          <div className="mt-6 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-start gap-2">
            <Shield className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800">Security / Collateral: </span>
              <span className="text-slate-600">{loan.collateral_details}</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs: Amortization Schedule vs Payment Receipts */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 no-print">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'schedule'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Repayment Schedule ({loan.schedule?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
              activeTab === 'payments'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Receipt className="h-4 w-4" />
            <span>Collection Receipts ({loan.payments?.length || 0})</span>
          </button>
        </div>

        {/* Schedule Table */}
        {(activeTab === 'schedule' || typeof window !== 'undefined') && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Amortization & Installment Schedule
              </h3>
              <span className="text-xs text-slate-500">
                Frequency: <span className="font-semibold text-slate-800 capitalize">{loan.frequency}</span>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Principal Due</th>
                    <th className="py-3 px-4">Interest Due</th>
                    <th className="py-3 px-4">Total Installment</th>
                    <th className="py-3 px-4">Paid Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right no-print">Reminder / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loan.schedule?.map((item) => {
                    const isDueToday = item.due_date === new Date().toISOString().split('T')[0];
                    const isPast = item.due_date < new Date().toISOString().split('T')[0] && item.status !== 'paid';

                    const waUrl = generateWhatsAppReminderUrl({
                      phone: loan.customer.phone,
                      customerName: loan.customer.name,
                      loanCode: loan.loan_code,
                      amountDue: item.total_due - item.amount_paid,
                      dueDate: formatDate(item.due_date),
                      currency,
                      lenderName: settings?.lender_name || 'Apex Finance',
                      isOverdue: isPast,
                    });

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-bold text-slate-500">#{item.installment_number}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {formatDate(item.due_date)}
                          {isDueToday && item.status !== 'paid' && (
                            <span className="ml-1.5 text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                              TODAY
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{formatCurrency(item.principal_due, currency)}</td>
                        <td className="py-3 px-4 text-slate-600">{formatCurrency(item.interest_due, currency)}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{formatCurrency(item.total_due, currency)}</td>
                        <td className="py-3 px-4 font-medium text-emerald-700">
                          {item.amount_paid > 0 ? formatCurrency(item.amount_paid, currency) : '-'}
                          {item.paid_date && (
                            <span className="block text-[10px] text-slate-400 font-normal">
                              Paid on {formatDate(item.paid_date)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              item.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'partial'
                                ? 'bg-amber-100 text-amber-800'
                                : isPast
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.status === 'pending' && isPast ? 'Overdue' : item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right no-print">
                          {item.status !== 'paid' && (
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                title="Send WhatsApp Reminder"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </a>
                              <button
                                onClick={() => openRecordPayment(loan)}
                                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
                              >
                                Collect
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payments Ledger Tab */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Repayment Receipts & Collection History
              </h3>
            </div>

            <div className="divide-y divide-slate-100">
              {loan.payments?.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No payments collected yet for this loan account.
                </div>
              ) : (
                loan.payments?.map((p) => (
                  <div key={p.id} className="p-4 hover:bg-slate-50 transition flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900">{p.payment_code}</span>
                        <span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {p.payment_method}
                        </span>
                        {p.reference_no && (
                          <span className="text-[11px] text-slate-500 font-mono">Ref: {p.reference_no}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Received on {formatDate(p.payment_date)}
                        {p.notes && ` • ${p.notes}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-emerald-700">
                          +{formatCurrency(p.amount, currency)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Bal after: {formatCurrency(p.balance_after, currency)}
                        </p>
                      </div>

                      <button
                        onClick={() => showReceipt(p)}
                        className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-xl text-xs font-semibold transition no-print"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Receipt</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Signature Section for Printed Statement */}
      <div className="hidden print:grid grid-cols-2 gap-8 pt-12 text-xs text-slate-600 text-center">
        <div>
          <div className="h-12 border-b border-dashed border-slate-400 w-48 mx-auto mb-2"></div>
          <p className="font-bold text-slate-900">Borrower Signature</p>
          <p className="text-[10px]">{loan.customer.name}</p>
        </div>
        <div>
          <div className="h-12 border-b border-dashed border-slate-400 w-48 mx-auto mb-2"></div>
          <p className="font-bold text-slate-900">Authorized Lender Representative</p>
          <p className="text-[10px]">{settings?.lender_name}</p>
        </div>
      </div>
    </div>
  );
}
