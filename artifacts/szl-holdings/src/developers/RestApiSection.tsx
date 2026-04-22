import {
  ExternalLink,
  FileCode,
  PlayCircle,
} from 'lucide-react';
import {
  SectionHeader,
  SubSectionHeader,
} from './components';

export function RestApiSection() {
  return (
    <section>
      <SectionHeader
        id="rest-api"
        title="REST API"
        badge="OpenAPI 3.1.0"
        subtitle="Full CRUD access to all platform entities. All endpoints return JSON. Errors include a machine-readable code field."
      />

      <SubSectionHeader id="rest-overview" title="Base URL & Request Format" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {[
          {
            label: 'Content-Type',
            value: 'application/json',
            desc: 'Required on all POST, PUT, PATCH requests',
          },
          {
            label: 'Authorization',
            value: 'Bearer <token>',
            desc: 'Required on all protected endpoints',
          },
          {
            label: 'X-Correlation-Id',
            value: 'auto-generated',
            desc: 'Returned in every response for tracing',
          },
          {
            label: 'Accept',
            value: 'application/json',
            desc: 'Optional — JSON is always the default',
          },
        ].map(({ label, value, desc }) => (
          <div
            key={label}
            className="px-4 py-3 rounded-lg"
            style={{
              background: 'hsla(214,14%,7%,0.5)',
              border: '1px solid hsla(0,0%,100%,0.06)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                color: 'hsl(200,80%,72%)',
                marginBottom: '2px',
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8125rem',
                color: 'hsl(214,10%,80%)',
                marginBottom: '4px',
              }}
            >
              {value}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'hsl(214,8%,50%)' }}>{desc}</div>
          </div>
        ))}
      </div>

      <SubSectionHeader id="rest-explorer" title="Interactive Explorer" />
      <p style={{ color: 'hsl(214,8%,64%)', lineHeight: '1.7', marginBottom: '1.25rem' }}>
        The full interactive API explorer is powered by Swagger UI. You can execute live requests,
        inspect schemas, and authorize with your Bearer token directly in the browser.
      </p>

      <div
        className="rounded-xl overflow-hidden"
        style={{
          border: '1px solid hsla(0,0%,100%,0.09)',
          background: 'hsla(214,14%,7%,0.5)',
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: '1px solid hsla(0,0%,100%,0.07)' }}
        >
          <div className="flex items-center gap-2.5">
            <PlayCircle size={15} style={{ color: 'hsl(142,62%,48%)' }} />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'hsl(214,10%,84%)',
              }}
            >
              Swagger UI — Live API Explorer
            </span>
          </div>
          <a
            href="/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: 'hsl(218,72%,65%)' }}
          >
            <ExternalLink size={13} />
            Open full screen
          </a>
        </div>

        <div className="px-5 py-5" style={{ background: 'hsla(214,14%,5%,0.95)' }}>
          <p
            style={{
              color: 'hsl(214,8%,60%)',
              fontSize: '0.875rem',
              lineHeight: '1.6',
              marginBottom: '1.25rem',
            }}
          >
            The full Swagger UI explorer is available in a dedicated tab. Authenticate with your
            Bearer token using the <strong style={{ color: 'hsl(214,10%,80%)' }}>Authorize</strong>{' '}
            button, then execute live requests against any endpoint.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { tag: 'health', count: 4, color: 'hsl(142,62%,48%)' },
              { tag: 'auth', count: 12, color: 'hsl(218,72%,60%)' },
              { tag: 'projects', count: 6, color: 'hsl(265,80%,60%)' },
              { tag: 'vessels', count: 18, color: 'hsl(210,78%,50%)' },
              { tag: 'alloy', count: 24, color: 'hsl(222,68%,58%)' },
              { tag: 'billing', count: 8, color: 'hsl(38,88%,55%)' },
              { tag: 'connectors', count: 10, color: 'hsl(32,65%,52%)' },
              { tag: 'observability', count: 9, color: 'hsl(190,90%,50%)' },
            ].map(({ tag, count, color }) => (
              <div
                key={tag}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                style={{
                  background: 'hsla(214,14%,8%,0.8)',
                  border: '1px solid hsla(0,0%,100%,0.06)',
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color }}>
                  {tag}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    color: 'hsl(214,8%,44%)',
                  }}
                >
                  {count} endpoints
                </span>
              </div>
            ))}
          </div>

          <a
            href="/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all duration-200"
            style={{
              background: 'hsla(218,72%,52%,0.15)',
              border: '1px solid hsla(218,72%,52%,0.3)',
              color: 'hsl(218,72%,72%)',
              textDecoration: 'none',
              fontFamily: 'var(--font-display)',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            <PlayCircle size={15} />
            Open Swagger UI Explorer
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <a
          href="/api/docs.json"
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
          <FileCode size={14} />
          Download OpenAPI JSON
        </a>
        <a
          href="https://spec.openapis.org/oas/v3.1.0"
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
          OpenAPI 3.1 Spec
        </a>
      </div>
    </section>
  );
}
