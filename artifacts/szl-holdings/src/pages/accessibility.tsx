import { Link } from 'wouter';
import { Navbar } from '@/components/Navbar';
import { SiteFooter } from '@/components/SiteFooter';

const LAST_REVIEWED = 'April 2026';
const WCAG_VERSION = '2.1';
const CONFORMANCE_LEVEL = 'AA';

export default function AccessibilityPage() {
  return (
    <div
      style={{
        background: 'var(--color-szl-bg)',
        color: 'var(--color-szl-text)',
        minHeight: '100vh',
      }}
    >
      <Navbar />
      <main id="main-content" style={{ paddingTop: '6rem', paddingBottom: '4rem' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem',
              }}
            >
              <Link href="/trust" className="szl-eyebrow" style={{ textDecoration: 'none' }}>
                Trust Center
              </Link>
              <span style={{ color: 'var(--color-szl-text-faint)' }}>/</span>
              <span className="szl-eyebrow">Accessibility</span>
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                fontWeight: 700,
                color: 'var(--color-szl-text)',
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                marginBottom: '1rem',
              }}
            >
              Accessibility Statement
            </h1>
            <p
              style={{
                color: 'var(--color-szl-text-secondary)',
                lineHeight: 1.7,
                fontSize: '1rem',
              }}
            >
              SZL Holdings is committed to making our digital products accessible to everyone,
              including people with disabilities. We believe accessible design is good design.
            </p>
          </div>

          <div className="szl-rule" style={{ marginBottom: '2.5rem' }} role="separator" />

          <Section title="Conformance Status">
            <p>
              SZL Holdings aims to conform to the{' '}
              <a
                href="https://www.w3.org/WAI/standards-guidelines/wcag/"
                style={{ color: 'var(--color-szl-accent)', textDecoration: 'underline' }}
                target="_blank"
                rel="noopener noreferrer"
              >
                Web Content Accessibility Guidelines (WCAG) {WCAG_VERSION}
              </a>{' '}
              at Level {CONFORMANCE_LEVEL} across all of our web properties. WCAG {WCAG_VERSION}{' '}
              defines requirements for designers and developers to improve accessibility for people
              with disabilities, covering visual, auditory, physical, speech, cognitive, language,
              learning, and neurological disabilities.
            </p>
            <StatusBadge level="AA" />
          </Section>

          <Section title="Technical Specifications">
            <p>
              Our platform is built using semantic HTML5, ARIA landmarks and labels, and Radix UI
              primitives — all of which are designed with accessibility as a foundational
              requirement. We rely on the following technologies for conformance:
            </p>
            <ul
              style={{
                marginTop: '0.75rem',
                paddingLeft: '1.5rem',
                lineHeight: 1.8,
                color: 'var(--color-szl-text-secondary)',
              }}
            >
              <li>HTML5 semantic structure and landmark roles</li>
              <li>WAI-ARIA 1.2 attributes and roles</li>
              <li>CSS with prefers-reduced-motion and prefers-color-scheme support</li>
              <li>Keyboard-navigable interactive components</li>
              <li>Focus management in modals, dialogs, and drawers</li>
            </ul>
          </Section>

          <Section title="Measures We Take">
            <p>SZL Holdings takes the following measures to ensure accessibility:</p>
            <ul
              style={{
                marginTop: '0.75rem',
                paddingLeft: '1.5rem',
                lineHeight: 1.8,
                color: 'var(--color-szl-text-secondary)',
              }}
            >
              <li>
                <strong style={{ color: 'var(--color-szl-text)' }}>Color contrast:</strong> All text
                meets WCAG 2.1 AA contrast ratios — at least 4.5:1 for normal text and 3:1 for large
                text and UI components.
              </li>
              <li>
                <strong style={{ color: 'var(--color-szl-text)' }}>Keyboard navigation:</strong> All
                interactive elements are reachable and operable via keyboard alone. Focus indicators
                are visible and meet 3:1 contrast against adjacent colors.
              </li>
              <li>
                <strong style={{ color: 'var(--color-szl-text)' }}>Skip links:</strong> Every
                application includes a "Skip to main content" link that becomes visible on focus,
                allowing keyboard and screen reader users to bypass repetitive navigation.
              </li>
              <li>
                <strong style={{ color: 'var(--color-szl-text)' }}>Screen reader support:</strong>{' '}
                ARIA live regions announce dynamic content changes such as toast notifications,
                loading states, and form validation errors.
              </li>
              <li>
                <strong style={{ color: 'var(--color-szl-text)' }}>Form accessibility:</strong> All
                form inputs have programmatically associated labels. Error messages are linked to
                their corresponding inputs via <code>aria-describedby</code>. Required fields are
                communicated to assistive technology.
              </li>
              <li>
                <strong style={{ color: 'var(--color-szl-text)' }}>Reduced motion:</strong>{' '}
                Animations and transitions respect the operating system's "prefers-reduced-motion"
                setting.
              </li>
              <li>
                <strong style={{ color: 'var(--color-szl-text)' }}>Landmarks and structure:</strong>{' '}
                Pages use ARIA landmark roles (<code>banner</code>, <code>navigation</code>,{' '}
                <code>main</code>, <code>contentinfo</code>) and a logical heading hierarchy to
                support screen reader navigation.
              </li>
            </ul>
          </Section>

          <Section title="Known Limitations">
            <p>While we strive for full compliance, some areas are still being improved:</p>
            <ul
              style={{
                marginTop: '0.75rem',
                paddingLeft: '1.5rem',
                lineHeight: 1.8,
                color: 'var(--color-szl-text-secondary)',
              }}
            >
              <li>
                Complex data visualizations (charts, heatmaps, network graphs) may not yet have
                equivalent text alternatives. We are actively adding textual summaries to all chart
                components.
              </li>
              <li>
                Some legacy pages in the Alloy execution fabric interface are undergoing
                accessibility remediation as part of our ongoing development cycle.
              </li>
              <li>
                Third-party embedded content (such as Power BI reports) may not fully conform to
                WCAG 2.1 AA; we work with vendors to improve this where possible.
              </li>
            </ul>
          </Section>

          <Section title="Feedback and Contact">
            <p>
              We welcome feedback about the accessibility of the SZL Holdings platform. If you
              experience any barriers or difficulty accessing our products, please contact us so we
              can help.
            </p>
            <div
              style={{
                marginTop: '1.25rem',
                padding: '1.25rem 1.5rem',
                background: 'var(--color-szl-surface)',
                border: '1px solid var(--color-szl-border)',
                borderRadius: '0.5rem',
              }}
            >
              <p style={{ marginBottom: '0.5rem' }}>
                <strong style={{ color: 'var(--color-szl-text)' }}>Email:</strong>{' '}
                <a
                  href="mailto:accessibility@szlholdings.com"
                  style={{ color: 'var(--color-szl-accent)' }}
                >
                  accessibility@szlholdings.com
                </a>
              </p>
              <p>We aim to respond to accessibility feedback within 2 business days.</p>
            </div>
          </Section>

          <Section title="Formal Complaints">
            <p>
              If you are not satisfied with our response, you may contact the relevant supervisory
              authority in your jurisdiction. In the UK, this is the{' '}
              <a
                href="https://www.equalityhumanrights.com/"
                style={{ color: 'var(--color-szl-accent)', textDecoration: 'underline' }}
                target="_blank"
                rel="noopener noreferrer"
              >
                Equality and Human Rights Commission
              </a>
              . In the EU, you may contact your national equality body.
            </p>
          </Section>

          <div className="szl-rule" style={{ margin: '2.5rem 0' }} role="separator" />

          <p style={{ fontSize: '0.8125rem', color: 'var(--color-szl-text-faint)' }}>
            This statement was last reviewed in <strong>{LAST_REVIEWED}</strong>.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{ marginBottom: '2rem' }}
      aria-labelledby={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <h2
        id={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.125rem',
          fontWeight: 600,
          color: 'var(--color-szl-text)',
          letterSpacing: '-0.01em',
          marginBottom: '0.75rem',
        }}
      >
        {title}
      </h2>
      <div
        style={{
          color: 'var(--color-szl-text-secondary)',
          lineHeight: 1.75,
          fontSize: '0.9375rem',
        }}
      >
        {children}
      </div>
    </section>
  );
}

function StatusBadge({ level }: { level: string }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginTop: '1rem',
        padding: '0.5rem 1rem',
        background: 'rgba(45,106,79,0.1)',
        border: '1px solid rgba(45,106,79,0.25)',
        borderRadius: '0.375rem',
      }}
      role="status"
      aria-label={`WCAG ${WCAG_VERSION} Level ${level} compliance target`}
    >
      <span style={{ color: '#52a882', fontSize: '1rem' }} aria-hidden="true">
        ✓
      </span>
      <span
        style={{
          color: '#52a882',
          fontWeight: 600,
          fontSize: '0.875rem',
          fontFamily: 'var(--font-mono)',
        }}
      >
        WCAG {WCAG_VERSION} Level {level} — Target Conformance
      </span>
    </div>
  );
}
