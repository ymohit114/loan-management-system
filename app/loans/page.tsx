'use client';

import React, { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { 
  Landmark, 
  Search, 
  Plus, 
  Filter, 
  ExternalLink, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { Loan, LoanStatus } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PaymentContext } from '@/components/AppLayout';

export default function LoansPage() {
  const { openRecordPayment, settings } = useContext(PaymentContext);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const currency = settings?.currency || '₹';

  const fetchLoans = () => {
    setLoading(true);
    let url = `/api/loans?`;
    if (statusFilter !== 'all') url += `status=${statusFilter}&`;
    if (search) url += `search=${encodeURIComponent(search)}&`;

    fetch(url)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setLoans(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLoans();
  }, [statusFilter, search]);

  const tabs: { label: string; value: string; count?: number }[] = [
    { label: 'All Accounts', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Overdue', value: 'overdue' },
    { label: 'Completed / Settled', value: 'completed' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Landmark className="h-6 w-6 text-indigo-600" />
            <span>Loan Portfolio & Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track all active, delinquent, and settled loan accounts.
          </p>
        </div>

        <Link
          href="/loans/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition self-start sm:self-auto active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Disburse New Loan</span>
        </Link>
      </div>

      {/* Tabs & Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  statusFilter === tab.value
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by loan code or customer..."
              className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Loan List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading loan records...</div>
        ) : loans.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <Landmark className="h-10 w-10 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700 text-sm">No loan accounts found</p>
            <p className="mt-1">Try changing search filters or create a new loan.</p>
            <Link
              href="/loans/new"
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold inline-flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Disburse Loan</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Loan Code & Customer</th>
                  <th className="py-3.5 px-4">Principal & Scheme</th>
                  <th className="py-3.5 px-4">Tenure & Frequency</th>
                  <th className="py-3.5 px-4">Repayment Progress</th>
                  <th className="py-3.5 px-4">Balance Remaining</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.map((loan) => {
                  const progress = loan.total_payable > 0 ? Math.min(100, Math.round((loan.total_paid / loan.total_payable) * 100)) : 0;

                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/80 transition group">
                      {/* Loan & Customer */}
                      <td className="py-4 px-4">
                        <Link href={`/loans/${loan.id}`} className="block">
                          <span className="font-mono font-bold text-slate-900 text-sm hover:text-indigo-600 transition">
                            {loan.loan_code}
                          </span>
                          <p className="font-semibold text-slate-800 text-xs mt-0.5">{loan.customer_name}</p>
                          <p className="text-[11px] text-slate-400">{loan.customer_phone}</p>
                        </Link>
                      </td>

                      {/* Principal & Scheme */}
                      <td className="py-4 px-4">
                        <p className="font-extrabold text-slate-900 text-sm">
                          {formatCurrency(loan.principal, currency)}
                        </p>
                        {loan.processing_fee > 0 && (
                          <p className="text-[10px] text-emerald-700 font-semibold">
                            In-hand: {formatCurrency(loan.principal - loan.processing_fee, currency)} <span className="text-rose-600 font-normal">(-{formatCurrency(loan.processing_fee, currency)} fee)</span>
                          </p>
                        )}
                        <p className="text-[11px] text-slate-500 capitalize">
                          {loan.calculation_type} • {loan.interest_rate}% {loan.rate_type}
                        </p>
                      </td>

                      {/* Tenure */}
                      <td className="py-4 px-4">
                        <p className="font-medium text-slate-800 capitalize">
                          {loan.frequency}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {loan.tenure_value} {loan.tenure_unit}
                        </p>
                      </td>

                      {/* Repayment Progress */}
                      <td className="py-4 px-4 min-w-[160px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-medium">
                            <span className="text-slate-600">{formatCurrency(loan.total_paid, currency)}</span>
                            <span className="text-slate-400 font-bold">{progress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                loan.status === 'completed'
                                  ? 'bg-indigo-600'
                                  : loan.status === 'overdue'
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-400">
                            Total: {formatCurrency(loan.total_payable, currency)}
                          </p>
                        </div>
                      </td>

                      {/* Balance */}
                      <td className="py-4 px-4">
                        <p className={`font-bold text-sm ${loan.balance > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {loan.balance <= 0 ? 'PAID OFF' : formatCurrency(loan.balance, currency)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Disbursed {formatDate(loan.disbursal_date)}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            loan.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : loan.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {loan.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {loan.status !== 'completed' && loan.balance > 0 && (
                            <button
                              onClick={() => openRecordPayment(loan)}
                              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                              title="Record Repayment"
                            >
                              <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Collect</span>
                            </button>
                          )}
                          <Link
                            href={`/loans/${loan.id}`}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="View Loan Details & Statement"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
