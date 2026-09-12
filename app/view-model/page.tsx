'use client';

import React, { useState, useEffect, useContext, useRef } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Landmark, 
  TrendingUp, 
  Wallet, 
  Receipt, 
  Users, 
  ArrowRight, 
  Calendar, 
  Sliders, 
  CheckCircle2, 
  Coins,
  ArrowUpRight,
  RefreshCw,
  Info
} from 'lucide-react';
import { generateSimulationData, SimulationMonthData } from '@/lib/simulation';
import { formatCurrency } from '@/lib/utils';
import { PaymentContext } from '@/components/AppLayout';

export default function ViewModelPage() {
  const { settings } = useContext(PaymentContext);
  const currency = settings?.currency || '₹';

  // Base parameters
  const [initialLoans, setInitialLoans] = useState(43);
  const [loanPrincipal, setLoanPrincipal] = useState(60000);
  const [fileCharge, setFileCharge] = useState(5000);
  const [monthlyEmi, setMonthlyEmi] = useState(4050);
  const [reinvestFileCharges, setReinvestFileCharges] = useState(false);

  // Stepper State
  const [currentMonthIndex, setCurrentMonthIndex] = useState(1); // 1 to 20
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate full 20 months data
  const simulationData = React.useMemo(() => {
    return generateSimulationData({
      initialLoans,
      sanctionedAmount: loanPrincipal,
      fileCharge,
      monthlyEmi,
      tenureMonths: 20,
      totalMonths: 20,
      reinvestFileCharges,
    });
  }, [initialLoans, loanPrincipal, fileCharge, monthlyEmi, reinvestFileCharges]);

  // Current active month data
  const currentMonthData: SimulationMonthData = simulationData[currentMonthIndex - 1] || simulationData[0];

  // Auto-play timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentMonthIndex((prev) => {
          if (prev >= simulationData.length) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, simulationData.length]);

  const handleNextMonth = () => {
    if (currentMonthIndex < simulationData.length) {
      setCurrentMonthIndex((prev) => prev + 1);
    }
  };

  const handlePrevMonth = () => {
    if (currentMonthIndex > 1) {
      setCurrentMonthIndex((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentMonthIndex(1);
  };

  const inHandRequired = loanPrincipal - fileCharge;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-600/10 text-indigo-700 font-bold text-xs uppercase tracking-wider border border-indigo-200">
              Interactive Investor Pitch View Model
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              100% On-Time EMI Assumption
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <span>Cashflow Multiplier & Reinvestment Simulator</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Har mahine aane wali ₹4,050 EMI collection se turant naye ₹60,000 ke loans pass hote hain (₹55,000 in-hand cash disbursed, ₹5,000 upfront file charge earned). Neeche date ko 1-1 mahina aage badha kar demo dekhein.
          </p>
        </div>

        {/* Model Presets Pill */}
        <div className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-sm text-xs space-y-1">
          <div className="flex items-center justify-between gap-4 text-slate-500">
            <span>Base Portfolio:</span>
            <strong className="text-slate-900">{initialLoans} Borrowers</strong>
          </div>
          <div className="flex items-center justify-between gap-4 text-slate-500">
            <span>Loan Scheme:</span>
            <strong className="text-slate-900">{formatCurrency(loanPrincipal, currency)} @ {formatCurrency(monthlyEmi, currency)}/mo</strong>
          </div>
          <div className="flex items-center justify-between gap-4 text-slate-500">
            <span>In-Hand Outflow:</span>
            <strong className="text-emerald-700">{formatCurrency(inHandRequired, currency)}</strong>
          </div>
        </div>
      </div>

      {/* Interactive Control Console (The Stepper) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 md:p-6 rounded-3xl shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Month Indicator & Date */}
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Simulated Timeline
            </span>
            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">
                Month {currentMonthData.month}
              </h2>
              <span className="text-base md:text-lg font-bold text-indigo-300">
                • {currentMonthData.dateStr}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {currentMonthData.activePayingLoans} borrowers paying EMI this month $\rightarrow$ {currentMonthData.newLoansFunded} new loan(s) sanctioned!
            </p>
          </div>

          {/* Stepper Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Prev Month */}
            <button
              onClick={handlePrevMonth}
              disabled={currentMonthIndex <= 1}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Prev Month</span>
            </button>

            {/* Next Month Button (Hero CTA) */}
            <button
              onClick={handleNextMonth}
              disabled={currentMonthIndex >= simulationData.length}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-30 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-900/40 flex items-center gap-2 transition active:scale-95 animate-pulse"
            >
              <span>Next Month (+1 Month)</span>
              <Play className="h-3.5 w-3.5 fill-current" />
            </button>

            {/* Auto-Play Toggle */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 ${
                isPlaying
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span>{isPlaying ? 'Pause' : 'Auto-Play'}</span>
            </button>

            {/* Reset */}
            <button
              onClick={handleReset}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition active:scale-95"
              title="Reset to Month 1"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Timeline Progress Scrubber */}
        <div className="mt-6 pt-4 border-t border-slate-800/80">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-400 mb-2">
            <span>Month 1 (Base 43 Loans)</span>
            <span className="text-indigo-300 font-bold">Month {currentMonthIndex} of 20</span>
            <span>Month 20 (Compounded Portfolio)</span>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            value={currentMonthIndex}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentMonthIndex(parseInt(e.target.value, 10));
            }}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>
      </div>

      {/* Month Snapshot Metrics (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Monthly EMI Collection */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Month {currentMonthData.month} EMI Inflow</span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Coins className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {formatCurrency(currentMonthData.emiCollected, currency)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            From <strong className="text-slate-800">{currentMonthData.activePayingLoans} borrowers</strong> @ {formatCurrency(monthlyEmi, currency)}
          </p>
        </div>

        {/* Metric 2: New Loans Funded */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">New Loans Passed</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Landmark className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">
            +{currentMonthData.newLoansFunded} New Loans
          </p>
          <p className="text-xs text-emerald-800 mt-1">
            Disbursed: <strong className="text-emerald-900">{formatCurrency(currentMonthData.newDisbursedInHand, currency)}</strong> in-hand
          </p>
        </div>

        {/* Metric 3: File Charges Earned this Month */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-purple-200/80 bg-purple-50/20 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">File Charges Profit</span>
            <div className="h-9 w-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-700 mt-2">
            +{formatCurrency(currentMonthData.newFileChargesEarned, currency)}
          </p>
          <p className="text-xs text-purple-600 mt-1">
            {currentMonthData.newLoansFunded} $\times$ {formatCurrency(fileCharge, currency)} upfront fee
          </p>
        </div>

        {/* Metric 4: Active Borrowers Next Month */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Next Month Borrowers</span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-600 mt-2">
            {currentMonthData.nextMonthActiveLoans} Borrowers
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Surplus cash: <strong className="text-slate-800">{formatCurrency(currentMonthData.surplusRemaining, currency)}</strong>
          </p>
        </div>
      </div>

      {/* Cashflow Reinvestment Formula Walkthrough */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <span>How Month {currentMonthData.month} Money Multiplied:</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Step 1: Inflow</span>
            <p className="text-sm font-black text-slate-900">{formatCurrency(currentMonthData.emiCollected, currency)}</p>
            <p className="text-slate-500">Collected from {currentMonthData.activePayingLoans} borrowers paying ₹4,050 EMI on time.</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Step 2: Available Pool</span>
            <p className="text-sm font-black text-indigo-600">{formatCurrency(currentMonthData.availablePool, currency)}</p>
            <p className="text-slate-500">Includes {formatCurrency(currentMonthData.surplusBefore, currency)} carryover surplus from previous month.</p>
          </div>

          <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-800">Step 3: New Loans Passed</span>
            <p className="text-sm font-black text-emerald-700">+{currentMonthData.newLoansFunded} Loans ({formatCurrency(currentMonthData.newDisbursedInHand, currency)})</p>
            <p className="text-emerald-800">Given to {currentMonthData.newLoansFunded} new borrowers at ₹55,000 in-hand cash each.</p>
          </div>

          <div className="p-3.5 bg-purple-50/70 rounded-xl border border-purple-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-purple-700">Step 4: Upfront Fee & Surplus</span>
            <p className="text-sm font-black text-purple-700">+{formatCurrency(currentMonthData.newFileChargesEarned, currency)} Fee</p>
            <p className="text-purple-800">Earned immediately + {formatCurrency(currentMonthData.surplusRemaining, currency)} surplus carried to next month.</p>
          </div>
        </div>
      </div>

      {/* 20-Month Compounding Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              <span>Full 20-Month Reinvestment Ledger Table</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any row or use the stepper above to jump to that month. Row with glowing border is the current simulated month.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span className="h-3 w-3 rounded-full bg-indigo-600 inline-block"></span>
              <span>Current Simulation Month</span>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[950px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Timeline</th>
                <th className="py-3.5 px-4">Active Borrowers</th>
                <th className="py-3.5 px-4">Monthly EMI Inflow</th>
                <th className="py-3.5 px-4">Available Fund</th>
                <th className="py-3.5 px-4 text-emerald-800 bg-emerald-50/50">New Loans Passed</th>
                <th className="py-3.5 px-4">Cash Disbursed</th>
                <th className="py-3.5 px-4 text-purple-800 bg-purple-50/50">File Charge Earned</th>
                <th className="py-3.5 px-4">Surplus Carryover</th>
                <th className="py-3.5 px-4">Next Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {simulationData.map((row) => {
                const isCurrent = row.month === currentMonthIndex;

                return (
                  <tr
                    key={row.month}
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentMonthIndex(row.month);
                    }}
                    className={`cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-indigo-50/90 font-bold text-slate-900 border-l-4 border-indigo-600 shadow-sm'
                        : 'hover:bg-slate-50/80 text-slate-700'
                    }`}
                  >
                    {/* Month & Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`h-6 w-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                          isCurrent ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700'
                        }`}>
                          M{row.month}
                        </span>
                        <div>
                          <p className="font-extrabold text-slate-900 text-xs">Month {row.month}</p>
                          <p className="text-[10px] text-slate-400 font-normal">{row.dateStr}</p>
                        </div>
                      </div>
                    </td>

                    {/* Active Paying Borrowers */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-extrabold text-slate-900">{row.activePayingLoans}</span> Borrowers
                    </td>

                    {/* EMI Inflow */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-blue-700 font-bold">
                      {formatCurrency(row.emiCollected, currency)}
                    </td>

                    {/* Available Fund */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                      {formatCurrency(row.availablePool, currency)}
                    </td>

                    {/* New Loans Funded */}
                    <td className="py-3.5 px-4 whitespace-nowrap bg-emerald-50/40">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-black text-xs">
                        +{row.newLoansFunded} Loans
                      </span>
                    </td>

                    {/* In-Hand Disbursed Outflow */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-emerald-700 font-bold">
                      {formatCurrency(row.newDisbursedInHand, currency)}
                    </td>

                    {/* File Charge Earned */}
                    <td className="py-3.5 px-4 whitespace-nowrap bg-purple-50/40 text-purple-700 font-extrabold">
                      +{formatCurrency(row.newFileChargesEarned, currency)}
                    </td>

                    {/* Surplus Remaining */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-xs">
                      {formatCurrency(row.surplusRemaining, currency)}
                    </td>

                    {/* Next Active */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-black text-slate-900 text-xs">{row.nextMonthActiveLoans}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
