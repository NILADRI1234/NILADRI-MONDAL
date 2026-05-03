export type BankType = 'Public' | 'Private' | 'NBFC';

export interface Bank {
  id: string;
  name: string;
  logo: string;
  type: BankType;
  baseRate: number;
  minCibilScore: number;
  maxLTV: number;
  processingFee: number;
  prepaymentCharges: string;
  requiredDocuments: string[];
}

export interface LoanProfile {
  monthlyIncome: number;
  monthlyEMIExisting: number;
  employmentType: 'Salaried' | 'Self-Employed';
  cibilScore: number;
  carPrice: number;
  loanAmount: number;
  tenure: number; // in months
}

export interface LoanOffer {
  bankId: string;
  bankName: string;
  bankType: BankType;
  interestRate: number;
  monthlyEMI: number;
  totalInterest: number;
  totalPayment: number;
  eligible: boolean;
  reason?: string;
}

const COMMON_DOC_REQS = {
  identity: 'Aadhaar Card (Linked to Mobile) & PAN Card',
  income: 'Latest 6 Months Bank Statement (E-Statement)',
  itr: 'Last 2 Years ITR with Computation of Income',
  employment: 'Latest 3 Months Salary Slips (Salaried Only)',
};

export const SALARIED_DOCS = [COMMON_DOC_REQS.identity, COMMON_DOC_REQS.employment, COMMON_DOC_REQS.income];
export const SELF_EMPLOYED_DOCS = [COMMON_DOC_REQS.identity, COMMON_DOC_REQS.itr, COMMON_DOC_REQS.income, 'Business Proof (GST/MSME)'];

export const BANKS: Bank[] = [
  {
    id: 'sbi-car',
    name: 'State Bank of India',
    logo: 'sbi',
    type: 'Public',
    baseRate: 7.85,
    minCibilScore: 750,
    maxLTV: 0.85,
    processingFee: 1500,
    prepaymentCharges: 'Nil for dynamic rate',
    requiredDocuments: SALARIED_DOCS,
  },
  {
    id: 'bob-car',
    name: 'Bank of Baroda',
    logo: 'bob',
    type: 'Public',
    baseRate: 7.75,
    minCibilScore: 740,
    maxLTV: 0.90,
    processingFee: 1500,
    prepaymentCharges: 'Nil',
    requiredDocuments: SALARIED_DOCS,
  },
  {
    id: 'pnb-car',
    name: 'Punjab National Bank',
    logo: 'pnb',
    type: 'Public',
    baseRate: 7.95,
    minCibilScore: 730,
    maxLTV: 0.85,
    processingFee: 1000,
    prepaymentCharges: 'Nil',
    requiredDocuments: SALARIED_DOCS,
  },
  {
    id: 'canara-car',
    name: 'Canara Bank',
    logo: 'canara',
    type: 'Public',
    baseRate: 8.95,
    minCibilScore: 720,
    maxLTV: 0.85,
    processingFee: 1200,
    prepaymentCharges: 'Nil',
    requiredDocuments: SALARIED_DOCS,
  },
  {
    id: 'hdfc-car',
    name: 'HDFC Bank',
    logo: 'hdfc',
    type: 'Private',
    baseRate: 9.1,
    minCibilScore: 700,
    maxLTV: 0.90,
    processingFee: 3500,
    prepaymentCharges: '1% after 12 months',
    requiredDocuments: SALARIED_DOCS,
  },
  {
    id: 'icici-car',
    name: 'ICICI Bank',
    logo: 'icici',
    type: 'Private',
    baseRate: 9.3,
    minCibilScore: 680,
    maxLTV: 0.90,
    processingFee: 2500,
    prepaymentCharges: '5% of principal',
    requiredDocuments: SALARIED_DOCS,
  },
  {
    id: 'axis-car',
    name: 'Axis Bank',
    logo: 'axis',
    type: 'Private',
    baseRate: 9.25,
    minCibilScore: 710,
    maxLTV: 0.85,
    processingFee: 3000,
    prepaymentCharges: '4% of principal',
    requiredDocuments: SALARIED_DOCS,
  },
  {
    id: 'kotak-car',
    name: 'Kotak Mahindra',
    logo: 'kotak',
    type: 'Private',
    baseRate: 9.05,
    minCibilScore: 715,
    maxLTV: 0.90,
    processingFee: 2000,
    prepaymentCharges: '1% after 1 year',
    requiredDocuments: SALARIED_DOCS,
  },
  {
    id: 'mahindra-finance',
    name: 'Mahindra Finance',
    logo: 'mahindra',
    type: 'NBFC',
    baseRate: 10.5,
    minCibilScore: 600,
    maxLTV: 0.95,
    processingFee: 5000,
    prepaymentCharges: 'Nil after 2 years',
    requiredDocuments: SELF_EMPLOYED_DOCS,
  },
  {
    id: 'tata-capital',
    name: 'Tata Capital',
    logo: 'tata',
    type: 'NBFC',
    baseRate: 10.25,
    minCibilScore: 650,
    maxLTV: 0.90,
    processingFee: 4500,
    prepaymentCharges: '2% of principal',
    requiredDocuments: SALARIED_DOCS,
  },
  {
    id: 'bajaj-finserv',
    name: 'Bajaj Finserv',
    logo: 'bajaj',
    type: 'NBFC',
    baseRate: 11.0,
    minCibilScore: 620,
    maxLTV: 0.85,
    processingFee: 2000,
    prepaymentCharges: 'Nil (Flexible)',
    requiredDocuments: SALARIED_DOCS,
  },
  {
    id: 'chola-finance',
    name: 'Cholamandalam',
    logo: 'chola',
    type: 'NBFC',
    baseRate: 10.75,
    minCibilScore: 630,
    maxLTV: 0.95,
    processingFee: 3000,
    prepaymentCharges: '3% of principal',
    requiredDocuments: SELF_EMPLOYED_DOCS,
  }
];
