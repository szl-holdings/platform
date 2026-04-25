import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";

const SECTIONS = [
  {
    id: "introduction",
    heading: "1. Introduction",
    lines: [
      `SZL Holdings Ltd ("SZL Holdings", "we", "us", or "our") is committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our websites, use our platforms (including Lyte, Counsel, Aegis, Terra, Vessels, and Counsel), or communicate with us.`,
      `Please read this policy carefully. If you disagree with its terms, please discontinue use of our services. By accessing or using our services, you agree to this Privacy Policy.`,
    ],
  },
  {
    id: "controller",
    heading: "2. Data Controller",
    lines: [
      `SZL Holdings Ltd is the data controller for personal information collected through our websites and platforms. For questions about this policy or to exercise your rights, contact us at:`,
      `Email: privacy@szlholdings.com`,
    ],
  },
  {
    id: "information-collected",
    heading: "3. Information We Collect",
    lines: [
      `We collect information in the following categories:`,
      `Information you provide directly: contact information (name, email address, company name, role) submitted through forms; account registration details; communications you send us (support requests, feedback, demo requests); payment information processed securely via Stripe — we do not store card details.`,
      `Information collected automatically: usage analytics (pages visited, features used, session duration) collected in aggregate; technical identifiers (IP address, browser type, device type) for security and fraud prevention; session tokens and authentication state.`,
      `Information from third parties: identity information from your SSO/OIDC provider (Azure AD, Google Workspace, or other) when you authenticate; organisation details from SCIM provisioning if your employer configures automated provisioning.`,
    ],
  },
  {
    id: "legal-basis",
    heading: "4. Legal Basis for Processing (UK GDPR / EU GDPR)",
    lines: [
      `For users in the United Kingdom and European Economic Area (EEA), we process your personal data on the following legal bases:`,
      `Contractual necessity — to provide the services you have signed up for.`,
      `Legitimate interests — to improve our services, prevent fraud, and maintain security, balanced against your rights.`,
      `Consent — for marketing communications; you may withdraw consent at any time.`,
      `Legal obligation — where we are required to retain records by applicable law.`,
    ],
  },
  {
    id: "how-we-use",
    heading: "5. How We Use Your Information",
    lines: [
      `We use the information we collect to:`,
      `Provide, operate, and maintain our platforms and services; process and respond to contact, demo, and support requests; create and manage your account; send service-related communications (e.g. security notices, billing updates); improve and develop our services through aggregate analytics; ensure platform security, detect and prevent fraud, and enforce our terms; comply with legal obligations (e.g. tax records, regulatory requirements); send marketing communications where you have provided consent.`,
      `We do not use personal data to train AI models without explicit consent. We do not sell personal data to third parties.`,
    ],
  },
  {
    id: "sharing",
    heading: "6. Sharing and Disclosure",
    lines: [
      `We share your information only in the following circumstances:`,
      `Service providers: trusted third-party vendors who assist us in delivering our services (hosting, payment processing, email delivery, analytics). All service providers are contractually bound to protect your data and may not use it for their own purposes.`,
      `Organisational administrators: if you access our services through an employer or organisation, their administrators may have access to your account information and usage data within the platform.`,
      `Legal requirements: we may disclose your information if required by law, court order, or other governmental authority, or to protect the rights, property, or safety of SZL Holdings, our users, or the public.`,
      `Business transfers: in connection with a merger, acquisition, or sale of assets, your information may be transferred. We will notify you of any such transfer and any change to the applicable privacy policy.`,
      `With your consent: we may share your information for any other purpose with your explicit consent.`,
      `We do not sell, trade, or rent your personal data to third parties.`,
    ],
  },
  {
    id: "data-retention",
    heading: "7. Data Retention",
    lines: [
      `We retain your personal data for as long as necessary to fulfil the purposes for which it was collected, including for the purposes of satisfying any legal, accounting, or reporting requirements.`,
      `Typical retention periods: contact and demo requests — 24 months from submission; account data — duration of your account, plus 12 months after closure; audit and security logs — 12 months (may be extended for legal compliance); billing and invoice records — 7 years (UK statutory requirement); support tickets — 5 years from closure.`,
      `You may request deletion of your personal data at any time (subject to legal retention obligations) by contacting privacy@szlholdings.com. Enterprise customers with active Data Processing Agreements may configure custom retention periods through the platform's data retention administration panel.`,
    ],
  },
  {
    id: "international",
    heading: "8. International Data Transfers",
    lines: [
      `SZL Holdings operates primarily in England and Wales. Your data may be processed in countries outside the UK or EEA (including the United States) by our service providers. Where we transfer data outside the UK/EEA, we ensure appropriate safeguards are in place, including: Standard Contractual Clauses (SCCs) approved by the European Commission; UK International Data Transfer Agreements (IDTAs) where applicable; and transfers only to countries with an adequacy decision.`,
      `Details of the specific safeguards applicable to your data are available on request at privacy@szlholdings.com.`,
    ],
  },
  {
    id: "your-rights",
    heading: "9. Your Rights",
    lines: [
      `Under applicable data protection law, you have the following rights regarding your personal data:`,
      `Right of access — request a copy of the personal data we hold about you. Right to rectification — request correction of inaccurate or incomplete data. Right to erasure ("right to be forgotten") — request deletion of your personal data where there is no compelling reason for continued processing. Right to restrict processing — request that we limit how we use your data. Right to data portability — request a machine-readable copy of data you have provided to us. Right to object — object to our processing of your personal data where we rely on legitimate interests. Rights related to automated decision-making — request human review of automated decisions that significantly affect you. Right to withdraw consent — where processing is based on consent, withdraw at any time.`,
      `To exercise any of these rights, contact privacy@szlholdings.com. We will respond within one month. You also have the right to lodge a complaint with the UK Information Commissioner's Office (ICO) at ico.org.uk or your local data protection authority.`,
    ],
  },
  {
    id: "security",
    heading: "10. Security",
    lines: [
      `We implement industry-standard technical and organisational security measures to protect your personal data: TLS 1.3 encryption in transit; encryption at rest on all managed database deployments; authentication via OpenID Connect (PKCE) — no passwords stored in our systems; role-based access control with least-privilege enforcement; immutable audit logs for all significant actions; rate limiting, CSRF protection, and security headers (Helmet.js with CSP and HSTS); and a SOC 2 Type I readiness programme targeting Q3 2026.`,
      `While we implement robust security measures, no method of transmission over the internet is completely secure. In the event of a data breach that affects your rights and freedoms, we will notify you and the relevant regulatory authority as required by law.`,
    ],
  },
  {
    id: "cookies",
    heading: "11. Cookies",
    lines: [
      `We use cookies and similar tracking technologies to operate our services. Essential cookies are required for authentication, session management, and security and do not require your consent. Analytics cookies are used in aggregate to understand how our services are used and may require consent depending on your jurisdiction.`,
      `You can manage cookie preferences through the cookie banner shown on first visit, or by adjusting your browser settings. Disabling essential cookies may prevent some features from working. See our full Cookie Policy at /legal/cookies.`,
    ],
  },
  {
    id: "children",
    heading: "12. Children's Privacy",
    lines: [
      `Our services are designed for enterprise and professional use and are not directed at individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have inadvertently collected data from a child, please contact us immediately at privacy@szlholdings.com.`,
    ],
  },
  {
    id: "changes",
    heading: "13. Changes to This Policy",
    lines: [
      `We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy at this URL and, where appropriate, by email. The "Last updated" date at the top of this page reflects the most recent revision. We encourage you to review this policy periodically.`,
    ],
  },
  {
    id: "contact",
    heading: "14. Contact",
    lines: [
      `For all privacy-related queries, requests to exercise your rights, or concerns about our data practices: email privacy@szlholdings.com with subject line "Privacy enquiry — [your name]".`,
      `For security vulnerability disclosures, please use our coordinated disclosure process at /legal/security-disclosure. For general enquiries: inquiries@szlholdings.com.`,
    ],
  },
];

export default function LegalPrivacyPage() {
  const __pageMeta = usePageMeta({
    title: "Privacy Policy — SZL Holdings",
    description: "SZL Holdings Privacy Policy. How we collect, use, and protect your personal information.",
    canonical: "https://szlholdings.com/legal/privacy",
  });

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
        <Navbar />
        <div className="max-w-3xl mx-auto px-6 pt-32 pb-24">
          <div className="mb-10">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <Link href="/trust" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", textDecoration: "none" }}>Trust Center</Link>
              <span style={{ color: "hsl(210,5%,30%)" }}>/</span>
              <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,55%)" }}>Legal · Privacy</span>
            </div>
            <h1 style={{ fontSize: "2rem", fontWeight: "700", letterSpacing: "-0.022em", color: "hsl(38,12%,94%)", marginBottom: "0.75rem" }}>Privacy Policy</h1>
            <p style={{ fontSize: "13px", color: "hsl(210,5%,44%)" }}>Last updated: April 2026 · Effective date: 1 April 2026</p>
          </div>
  
          <nav style={{ marginBottom: "2.5rem", padding: "1.25rem", borderRadius: "8px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.07)" }}>
            <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(210,5%,40%)", marginBottom: "0.75rem" }}>Contents</p>
            <ol style={{ listStyle: "none", padding: 0, margin: 0, columns: 2, gap: "1rem" }}>
              {SECTIONS.map((s) => (
                <li key={s.id} style={{ marginBottom: "0.375rem" }}>
                  <a href={`#${s.id}`} style={{ fontSize: "13px", color: "hsl(210,5%,55%)", textDecoration: "none" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(38,12%,82%)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,55%)"; }}>
                    {s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
  
          <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            {SECTIONS.map((s) => (
              <section key={s.id} id={s.id} style={{ scrollMarginTop: "6rem" }}>
                <h2 style={{ fontSize: "15px", fontWeight: "700", color: "hsl(38,12%,88%)", marginBottom: "0.875rem" }}>{s.heading}</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                  {s.lines.map((line, i) => (
                    <p key={i} style={{ fontSize: "14px", lineHeight: "1.75", color: "hsl(210,5%,56%)", margin: 0 }}>{line}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
  
          <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid hsla(0,0%,100%,0.07)", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            {[
              { href: "/legal/terms", label: "Terms of Service" },
              { href: "/legal/cookies", label: "Cookie Policy" },
              { href: "/legal/acceptable-use", label: "Acceptable Use" },
              { href: "/legal/security-disclosure", label: "Security Disclosure" },
            ].map(({ href, label }) => (
              <a key={href} href={href} style={{ fontSize: "13px", color: "hsl(210,5%,48%)", textDecoration: "none" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(38,12%,78%)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,48%)"; }}>
                {label} →
              </a>
            ))}
          </div>
        </div>
        <Footer />
      </div>
        </>
  );
}
