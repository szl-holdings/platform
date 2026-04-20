export interface LeadScoringInput {
  email?: string | null;
  budget?: string | null;
  source?: string | null;
  medium?: string | null;
  landingPage?: string | null;
  message?: string | null;
  visitCount?: number | null;
  ctaAfterCarousel?: boolean | null;
  interestArea?: string | null;
}

export function computeLeadScore(data: LeadScoringInput): number {
  let score = 0;

  if (data.email) {
    const freeProviders = [
      'gmail',
      'yahoo',
      'hotmail',
      'outlook',
      'icloud',
      'proton',
      'aol',
      'mail.com',
    ];
    const domain = data.email.split('@')[1]?.toLowerCase() ?? '';
    if (!freeProviders.some((p) => domain.includes(p))) score += 20;
    if (
      /^[a-z0-9]{12,}@/.test(data.email) ||
      domain.includes('mailinator') ||
      domain.includes('guerrilla') ||
      domain.includes('temp') ||
      data.email.includes('test') ||
      data.email.includes('spam') ||
      data.email.includes('fake')
    )
      score -= 10;
  }

  if (data.budget && data.budget.trim().length > 0 && data.budget !== 'not-sure') score += 15;

  if (
    data.landingPage?.includes('/lyte') ||
    data.landingPage?.includes('/alloy') ||
    data.landingPage?.includes('/offer') ||
    data.source === 'offer-page'
  )
    score += 15;

  if (
    data.source === 'linkedin' ||
    data.source?.includes('founder') ||
    data.medium === 'founder-content'
  )
    score += 10;

  if (data.visitCount && data.visitCount > 1) score += 10;

  if (data.ctaAfterCarousel === true) score += 10;

  if (data.message && data.message.length > 50) score += 5;

  return Math.max(0, Math.min(100, score));
}
