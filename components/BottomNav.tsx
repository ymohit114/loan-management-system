'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Landmark, 
  Plus, 
  AlertCircle 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Home',
      href: '/',
      icon: LayoutDashboard,
      active: pathname === '/',
    },
    {
      label: 'Borrowers',
      href: '/customers',
      icon: Users,
      active: pathname.startsWith('/customers'),
    },
    {
      label: 'New Loan',
      href: '/loans/new',
      icon: Plus,
      active: pathname === '/loans/new',
      isCenter: true,
    },
    {
      label: 'Ledger',
      href: '/loans',
      icon: Landmark,
      active: pathname === '/loans' || (pathname.startsWith('/loans/') && pathname !== '/loans/new'),
    },
    {
      label: 'Collections',
      href: '/collections',
      icon: AlertCircle,
      active: pathname.startsWith('/collections'),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 lg:hidden no-print safe-area-pb shadow-lg">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-5 group"
              >
                <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 group-active:scale-95 transition-transform">
                  <Plus className="h-6 w-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-bold text-indigo-600 mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1 transition-colors",
                item.active ? "text-indigo-600" : "text-slate-400 hover:text-slate-700"
              )}
            >
              <Icon className={cn("h-5 w-5 transition-transform", item.active && "scale-110")} />
              <span className={cn("text-[10px] mt-1 font-medium", item.active && "font-bold text-indigo-600")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
