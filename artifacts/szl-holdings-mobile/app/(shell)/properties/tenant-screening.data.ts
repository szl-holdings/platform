export type ScreeningStatus = 'approved' | 'pending' | 'in-review' | 'denied' | 'more-info';

export interface ScreeningApplication {
  id: string;
  applicantName: string;
  property: string;
  unit: string;
  submittedDate: string;
  status: ScreeningStatus;
  creditScore: number;
  creditGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  annualIncome: number;
  monthlyRent: number;
  rentToIncome: number;
  backgroundCheck: 'clear' | 'flag' | 'pending';
  evictionHistory: boolean;
  employmentStatus: 'verified' | 'pending' | 'unverified';
  references: 'checked' | 'pending' | 'failed';
  notes?: string;
}

export const APPLICATIONS: ScreeningApplication[] = [
  {
    id: 'ts-1',
    applicantName: 'Marcus D. Holloway',
    property: 'Westside Plaza Apts',
    unit: '4B',
    submittedDate: 'Apr 12, 2026',
    status: 'approved',
    creditScore: 748,
    creditGrade: 'A',
    annualIncome: 114_000,
    monthlyRent: 2_850,
    rentToIncome: 30,
    backgroundCheck: 'clear',
    evictionHistory: false,
    employmentStatus: 'verified',
    references: 'checked',
  },
  {
    id: 'ts-2',
    applicantName: 'Priya Anand',
    property: 'Harborview Mixed-Use',
    unit: '12C',
    submittedDate: 'Apr 14, 2026',
    status: 'in-review',
    creditScore: 682,
    creditGrade: 'B',
    annualIncome: 88_000,
    monthlyRent: 2_400,
    rentToIncome: 33,
    backgroundCheck: 'clear',
    evictionHistory: false,
    employmentStatus: 'verified',
    references: 'pending',
    notes: 'Awaiting reference from previous landlord',
  },
  {
    id: 'ts-3',
    applicantName: 'Jordan P. Reyes',
    property: 'Gateway Commerce Center',
    unit: 'Suite 1100',
    submittedDate: 'Apr 15, 2026',
    status: 'pending',
    creditScore: 611,
    creditGrade: 'C',
    annualIncome: 72_000,
    monthlyRent: 2_200,
    rentToIncome: 37,
    backgroundCheck: 'pending',
    evictionHistory: false,
    employmentStatus: 'pending',
    references: 'pending',
  },
  {
    id: 'ts-4',
    applicantName: 'Keisha N. Bridges',
    property: 'Riverside Logistics Park',
    unit: 'B2',
    submittedDate: 'Apr 10, 2026',
    status: 'more-info',
    creditScore: 589,
    creditGrade: 'C',
    annualIncome: 64_000,
    monthlyRent: 2_100,
    rentToIncome: 39,
    backgroundCheck: 'flag',
    evictionHistory: false,
    employmentStatus: 'verified',
    references: 'checked',
    notes: 'Criminal background flag — minor infraction 6 yrs ago. Awaiting documentation',
  },
  {
    id: 'ts-5',
    applicantName: 'Tomás Vega-Cruz',
    property: 'Northgate Industrial',
    unit: 'Unit C',
    submittedDate: 'Apr 8, 2026',
    status: 'denied',
    creditScore: 512,
    creditGrade: 'D',
    annualIncome: 48_000,
    monthlyRent: 2_000,
    rentToIncome: 50,
    backgroundCheck: 'flag',
    evictionHistory: true,
    employmentStatus: 'unverified',
    references: 'failed',
    notes: 'Prior eviction 2022. Income insufficient at 50% ratio. Background flag.',
  },
];
