import mongoose from 'mongoose';
import { calculateLoan } from '../loan-calculator';
import { Customer, Loan, ScheduleItem, Payment, Settings, DashboardStats } from '../types';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mohit_app:mohit_app@ac-ft2q9tn-shard-00-00.iye3brk.mongodb.net:27017,ac-ft2q9tn-shard-00-01.iye3brk.mongodb.net:27017,ac-ft2q9tn-shard-00-02.iye3brk.mongodb.net:27017/loan_management?ssl=true&replicaSet=atlas-14av5y-shard-0&authSource=admin&appName=Cluster0';

let isConnected = false;

export async function connectMongo() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
    isConnected = true;
  } catch (error) {
    console.error('MongoDB Atlas Connection Error:', error);
    throw error;
  }
}

// Schemas & Models
const CustomerSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: '' },
  address: { type: String, default: '' },
  id_type: { type: String, default: '' },
  id_number: { type: String, default: '' },
  guarantor_name: { type: String, default: '' },
  guarantor_phone: { type: String, default: '' },
  guarantor_relation: { type: String, default: '' },
  notes: { type: String, default: '' },
  status: { type: String, default: 'active' },
  created_at: { type: String, default: () => new Date().toISOString() },
});

const LoanSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  customer_id: { type: Number, required: true },
  loan_code: { type: String, required: true, unique: true },
  principal: { type: Number, required: true },
  interest_rate: { type: Number, required: true },
  rate_type: { type: String, default: 'monthly' },
  calculation_type: { type: String, required: true },
  frequency: { type: String, default: 'monthly' },
  tenure_value: { type: Number, required: true },
  tenure_unit: { type: String, default: 'months' },
  total_interest: { type: Number, required: true },
  total_payable: { type: Number, required: true },
  total_paid: { type: Number, default: 0 },
  balance: { type: Number, required: true },
  status: { type: String, default: 'active' },
  disbursal_date: { type: String, required: true },
  first_payment_date: { type: String, required: true },
  processing_fee: { type: Number, default: 0 },
  collateral_details: { type: String, default: '' },
  notes: { type: String, default: '' },
  created_at: { type: String, default: () => new Date().toISOString() },
});

const ScheduleSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  loan_id: { type: Number, required: true },
  installment_number: { type: Number, required: true },
  due_date: { type: String, required: true },
  principal_due: { type: Number, required: true },
  interest_due: { type: Number, required: true },
  total_due: { type: Number, required: true },
  amount_paid: { type: Number, default: 0 },
  status: { type: String, default: 'pending' },
  paid_date: { type: String, default: null },
});

const PaymentSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  loan_id: { type: Number, required: true },
  customer_id: { type: Number, required: true },
  payment_code: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  payment_date: { type: String, required: true },
  payment_method: { type: String, default: 'cash' },
  reference_no: { type: String, default: '' },
  notes: { type: String, default: '' },
  principal_component: { type: Number, default: 0 },
  interest_component: { type: Number, default: 0 },
  penalty_component: { type: Number, default: 0 },
  balance_after: { type: Number, required: true },
  created_at: { type: String, default: () => new Date().toISOString() },
});

const SettingsSchema = new mongoose.Schema({
  lender_name: { type: String, default: 'Apex Financial Services' },
  tagline: { type: String, default: 'Trusted Micro & Personal Lending Solutions' },
  phone: { type: String, default: '+91 98765 43210' },
  email: { type: String, default: 'contact@apexfinance.in' },
  address: { type: String, default: '102, Commercial Arcade, M.G. Road, Bangalore, KA 560001' },
  currency: { type: String, default: '₹' },
  currency_code: { type: String, default: 'INR' },
  default_late_fee_percent: { type: Number, default: 2.0 },
  enable_whatsapp_reminders: { type: Number, default: 1 },
});

export const CustomerModel = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
export const LoanModel = mongoose.models.Loan || mongoose.model('Loan', LoanSchema);
export const ScheduleModel = mongoose.models.Schedule || mongoose.model('Schedule', ScheduleSchema);
export const PaymentModel = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
export const SettingsModel = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

// Operations
export async function getSettings(): Promise<Settings> {
  await connectMongo();
  let settings = await SettingsModel.findOne().lean();
  if (!settings) {
    settings = await SettingsModel.create({
      lender_name: 'Apex Financial Services',
      tagline: 'Trusted Micro & Personal Lending Solutions',
      phone: '+91 98765 43210',
      currency: '₹',
      currency_code: 'INR',
    });
  }
  return settings as unknown as Settings;
}

export async function updateSettings(data: Partial<Settings>): Promise<Settings> {
  await connectMongo();
  const current = await getSettings();
  await SettingsModel.updateOne({}, { $set: data }, { upsert: true });
  return (await SettingsModel.findOne().lean()) as unknown as Settings;
}

export async function getCustomers(search?: string): Promise<Customer[]> {
  await connectMongo();
  let filter: any = {};
  if (search) {
    const regex = new RegExp(search, 'i');
    filter = {
      $or: [{ name: regex }, { phone: regex }, { email: regex }, { id_number: regex }],
    };
  }

  const customers = await CustomerModel.find(filter).sort({ id: -1 }).lean();
  const loans = await LoanModel.find().lean();

  return customers.map((c: any) => {
    const custLoans = loans.filter((l: any) => l.customer_id === c.id);
    const activeLoans = custLoans.filter((l: any) => ['active', 'overdue'].includes(l.status));
    const totalBorrowed = custLoans.reduce((sum: number, l: any) => sum + (l.principal || 0), 0);
    const totalPaid = custLoans.reduce((sum: number, l: any) => sum + (l.total_paid || 0), 0);
    const currentBalance = custLoans.reduce((sum: number, l: any) => sum + (l.balance || 0), 0);

    return {
      ...c,
      total_loans: custLoans.length,
      active_loans: activeLoans.length,
      total_borrowed: totalBorrowed,
      total_paid: totalPaid,
      current_balance: currentBalance,
    };
  });
}

export async function getCustomerById(id: number): Promise<(Customer & { loans: Loan[] }) | null> {
  await connectMongo();
  const customer = (await CustomerModel.findOne({ id }).lean()) as any;
  if (!customer) return null;

  const loans = (await LoanModel.find({ customer_id: id }).sort({ id: -1 }).lean()) as any[];
  const activeLoans = loans.filter((l: any) => ['active', 'overdue'].includes(l.status));
  const totalBorrowed = loans.reduce((sum: number, l: any) => sum + (l.principal || 0), 0);
  const totalPaid = loans.reduce((sum: number, l: any) => sum + (l.total_paid || 0), 0);
  const currentBalance = loans.reduce((sum: number, l: any) => sum + (l.balance || 0), 0);

  return {
    ...customer,
    total_loans: loans.length,
    active_loans: activeLoans.length,
    total_borrowed: totalBorrowed,
    total_paid: totalPaid,
    current_balance: currentBalance,
    loans: loans.map((l: any) => ({
      ...l,
      customer_name: customer.name,
      customer_phone: customer.phone,
    })),
  };
}

export async function createCustomer(data: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> {
  await connectMongo();
  const maxCust = await CustomerModel.findOne().sort({ id: -1 }).lean() as any;
  const newId = (maxCust?.id || 0) + 1;

  const newCustomer = await CustomerModel.create({
    ...data,
    id: newId,
    created_at: new Date().toISOString(),
  });

  return (await getCustomerById(newId))!;
}

export async function updateCustomer(id: number, data: Partial<Customer>): Promise<Customer | null> {
  await connectMongo();
  await CustomerModel.updateOne({ id }, { $set: data });
  return await getCustomerById(id);
}

export async function deleteCustomer(id: number): Promise<boolean> {
  await connectMongo();
  const activeLoansCount = await LoanModel.countDocuments({ customer_id: id, balance: { $gt: 0 } });
  if (activeLoansCount > 0) {
    throw new Error('Cannot delete customer with active unpaid loans.');
  }
  await CustomerModel.deleteOne({ id });
  return true;
}

export async function getLoans(filters?: { status?: string; customer_id?: number; search?: string }): Promise<Loan[]> {
  await connectMongo();
  const filter: any = {};
  if (filters?.status && filters.status !== 'all') {
    filter.status = filters.status;
  }
  if (filters?.customer_id) {
    filter.customer_id = filters.customer_id;
  }

  let loans = (await LoanModel.find(filter).sort({ id: -1 }).lean()) as any[];
  const customers = (await CustomerModel.find().lean()) as any[];
  const custMap = new Map(customers.map((c: any) => [c.id, c]));

  let enrichedLoans = loans.map((l: any) => {
    const cust = custMap.get(l.customer_id);
    return {
      ...l,
      customer_name: cust?.name || 'Customer',
      customer_phone: cust?.phone || '-',
    };
  });

  if (filters?.search) {
    const s = filters.search.toLowerCase();
    enrichedLoans = enrichedLoans.filter(
      (l: any) =>
        l.loan_code?.toLowerCase().includes(s) ||
        l.customer_name?.toLowerCase().includes(s) ||
        l.customer_phone?.toLowerCase().includes(s)
    );
  }

  return enrichedLoans;
}

export async function getLoanById(id: number): Promise<(Loan & { customer: Customer; schedule: ScheduleItem[]; payments: Payment[] }) | null> {
  await connectMongo();
  const loan = (await LoanModel.findOne({ id }).lean()) as any;
  if (!loan) return null;

  const customer = (await CustomerModel.findOne({ id: loan.customer_id }).lean()) as any;
  const schedule = (await ScheduleModel.find({ loan_id: id }).sort({ installment_number: 1 }).lean()) as any[];
  const payments = (await PaymentModel.find({ loan_id: id }).sort({ id: -1 }).lean()) as any[];

  return {
    ...loan,
    customer_name: customer?.name,
    customer_phone: customer?.phone,
    customer,
    schedule,
    payments: payments.map((p: any) => ({
      ...p,
      customer_name: customer?.name,
      customer_phone: customer?.phone,
      loan_code: loan.loan_code,
    })),
  };
}

export async function createLoan(params: {
  customer_id: number;
  principal: number;
  interest_rate: number;
  rate_type: 'monthly' | 'annual';
  calculation_type: 'flat' | 'reducing' | 'interest_only';
  frequency: 'monthly' | 'weekly' | 'daily' | 'biweekly';
  tenure_value: number;
  tenure_unit: 'months' | 'weeks' | 'days';
  disbursal_date: string;
  first_payment_date: string;
  processing_fee?: number;
  collateral_details?: string;
  notes?: string;
  settle_loan_id?: number;
  settle_amount?: number;
}): Promise<Loan> {
  await connectMongo();

  const calculation = calculateLoan({
    principal: params.principal,
    interestRate: params.interest_rate,
    rateType: params.rate_type,
    calculationType: params.calculation_type,
    frequency: params.frequency,
    tenureValue: params.tenure_value,
    tenureUnit: params.tenure_unit,
    firstPaymentDate: params.first_payment_date,
  });

  const year = new Date().getFullYear();
  const maxLoan = (await LoanModel.findOne().sort({ id: -1 }).lean()) as any;
  const newLoanId = (maxLoan?.id || 0) + 1;
  const loanCode = `LN-${year}-${String(newLoanId).padStart(4, '0')}`;

  let notes = params.notes || '';

  // If settling an existing loan (Top-up loan)
  if (params.settle_loan_id) {
    const oldLoan = (await LoanModel.findOne({ id: params.settle_loan_id })) as any;
    if (oldLoan) {
      const deductionAmount = params.settle_amount !== undefined ? params.settle_amount : oldLoan.balance;

      // Mark all pending/partial/overdue installments of old loan as paid
      await ScheduleModel.updateMany(
        { loan_id: params.settle_loan_id, status: { $ne: 'paid' } },
        { $set: { status: 'paid', paid_date: params.disbursal_date } }
      );

      // Record a settlement payment on the old loan
      const maxPayment = (await PaymentModel.findOne().sort({ id: -1 }).lean()) as any;
      const newPaymentId = (maxPayment?.id || 0) + 1;
      const paymentCode = `RCP-${year}-${String(newPaymentId).padStart(4, '0')}`;

      await PaymentModel.create({
        id: newPaymentId,
        loan_id: oldLoan.id,
        customer_id: oldLoan.customer_id,
        payment_code: paymentCode,
        amount: deductionAmount,
        payment_date: params.disbursal_date,
        payment_method: 'other',
        reference_no: `TOPUP-${loanCode}`,
        notes: `Loan closed & settled via Top-Up / Renewal Loan ${loanCode}`,
        principal_component: oldLoan.balance,
        interest_component: 0,
        penalty_component: 0,
        balance_after: 0,
        created_at: new Date().toISOString(),
      });

      // Close old loan
      await LoanModel.updateOne(
        { id: oldLoan.id },
        {
          $set: {
            total_paid: oldLoan.total_payable,
            balance: 0,
            status: 'completed',
            notes: (oldLoan.notes || '') + ` | Settled via Top-Up Loan ${loanCode} (Deducted ₹${deductionAmount})`,
          }
        }
      );

      notes = (notes ? notes + ' | ' : '') + `Top-Up / Refinance Loan. Old Loan ${oldLoan.loan_code} balance (₹${deductionAmount}) deducted & settled.`;
    }
  }

  const createdLoan = await LoanModel.create({
    id: newLoanId,
    customer_id: params.customer_id,
    loan_code: loanCode,
    principal: params.principal,
    interest_rate: params.interest_rate,
    rate_type: params.rate_type,
    calculation_type: params.calculation_type,
    frequency: params.frequency,
    tenure_value: params.tenure_value,
    tenure_unit: params.tenure_unit,
    total_interest: calculation.totalInterest,
    total_payable: calculation.totalPayable,
    total_paid: 0,
    balance: calculation.totalPayable,
    status: 'active',
    disbursal_date: params.disbursal_date,
    first_payment_date: params.first_payment_date,
    processing_fee: params.processing_fee || 0,
    collateral_details: params.collateral_details || '',
    notes,
    created_at: new Date().toISOString(),
  });

  const maxSched = (await ScheduleModel.findOne().sort({ id: -1 }).lean()) as any;
  let nextSchedId = (maxSched?.id || 0) + 1;

  const scheduleDocs = calculation.schedule.map((item) => ({
    id: nextSchedId++,
    loan_id: newLoanId,
    installment_number: item.installmentNumber,
    due_date: item.dueDate,
    principal_due: item.principalDue,
    interest_due: item.interestDue,
    total_due: item.totalDue,
    amount_paid: 0,
    status: 'pending',
  }));

  await ScheduleModel.insertMany(scheduleDocs);

  return (await getLoanById(newLoanId))!;
}

export async function recordPayment(params: {
  loan_id: number;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'other';
  reference_no?: string;
  notes?: string;
  penalty?: number;
}): Promise<{ payment: Payment; loan: Loan }> {
  await connectMongo();
  const loan = await getLoanById(params.loan_id);
  if (!loan) throw new Error('Loan not found');

  const paymentAmount = params.amount;
  const penalty = params.penalty || 0;

  const year = new Date().getFullYear();
  const maxPayment = (await PaymentModel.findOne().sort({ id: -1 }).lean()) as any;
  const newPaymentId = (maxPayment?.id || 0) + 1;
  const paymentCode = `RCP-${year}-${String(newPaymentId).padStart(4, '0')}`;

  const schedules = (await ScheduleModel.find({
    loan_id: params.loan_id,
    status: { $ne: 'paid' },
  }).sort({ installment_number: 1 })) as any[];

  let remainingPayment = paymentAmount;
  let totalPrincipalComponent = 0;
  let totalInterestComponent = 0;

  for (const sched of schedules) {
    if (remainingPayment <= 0) break;

    const currentPaid = sched.amount_paid || 0;
    const unpaidOnInstallment = sched.total_due - currentPaid;

    if (unpaidOnInstallment <= 0) continue;

    if (remainingPayment >= unpaidOnInstallment) {
      sched.amount_paid = sched.total_due;
      sched.status = 'paid';
      sched.paid_date = params.payment_date;
      await sched.save();

      remainingPayment -= unpaidOnInstallment;
      totalInterestComponent += sched.interest_due;
      totalPrincipalComponent += sched.principal_due;
    } else {
      sched.amount_paid = currentPaid + remainingPayment;
      sched.status = 'partial';
      sched.paid_date = params.payment_date;
      await sched.save();

      totalPrincipalComponent += remainingPayment;
      remainingPayment = 0;
      break;
    }
  }

  const newTotalPaid = loan.total_paid + paymentAmount;
  const newBalance = Math.max(0, loan.total_payable - newTotalPaid);
  const newStatus = newBalance <= 0 ? 'completed' : 'active';

  await LoanModel.updateOne(
    { id: loan.id },
    { $set: { total_paid: newTotalPaid, balance: newBalance, status: newStatus } }
  );

  const createdPayment = await PaymentModel.create({
    id: newPaymentId,
    loan_id: loan.id,
    customer_id: loan.customer_id,
    payment_code: paymentCode,
    amount: paymentAmount,
    payment_date: params.payment_date,
    payment_method: params.payment_method,
    reference_no: params.reference_no || '',
    notes: params.notes || '',
    principal_component: totalPrincipalComponent,
    interest_component: totalInterestComponent,
    penalty_component: penalty,
    balance_after: newBalance,
    created_at: new Date().toISOString(),
  });

  const updatedLoan = (await getLoanById(loan.id))!;

  return {
    payment: {
      ...(createdPayment.toObject() as any),
      customer_name: loan.customer.name,
      customer_phone: loan.customer.phone,
      loan_code: loan.loan_code,
    },
    loan: updatedLoan,
  };
}

export async function getPaymentById(id: number): Promise<Payment | null> {
  await connectMongo();
  const payment = (await PaymentModel.findOne({ id }).lean()) as any;
  if (!payment) return null;

  const customer = (await CustomerModel.findOne({ id: payment.customer_id }).lean()) as any;
  const loan = (await LoanModel.findOne({ id: payment.loan_id }).lean()) as any;

  return {
    ...payment,
    customer_name: customer?.name,
    customer_phone: customer?.phone,
    loan_code: loan?.loan_code,
  };
}

export async function getRecentPayments(limit = 10): Promise<Payment[]> {
  await connectMongo();
  const payments = (await PaymentModel.find().sort({ id: -1 }).limit(limit).lean()) as any[];
  const customers = (await CustomerModel.find().lean()) as any[];
  const loans = (await LoanModel.find().lean()) as any[];

  const custMap = new Map(customers.map((c: any) => [c.id, c]));
  const loanMap = new Map(loans.map((l: any) => [l.id, l]));

  return payments.map((p: any) => {
    const cust = custMap.get(p.customer_id);
    const loan = loanMap.get(p.loan_id);
    return {
      ...p,
      customer_name: cust?.name,
      customer_phone: cust?.phone,
      loan_code: loan?.loan_code,
    };
  });
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await connectMongo();
  const todayStr = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = todayStr.substring(0, 8) + '01';

  const loans = (await LoanModel.find().lean()) as any[];
  const customers = (await CustomerModel.find({ status: 'active' }).lean()) as any[];
  const schedules = (await ScheduleModel.find().lean()) as any[];
  const payments = (await PaymentModel.find().lean()) as any[];

  const totalDisbursed = loans.reduce((sum: number, l: any) => sum + (l.principal || 0), 0);
  const totalOutstanding = loans.reduce((sum: number, l: any) => sum + (l.balance || 0), 0);
  const totalRecovered = loans.reduce((sum: number, l: any) => sum + (l.total_paid || 0), 0);
  const totalInterestEarned = loans.reduce((sum: number, l: any) => sum + (l.total_interest || 0), 0);
  const activeLoansCount = loans.filter((l: any) => l.status === 'active').length;

  const overdueSchedules = schedules.filter((s: any) => s.due_date < todayStr && s.status !== 'paid');
  const overdueLoansSet = new Set(overdueSchedules.map((s: any) => s.loan_id));
  const overdueAmount = overdueSchedules.reduce((sum: number, s: any) => sum + (s.total_due - s.amount_paid), 0);

  const todaySchedules = schedules.filter((s: any) => s.due_date === todayStr && s.status !== 'paid');
  const todayDueAmount = todaySchedules.reduce((sum: number, s: any) => sum + (s.total_due - s.amount_paid), 0);

  const thisMonthExpected = schedules
    .filter((s: any) => s.due_date >= firstDayOfMonth && s.due_date <= todayStr)
    .reduce((sum: number, s: any) => sum + s.total_due, 0);

  const thisMonthCollected = payments
    .filter((p: any) => p.payment_date >= firstDayOfMonth)
    .reduce((sum: number, p: any) => sum + p.amount, 0);

  return {
    totalDisbursed,
    totalOutstanding,
    totalRecovered,
    totalInterestEarned,
    activeLoansCount,
    totalBorrowersCount: customers.length,
    overdueLoansCount: overdueLoansSet.size,
    overdueAmount,
    todayDueCount: todaySchedules.length,
    todayDueAmount,
    thisMonthExpected,
    thisMonthCollected,
  };
}

export async function getUpcomingAndOverdue(type: 'all' | 'today' | 'overdue' | 'upcoming' = 'all') {
  await connectMongo();
  const todayStr = new Date().toISOString().split('T')[0];

  let filter: any = { status: { $ne: 'paid' } };

  if (type === 'today') {
    filter.due_date = todayStr;
  } else if (type === 'overdue') {
    filter.due_date = { $lt: todayStr };
  } else if (type === 'upcoming') {
    filter.due_date = { $gt: todayStr };
  }

  const schedules = (await ScheduleModel.find(filter).sort({ due_date: 1 }).lean()) as any[];
  const loans = (await LoanModel.find().lean()) as any[];
  const customers = (await CustomerModel.find().lean()) as any[];

  const loanMap = new Map(loans.map((l: any) => [l.id, l]));
  const custMap = new Map(customers.map((c: any) => [c.id, c]));

  return schedules.map((s: any) => {
    const loan = loanMap.get(s.loan_id);
    const customer = loan ? custMap.get(loan.customer_id) : null;

    const diffMs = new Date(todayStr).getTime() - new Date(s.due_date).getTime();
    const daysOverdue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    return {
      ...s,
      loan_code: loan?.loan_code || '-',
      principal: loan?.principal || 0,
      loan_balance: loan?.balance || 0,
      customer_id: customer?.id || 0,
      customer_name: customer?.name || 'Customer',
      customer_phone: customer?.phone || '-',
      days_overdue: daysOverdue,
    };
  });
}
