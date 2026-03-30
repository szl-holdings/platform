import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { useSearch } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { InquiryForm, type InquiryType } from "@/components/InquiryForm";
import { initScrollDepthTracking } from "@/lib/analytics";

const AUDIENCE_CARDS = [
  {
    type: "investor" as InquiryType,
    headline: "For Investors",
    body: "Investment thesis, portfolio briefings, and strategic discussions about the SZL ecosystem.",
  },
  {
    type: "client" as InquiryType,
    headline: "For Clients",
    body: "Product demonstrations, pilot programs, and enterprise deployment conversations.",
  },
  {
    type: "partner" as InquiryType,
    headline: "For Partners",
    body: "Integration opportunities, co-development proposals, and strategic alliance inquiries.",
  },
  {
    type: "recruiter" as InquiryType,
    headline: "For Recruiters",
    body: "Executive search, advisory engagements, and specialist talent conversations.",
  },
];

export default function ContactPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const typeParam = params.get("type") as InquiryType | null;

  const defaultType: InquiryType =
    typeParam && ["investor", "client", "partner", "recruiter", "general"].includes(typeParam)
      ? typeParam
      : "general";

  useEffect(() => {
    document.title = "Contact — SZL Holdings";
    const cleanup = initScrollDepthTracking("contact");
    return cleanup;
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <SiteNav />

      <main className="pt-24">
        <section className="bg-white border-b border-szl-border py-16">
          <div className="max-w-6xl mx-auto px-6">
            <m.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-szl-text-muted mb-3">Contact</p>
              <h1 className="font-[var(--font-display)] text-4xl sm:text-5xl font-extrabold text-szl-text leading-tight mb-4">
                The right conversation
                <br />
                <span className="text-szl-accent">starts here.</span>
              </h1>
              <p className="text-szl-text-secondary text-base max-w-xl leading-relaxed">
                Different audiences, different contexts, different conversations. Tell us who you are and what you're looking for — we'll route it to the right person.
              </p>
            </m.div>
          </div>
        </section>

        <section className="py-12 lg:py-16">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              <div>
                <div className="grid sm:grid-cols-2 gap-3 mb-10">
                  {AUDIENCE_CARDS.map((card) => (
                    <m.div
                      key={card.type}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-szl-border bg-szl-bg-secondary p-5"
                    >
                      <h3 className="font-[var(--font-display)] text-sm font-bold text-szl-text mb-1">{card.headline}</h3>
                      <p className="text-xs text-szl-text-secondary leading-relaxed">{card.body}</p>
                    </m.div>
                  ))}
                </div>

                <div className="rounded-2xl border border-szl-border bg-white p-6">
                  <p className="text-xs font-bold uppercase tracking-widest text-szl-text-muted mb-4">Direct</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-szl-border">
                      <span className="text-sm text-szl-text-secondary">General inquiries</span>
                      <span className="text-sm font-medium text-szl-text">inquiries@szlholdings.com</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-szl-border">
                      <span className="text-sm text-szl-text-secondary">Headquarters</span>
                      <span className="text-sm font-medium text-szl-text">Washington, D.C.</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-szl-text-secondary">Response time</span>
                      <span className="text-sm font-medium text-szl-text">Within 24 hours</span>
                    </div>
                  </div>
                </div>
              </div>

              <m.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="rounded-2xl border border-szl-border bg-white p-6 sm:p-8"
              >
                <InquiryForm defaultType={defaultType} showTypeSelector />
              </m.div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
