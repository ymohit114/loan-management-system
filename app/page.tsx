'use client';

import React, { useEffect, useState, useContext } from 'react';
import Link from 'next/link';
import { 
  Landmark, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Users, 
  CheckCircle2, 
  ArrowUpRight, 
  Plus, 
  CreditCard,
  MessageCircle, 
  Receipt, 
  Calendar,
  ChevronRight,
  ShieldAlert,
  Search
} from 'lucide-react';
import { DashboardStats, Payment, Settings, ScheduleItem } from '@/lib/types';
import { formatCurrency, formatDate, generateWhatsAppReminderUrl } from '@/lib/utils';
import { PaymentContext } from '@/components/AppLayout';

interface TodayDueItem extends ScheduleItem {
  loan_code: string;
  principal: number;
  loan_balance: number;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  days_overdue: number;
}

export default function DashboardPage() {
  const { openRecordPayment, showReceipt, settings } = useContext(PaymentContext);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [todayDues, setTodayDues] = useState<TodayDueItem[]>([]);
  const [overdueDues, setOverdueDues] = useState<TodayDueItem[]>([]);
  const [loading, setLoading] = useState(true);

  const currency = settings?.currency || '₹';

  const loadData = () => {
    setLoading(true);
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setStats(res.data.stats);
          setRecentPayments(res.data.recentPayments);
          setTodayDues(res.data.todayDues);
          setOverdueDues(res.data.overdueDues);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Welcome & Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-2xl text-white shadow-xl">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Lending Portfolio Overview</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {settings?.lender_name || 'Apex Financial Services'}
          </h1>
          <p className="text-xs md:text-sm text-slate-300">
            Monitor loan disbursements, daily EMI collections, and borrower dues in real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => openRecordPayment()}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-900/30 transition active:scale-95"
          >
            <CreditCard className="h-4 w-4" />
            <span>Record Payment</span>
          </button>
          <Link
            href="/loans/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-900/30 transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Disburse Loan</span>
          </Link>
        </div>
      </div>

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* Total Disbursed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Capital Lent</span>
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Landmark className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-slate-900">
              {formatCurrency(stats?.totalDisbursed || 0, currency)}
            </h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>Across</span>
              <span className="font-semibold text-slate-800">{stats?.activeLoansCount || 0} active loans</span>
            </p>
          </div>
        </div>

        {/* Total Outstanding */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding Balance</span>
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-amber-600">
              {formatCurrency(stats?.totalOutstanding || 0, currency)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Principal + remaining interest
            </p>
          </div>
        </div>

        {/* Total Recovered */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Recovered</span>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-emerald-700">
              {formatCurrency(stats?.totalRecovered || 0, currency)}
            </h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>Interest earned:</span>
              <span className="font-semibold text-emerald-700">{formatCurrency(stats?.totalInterestEarned || 0, currency)}</span>
            </p>
          </div>
        </div>

        {/* Overdue Amount */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Delinquent / Overdue</span>
            <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-rose-600">
              {formatCurrency(stats?.overdueAmount || 0, currency)}
            </h3>
            <p className="text-xs text-rose-600 font-medium mt-1 flex items-center gap-1">
              <span>{stats?.overdueLoansCount || 0} overdue loan(s)</span>
              <span className="text-slate-400">| Requires follow-up</span>
            </p>
          </div>
        </div>
      </div>

      {/* Overdue Warning Alert Banner if any overdue */}
      {overdueDues.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold text-rose-900 text-sm">
                {overdueDues.length} Overdue Installment(s) Detected!
              </p>
              <p className="text-rose-700">
                Total unpaid overdue amount: <span className="font-bold">{formatCurrency(stats?.overdueAmount || 0, currency)}</span>. Send WhatsApp payment reminders with 1 click.
              </p>
            </div>
          </div>
          <Link
            href="/collections?tab=overdue"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shrink-0 transition"
          >
            <span>Open Delinquency Radar</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Two Column Layout: Collection Radar vs Recent Collections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Today's Due & Overdue (8 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Today's Dues */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Installments Due Today</h3>
                  <p className="text-xs text-slate-500">Scheduled collections for today</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                {todayDues.length} Today
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {todayDues.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-400 mb-2" />
                  <p className="font-semibold text-slate-600">No installments scheduled for today</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">All today&apos;s collections are cleared or upcoming later this week.</p>
                </div>
              ) : (
                todayDues.map((item) => {
                  const waUrl = generateWhatsAppReminderUrl({
                    phone: item.customer_phone,
                    customerName: item.customer_name,
                    loanCode: item.loan_code,
                    amountDue: item.total_due - item.amount_paid,
                    dueDate: formatDate(item.due_date),
                    currency,
                    lenderName: settings?.lender_name || 'Apex Finance',
                  });

                  return (
                    <div key={item.id} className="p-4 hover:bg-slate-50 transition flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 text-xs truncate">{item.customer_name}</p>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {item.loan_code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Phone: {item.customer_phone} | Installment #{item.installment_number}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-extrabold text-slate-900">
                            {formatCurrency(item.total_due - item.amount_paid, currency)}
                          </p>
                          <span className="text-[10px] text-amber-600 font-semibold">Due Today</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition"
                            title="Send WhatsApp Reminder"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </a>
                          <button
                            onClick={() => openRecordPayment({ id: item.loan_id } as any)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition"
                          >
                            Collect
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Overdue Queue */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Critical Overdue List</h3>
                  <p className="text-xs text-slate-500">Past due installments requiring immediate action</p>
                </div>
              </div>
              <Link
                href="/collections"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>View All ({overdueDues.length})</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {overdueDues.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <p className="font-semibold text-slate-600">No overdue loans!</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Your portfolio health is excellent.</p>
                </div>
              ) : (
                overdueDues.slice(0, 4).map((item) => {
                  const days = Math.floor(item.days_overdue || 1);
                  const waUrl = generateWhatsAppReminderUrl({
                    phone: item.customer_phone,
                    customerName: item.customer_name,
                    loanCode: item.loan_code,
                    amountDue: item.total_due - item.amount_paid,
                    dueDate: formatDate(item.due_date),
                    currency,
                    lenderName: settings?.lender_name || 'Apex Finance',
                    isOverdue: true,
                    daysOverdue: days,
                  });

                  return (
                    <div key={item.id} className="p-4 hover:bg-slate-50 transition flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 text-xs truncate">{item.customer_name}</p>
                          <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                            {days}d Overdue
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Due Date: {formatDate(item.due_date)} | Loan: {item.loan_code}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-extrabold text-rose-600">
                            {formatCurrency(item.total_due - item.amount_paid, currency)}
                          </p>
                          <p className="text-[10px] text-slate-400">Pending</p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
                            title="Send WhatsApp Overdue Warning"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span>WhatsApp</span>
                          </a>
                          <button
                            onClick={() => openRecordPayment({ id: item.loan_id } as any)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition"
                          >
                            Collect
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Recent Collections & Quick Shortcuts (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Recent Collections Feed */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Receipt className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Recent Repayments</h3>
                  <p className="text-xs text-slate-500">Latest collection receipts</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {recentPayments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No repayment transactions recorded yet.
                </div>
              ) : (
                recentPayments.map((p) => (
                  <div key={p.id} className="p-4 hover:bg-slate-50 transition flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 text-xs truncate">{p.customer_name}</p>
                        <span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {p.payment_method}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {p.payment_code} • {formatDate(p.payment_date)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className="text-xs font-bold text-emerald-700">
                          +{formatCurrency(p.amount, currency)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Bal: {formatCurrency(p.balance_after, currency)}
                        </p>
                      </div>
                      <button
                        onClick={() => showReceipt(p)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition"
                        title="View & Print Official Receipt"
                      >
                        <Receipt className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Management Shortcuts */}
          <div className="bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-5 rounded-2xl border border-indigo-100 space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-indigo-950">
              Lender Shortcuts
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/customers"
                className="p-3 bg-white hover:bg-indigo-50/60 border border-slate-200 rounded-xl transition text-left group"
              >
                <Users className="h-4 w-4 text-indigo-600 mb-1 group-hover:scale-110 transition-transform" />
                <p className="font-bold text-xs text-slate-900">Borrower CRM</p>
                <p className="text-[11px] text-slate-500">Manage KYC & contacts</p>
              </Link>
              <Link
                href="/loans"
                className="p-3 bg-white hover:bg-indigo-50/60 border border-slate-200 rounded-xl transition text-left group"
              >
                <Landmark className="h-4 w-4 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
                <p className="font-bold text-xs text-slate-900">Loan Ledger</p>
                <p className="text-[11px] text-slate-500">Active & closed loans</p>
              </Link>
              <Link
                href="/collections"
                className="p-3 bg-white hover:bg-indigo-50/60 border border-slate-200 rounded-xl transition text-left group"
              >
                <AlertTriangle className="h-4 w-4 text-rose-600 mb-1 group-hover:scale-110 transition-transform" />
                <p className="font-bold text-xs text-slate-900">Overdue Radar</p>
                <p className="text-[11px] text-slate-500">Track defaulters</p>
              </Link>
              <Link
                href="/settings"
                className="p-3 bg-white hover:bg-indigo-50/60 border border-slate-200 rounded-xl transition text-left group"
              >
                <TrendingUp className="h-4 w-4 text-amber-600 mb-1 group-hover:scale-110 transition-transform" />
                <p className="font-bold text-xs text-slate-900">Settings</p>
                <p className="text-[11px] text-slate-500">Currency & profile</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
