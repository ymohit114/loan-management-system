'use client';

import React, { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  Shield, 
  UserCheck, 
  Plus, 
  Landmark, 
  CheckCircle2, 
  Clock, 
  CreditCard,
  Edit,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { Customer, Loan } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CustomerModal } from '@/components/customers/CustomerModal';
import { PaymentContext } from '@/components/AppLayout';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { openRecordPayment, settings } = useContext(PaymentContext);
  const [customer, setCustomer] = useState<(Customer & { loans: Loan[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const currency = settings?.currency || '₹';
  const customerId = params?.id as string;

  const fetchCustomer = () => {
    setLoading(true);
    fetch(`/api/customers/${customerId}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setCustomer(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (customerId) fetchCustomer();
  }, [customerId]);

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading customer profile...</div>;
  }

  if (!customer) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        <p className="font-bold text-base text-slate-800">Customer not found</p>
        <Link href="/customers" className="mt-3 inline-block text-indigo-600 font-semibold underline">
          Back to Borrowers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          href="/customers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Borrowers</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            <Edit className="h-3.5 w-3.5" />
            <span>Edit Profile</span>
          </button>
          <Link
            href={`/loans/new?customer_id=${customer.id}`}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition"
          >
            <Plus className="h-4 w-4" />
            <span>Disburse New Loan</span>
          </Link>
        </div>
      </div>

      {/* Customer 360 Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          {/* Left Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900">{customer.name}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  customer.status === 'active'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {customer.status}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-semibold">{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span>{customer.address}</span>
                </div>
              )}
            </div>

            {/* KYC & Guarantor Badges */}
            <div className="pt-2 flex flex-wrap gap-4 text-xs">
              {customer.id_type && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
                  <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Shield className="h-3 w-3 text-indigo-500" />
                    <span>Identity Proof</span>
                  </p>
                  <p className="font-semibold text-slate-800">{customer.id_type}: <span className="font-mono">{customer.id_number}</span></p>
                </div>
              )}

              {customer.guarantor_name && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-0.5">
                  <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <UserCheck className="h-3 w-3 text-emerald-600" />
                    <span>Guarantor / Reference</span>
                  </p>
                  <p className="font-semibold text-slate-800">
                    {customer.guarantor_name} ({customer.guarantor_relation || 'Guarantor'}) • <span className="font-mono">{customer.guarantor_phone}</span>
                  </p>
                </div>
              )}
            </div>

            {customer.notes && (
              <p className="text-xs text-slate-500 italic mt-2">
                Internal Remarks: {customer.notes}
              </p>
            )}
          </div>

          {/* Right Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 shrink-0">
            <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl text-center">
              <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Lifetime Borrowed</p>
              <p className="text-lg font-extrabold text-indigo-900 mt-1">
                {formatCurrency(customer.total_borrowed || 0, currency)}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">{customer.total_loans || 0} loan(s)</p>
            </div>

            <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl text-center">
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Total Repaid</p>
              <p className="text-lg font-extrabold text-emerald-800 mt-1">
                {formatCurrency(customer.total_paid || 0, currency)}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">Recovered</p>
            </div>

            <div className="p-4 bg-amber-50/60 border border-amber-100 rounded-xl text-center col-span-2 sm:col-span-1">
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Current Balance</p>
              <p className="text-lg font-extrabold text-amber-800 mt-1">
                {formatCurrency(customer.current_balance || 0, currency)}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">{customer.active_loans || 0} active loan(s)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loans History for this customer */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <Landmark className="h-5 w-5 text-indigo-600" />
          <span>Customer Loan Accounts ({customer.loans?.length || 0})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(!customer.loans || customer.loans.length === 0) ? (
            <div className="col-span-2 p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
              No loans disbursed for this borrower yet.
            </div>
          ) : (
            customer.loans.map((loan) => {
              const progress = loan.total_payable > 0 ? Math.min(100, Math.round((loan.total_paid / loan.total_payable) * 100)) : 0;

              return (
                <div key={loan.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">{loan.loan_code}</span>
                        <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {loan.calculation_type}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          loan.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : loan.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {loan.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px]">Principal</span>
                        <p className="font-bold text-slate-900">{formatCurrency(loan.principal, currency)}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Interest Rate</span>
                        <p className="font-bold text-slate-900">{loan.interest_rate}% {loan.rate_type}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px]">Tenure</span>
                        <p className="font-bold text-slate-900">{loan.tenure_value} {loan.tenure_unit}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 space-y-1">
                      <div className="flex justify-between text-[11px] font-medium">
                        <span className="text-slate-500">Repaid: {formatCurrency(loan.total_paid, currency)}</span>
                        <span className="font-bold text-slate-900">{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                        <span>Disbursed: {formatDate(loan.disbursal_date)}</span>
                        <span className="font-semibold text-rose-600">
                          Bal: {formatCurrency(loan.balance, currency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href={`/loans/${loan.id}`}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <span>Full Schedule & Ledger</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>

                    {loan.status !== 'completed' && loan.balance > 0 && (
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/loans/new?customer_id=${customer.id}&settle_loan_id=${loan.id}`}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                          title="Top-up / Refinance loan"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Top-Up</span>
                        </Link>
                        <button
                          onClick={() => openRecordPayment(loan)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Collect</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Edit Customer Modal */}
      <CustomerModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        customerToEdit={customer}
        onSuccess={() => fetchCustomer()}
      />
    </div>
  );
}
