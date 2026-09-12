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
import { generateSimulationData, SimulationMonthData, MonthRefinanceConfig } from '@/lib/simulation';
import { BASE_43_BORROWERS, ALL_BORROWERS, getBorrowerById, BorrowerProfile } from '@/lib/borrowersData';
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
  const [activeConfigMonth, setActiveConfigMonth] = useState(16); // Currently active month in control center
  const [refinanceSanctioned, setRefinanceSanctioned] = useState(80000);
  const [refinanceFileCharge, setRefinanceFileCharge] = useState(6000);
  const [refinanceMonthlyEmi, setRefinanceMonthlyEmi] = useState(4050);
  const [refinanceTenureMonths, setRefinanceTenureMonths] = useState(30);
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  // Specific Borrowers Selection for each Refinancing Month (e.g. Month 16, Month 17...)
  const [monthlyBorrowersMap, setMonthlyBorrowersMap] = useState<Record<number, number[]>>({
    16: [1, 2, 3, 4, 5, 6, 7, 8],
  });
  const [isBorrowerModalOpen, setIsBorrowerModalOpen] = useState(false);
  const [borrowerSearchQuery, setBorrowerSearchQuery] = useState('');

  // Stepper State & Simulation Horizon (Dynamic: 30, 48, 60, 120+ months)
  const [totalSimulationMonths, setTotalSimulationMonths] = useState(60);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tableDisplayMode, setTableDisplayMode] = useState<'stepper' | 'all'>('stepper');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Active configured months list (e.g. [16, 17])
  const configuredRefinanceMonths = React.useMemo(() => {
    return Object.keys(monthlyBorrowersMap)
      .map(Number)
      .filter((m) => monthlyBorrowersMap[m] && monthlyBorrowersMap[m].length > 0)
      .sort((a, b) => a - b);
  }, [monthlyBorrowersMap]);

  // Which borrowers are assigned in ANY month other than the current activeConfigMonth
  const assignedInOtherMonths = React.useMemo(() => {
    const map = new Map<number, number>(); // borrowerId -> month
    Object.entries(monthlyBorrowersMap).forEach(([mStr, ids]) => {
      const m = parseInt(mStr, 10);
      if (m !== activeConfigMonth) {
        ids.forEach((id) => map.set(id, m));
      }
    });
    return map;
  }, [monthlyBorrowersMap, activeConfigMonth]);

  // Current borrowers for activeConfigMonth
  const activeSelectedBorrowerIds = monthlyBorrowersMap[activeConfigMonth] || [];

  // Toggle borrower in activeConfigMonth
  const handleToggleBorrowerForActiveMonth = (id: number) => {
    // If assigned in another month, ignore
    if (assignedInOtherMonths.has(id)) return;

    setMonthlyBorrowersMap((prev) => {
      const current = prev[activeConfigMonth] || [];
      const updated = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];
      return {
        ...prev,
        [activeConfigMonth]: updated,
      };
    });
  };

  // Select next N available borrowers for activeConfigMonth
  const handleSelectNextAvailableForActiveMonth = (count: number = 8) => {
    const assignedElsewhere = new Set<number>();
    Object.entries(monthlyBorrowersMap).forEach(([mStr, ids]) => {
      if (parseInt(mStr, 10) !== activeConfigMonth) {
        ids.forEach((id) => assignedElsewhere.add(id));
      }
    });

    const available = ALL_BORROWERS.filter((b) => !assignedElsewhere.has(b.id));
    const chosen = available.slice(0, count).map((b) => b.id);
    setMonthlyBorrowersMap((prev) => ({
      ...prev,
      [activeConfigMonth]: chosen,
    }));
  };

  // Set exact count for activeConfigMonth
  const handleSetCountForActiveMonth = (targetCount: number) => {
    const assignedElsewhere = new Set<number>();
    Object.entries(monthlyBorrowersMap).forEach(([mStr, ids]) => {
      if (parseInt(mStr, 10) !== activeConfigMonth) {
        ids.forEach((id) => assignedElsewhere.add(id));
      }
    });

    const available = ALL_BORROWERS.filter((b) => !assignedElsewhere.has(b.id));
    const safeCount = Math.max(0, Math.min(available.length, targetCount));
    const chosen = available.slice(0, safeCount).map((b) => b.id);
    setMonthlyBorrowersMap((prev) => ({
      ...prev,
      [activeConfigMonth]: chosen,
    }));
  };

  // Enable/Add refinancing for a specific month
  const handleEnableMonthRefinance = (m: number, count: number = 8) => {
    const assignedElsewhere = new Set<number>();
    Object.entries(monthlyBorrowersMap).forEach(([mStr, ids]) => {
      if (parseInt(mStr, 10) !== m) {
        ids.forEach((id) => assignedElsewhere.add(id));
      }
    });

    const available = ALL_BORROWERS.filter((b) => !assignedElsewhere.has(b.id));
    const chosen = available.slice(0, count).map((b) => b.id);
    setMonthlyBorrowersMap((prev) => ({
      ...prev,
      [m]: chosen,
    }));
    setActiveConfigMonth(m);
    setCurrentMonthIndex(m);
  };

  // Remove refinancing from a specific month
  const handleRemoveMonthRefinance = (m: number) => {
    setMonthlyBorrowersMap((prev) => {
      const next = { ...prev };
      delete next[m];
      return next;
    });
    // Set active month to first remaining or 16
    const remaining = Object.keys(monthlyBorrowersMap)
      .map(Number)
      .filter((item) => item !== m);
    if (remaining.length > 0) {
      setActiveConfigMonth(remaining[0]);
    } else {
      setActiveConfigMonth(16);
    }
  };

  // Generate full 30 months simulation data
  const simulationData = React.useMemo(() => {
    const monthlyRefinances: Record<number, MonthRefinanceConfig> = {};
    Object.entries(monthlyBorrowersMap).forEach(([mStr, ids]) => {
      const m = parseInt(mStr, 10);
      if (ids && ids.length > 0) {
        monthlyRefinances[m] = {
          count: ids.length,
          borrowerIds: ids,
          sanctioned: refinanceSanctioned,
          fileCharge: refinanceFileCharge,
          monthlyEmi: refinanceMonthlyEmi,
          tenureMonths: refinanceTenureMonths,
        };
      }
    });

    return generateSimulationData({
      initialLoans,
      sanctionedAmount: loanPrincipal,
      fileCharge,
      monthlyEmi,
      tenureMonths: 20,
      totalMonths: totalSimulationMonths,
      reinvestFileCharges,
      refinanceEnabled,
      monthlyRefinances,
    });
  }, [
    initialLoans,
    loanPrincipal,
    fileCharge,
    monthlyEmi,
    reinvestFileCharges,
    refinanceEnabled,
    monthlyBorrowersMap,
    refinanceSanctioned,
    refinanceFileCharge,
    refinanceMonthlyEmi,
    refinanceTenureMonths,
    totalSimulationMonths,
  ]);

  // Current active month data
  const currentMonthData: SimulationMonthData = simulationData[currentMonthIndex - 1] || simulationData[0];

  // Auto-play timer (auto-pauses at ANY configured refinance month)
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentMonthIndex((prev) => {
          const nextMonth = prev + 1;
          if (configuredRefinanceMonths.includes(nextMonth)) {
            // Auto pause at refinance milestone so presenter can discuss
            setIsPlaying(false);
            setActiveConfigMonth(nextMonth);
            return nextMonth;
          }
          if (nextMonth > simulationData.length) {
            setIsPlaying(false);
            return prev;
          }
          return nextMonth;
        });
      }, 2000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, simulationData.length, configuredRefinanceMonths]);

  const handleNextMonth = () => {
    if (currentMonthIndex >= totalSimulationMonths) {
      // Auto-extend by 12 months so the user can continue indefinitely!
      setTotalSimulationMonths((prev) => prev + 12);
    }
    const nextM = currentMonthIndex + 1;
    setCurrentMonthIndex(nextM);
    if (nextM >= 16) {
      setActiveConfigMonth(nextM);
    }
  };

  const handlePrevMonth = () => {
    if (currentMonthIndex > 1) {
      const prevM = currentMonthIndex - 1;
      setCurrentMonthIndex(prevM);
      if (prevM >= 16) {
        setActiveConfigMonth(prevM);
      }
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentMonthIndex(1);
    setActiveConfigMonth(16);
  };

  // Table rows: show only up to current month in stepper mode, or all 30
  const visibleTableRows = tableDisplayMode === 'stepper' 
    ? simulationData.slice(0, currentMonthIndex) 
    : simulationData;

  const inHandRequired = loanPrincipal - fileCharge;

  // DYNAMIC REFINANCING CALCULATIONS FOR activeConfigMonth
  const activeOldEmisLeft = Math.max(0, 20 - activeConfigMonth);
  const activeOldSettledPerPerson = activeOldEmisLeft * monthlyEmi;
  const activeNetInHandPerPerson = refinanceSanctioned - refinanceFileCharge - activeOldSettledPerPerson;
  const activeTotalRefinanceCashRequired = activeSelectedBorrowerIds.length * activeNetInHandPerPerson;

  // Find simulation data for activeConfigMonth to check available pool
  const activeMonthData = simulationData.find((d) => d.month === activeConfigMonth);
  const activeTargetAvailablePool = activeMonthData ? activeMonthData.availablePool : 0;
  const activeMaxAffordableBorrowers = activeNetInHandPerPerson > 0 ? Math.floor(activeTargetAvailablePool / activeNetInHandPerPerson) : 0;
  const activeIsBudgetExceeded = activeTotalRefinanceCashRequired > activeTargetAvailablePool;
  const activeBudgetDeficitAmount = Math.max(0, activeTotalRefinanceCashRequired - activeTargetAvailablePool);

  // Filter borrowers in search modal
  const filteredBorrowers = ALL_BORROWERS.filter((b) => 
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
            Har mahine aane wali EMI collection se naye loans pass hote hain. <strong>Month 16, 17, 18</strong> (ya kisi bhi month) me purane customers ko <strong>₹80,000</strong> ka renewal loan diya jaata hai jisme se baaki bachi EMIs auto-deduct hoti hain.
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
              <strong className="text-amber-700">
                {configuredRefinanceMonths.length > 0
                  ? configuredRefinanceMonths.map((m) => `M${m} (${monthlyBorrowersMap[m]?.length || 0}P)`).join(', ')
                  : 'None'}
              </strong>
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

      {/* TOP PROMINENT LIVE MARKET CASH & REMAINING SAVINGS BANNER (ALWAYS VISIBLE AT TOP) */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-2 border-indigo-500/50 p-5 md:p-6 rounded-3xl shadow-2xl text-white space-y-4">
        {/* Header Strip with Month Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-indigo-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <Calendar className="h-3.5 w-3.5" />
              Month {currentMonthData.month} Live Market Status
            </span>
            <span className="text-xs font-semibold text-slate-300">
              {currentMonthData.dateStr}
            </span>
            {currentMonthData.refinanceTriggered && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] animate-pulse">
                🌟 Refinance Month ({currentMonthData.refinanceBorrowers} Renewed)
              </span>
            )}
          </div>

          <div className="text-xs text-slate-300 flex flex-wrap items-center gap-2">
            <span>Portfolio: <strong>{currentMonthData.activePayingLoans} Active Borrowers</strong></span>
            <span>•</span>
            <span className="text-amber-300 font-bold">Capital Deployed: {formatCurrency(currentMonthData.activePayingLoans * loanPrincipal, currency)}</span>
          </div>
        </div>

        {/* Dual Hero Big Cards: Available Fund VS Kitne Rs Bach Rahe Hain */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Market Me Available Cash Pool */}
          <div className="p-4 sm:p-5 bg-white/5 hover:bg-white/10 border border-emerald-500/40 rounded-2xl relative overflow-hidden transition group">
            <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <Coins className="h-3.5 w-3.5 text-emerald-400" />
                  Market Me Available Cash Pool
                </span>
                <p className="text-xs text-slate-300 mt-0.5">
                  Is month naye loans pass karne ke liye kul uplabdh fund:
                </p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">
                Available to Disburse
              </span>
            </div>

            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight drop-shadow-sm">
                {formatCurrency(currentMonthData.availablePool, currency)}
              </span>
            </div>

            <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
              <span>EMI Inflow: <strong className="text-blue-300">{formatCurrency(currentMonthData.emiCollected, currency)}</strong></span>
              <span>+</span>
              <span>Pichla Bacha: <strong className="text-slate-200">{formatCurrency(currentMonthData.surplusBefore, currency)}</strong></span>
            </div>
          </div>

          {/* Card 2: Market Me Kitne Rs Bach Rahe Hain (Surplus Remaining) */}
          <div className="p-4 sm:p-5 bg-gradient-to-br from-purple-900/30 via-white/5 to-purple-900/10 border-2 border-purple-400/50 rounded-2xl relative overflow-hidden shadow-lg transition group">
            <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5 text-purple-300" />
                  Market Me Kitne Rs Bach Rahe Hain (Net Surplus)
                </span>
                <p className="text-xs text-slate-300 mt-0.5">
                  Loans/Renewals dene ke baad bacha hua cash (Agle month carry forward):
                </p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-md border border-purple-400/40">
                Bacha Hua Cash
              </span>
            </div>

            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-purple-300 tracking-tight drop-shadow-sm">
                {formatCurrency(currentMonthData.surplusRemaining, currency)}
              </span>
              <span className="text-xs font-extrabold text-purple-200">
                Bacha (Surplus)
              </span>
            </div>

            <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
              <span>Loans Me Diya: <strong className="text-rose-300">-{formatCurrency(currentMonthData.newDisbursedInHand, currency)}</strong></span>
              <span>•</span>
              <span className="text-purple-200 font-bold">Next Month Pool me add hoga</span>
            </div>
          </div>
        </div>

        {/* Sub-strip 4 Mini Real-time Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Monthly Inflow</span>
            <span className="text-base font-black text-blue-400">{formatCurrency(currentMonthData.emiCollected, currency)}</span>
            <span className="text-[10px] text-slate-400 block">{currentMonthData.activePayingLoans} borrowers ki EMI</span>
          </div>

          <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Cash Disbursed (Outflow)</span>
            <span className="text-base font-black text-emerald-300">{formatCurrency(currentMonthData.newDisbursedInHand, currency)}</span>
            <span className="text-[10px] text-slate-400 block">
              {currentMonthData.refinanceTriggered 
                ? `${currentMonthData.refinanceBorrowers} renewed + ${currentMonthData.newLoansFunded} new` 
                : `${currentMonthData.newLoansFunded} regular loans`}
            </span>
          </div>

          <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">File Charges Profit</span>
            <span className="text-base font-black text-amber-300">+{formatCurrency(currentMonthData.newFileChargesEarned, currency)}</span>
            <span className="text-[10px] text-slate-400 block">Instant upfront profit</span>
          </div>

          <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Next Month Borrowers</span>
            <span className="text-base font-black text-indigo-300">{currentMonthData.nextMonthActiveLoans} Borrowers</span>
            <span className="text-[10px] text-slate-400 block">Active compounding base</span>
          </div>
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
              {currentMonthData.refinanceTriggered && (
                <span className="px-2 py-0.5 bg-amber-500 text-slate-950 rounded-full font-black text-[10px] animate-pulse">
                  🌟 Month {currentMonthData.month} Refinancing Active ({currentMonthData.refinanceBorrowers} Borrowers)
                </span>
              )}
              <span className="px-2.5 py-0.5 bg-purple-500/30 text-purple-200 border border-purple-400/40 rounded-full font-black text-[11px]">
                💰 Market Me Bacha: {formatCurrency(currentMonthData.surplusRemaining, currency)}
              </span>
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
              {currentMonthData.activePayingLoans} borrowers paying EMI this month $\rightarrow$ {currentMonthData.refinanceTriggered ? `${currentMonthData.refinanceBorrowers} renewed + ` : ''}{currentMonthData.newLoansFunded} new regular loan(s) sanctioned!
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

            {/* Jump to Active Refinancing Month Shortcut */}
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentMonthIndex(activeConfigMonth);
              }}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 ${
                currentMonthIndex === activeConfigMonth
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Month {activeConfigMonth} Setup</span>
            </button>

            {/* Next Month Button (Hero CTA - Never stops, auto extends) */}
            <button
              onClick={handleNextMonth}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-900/40 flex items-center gap-2 transition active:scale-95"
              title={currentMonthIndex >= totalSimulationMonths ? "Timeline limit reach; clicking will auto-extend timeline by +12 months" : "Step forward 1 month"}
            >
              <span>Next Month (+1 Month)</span>
              {currentMonthIndex >= totalSimulationMonths && (
                <span className="px-1.5 py-0.5 bg-slate-950 text-emerald-300 rounded text-[10px] font-black">+12 Mo</span>
              )}
              <ChevronRight className="h-4 w-4" />
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

        {/* Timeline Progress Scrubber with Horizon Switcher */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold text-slate-400">
            <div className="flex flex-wrap items-center gap-2">
              <span>Month 1 (Base 43)</span>
              <span className="text-amber-300 font-bold">
                Refinance: {configuredRefinanceMonths.map((m) => `M${m}`).join(', ')}
              </span>
            </div>

            {/* Quick Timeline Length Horizon Switcher */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5">Timeline Horizon:</span>
              {[30, 48, 60, 120].map((months) => (
                <button
                  key={months}
                  type="button"
                  onClick={() => {
                    setTotalSimulationMonths(months);
                    if (currentMonthIndex > months) setCurrentMonthIndex(months);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition ${
                    totalSimulationMonths === months
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {months} Mo {months >= 60 ? `(${months / 12} Yrs)` : ''}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setTotalSimulationMonths((prev) => prev + 12)}
                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-black transition"
                title="Add 12 more months to simulation"
              >
                +12 Mo
              </button>
            </div>

            <span className="text-indigo-300 font-bold">
              Month {currentMonthIndex} of {totalSimulationMonths}
            </span>
          </div>

          <input
            type="range"
            min="1"
            max={totalSimulationMonths}
            value={currentMonthIndex}
            onChange={(e) => {
              setIsPlaying(false);
              const m = parseInt(e.target.value, 10);
              setCurrentMonthIndex(m);
              if (m >= 16) {
                setActiveConfigMonth(m);
              }
            }}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>
      </div>

      {/* DYNAMIC REFINANCING COMMAND CENTER (Visible starting from Month 16 onwards, or when config panel toggled) */}
      {(currentMonthIndex >= 16 || showConfigPanel) ? (
        <div className="p-5 md:p-6 bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 rounded-3xl border-2 border-amber-400/80 shadow-lg space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
          
          {/* MULTI-MONTH MILESTONES BAR & TABS */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-white/90 rounded-2xl border border-amber-200 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase text-slate-500 flex items-center gap-1">
                <CalendarCheck className="h-4 w-4 text-amber-500" />
                <span>Refinance Months:</span>
              </span>

              {configuredRefinanceMonths.map((m) => {
                const count = monthlyBorrowersMap[m]?.length || 0;
                const isSelectedTab = activeConfigMonth === m;
                return (
                  <div
                    key={m}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black transition ${
                      isSelectedTab
                        ? 'bg-amber-500 text-slate-950 shadow-sm ring-2 ring-amber-400'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveConfigMonth(m);
                        setCurrentMonthIndex(m);
                      }}
                      className="flex items-center gap-1.5"
                    >
                      <Sparkles className="h-3 w-3 fill-current" />
                      <span>Month {m}</span>
                      <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-extrabold ${
                        isSelectedTab ? 'bg-slate-950 text-amber-300' : 'bg-amber-200 text-amber-900'
                      }`}>
                        {count} Borrowers
                      </span>
                    </button>
                    {configuredRefinanceMonths.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveMonthRefinance(m);
                        }}
                        className="ml-1 p-0.5 hover:bg-black/10 rounded text-slate-600 hover:text-rose-600 transition"
                        title={`Remove Month ${m} refinance`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Add Next Months */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase">+ Add Month:</span>
              {Array.from(new Set([
                currentMonthIndex >= 16 ? currentMonthIndex : null,
                16, 17, 18, 19, 20, 24, 30, 36, 48
              ]))
                .filter((m): m is number => m !== null && m <= totalSimulationMonths && !configuredRefinanceMonths.includes(m))
                .slice(0, 8)
                .map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleEnableMonthRefinance(m, 8)}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-black transition active:scale-95 flex items-center gap-1"
                    title={`Month ${m} me agle 8 borrowers ko refinance karein`}
                  >
                    <Plus className="h-3 w-3" />
                    <span>M{m}</span>
                  </button>
                ))}
            </div>
          </div>

          {/* Header & Controls for Active Month */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-amber-200">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 fill-current" />
                  Month {activeConfigMonth} Refinancing Milestone
                </span>
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                  {activeConfigMonth} EMIs Paid • {activeOldEmisLeft} EMIs Remaining
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-1">
                Month {activeConfigMonth} Refinancing & Cash Pool Budget Control
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Month 16 me renew karne ke baad, aap <strong>Month 17, 18</strong> me bhi naye batches add kar sakte hain. Purane EMIs har month ke according deduct honge.
              </p>
            </div>

            {/* Quick Switch to current Month index */}
            <div className="flex items-center gap-2">
              {currentMonthIndex !== activeConfigMonth && (
                <button
                  onClick={() => {
                    setActiveConfigMonth(currentMonthIndex);
                  }}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition whitespace-nowrap"
                >
                  Switch to View M{currentMonthIndex}
                </button>
              )}
            </div>
          </div>

          {/* REAL-TIME BUDGET WARNING ALERT (POOLS DEFICIT CHECK FOR ACTIVE MONTH) */}
          {activeIsBudgetExceeded ? (
            <div className="p-4 bg-rose-50 border-2 border-rose-400 rounded-2xl text-rose-900 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm animate-pulse">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-rose-900 uppercase tracking-wide">
                    ⚠️ Month {activeConfigMonth} Collection Pool Exceeded! (Cash Shortage Alert)
                  </h4>
                  <p className="text-xs text-rose-700 mt-1">
                    Aapne <strong>{activeSelectedBorrowerIds.length} customers</strong> select kiye hain jinko in-hand dene ke liye <strong>{formatCurrency(activeTotalRefinanceCashRequired, currency)}</strong> cash chahiye, jabki Month {activeConfigMonth} ka available collection pool sirf <strong>{formatCurrency(activeTargetAvailablePool, currency)}</strong> hai.
                  </p>
                  <p className="text-xs font-bold text-rose-800 mt-1">
                    Shortage (Deficit): <span className="underline">{formatCurrency(activeBudgetDeficitAmount, currency)}</span>
                  </p>
                </div>
              </div>

              {/* Action Button to Auto-Fix */}
              <button
                onClick={() => handleSetCountForActiveMonth(activeMaxAffordableBorrowers)}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md transition whitespace-nowrap active:scale-95"
              >
                Auto-Adjust to Max Affordable ({activeMaxAffordableBorrowers} Borrowers)
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
                    ✅ Month {activeConfigMonth} Cash Pool Budget Approved & Sufficient!
                  </p>
                  <p className="text-xs text-emerald-700">
                    Month {activeConfigMonth} Pool: <strong>{formatCurrency(activeTargetAvailablePool, currency)}</strong> | Required for {activeSelectedBorrowerIds.length} Renewals: <strong>{formatCurrency(activeTotalRefinanceCashRequired, currency)}</strong> | Surplus: <strong>{formatCurrency(activeTargetAvailablePool - activeTotalRefinanceCashRequired, currency)}</strong>
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg shrink-0">
                Max Safe: {activeMaxAffordableBorrowers} Borrowers
              </span>
            </div>
          )}

          {/* DYNAMIC INPUTS FORM GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Input 1: Active Month */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase">Refinance Month</label>
              <div className="relative mt-1">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={activeConfigMonth}
                  onChange={(e) => {
                    const m = Math.max(1, Math.min(30, parseInt(e.target.value, 10) || 16));
                    setActiveConfigMonth(m);
                  }}
                  className="w-full text-center font-black text-indigo-700 text-base border border-slate-200 rounded-lg py-1 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-400 text-center">Month {activeConfigMonth} configure ho raha hai</p>
            </div>

            {/* Input 2: Persons to Renew in activeConfigMonth */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-600 uppercase">Borrowers</label>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                  {activeSelectedBorrowerIds.length}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <button
                  onClick={() => handleSetCountForActiveMonth(activeSelectedBorrowerIds.length - 1)}
                  className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold transition"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <input
                  type="number"
                  min="0"
                  max="43"
                  value={activeSelectedBorrowerIds.length}
                  onChange={(e) => handleSetCountForActiveMonth(parseInt(e.target.value, 10) || 0)}
                  className="w-full text-center font-black text-slate-900 text-base border border-slate-200 rounded-lg py-0.5 focus:ring-2 focus:ring-amber-500 outline-none"
                />
                <button
                  onClick={() => handleSetCountForActiveMonth(activeSelectedBorrowerIds.length + 1)}
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
                <span>Pick ({activeSelectedBorrowerIds.length})</span>
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
              <p className="text-[10px] text-blue-600">Month {activeConfigMonth + 1} se start</p>
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

          {/* SELECTED BORROWERS CHIPS STRIP FOR activeConfigMonth */}
          <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-black">
                  {activeSelectedBorrowerIds.length}
                </span>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  Month {activeConfigMonth} Refinance Borrowers ({activeSelectedBorrowerIds.length} People • ₹80,000 Loan)
                </h4>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectNextAvailableForActiveMonth(8)}
                  className="text-[11px] font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition flex items-center gap-1"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Select Next 8 Available</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsBorrowerModalOpen(true)}
                  className="text-[11px] font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition flex items-center gap-1"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>+ Pick / Manage People</span>
                </button>
                {configuredRefinanceMonths.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMonthRefinance(activeConfigMonth)}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition flex items-center gap-1"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Remove M{activeConfigMonth}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Grid of Selected Borrowers for activeConfigMonth */}
            {activeSelectedBorrowerIds.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {activeSelectedBorrowerIds.map((bId) => {
                  const borrower = getBorrowerById(bId);
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
                          +{currency}{activeNetInHandPerPerson.toLocaleString('en-IN')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleBorrowerForActiveMonth(borrower.id)}
                          className="text-[10px] text-slate-400 hover:text-rose-600 transition"
                          title="Remove from this month's renewal"
                        >
                          <X className="h-3 w-3 inline" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center bg-amber-50/40 rounded-2xl border-2 border-dashed border-amber-300 space-y-2">
                <div className="inline-flex p-2.5 bg-amber-100 rounded-full text-amber-800">
                  <UserPlus className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-black text-slate-900">
                  Month {activeConfigMonth} me abhi koi borrower select nahi kiya gaya hai.
                </h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Aap Month {activeConfigMonth} me purane customers ko ₹80,000 ka renewal loan de sakte hain. Bachi hui {activeOldEmisLeft} EMIs auto-deduct ho jayengi.
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectNextAvailableForActiveMonth(8)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black inline-flex items-center gap-2 shadow-md transition active:scale-95"
                  >
                    <UserCheck className="h-4 w-4" />
                    <span>+ Renew Next 8 Available Borrowers</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBorrowerModalOpen(true)}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 inline-flex items-center gap-1.5 transition"
                  >
                    <Users className="h-4 w-4" />
                    <span>Pick Manually</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* PER-BORROWER & COMBINED DEDUCTION AUDIT CARD (DYNAMIC MONTH MATH) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Card: 1 Customer Formula */}
            <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-sm space-y-2 text-xs">
              <span className="text-[11px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="h-4 w-4" />
                Per Customer Net In-Hand Formula (At Month {activeConfigMonth})
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
                    3. Old {activeOldEmisLeft} Remaining EMIs Deducted ({activeOldEmisLeft} $\times$ {formatCurrency(monthlyEmi, currency)}):
                  </span>
                  <strong>-{formatCurrency(activeOldSettledPerPerson, currency)}</strong>
                </div>
                <div className="border-t border-slate-200 pt-1.5 flex justify-between text-sm font-black text-emerald-800">
                  <span>Net In-Hand Cash Given to Customer:</span>
                  <span className="text-base text-emerald-700">{formatCurrency(activeNetInHandPerPerson, currency)}</span>
                </div>
              </div>
            </div>

            {/* Right Card: All Borrowers Impact on Pool */}
            <div className="p-4 bg-white rounded-2xl border border-amber-200 shadow-sm space-y-2 text-xs">
              <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="h-4 w-4 text-indigo-600" />
                Month {activeConfigMonth} Cashflow Impact ({activeSelectedBorrowerIds.length} Borrowers)
              </span>
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-slate-600">
                  <span>Total Sanctioned ({activeSelectedBorrowerIds.length} $\times$ {formatCurrency(refinanceSanctioned, currency)}):</span>
                  <strong className="text-slate-900">{formatCurrency(activeSelectedBorrowerIds.length * refinanceSanctioned, currency)}</strong>
                </div>
                <div className="flex justify-between text-purple-700 font-bold">
                  <span>Instant File Charge Profit ({activeSelectedBorrowerIds.length} $\times$ {formatCurrency(refinanceFileCharge, currency)}):</span>
                  <span>+{formatCurrency(activeSelectedBorrowerIds.length * refinanceFileCharge, currency)}</span>
                </div>
                <div className="flex justify-between text-blue-700">
                  <span>Old Loans Recovered / Settled:</span>
                  <strong>{formatCurrency(activeSelectedBorrowerIds.length * activeOldSettledPerPerson, currency)}</strong>
                </div>
                <div className="border-t border-slate-200 pt-1.5 flex justify-between text-sm font-black text-slate-900">
                  <span>Net In-Hand Cash Paid from Month {activeConfigMonth} Pool:</span>
                  <span className={activeIsBudgetExceeded ? 'text-rose-600 text-base' : 'text-indigo-600 text-base'}>
                    {formatCurrency(activeTotalRefinanceCashRequired, currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 bg-gradient-to-r from-slate-900/5 via-indigo-50/50 to-slate-900/5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 shadow-sm">
              <Landmark className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  Standard Lending Phase • Month {currentMonthIndex} of 15
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  (Regular ₹60k Loan Distribution)
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Is month me aayi EMI collection se naye ₹60,000 ke regular loans pass ho rahe hain. <strong>Customer Renewal / Refinancing option Month 16</strong> se unlock hoga jab purane borrowers ki 16 EMIs complete hongi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => {
                setCurrentMonthIndex(16);
                setActiveConfigMonth(16);
              }}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl shadow-sm transition active:scale-95 flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 fill-current" />
              <span>Jump to Month 16 Renewal $\rightarrow$</span>
            </button>
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
                  <span>Select Borrowers for Month {activeConfigMonth} Refinancing</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Initial 43 customers me se choose karein. Kisi doosre month me renew ho chuke customers locked dikhenge.
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
                    onClick={() => handleSelectNextAvailableForActiveMonth(8)}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-sm transition whitespace-nowrap"
                  >
                    Select Next 8 Available
                  </button>
                  <button
                    onClick={() => {
                      setMonthlyBorrowersMap((prev) => ({ ...prev, [activeConfigMonth]: [] }));
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl border border-slate-200 transition"
                  >
                    Clear Month {activeConfigMonth}
                  </button>
                </div>
              </div>

              {/* Status Alert Inside Modal */}
              <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 ${
                activeIsBudgetExceeded 
                  ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                <span>Selected: {activeSelectedBorrowerIds.length} Borrowers ({formatCurrency(activeTotalRefinanceCashRequired, currency)} in-hand cash)</span>
                <span>Max Affordable in M{activeConfigMonth}: {activeMaxAffordableBorrowers} Borrowers</span>
              </div>
            </div>

            {/* Scrollable List of 43 Customers with Duplicate Exclusion */}
            <div className="p-4 overflow-y-auto divide-y divide-slate-100 flex-1 space-y-1">
              {filteredBorrowers.map((borrower) => {
                const isSelectedInActiveMonth = activeSelectedBorrowerIds.includes(borrower.id);
                const renewedInOtherMonth = assignedInOtherMonths.get(borrower.id);
                const isDisabled = renewedInOtherMonth !== undefined;

                return (
                  <div
                    key={borrower.id}
                    onClick={() => {
                      if (!isDisabled) {
                        handleToggleBorrowerForActiveMonth(borrower.id);
                      }
                    }}
                    className={`p-3 rounded-2xl flex items-center justify-between gap-3 transition ${
                      isDisabled
                        ? 'bg-slate-100/70 border border-slate-200 opacity-60 cursor-not-allowed'
                        : isSelectedInActiveMonth
                        ? 'bg-amber-50/80 border border-amber-300 cursor-pointer hover:bg-amber-100/50'
                        : 'hover:bg-slate-50 border border-transparent cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-6 w-6 rounded-lg flex items-center justify-center transition ${
                        isDisabled
                          ? 'bg-slate-200 text-slate-400'
                          : isSelectedInActiveMonth
                          ? 'bg-amber-500 text-slate-950'
                          : 'border border-slate-300 bg-white'
                      }`}>
                        {isDisabled ? (
                          <span className="text-[10px] font-bold">🔒</span>
                        ) : isSelectedInActiveMonth ? (
                          <Check className="h-4 w-4 stroke-[3]" />
                        ) : null}
                      </div>

                      <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {borrower.id}
                      </div>

                      <div>
                        <p className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{borrower.name}</span>
                          {isDisabled ? (
                            <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-bold border border-indigo-200">
                              Renewed in Month {renewedInOtherMonth}
                            </span>
                          ) : isSelectedInActiveMonth ? (
                            <span className="text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded font-bold border border-amber-300">
                              Month {activeConfigMonth} Selected
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold border border-emerald-200">
                              Available for Renewal
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-500">{borrower.phone} • {borrower.area}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      {isDisabled ? (
                        <span className="text-[11px] font-bold text-slate-400">Already Refinanced</span>
                      ) : (
                        <>
                          <p className="text-xs font-black text-emerald-700">
                            +{formatCurrency(activeNetInHandPerPerson, currency)}
                          </p>
                          <p className="text-[10px] text-slate-400">Net in-hand</p>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between rounded-b-3xl">
              <div>
                <p className="text-xs font-black text-slate-900">
                  {activeSelectedBorrowerIds.length} Borrowers Selected (Month {activeConfigMonth})
                </p>
                <p className="text-[10px] text-slate-500">
                  Total Disbursed: {formatCurrency(activeSelectedBorrowerIds.length * activeNetInHandPerPerson, currency)}
                </p>
              </div>

              <button
                onClick={() => setIsBorrowerModalOpen(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition active:scale-95"
              >
                Done & Apply ({activeSelectedBorrowerIds.length} People)
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
              {currentMonthData.refinanceTriggered ? 'Disbursal Summary' : 'New Loans Passed'}
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Landmark className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">
            {currentMonthData.refinanceTriggered ? (
              <span>+{currentMonthData.refinanceBorrowers} Renewals</span>
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
              {currentMonthData.refinanceTriggered ? 'Step 3: Loans & Renewals' : 'Step 3: New Loans Passed'}
            </span>
            <p className="text-sm font-black text-emerald-700">
              {formatCurrency(currentMonthData.newDisbursedInHand, currency)} Disbursed
            </p>
            <p className="text-emerald-800">
              {currentMonthData.refinanceTriggered 
                ? `${currentMonthData.refinanceBorrowers} renewed @ ${formatCurrency(currentMonthData.refinanceNetInHandPerPerson || 0, currency)} in-hand + ${currentMonthData.newLoansFunded} regular loans` 
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
              <span>Compounding & Refinancing Ledger Table</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {tableDisplayMode === 'stepper'
                ? `Showing Month 1 to ${currentMonthIndex} (Step-by-Step View). Click Next Month (+1 Month) to reveal next month.`
                : `Showing all ${totalSimulationMonths} months full cycle ledger projection.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* View Mode Toggle: Stepper (1 month at a time) vs All Months */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setTableDisplayMode('stepper')}
                className={`px-3 py-1.5 text-xs font-black rounded-lg transition ${
                  tableDisplayMode === 'stepper'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Step View (Month 1 to {currentMonthIndex})
              </button>
              <button
                type="button"
                onClick={() => setTableDisplayMode('all')}
                className={`px-3 py-1.5 text-xs font-black rounded-lg transition ${
                  tableDisplayMode === 'all'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Show All {totalSimulationMonths} Months
              </button>
            </div>

            <span className="flex items-center gap-1.5 text-amber-700 font-bold bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
              <Sparkles className="h-3 w-3" />
              <span>Refinance: {configuredRefinanceMonths.map((m) => `M${m}`).join(', ')}</span>
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
                <th className="py-3.5 px-4 text-purple-900 bg-purple-100/50 font-black">Kitne Rs Bache (Surplus)</th>
                <th className="py-3.5 px-4">Next Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {visibleTableRows.map((row) => {
                const isCurrent = row.month === currentMonthIndex;
                const isRefinanceMonth = !!row.refinanceTriggered;

                return (
                  <tr
                    key={row.month}
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentMonthIndex(row.month);
                      if (row.month >= 16) {
                        setActiveConfigMonth(row.month);
                      }
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
                                Refinance ({row.refinanceBorrowers})
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
                            🔄 {row.refinanceBorrowers} Renewed (₹80k)
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



