export type InterestCalculationType = 'flat' | 'reducing' | 'interest_only';
export type RepaymentFrequency = 'monthly' | 'weekly' | 'daily' | 'biweekly';
export type LoanStatus = 'active' | 'completed' | 'overdue' | 'defaulted' | 'cancelled';
export type ScheduleStatus = 'pending' | 'paid' | 'partial' | 'overdue';
export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'other';

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  id_type?: string; // Aadhaar, PAN, Passport, Driving License, Voter ID
  id_number?: string;
  guarantor_name?: string;
  guarantor_phone?: string;
  guarantor_relation?: string;
  notes?: string;
  status: 'active' | 'blocked';
  created_at: string;
  total_loans?: number;
  active_loans?: number;
  total_borrowed?: number;
  total_paid?: number;
  current_balance?: number;
}

export interface Loan {
  id: number;
  customer_id: number;
  loan_code: string; // e.g. LN-2024-001
  principal: number;
  interest_rate: number; // e.g. 2% monthly or 24% annual
  rate_type: 'monthly' | 'annual';
  calculation_type: InterestCalculationType;
  frequency: RepaymentFrequency;
  tenure_value: number; // e.g. 12
  tenure_unit: 'months' | 'weeks' | 'days';
  total_interest: number;
  total_payable: number;
  total_paid: number;
  balance: number;
  status: LoanStatus;
  disbursal_date: string; // YYYY-MM-DD
  first_payment_date: string; // YYYY-MM-DD
  processing_fee: number;
  collateral_details?: string;
  notes?: string;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
}

export interface ScheduleItem {
  id: number;
  loan_id: number;
  installment_number: number;
  due_date: string;
  principal_due: number;
  interest_due: number;
  total_due: number;
  amount_paid: number;
  status: ScheduleStatus;
  paid_date?: string;
}

export interface Payment {
  id: number;
  loan_id: number;
  customer_id: number;
  payment_code: string; // e.g. RCP-2024-001
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  reference_no?: string;
  notes?: string;
  principal_component: number;
  interest_component: number;
  penalty_component: number;
  balance_after: number;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
  loan_code?: string;
}

export interface Settings {
  id: number;
  lender_name: string;
  tagline?: string;
  phone: string;
  email?: string;
  address?: string;
  currency: string; // ₹, $, etc.
  currency_code: string; // INR, USD, etc.
  default_late_fee_percent: number;
  enable_whatsapp_reminders: number;
}

export interface DashboardStats {
  totalDisbursed: number;
  totalOutstanding: number;
  totalRecovered: number;
  totalInterestEarned: number;
  activeLoansCount: number;
  totalBorrowersCount: number;
  overdueLoansCount: number;
  overdueAmount: number;
  todayDueCount: number;
  todayDueAmount: number;
  thisMonthExpected: number;
  thisMonthCollected: number;
}
