export const ANALYTICS_EVENTS = [
  "page_view",
  "cta_click",
  "form_submit",
  "demo_request",
  "access_request",
  "private_inquiry_submit",
  "sign_in",
  "sign_up",
  "dashboard_view",
  "article_view",
  "checkout_started",
  "checkout_completed",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

export interface PageViewProperties extends EventProperties {
  url?: string;
  referrer?: string;
  path?: string;
  title?: string;
}

export interface CTAClickProperties extends EventProperties {
  label: string;
  location?: string;
  variant?: string;
  href?: string;
}

export interface FormSubmitProperties extends EventProperties {
  form_name: string;
  form_type?: string;
}

export interface DemoRequestProperties extends EventProperties {
  product?: string;
  source?: string;
}

export interface AccessRequestProperties extends EventProperties {
  resource?: string;
  required_role?: string;
}

export interface PrivateInquiryProperties extends EventProperties {
  inquiry_type?: string;
}

export interface AuthProperties extends EventProperties {
  method?: string;
  app?: string;
}

export interface DashboardViewProperties extends EventProperties {
  dashboard_name?: string;
  app?: string;
}

export interface ArticleViewProperties extends EventProperties {
  slug?: string;
  title?: string;
  category?: string;
  author?: string;
}

export interface CheckoutProperties extends EventProperties {
  product?: string;
  plan?: string;
  amount?: number;
  currency?: string;
}
