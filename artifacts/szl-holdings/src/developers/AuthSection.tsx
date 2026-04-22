
import {
  Callout,
  CodeBlock,
  InlineCode,
  SectionHeader,
  SubSectionHeader,
} from './components';

export function AuthSection() {
  return (
    <section>
      {/* ── Authentication ── */}
      <SectionHeader
        id="authentication"
        title="Authentication"
        subtitle="The DreamStack API supports multiple authentication patterns depending on your integration type."
      />

      <SubSectionHeader id="auth-overview" title="Overview" />
      <p style={{ color: 'hsl(214,8%,64%)', lineHeight: '1.7', marginBottom: '1rem' }}>
        All protected endpoints require authentication via the{' '}
        <InlineCode>Authorization</InlineCode> header. The platform supports Bearer tokens
        (session-based), long-lived API keys, OAuth 2.0 PKCE for user-delegated access, and SCIM
        tokens for directory provisioning.
      </p>

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
              {['Method', 'Use Case', 'Expiry', 'Scope'].map((h) => (
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
            {[
              ['Bearer Token', 'User-facing apps (web/mobile)', '30 days', 'Full user permissions'],
              [
                'API Key',
                'Server-to-server integrations',
                'Never (revocable)',
                'Configurable per key',
              ],
              [
                'OAuth 2.0 PKCE',
                'Third-party integrations',
                '1 hour (refresh tokens)',
                'Requested scopes',
              ],
              [
                'SCIM Token',
                'Directory provisioning (Azure AD)',
                'Never (revocable)',
                'User/group management',
              ],
            ].map(([method, useCase, expiry, scope], i) => (
              <tr
                key={method}
                style={{
                  borderBottom: i < 3 ? '1px solid hsla(0,0%,100%,0.04)' : 'none',
                  background: i % 2 === 0 ? 'hsla(214,14%,6%,0.4)' : 'transparent',
                }}
              >
                <td
                  className="px-4 py-3"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8125rem',
                    color: 'hsl(200,80%,72%)',
                  }}
                >
                  {method}
                </td>
                <td className="px-4 py-3" style={{ color: 'hsl(214,8%,68%)' }}>
                  {useCase}
                </td>
                <td
                  className="px-4 py-3"
                  style={{
                    color: 'hsl(214,8%,60%)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                  }}
                >
                  {expiry}
                </td>
                <td className="px-4 py-3" style={{ color: 'hsl(214,8%,60%)' }}>
                  {scope}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SubSectionHeader id="auth-bearer" title="Bearer Tokens" />
      <p style={{ color: 'hsl(214,8%,64%)', lineHeight: '1.7', marginBottom: '1rem' }}>
        Bearer tokens are issued after successful authentication via{' '}
        <InlineCode>POST /api/auth/login</InlineCode>. Include the token in every subsequent request
        using the <InlineCode>Authorization</InlineCode> header.
      </p>
      <CodeBlock
        filename="POST /api/auth/login"
        language="bash"
        code={`# Request
curl -X POST https://[host]/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"credential": "<replit_identity_token>"}'

# Response
{
  "token": "a3f9e2c4b1d8...",
  "expiresAt": "2026-05-01T00:00:00.000Z",
  "user": {
    "id": 42,
    "displayName": "Ada Lovelace",
    "email": "ada@example.com",
    "roles": ["operator", "viewer"]
  }
}`}
      />

      <div className="mt-4">
        <CodeBlock
          filename="Using the token"
          language="bash"
          code={`# Include the Bearer token in every protected request
curl https://[host]/api/projects \\
  -H "Authorization: Bearer a3f9e2c4b1d8..."`}
        />
      </div>

      <SubSectionHeader id="auth-oauth" title="OAuth 2.0 Flow" />
      <p style={{ color: 'hsl(214,8%,64%)', lineHeight: '1.7', marginBottom: '1rem' }}>
        For third-party integrations requiring user-delegated access, the platform implements OpenID
        Connect with PKCE (Proof Key for Code Exchange) via Replit Auth.
      </p>

      <div className="space-y-3 mb-6">
        {[
          {
            step: '01',
            title: 'Generate PKCE verifier',
            desc: 'Generate a cryptographically random code_verifier and compute its SHA-256 code_challenge.',
          },
          {
            step: '02',
            title: 'Redirect to authorization',
            desc: 'Redirect the user to the OIDC authorization endpoint with code_challenge, client_id, and requested scopes.',
          },
          {
            step: '03',
            title: 'Receive authorization code',
            desc: 'The user authenticates and is redirected back to your redirect_uri with an authorization code.',
          },
          {
            step: '04',
            title: 'Exchange for tokens',
            desc: 'POST the code and code_verifier to the token endpoint. Receive access_token and refresh_token.',
          },
          {
            step: '05',
            title: 'Use access token',
            desc: 'Include the access_token as Bearer token in API calls. Refresh using the refresh_token when expired.',
          },
        ].map(({ step, title, desc }) => (
          <div
            key={step}
            className="flex gap-4 p-4 rounded-lg"
            style={{
              background: 'hsla(214,14%,7%,0.5)',
              border: '1px solid hsla(0,0%,100%,0.06)',
            }}
          >
            <span
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: 'hsla(218,72%,52%,0.15)',
                border: '1px solid hsla(218,72%,52%,0.3)',
                color: 'hsl(218,72%,70%)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {step}
            </span>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: 'hsl(214,10%,84%)',
                  marginBottom: '2px',
                }}
              >
                {title}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'hsl(214,8%,58%)' }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      <CodeBlock
        filename="Token exchange"
        language="bash"
        code={`curl -X POST https://[host]/api/auth/oidc/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=authorization_code" \\
  -d "code=AUTH_CODE" \\
  -d "code_verifier=CODE_VERIFIER" \\
  -d "client_id=YOUR_CLIENT_ID" \\
  -d "redirect_uri=https://your-app.com/callback"`}
      />

      <SubSectionHeader id="auth-api-keys" title="API Keys" />
      <p style={{ color: 'hsl(214,8%,64%)', lineHeight: '1.7', marginBottom: '1rem' }}>
        Long-lived API keys are intended for server-to-server integrations where a user context is
        not required. Keys are generated through the Admin panel and can be scoped to specific
        resources or operations.
      </p>

      <Callout type="warning">
        API keys are displayed only once at creation time. Store them securely in a secrets manager.
        If a key is compromised, revoke it immediately from the Admin panel — revocation takes
        effect within 60 seconds platform-wide.
      </Callout>

      <div className="mt-4">
        <CodeBlock
          filename="Using an API key"
          language="bash"
          code={`# API keys use the same Authorization header format
curl https://[host]/api/vessels \\
  -H "Authorization: Bearer szl_live_a1b2c3d4e5f6..."`}
        />
      </div>

      <SubSectionHeader id="auth-scim" title="SCIM Tokens" />
      <p style={{ color: 'hsl(214,8%,64%)', lineHeight: '1.7', marginBottom: '1rem' }}>
        SCIM 2.0 tokens enable automated user provisioning and deprovisioning via Azure Active
        Directory or any SCIM-compliant identity provider. SCIM tokens grant access only to{' '}
        <InlineCode>/api/scim/v2/</InlineCode> endpoints.
      </p>

      <CodeBlock
        filename="Azure AD SCIM configuration"
        language="text"
        code={`Tenant URL: https://[host]/api/scim/v2
Secret Token: <scim_token_from_admin_panel>

Supported operations:
  - User provisioning (CREATE, UPDATE, DELETE)
  - Group provisioning (CREATE, UPDATE, DELETE)
  - Filtering by userName, externalId
  - Pagination: ?startIndex=1&count=100`}
      />
    </section>
  );
}
