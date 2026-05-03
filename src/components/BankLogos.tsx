import React from 'react';

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export const SBILogo = (props: LogoProps) => (
  <svg viewBox="0 0 100 100" {...props}>
    <circle cx="50" cy="50" r="45" fill="#0066b3" />
    <circle cx="50" cy="50" r="15" fill="white" />
    <rect x="45" y="50" width="10" height="40" fill="white" />
  </svg>
);

export const HDFCLogo = (props: LogoProps) => (
  <svg viewBox="0 0 100 100" {...props}>
    <rect x="10" y="10" width="80" height="80" fill="#004184" rx="4" />
    <rect x="25" y="25" width="50" height="50" fill="white" rx="2" />
    <rect x="35" y="35" width="30" height="30" fill="#ed1c24" />
  </svg>
);

export const ICICILogo = (props: LogoProps) => (
  <svg viewBox="0 0 100 100" {...props}>
    <path d="M10 20 L25 20 L25 80 L10 80 Z" fill="#b12704" />
    <path d="M35 20 L80 20 L80 35 L50 35 L50 50 L75 50 L75 65 L50 65 L50 80 L35 80 Z" fill="#f68b1e" />
  </svg>
);

export const AxisLogo = (props: LogoProps) => (
  <svg viewBox="0 0 100 100" {...props}>
    <path d="M10 80 L50 20 L90 80 H70 L50 45 L30 80 Z" fill="#97124a" />
  </svg>
);

export const KotakLogo = (props: LogoProps) => (
  <svg viewBox="0 0 100 100" {...props}>
    <circle cx="50" cy="50" r="40" fill="#ed1c24" />
    <text x="50" y="58" textAnchor="middle" fill="white" fontSize="30" fontWeight="bold">k</text>
  </svg>
);

export const PNBLogo = (props: LogoProps) => (
  <svg viewBox="0 0 100 100" {...props}>
    <rect x="20" y="20" width="60" height="60" stroke="#a21920" strokeWidth="12" fill="none" rx="4" />
    <rect x="42" y="35" width="16" height="30" fill="#f7ab1b" />
  </svg>
);

export const BOBLogo = (props: LogoProps) => (
  <svg viewBox="0 0 100 100" {...props}>
    <path d="M20 20 Q50 10 80 20 Q90 50 80 80 Q50 90 20 80 Q10 50 20 20" fill="#f47920" />
    <path d="M35 40 Q50 30 65 40 Q50 60 35 40" fill="white" />
  </svg>
);

export const CanaraLogo = (props: LogoProps) => (
  <svg viewBox="0 0 100 100" {...props}>
    <path d="M10 50 Q10 10 50 10 Q90 10 90 50 Q90 90 50 90 Q10 90 10 50" fill="#00a8e1" stroke="#fdb913" strokeWidth="4" />
    <path d="M30 40 L70 40 L50 70 Z" fill="white" />
  </svg>
);

export const MahindraLogo = (props: LogoProps) => (
  <svg viewBox="0 0 100 100" {...props}>
    <path d="M10 80 V20 L50 50 L90 20 V80 H80 V40 L50 65 L20 40 V80 Z" fill="#e31e24" />
  </svg>
);

export const TataLogo = (props: LogoProps) => (
  <svg viewBox="0 0 100 100" {...props}>
    <path d="M20 30 C20 10 80 10 80 30 V80 H65 V30 C65 25 35 25 35 30 V80 H20 Z" fill="#0054a6" />
  </svg>
);

export const BajajLogo = (props: LogoProps) => (
  <svg viewBox="0 0 100 100" {...props}>
    <path d="M10 20 L40 20 L55 50 L70 20 L100 20 L65 80 L45 80 Z" fill="#005da4" />
  </svg>
);

export const CholaLogo = (props: LogoProps) => (
  <svg viewBox="0 0 100 100" {...props}>
    <circle cx="50" cy="50" r="45" fill="#ed1c24" />
    <path d="M30 40 Q50 20 70 40 Q50 60 30 40" fill="white" />
    <rect x="45" y="45" width="10" height="30" fill="white" />
  </svg>
);

export const BankLogo = ({ logo, className }: { logo: string; className?: string }) => {
  switch (logo) {
    case 'sbi': return <SBILogo className={className} />;
    case 'hdfc': return <HDFCLogo className={className} />;
    case 'icici': return <ICICILogo className={className} />;
    case 'axis': return <AxisLogo className={className} />;
    case 'kotak': return <KotakLogo className={className} />;
    case 'pnb': return <PNBLogo className={className} />;
    case 'bob': return <BOBLogo className={className} />;
    case 'canara': return <CanaraLogo className={className} />;
    case 'mahindra': return <MahindraLogo className={className} />;
    case 'tata': return <TataLogo className={className} />;
    case 'bajaj': return <BajajLogo className={className} />;
    case 'chola': return <CholaLogo className={className} />;
    default: return <Landmark className={className} />;
  }
};

import { Landmark } from 'lucide-react';
