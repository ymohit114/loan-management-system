'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Landmark, 
  PlusCircle, 
  AlertCircle, 
  Settings as SettingsIcon,
  CreditCard,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      active: pathname === '/',
    },
    {
      label: 'Borrowers (CRM)',
      href: '/customers',
      icon: Users,
      active: pathname.startsWith('/customers'),
    },
    {
      label: 'All Loans',
      href: '/loans',
      icon: Landmark,
      active: pathname === '/loans' || (pathname.startsWith('/loans/') && pathname !== '/loans/new'),
    },
    {
      label: 'Disburse Loan',
      href: '/loans/new',
      icon: PlusCircle,
      active: pathname === '/loans/new',
      highlight: true,
    },
    {
      label: 'Collections & Overdue',
      href: '/collections',
      icon: AlertCircle,
      active: pathname.startsWith('/collections'),
      badge: 'Radar',
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: SettingsIcon,
      active: pathname.startsWith('/settings'),
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 no-print",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              LoanFlow <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono">PRO</span>
            </h1>
            <p className="text-xs text-slate-400">Private Lender Suite</p>
          </div>
        </div>

        {/* Quick Action */}
        <div className="p-4">
          <Link
            href="/loans/new"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium px-4 py-2.5 rounded-xl shadow-md shadow-emerald-900/20 transition-all text-sm group"
          >
            <PlusCircle className="h-4 w-4 group-hover:scale-110 transition-transform" />
            <span>Disburse New Loan</span>
          </Link>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group",
                  item.active
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/30"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      item.active ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-semibold bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom User / Info Box */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">Lending Manager</p>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Database Active
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
