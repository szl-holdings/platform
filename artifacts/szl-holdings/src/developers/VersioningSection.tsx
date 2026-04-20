import {
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Code2,
  Database,
  ExternalLink,
  FileCode,
  Globe,
  Hash,
  Key,
  Layers,
  Lock,
  PlayCircle,
  RefreshCw,
  Server,
  Shield,
  Terminal,
  Webhook,
  Zap,
} from 'lucide-react';
import {
  Callout,
  CodeBlock,
  InlineCode,
  LanguageTabs,
  SectionHeader,
  SubSectionHeader,
} from './components';

export function VersioningSection() {
  return (
    <section>
      <SectionHeader
        id="versioning"
        title="Versioning Strategy"
        subtitle="The DreamStack API uses a stable-first, additive-change philosophy. Breaking changes require advance notice and a migration path."
      />

      <p style={{ color: 'hsl(214,8%,64%)', lineHeight: '1.7', marginBottom: '1rem' }}>
        The current API is at version <InlineCode>0.2.0</InlineCode>. Version 1.0 will be declared
        when the schema is considered stable for public enterprise use.
      </p>

      <div className="space-y-4 mb-8">
        {[
          {
            title: 'Non-breaking changes (no version bump required)',
            color: 'hsl(142,62%,48%)',
            items: [
              'Adding new optional fields to responses',
              'Adding new endpoints',
              'Adding new optional query parameters',
              'Adding new enum values to existing fields',
              'Performance improvements and bug fixes',
            ],
          },
          {
            title: 'Breaking changes (require version increment + migration path)',
            color: 'hsl(0,72%,62%)',
            items: [
              'Removing or renaming existing fields',
              'Changing field types',
              'Making previously optional fields required',
              'Removing endpoints',
              'Changing authentication mechanisms',
            ],
          },
        ].map(({ title, color, items }) => (
          <div
            key={title}
            className="p-5 rounded-lg"
            style={{
              background: 'hsla(214,14%,7%,0.5)',
              border: '1px solid hsla(0,0%,100%,0.06)',
            }}
          >
            <div
              className="flex items-center gap-2 mb-3"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'hsl(214,10%,84%)',
              }}
            >
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              {title}
            </div>
            <ul className="space-y-1.5">
              {items.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2"
                  style={{ fontSize: '0.8125rem', color: 'hsl(214,8%,60%)' }}
                >
                  <ChevronRight size={12} style={{ color, marginTop: '3px', flexShrink: 0 }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <SubSectionHeader id="versioning-deprecation" title="Deprecation Policy" />
      <p style={{ color: 'hsl(214,8%,64%)', lineHeight: '1.7', marginBottom: '1rem' }}>
        Deprecated endpoints and fields are annotated in the OpenAPI spec with a{' '}
        <InlineCode>deprecated: true</InlineCode> flag and will include a{' '}
        <InlineCode>Deprecation</InlineCode> response header with the planned removal date.
        Enterprise customers receive at minimum{' '}
        <strong style={{ color: 'hsl(38,10%,84%)' }}>6 months notice</strong> before removal.
      </p>

      <CodeBlock
        language="text"
        code={`# Deprecation headers on affected endpoints
HTTP/1.1 200 OK
Deprecation: Sat, 01 Nov 2026 00:00:00 GMT
Sunset: Sun, 01 Feb 2027 00:00:00 GMT
Link: </api/docs#section/Versioning>; rel="deprecation"
X-API-Warn: "This endpoint is deprecated. Migrate to /api/v2/vessels by 2027-02-01."`}
      />

      <Callout type="tip">
        Subscribe to the{' '}
        <strong style={{ color: 'hsl(38,10%,84%)' }}>platform.api.deprecation</strong> webhook event
        to receive automated notification when any endpoint your integration uses is deprecated.
      </Callout>

      <div className="mt-8 pt-8" style={{ borderTop: '1px solid hsla(0,0%,100%,0.06)' }}>
        <div className="flex items-center gap-3 mb-4">
          <Server size={16} style={{ color: 'hsl(214,8%,50%)' }} />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.875rem',
              color: 'hsl(214,8%,60%)',
            }}
          >
            Need help with your integration?
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href="/contact"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
            style={{
              background: 'hsla(38,55%,60%,0.1)',
              border: '1px solid hsla(38,55%,60%,0.25)',
              color: 'hsl(38,55%,70%)',
              textDecoration: 'none',
              fontFamily: 'var(--font-display)',
            }}
          >
            <ArrowRight size={14} />
            Contact Integration Support
          </a>
          <a
            href="/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
            style={{
              background: 'hsla(214,14%,9%,0.8)',
              border: '1px solid hsla(0,0%,100%,0.08)',
              color: 'hsl(214,8%,68%)',
              textDecoration: 'none',
              fontFamily: 'var(--font-display)',
            }}
          >
            <ExternalLink size={14} />
            Open Swagger UI
          </a>
        </div>
      </div>
    </section>
  );
}
