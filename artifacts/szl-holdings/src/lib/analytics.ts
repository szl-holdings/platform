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
  | "trust_center_viewed"
  | "design_partner_interest"
  | "diligence_requested"
  | "domain_pack_viewed"
  | "audience_path_click"
  | "newsletter_signup";

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
  if (typeof window === "undefined") return;
  if (typeof (window as any).gtag === "function") {
    (window as any).gtag("event", event, properties);
  }
  if (import.meta.env.DEV) {
    console.debug(`[analytics] ${event}`, properties);
  }
}

let scrollDepthThresholds = [25, 50, 75, 90];
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

  demoRequest: (source = "unknown", site = "szl-holdings") =>
    track("demo_request", { site, source }),

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

  heroCTAClick: (ctaLabel: string, section = "hero") =>
    track("hero_cta_click", { cta_label: ctaLabel, section, site: "szl-holdings" }),

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

  trustCenterView: (source: string, page = "/") =>
    track("trust_center_viewed", { source, page, site: "szl-holdings" }),

  designPartnerInterest: (source: string, page = "/") =>
    track("design_partner_interest", { source, page, site: "szl-holdings" }),

  diligenceRequested: (source: string, page = "/") =>
    track("diligence_requested", { source, page, site: "szl-holdings" }),

  domainPackViewed: (packSlug: string, page = "/") =>
    track("domain_pack_viewed", { product_key: packSlug, page, site: "szl-holdings" }),

  audiencePathClick: (pathLabel: string, destination: string) =>
    track("audience_path_click", { cta_label: pathLabel, page: destination, site: "szl-holdings" }),

  newsletterSignup: (source: string, site = "szl-holdings") =>
    track("newsletter_signup", { source, site }),
};
