const API = '/api';

function getCsrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

export interface Site {
  id: number;
  slug: string;
  name: string;
  brandLabel?: string;
  description?: string;
  isActive: boolean;
}
export interface Venture {
  id: number;
  slug: string;
  name: string;
  shortDescription?: string;
  statusBadge?: string;
  stage?: string;
  isFeatured: boolean;
  sortOrder: number;
  primaryCtaLabel?: string;
  primaryCtaUrl?: string;
}
export interface CmsPage {
  id: number;
  siteId: number;
  title: string;
  slug: string;
  status: string;
  metaTitle?: string;
  metaDescription?: string;
  publishedAt?: string;
  updatedAt: string;
}
export interface Article {
  id: number;
  siteId: number;
  slug: string;
  title: string;
  excerpt?: string;
  authorName?: string;
  status: string;
  publishedAt?: string;
  updatedAt: string;
}
export interface CaseStudy {
  id: number;
  siteId: number;
  slug: string;
  title: string;
  summary?: string;
  status: string;
  updatedAt: string;
}
export interface RoadmapItem {
  id: number;
  siteId: number;
  title: string;
  description?: string;
  phaseLabel?: string;
  status: string;
  targetQuarter?: string;
  sortOrder: number;
}
export interface Update {
  id: number;
  siteId: number;
  slug: string;
  title: string;
  summary?: string;
  status: string;
  publishedAt?: string;
  updatedAt: string;
}
export interface Testimonial {
  id: number;
  siteId: number;
  quote: string;
  attributionName?: string;
  attributionTitle?: string;
  isPublic: boolean;
  sortOrder: number;
}
export interface Faq {
  id: number;
  siteId: number;
  question: string;
  answerRichtext?: string;
  category?: string;
  sortOrder: number;
}
export interface Cta {
  id: number;
  siteId: number;
  label: string;
  url: string;
  variant?: string;
  helperText?: string;
}
export interface NavigationItem {
  id: number;
  siteId: number;
  navGroup: string;
  label: string;
  url: string;
  sortOrder: number;
  isEnabled: boolean;
}
export interface ContactSubmission {
  id: number;
  formKey: string;
  fullName: string;
  email: string;
  company?: string;
  message?: string;
  createdAt: string;
}
export interface HoldingsInquiry {
  id: number;
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
  status: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  createdAt: string;
}
export interface Service {
  id: number;
  siteId: number;
  slug: string;
  title: string;
  shortDescription?: string;
  category?: string;
  isFeatured: boolean;
  sortOrder: number;
}

export async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const method = (opts?.method ?? 'GET').toUpperCase();
  const needsCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(needsCsrf ? { 'x-csrf-token': getCsrfToken() } : {}),
      ...opts?.headers,
    },
    ...opts,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  return json.data ?? json;
}

export async function apiFetchAdmin<T>(path: string, opts?: RequestInit): Promise<T> {
  const method = (opts?.method ?? 'GET').toUpperCase();
  const needsCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(needsCsrf ? { 'x-csrf-token': getCsrfToken() } : {}),
      ...((opts?.headers as Record<string, string>) || {}),
    },
    ...opts,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  return json.data ?? json;
}
