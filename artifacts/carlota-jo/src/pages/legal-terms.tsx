import Footer from '@/components/Footer';
import Header from '@/components/Header';

export default function LegalTermsPage() {
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
            Terms of Engagement
          </h1>
          <p className="text-[#f5f0e8]/25 text-[13px] font-light">Last updated: March 2026</p>
        </div>
        <div className="space-y-6 text-[14px] text-[#f5f0e8]/40 font-light leading-relaxed">
          <p>
            Use of the Carlota Jo Consulting website and client portal is subject to these terms.
            Advisory engagements are governed by separately executed engagement letters.
          </p>
          <h2
            className="text-[16px] font-light text-[#f5f0e8]/80"
            style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
          >
            Website use
          </h2>
          <p>
            This website is provided for informational purposes. The content does not constitute
            advisory or professional services. Inquiries submitted through the website are not
            confidential until a formal engagement is initiated.
          </p>
          <h2
            className="text-[16px] font-light text-[#f5f0e8]/80"
            style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
          >
            Client portal
          </h2>
          <p>
            Access to the client portal is restricted to active clients. Portal content is
            confidential and may not be shared without prior written consent.
          </p>
          <h2
            className="text-[16px] font-light text-[#f5f0e8]/80"
            style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
          >
            Intellectual property
          </h2>
          <p>
            All materials produced during advisory engagements are governed by the terms of the
            applicable engagement letter. Website content is the property of Carlota Jo Consulting.
          </p>
          <h2
            className="text-[16px] font-light text-[#f5f0e8]/80"
            style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
          >
            Contact
          </h2>
          <p>legal@carlotajo.com</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
