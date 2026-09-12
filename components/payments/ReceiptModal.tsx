'use client';

import React from 'react';
import { X, Printer, Share2, CheckCircle2, Landmark, Phone, Mail, MapPin } from 'lucide-react';
import { Payment, Settings } from '@/lib/types';
import { formatCurrency, formatDate, numberToWords } from '@/lib/utils';

interface ReceiptModalProps {
  payment: Payment | null;
  settings?: Settings | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReceiptModal({ payment, settings, isOpen, onClose }: ReceiptModalProps) {
  if (!isOpen || !payment) return null;

  const currency = settings?.currency || '₹';
  const lenderName = settings?.lender_name || 'Apex Financial Services';
  const lenderPhone = settings?.phone || '+91 98765 43210';
  const lenderAddress = settings?.address || 'Bangalore, India';
  const lenderEmail = settings?.email || 'contact@apexfinance.in';

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    let cleanPhone = (payment.customer_phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

    const message = `*PAYMENT RECEIPT*\n-------------------------\nLender: *${lenderName}*\nReceipt No: *${payment.payment_code}*\nDate: ${formatDate(payment.payment_date)}\n\nDear *${payment.customer_name}*,\nWe have received your payment of *${currency}${payment.amount.toLocaleString('en-IN')}* for Loan *${payment.loan_code}* via ${payment.payment_method.toUpperCase()}.\n\nRemaining Balance: *${currency}${payment.balance_after.toLocaleString('en-IN')}*\n\nThank you for your timely payment!\n_${lenderName}_`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8 print:my-0 print:shadow-none print:w-full print:max-w-none">
        {/* Action Header (hidden in print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white no-print">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span className="font-semibold text-sm">Payment Receipt Generated</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition"
              title="Share on WhatsApp"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition"
              title="Print Receipt"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Official Printable Voucher Content */}
        <div className="p-8 print:p-6 bg-white text-slate-900 border border-slate-200 print:border-none print-shadow-none">
          {/* Header */}
          <div className="border-b-2 border-slate-800 pb-5 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-2xl tracking-tight">
                  <Landmark className="h-7 w-7 text-indigo-600" />
                  <span>{lenderName}</span>
                </div>
                {settings?.tagline && (
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{settings.tagline}</p>
                )}
                <div className="text-xs text-slate-600 mt-2 space-y-0.5">
                  <p className="flex items-center gap-1"><MapPin className="h-3 w-3 text-slate-400" /> {lenderAddress}</p>
                  <p className="flex items-center gap-1"><Phone className="h-3 w-3 text-slate-400" /> {lenderPhone} {lenderEmail && `| ${lenderEmail}`}</p>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block bg-slate-100 border border-slate-300 px-3 py-1 rounded text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Official Payment Receipt
                </div>
                <p className="text-xs font-bold text-slate-900">Receipt No: <span className="text-indigo-600 font-mono">{payment.payment_code}</span></p>
                <p className="text-xs text-slate-600">Date: {formatDate(payment.payment_date)}</p>
                <p className="text-xs text-slate-600">Loan Code: <span className="font-semibold text-slate-900">{payment.loan_code}</span></p>
              </div>
            </div>
          </div>

          {/* Customer & Payment Meta */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Received From</p>
              <p className="text-base font-bold text-slate-900 mt-0.5">{payment.customer_name || 'Customer'}</p>
              <p className="text-xs text-slate-600">Phone: {payment.customer_phone || '-'}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payment Mode & Ref</p>
              <p className="text-sm font-semibold text-slate-900 uppercase mt-0.5">{payment.payment_method}</p>
              {payment.reference_no && (
                <p className="text-xs text-slate-600 font-mono">Ref: {payment.reference_no}</p>
              )}
            </div>
          </div>

          {/* Amount Box */}
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-5 mb-6 text-center">
            <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Amount Received</p>
            <p className="text-3xl font-extrabold text-emerald-700 mt-1">
              {formatCurrency(payment.amount, currency)}
            </p>
            <p className="text-xs text-emerald-900 italic mt-1.5 font-medium">
              ({numberToWords(payment.amount)})
            </p>
          </div>

          {/* Breakdown Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 text-left">Component</th>
                  <th className="py-2.5 px-4 text-right">Amount Allocated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2 px-4 text-slate-600">Principal Component</td>
                  <td className="py-2 px-4 text-right font-medium">{formatCurrency(payment.principal_component, currency)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-slate-600">Interest Component</td>
                  <td className="py-2 px-4 text-right font-medium">{formatCurrency(payment.interest_component, currency)}</td>
                </tr>
                {payment.penalty_component > 0 && (
                  <tr>
                    <td className="py-2 px-4 text-rose-600">Late Fee / Penalty</td>
                    <td className="py-2 px-4 text-right font-medium text-rose-600">{formatCurrency(payment.penalty_component, currency)}</td>
                  </tr>
                )}
                <tr className="bg-slate-50 font-bold border-t border-slate-200">
                  <td className="py-2.5 px-4 text-slate-900">Total Paid</td>
                  <td className="py-2.5 px-4 text-right text-emerald-700">{formatCurrency(payment.amount, currency)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Balance Remaining */}
          <div className="flex justify-between items-center bg-slate-100 px-4 py-3 rounded-lg text-sm font-semibold mb-8">
            <span className="text-slate-700">Remaining Loan Balance After This Payment:</span>
            <span className={payment.balance_after <= 0 ? 'text-emerald-600 font-bold' : 'text-slate-900 font-bold'}>
              {payment.balance_after <= 0 ? 'PAID IN FULL (NIL)' : formatCurrency(payment.balance_after, currency)}
            </span>
          </div>

          {payment.notes && (
            <p className="text-xs text-slate-500 mb-6 italic">Notes: {payment.notes}</p>
          )}

          {/* Signatures */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs text-slate-600">
            <div>
              <div className="h-12 border-b border-dashed border-slate-400 w-48 mx-auto mb-2"></div>
              <p className="font-semibold text-slate-800">Borrower Signature</p>
            </div>
            <div>
              <div className="h-12 border-b border-dashed border-slate-400 w-48 mx-auto mb-2"></div>
              <p className="font-semibold text-slate-800">Authorized Signatory / Cashier</p>
              <p className="text-[10px] text-slate-400">({lenderName})</p>
            </div>
          </div>
        </div>

        {/* Footer actions (hidden in print) */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 no-print">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition"
          >
            Done
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition"
          >
            <Printer className="h-4 w-4" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
}
