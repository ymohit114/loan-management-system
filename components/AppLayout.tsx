'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { RecordPaymentModal } from './payments/RecordPaymentModal';
import { ReceiptModal } from './payments/ReceiptModal';
import { Loan, Payment, Settings } from '@/lib/types';

export const PaymentContext = React.createContext<{
  openRecordPayment: (loan?: Loan) => void;
  showReceipt: (payment: Payment) => void;
  settings: Settings | null;
  refreshSettings: () => void;
}>({
  openRecordPayment: () => {},
  showReceipt: () => {},
  settings: null,
  refreshSettings: () => {},
});

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState<Loan | null>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<Payment | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);

  const fetchSettings = () => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setSettings(res.data);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const openRecordPayment = (loan?: Loan) => {
    setSelectedLoanForPayment(loan || null);
    setPaymentModalOpen(true);
  };

  const showReceipt = (payment: Payment) => {
    setCurrentReceipt(payment);
    setReceiptModalOpen(true);
  };

  const handlePaymentSuccess = (payment: Payment, updatedLoan: Loan) => {
    showReceipt(payment);
  };

  return (
    <PaymentContext.Provider
      value={{
        openRecordPayment,
        showReceipt,
        settings,
        refreshSettings: fetchSettings,
      }}
    >
      <div className="min-h-screen bg-slate-50 flex">
        {/* Sidebar */}
        <Sidebar
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
          <Header
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            onOpenPaymentModal={() => openRecordPayment()}
            currency={settings?.currency || '₹'}
            lenderName={settings?.lender_name || 'Apex Financial Services'}
          />

          <main className="flex-1 p-3 sm:p-5 md:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
            {children}
          </main>
        </div>

        {/* Mobile Fixed Bottom Navigation */}
        <BottomNav />

        {/* Global Modals */}
        <RecordPaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedLoanForPayment(null);
          }}
          preselectedLoan={selectedLoanForPayment}
          settings={settings}
          onPaymentSuccess={handlePaymentSuccess}
        />

        <ReceiptModal
          isOpen={receiptModalOpen}
          onClose={() => {
            setReceiptModalOpen(false);
            setCurrentReceipt(null);
          }}
          payment={currentReceipt}
          settings={settings}
        />
      </div>
    </PaymentContext.Provider>
  );
}
