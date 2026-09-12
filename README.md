# LoanFlow - Loan Management System

A modern, full-featured web application designed for private money lenders, microfinance agencies, and loan businesses to manage borrowers, disburse loans, track repayment schedules/EMIs, record collections, send WhatsApp reminders, generate printable receipts, and monitor portfolio performance.

---

## Key Features

1. **Executive Financial Dashboard**
   - Live KPI cards: Total Capital Lent, Outstanding Balance, Total Recovered, Overdue Amount.
   - Today's Collection Queue with 1-click WhatsApp alerts and quick repayment collection.
   - Delinquency alert banner with days past due.
   - Live stream of recent collection receipts.

2. **Customer / Borrower CRM**
   - Full borrower profiles with contact details, address, and notes.
   - KYC identity verification (Aadhaar, PAN, Voter ID, Driving License, Passport).
   - Guarantor / Reference details (Name, Contact, Relationship).
   - Borrower 360 view: Lifetime borrowed, lifetime repaid, current outstanding balance, and full loan history.

3. **Multi-Scheme Loan Origination Engine**
   - **Flat Rate (Simple Interest)**: Fixed interest charged on principal throughout tenure.
   - **Reducing Balance (Amortized EMI)**: Monthly compound interest where interest reduces as principal is repaid.
   - **Interest-Only (Bullet)**: Borrower pays interest periodically, principal repaid at maturity.
   - Repayment frequencies: Monthly, Bi-weekly, Weekly, Daily.
   - Real-time live schedule preview table before disbursing.
   - Collateral and security tracking (Gold, Cheques, Property, Promissory notes).

4. **Collections, Repayments & Printable Receipts**
   - Record collections via Cash, UPI / GPay / PhonePe, Bank Transfer, or Cheque.
   - Automatic allocation towards overdue installments, interest, and principal.
   - **Official Printable Payment Receipt**: Includes lender branding, customer info, amount in numbers & words, breakdown, remaining balance, and signature lines.
   - **Printable Loan Statement**: Official loan ledger for borrowers.

5. **Delinquency Radar & 1-Click WhatsApp Alerts**
   - Overdue tracker with days past due and late fee calculation.
   - 1-Click WhatsApp Payment Reminder button with pre-formatted professional message.

6. **Customizable Settings & Local SQLite Database**
   - Customizable currency symbol (`₹`, `$`, `€`, `£`, etc.).
   - Lender company profile (Name, tagline, phone, address for receipts).
   - Embedded high-performance local SQLite database (`data/loan_management.db`).

---

## How to Run

### 1. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Build for Production
```bash
npm run build
npm start
```
