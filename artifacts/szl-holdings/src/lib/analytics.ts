type EventName =
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
  | "nav_link_click";

interface EventProperties {
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
  heroCTAClick: (ctaLabel: string) => track("hero_cta_click", { cta_label: ctaLabel }),
  ventureCardClick: (ventureId: string, ventureName: string) =>
    track("venture_card_click", { venture_id: ventureId, venture_name: ventureName }),
  founderPageView: () => track("founder_page_view"),
  contactFunnelStart: (inquiryType: string) =>
    track("contact_funnel_start", { inquiry_type: inquiryType }),
  contactFormSubmit: (inquiryType: string) =>
    track("contact_form_submit", { inquiry_type: inquiryType }),
  resumeDownloadClick: () => track("resume_download_click"),
  ventureDetailView: (ventureId: string) =>
    track("venture_detail_view", { venture_id: ventureId }),
  ecosystemNodeClick: (nodeId: string) =>
    track("ecosystem_node_click", { node_id: nodeId }),
  portfolioFilter: (filterType: string, filterValue: string) =>
    track("portfolio_filter", { filter_type: filterType, filter_value: filterValue }),
  insightsArticleClick: (slug: string, title: string) =>
    track("insights_article_click", { slug, title }),
  navLinkClick: (label: string, href: string) =>
    track("nav_link_click", { label, href }),
};
