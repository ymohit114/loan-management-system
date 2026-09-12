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
  Info,
  AlertTriangle,
  Settings,
  Plus,
  Minus,
  Check,
  Search,
  UserPlus,
  X,
  UserCheck,
  CheckSquare,
  Square,
  CalendarCheck
} from 'lucide-react';
import { generateSimulationData, SimulationMonthData } from '@/lib/simulation';
import { BASE_43_BORROWERS, BorrowerProfile } from '@/lib/borrowersData';
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

  // Dynamic Refinancing Configuration (Configurable for ANY Month: 16, 17, 18...)
  const [refinanceEnabled, setRefinanceEnabled] = useState(true);
  const [refinanceAtMonth, setRefinanceAtMonth] = useState(16); // User can change to 16, 17, 18, 19, etc.
  const [refinanceCount, setRefinanceCount] = useState(8);
  const [refinanceSanctioned, setRefinanceSanctioned] = useState(80000);
  const [refinanceFileCharge, setRefinanceFileCharge] = useState(6000);
  const [refinanceMonthlyEmi, setRefinanceMonthlyEmi] = useState(4050);
  const [refinanceTenureMonths, setRefinanceTenureMonths] = useState(30);
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  // Specific Borrowers Selection for Refinancing
  const [selectedBorrowerIds, setSelectedBorrowerIds] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8]);
  const [isBorrowerModalOpen, setIsBorrowerModalOpen] = useState(false);
  const [borrowerSearchQuery, setBorrowerSearchQuery] = useState('');

  // Stepper State
  const [currentMonthIndex, setCurrentMonthIndex] = useState(1); // 1 to 30
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize count with selected borrowers
  const handleToggleBorrower = (id: number) => {
    setSelectedBorrowerIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      const count = Math.max(1, next.length);
      setRefinanceCount(count);
      return next;
    });
  };

  const handleSelectFirstN = (n: number) => {
    const ids = BASE_43_BORROWERS.slice(0, n).map((b) => b.id);
    setSelectedBorrowerIds(ids);
    setRefinanceCount(ids.length);
  };

  const handleSetRefinanceCount = (count: number) => {
    const safeCount = Math.max(1, Math.min(43, count));
    setRefinanceCount(safeCount);
    setSelectedBorrowerIds(BASE_43_BORROWERS.slice(0, safeCount).map((b) => b.id));
  };

  // Generate full 30 months data dynamically based on refinanceAtMonth
  const simulationData = React.useMemo(() => {
    return generateSimulationData({
      initialLoans,
      sanctionedAmount: loanPrincipal,
      fileCharge,
      monthlyEmi,
      tenureMonths: 20,
      totalMonths: 30, // Full 30 months
      reinvestFileCharges,
      refinanceEnabled,
      refinanceAtMonth,
      refinanceCount,
      refinanceSanctioned,
      refinanceFileCharge,
      refinanceMonthlyEmi,
      refinanceTenureMonths,
    });
  }, [
    initialLoans,
    loanPrincipal,
    fileCharge,
    monthlyEmi,
    reinvestFileCharges,
    refinanceEnabled,
    refinanceAtMonth,
    refinanceCount,
    refinanceSanctioned,
    refinanceFileCharge,
    refinanceMonthlyEmi,
    refinanceTenureMonths,
  ]);

  // Current active month data
  const currentMonthData: SimulationMonthData = simulationData[currentMonthIndex - 1] || simulationData[0];

  // Auto-play timer (auto-pauses at whichever refinance month is chosen)
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentMonthIndex((prev) => {
          if (prev === refinanceAtMonth - 1) {
            // Auto pause at refinance milestone so presenter can discuss
            setIsPlaying(false);
            return refinanceAtMonth;
          }
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
  }, [isPlaying, simulationData.length, refinanceAtMonth]);

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

  // DYNAMIC REFINANCING CALCULATIONS BASED ON SELECTED MONTH (Month 16, 17, 18...)
  const oldEmisLeft = Math.max(0, 20 - refinanceAtMonth);
  const oldSettledPerPerson = oldEmisLeft * monthlyEmi;
  const netInHandPerPerson = refinanceSanctioned - refinanceFileCharge - oldSettledPerPerson;
  const totalRefinanceCashRequired = selectedBorrowerIds.length * netInHandPerPerson;
  
  // Find data for the chosen refinancing month to check available pool
  const refinanceMonthData = simulationData.find((d) => d.month === refinanceAtMonth);
  const targetAvailablePool = refinanceMonthData ? refinanceMonthData.availablePool : 0;
  const maxAffordableBorrowers = netInHandPerPerson > 0 ? Math.floor(targetAvailablePool / netInHandPerPerson) : 0;
  const isBudgetExceeded = totalRefinanceCashRequired > targetAvailablePool;
  const budgetDeficitAmount = Math.max(0, totalRefinanceCashRequired - targetAvailablePool);

  // Filter borrowers in search modal
  const filteredBorrowers = BASE_43_BORROWERS.filter((b) => 
    b.name.toLowerCase().includes(borrowerSearchQuery.toLowerCase()) ||
    b.phone.includes(borrowerSearchQuery) ||
    b.area.toLowerCase().includes(borrowerSearchQuery.toLowerCase())
  );

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
            Har mahine aane wali EMI collection se naye loans pass hote hain. <strong>Month {refinanceAtMonth}</strong> (ya aapke pasandida kisi bhi month) me purane customers ko <strong>₹80,000</strong> ka renewal loan diya jaata hai jisme se baaki bachi EMIs auto-deduct hoti hain.
          </p>
        </div>

        {/* Model Presets Pill & Refinance Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="p-3 bg-white border border-slate-200/80 rounded-2xl shadow-sm text-xs space-y-1">
            <div className="flex items-center justify-between gap-4 text-slate-500">
              <span>Base Portfolio:</span>
              <strong className="text-slate-900">{initialLoans} Borrowers</strong>
            </div>
            <div className="flex items-center justify-between gap-4 text-slate-500">
              <span>Standard Loan:</span>
              <strong className="text-slate-900">{formatCurrency(loanPrincipal, currency)} @ {formatCurrency(monthlyEmi, currency)}/mo</strong>
            </div>
            <div className="flex items-center justify-between gap-4 text-slate-500">
              <span>Refinance Active:</span>
              <strong className="text-amber-700">Month {refinanceAtMonth} ({selectedBorrowerIds.length} Persons @ {formatCurrency(refinanceSanctioned, currency)})</strong>
            </div>
          </div>

          <button
            onClick={() => setShowConfigPanel(!showConfigPanel)}
            className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
            title="Configure Refinancing Parameters"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Refinance Setup</span>
          </button>
        </div>
      </div>

      {/* Interactive Control Console (The Stepper) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 md:p-6 rounded-3xl shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Month Indicator & Date */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Simulated Timeline
              </span>
              {currentMonthIndex === refinanceAtMonth && (
                <span className="px-2 py-0.5 bg-amber-500 text-slate-950 rounded-full font-black text-[10px] animate-pulse">
                  🌟 Month {refinanceAtMonth} Refinancing Active
                </span>
              )}
            </div>
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

            {/* Jump to Refinancing Month Shortcut */}
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentMonthIndex(refinanceAtMonth);
              }}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 ${
                currentMonthIndex === refinanceAtMonth
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Month {refinanceAtMonth} Setup</span>
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
            <span className="text-amber-300 font-bold">Month {refinanceAtMonth} (Refinance Event)</span>
            <span className="text-indigo-300 font-bold">Month {currentMonthIndex} of {simulationData.length}</span>
            <span>Month 30 (Matured Cycle)</span>
          </div>
          <input
            type="range"
            min="1"
            max={simulationData.length}
            value={currentMonthIndex}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentMonthIndex(parseInt(e.target.value, 10));
            }}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>
      </div>

      {/* DYNAMIC REFINANCING COMMAND CENTER (Visible when currentMonthIndex === refinanceAtMonth or config panel is toggled) */}
      {(currentMonthIndex === refinanceAtMonth || showConfigPanel) && (
        <div className="p-5 md:p-6 bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 rounded-3xl border-2 border-amber-400/80 shadow-lg space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
          {/* Header & Month Chooser */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-amber-200">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 fill-current" />
                  Month {refinanceAtMonth} Refinancing Milestone
                </span>
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                  {refinanceAtMonth} EMIs Paid • {oldEmisLeft} EMIs Remaining
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-1">
                Refinancing Month & Cash Pool Budget Control
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Aap decide karein ki kis month me renewal loan dena hai (16, 17, 18 etc.) aur kin borrowers ko select karna hai.
              </p>
            </div>

            {/* Quick Month Switcher Pills */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-amber-300 shadow-sm">
                <span className="text-[10px] font-black uppercase text-slate-400 px-2">Trigger Month:</span>
                {[15, 16, 17, 18, 19, 20].map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setRefinanceAtMonth(m);
                      setCurrentMonthIndex(m);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-black transition ${
                      refinanceAtMonth === m
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-600 hover:bg-amber-50'
                    }`}
                  >
                    M{m}
                  </button>
                ))}
              </div>

              {currentMonthIndex !== refinanceAtMonth && (
                <button
                  onClick={() => setRefinanceAtMonth(currentMonthIndex)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition whitespace-nowrap"
                >
                  Set to M{currentMonthIndex}
                </button>
              )}
            </div>
          </div>

          {/* REAL-TIME BUDGET WARNING ALERT (POOLS DEFICIT CHECK) */}
          {isBudgetExceeded ? (
            <div className="p-4 bg-rose-50 border-2 border-rose-400 rounded-2xl text-rose-900 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm animate-pulse">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-rose-900 uppercase tracking-wide">
                    ⚠️ Month {refinanceAtMonth} Collection Pool Exceeded! (Cash Shortage Alert)
                  </h4>
                  <p className="text-xs text-rose-700 mt-1">
                    Aapne <strong>{selectedBorrowerIds.length} customers</strong> select kiye hain jinko in-hand dene ke liye <strong>{formatCurrency(totalRefinanceCashRequired, currency)}</strong> cash chahiye, jabki Month {refinanceAtMonth} ka available collection pool sirf <strong>{formatCurrency(targetAvailablePool, currency)}</strong> hai.
                  </p>
                  <p className="text-xs font-bold text-rose-800 mt-1">
                    Shortage (Deficit): <span className="underline">{formatCurrency(budgetDeficitAmount, currency)}</span>
                  </p>
                </div>
              </div>

              {/* Action Button to Auto-Fix */}
              <button
                onClick={() => handleSetRefinanceCount(maxAffordableBorrowers)}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md transition whitespace-nowrap active:scale-95"
              >
                Auto-Adjust to Max Affordable ({maxAffordableBorrowers} Borrowers)
              </button>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50/90 border border-emerald-300 rounded-2xl text-emerald-900 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-emerald-900 uppercase">
                    ✅ Month {refinanceAtMonth} Cash Pool Budget Approved & Sufficient!
                  </p>
                  <p className="text-xs text-emerald-700">
                    Month {refinanceAtMonth} Pool: <strong>{formatCurrency(targetAvailablePool, currency)}</strong> | Required for {selectedBorrowerIds.length} Renewals: <strong>{formatCurrency(totalRefinanceCashRequired, currency)}</strong> | Surplus: <strong>{formatCurrency(targetAvailablePool - totalRefinanceCashRequired, currency)}</strong>
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg shrink-0">
                Max Safe: {maxAffordableBorrowers} Borrowers
              </span>
            </div>
          )}

          {/* DYNAMIC INPUTS FORM GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Input 1: Refinance Month */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase">Refinance Month</label>
              <div className="relative mt-1">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={refinanceAtMonth}
                  onChange={(e) => setRefinanceAtMonth(Math.max(1, Math.min(30, parseInt(e.target.value, 10) || 16)))}
                  className="w-full text-center font-black text-indigo-700 text-base border border-slate-200 rounded-lg py-1 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-400 text-center">Month {refinanceAtMonth} par trigger hoga</p>
            </div>

            {/* Input 2: Persons to Renew */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-600 uppercase">Borrowers</label>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                  {selectedBorrowerIds.length}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <button
                  onClick={() => handleSetRefinanceCount(selectedBorrowerIds.length - 1)}
                  className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold transition"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <input
                  type="number"
                  min="1"
                  max="43"
                  value={refinanceCount}
                  onChange={(e) => handleSetRefinanceCount(parseInt(e.target.value, 10) || 1)}
                  className="w-full text-center font-black text-slate-900 text-base border border-slate-200 rounded-lg py-0.5 focus:ring-2 focus:ring-amber-500 outline-none"
                />
                <button
                  onClick={() => handleSetRefinanceCount(selectedBorrowerIds.length + 1)}
                  className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold transition"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              
              <button
                type="button"
                onClick={() => setIsBorrowerModalOpen(true)}
                className="w-full mt-1.5 px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 shadow-sm transition active:scale-95"
              >
                <Users className="h-3 w-3" />
                <span>Pick ({selectedBorrowerIds.length})</span>
              </button>
            </div>

            {/* Input 3: New Sanctioned Loan */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase">Sanctioned</label>
              <div className="relative mt-1">
                <span className="absolute left-2 top-1.5 text-xs font-bold text-slate-400">{currency}</span>
                <input
                  type="number"
                  step="5000"
                  value={refinanceSanctioned}
                  onChange={(e) => setRefinanceSanctioned(parseInt(e.target.value, 10) || 0)}
                  className="w-full pl-6 pr-2 font-black text-slate-900 text-base border border-slate-200 rounded-lg py-1 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-400">Approved loan</p>
            </div>

            {/* Input 4: New File Charge */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase">File Charge</label>
              <div className="relative mt-1">
                <span className="absolute left-2 top-1.5 text-xs font-bold text-slate-400">{currency}</span>
                <input
                  type="number"
                  step="500"
                  value={refinanceFileCharge}
                  onChange={(e) => setRefinanceFileCharge(parseInt(e.target.value, 10) || 0)}
                  className="w-full pl-6 pr-2 font-black text-purple-700 text-base border border-slate-200 rounded-lg py-1 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <p className="text-[10px] text-purple-600">Upfront instant fee</p>
            </div>

            {/* Input 5: New Monthly EMI */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase">New EMI</label>
              <div className="relative mt-1">
                <span className="absolute left-2 top-1.5 text-xs font-bold text-slate-400">{currency}</span>
                <input
                  type="number"
                  step="50"
                  value={refinanceMonthlyEmi}
                  onChange={(e) => setRefinanceMonthlyEmi(parseInt(e.target.value, 10) || 0)}
                  className="w-full pl-6 pr-2 font-black text-blue-700 text-base border border-slate-200 rounded-lg py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <p className="text-[10px] text-blue-600">Month {refinanceAtMonth + 1} se start</p>
            </div>

            {/* Input 6: Tenure */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase">Duration</label>
              <div className="relative mt-1">
                <input
                  type="number"
                  min="6"
                  max="60"
                  value={refinanceTenureMonths}
                  onChange={(e) => setRefinanceTenureMonths(parseInt(e.target.value, 10) || 30)}
                  className="w-full pr-12 pl-2 font-black text-slate-900 text-base border border-slate-200 rounded-lg py-1 focus:ring-2 focus:ring-amber-500 outline-none"
                />
                <span className="absolute right-2 top-1.5 text-xs font-bold text-slate-400">Mo</span>
              </div>
              <p className="text-[10px] text-slate-400">{refinanceTenureMonths} installments</p>
            </div>
          </div>

          {/* SELECTED BORROWERS CHIPS STRIP */}
          <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-black">
                  {selectedBorrowerIds.length}
                </span>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  Selected Customers for ₹80,000 Refinance at Month {refinanceAtMonth} ({selectedBorrowerIds.length} Borrowers)
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSelectFirstN(8)}
                  className="text-[11px] font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition"
                >
                  Select First 8 Default
                </button>
                <button
                  onClick={() => setIsBorrowerModalOpen(true)}
                  className="text-[11px] font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition flex items-center gap-1"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>+ Add / Choose People</span>
                </button>
              </div>
            </div>

            {/* Grid of Selected Borrowers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              {selectedBorrowerIds.map((bId) => {
                const borrower = BASE_43_BORROWERS.find((b) => b.id === bId);
                if (!borrower) return null;

                return (
                  <div
                    key={borrower.id}
                    className="p-2.5 bg-slate-50 hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 rounded-xl flex items-center justify-between gap-2 transition text-xs group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-7 w-7 rounded-lg bg-amber-500 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0">
                        {borrower.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-slate-900 text-xs truncate">{borrower.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{borrower.phone}</p>
                      </div>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-black text-emerald-700 block">
                        +{currency}{netInHandPerPerson.toLocaleString('en-IN')}
                      </span>
                      <button
                        onClick={() => handleToggleBorrower(borrower.id)}
                        className="text-[10px] text-slate-400 hover:text-rose-600 transition"
                        title="Remove from renewal"
                      >
                        <X className="h-3 w-3 inline" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PER-BORROWER & COMBINED DEDUCTION AUDIT CARD (DYNAMIC MONTH MATH) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Card: 1 Customer Formula */}
            <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-sm space-y-2 text-xs">
              <span className="text-[11px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="h-4 w-4" />
                Per Customer Net In-Hand Formula (At Month {refinanceAtMonth})
              </span>
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-slate-600">
                  <span>1. New Approved Loan:</span>
                  <strong className="text-slate-900">+{formatCurrency(refinanceSanctioned, currency)}</strong>
                </div>
                <div className="flex justify-between text-purple-700">
                  <span>2. New File Charge Kept:</span>
                  <strong>-{formatCurrency(refinanceFileCharge, currency)}</strong>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>
                    3. Old {oldEmisLeft} Remaining EMIs Deducted ({oldEmisLeft} $\times$ {formatCurrency(monthlyEmi, currency)}):
                  </span>
                  <strong>-{formatCurrency(oldSettledPerPerson, currency)}</strong>
                </div>
                <div className="border-t border-slate-200 pt-1.5 flex justify-between text-sm font-black text-emerald-800">
                  <span>Net In-Hand Cash Given to Customer:</span>
                  <span className="text-base text-emerald-700">{formatCurrency(netInHandPerPerson, currency)}</span>
                </div>
              </div>
            </div>

            {/* Right Card: All Borrowers Impact on Pool */}
            <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-sm space-y-2 text-xs">
              <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="h-4 w-4 text-indigo-600" />
                Month {refinanceAtMonth} Cashflow Impact ({selectedBorrowerIds.length} Borrowers)
              </span>
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-slate-600">
                  <span>Total Sanctioned ({selectedBorrowerIds.length} $\times$ {formatCurrency(refinanceSanctioned, currency)}):</span>
                  <strong className="text-slate-900">{formatCurrency(selectedBorrowerIds.length * refinanceSanctioned, currency)}</strong>
                </div>
                <div className="flex justify-between text-purple-700 font-bold">
                  <span>Instant File Charge Profit ({selectedBorrowerIds.length} $\times$ {formatCurrency(refinanceFileCharge, currency)}):</span>
                  <span>+{formatCurrency(selectedBorrowerIds.length * refinanceFileCharge, currency)}</span>
                </div>
                <div className="flex justify-between text-blue-700">
                  <span>Old Loans Recovered / Settled:</span>
                  <strong>{formatCurrency(selectedBorrowerIds.length * oldSettledPerPerson, currency)}</strong>
                </div>
                <div className="border-t border-slate-200 pt-1.5 flex justify-between text-sm font-black text-slate-900">
                  <span>Net In-Hand Cash Paid from Month {refinanceAtMonth} Pool:</span>
                  <span className={isBudgetExceeded ? 'text-rose-600 text-base' : 'text-indigo-600 text-base'}>
                    {formatCurrency(totalRefinanceCashRequired, currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BORROWER SELECTION MODAL */}
      {isBorrowerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-amber-500" />
                  <span>Select Borrowers for Month {refinanceAtMonth} Refinancing</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Initial 43 customers me se choose karein jinko ₹80,000 ka naya loan pass karna hai.
                </p>
              </div>
              <button
                onClick={() => setIsBorrowerModalOpen(false)}
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search Bar & Quick Select */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search borrower by name, phone, area..."
                    value={borrowerSearchQuery}
                    onChange={(e) => setBorrowerSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSelectFirstN(8)}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-sm transition whitespace-nowrap"
                  >
                    Select Top 8 (Default)
                  </button>
                  <button
                    onClick={() => {
                      setSelectedBorrowerIds([]);
                      setRefinanceCount(1);
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl border border-slate-200 transition"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Status Alert Inside Modal */}
              <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 ${
                isBudgetExceeded 
                  ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                <span>Selected: {selectedBorrowerIds.length} Borrowers ({formatCurrency(selectedBorrowerIds.length * netInHandPerPerson, currency)} in-hand cash)</span>
                <span>Max Affordable in M{refinanceAtMonth}: {maxAffordableBorrowers} Borrowers</span>
              </div>
            </div>

            {/* Scrollable List of 43 Customers */}
            <div className="p-4 overflow-y-auto divide-y divide-slate-100 flex-1 space-y-1">
              {filteredBorrowers.map((borrower) => {
                const isSelected = selectedBorrowerIds.includes(borrower.id);

                return (
                  <div
                    key={borrower.id}
                    onClick={() => handleToggleBorrower(borrower.id)}
                    className={`p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition ${
                      isSelected
                        ? 'bg-amber-50/80 border border-amber-300'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-6 w-6 rounded-lg flex items-center justify-center transition ${
                        isSelected ? 'bg-amber-500 text-slate-950' : 'border border-slate-300 bg-white'
                      }`}>
                        {isSelected && <Check className="h-4 w-4 stroke-[3]" />}
                      </div>

                      <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {borrower.id}
                      </div>

                      <div>
                        <p className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{borrower.name}</span>
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold border border-emerald-200">
                            {refinanceAtMonth} EMIs Paid
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-500">{borrower.phone} • {borrower.area}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-black text-emerald-700">
                        +{formatCurrency(netInHandPerPerson, currency)}
                      </p>
                      <p className="text-[10px] text-slate-400">Net in-hand</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between rounded-b-3xl">
              <div>
                <p className="text-xs font-black text-slate-900">
                  {selectedBorrowerIds.length} Borrowers Selected
                </p>
                <p className="text-[10px] text-slate-500">
                  Total Disbursed: {formatCurrency(selectedBorrowerIds.length * netInHandPerPerson, currency)}
                </p>
              </div>

              <button
                onClick={() => setIsBorrowerModalOpen(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition active:scale-95"
              >
                Done & Apply ({selectedBorrowerIds.length} People)
              </button>
            </div>
          </div>
        </div>
      )}

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
            From <strong className="text-slate-800">{currentMonthData.activePayingLoans} borrowers</strong> paying on time
          </p>
        </div>

        {/* Metric 2: New Loans Funded */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              {currentMonthData.month === refinanceAtMonth ? 'Disbursal Summary' : 'New Loans Passed'}
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Landmark className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">
            {currentMonthData.month === refinanceAtMonth ? (
              <span>+{selectedBorrowerIds.length} Renewals</span>
            ) : (
              <span>+{currentMonthData.newLoansFunded} Loans</span>
            )}
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
            Instant upfront fee collected
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
            <p className="text-slate-500">Collected from {currentMonthData.activePayingLoans} borrowers paying EMI on time.</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Step 2: Available Pool</span>
            <p className="text-sm font-black text-indigo-600">{formatCurrency(currentMonthData.availablePool, currency)}</p>
            <p className="text-slate-500">Includes {formatCurrency(currentMonthData.surplusBefore, currency)} carryover surplus from previous month.</p>
          </div>

          <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-800">
              {currentMonthData.month === refinanceAtMonth ? 'Step 3: Loans & Renewals' : 'Step 3: New Loans Passed'}
            </span>
            <p className="text-sm font-black text-emerald-700">
              {formatCurrency(currentMonthData.newDisbursedInHand, currency)} Disbursed
            </p>
            <p className="text-emerald-800">
              {currentMonthData.month === refinanceAtMonth 
                ? `${selectedBorrowerIds.length} renewed @ ${formatCurrency(netInHandPerPerson, currency)} in-hand + ${currentMonthData.newLoansFunded} regular loans` 
                : `${currentMonthData.newLoansFunded} new loans @ ₹55,000 in-hand cash`}
            </p>
          </div>

          <div className="p-3.5 bg-purple-50/70 rounded-xl border border-purple-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-purple-700">Step 4: Upfront Fee & Surplus</span>
            <p className="text-sm font-black text-purple-700">+{formatCurrency(currentMonthData.newFileChargesEarned, currency)} Fee</p>
            <p className="text-purple-800">Earned immediately + {formatCurrency(currentMonthData.surplusRemaining, currency)} surplus carried forward.</p>
          </div>
        </div>
      </div>

      {/* 30-Month Compounding Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              <span>Full 30-Month Compounding & Refinancing Ledger Table</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any row to jump to that month. Row with glowing border is the current simulated month. Month {refinanceAtMonth} features refinancing milestone.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-amber-700 font-bold bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
              <Sparkles className="h-3 w-3" />
              <span>Month {refinanceAtMonth} = Refinancing Event</span>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[980px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Timeline</th>
                <th className="py-3.5 px-4">Active Borrowers</th>
                <th className="py-3.5 px-4">Monthly EMI Inflow</th>
                <th className="py-3.5 px-4">Available Fund</th>
                <th className="py-3.5 px-4 text-emerald-800 bg-emerald-50/50">Disbursal Action</th>
                <th className="py-3.5 px-4">Cash Outflow</th>
                <th className="py-3.5 px-4 text-purple-800 bg-purple-50/50">File Charge Earned</th>
                <th className="py-3.5 px-4">Surplus Carryover</th>
                <th className="py-3.5 px-4">Next Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {simulationData.map((row) => {
                const isCurrent = row.month === currentMonthIndex;
                const isRefinanceMonth = row.month === refinanceAtMonth;

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
                        : isRefinanceMonth
                        ? 'bg-amber-50/40 hover:bg-amber-50/70 border-l-4 border-amber-400'
                        : 'hover:bg-slate-50/80 text-slate-700'
                    }`}
                  >
                    {/* Month & Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`h-6 w-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                          isCurrent
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : isRefinanceMonth
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          M{row.month}
                        </span>
                        <div>
                          <p className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                            <span>Month {row.month}</span>
                            {isRefinanceMonth && (
                              <span className="px-1.5 py-0.2 bg-amber-200 text-amber-900 text-[10px] font-black rounded">
                                Refinance
                              </span>
                            )}
                          </p>
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

                    {/* Disbursal Action */}
                    <td className="py-3.5 px-4 whitespace-nowrap bg-emerald-50/40">
                      {isRefinanceMonth ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-200 text-amber-950 font-black text-xs">
                            🔄 {selectedBorrowerIds.length} Renewed (₹80k)
                          </span>
                          {row.newLoansFunded > 0 && (
                            <span className="text-[10px] text-emerald-700 font-bold">
                              +{row.newLoansFunded} regular loans
                            </span>
                          )}
                          {row.refinanceIsDeficit && (
                            <span className="text-[10px] text-rose-600 font-black">
                              ⚠️ Pool Deficit
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-black text-xs">
                          +{row.newLoansFunded} Loans
                        </span>
                      )}
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



