'use client';

import React, { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Search, 
  UserPlus, 
  Phone, 
  Mail, 
  MapPin, 
  Shield, 
  Plus, 
  ChevronRight, 
  Edit, 
  Trash2,
  Landmark,
  CreditCard
} from 'lucide-react';
import { Customer } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CustomerModal } from '@/components/customers/CustomerModal';
import { PaymentContext } from '@/components/AppLayout';

export default function CustomersPage() {
  const { settings } = useContext(PaymentContext);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const currency = settings?.currency || '₹';

  const fetchCustomers = (query = '') => {
    setLoading(true);
    fetch(`/api/customers${query ? `?search=${encodeURIComponent(query)}` : ''}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setCustomers(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomers(search);
  }, [search]);

  const handleCreateOrEdit = (saved: Customer) => {
    fetchCustomers(search);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this borrower? (Cannot be deleted if active unpaid balance exists).')) {
      return;
    }

    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Failed to delete customer');
      } else {
        fetchCustomers(search);
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting borrower');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-600" />
            <span>Borrower Directory (CRM)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your customer database, identity records, guarantors, and credit history.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedCustomer(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition self-start sm:self-auto active:scale-95"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add New Borrower</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, email, or Aadhaar/PAN..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{customers.length}</span> registered borrowers
        </div>
      </div>

      {/* Customers Cards / Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading borrowers...</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <Users className="h-10 w-10 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700 text-sm">No borrowers found</p>
            <p className="mt-1">Add your first customer to begin disbursing loans.</p>
            <button
              onClick={() => {
                setSelectedCustomer(null);
                setModalOpen(true);
              }}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold inline-flex items-center gap-1.5"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Borrower</span>
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Card View (md:hidden) */}
            <div className="md:hidden divide-y divide-slate-100">
              {customers.map((c) => (
                <div key={c.id} className="p-4 space-y-3 hover:bg-slate-50/60 transition">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link href={`/customers/${c.id}`} className="font-bold text-slate-900 text-sm hover:text-indigo-600 block">
                        {c.name}
                      </Link>
                      <a href={`tel:${c.phone}`} className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span>{c.phone}</span>
                      </a>
                      {c.address && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{c.address}</p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        c.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  {/* Stats Pill */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Active Balance</span>
                      <span className={`font-extrabold text-sm ${Number(c.current_balance) > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                        {formatCurrency(c.current_balance || 0, currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Loan Accounts</span>
                      <span className="font-bold text-slate-900">{c.active_loans || 0} active <span className="text-slate-400 font-normal">/ {c.total_loans || 0}</span></span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href={`/customers/${c.id}`}
                      className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition"
                    >
                      <span>Profile & History</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href={`/loans/new?customer_id=${c.id}`}
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition"
                      title="New Loan"
                    >
                      <Plus className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => {
                        setSelectedCustomer(c);
                        setModalOpen(true);
                      }}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop / Tablet Table View (hidden on phones) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Borrower Details</th>
                  <th className="py-3.5 px-4">Identity / KYC</th>
                  <th className="py-3.5 px-4">Guarantor</th>
                  <th className="py-3.5 px-4">Active Balance</th>
                  <th className="py-3.5 px-4">Total Loans</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition group">
                    {/* Borrower */}
                    <td className="py-4 px-4">
                      <Link href={`/customers/${c.id}`} className="block">
                        <p className="font-bold text-slate-900 text-sm hover:text-indigo-600 transition">
                          {c.name}
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{c.phone}</span>
                        </p>
                        {c.address && (
                          <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                            {c.address}
                          </p>
                        )}
                      </Link>
                    </td>

                    {/* KYC */}
                    <td className="py-4 px-4">
                      {c.id_type ? (
                        <div>
                          <span className="inline-block bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                            {c.id_type}
                          </span>
                          <p className="font-mono text-slate-600 text-[11px] mt-1">{c.id_number || '-'}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not provided</span>
                      )}
                    </td>

                    {/* Guarantor */}
                    <td className="py-4 px-4">
                      {c.guarantor_name ? (
                        <div>
                          <p className="font-medium text-slate-800">{c.guarantor_name}</p>
                          <p className="text-[10px] text-slate-500">
                            {c.guarantor_relation || 'Guarantor'} • {c.guarantor_phone}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Active Balance */}
                    <td className="py-4 px-4">
                      <p className={`font-extrabold text-sm ${Number(c.current_balance) > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                        {formatCurrency(c.current_balance || 0, currency)}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Paid: {formatCurrency(c.total_paid || 0, currency)}
                      </p>
                    </td>

                    {/* Total Loans */}
                    <td className="py-4 px-4">
                      <span className="font-semibold text-slate-800">
                        {c.active_loans || 0} active
                      </span>
                      <span className="text-slate-400"> / {c.total_loans || 0} total</span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          c.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/loans/new?customer_id=${c.id}`}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Disburse New Loan to Customer"
                        >
                          <Landmark className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => {
                            setSelectedCustomer(c);
                            setModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Edit Customer Profile"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <Link
                          href={`/customers/${c.id}`}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                          title="View 360 Profile"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Customer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
        )}
      </div>

      {/* Customer Add/Edit Modal */}
      <CustomerModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedCustomer(null);
        }}
        customerToEdit={selectedCustomer}
        onSuccess={handleCreateOrEdit}
      />
    </div>
  );
}
