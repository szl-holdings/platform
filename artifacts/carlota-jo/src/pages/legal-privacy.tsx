import Footer from '@/components/Footer';
import Header from '@/components/Header';

export default function LegalPrivacyPage() {
  return (
    <div className="min-h-screen bg-[#07090d]">
      <Header />
      <div className="max-w-3xl mx-auto px-6 lg:px-12 pt-28 pb-24">
        <div className="mb-10">
          <p className="text-[11px] font-medium tracking-[0.3em] uppercase text-[#c8a96a]/70 mb-4">
            Legal
          </p>
          <h1
            className="text-3xl font-light text-[#f5f0e8] mb-3"
            style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
          >
            Privacy Policy
          </h1>
          <p className="text-[#f5f0e8]/25 text-[13px] font-light">Last updated: March 2026</p>
        </div>
        <div className="space-y-6 text-[14px] text-[#f5f0e8]/40 font-light leading-relaxed">
          <p>
            Carlota Jo Consulting collects only the personal data required to conduct our advisory
            engagements and respond to private inquiries.
          </p>
          <h2
            className="text-[16px] font-light text-[#f5f0e8]/80"
            style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
          >
            Data we collect
          </h2>
          <p>
            Contact information provided in inquiry submissions, engagement documentation shared
            during active mandates, and client portal account credentials.
          </p>
          <h2
            className="text-[16px] font-light text-[#f5f0e8]/80"
            style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
          >
            How we use it
          </h2>
          <p>
            To conduct advisory engagements, respond to inquiries, and maintain the client portal.
            We do not use your data for marketing or share it with third parties.
          </p>
          <h2
            className="text-[16px] font-light text-[#f5f0e8]/80"
            style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
          >
            Confidentiality
          </h2>
          <p>
            All client information is treated with strict confidentiality. Client names and
            engagement specifics are never disclosed without explicit consent.
          </p>
          <h2
            className="text-[16px] font-light text-[#f5f0e8]/80"
            style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
          >
            Contact
          </h2>
          <p>privacy@carlotajo.com</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
