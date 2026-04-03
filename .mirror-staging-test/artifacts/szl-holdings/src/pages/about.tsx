import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "wouter";
import { ChevronRight } from "lucide-react";

const principles = [
  {
    heading: "Build for depth, not breadth",
    body: "Every venture in the SZL portfolio solves a specific, complex problem with domain precision. We don't pursue trends — we pursue structural opportunities.",
  },
  {
    heading: "Operate at the frontier",
    body: "Maritime intelligence, enterprise AI, regulatory compliance, real estate analytics. Each platform is built where incumbent tools fall short.",
  },
  {
    heading: "Founder-led, indefinitely",
    body: "SZL Holdings is built to operate with a small, high-trust team over a long time horizon. No external pressure to ship, pivot, or exit on a schedule we didn't set.",
  },
  {
    heading: "Premium by default",
    body: "Every product is designed for users who expect high craft — in interface, in data quality, and in the precision of the intelligence it provides.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <div className="mb-14">
          <p className="text-[11px] font-semibold text-[hsl(215,45%,45%)] tracking-[0.15em] uppercase mb-3">About</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight mb-6">
            SZL Holdings
          </h1>
          <p className="text-neutral-600 text-[16px] leading-relaxed mb-4">
            SZL Holdings is a strategic technology portfolio company. We build, incubate, and operate
            a focused set of enterprise-grade software platforms at the intersection of maritime intelligence,
            applied AI, executive advisory, and enterprise operations.
          </p>
          <p className="text-neutral-500 text-[15px] leading-relaxed">
            Founded and operated by Stephen Lutar from Washington D.C., London, and Singapore — each
            company in the portfolio is built to be the definitive tool in its domain.
          </p>
        </div>

        <div className="mb-14">
          <h2 className="text-[17px] font-bold text-neutral-900 mb-6">Our principles</h2>
          <div className="space-y-6">
            {principles.map((p, i) => (
              <div key={i} className="border-l-2 border-neutral-100 pl-5">
                <h3 className="text-[14px] font-semibold text-neutral-800 mb-1.5">{p.heading}</h3>
                <p className="text-neutral-500 text-[13.5px] leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-14">
          <h2 className="text-[17px] font-bold text-neutral-900 mb-4">Footprint</h2>
          <p className="text-neutral-500 text-[13.5px] leading-relaxed mb-2">
            Washington, D.C. · London · Singapore
          </p>
          <p className="text-neutral-500 text-[13.5px] leading-relaxed">
            Operates across North America, Europe, and Asia-Pacific markets with portfolio companies serving
            clients in maritime, enterprise software, consulting, and AI research sectors.
          </p>
        </div>

        <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-7">
          <h3 className="text-[15px] font-bold text-neutral-900 mb-2">Start a conversation</h3>
          <p className="text-neutral-500 text-[13px] leading-relaxed mb-4">
            Investment, partnership, client, or media enquiries — we respond to substantive outreach.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[hsl(215,45%,35%)] hover:text-[hsl(215,45%,25%)] transition-colors"
          >
            Contact SZL Holdings <ChevronRight size={13} />
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
