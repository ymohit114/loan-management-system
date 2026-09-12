'use client';

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Check, AlertCircle, Shield, UserCheck } from 'lucide-react';
import { Customer } from '@/lib/types';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerToEdit?: Customer | null;
  onSuccess: (customer: Customer) => void;
}

export function CustomerModal({
  isOpen,
  onClose,
  customerToEdit,
  onSuccess,
}: CustomerModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [idType, setIdType] = useState('Aadhaar');
  const [idNumber, setIdNumber] = useState('');
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorPhone, setGuarantorPhone] = useState('');
  const [guarantorRelation, setGuarantorRelation] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'active' | 'blocked'>('active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name || '');
      setPhone(customerToEdit.phone || '');
      setEmail(customerToEdit.email || '');
      setAddress(customerToEdit.address || '');
      setIdType(customerToEdit.id_type || 'Aadhaar');
      setIdNumber(customerToEdit.id_number || '');
      setGuarantorName(customerToEdit.guarantor_name || '');
      setGuarantorPhone(customerToEdit.guarantor_phone || '');
      setGuarantorRelation(customerToEdit.guarantor_relation || '');
      setNotes(customerToEdit.notes || '');
      setStatus(customerToEdit.status || 'active');
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setIdType('Aadhaar');
      setIdNumber('');
      setGuarantorName('');
      setGuarantorPhone('');
      setGuarantorRelation('');
      setNotes('');
      setStatus('active');
    }
  }, [customerToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !phone.trim()) {
      setError('Customer Full Name and Phone Number are required.');
      return;
    }

    setLoading(true);

    try {
      const url = customerToEdit ? `/api/customers/${customerToEdit.id}` : '/api/customers';
      const method = customerToEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          id_type: idType,
          id_number: idNumber.trim(),
          guarantor_name: guarantorName.trim(),
          guarantor_phone: guarantorPhone.trim(),
          guarantor_relation: guarantorRelation.trim(),
          notes: notes.trim(),
          status,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to save customer');
      }

      onSuccess(data.data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {customerToEdit ? 'Edit Borrower Profile' : 'Add New Borrower'}
              </h3>
              <p className="text-xs text-slate-500">Customer details, contact info & KYC</p>
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

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rajesh Sharma"
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98123 45678"
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rajesh@example.com"
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Borrower Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="active">Active (Eligible)</option>
                <option value="blocked">Blocked / Blacklisted</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Residential / Business Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Flat 102, Shanti Nagar, Main Market"
              className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* KYC / Identity Proof */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-indigo-600" />
              <span>Identity Verification (KYC)</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">ID Type</label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Aadhaar">Aadhaar Card</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Voter ID">Voter ID</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Passport">Passport</option>
                  <option value="Other">Other National ID</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">ID / Document Number</label>
                <input
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="e.g. 5432 1234 9876"
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Guarantor Details */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
              <span>Guarantor / Reference Details</span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Guarantor Name</label>
                <input
                  type="text"
                  value={guarantorName}
                  onChange={(e) => setGuarantorName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Phone</label>
                <input
                  type="text"
                  value={guarantorPhone}
                  onChange={(e) => setGuarantorPhone(e.target.value)}
                  placeholder="Contact"
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Relation</label>
                <input
                  type="text"
                  value={guarantorRelation}
                  onChange={(e) => setGuarantorRelation(e.target.value)}
                  placeholder="Brother / Friend"
                  className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Internal Remarks & Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Shopkeeper in local cloth market. Recommended by Sharmaji."
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
              className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>{customerToEdit ? 'Save Changes' : 'Create Borrower'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
