'use client';

import React from 'react';
import { Menu, Plus, CreditCard, Calendar, IndianRupee } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenPaymentModal?: () => void;
  title?: string;
  currency?: string;
  lenderName?: string;
}

export function Header({
  onOpenMobileMenu,
  onOpenPaymentModal,
  title = 'Loan Management',
  currency = '₹',
  lenderName = 'Apex Financial Services',
}: HeaderProps) {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-white/90 backdrop-blur-md border-b border-slate-200/80 no-print">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500 hidden sm:block">{lenderName}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Date Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
          <Calendar className="h-3.5 w-3.5 text-slate-500" />
          <span>{today}</span>
        </div>

        {/* Currency Tag */}
        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
          <span>Currency:</span>
          <span className="font-bold">{currency}</span>
        </div>

        {/* Collect Payment Action */}
        {onOpenPaymentModal && (
          <button
            onClick={onOpenPaymentModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <CreditCard className="h-4 w-4 text-emerald-400" />
            <span>Record Payment</span>
          </button>
        )}

        {/* New Loan shortcut */}
        <Link
          href="/loans/new"
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm shadow-indigo-600/20 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>New Loan</span>
        </Link>
      </div>
    </header>
  );
}
