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
import {
  API_ERROR_CODES,
  ERROR_CODES,
  GQL_MUTATION_SIGNAL,
  GQL_QUERY_PROJECTS,
  GQL_QUERY_VESSELS,
  RATE_LIMIT_TIERS,
  WEBHOOK_EVENTS,
} from './constants';

export function RateLimitsSection() {
  return (
    <section>
      <SectionHeader
        id="rate-limits"
        title="Rate Limits"
        subtitle="The API enforces per-tier rate limits to ensure platform stability. Limits are applied per IP address for unauthenticated requests, and per user/API key for authenticated requests."
      />

      <div
        className="rounded-lg overflow-hidden mb-6"
        style={{ border: '1px solid hsla(0,0%,100%,0.07)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr
              style={{
                background: 'hsla(214,14%,7%,0.8)',
                borderBottom: '1px solid hsla(0,0%,100%,0.07)',
              }}
            >
              {['Tier', 'Requests/Hour', 'Burst Limit', 'Applies To'].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3"
                  style={{
                    color: 'hsl(214,8%,55%)',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 500,
                    fontSize: '0.75rem',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RATE_LIMIT_TIERS.map(({ tier, rph, burst, applies, color }, i) => (
              <tr
                key={tier}
                style={{
                  borderBottom:
                    i < RATE_LIMIT_TIERS.length - 1 ? '1px solid hsla(0,0%,100%,0.04)' : 'none',
                  background: i % 2 === 0 ? 'hsla(214,14%,6%,0.4)' : 'transparent',
                }}
              >
                <td className="px-4 py-3">
                  <span
                    className="px-2 py-0.5 rounded text-xs"
                    style={{
                      background: `${color}18`,
                      border: `1px solid ${color}33`,
                      color,
                      fontFamily: 'var(--font-display)',
                      fontWeight: 500,
                    }}
                  >
                    {tier}
                  </span>
                </td>
                <td
                  className="px-4 py-3"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8125rem',
                    color: 'hsl(214,10%,80%)',
                  }}
                >
                  {rph}
                </td>
                <td
                  className="px-4 py-3"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8125rem',
                    color: 'hsl(214,10%,80%)',
                  }}
                >
                  {burst}
                </td>
                <td
                  className="px-4 py-3"
                  style={{ color: 'hsl(214,8%,62%)', fontSize: '0.8125rem' }}
                >
                  {applies}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ color: 'hsl(214,8%,64%)', lineHeight: '1.7', marginBottom: '1rem' }}>
        When a rate limit is exceeded, the API returns a{' '}
        <InlineCode>429 Too Many Requests</InlineCode> response with the following headers:
      </p>

      <CodeBlock
        language="text"
        code={`HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 600
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1746316800
Retry-After: 47

{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Retry after 47 seconds.",
  "code": "RATE_LIMITED"
}`}
      />

      <Callout type="tip">
        Implement exponential backoff when handling 429 responses. Start with the{' '}
        <InlineCode>Retry-After</InlineCode> value as your base delay, and apply jitter (±20%) to
        prevent synchronized retry storms.
      </Callout>
    </section>
  );
}
