import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currencySymbol: string = '₹'): string {
  if (isNaN(amount) || amount === null || amount === undefined) return `${currencySymbol}0`;
  return `${currencySymbol}${amount.toLocaleString('en-IN')}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function generateWhatsAppReminderUrl(params: {
  phone: string;
  customerName: string;
  loanCode: string;
  amountDue: number;
  dueDate: string;
  currency: string;
  lenderName: string;
  isOverdue?: boolean;
  daysOverdue?: number;
}): string {
  // Clean phone number (strip spaces, dashes, parentheses)
  let cleanPhone = params.phone.replace(/[^0-9]/g, '');
  // Default to country code 91 if 10 digits
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }

  let message = '';
  if (params.isOverdue) {
    message = `Dear ${params.customerName},\n\nThis is an urgent reminder from *${params.lenderName}* regarding your Loan *${params.loanCode}*.\n\nYour installment of *${params.currency}${params.amountDue.toLocaleString('en-IN')}* is overdue by *${params.daysOverdue || 1} day(s)* (Due Date: ${params.dueDate}).\n\nPlease settle this payment immediately to avoid late penalties.\n\nThank you,\n*${params.lenderName}*`;
  } else {
    message = `Dear ${params.customerName},\n\nThis is a friendly reminder from *${params.lenderName}* regarding your Loan *${params.loanCode}*.\n\nYour upcoming installment of *${params.currency}${params.amountDue.toLocaleString('en-IN')}* is due on *${params.dueDate}*.\n\nPlease ensure timely payment to maintain your good credit standing.\n\nThank you,\n*${params.lenderName}*`;
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function numberToWords(amount: number): string {
  const num = Math.floor(amount);
  if (num === 0) return 'Zero';

  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
  }

  return inWords(num) + ' Only';
}
