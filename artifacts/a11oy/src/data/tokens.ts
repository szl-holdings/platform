export interface TokenVersion {
  version: string;
  date: string;
  value: string;
  author: string;
}

export interface Token {
  id: string;
  name: string;
  category: 'color' | 'typography' | 'spacing' | 'radius' | 'elevation' | 'motion';
  value: string;
  description: string;
  version: string;
  lastChanged: string;
  changedBy: string;
  driftSurfaces: string[];
  history: TokenVersion[];
}

export const tokens: Token[] = [
  { id: 't-1', name: 'color-primary', category: 'color', value: '#3b82f6', description: 'Primary brand action color', version: '2.1.0', lastChanged: '2026-03-15', changedBy: 'S. Lutar', driftSurfaces: ['Terra (DOMAINE)'], history: [{version: '2.1.0', date: '2026-03-15', value: '#3b82f6', author: 'S. Lutar'}, {version: '2.0.0', date: '2025-11-10', value: '#2563eb', author: 'A. Chen'}] },
  { id: 't-2', name: 'color-surface', category: 'color', value: '#111827', description: 'Main application background', version: '1.4.2', lastChanged: '2026-01-20', changedBy: 'J. Doe', driftSurfaces: [], history: [{version: '1.4.2', date: '2026-01-20', value: '#111827', author: 'J. Doe'}] },
  { id: 't-3', name: 'color-text', category: 'color', value: '#f0f4fc', description: 'Primary body text', version: '1.1.0', lastChanged: '2025-08-05', changedBy: 'System', driftSurfaces: ['Counsel', 'Aegis'], history: [{version: '1.1.0', date: '2025-08-05', value: '#f0f4fc', author: 'System'}] },
  { id: 't-4', name: 'font-sans', category: 'typography', value: '"Inter", sans-serif', description: 'Primary interface typeface', version: '3.0.0', lastChanged: '2026-02-10', changedBy: 'S. Lutar', driftSurfaces: [], history: [{version: '3.0.0', date: '2026-02-10', value: '"Inter", sans-serif', author: 'S. Lutar'}] },
  { id: 't-5', name: 'font-mono', category: 'typography', value: '"JetBrains Mono", monospace', description: 'Code and data typeface', version: '1.0.0', lastChanged: '2024-05-12', changedBy: 'Admin', driftSurfaces: [], history: [{version: '1.0.0', date: '2024-05-12', value: '"JetBrains Mono", monospace', author: 'Admin'}] },
  { id: 't-6', name: 'space-md', category: 'spacing', value: '1rem', description: 'Standard component gap', version: '1.0.0', lastChanged: '2024-06-01', changedBy: 'Admin', driftSurfaces: ['Command'], history: [{version: '1.0.0', date: '2024-06-01', value: '1rem', author: 'Admin'}] },
  { id: 't-7', name: 'radius-lg', category: 'radius', value: '0.5rem', description: 'Standard card radius', version: '2.0.0', lastChanged: '2025-12-10', changedBy: 'A. Chen', driftSurfaces: [], history: [{version: '2.0.0', date: '2025-12-10', value: '0.5rem', author: 'A. Chen'}] },
  { id: 't-8', name: 'shadow-md', category: 'elevation', value: '0 4px 6px -1px rgb(0 0 0 / 0.1)', description: 'Standard dropdown shadow', version: '1.2.0', lastChanged: '2025-09-15', changedBy: 'J. Doe', driftSurfaces: ['Terra (DOMAINE)'], history: [{version: '1.2.0', date: '2025-09-15', value: '0 4px 6px -1px rgb(0 0 0 / 0.1)', author: 'J. Doe'}] },
  { id: 't-9', name: 'duration-fast', category: 'motion', value: '150ms', description: 'Hover transition duration', version: '1.0.0', lastChanged: '2024-05-12', changedBy: 'Admin', driftSurfaces: [], history: [{version: '1.0.0', date: '2024-05-12', value: '150ms', author: 'Admin'}] },
  { id: 't-10', name: 'ease-out', category: 'motion', value: 'cubic-bezier(0, 0, 0.2, 1)', description: 'Standard exit easing', version: '1.0.0', lastChanged: '2024-05-12', changedBy: 'Admin', driftSurfaces: [], history: [{version: '1.0.0', date: '2024-05-12', value: 'cubic-bezier(0, 0, 0.2, 1)', author: 'Admin'}] }
];
