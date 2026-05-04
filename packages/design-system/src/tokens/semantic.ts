/**
 * GI Semantic State Tokens — v3 Warm-Light
 *
 * Standard status and severity semantics used across all surfaces.
 * Muted, desaturated variants for the warm-light default theme.
 */

export const semantic = {
  status: {
    success: {
      bg: '#f2f8f4',
      border: '#c5ddc9',
      text: '#4a7a5e',
      icon: '#5a8a6e',
    },
    warning: {
      bg: '#fdf8ee',
      border: '#e5d6a8',
      text: '#96802e',
      icon: '#b5973a',
    },
    error: {
      bg: '#fdf4f3',
      border: '#e5bbb8',
      text: '#a04440',
      icon: '#b85450',
    },
    info: {
      bg: '#F5F0E8',
      border: '#D4CCC0',
      text: '#5C564E',
      icon: '#6B7280',
    },
    neutral: {
      bg: '#F5F0E8',
      border: '#D4CCC0',
      text: '#5C564E',
      icon: '#8A8279',
    },
  },
  severity: {
    critical: '#b85450',
    high: '#b07040',
    medium: '#b5973a',
    low: '#6B7280',
    info: '#5C564E',
  },
  approval: {
    pending: '#b5973a',
    approved: '#5a8a6e',
    rejected: '#b85450',
    escalated: '#7e6aad',
  },
  evidence: {
    strong: '#5a8a6e',
    moderate: '#b5973a',
    weak: '#b85450',
    unverified: '#8A8279',
  },
  confidence: {
    high: '#5a8a6e',
    medium: '#b5973a',
    low: '#b85450',
  },
} as const;
