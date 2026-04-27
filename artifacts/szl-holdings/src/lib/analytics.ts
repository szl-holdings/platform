import posthog from 'posthog-js';

const ANALYTICS_INGEST_URL = '/api/analytics-engine/events';
const SOURCE_APP = 'szl-holdings';
const DOMAIN = 'szl-holdings';

const SESSION_STORAGE_KEY = 'szl_analytics_session_id';

function getSessionId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    let id = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!id) {
      id = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return undefined;
  }
}

// Strict allow-list of property keys that may be forwarded to the server-side
// funnel store. Anything not on this list is dropped to keep PII out of the
// analytics events table (no email, name, message, phone, address, etc.).
const SAFE_PROPERTY_KEYS = new Set([
  'site',
  'page',
  'section',
  'cta_label',
  'form_key',
  'product_key',
  'plan_key',
  'content_slug',
  'source',
  'depth',
  'label',
  'href',
  'venture_id',
  'venture_name',
  'node_id',
  'filter_type',
  'filter_value',
  'title',
  'inquiry_type',
  'funnel',
  'funnel_step',
  'referrer',
]);

function sanitizeProperties(
  properties: EventProperties | undefined,
): Record<string, string | number | boolean> {
  if (!properties) return {};
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(properties)) {
    if (v === undefined || v === null) continue;
    if (!SAFE_PROPERTY_KEYS.has(k)) continue;
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      out[k] = v;
    }
  }
  return out;
}

function sendToFunnelStore(event: string, properties?: EventProperties): void {
  if (typeof window === 'undefined') return;
  try {
    const payload = {
      eventName: event,
      domain: DOMAIN,
      sourceApp: SOURCE_APP,
      properties: sanitizeProperties(properties),
      occurredAt: new Date().toISOString(),
      context: {
        sessionId: getSessionId(),
        url: window.location.pathname,
        platform: 'web',
      },
    };
    const body = JSON.stringify(payload);
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      const sent = navigator.sendBeacon(ANALYTICS_INGEST_URL, blob);
      if (sent) return;
    }
    void fetch(ANALYTICS_INGEST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
      credentials: 'include',
    }).catch(() => {});
  } catch (_err) {
    if (import.meta.env.DEV) {
    }
  }
}

type EventName =
  | 'page_view'
  | 'landing_view'
  | 'pricing_view'
  | 'contact_view'
  | 'cta_click'
  | 'form_submit'
  | 'demo_request'
  | 'access_request'
  | 'private_inquiry_submit'
  | 'download_asset'
  | 'sign_in'
  | 'sign_up'
  | 'dashboard_view'
  | 'alert_view'
  | 'report_view'
  | 'billing_portal_open'
  | 'checkout_started'
  | 'checkout_completed'
  | 'article_view'
  | 'case_study_view'
  | 'hero_cta_click'
  | 'venture_card_click'
  | 'founder_page_view'
  | 'contact_funnel_start'
  | 'contact_form_submit'
  | 'resume_download_click'
  | 'venture_detail_view'
  | 'scroll_depth'
  | 'ecosystem_node_click'
  | 'portfolio_filter'
  | 'insights_article_click'
  | 'nav_link_click'
  | 'trust_center_viewed'
  | 'design_partner_interest'
  | 'diligence_requested'
  | 'domain_pack_viewed'
  | 'audience_path_click'
  | 'newsletter_signup'
  | 'diligence_brief_viewed'
  | 'diligence_brief_downloaded';

interface EventProperties {
  site?: string;
  page?: string;
  section?: string;
  cta_label?: string;
  form_key?: string;
  product_key?: string;
  organization_id?: string;
  plan_key?: string;
  content_slug?: string;
  [key: string]: string | number | boolean | undefined;
}

function track(event: EventName, properties?: EventProperties): void {
  if (typeof window === 'undefined') return;
  if (typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', event, properties);
  }
  try {
    posthog.capture(event, properties);
  } catch (_err) {
    if (import.meta.env.DEV) {
    }
  }
  // Persist to the in-app funnel store so the founder dashboard works even
  // without a configured external analytics provider.
  sendToFunnelStore(event, properties);
  if (import.meta.env.DEV) {
  }
}

const scrollDepthThresholds = [25, 50, 75, 90];
let trackedDepths: number[] = [];

export function initScrollDepthTracking(pageSlug: string): () => void {
  trackedDepths = [];

  const handler = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    const pct = Math.round((scrollTop / docHeight) * 100);
    for (const threshold of scrollDepthThresholds) {
      if (pct >= threshold && !trackedDepths.includes(threshold)) {
        trackedDepths.push(threshold);
        track('scroll_depth', { page: pageSlug, depth: threshold });
      }
    }
  };

  window.addEventListener('scroll', handler, { passive: true });
  return () => window.removeEventListener('scroll', handler);
}

// Pages that participate in the acquisition funnel and should have PostHog
// session recordings enabled to surface UX friction. Recording is started
// programmatically (init keeps it off by default) so we do not record
// authenticated dashboards.
const MARKETING_FUNNEL_PAGES = new Set(['/', '/landing', '/contact', '/pricing']);

export function startMarketingSessionRecording(page: string): void {
  if (typeof window === 'undefined') return;
  if (!MARKETING_FUNNEL_PAGES.has(page)) return;
  try {
    if (typeof posthog.startSessionRecording === 'function') {
      posthog.startSessionRecording();
    }
  } catch (_err) {
    if (import.meta.env.DEV) {
    }
  }
}

export function stopMarketingSessionRecording(): void {
  if (typeof window === 'undefined') return;
  try {
    if (typeof posthog.stopSessionRecording === 'function') {
      posthog.stopSessionRecording();
    }
  } catch {
    /* noop */
  }
}

const PAGE_VIEW_TRACKING_ENDPOINT = '/api/track/page-view';

/**
 * Fire-and-forget POST to the anonymous page-view tracking endpoint.
 * Uses the same sessionStorage session ID as the rest of the analytics module
 * so all events from one browser tab share a stable ID.
 */
export function sendPageViewEvent(path: string): void {
  if (typeof window === 'undefined') return;
  const sessionId = getSessionId();
  if (!sessionId) return;
  try {
    const payload: Record<string, string | null> = {
      sessionId,
      path,
      referrer: document.referrer || null,
      userAgent: navigator.userAgent || null,
    };
    void fetch(PAGE_VIEW_TRACKING_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // noop — tracking must never break the page
  }
}

export const analytics = {
  pageView: (page: string, site = 'szl-holdings') => track('page_view', { site, page }),

  // Acquisition funnel step 1: marketing landing page viewed.
  landingView: (page = '/') =>
    track('landing_view', { site: 'szl-holdings', page, funnel: 'acquisition', funnel_step: 1 }),

  // Acquisition funnel: pricing page viewed (intermediate intent signal).
  pricingView: (page = '/pricing') =>
    track('pricing_view', { site: 'szl-holdings', page, funnel: 'acquisition' }),

  // Acquisition funnel step 3 entry: contact page viewed.
  contactView: (page = '/contact') =>
    track('contact_view', { site: 'szl-holdings', page, funnel: 'acquisition', funnel_step: 3 }),

  ctaClick: (label: string, page: string, section?: string, site = 'szl-holdings') =>
    track('cta_click', { cta_label: label, page, section, site }),

  formSubmit: (formKey: string, page: string, site = 'szl-holdings') =>
    track('form_submit', { form_key: formKey, page, site }),

  demoRequest: (source = 'unknown', productKey?: string, site = 'szl-holdings') =>
    track('demo_request', { site, source, ...(productKey ? { product_key: productKey } : {}) }),

  accessRequest: (site = 'inca') => track('access_request', { site }),

  privateInquirySubmit: (site = 'carlota-jo') => track('private_inquiry_submit', { site }),

  downloadAsset: (contentSlug: string, site = 'szl-holdings') =>
    track('download_asset', { content_slug: contentSlug, site }),

  signIn: (site = 'szl-holdings') => track('sign_in', { site }),

  dashboardView: (page: string, site = 'szl-holdings') => track('dashboard_view', { page, site }),

  alertView: (contentSlug: string, site = 'szl-holdings') =>
    track('alert_view', { content_slug: contentSlug, site }),

  reportView: (contentSlug: string, site = 'szl-holdings') =>
    track('report_view', { content_slug: contentSlug, site }),

  articleView: (contentSlug: string, site = 'szl-holdings') =>
    track('article_view', { content_slug: contentSlug, site }),

  caseStudyView: (contentSlug: string, site = 'szl-holdings') =>
    track('case_study_view', { content_slug: contentSlug, site }),

  heroCTAClick: (ctaLabel: string, section = 'hero') => {
    const page = typeof window !== 'undefined' ? window.location.pathname || '/' : '/';
    track('hero_cta_click', { cta_label: ctaLabel, section, site: 'szl-holdings' });
    // Also emit the canonical funnel-step-2 event so the acquisition funnel
    // (landing_view -> cta_click -> contact_form_submit -> demo_request)
    // captures landing-origin sessions. Page is derived dynamically so the
    // helper attributes correctly if reused outside the landing page.
    track('cta_click', { cta_label: ctaLabel, section, page, site: 'szl-holdings' });
  },

  ventureCardClick: (ventureId: string, ventureName: string) =>
    track('venture_card_click', { venture_id: ventureId, venture_name: ventureName }),

  founderPageView: () => track('founder_page_view', { site: 'szl-holdings' }),

  contactFunnelStart: (inquiryType: string) =>
    track('contact_funnel_start', { inquiry_type: inquiryType }),

  contactFormSubmit: (inquiryType: string) =>
    track('contact_form_submit', { form_key: inquiryType, site: 'szl-holdings' }),

  resumeDownloadClick: () =>
    track('download_asset', { content_slug: 'resume', site: 'stephen-site' }),

  ventureDetailView: (ventureId: string) => track('venture_detail_view', { venture_id: ventureId }),

  ecosystemNodeClick: (nodeId: string) => track('ecosystem_node_click', { node_id: nodeId }),

  portfolioFilter: (filterType: string, filterValue: string) =>
    track('portfolio_filter', { filter_type: filterType, filter_value: filterValue }),

  insightsArticleClick: (slug: string, title: string) =>
    track('article_view', { content_slug: slug, title }),

  navLinkClick: (label: string, href: string) => track('nav_link_click', { label, href }),

  trustCenterView: (source: string, page = '/') =>
    track('trust_center_viewed', { source, page, site: 'szl-holdings' }),

  designPartnerInterest: (source: string, page = '/') =>
    track('design_partner_interest', { source, page, site: 'szl-holdings' }),

  diligenceRequested: (source: string, page = '/') =>
    track('diligence_requested', { source, page, site: 'szl-holdings' }),

  domainPackViewed: (packSlug: string, page = '/') =>
    track('domain_pack_viewed', { product_key: packSlug, page, site: 'szl-holdings' }),

  audiencePathClick: (pathLabel: string, destination: string) =>
    track('audience_path_click', { cta_label: pathLabel, page: destination, site: 'szl-holdings' }),

  newsletterSignup: (source: string, site = 'szl-holdings') =>
    track('newsletter_signup', { source, site }),

  diligenceBriefView: (
    evaluatorType: 'executive' | 'technical' | 'security' | 'investor',
  ) =>
    track('diligence_brief_viewed', {
      evaluator_type: evaluatorType,
      page: `/trust/diligence/${evaluatorType}`,
      site: 'szl-holdings',
    }),

  diligenceBriefDownload: (
    evaluatorType: 'executive' | 'technical' | 'security' | 'investor',
  ) =>
    track('diligence_brief_downloaded', {
      evaluator_type: evaluatorType,
      page: `/trust/diligence/${evaluatorType}`,
      site: 'szl-holdings',
    }),
};
