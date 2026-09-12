'use client';

import React, { useState, useEffect, useContext } from 'react';
import { 
  Settings as SettingsIcon, 
  Landmark, 
  Save, 
  Check, 
  AlertCircle, 
  Phone, 
  Mail, 
  MapPin, 
  IndianRupee,
  ShieldCheck,
  Database
} from 'lucide-react';
import { Settings } from '@/lib/types';
import { PaymentContext } from '@/components/AppLayout';

export default function SettingsPage() {
  const { settings, refreshSettings } = useContext(PaymentContext);

  const [lenderName, setLenderName] = useState('');
  const [tagline, setTagline] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [currencyCode, setCurrencyCode] = useState('INR');
  const [defaultLateFee, setDefaultLateFee] = useState('2.0');
  const [enableWhatsApp, setEnableWhatsApp] = useState(true);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setLenderName(settings.lender_name || '');
      setTagline(settings.tagline || '');
      setPhone(settings.phone || '');
      setEmail(settings.email || '');
      setAddress(settings.address || '');
      setCurrency(settings.currency || '₹');
      setCurrencyCode(settings.currency_code || 'INR');
      setDefaultLateFee(String(settings.default_late_fee_percent || 2.0));
      setEnableWhatsApp(Boolean(settings.enable_whatsapp_reminders));
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lender_name: lenderName,
          tagline,
          phone,
          email,
          address,
          currency,
          currencyCode,
          default_late_fee_percent: parseFloat(defaultLateFee) || 2.0,
          enable_whatsapp_reminders: enableWhatsApp ? 1 : 0,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to update settings');
      }

      setSuccessMsg('Settings saved successfully!');
      refreshSettings();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-indigo-600" />
          <span>Lender & System Settings</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Customize your business branding, currency symbols, and default lending terms.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Profile Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <Landmark className="h-5 w-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Lender Business Profile</h3>
              <p className="text-[11px] text-slate-500">Appears on official payment receipts and loan statements</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lender / Company Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={lenderName}
                onChange={(e) => setLenderName(e.target.value)}
                placeholder="e.g. Apex Financial Services"
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tagline / Subtitle
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Trusted Micro & Personal Lending Solutions"
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone / WhatsApp Contact <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@apexfinance.in"
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Office / Postal Address (Printed on Receipts)
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 102, Commercial Arcade, M.G. Road, Bangalore"
              className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Currency & Financial Preferences */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <IndianRupee className="h-5 w-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Currency & Loan Preferences</h3>
              <p className="text-[11px] text-slate-500">Formatting and default financial calculations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Currency Symbol
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full text-xs font-bold border border-slate-200 rounded-xl p-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="₹">₹ (Indian Rupee - INR)</option>
                <option value="$">$ (US Dollar - USD)</option>
                <option value="€">€ (Euro - EUR)</option>
                <option value="£">£ (British Pound - GBP)</option>
                <option value="AED">AED (UAE Dirham)</option>
                <option value="Rs">Rs (Rupees)</option>
                <option value="₱">₱ (Philippine Peso)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Late Fee Rate (% / Month)
              </label>
              <input
                type="number"
                step="0.1"
                value={defaultLateFee}
                onChange={(e) => setDefaultLateFee(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                WhatsApp Payment Alerts
              </label>
              <div className="pt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={enableWhatsApp}
                    onChange={(e) => setEnableWhatsApp(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span>Enable 1-Click WhatsApp Reminders</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Database Status Card */}
        <div className="p-4 bg-slate-900 text-slate-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Local SQLite Database</p>
              <p className="text-[11px] text-slate-400 font-mono">data/loan_management.db</p>
            </div>
          </div>
          <span className="text-[11px] px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-semibold rounded-full border border-emerald-500/30">
            Connected & Syncing
          </span>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving Settings...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
