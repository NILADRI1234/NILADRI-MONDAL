import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Car, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  XCircle, 
  Info, 
  TrendingDown, 
  Zap, 
  ArrowRight,
  Clock,
  CarFront,
  Briefcase,
  Landmark,
  Download,
  FileText,
  UserCheck,
  Sparkles,
  Calculator
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts';

import { LoanProfile, BANKS, LoanOffer, BankType, SALARIED_DOCS, SELF_EMPLOYED_DOCS } from './types';
import { checkEligibility } from './services/loanService';
import { getAIBestChoice } from './services/geminiService';
import { cn } from './lib/utils';
import { BankLogo } from './components/BankLogos';

const profileSchema = z.object({
  monthlyIncome: z.number().min(10000, "Minimum monthly income is ₹10,000"),
  monthlyEMIExisting: z.number().min(0),
  employmentType: z.enum(['Salaried', 'Self-Employed']),
  cibilScore: z.number().min(300).max(900),
  carPrice: z.number().min(300000),
  loanAmount: z.number().min(100000),
  tenure: z.number().min(12).max(84),
});

type Step = 1 | 2 | 3;

export default function App() {
  const [step, setStep] = useState<Step>(1);
  const [offers, setOffers] = useState<LoanOffer[]>([]);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const { register, handleSubmit, watch, formState: { errors }, trigger } = useForm<LoanProfile>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      employmentType: 'Salaried',
      tenure: 60,
      monthlyEMIExisting: 0,
      cibilScore: 750
    }
  });

  const formData = watch();

  const handleNext = async () => {
    let fields: (keyof LoanProfile)[] = [];
    if (step === 1) fields = ['monthlyIncome', 'employmentType', 'monthlyEMIExisting', 'cibilScore'];
    if (step === 2) fields = ['carPrice', 'loanAmount', 'tenure'];
    
    const isValid = await trigger(fields);
    if (isValid) setStep((prev) => (prev + 1) as Step);
  };

  const [verificationStep, setVerificationStep] = useState<string>('');
  
  // Filters
  const [filterType, setFilterType] = useState<BankType | 'All'>('All');
  const [filterMaxRate, setFilterMaxRate] = useState<number>(15);
  const [filterMaxEMI, setFilterMaxEMI] = useState<number>(500000);
  const [showDocsFor, setShowDocsFor] = useState<string | null>(null);

  // Standalone Calculator State
  const [calcAmount, setCalcAmount] = useState(500000);
  const [calcRate, setCalcRate] = useState(9.5);
  const [calcTenure, setCalcTenure] = useState(60);

  const onSubmit = async (data: LoanProfile) => {
    setIsVerifying(true);
    
    // Step 1: Identity & Profile Sync
    setVerificationStep('Authenticating with Digital Locker...');
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Step 2: CIBIL Fetch
    setVerificationStep('Fetching real-time CIBIL score (CreditSync™)...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 3: Bank Policy Verification
    setVerificationStep('Checking 24+ bank policy gateways...');
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const results = checkEligibility(data, BANKS);
    setOffers(results);
    setIsVerifying(false);
    setVerificationStep('');
    setStep(3);
    
    // Fetch AI insight
    setLoadingAi(true);
    getAIBestChoice(results, data).then(insight => {
      setAiInsight(insight);
      setLoadingAi(false);
    });
  };

  // Sort by eligibility first, then by interest rate
  const sortedOffers = [...offers].sort((a, b) => {
    if (a.eligible && !b.eligible) return -1;
    if (!a.eligible && b.eligible) return 1;
    return a.interestRate - b.interestRate;
  });

  const filteredOffers = sortedOffers.filter(offer => {
    const matchesType = filterType === 'All' || offer.bankType === filterType;
    const matchesRate = offer.interestRate <= filterMaxRate;
    const matchesEMI = offer.monthlyEMI <= filterMaxEMI;
    return matchesType && matchesRate && matchesEMI;
  });

  const eligibleOffers = filteredOffers.filter(o => o.eligible);

  const calcResults = React.useMemo(() => {
    const P = calcAmount;
    const r = calcRate / 12 / 100;
    const n = calcTenure;
    
    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = emi * n;
    const totalInterest = totalPayment - P;
    
    return {
      emi: Math.round(emi),
      totalInterest: Math.round(totalInterest),
      totalPayment: Math.round(totalPayment)
    };
  }, [calcAmount, calcRate, calcTenure]);

  // Generate data for Interest Trend line chart
  const trendData = React.useMemo(() => {
    if (eligibleOffers.length === 0) return [];
    
    const topOffers = eligibleOffers.slice(0, 3);
    const months = Math.min(formData.tenure, 84);
    const data = [];
    
    for (let m = 0; m <= months; m += Math.max(1, Math.floor(months / 6))) {
      const point: any = { month: m === 0 ? 'Start' : `Month ${m}` };
      topOffers.forEach(offer => {
        // Simple amortization calculation for cumulative interest
        // r = annual rate / 12 / 100
        const r = offer.interestRate / 12 / 100;
        const P = formData.loanAmount;
        const n = formData.tenure;
        
        // Cumulative Interest at month m
        // This is a simplified linear approximation for the trend visualization
        // In a real amortization, interest starts high and decreases.
        // Formula for cumulative interest after m payments:
        // Interest_m = Sum_{k=1}^m (Balance_{k-1} * r)
        
        let cumulativeInterest = 0;
        let currentBalance = P;
        const emi = offer.monthlyEMI;
        
        for (let i = 1; i <= m; i++) {
          const interestShare = currentBalance * r;
          const principalShare = emi - interestShare;
          cumulativeInterest += interestShare;
          currentBalance -= principalShare;
        }
        
        point[offer.bankName] = Math.round(cumulativeInterest);
      });
      data.push(point);
    }
    return data;
  }, [eligibleOffers, formData.loanAmount, formData.tenure]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {step === 3 && (
              <button 
                onClick={() => {
                  const report = {
                    profile: formData,
                    eligibleOffers: eligibleOffers.map(o => ({ 
                      bank: o.bankName, 
                      interestRate: o.interestRate, 
                      monthlyEMI: o.monthlyEMI,
                      totalInterest: o.totalInterest,
                      totalPayment: o.totalPayment,
                      processingFee: BANKS.find(b => b.id === o.bankId)?.processingFee
                    })),
                    timestamp: new Date().toISOString()
                  };
                  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `AutoLoan_Report_${new Date().getTime()}.json`;
                  a.click();
                }}
                className="hidden md:flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold transition-all"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </button>
            )}
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Car className="text-white w-6 h-6" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">AutoFinance<span className="text-indigo-600">Pro</span></span>
          </div>
          <div className="hidden md:flex gap-6 text-sm font-medium text-slate-500">
            <span className={cn(step >= 1 ? "text-indigo-600" : "")}>1. Profile</span>
            <span className={cn(step >= 2 ? "text-indigo-600" : "")}>2. Loan Details</span>
            <span className={cn(step >= 3 ? "text-indigo-600" : "")}>3. Compare</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-[32px] shadow-sm p-8 border border-slate-100"
            >
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Briefcase className="text-indigo-600 w-4 h-4" />
                Customer Financial Profile
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Employment Type</label>
                  <select 
                    {...register('employmentType')}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    <option value="Salaried">Salaried Employee</option>
                    <option value="Self-Employed">Self-Employed / Business</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2">Monthly Take-Home Income (₹)</label>
                  <input 
                    type="number"
                    {...register('monthlyIncome', { valueAsNumber: true })}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="e.g. 75000"
                  />
                  {errors.monthlyIncome && <p className="text-red-500 text-xs mt-1">{errors.monthlyIncome.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Current Monthly EMIs (₹)</label>
                  <input 
                    type="number"
                    {...register('monthlyEMIExisting', { valueAsNumber: true })}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="e.g. 0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">CIBIL Score (300-900)</label>
                  <input 
                    type="number"
                    {...register('cibilScore', { valueAsNumber: true })}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="e.g. 750"
                  />
                  <p className="text-slate-400 text-[10px] mt-1">Found in your bank app or credit report</p>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={handleNext}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                  Continue to Vehicle Details
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-[32px] shadow-sm p-8 border border-slate-100"
            >
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Car className="text-indigo-600 w-4 h-4" />
                Vehicle & Loan Preferences
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">On-Road Car Price (₹)</label>
                  <input 
                    type="number"
                    {...register('carPrice', { valueAsNumber: true })}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="e.g. 800000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2">Desired Loan Amount (₹)</label>
                  <input 
                    type="number"
                    {...register('loanAmount', { valueAsNumber: true })}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="e.g. 600000"
                  />
                  <p className="text-slate-400 text-[10px] mt-1">Recommended: Up to 90% of car price</p>
                </div>

                <div className="md:col-span-2">
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-semibold">Tenure: {formData.tenure} months ({Math.round(formData.tenure/12)} years)</label>
                  </div>
                  <input 
                    type="range"
                    min="12"
                    max="84"
                    step="12"
                    {...register('tenure', { valueAsNumber: true })}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>1 Year</span>
                    <span>3 Years</span>
                    <span>5 Years</span>
                    <span>7 Years</span>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex justify-between gap-4">
                <button 
                  onClick={() => setStep(1)}
                  className="text-slate-500 border border-slate-200 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
                <button 
                  onClick={handleSubmit(onSubmit)}
                  disabled={isVerifying}
                  className="bg-indigo-600 text-white px-10 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-70 min-w-[280px] justify-center"
                >
                  {isVerifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                      <span className="text-sm truncate">{verificationStep}</span>
                    </>
                  ) : (
                    <>
                      Verify Real-Time Eligibility
                      <Calculator className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Back Button for Navigation */}
              <div className="flex justify-between items-center">
                <button 
                  onClick={() => setStep(2)}
                  className="text-slate-500 border border-slate-200 px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-white hover:border-slate-300 transition-all shadow-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Edit Loan Details
                </button>

                <button 
                  onClick={() => {
                    const report = {
                      customerProfile: {
                        income: formData.monthlyIncome,
                        employment: formData.employmentType,
                        cibil: formData.cibilScore,
                        existingEMIs: formData.monthlyEMIExisting
                      },
                      loanRequirements: {
                        carPrice: formData.carPrice,
                        loanAmount: formData.loanAmount,
                        tenureMonths: formData.tenure
                      },
                      eligibleOffers: eligibleOffers.map(o => ({ 
                        bank: o.bankName, 
                        interestRate: `${o.interestRate}%`, 
                        monthlyEMI: o.monthlyEMI,
                        processingFee: BANKS.find(b => b.id === o.bankId)?.processingFee
                      })),
                      generatedAt: new Date().toLocaleString()
                    };
                    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `LoanComparisonReport_${formData.employmentType}.json`;
                    a.click();
                  }}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  <Download className="w-5 h-5" />
                  Download Full Report
                </button>
              </div>

              {/* Summary Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Max Budget</p>
                  <p className="text-2xl font-black text-slate-800">₹{Math.round(formData.monthlyIncome * 0.50 - formData.monthlyEMIExisting).toLocaleString('en-IN')}</p>
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-green-600 font-medium">
                    <TrendingDown className="w-3 h-3" />
                    <span>Post-existing EMIs</span>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Approval Probability</p>
                  <p className={cn(
                    "text-2xl font-black",
                    eligibleOffers.length > 2 ? "text-emerald-500" : eligibleOffers.length > 0 ? "text-amber-500" : "text-red-500"
                  )}>
                    {eligibleOffers.length > 2 ? "High (90%+)" : eligibleOffers.length > 0 ? "Medium (60%+)" : "Low (<20%)"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-2">Based on CIBIL & FOIR check</p>
                </div>
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm text-center flex flex-col justify-center bg-indigo-600 text-white border-none shadow-indigo-100 shadow-lg">
                  <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">Match Success</p>
                  <p className="text-2xl font-black text-white">Optimal</p>
                  <p className="text-[10px] text-indigo-100 opacity-80 mt-1">12 partnerships compatible</p>
                </div>
              </div>

              {/* AI Insight */}
              <div className="bg-indigo-600 p-8 rounded-[40px] shadow-lg shadow-indigo-100 relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Sparkles className="w-20 h-20 text-white" />
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-white/10 p-2 rounded-xl shrink-0">
                    <Zap className="text-white w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-1">Eligibility Check: <span className="text-emerald-400">Optimal</span></h3>
                    {loadingAi ? (
                      <div className="flex gap-2 items-center text-white/60 animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-current"></div>
                        <div className="w-2 h-2 rounded-full bg-current delay-75"></div>
                        <div className="w-2 h-2 rounded-full bg-current delay-150"></div>
                        <span className="text-sm font-medium">Analyzing market rates...</span>
                      </div>
                    ) : (
                      <p className="text-sm text-indigo-100 opacity-90 leading-relaxed max-w-2xl">{aiInsight}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Comparison Chart & Filters */}
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                      <h3 className="text-lg font-bold text-slate-800">Market Insights</h3>
                      <div className="flex flex-wrap gap-2">
                        <select 
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value as BankType | 'All')}
                          className="text-xs font-bold bg-slate-50 border-none rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="All">All Bank Types</option>
                          <option value="Public">Nationalized Banks</option>
                          <option value="Private">Private Banks</option>
                          <option value="NBFC">NBFCs</option>
                        </select>
                        <div className="flex items-center gap-2 bg-slate-50 rounded-full px-4 py-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Rate: {filterMaxRate}%</span>
                          <input 
                            type="range" 
                            min="8" 
                            max="15" 
                            step="0.5"
                            value={filterMaxRate}
                            onChange={(e) => setFilterMaxRate(parseFloat(e.target.value))}
                            className="w-20 h-1 accent-indigo-600"
                          />
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 rounded-full px-4 py-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">EMI: ₹{filterMaxEMI.toLocaleString('en-IN')}</span>
                          <input 
                            type="range" 
                            min="5000" 
                            max="500000" 
                            step="5000"
                            value={filterMaxEMI}
                            onChange={(e) => setFilterMaxEMI(parseInt(e.target.value))}
                            className="w-20 h-1 accent-indigo-600"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={filteredOffers}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="bankName" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 10, fill: '#94a3b8'}}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 10, fill: '#94a3b8'}}
                          />
                          <Tooltip 
                            cursor={{fill: '#f8fafc'}}
                            contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="interestRate" radius={[8, 8, 0, 0]} barSize={40}>
                            {filteredOffers.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.eligible ? '#4f46e5' : '#cbd5e1'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-slate-800">Cumulative Interest Projection</h3>
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Optimized Tenure Strategy</span>
                      </div>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="month" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 10, fill: '#94a3b8'}}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 10, fill: '#94a3b8'}}
                            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Total Interest']}
                          />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
                          {eligibleOffers.slice(0, 3).map((offer, index) => (
                            <Line 
                              key={offer.bankId}
                              type="monotone" 
                              dataKey={offer.bankName} 
                              stroke={index === 0 ? '#4f46e5' : index === 1 ? '#10b981' : '#f59e0b'} 
                              strokeWidth={3}
                              dot={{ r: 4, strokeWidth: 2, fill: 'white' }}
                              activeDot={{ r: 6 }}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                       <h3 className="text-lg font-bold text-slate-800">Comparison Results ({filteredOffers.length})</h3>
                       <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">Real-time Feed</span>
                    </div>
                    {filteredOffers.map((offer, idx) => {
                      const bank = BANKS.find(b => b.id === offer.bankId);
                      return (
                        <div 
                          key={offer.bankId}
                          className={cn(
                            "group relative bg-white p-6 rounded-[32px] transition-all duration-300 border overflow-hidden",
                            offer.eligible && idx === 0
                              ? "border-2 border-indigo-500 shadow-md scale-[1.01] z-10" 
                              : "border-slate-100 opacity-60 shadow-sm"
                          )}
                        >
                          {offer.eligible && idx === 0 && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter shadow-lg shadow-indigo-100">Best Match</div>
                          )}
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                              <div className="bg-slate-50 p-4 rounded-2xl">
                                <BankLogo logo={bank?.logo || ''} className="w-8 h-8" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{offer.bankName}</p>
                                  <span className={cn(
                                    "text-[8px] font-bold px-2 py-0.5 rounded-full uppercase",
                                    offer.bankType === 'Public' ? "bg-emerald-50 text-emerald-600" : 
                                    offer.bankType === 'Private' ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                                  )}>
                                    {offer.bankType}
                                  </span>
                                </div>
                                <p className="text-2xl font-black text-slate-800">{offer.interestRate}% <span className="text-sm font-medium text-slate-400">P.A.</span></p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 text-center md:text-right">
                              <div className="text-left md:text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Monthly EMI</p>
                                <p className="text-xl font-bold text-slate-800">₹{Math.round(offer.monthlyEMI).toLocaleString('en-IN')}</p>
                              </div>
                              <div className="hidden lg:block text-left md:text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Savings</p>
                                <p className="text-xl font-medium text-emerald-600">₹{Math.round(eligibleOffers[eligibleOffers.length-1].totalInterest - offer.totalInterest).toLocaleString('en-IN')}</p>
                              </div>
                              <div className="flex flex-col gap-2 min-w-[140px]">
                                {offer.eligible ? (
                                  <>
                                    <button className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-sm">
                                      Apply Now
                                    </button>
                                    <button 
                                      onClick={() => setShowDocsFor(showDocsFor === offer.bankId ? null : offer.bankId)}
                                      className="text-indigo-600 hover:text-indigo-700 text-[10px] font-bold flex items-center justify-center gap-1"
                                    >
                                      {showDocsFor === offer.bankId ? "Hide Docs" : "Check Documents"}
                                      <Info className="w-3 h-3" />
                                    </button>
                                  </>
                                ) : (
                                  <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-1 text-red-500">
                                      <XCircle className="w-4 h-4" />
                                      <span className="text-[10px] font-bold uppercase italic">Ineligible</span>
                                    </div>
                                    <p className="text-[9px] text-slate-400 italic leading-tight text-right">{offer.reason}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <AnimatePresence>
                            {showDocsFor === offer.bankId && bank && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-6 pt-6 border-t border-slate-50"
                              >
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Verification Details for {bank.name}</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                  {(formData.employmentType === 'Salaried' ? SALARIED_DOCS : SELF_EMPLOYED_DOCS).map((doc, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                      <span className="truncate">{doc}</span>
                                    </div>
                                  ))}
                                  <div className="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-100 col-span-full justify-center">
                                    <Clock className="w-3 h-3 shrink-0" />
                                    <span className="font-bold">Estimated Turnaround: {bank.type === 'NBFC' ? 'Instant' : '24-48 Business Hours'}</span>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 overflow-x-auto">
                    <h4 className="text-sm font-bold text-slate-800 mb-4">Loan Comparison Details</h4>
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="pb-3 text-[10px] text-slate-400 uppercase font-bold tracking-widest">Criteria</th>
                          {filteredOffers.slice(0, 3).map(offer => {
                            const bank = BANKS.find(b => b.id === offer.bankId);
                            return (
                              <th key={offer.bankId} className="pb-3 text-[10px] text-slate-400 uppercase font-bold tracking-widest pl-4">
                                <div className="flex flex-col items-center gap-2">
                                  <BankLogo logo={bank?.logo || ''} className="w-6 h-6" />
                                  <span>{offer.bankName}</span>
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        <tr>
                          <td className="py-4 text-xs font-medium text-slate-600">Processing Fee</td>
                          {filteredOffers.slice(0, 3).map(offer => {
                            const bank = BANKS.find(b => b.id === offer.bankId);
                            return <td key={offer.bankId} className="py-4 text-xs font-bold text-slate-800">₹{bank?.processingFee.toLocaleString('en-IN')}</td>;
                          })}
                        </tr>
                        <tr>
                          <td className="py-4 text-xs font-medium text-slate-600">Prepayment Penalty</td>
                          {filteredOffers.slice(0, 3).map(offer => {
                            const bank = BANKS.find(b => b.id === offer.bankId);
                            return <td key={offer.bankId} className="py-4 text-xs text-slate-800">{bank?.prepaymentCharges}</td>;
                          })}
                        </tr>
                        <tr>
                          <td className="py-4 text-xs font-medium text-slate-600">Approval Speed</td>
                          {filteredOffers.slice(0, 3).map((offer, idx) => (
                            <td key={offer.bankId} className={cn("py-4 text-xs", idx === 0 && offer.eligible ? "font-bold text-indigo-600" : "text-slate-800")}>
                              {offer.bankType === 'NBFC' ? "Instant" : offer.bankType === 'Private' ? "24 Hours" : "48 Hours"}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Side Bar Inspired components */}
                <div className="space-y-6">
                  {/* Standalone Calculator Tool */}
                  <div className="bg-indigo-600 rounded-[32px] shadow-lg shadow-indigo-100 p-6 text-white">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-white/20 p-2 rounded-xl">
                        <Calculator className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-bold text-lg">Smart EMI Calculator</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-indigo-200 mb-2">
                          <span>Loan Amount</span>
                          <span>₹{calcAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <input 
                          type="range" 
                          min="100000" 
                          max="2000000" 
                          step="50000"
                          value={calcAmount}
                          onChange={(e) => setCalcAmount(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-indigo-400 rounded-lg appearance-none cursor-pointer accent-white"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-indigo-200 mb-2">
                          <span>Interest Rate</span>
                          <span>{calcRate}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="7" 
                          max="18" 
                          step="0.1"
                          value={calcRate}
                          onChange={(e) => setCalcRate(parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-indigo-400 rounded-lg appearance-none cursor-pointer accent-white"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-indigo-200 mb-2">
                          <span>Tenure ({calcTenure} Mo)</span>
                          <span>{Math.round(calcTenure/12)} Years</span>
                        </div>
                        <input 
                          type="range" 
                          min="12" 
                          max="84" 
                          step="12"
                          value={calcTenure}
                          onChange={(e) => setCalcTenure(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-indigo-400 rounded-lg appearance-none cursor-pointer accent-white"
                        />
                      </div>

                      <div className="pt-4 grid grid-cols-2 gap-3">
                        <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
                          <p className="text-[8px] font-bold uppercase text-indigo-200 mb-1">Monthly EMI</p>
                          <p className="text-sm font-black">₹{calcResults.emi.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
                          <p className="text-[8px] font-bold uppercase text-indigo-200 mb-1">Total Interest</p>
                          <p className="text-sm font-black">₹{calcResults.totalInterest.toLocaleString('en-IN')}</p>
                        </div>
                      </div>

                      <div className="bg-emerald-500/20 text-emerald-100 p-3 rounded-2xl text-[9px] font-medium leading-tight flex items-start gap-2">
                        <Info className="w-3 h-3 shrink-0 mt-0.5" />
                        <span>Calculated using standard reducing balance method. Processing fees not included.</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Verification Insights</h3>
                    <div className="space-y-6">
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                          <UserCheck className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Aadhaar & PAN Sync</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-medium leading-tight">Must be linked to mobile for instant e-KYC. Ensures identity and signature verification.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Income Tax Returns (ITR)</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-medium leading-tight">Last 2 years ITR V with computation is mandatory for self-employed to verify reported profit.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                          <Landmark className="w-4 h-4 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Bank Statement Sync</p>
                          <p className="text-[10px] text-slate-400 mt-1 font-medium leading-tight">Latest 6 months bank statement (E-Statement) determines FOIR capacity and repayment behavior.</p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Core Approval Criteria</p>
                        <ul className="space-y-2">
                          <li className="flex items-center justify-between text-[10px] font-medium text-slate-600">
                             <span>CIBIL Score</span>
                             <span className="text-slate-900 font-bold">700+ (Ideal)</span>
                          </li>
                          <li className="flex items-center justify-between text-[10px] font-medium text-slate-600">
                             <span>FOIR Limit</span>
                             <span className="text-slate-900 font-bold">&lt; 50%</span>
                          </li>
                          <li className="flex items-center justify-between text-[10px] font-medium text-slate-600">
                             <span>Work Exp.</span>
                             <span className="text-slate-900 font-bold">2+ Years</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                        <p className="text-[10px] text-indigo-700 font-bold leading-relaxed uppercase tracking-widest text-center">CreditSync™ Secure Gateway</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 text-white rounded-[40px] p-8 shadow-xl shadow-indigo-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Financial Impact</h4>
                    <div className="space-y-6">
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Loan Tenure</p>
                        <p className="text-2xl font-black">{formData.tenure} <span className="text-sm font-medium text-slate-500">Months</span></p>
                      </div>
                      <div className="h-px bg-slate-800" />
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Total Payback</p>
                        <p className="text-2xl font-black text-emerald-400">
                          ₹{Math.round(eligibleOffers[0]?.totalPayment || formData.loanAmount).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="bg-slate-800/50 p-6 rounded-[24px]">
                        <p className="text-slate-400 text-[10px] mb-2 font-bold uppercase tracking-widest text-indigo-400">Efficiency Tip</p>
                        <p className="text-xs text-slate-300 italic leading-relaxed">"Increasing your down payment by ₹50,000 could save you up to ₹12,500 in interest over 5 years."</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Basic Footer */}
      <footer className="py-12 border-t border-slate-200 mt-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm">© 2026 AutoFinance Pro. For demonstration purposes only.</p>
        </div>
      </footer>
    </div>
  );
}
