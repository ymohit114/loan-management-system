import type { Metadata } from 'next';
import './globals.css';
import { AppLayout } from '@/components/AppLayout';

export const metadata: Metadata = {
  title: 'LoanFlow | Loan & Repayment Management System',
  description: 'Manage borrowers, disburse loans, track collections, send WhatsApp reminders, and generate receipts.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-indigo-500 selection:text-white">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
