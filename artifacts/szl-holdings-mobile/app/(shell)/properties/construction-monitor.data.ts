export interface Milestone {
  id: string;
  label: string;
  dueDate: string;
  status: 'complete' | 'in-progress' | 'upcoming' | 'delayed';
  completedDate?: string;
}

export interface BudgetLine {
  category: string;
  budgeted: number;
  spent: number;
  committed: number;
}

export interface ConstructionProject {
  id: string;
  name: string;
  address: string;
  type: string;
  totalBudget: number;
  spentToDate: number;
  percentComplete: number;
  startDate: string;
  targetCompletion: string;
  gcName: string;
  inspectionStatus: 'passed' | 'pending' | 'failed' | 'scheduled';
  flags: string[];
  milestones: Milestone[];
  budgetLines: BudgetLine[];
}

export const PROJECTS: ConstructionProject[] = [
  {
    id: 'cp-1',
    name: 'Harborview Mixed-Use',
    address: '850 Harbor Ave, Miami, FL',
    type: 'Mixed-Use Development',
    totalBudget: 12_400_000,
    spentToDate: 7_920_000,
    percentComplete: 63,
    startDate: 'Jan 2024',
    targetCompletion: 'Nov 2025',
    gcName: 'Meridian Construction Group',
    inspectionStatus: 'passed',
    flags: ['Steel delivery delayed 3 weeks', 'Change order #14 pending approval'],
    milestones: [
      { id: 'm1', label: 'Site Prep & Demo', dueDate: 'Mar 2024', status: 'complete', completedDate: 'Mar 2024' },
      { id: 'm2', label: 'Foundation & Slab', dueDate: 'Jun 2024', status: 'complete', completedDate: 'Jul 2024' },
      { id: 'm3', label: 'Steel Framing', dueDate: 'Oct 2024', status: 'complete', completedDate: 'Nov 2024' },
      { id: 'm4', label: 'MEP Rough-In', dueDate: 'Feb 2025', status: 'in-progress' },
      { id: 'm5', label: 'Exterior Envelope', dueDate: 'May 2025', status: 'upcoming' },
      { id: 'm6', label: 'Interior Finishes', dueDate: 'Aug 2025', status: 'upcoming' },
      { id: 'm7', label: 'Certificate of Occupancy', dueDate: 'Nov 2025', status: 'upcoming' },
    ],
    budgetLines: [
      { category: 'Site Work', budgeted: 1_100_000, spent: 1_100_000, committed: 0 },
      { category: 'Foundation', budgeted: 1_800_000, spent: 1_820_000, committed: 0 },
      { category: 'Framing / Steel', budgeted: 3_200_000, spent: 3_010_000, committed: 280_000 },
      { category: 'MEP', budgeted: 2_400_000, spent: 1_490_000, committed: 600_000 },
      { category: 'Exterior', budgeted: 1_400_000, spent: 500_000, committed: 700_000 },
      { category: 'Finishes', budgeted: 1_800_000, spent: 0, committed: 0 },
      { category: 'Contingency', budgeted: 700_000, spent: 0, committed: 0 },
    ],
  },
  {
    id: 'cp-2',
    name: 'Northgate Industrial',
    address: '3200 Industrial Pkwy, Houston, TX',
    type: 'Industrial / Warehouse',
    totalBudget: 5_800_000,
    spentToDate: 1_160_000,
    percentComplete: 20,
    startDate: 'Oct 2024',
    targetCompletion: 'Jun 2026',
    gcName: 'Apex Build & Design',
    inspectionStatus: 'scheduled',
    flags: [],
    milestones: [
      { id: 'm8', label: 'Site Clearing', dueDate: 'Nov 2024', status: 'complete', completedDate: 'Nov 2024' },
      { id: 'm9', label: 'Utilities & Infrastructure', dueDate: 'Jan 2025', status: 'complete', completedDate: 'Feb 2025' },
      { id: 'm10', label: 'Slab & Tilt-Up Panels', dueDate: 'Apr 2025', status: 'in-progress' },
      { id: 'm11', label: 'Structural Steel', dueDate: 'Jul 2025', status: 'upcoming' },
      { id: 'm12', label: 'Roof & Exterior', dueDate: 'Oct 2025', status: 'upcoming' },
      { id: 'm13', label: 'Dock Doors & Grade Levelers', dueDate: 'Feb 2026', status: 'upcoming' },
      { id: 'm14', label: 'Punch List & CO', dueDate: 'Jun 2026', status: 'upcoming' },
    ],
    budgetLines: [
      { category: 'Site Work', budgeted: 620_000, spent: 600_000, committed: 20_000 },
      { category: 'Foundation / Slab', budgeted: 1_100_000, spent: 480_000, committed: 440_000 },
      { category: 'Structure & Roof', budgeted: 1_900_000, spent: 80_000, committed: 1_200_000 },
      { category: 'MEP & Fire', budgeted: 900_000, spent: 0, committed: 200_000 },
      { category: 'Dock Equipment', budgeted: 480_000, spent: 0, committed: 0 },
      { category: 'Contingency', budgeted: 800_000, spent: 0, committed: 0 },
    ],
  },
];
