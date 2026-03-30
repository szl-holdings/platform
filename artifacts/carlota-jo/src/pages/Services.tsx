import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "wouter";

const services = [
  {
    title: "Brand Strategy",
    category: "Foundation",
    description: "Positioning, identity architecture, and brand narrative for founder-led organisations at an inflection point. We establish what you stand for and how that translates across every touchpoint.",
    engagements: ["Brand audit and competitive positioning", "Narrative development and messaging architecture", "Visual identity alignment", "Go-to-market positioning"],
  },
  {
    title: "Growth Architecture",
    category: "Commercial",
    description: "Commercial strategy and growth frameworks for businesses navigating expansion. From market entry to channel strategy to revenue model design — structured for long-term durability.",
    engagements: ["Market opportunity mapping", "Revenue model design", "Channel and partnership strategy", "Pricing and packaging advisory"],
  },
  {
    title: "Executive Advisory",
    category: "Leadership",
    description: "Ongoing advisory for founders and senior leadership teams. A trusted thinking partner who understands your business deeply enough to challenge assumptions and surface the right questions.",
    engagements: ["Monthly strategic advisory sessions", "Board and investor preparation", "Leadership team alignment", "Strategic decision framing"],
  },
  {
    title: "Transformation Advisory",
    category: "Transformation",
    description: "For organisations navigating significant change — acquisitions, restructuring, repositioning, or rapid scale. We provide structured thinking and senior-level support throughout the transition.",
    engagements: ["Transformation strategy and roadmap", "Stakeholder alignment", "Change communication", "Progress architecture and milestone design"],
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-[#07090d]">
      <Header />
      <div className="max-w-5xl mx-auto px-6 lg:px-12 pt-28 pb-24">
        <div className="mb-16">
          <p className="text-[11px] font-medium tracking-[0.3em] uppercase text-[#c8a96a]/70 mb-4">Services</p>
          <h1
            className="text-4xl md:text-5xl font-light text-[#f5f0e8] leading-tight mb-5"
            style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
          >
            What we do, and how we do it
          </h1>
          <p className="text-[#f5f0e8]/45 text-[15px] font-light leading-relaxed max-w-xl">
            Every engagement is bespoke. We work with a small number of clients at any given time to ensure the depth of attention each deserves.
          </p>
        </div>

        <div className="space-y-10">
          {services.map((service) => (
            <div key={service.title} className="border-t border-[#f5f0e8]/6 pt-8">
              <div className="grid md:grid-cols-12 gap-8">
                <div className="md:col-span-5">
                  <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#c8a96a]/60 mb-2">{service.category}</p>
                  <h2
                    className="text-[22px] font-light text-[#f5f0e8] mb-3"
                    style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
                  >
                    {service.title}
                  </h2>
                  <p className="text-[#f5f0e8]/45 text-[13.5px] font-light leading-relaxed">
                    {service.description}
                  </p>
                </div>
                <div className="md:col-span-7">
                  <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-[#f5f0e8]/22 mb-3">Engagement scope</p>
                  <ul className="space-y-2">
                    {service.engagements.map((e) => (
                      <li key={e} className="flex items-start gap-3">
                        <span className="w-1 h-1 rounded-full bg-[#c8a96a]/40 mt-2 shrink-0" />
                        <span className="text-[#f5f0e8]/38 text-[13px] font-light">{e}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 border-t border-[#f5f0e8]/6 pt-10">
          <h3
            className="text-[19px] font-light text-[#f5f0e8] mb-3"
            style={{ fontFamily: "Georgia, 'Palatino Linotype', serif" }}
          >
            Begin a private inquiry
          </h3>
          <p className="text-[#f5f0e8]/40 text-[13px] font-light mb-5">
            We respond to substantive enquiries within two business days.
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
