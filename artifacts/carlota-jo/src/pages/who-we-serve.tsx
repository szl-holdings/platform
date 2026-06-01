import { motion } from 'framer-motion';
import { Link } from 'wouter';
import Footer from '@/components/Footer';
import Header from '@/components/Header';

const CLIENT_PROFILES = [
  {
    title: 'Ultra High-Net-Worth Families',
    tagline: 'Multiple residences. Complex operations. One trusted coordinator.',
    painPoint:
      'A UHNW family with two or more residences faces a compounding operational challenge: different staff teams, different vendors, different standards — and no single person accountable for the whole picture. The result is inconsistency, escalation to the principal, and a constant low-level friction that should simply not exist.',
    resolution:
      'Rosa becomes that single accountable person. She holds the operational picture across all properties, maintains consistent standards regardless of which residence you are in, and ensures that your family never experiences the gap between how things should be and how they are.',
    indicators: [
      'Two or more primary, secondary, or seasonal residences',
      'Household staff across multiple properties requiring coordination',
      'International properties with language or regulatory complexity',
      'Principal-level confidentiality required across all operations',
    ],
  },
  {
    title: 'Private Residences & Estates',
    tagline: 'Estate-scale environments requiring dedicated professional oversight.',
    painPoint:
      "A formal estate or large private residence operates at a scale that exceeds what even excellent household staff can manage without additional structure. Vendor relationships proliferate. Maintenance requirements compound. Standards drift without someone holding them. Most principals don't notice until something has already gone wrong.",
    resolution:
      "Rosa installs the systems and assumes the oversight role that estate environments require. She builds the vendor network, documents the standards, and maintains the operational infrastructure — so that the property performs to its full capability, consistently and without requiring the principal's time.",
    indicators: [
      'Large or complex property requiring active management beyond standard staffing',
      'Extensive vendor and contractor relationships requiring professional oversight',
      'Year-round maintenance standards and seasonal transition requirements',
      'Formal household management structure with multiple stakeholders',
    ],
  },
  {
    title: 'Principals Requiring Operational Relief',
    tagline: 'Demanding schedules. Zero tolerance for operational gaps. One point of contact.',
    painPoint:
      'Some principals simply do not have the time — or the inclination — to manage the operational layer of their residential life. They want their home to work exactly as it should, without having to think about it, without receiving daily updates, and without being escalated to unless it genuinely requires their decision.',
    resolution:
      "Rosa takes full operational ownership so the principal doesn't have to. She makes the decisions she can make, resolves issues before they surface, and reaches the principal only when something truly requires their attention. The result is the experience of a flawlessly run home without the management burden.",
    indicators: [
      'High-output professional with limited bandwidth for household management',
      'Absolute requirement for proactive, not reactive, operational support',
      'Preference for a trusted individual over an agency or service company',
      'Desire for a long-term relationship over transactional arrangements',
    ],
  },
  {
    title: 'Family Offices & Estate Principals',
    tagline: 'Residential operations as a professional discipline, not an afterthought.',
    painPoint:
      'Family offices and estate principals often manage the financial and legal dimensions of a household exceptionally well — while the operational reality on the ground falls short. Staff relationships are informal. Vendor accountability is inconsistent. Standards are assumed rather than documented. The gap shows in ways that are hard to articulate but immediately obvious.',
    resolution:
      'Rosa brings professional operational discipline to the residential environment — the same rigor that a well-run family office applies to investment governance. She reports clearly, documents thoroughly, and interfaces directly with family office advisors and legal counsel as required.',
    indicators: [
      'Family office environment with residential operations requiring dedicated oversight',
      'Multiple stakeholders with different priorities requiring a trusted coordinator',
      'Long-term continuity requirements across generations or ownership transitions',
      'Need for professional reporting and clear operational accountability',
    ],
  },
];

export default function WhoWeServePage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-cream-warm)' }}>
      <Header />
      <div className="pt-24">
        <section
          className="py-20 lg:py-28"
          style={{ borderBottom: '1px solid var(--color-stone-200)' }}
        >
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="max-w-2xl"
            >
              <p
                className="text-[11px] font-medium tracking-[0.35em] uppercase mb-6"
                style={{ color: 'var(--color-gold)' }}
              >
                Who We Serve
              </p>
              <h1
                className="font-serif font-light leading-[1.1] mb-6"
                style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--color-ink-900)' }}
              >
                A small number of clients.
                <br />
                <span style={{ fontStyle: 'italic' }}>An uncompromising standard.</span>
              </h1>
              <p
                className="text-base font-light leading-relaxed mb-4"
                style={{ color: 'var(--color-ink-600)' }}
              >
                Carlota Jo works with a deliberately limited client base. Every relationship begins
                with a genuine conversation about fit — and Rosa will decline engagements where she
                cannot deliver her full attention.
              </p>
              <p
                className="text-sm font-light leading-relaxed"
                style={{ color: 'var(--color-ink-500)' }}
              >
                The clients who benefit most from Carlota Jo share a common characteristic: they
                require an exceptional standard and have reached the point where managing the
                operational layer of residential life themselves — or through an agency — is no
                longer tenable.
              </p>
            </motion.div>
          </div>
        </section>

        <section
          className="py-16 lg:py-20"
          style={{ borderBottom: '1px solid var(--color-stone-200)' }}
        >
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <div className="space-y-0" style={{ borderTop: '1px solid var(--color-stone-200)' }}>
              {CLIENT_PROFILES.map((profile, i) => (
                <motion.div
                  key={profile.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                  className="py-12 grid grid-cols-1 lg:grid-cols-12 gap-8"
                  style={{ borderBottom: '1px solid var(--color-stone-200)' }}
                >
                  <div className="lg:col-span-4">
                    <h3
                      className="font-serif text-xl font-light mb-2"
                      style={{ color: 'var(--color-ink-900)' }}
                    >
                      {profile.title}
                    </h3>
                    <p
                      className="text-[12px] font-light leading-relaxed italic mb-5"
                      style={{ color: 'var(--color-gold)', opacity: 0.85 }}
                    >
                      {profile.tagline}
                    </p>
                    <ul className="space-y-2.5">
                      {profile.indicators.map((ind) => (
                        <li key={ind} className="flex items-start gap-3">
                          <span style={{ color: 'var(--color-gold)', marginTop: '0.1rem' }}>—</span>
                          <span
                            className="text-[12px] font-light"
                            style={{ color: 'var(--color-ink-600)' }}
                          >
                            {ind}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="lg:col-span-8 lg:pl-10">
                    <div className="mb-6">
                      <p
                        className="text-[10px] font-medium tracking-[0.2em] uppercase mb-3"
                        style={{ color: 'var(--color-stone-400)' }}
                      >
                        The challenge
                      </p>
                      <p
                        className="text-[13px] font-light leading-relaxed"
                        style={{ color: 'var(--color-ink-600)' }}
                      >
                        {profile.painPoint}
                      </p>
                    </div>
                    <div
                      className="pl-5"
                      style={{
                        borderLeft: '2px solid var(--color-gold)',
                        borderLeftColor: 'rgba(154,125,82,0.25)',
                      }}
                    >
                      <p
                        className="text-[10px] font-medium tracking-[0.2em] uppercase mb-3"
                        style={{ color: 'var(--color-gold)', opacity: 0.75 }}
                      >
                        How Carlota Jo responds
                      </p>
                      <p
                        className="text-[13px] font-light leading-relaxed"
                        style={{ color: 'var(--color-ink-700)' }}
                      >
                        {profile.resolution}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section
          className="py-16 lg:py-20"
          style={{
            background: 'var(--color-stone-50)',
            borderBottom: '1px solid var(--color-stone-200)',
          }}
        >
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <p
                className="text-[11px] font-medium tracking-[0.35em] uppercase mb-6"
                style={{ color: 'var(--color-gold)' }}
              >
                Introductions
              </p>
              <h2
                className="font-serif text-2xl font-light mb-4"
                style={{ color: 'var(--color-ink-900)' }}
              >
                Most new clients come through referral.
              </h2>
              <p
                className="text-sm font-light leading-relaxed mb-4"
                style={{ color: 'var(--color-ink-600)' }}
              >
                Carlota Jo does not advertise. The majority of new client relationships begin
                through introductions from existing clients, family offices, private wealth
                advisors, and estate attorneys who know Rosa's work firsthand.
              </p>
              <p
                className="text-sm font-light leading-relaxed mb-8"
                style={{ color: 'var(--color-ink-500)' }}
              >
                If you believe a principal in your network would benefit from Rosa's services, she
                welcomes introductions. All conversations are handled with complete discretion.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 text-[13px] font-medium tracking-[0.08em] transition-colors"
                  style={{ color: 'var(--color-cream)', background: 'var(--color-gold)' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'var(--color-gold-light)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'var(--color-gold)';
                  }}
                >
                  Begin a Conversation
                </Link>
                <Link
                  href="/services"
                  className="inline-flex items-center px-7 py-3.5 text-[12px] font-medium tracking-[0.12em] uppercase transition-all"
                  style={{
                    color: 'var(--color-ink-500)',
                    border: '1px solid var(--color-stone-300)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-ink-500)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--color-ink-900)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-stone-300)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--color-ink-500)';
                  }}
                >
                  View Services
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-16 lg:py-20">
          <div className="max-w-5xl mx-auto px-6 lg:px-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2
                className="font-serif text-2xl font-light mb-4"
                style={{ color: 'var(--color-ink-900)' }}
              >
                Ready to speak with Rosa?
              </h2>
              <p className="text-sm font-light mb-8" style={{ color: 'var(--color-ink-500)' }}>
                All conversations are handled with complete confidentiality.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2.5 px-8 py-4 text-[13px] font-medium tracking-[0.08em] transition-colors"
                style={{ color: 'var(--color-cream)', background: 'var(--color-gold)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--color-gold-light)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--color-gold)';
                }}
              >
                Begin a Conversation
              </Link>
            </motion.div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
