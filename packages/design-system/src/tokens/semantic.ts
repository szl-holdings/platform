/**
 * AEEP Semantic State Tokens
 *
 * Standard status and severity semantics used across all surfaces.
 * All values reference the color token system — never raw hex here.
 */

export const semantic = {
  status: {
    success: {
      bg: '#0d2a1a',
      border: '#1a4a2a',
      text: '#5baa8a',
      icon: '#5baa8a',
    },
    warning: {
      bg: '#2a2010',
      border: '#4a3810',
      text: '#c9a85c',
      icon: '#c9a85c',
    },
    error: {
      bg: '#2a0d12',
      border: '#4a1a22',
      text: '#c96070',
      icon: '#c96070',
    },
    info: {
      bg: '#0d1a2a',
      border: '#1a304a',
      text: '#4d8fcc',
      icon: '#4d8fcc',
    },
    neutral: {
      bg: '#111c2a',
      border: '#243040',
      text: '#7a99b8',
      icon: '#7a99b8',
    },
  },
  severity: {
    critical: '#c96070',
    high: '#c9a05c',
    medium: '#c9a85c',
    low: '#7a99b8',
    info: '#4d8fcc',
  },
  approval: {
    pending: '#c9a85c',
    approved: '#5baa8a',
    rejected: '#c96070',
    escalated: '#9b7cc8',
  },
  evidence: {
    strong: '#5baa8a',
    moderate: '#c9a85c',
    weak: '#c96070',
    unverified: '#4a6070',
  },
  confidence: {
    high: '#5baa8a',
    medium: '#c9a85c',
    low: '#c96070',
  },
} as const;
