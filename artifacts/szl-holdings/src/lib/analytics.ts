type EventName =
  | "page_view"
  | "cta_click"
  | "form_submit"
  | "demo_request"
  | "access_request"
  | "private_inquiry_submit"
  | "download_asset"
  | "sign_in"
  | "sign_up"
  | "dashboard_view"
  | "alert_view"
  | "report_view"
  | "billing_portal_open"
  | "checkout_started"
  | "checkout_completed"
  | "article_view"
  | "case_study_view"
  | "hero_cta_click"
  | "venture_card_click"
  | "founder_page_view"
  | "contact_funnel_start"
  | "contact_form_submit"
  | "resume_download_click"
  | "venture_detail_view"
  | "scroll_depth"
  | "ecosystem_node_click"
  | "portfolio_filter"
  | "insights_article_click"
  | "nav_link_click"
  | "pricing_tier_view"
  | "pricing_cta_click"
  | "email_capture"
  | "exit_intent_shown"
  | "chat_opened"
  | "chat_message_sent"
  | "funnel_stage"
  | "demo_mode_engaged"
  | "newsletter_subscribe"
  | "time_on_page";

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

let _doNotTrack: boolean | null = null;
function shouldTrack(): boolean {
  if (typeof window === "undefined") return false;
  if (_doNotTrack === null) {
    _doNotTrack =
      navigator.doNotTrack === "1" ||
      (window as Window & { doNotTrack?: string }).doNotTrack === "1" ||
      (window as Window & { msDoNotTrack?: string }).msDoNotTrack === "1";
  }
  return !_doNotTrack;
}

const EVENT_QUEUE: Array<{ event: EventName; properties?: EventProperties }> = [];
let _flushing = false;

async function flushQueue() {
  if (_flushing || EVENT_QUEUE.length === 0) return;
  _flushing = true;
  const batch = EVENT_QUEUE.splice(0, 10);
  try {
    await fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: batch.map(e => ({ event: e.event, properties: e.properties, timestamp: new Date().toISOString() })) }),
      keepalive: true,
    });
  } catch {
    // silent — analytics must never break the user experience
  } finally {
    _flushing = false;
    if (EVENT_QUEUE.length > 0) {
      setTimeout(flushQueue, 300);
    }
  }
}

function track(event: EventName, properties?: EventProperties): void {
  if (!shouldTrack()) return;

  if (typeof (window as Window & { gtag?: (...args: unknown[]) => void }).gtag === "function") {
    (window as Window & { gtag?: (...args: unknown[]) => void }).gtag!("event", event, properties);
  }

  EVENT_QUEUE.push({ event, properties });
  setTimeout(flushQueue, 100);

  if (import.meta.env.DEV) {
    console.debug(`[analytics] ${event}`, properties);
  }
}

let scrollDepthThresholds = [25, 50, 75, 90];
let trackedDepths: number[] = [];

export function initTimeOnPageTracking(pageSlug: string, site = "szl-holdings"): () => void {
  const start = Date.now();
  let flushed = false;

  function flush() {
    if (flushed) return;
    flushed = true;
    const seconds = Math.round((Date.now() - start) / 1000);
    if (seconds < 3) return;
    track("time_on_page", { page: pageSlug, site, duration_seconds: seconds });
  }

  function visibilityHandler() {
    if (document.hidden) flush();
  }

  document.addEventListener("visibilitychange", visibilityHandler);
  window.addEventListener("pagehide", flush);

  return () => {
    flush();
    document.removeEventListener("visibilitychange", visibilityHandler);
    window.removeEventListener("pagehide", flush);
  };
}

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
        track("scroll_depth", { page: pageSlug, depth: threshold });
      }
    }
  };

  window.addEventListener("scroll", handler, { passive: true });
  return () => window.removeEventListener("scroll", handler);
}

export const analytics = {
  pageView: (page: string, site = "szl-holdings") =>
    track("page_view", { site, page }),

  ctaClick: (label: string, page: string, section?: string, site = "szl-holdings") =>
    track("cta_click", { cta_label: label, page, section, site }),

  formSubmit: (formKey: string, page: string, site = "szl-holdings") =>
    track("form_submit", { form_key: formKey, page, site }),

  demoRequest: (site = "vessels") =>
    track("demo_request", { site }),

  accessRequest: (site = "inca") =>
    track("access_request", { site }),

  privateInquirySubmit: (site = "carlota-jo") =>
    track("private_inquiry_submit", { site }),

  downloadAsset: (contentSlug: string, site = "szl-holdings") =>
    track("download_asset", { content_slug: contentSlug, site }),

  signIn: (site = "szl-holdings") =>
    track("sign_in", { site }),

  dashboardView: (page: string, site = "szl-holdings") =>
    track("dashboard_view", { page, site }),

  alertView: (contentSlug: string, site = "szl-holdings") =>
    track("alert_view", { content_slug: contentSlug, site }),

  reportView: (contentSlug: string, site = "szl-holdings") =>
    track("report_view", { content_slug: contentSlug, site }),

  articleView: (contentSlug: string, site = "szl-holdings") =>
    track("article_view", { content_slug: contentSlug, site }),

  caseStudyView: (contentSlug: string, site = "szl-holdings") =>
    track("case_study_view", { content_slug: contentSlug, site }),

  heroCTAClick: (ctaLabel: string) =>
    track("hero_cta_click", { cta_label: ctaLabel, site: "szl-holdings" }),

  ventureCardClick: (ventureId: string, ventureName: string) =>
    track("venture_card_click", { venture_id: ventureId, venture_name: ventureName }),

  founderPageView: () =>
    track("founder_page_view", { site: "szl-holdings" }),

  contactFunnelStart: (inquiryType: string) =>
    track("contact_funnel_start", { inquiry_type: inquiryType }),

  contactFormSubmit: (inquiryType: string) =>
    track("contact_form_submit", { form_key: inquiryType, site: "szl-holdings" }),

  resumeDownloadClick: () =>
    track("download_asset", { content_slug: "resume", site: "stephen-site" }),

  ventureDetailView: (ventureId: string) =>
    track("venture_detail_view", { venture_id: ventureId }),

  ecosystemNodeClick: (nodeId: string) =>
    track("ecosystem_node_click", { node_id: nodeId }),

  portfolioFilter: (filterType: string, filterValue: string) =>
    track("portfolio_filter", { filter_type: filterType, filter_value: filterValue }),

  insightsArticleClick: (slug: string, title: string) =>
    track("article_view", { content_slug: slug, title }),

  navLinkClick: (label: string, href: string) =>
    track("nav_link_click", { label, href }),

  pricingTierView: (tierId: string) =>
    track("pricing_tier_view", { plan_key: tierId, site: "szl-holdings" }),

  pricingCtaClick: (tierId: string, ctaLabel: string) =>
    track("pricing_cta_click", { plan_key: tierId, cta_label: ctaLabel, site: "szl-holdings" }),

  emailCapture: (source: string) =>
    track("email_capture", { section: source, site: "szl-holdings" }),

  exitIntentShown: () =>
    track("exit_intent_shown", { site: "szl-holdings" }),

  chatOpened: () =>
    track("chat_opened", { site: "szl-holdings" }),

  chatMessageSent: () =>
    track("chat_message_sent", { site: "szl-holdings" }),

  funnelStage: (stage: string, page: string) =>
    track("funnel_stage", { section: stage, page, site: "szl-holdings" }),

  demoModeEngaged: (feature?: string) =>
    track("demo_mode_engaged", { section: feature, site: "szl-holdings" }),

  newsletterSubscribe: (source: string) =>
    track("newsletter_subscribe", { section: source, site: "szl-holdings" }),
};
