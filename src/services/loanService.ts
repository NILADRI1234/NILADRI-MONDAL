import { Bank, LoanProfile, LoanOffer } from '../types';

export function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  const monthlyRate = annualRate / (12 * 100);
  // Correct formula: P * r * (1+r)^n / ((1+r)^n - 1)
  const powerFactor = Math.pow(1 + monthlyRate, tenureMonths);
  return (principal * monthlyRate * powerFactor) / (powerFactor - 1);
}

export function checkEligibility(profile: LoanProfile, banks: Bank[]): LoanOffer[] {
  return banks.map(bank => {
    let eligible = true;
    let reason = '';

    // Rule 1: CIBIL Score (Standard Indian metric)
    if (profile.cibilScore < bank.minCibilScore) {
      eligible = false;
      reason = `CIBIL score below required ${bank.minCibilScore}`;
    }

    // Rule 2: LTV Ratio (Max permissible by RBI usually 85-90% for car loans)
    const ltv = profile.loanAmount / profile.carPrice;
    if (ltv > bank.maxLTV) {
      eligible = false;
      reason = `Loan amount exceeds ${Math.round(bank.maxLTV * 100)}% of car's on-road price`;
    }

    // Rule 3: FOIR (Fixed Obligation to Income Ratio)
    // Indian banks usually cap this at 50% for lower brackets and 60% for HNI
    const upcomingEMI = calculateEMI(profile.loanAmount, bank.baseRate, profile.tenure);
    const totalObligation = profile.monthlyEMIExisting + upcomingEMI;
    const foir = totalObligation / profile.monthlyIncome;

    if (foir > 0.50) {
      eligible = false;
      reason = 'Monthly obligations (FOIR) exceed bank safety limits';
    }

    const monthlyEMI = upcomingEMI;
    const totalPayment = monthlyEMI * profile.tenure;
    const totalInterest = totalPayment - profile.loanAmount;

    return {
      bankId: bank.id,
      bankName: bank.name,
      bankType: bank.type,
      interestRate: bank.baseRate,
      monthlyEMI,
      totalInterest,
      totalPayment,
      eligible,
      reason
    };
  });
}
