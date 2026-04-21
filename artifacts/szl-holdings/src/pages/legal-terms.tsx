import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";

const SECTIONS = [
  {
    id: "introduction",
    heading: "1. Introduction and Acceptance",
    lines: [
      `These Terms of Service ("Terms") govern your access to and use of the websites, platforms, APIs, and services operated by SZL Holdings Ltd ("SZL Holdings", "we", "us", or "our"), including Lyte, Alloy, Aegis, Terra, Vessels, Counsel, and associated services (collectively, the "Services").`,
      `By accessing or using the Services, you agree to be bound by these Terms. If you are entering into these Terms on behalf of an organisation, you represent that you have authority to bind that organisation. If you do not agree to these Terms, do not access or use the Services.`,
      `SZL Holdings reserves the right to update these Terms at any time. Continued use of the Services after such changes constitutes acceptance of the updated Terms. Material changes will be communicated by email or notice within the platform.`,
    ],
  },
  {
    id: "definitions",
    heading: "2. Definitions",
    lines: [
      `"Account" means an account created to access the Services. "Customer" means the organisation or individual that has entered into a subscription or pilot agreement with SZL Holdings. "User" means an individual authorised by a Customer to use the Services. "Content" means data, text, files, and other materials submitted to the Services. "Confidential Information" means non-public information disclosed by one party to the other in connection with the Services.`,
      `"Platform" means the software and infrastructure operated by SZL Holdings to deliver the Services. "Subscription" means the right to access the Services under a paid plan or pilot engagement. "Agreement" refers to these Terms together with any applicable order form or pilot agreement.`,
    ],
  },
  {
    id: "accounts",
    heading: "3. Accounts and Registration",
    lines: [
      `To access the Services, you must create an Account or be provisioned an Account by your organisation's administrator. You are responsible for maintaining the confidentiality of your credentials and for all activity under your Account.`,
      `Authentication is handled via OpenID Connect (OIDC/PKCE). We do not store passwords. You must promptly notify us of any unauthorised use of your Account at security@szlholdings.com.`,
      `You must provide accurate and complete information during registration. Accounts are for individual use unless otherwise agreed in an order form. You may not share login credentials with third parties.`,
    ],
  },
  {
    id: "permitted-use",
    heading: "4. Permitted Use",
    lines: [
      `Subject to these Terms, SZL Holdings grants you a limited, non-exclusive, non-transferable, revocable licence to access and use the Services for your organisation's internal business purposes during the subscription term.`,
      `You may: access and use the Services in accordance with these Terms; invite authorised Users within your seat allocation; integrate the Services with your existing systems via supported APIs and connectors; export your data as permitted by the platform.`,
    ],
  },
  {
    id: "prohibited-use",
    heading: "5. Prohibited Use",
    lines: [
      `You may not: use the Services for any unlawful purpose or in violation of any applicable laws or regulations; attempt to gain unauthorised access to any part of the Services or related systems; interfere with or disrupt the integrity or performance of the Services; reverse-engineer, decompile, or disassemble any part of the Services; use the Services to transmit malicious code, spam, or unsolicited communications; resell, sublicense, or otherwise transfer your right to use the Services without written consent; scrape or extract data from the Services using automated means except as permitted via official APIs; use the Services to develop competing products or services.`,
      `Violations of this section may result in immediate suspension or termination of your Account.`,
    ],
  },
  {
    id: "customer-data",
    heading: "6. Customer Data",
    lines: [
      `As between you and SZL Holdings, you retain all ownership rights to Customer data submitted to the Services ("Customer Data"). You grant SZL Holdings a limited licence to process Customer Data solely to provide and operate the Services.`,
      `SZL Holdings will implement appropriate technical and organisational measures to protect Customer Data. SZL Holdings will not access Customer Data except as necessary to provide the Services, comply with legal obligations, or at your request.`,
      `You are responsible for ensuring that your use of the Services and submission of Customer Data complies with all applicable laws, including data protection laws. For enterprise customers, a Data Processing Agreement (DPA) is available and will govern data processing activities.`,
    ],
  },
  {
    id: "intellectual-property",
    heading: "7. Intellectual Property",
    lines: [
      `SZL Holdings retains all intellectual property rights in and to the Services, including the Platform, documentation, and any improvements or modifications thereto. These Terms do not grant you any rights in SZL Holdings' intellectual property except the limited licence described in Section 4.`,
      `All content on SZL Holdings websites — including text, design, software, and branding — is the property of SZL Holdings or its licensors. You may not reproduce, distribute, modify, or create derivative works without prior written permission.`,
      `If you provide feedback, suggestions, or ideas regarding the Services, you grant SZL Holdings a non-exclusive, royalty-free, perpetual licence to use such feedback for any purpose.`,
    ],
  },
  {
    id: "confidentiality",
    heading: "8. Confidentiality",
    lines: [
      `Each party agrees to maintain the confidentiality of the other party's Confidential Information and not to disclose it to any third party without prior written consent, except as required by law.`,
      `Confidential Information does not include information that: (a) is or becomes publicly known through no fault of the receiving party; (b) was already known to the receiving party at the time of disclosure; (c) is independently developed without reference to the Confidential Information; or (d) is required to be disclosed by law or court order.`,
    ],
  },
  {
    id: "payment",
    heading: "9. Payment and Billing",
    lines: [
      `Access to the Services requires a valid subscription or pilot agreement. Fees are specified in your order form or pilot agreement. All fees are exclusive of applicable taxes, which are your responsibility.`,
      `Payments are processed by Stripe. By providing payment information, you authorise us to charge your payment method for the fees due. Failure to pay may result in suspension of access to the Services.`,
      `For pilot engagements, specific payment terms are defined in the applicable pilot agreement. SZL Holdings reserves the right to modify pricing with reasonable notice prior to subscription renewal.`,
    ],
  },
  {
    id: "disclaimers",
    heading: "10. Disclaimer of Warranties",
    lines: [
      `THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, SZL HOLDINGS DISCLAIMS ALL WARRANTIES, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.`,
      `SZL Holdings does not warrant that the Services will be uninterrupted, error-free, or completely secure. While we target high availability, we do not guarantee any specific uptime except as set forth in a separately agreed Service Level Agreement (SLA).`,
      `AI-generated outputs and recommendations produced by the Services are provided for informational purposes only. You are responsible for validating and acting upon any AI-generated content. SZL Holdings is not liable for decisions made based on AI outputs.`,
    ],
  },
  {
    id: "limitation-liability",
    heading: "11. Limitation of Liability",
    lines: [
      `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL SZL HOLDINGS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH THESE TERMS OR YOUR USE OF THE SERVICES.`,
      `SZL Holdings' total aggregate liability to you for any claim arising out of or relating to these Terms or the Services shall not exceed the total fees paid by you in the twelve (12) months preceding the claim.`,
      `Some jurisdictions do not allow the exclusion or limitation of certain damages. In those jurisdictions, the limitations above apply to the fullest extent permitted by law.`,
    ],
  },
  {
    id: "indemnification",
    heading: "12. Indemnification",
    lines: [
      `You agree to indemnify, defend, and hold harmless SZL Holdings and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of or in connection with: (a) your use of the Services in violation of these Terms; (b) your Customer Data; or (c) your violation of any applicable law or third-party rights.`,
    ],
  },
  {
    id: "termination",
    heading: "13. Termination",
    lines: [
      `Either party may terminate the subscription by providing written notice prior to the end of the subscription period as specified in the applicable order form.`,
      `SZL Holdings may suspend or terminate your access to the Services immediately if: (a) you breach these Terms and fail to cure such breach within 10 days of notice; (b) you become insolvent or subject to bankruptcy proceedings; or (c) continued provision of the Services would violate applicable law.`,
      `Upon termination, your right to access the Services ceases. You may request an export of your Customer Data for a period of 30 days following termination. After this period, we may delete your Customer Data in accordance with our data retention policy.`,
    ],
  },
  {
    id: "governing-law",
    heading: "14. Governing Law and Dispute Resolution",
    lines: [
      `These Terms are governed by and construed in accordance with the laws of England and Wales, without regard to conflict of law principles.`,
      `Any dispute, controversy, or claim arising out of or relating to these Terms or the Services shall first be submitted to good-faith negotiation. If not resolved within 30 days, the dispute shall be subject to the exclusive jurisdiction of the courts of England and Wales. Both parties irrevocably submit to the personal jurisdiction of such courts.`,
      `Notwithstanding the foregoing, SZL Holdings may seek injunctive or other equitable relief in any court of competent jurisdiction.`,
    ],
  },
  {
    id: "general",
    heading: "15. General Provisions",
    lines: [
      `Entire Agreement: These Terms, together with any applicable order form, pilot agreement, or DPA, constitute the entire agreement between the parties with respect to the subject matter hereof.`,
      `Severability: If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force.`,
      `Waiver: Failure to enforce any provision of these Terms shall not constitute a waiver of that provision.`,
      `Assignment: You may not assign these Terms without SZL Holdings' prior written consent. SZL Holdings may assign these Terms in connection with a merger, acquisition, or sale of assets.`,
      `Force Majeure: SZL Holdings shall not be liable for failure to perform obligations to the extent caused by circumstances beyond our reasonable control.`,
    ],
  },
  {
    id: "contact",
    heading: "16. Contact",
    lines: [
      `For legal enquiries and notices under these Terms: legal@szlholdings.com.`,
      `For general enquiries: inquiries@szlholdings.com. For privacy matters: privacy@szlholdings.com. For security disclosures: security@szlholdings.com.`,
    ],
  },
];

export default function LegalTermsPage() {
  const __pageMeta = usePageMeta({
    title: "Terms of Service — SZL Holdings",
    description: "SZL Holdings Terms of Service. The terms that govern your use of our platforms and services.",
    canonical: "https://szlholdings.com/legal/terms",
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
              <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,55%)" }}>Legal · Terms</span>
            </div>
            <h1 style={{ fontSize: "2rem", fontWeight: "700", letterSpacing: "-0.022em", color: "hsl(38,12%,94%)", marginBottom: "0.75rem" }}>Terms of Service</h1>
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
              { href: "/legal/privacy", label: "Privacy Policy" },
              { href: "/legal/cookies", label: "Cookie Policy" },
              { href: "/legal/acceptable-use", label: "Acceptable Use Policy" },
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
