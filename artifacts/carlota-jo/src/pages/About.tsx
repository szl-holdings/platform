import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "wouter";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#07090d]">
      <Header />
      <div className="max-w-3xl mx-auto px-6 lg:px-12 pt-28 pb-24">
        <div className="mb-14">
          <p className="text-[11px] font-medium tracking-[0.3em] uppercase text-[#c8a96a]/70 mb-4">About</p>
          <h1
            className="text-4xl md:text-5xl font-light text-[#f5f0e8] leading-tight mb-6"
            style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
          >
            A different kind of advisory practice
          </h1>
        </div>

        <div className="space-y-6 text-[14.5px] font-light text-[#f5f0e8]/48 leading-loose mb-14">
          <p>
            Carlota Jo Consulting is a boutique advisory firm for founders and leadership teams navigating inflection points. We are not a large firm. We are not a generalist consultancy. We are a small practice with deep expertise and a deliberate approach to engagement.
          </p>
          <p>
            Our work begins where most advisory stops — at the moment when the real questions surface. Not "what's the strategy" but "are we solving the right problem." Not "how do we grow" but "what kind of organisation do we want to be on the other side of growth."
          </p>
          <p>
            We maintain a small client base by design. Every client gets genuine senior attention — not delegation to an associate who briefs us before calls. This limits how many clients we can serve, and that's the point.
          </p>
          <p>
            Carlota Jo Consulting is part of the SZL Holdings ecosystem — a strategic technology portfolio. Our advisory practice operates independently, with full confidentiality and discretion as its foundation.
          </p>
        </div>

        <div className="border-t border-[#f5f0e8]/6 pt-10 mb-12">
          <h2
            className="text-[20px] font-light text-[#f5f0e8] mb-4"
            style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
          >
            What we're not
          </h2>
          <ul className="space-y-3">
            {[
              "We are not a strategy firm that delivers decks",
              "We are not a branding agency",
              "We are not available for short-term projects without strategic context",
              "We do not share client names without explicit permission",
              "We do not take on more clients than we can serve with depth",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="w-1 h-1 rounded-full bg-[#c8a96a]/35 mt-2.5 shrink-0" />
                <span className="text-[#f5f0e8]/38 text-[13.5px] font-light">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#0c0e14] border border-[#f5f0e8]/6 p-8">
          <h3
            className="text-[18px] font-light text-[#f5f0e8] mb-3"
            style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
          >
            Begin an inquiry
          </h3>
          <p className="text-[#f5f0e8]/38 text-[13px] font-light mb-5 leading-relaxed">
            We respond to substantive enquiries from founders, leadership teams, and investors within two business days.
          </p>
          <Link href="/inquiries" className="inline-block px-6 py-2.5 text-[12px] font-medium tracking-[0.08em] text-[#07090d] bg-[#c8a96a] hover:bg-[#d4b87a] transition-colors">
            Inquire privately
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
