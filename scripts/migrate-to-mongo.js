const mongoose = require('mongoose');
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const uri = process.env.MONGODB_URI || 'mongodb://mohit_app:mohit_app@ac-ft2q9tn-shard-00-00.iye3brk.mongodb.net:27017,ac-ft2q9tn-shard-00-01.iye3brk.mongodb.net:27017,ac-ft2q9tn-shard-00-02.iye3brk.mongodb.net:27017/loan_management?ssl=true&replicaSet=atlas-14av5y-shard-0&authSource=admin&appName=Cluster0';

async function migrate() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(uri);
  console.log('Connected to MongoDB Atlas!');

  const sqliteDb = new DatabaseSync(path.join(__dirname, '../data/loan_management.db'));

  // Define Mongoose Models
  const Customer = mongoose.models.Customer || mongoose.model('Customer', new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: String,
    address: String,
    id_type: String,
    id_number: String,
    guarantor_name: String,
    guarantor_phone: String,
    guarantor_relation: String,
    notes: String,
    status: { type: String, default: 'active' },
    created_at: { type: String, default: () => new Date().toISOString() }
  }));

  const Loan = mongoose.models.Loan || mongoose.model('Loan', new mongoose.Schema({
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
    collateral_details: String,
    notes: String,
    created_at: { type: String, default: () => new Date().toISOString() }
  }));

  const Schedule = mongoose.models.Schedule || mongoose.model('Schedule', new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    loan_id: { type: Number, required: true },
    installment_number: { type: Number, required: true },
    due_date: { type: String, required: true },
    principal_due: { type: Number, required: true },
    interest_due: { type: Number, required: true },
    total_due: { type: Number, required: true },
    amount_paid: { type: Number, default: 0 },
    status: { type: String, default: 'pending' },
    paid_date: String
  }));

  const Payment = mongoose.models.Payment || mongoose.model('Payment', new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    loan_id: { type: Number, required: true },
    customer_id: { type: Number, required: true },
    payment_code: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    payment_date: { type: String, required: true },
    payment_method: { type: String, default: 'cash' },
    reference_no: String,
    notes: String,
    principal_component: { type: Number, default: 0 },
    interest_component: { type: Number, default: 0 },
    penalty_component: { type: Number, default: 0 },
    balance_after: { type: Number, required: true },
    created_at: { type: String, default: () => new Date().toISOString() }
  }));

  const Settings = mongoose.models.Settings || mongoose.model('Settings', new mongoose.Schema({
    lender_name: { type: String, default: 'Apex Financial Services' },
    tagline: String,
    phone: String,
    email: String,
    address: String,
    currency: { type: String, default: '₹' },
    currency_code: { type: String, default: 'INR' },
    default_late_fee_percent: { type: Number, default: 2.0 },
    enable_whatsapp_reminders: { type: Number, default: 1 }
  }));

  // Clear existing collections in Mongo
  await Customer.deleteMany({});
  await Loan.deleteMany({});
  await Schedule.deleteMany({});
  await Payment.deleteMany({});
  await Settings.deleteMany({});

  // 1. Migrate Settings
  const settingsRows = sqliteDb.prepare('SELECT * FROM settings').all();
  if (settingsRows.length > 0) {
    await Settings.create(settingsRows[0]);
    console.log('Migrated settings to MongoDB.');
  }

  // 2. Migrate Customers
  const customers = sqliteDb.prepare('SELECT * FROM customers').all();
  if (customers.length > 0) {
    await Customer.insertMany(customers);
    console.log(`Migrated ${customers.length} customers to MongoDB.`);
  }

  // 3. Migrate Loans
  const loans = sqliteDb.prepare('SELECT * FROM loans').all();
  if (loans.length > 0) {
    await Loan.insertMany(loans);
    console.log(`Migrated ${loans.length} loans to MongoDB.`);
  }

  // 4. Migrate Schedules
  const schedules = sqliteDb.prepare('SELECT * FROM schedules').all();
  if (schedules.length > 0) {
    await Schedule.insertMany(schedules);
    console.log(`Migrated ${schedules.length} schedule installments to MongoDB.`);
  }

  // 5. Migrate Payments
  const payments = sqliteDb.prepare('SELECT * FROM payments').all();
  if (payments.length > 0) {
    await Payment.insertMany(payments);
    console.log(`Migrated ${payments.length} payments to MongoDB.`);
  }

  console.log('\nMigration to MongoDB Atlas completed successfully!');
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
