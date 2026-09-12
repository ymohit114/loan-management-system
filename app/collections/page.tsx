'use client';

import React, { useState, useEffect, useContext, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  AlertCircle, 
  Calendar, 
  Clock, 
  MessageCircle, 
  CreditCard, 
  Search, 
  CheckCircle2, 
  ShieldAlert,
  ChevronRight,
  Filter,
  DollarSign
} from 'lucide-react';
import { ScheduleItem, Settings } from '@/lib/types';
import { formatCurrency, formatDate, generateWhatsAppReminderUrl } from '@/lib/utils';
import { PaymentContext } from '@/components/AppLayout';

interface CollectionItem extends ScheduleItem {
  loan_code: string;
  principal: number;
  loan_balance: number;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  days_overdue: number;
}

function CollectionsContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') || 'overdue') as 'all' | 'today' | 'overdue' | 'upcoming';

  const { openRecordPayment, settings } = useContext(PaymentContext);
  const currency = settings?.currency || '₹';

  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'overdue' | 'upcoming'>(initialTab);
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchItems = (type: string) => {
    setLoading(true);
    fetch(`/api/collections?type=${type}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setItems(res.data.items);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItems(activeTab);
  }, [activeTab]);

  // Filter by search text
  const filteredItems = items.filter((item) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      item.customer_name?.toLowerCase().includes(s) ||
      item.customer_phone?.toLowerCase().includes(s) ||
      item.loan_code?.toLowerCase().includes(s)
    );
  });

  const totalAmountDue = filteredItems.reduce((acc, item) => acc + (item.total_due - item.amount_paid), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-rose-600" />
            <span>Collections Radar & Defaulters</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track upcoming dues, prioritize overdue accounts, and dispatch 1-click WhatsApp alerts.
          </p>
        </div>

        {/* Total Due Summary Pill */}
        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Uncollected In View</p>
            <p className="text-base font-extrabold text-rose-600">
              {formatCurrency(totalAmountDue, currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('overdue')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'overdue'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Overdue / Defaulters</span>
            </button>

            <button
              onClick={() => setActiveTab('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'today'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Due Today</span>
            </button>

            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'upcoming'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Upcoming (Future)</span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Pending
            </button>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search borrower or loan..."
              className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Collection List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Scanning collection schedules...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-400 mb-3" />
            <p className="font-semibold text-slate-700 text-sm">
              {activeTab === 'overdue' ? 'No overdue loans found!' : 'No scheduled installments in this filter.'}
            </p>
            <p className="mt-1">All borrower payments are currently up to date.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Borrower & Phone</th>
                  <th className="py-3.5 px-4">Loan Code & Installment</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Days Past Due</th>
                  <th className="py-3.5 px-4">Amount Due</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const days = Math.floor(item.days_overdue || 0);
                  const isOverdue = days > 0;
                  const isToday = days === 0;

                  const unpaid = item.total_due - item.amount_paid;

                  const waUrl = generateWhatsAppReminderUrl({
                    phone: item.customer_phone,
                    customerName: item.customer_name,
                    loanCode: item.loan_code,
                    amountDue: unpaid,
                    dueDate: formatDate(item.due_date),
                    currency,
                    lenderName: settings?.lender_name || 'Apex Finance',
                    isOverdue: isOverdue,
                    daysOverdue: days,
                  });

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition group">
                      {/* Borrower */}
                      <td className="py-4 px-4">
                        <Link href={`/customers/${item.customer_id}`} className="block">
                          <p className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition">
                            {item.customer_name}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{item.customer_phone}</p>
                        </Link>
                      </td>

                      {/* Loan Code */}
                      <td className="py-4 px-4">
                        <Link href={`/loans/${item.loan_id}`} className="block font-mono font-bold text-slate-800 hover:text-indigo-600">
                          {item.loan_code}
                        </Link>
                        <p className="text-[10px] text-slate-400">Installment #{item.installment_number}</p>
                      </td>

                      {/* Due Date */}
                      <td className="py-4 px-4">
                        <p className="font-semibold text-slate-900">{formatDate(item.due_date)}</p>
                        <p className="text-[10px] text-slate-400">
                          Principal: {formatCurrency(item.principal_due, currency)} | Int: {formatCurrency(item.interest_due, currency)}
                        </p>
                      </td>

                      {/* Days Past Due Badge */}
                      <td className="py-4 px-4">
                        {isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                            <span>{days} Days Overdue</span>
                          </span>
                        ) : isToday ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Due Today
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            In {Math.abs(days)} days
                          </span>
                        )}
                      </td>

                      {/* Amount Due */}
                      <td className="py-4 px-4">
                        <p className={`text-sm font-extrabold ${isOverdue ? 'text-rose-600' : 'text-slate-900'}`}>
                          {formatCurrency(unpaid, currency)}
                        </p>
                        {item.amount_paid > 0 && (
                          <p className="text-[10px] text-emerald-600">
                            Partial: {formatCurrency(item.amount_paid, currency)} paid
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                            title="Send WhatsApp Payment Alert"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span>WhatsApp</span>
                          </a>
                          <button
                            onClick={() => openRecordPayment({ id: item.loan_id } as any)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                          >
                            Collect
                          </button>
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

export default function CollectionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading collections...</div>}>
      <CollectionsContent />
    </Suspense>
  );
}
