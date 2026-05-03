import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Cpu,
  Code2,
  EyeOff,
  Figma,
  Film,
  Github,
  Loader,
  Network,
  Play,
  Sparkles,
  XCircle,
  Zap,
} from 'lucide-react';
import { useCallback, useState } from 'react';

interface ToolParam {
  name: string;
  type: string;
  required?: boolean;
  description: string;
}

interface DemoTool {
  id: string;
  protocol: string;
  adapter: string;
  name: string;
  description: string;
  domain: string;
  params: ToolParam[];
  mockResponse: (args: Record<string, unknown>) => unknown;
}

const FIGMA_TOOLS: DemoTool[] = [
  {
    id: 'figma_list_files',
    protocol: 'MCP',
    adapter: 'Figma',
    name: 'figma_list_files',
    description: 'List Figma files in a project.',
    domain: 'figma.com',
    params: [
      { name: 'project_id', type: 'string', required: true, description: 'Figma project ID' },
    ],
    mockResponse: () => ({
      files: [
        {
          key: 'abc123',
          name: 'NEXUS Design System v2.4',
          last_modified: '2026-04-22T14:30:00Z',
          thumbnail_url: null,
        },
        {
          key: 'def456',
          name: 'SZL Holdings Dashboard — Q2 2026',
          last_modified: '2026-04-20T09:15:00Z',
          thumbnail_url: null,
        },
        {
          key: 'ghi789',
          name: 'Sentra Cyber Command — Wireframes',
          last_modified: '2026-04-18T16:45:00Z',
          thumbnail_url: null,
        },
        {
          key: 'jkl012',
          name: 'Mobile Command — iOS/Android',
          last_modified: '2026-04-17T11:00:00Z',
          thumbnail_url: null,
        },
      ],
      total: 4,
    }),
  },
  {
    id: 'figma_get_file_nodes',
    protocol: 'MCP',
    adapter: 'Figma',
    name: 'figma_get_file_nodes',
    description: 'Get specific nodes from a Figma file by IDs.',
    domain: 'figma.com',
    params: [
      { name: 'file_key', type: 'string', required: true, description: 'Figma file key' },
      {
        name: 'node_ids',
        type: 'string[]',
        required: true,
        description: 'Array of node IDs to retrieve',
      },
    ],
    mockResponse: (args) => ({
      nodes: {
        '1:2': {
          document: {
            id: '1:2',
            name: 'Color / Accent / Cyan',
            type: 'RECTANGLE',
            fills: [{ type: 'SOLID', color: { r: 0.133, g: 0.827, b: 0.933, a: 1 } }],
          },
        },
        '1:3': {
          document: {
            id: '1:3',
            name: 'Color / Accent / Green',
            type: 'RECTANGLE',
            fills: [{ type: 'SOLID', color: { r: 0.639, g: 0.902, b: 0.208, a: 1 } }],
          },
        },
      },
      file_key: (args.file_key as string) || 'abc123',
    }),
  },
  {
    id: 'figma_export_tokens',
    protocol: 'MCP',
    adapter: 'Figma',
    name: 'figma_export_tokens',
    description: 'Export design tokens from a Figma file as a JSON token set.',
    domain: 'figma.com',
    params: [{ name: 'file_key', type: 'string', required: true, description: 'Figma file key' }],
    mockResponse: () => ({
      tokens: {
        color: {
          accent: {
            cyan: { value: '#22d3ee', type: 'color' },
            green: { value: '#a3e635', type: 'color' },
            amber: { value: '#f59e0b', type: 'color' },
          },
        },
        spacing: {
          xs: { value: '4px', type: 'dimension' },
          sm: { value: '8px', type: 'dimension' },
          md: { value: '16px', type: 'dimension' },
        },
      },
      schema_version: '1.0',
    }),
  },
];

const GITHUB_TOOLS: DemoTool[] = [
  {
    id: 'github_list_repos',
    protocol: 'A2A',
    adapter: 'GitHub',
    name: 'github_list_repos',
    description: 'List repositories for an organization.',
    domain: 'github.com',
    params: [
      { name: 'org', type: 'string', required: true, description: 'GitHub organization name' },
    ],
    mockResponse: (args) => ({
      repos: [
        {
          id: 1,
          name: 'platform-monorepo',
          full_name: `${(args.org as string) || 'szl-holdings'}/platform-monorepo`,
          private: true,
          stars: 0,
          forks: 0,
          open_issues: 12,
          updated_at: '2026-04-25T08:00:00Z',
        },
        {
          id: 2,
          name: 'praxis-agents',
          full_name: `${(args.org as string) || 'szl-holdings'}/praxis-agents`,
          private: true,
          stars: 0,
          forks: 0,
          open_issues: 3,
          updated_at: '2026-04-24T14:30:00Z',
        },
        {
          id: 3,
          name: 'design-system',
          full_name: `${(args.org as string) || 'szl-holdings'}/design-system`,
          private: false,
          stars: 47,
          forks: 8,
          open_issues: 5,
          updated_at: '2026-04-23T10:00:00Z',
        },
      ],
      total: 3,
    }),
  },
  {
    id: 'github_get_pr',
    protocol: 'A2A',
    adapter: 'GitHub',
    name: 'github_get_pr',
    description: 'Get details of a pull request.',
    domain: 'github.com',
    params: [
      { name: 'owner', type: 'string', required: true, description: 'Repository owner' },
      { name: 'repo', type: 'string', required: true, description: 'Repository name' },
      { name: 'pr_number', type: 'number', required: true, description: 'Pull request number' },
    ],
    mockResponse: (args) => ({
      number: (args.pr_number as number) || 142,
      title: 'feat(bridge): add Figma & Linear demo adapters',
      state: 'open',
      author: 'praxis-bot',
      created_at: '2026-04-24T09:00:00Z',
      additions: 847,
      deletions: 42,
      changed_files: 12,
      body: 'Adds scripted demo adapters for Figma, GitHub, Linear, and Design-Token CDN to the NEXUS Protocol Bridge.',
      labels: ['enhancement', 'praxis'],
    }),
  },
  {
    id: 'github_list_issues',
    protocol: 'A2A',
    adapter: 'GitHub',
    name: 'github_list_issues',
    description: 'List open issues in a repository.',
    domain: 'github.com',
    params: [
      { name: 'owner', type: 'string', required: true, description: 'Repository owner' },
      { name: 'repo', type: 'string', required: true, description: 'Repository name' },
      { name: 'state', type: 'string', description: '"open" | "closed" | "all"' },
    ],
    mockResponse: () => ({
      issues: [
        {
          number: 203,
          title: 'TokensGovernance: add per-artifact sparklines',
          state: 'open',
          labels: ['praxis', 'enhancement'],
          created_at: '2026-04-25T10:00:00Z',
        },
        {
          number: 197,
          title: 'PatternAtlas: add "where used" section per pattern',
          state: 'open',
          labels: ['praxis'],
          created_at: '2026-04-24T08:30:00Z',
        },
        {
          number: 191,
          title: 'Bridge: Figma adapter missing token export tool',
          state: 'closed',
          labels: ['praxis', 'bug'],
          created_at: '2026-04-22T14:00:00Z',
        },
      ],
      total: 3,
    }),
  },
];

const LINEAR_TOOLS: DemoTool[] = [
  {
    id: 'linear_list_issues',
    protocol: 'ACP',
    adapter: 'Linear',
    name: 'linear_list_issues',
    description: 'List issues in a Linear team.',
    domain: 'linear.app',
    params: [
      { name: 'team_id', type: 'string', required: true, description: 'Linear team ID' },
      {
        name: 'state',
        type: 'string',
        description: 'Filter by state: "todo" | "in_progress" | "done"',
      },
    ],
    mockResponse: () => ({
      issues: [
        {
          id: 'PRX-483',
          title: 'Fill Bridge placeholder pages',
          priority: 'urgent',
          state: 'in_progress',
          assignee: 'praxis-agent',
          created_at: '2026-04-25T09:00:00Z',
        },
        {
          id: 'PRX-479',
          title: 'Add org switcher to NEXUS layout',
          priority: 'high',
          state: 'done',
          assignee: 'praxis-agent',
          created_at: '2026-04-24T14:00:00Z',
        },
        {
          id: 'PRX-471',
          title: 'Eval Console scripted suites',
          priority: 'medium',
          state: 'todo',
          assignee: null,
          created_at: '2026-04-23T10:00:00Z',
        },
      ],
      total: 3,
    }),
  },
  {
    id: 'linear_get_issue',
    protocol: 'ACP',
    adapter: 'Linear',
    name: 'linear_get_issue',
    description: 'Get a single Linear issue by ID.',
    domain: 'linear.app',
    params: [
      {
        name: 'issue_id',
        type: 'string',
        required: true,
        description: 'Linear issue ID (e.g. PRX-483)',
      },
    ],
    mockResponse: (args) => ({
      id: (args.issue_id as string) || 'PRX-483',
      title: 'Fill Bridge placeholder pages',
      description:
        'Adds scripted demo adapters for Figma, GitHub, Linear, and Design-Token CDN to the NEXUS Protocol Bridge.',
      priority: 'urgent',
      state: 'in_progress',
      assignee: 'praxis-agent',
      labels: ['praxis', 'enhancement'],
      estimate: 3,
      created_at: '2026-04-25T09:00:00Z',
      updated_at: '2026-04-25T11:30:00Z',
    }),
  },
  {
    id: 'linear_create_issue',
    protocol: 'ACP',
    adapter: 'Linear',
    name: 'linear_create_issue',
    description: 'Create a new Linear issue.',
    domain: 'linear.app',
    params: [
      { name: 'team_id', type: 'string', required: true, description: 'Linear team ID' },
      { name: 'title', type: 'string', required: true, description: 'Issue title' },
      { name: 'description', type: 'string', description: 'Issue body (markdown)' },
      { name: 'priority', type: 'string', description: '"urgent" | "high" | "medium" | "low"' },
    ],
    mockResponse: (args) => ({
      id: 'PRX-' + (490 + Math.floor(Math.random() * 10)),
      title: (args.title as string) || 'New issue',
      state: 'todo',
      created_at: new Date().toISOString(),
      url: 'https://linear.app/szl/issue/PRX-490',
    }),
  },
];

const CAMOFOX_DEMO_ALLOWLIST = [
  'example.com',
  'portofrotterdam.com',
  'marinetraffic.com',
  'zillow.com',
];

function camofoxPolicyCheck(url: string): { allowed: boolean; domain: string } {
  let domain = '';
  try {
    domain = new URL(url || 'http://unknown').hostname;
  } catch {
    domain = 'unknown';
  }
  const allowed = CAMOFOX_DEMO_ALLOWLIST.some((d) => domain === d || domain.endsWith(`.${d}`));
  return { allowed, domain };
}

const CAMOFOX_TOOLS: DemoTool[] = [
  {
    id: 'web_stealth_fetch',
    protocol: 'MCP',
    adapter: 'Camofox',
    name: 'web.stealth.fetch',
    description:
      'Fetch a URL through the Camofox stealth browser. Only allowlisted domains are reachable.',
    domain: 'camofox.internal',
    params: [
      {
        name: 'url',
        type: 'string',
        required: true,
        description: 'Target URL (must be on the domain allowlist)',
      },
      { name: 'timeout_ms', type: 'number', description: 'Request timeout in ms (default: 15000)' },
    ],
    mockResponse: (args) => {
      const url = (args.url as string) || '';
      const { allowed, domain } = camofoxPolicyCheck(url);
      if (!allowed) {
        return {
          policy: 'blocked',
          reason: `Domain "${domain}" is not on the PRAXIS web.stealth allowlist. Add it via Skills → Camofox before retrying.`,
          allowed_domains: CAMOFOX_DEMO_ALLOWLIST,
          audit_id: 'audit_' + Math.random().toString(36).slice(2, 8),
        };
      }
      return {
        status_code: 200,
        url,
        content_type: 'text/html; charset=utf-8',
        bytes: Math.floor(28000 + Math.random() * 12000),
        title:
          domain === 'portofrotterdam.com'
            ? 'Port of Rotterdam — Live Operations'
            : domain === 'marinetraffic.com'
              ? 'MarineTraffic — Vessel Tracking'
              : domain === 'zillow.com'
                ? 'Zillow — Real Estate Listings'
                : 'Example Domain',
        fetch_time_ms: Math.floor(800 + Math.random() * 1200),
        fingerprint_profile: {
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          resolution: '1920x1080',
          locale: 'en-US',
          timezone: 'America/New_York',
        },
        camofox_version: '2.3.1',
        audit_id: 'audit_' + Math.random().toString(36).slice(2, 8),
      };
    },
  },
  {
    id: 'web_stealth_snapshot',
    protocol: 'MCP',
    adapter: 'Camofox',
    name: 'web.stealth.accessibility-snapshot',
    description:
      'Capture an accessibility tree snapshot of a rendered page — ideal for structured data extraction without CSS parsing.',
    domain: 'camofox.internal',
    params: [
      {
        name: 'url',
        type: 'string',
        required: true,
        description: 'Target URL (must be on the domain allowlist)',
      },
      {
        name: 'selector',
        type: 'string',
        description: 'CSS selector to scope snapshot (default: body)',
      },
      {
        name: 'wait_for',
        type: 'string',
        description: 'CSS selector to wait for before snapshotting',
      },
    ],
    mockResponse: (args) => {
      const url = (args.url as string) || '';
      const { allowed, domain } = camofoxPolicyCheck(url);
      if (!allowed) {
        return {
          policy: 'blocked',
          reason: `Domain "${domain}" is not on the PRAXIS web.stealth allowlist.`,
          audit_id: 'audit_' + Math.random().toString(36).slice(2, 8),
        };
      }
      const isPort = domain.includes('rotterdam') || domain.includes('marinetraffic');
      const isProperty = domain.includes('zillow');
      return {
        status_code: 200,
        url,
        snapshot_nodes: isPort
          ? [
              { role: 'heading', name: 'Live Vessel Queue — Berth 7', level: 1 },
              { role: 'table', name: 'Vessel Schedule', rows: 12 },
              { role: 'region', name: 'Port Congestion Indicator', text: 'Moderate (67%)' },
              {
                role: 'list',
                name: 'Active Arrivals',
                items: ['MSC MAYA — ETA 06:30 UTC', 'EVER GIVEN — ETA 09:15 UTC'],
              },
            ]
          : isProperty
            ? [
                { role: 'heading', name: '3BR/2BA — 142 Oak St, Austin TX', level: 1 },
                { role: 'region', name: 'Price', text: '$485,000' },
                {
                  role: 'list',
                  name: 'Key Facts',
                  items: ['1,840 sqft', 'Built 2003', '0.18 acre lot', 'Zestimate: $491K'],
                },
                { role: 'region', name: 'Days on Market', text: '23 days' },
              ]
            : [
                { role: 'heading', name: 'Example Domain', level: 1 },
                {
                  role: 'paragraph',
                  text: 'This domain is for use in illustrative examples in documents.',
                },
              ],
        node_count: 847,
        bytes: Math.floor(12000 + Math.random() * 8000),
        camofox_version: '2.3.1',
        audit_id: 'audit_' + Math.random().toString(36).slice(2, 8),
      };
    },
  },
  {
    id: 'web_stealth_click_extract',
    protocol: 'MCP',
    adapter: 'Camofox',
    name: 'web.stealth.click-and-extract',
    description:
      'Click a UI element then extract the resulting page state — for paginated tables, tabs, and reveal interactions.',
    domain: 'camofox.internal',
    params: [
      {
        name: 'url',
        type: 'string',
        required: true,
        description: 'Target URL (must be on the domain allowlist)',
      },
      {
        name: 'click_selector',
        type: 'string',
        required: true,
        description: 'CSS selector of element to click',
      },
      {
        name: 'extract_selector',
        type: 'string',
        description: 'CSS selector to extract after click (default: body)',
      },
    ],
    mockResponse: (args) => {
      const url = (args.url as string) || '';
      const { allowed, domain } = camofoxPolicyCheck(url);
      if (!allowed) {
        return {
          policy: 'blocked',
          reason: `Domain "${domain}" is not on the PRAXIS web.stealth allowlist.`,
          audit_id: 'audit_' + Math.random().toString(36).slice(2, 8),
        };
      }
      return {
        status_code: 200,
        url,
        click_selector: (args.click_selector as string) || 'button',
        click_found: true,
        extract_selector: (args.extract_selector as string) || 'body',
        extracted_text_length: Math.floor(4200 + Math.random() * 3000),
        extracted_snippet:
          'Page state after click interaction captured. Stealth profile active during navigation.',
        interaction_time_ms: Math.floor(1200 + Math.random() * 800),
        camofox_version: '2.3.1',
        audit_id: 'audit_' + Math.random().toString(36).slice(2, 8),
      };
    },
  },
];

const TOKEN_CDN_TOOLS: DemoTool[] = [
  {
    id: 'token_cdn_list_sets',
    protocol: 'ANP',
    adapter: 'Design-Token CDN',
    name: 'token_cdn_list_sets',
    description: 'List available token sets on the governance CDN.',
    domain: 'tokens.szl.internal',
    params: [],
    mockResponse: () => ({
      sets: [
        {
          id: 'gi-core',
          name: 'GI Core',
          version: '2.4.1',
          last_published: '2026-04-22T10:00:00Z',
          tags: ['stable', 'design-system'],
        },
        {
          id: 'gi-dark',
          name: 'GI Dark Mode',
          version: '2.4.1',
          last_published: '2026-04-22T10:00:00Z',
          tags: ['stable', 'theme'],
        },
        {
          id: 'gi-high-contrast',
          name: 'GI High Contrast',
          version: '1.2.0',
          last_published: '2026-03-14T08:00:00Z',
          tags: ['a11y', 'theme'],
        },
        {
          id: 'gi-brand-szl',
          name: 'SZL Brand Override',
          version: '1.0.3',
          last_published: '2026-04-18T16:00:00Z',
          tags: ['brand', 'tenant'],
        },
      ],
      cdn_url: 'https://tokens.szl.internal/v2',
    }),
  },
  {
    id: 'token_cdn_fetch_set',
    protocol: 'ANP',
    adapter: 'Design-Token CDN',
    name: 'token_cdn_fetch_set',
    description: 'Fetch a complete token set from the CDN by ID.',
    domain: 'tokens.szl.internal',
    params: [
      {
        name: 'set_id',
        type: 'string',
        required: true,
        description: 'Token set ID (e.g. "gi-core")',
      },
      { name: 'format', type: 'string', description: '"json" | "css" | "scss"' },
    ],
    mockResponse: (args) => ({
      set_id: (args.set_id as string) || 'gi-core',
      format: (args.format as string) || 'json',
      version: '2.4.1',
      tokens: {
        '--gi-bg-base': 'var(--gi-bg-base)',
        '--gi-bg-surface': 'var(--gi-bg-surface)',
        '--gi-accent-cyan': '#22d3ee',
        '--gi-accent-green': '#a3e635',
        '--gi-accent-amber': '#f59e0b',
        '--gi-text-primary': 'var(--gi-text-primary)',
        '--gi-text-muted': '#7c8ea4',
      },
      etag: 'W/"2.4.1-1714384000"',
    }),
  },
  {
    id: 'token_cdn_diff',
    protocol: 'ANP',
    adapter: 'Design-Token CDN',
    name: 'token_cdn_diff',
    description: 'Diff two versions of a token set to surface breaking changes.',
    domain: 'tokens.szl.internal',
    params: [
      { name: 'set_id', type: 'string', required: true, description: 'Token set ID' },
      { name: 'from_version', type: 'string', required: true, description: 'Base version' },
      { name: 'to_version', type: 'string', required: true, description: 'Target version' },
    ],
    mockResponse: () => ({
      added: ['--gi-bg-raised', '--gi-confidence-contradiction'],
      removed: [],
      changed: { '--gi-text-muted': { from: '#6b7c94', to: '#7c8ea4' } },
      breaking: false,
      summary: '2 tokens added, 1 token updated (non-breaking).',
    }),
  },
];

const ADSAGENT_TOOLS: DemoTool[] = [
  {
    id: 'marketing_audit',
    protocol: 'MCP',
    adapter: 'AdsAgent',
    name: 'marketing.audit',
    description: 'Run a 250+ check paid-ads audit via the claude-ads skill pack. Returns findings grouped by severity with recommended fixes and evidence snippets.',
    domain: 'marketing.audit',
    params: [
      { name: 'creative', type: 'string', required: true, description: 'Ad creative copy, campaign JSON export, or URL to audit (max 8000 chars)' },
      { name: 'platform', type: 'string', description: '"google_ads" | "meta" | "linkedin" | "tiktok" | "generic"' },
      { name: 'context', type: 'string', description: 'Optional campaign context or brief to improve finding relevance (max 2000 chars)' },
    ],
    mockResponse: (args) => ({
      audit_id: 'aud_' + Math.random().toString(36).slice(2, 10),
      platform: (args.platform as string) || 'generic',
      total_checks: 254,
      checks_run: 254,
      summary: { critical: 3, warning: 11, info: 7, passed: 233 },
      findings: [
        { check_id: 'CTA-001', severity: 'critical', category: 'CTA Effectiveness', issue: 'Primary CTA "Learn More" is generic — click-through rate typically 40% below action-specific alternatives.', recommendation: 'Replace with outcome-specific CTA such as "Get Your Free Audit" or "Start Saving Today".', evidence: (args.creative as string)?.slice(0, 80) || 'Ad creative excerpt' },
        { check_id: 'EMO-003', severity: 'critical', category: 'Emotional Resonance', issue: 'No loss-aversion framing detected. Prospect motivation research shows loss framing outperforms gain framing by 2.1x in B2B.', recommendation: 'Add a consequence statement: "Stop losing 23% of your ad budget to unoptimized creative."', evidence: 'No loss-framing language detected in copy.' },
        { check_id: 'BRD-007', severity: 'critical', category: 'Brand Alignment', issue: 'Tone score: 0.34 (threshold: 0.65). Copy reads formal/corporate; brand voice guidelines require conversational-expert.', recommendation: 'Rewrite using second-person active voice with concrete specifics.', evidence: 'Flagged sentences: "Our solutions provide comprehensive value…"' },
        { check_id: 'FMT-012', severity: 'warning', category: 'Platform Format', issue: 'Headline length 47 chars exceeds Google Ads recommended 30-char limit for mobile display.', recommendation: 'Shorten to ≤30 chars or split into responsive search ad variants.', evidence: 'Headline: "Comprehensive Marketing Solutions for Growing Teams"' },
        { check_id: 'SOC-002', severity: 'warning', category: 'Social Proof', issue: 'No social proof elements (testimonials, stats, case study references) in primary copy.', recommendation: 'Add a credibility stat: "Trusted by 500+ marketing teams" or a named client win.', evidence: 'No social proof detected in current creative.' },
      ],
      skill_pack: 'AgriciDaniel/claude-ads@e2a4b8c',
      audit_trace: 'trace_' + Math.random().toString(36).slice(2, 10),
      duration_ms: Math.floor(820 + Math.random() * 480),
    }),
  },
  {
    id: 'seo_audit',
    protocol: 'MCP',
    adapter: 'Toprank',
    name: 'seo.audit',
    description: 'Run a Toprank-style SEO audit: keyword gaps, SERP features, backlink scoring, and AI on-page recommendations. Returns structured findings with impact estimates.',
    domain: 'seo.audit',
    params: [
      { name: 'url', type: 'string', required: true, description: 'URL of the page to audit (must be a valid URL)' },
      { name: 'keywords', type: 'string[]', description: 'Primary keywords to evaluate against (max 10, each max 200 chars)' },
    ],
    mockResponse: (args) => ({
      audit_id: 'seo_' + Math.random().toString(36).slice(2, 10),
      url: (args.url as string) || 'https://example.com',
      overall_score: 61,
      sections: {
        on_page: { score: 58, findings: [
          { issue: 'Title tag 74 chars — truncated in SERP at 60 chars', severity: 'warning', fix: 'Shorten to ≤60 chars with primary keyword near the front' },
          { issue: 'H1 missing primary keyword "marketing consulting"', severity: 'critical', fix: 'Include exact-match keyword in H1 within first 5 words' },
          { issue: 'Meta description 210 chars — exceeds 155-char SERP display limit', severity: 'warning', fix: 'Trim to ≤155 chars; front-load the value proposition' },
        ]},
        keyword_coverage: { score: 52, top_gaps: [
          { keyword: 'b2b marketing consultant', volume: 2400, difficulty: 42, current_rank: null, opportunity: 'high' },
          { keyword: 'fractional cmo services', volume: 1800, difficulty: 38, current_rank: 14, opportunity: 'high' },
          { keyword: 'marketing strategy agency', volume: 4100, difficulty: 67, current_rank: null, opportunity: 'medium' },
        ]},
        backlinks: { score: 71, domain_authority: 34, referring_domains: 128, top_anchors: ['marketing consulting', 'brand strategy', 'carlota jo'] },
        serp_features: { score: 44, opportunities: ['featured_snippet', 'people_also_ask', 'local_pack'] },
        core_web_vitals: { score: 82, lcp_ms: 1840, fid_ms: 12, cls: 0.04, status: 'good' },
      },
      recommendations: [
        { priority: 1, impact: 'high', action: 'Add primary keyword to H1 and first 100 words of body copy' },
        { priority: 2, impact: 'high', action: 'Target "fractional cmo services" with a dedicated landing page — currently ranking 14, easily top-5 with on-page optimization' },
        { priority: 3, impact: 'medium', action: 'Add FAQ schema targeting 3 People Also Ask opportunities detected' },
      ],
      skill_pack: 'nowork-studio/toprank@f1d3a9e',
      audit_trace: 'trace_' + Math.random().toString(36).slice(2, 10),
      duration_ms: Math.floor(1100 + Math.random() * 600),
    }),
  },
];

const FINCEPT_TOOLS: DemoTool[] = [
  {
    id: 'finance_terminal',
    protocol: 'MCP',
    adapter: 'Fincept Terminal',
    name: 'finance.terminal',
    description: 'Bloomberg-style financial data terminal (AGPL-isolated external service). Returns quotes, fundamentals, earnings, macro indicators, and analyst ratings for a ticker or entity.',
    domain: 'finance.terminal',
    params: [
      { name: 'entity', type: 'string', required: true, description: 'Equity ticker, ISIN, company name, or portfolio entity name (max 500 chars)' },
      { name: 'include_filings', type: 'boolean', description: 'Include SEC/regulatory filing summaries (default: true)' },
      { name: 'include_ownership', type: 'boolean', description: 'Include institutional ownership breakdown (default: true)' },
    ],
    mockResponse: (args) => {
      const ticker = ((args.entity as string) || 'AAPL').toUpperCase();
      const prices: Record<string, { price: number; change: number; pct: number }> = {
        AAPL: { price: 189.42, change: 2.14, pct: 1.14 },
        GOOGL: { price: 167.88, change: -1.23, pct: -0.73 },
        MSFT: { price: 415.60, change: 3.87, pct: 0.94 },
        NVDA: { price: 875.39, change: 18.42, pct: 2.15 },
        DEFAULT: { price: 142.50, change: 0.87, pct: 0.61 },
      };
      const q = prices[ticker] ?? prices.DEFAULT;
      return {
        ticker,
        source: 'Fincept Terminal',
        integration_mode: 'external-service',
        license_boundary: 'AGPL-3.0 — proxied via MCP, never bundled',
        quote: { price: q.price, change_1d: q.change, change_pct_1d: q.pct, open: q.price - q.change * 0.4, high: q.price + 0.8, low: q.price - 1.2, volume: 42_813_000, market_cap_bn: +(q.price * 15.6).toFixed(1), as_of: new Date().toISOString() },
        fundamentals: { pe_ratio: 28.4, forward_pe: 24.1, ps_ratio: 7.2, revenue_ttm_bn: 394.3, gross_margin_pct: 44.1, ebitda_margin_pct: 32.8, debt_to_equity: 0.18, roe_pct: 21.4, beta: 1.12 },
        earnings: { last_eps_actual: 2.18, last_eps_estimate: 2.10, surprise_pct: 3.8, next_report_date: '2026-07-28', revenue_guidance_bn: 102.5 },
        analyst_ratings: { buy: 31, hold: 11, sell: 2, consensus: 'Overweight', avg_target: 212.50, upside_pct: 12.2 },
        macro_context: { sector: 'Technology', industry: 'Consumer Electronics', beta_sector: 0.94, correlation_sp500_90d: 0.87 },
        deltas: { today: q.pct, week: +3.8, mtd: +6.2 },
        audit_trace: 'trace_' + Math.random().toString(36).slice(2, 10),
        service_health: 'healthy',
        duration_ms: Math.floor(380 + Math.random() * 280),
      };
    },
  },
];

const HYPERFRAMES_TOOLS: DemoTool[] = [
  {
    id: 'hf_video_render',
    protocol: 'MCP',
    adapter: 'HyperFrames',
    name: 'video.render',
    description: 'Compose HTML scenes into a rendered MP4 via HyperFrames. Returns a render job ID tracked in the queue.',
    domain: 'video.render',
    params: [
      { name: 'composition', type: 'string (HTML)', required: true, description: 'HTML composition markup defining the video frames' },
      { name: 'duration', type: 'number', required: true, description: 'Total video duration in seconds (max 120)' },
      { name: 'voiceover', type: 'string', description: 'Optional voiceover script for TTS synthesis' },
      { name: 'assets', type: 'object[]', description: 'Asset manifest: [{ url, type, label }]' },
      { name: 'seed', type: 'string', description: 'Deterministic render seed — same seed + HTML → same output hash' },
    ],
    mockResponse: (args) => {
      const jobId = 'hvj_' + Math.random().toString(36).slice(2, 10);
      return {
        job_id: jobId,
        status: 'queued',
        duration_s: (args.duration as number) || 30,
        estimated_render_ms: ((args.duration as number) || 30) * 1200,
        poll_url: `/nexus/bridge/video-render/${jobId}`,
        audit_trace: 'trace_' + Math.random().toString(36).slice(2, 10),
      };
    },
  },
  {
    id: 'hf_video_status',
    protocol: 'MCP',
    adapter: 'HyperFrames',
    name: 'video.status',
    description: 'Poll a render job by ID. Returns status, progress, thumbnail URL, and MP4 URL when complete.',
    domain: 'video.render',
    params: [
      { name: 'job_id', type: 'string', required: true, description: 'Render job ID returned by video.render' },
    ],
    mockResponse: (args) => {
      const jobId = (args.job_id as string) || 'hvj_demo';
      const statuses = ['rendering', 'done'] as const;
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      return {
        job_id: jobId,
        status,
        progress_pct: status === 'done' ? 100 : Math.floor(40 + Math.random() * 55),
        thumbnail_url: status === 'done' ? `https://render.hyperframes.internal/thumb/${jobId}.jpg` : null,
        mp4_url: status === 'done' ? `https://render.hyperframes.internal/output/${jobId}.mp4` : null,
        file_size_mb: status === 'done' ? Number((2.4 + Math.random() * 8).toFixed(1)) : null,
        duration_s: 30,
        completed_at: status === 'done' ? new Date().toISOString() : null,
      };
    },
  },
  {
    id: 'hf_video_rerun',
    protocol: 'MCP',
    adapter: 'HyperFrames',
    name: 'video.rerun',
    description: 'Re-enqueue a completed or failed render job using the original composition + seed.',
    domain: 'video.render',
    params: [
      { name: 'job_id', type: 'string', required: true, description: 'Job ID to reproduce' },
    ],
    mockResponse: (args) => ({
      original_job_id: (args.job_id as string) || 'hvj_original',
      new_job_id: 'hvj_' + Math.random().toString(36).slice(2, 10),
      status: 'queued',
      reproducible: true,
      note: 'Same composition + seed re-submitted. Output hash should match original when renderer is deterministic.',
    }),
  },
];

const EXISTING_MCP_TOOLS: DemoTool[] = [
  {
    id: 'mcp_echo',
    protocol: 'MCP',
    adapter: 'Core',
    name: 'mcp_echo',
    description: 'Echo back the input — loopback test for MCP connectivity.',
    domain: 'nexus.internal',
    params: [{ name: 'message', type: 'string', required: true, description: 'Message to echo' }],
    mockResponse: (args) => ({ echo: args.message || 'pong', ts: new Date().toISOString() }),
  },
  {
    id: 'mcp_get_context',
    protocol: 'MCP',
    adapter: 'Core',
    name: 'mcp_get_context',
    description: 'Retrieve current agent context window (model, memory items, active skills).',
    domain: 'nexus.internal',
    params: [],
    mockResponse: () => ({
      model: 'claude-3-5-sonnet-20241022',
      memory_items: 3241,
      active_skills: 84,
      context_tokens: 12847,
    }),
  },
];

const EXISTING_A2A_TOOLS: DemoTool[] = [
  {
    id: 'a2a_ping',
    protocol: 'A2A',
    adapter: 'Core',
    name: 'a2a_ping',
    description: 'Ping a peer agent to verify A2A connectivity.',
    domain: 'nexus.internal',
    params: [
      { name: 'agent_id', type: 'string', required: true, description: 'Target agent slug' },
    ],
    mockResponse: (args) => ({
      status: 'pong',
      agent_id: args.agent_id || 'aegis',
      latency_ms: 12,
    }),
  },
];

const EXISTING_ACP_TOOLS: DemoTool[] = [
  {
    id: 'acp_list_agents',
    protocol: 'ACP',
    adapter: 'Core',
    name: 'acp_list_agents',
    description: 'Enumerate registered enterprise agents on the ACP fabric.',
    domain: 'nexus.internal',
    params: [],
    mockResponse: () => ({
      agents: [
        { id: 'aegis', name: 'PARAGON Intel Agent', status: 'online', version: '1.4.2' },
        { id: 'vessels', name: 'SEXTANT Route Agent', status: 'online', version: '2.1.0' },
        { id: 'terra', name: 'DOMAINE Distress Agent', status: 'degraded', version: '1.8.5' },
        { id: 'pulse', name: 'Pulse Briefing Agent', status: 'online', version: '3.0.1' },
      ],
    }),
  },
];

const EXISTING_ANP_TOOLS: DemoTool[] = [
  {
    id: 'anp_discover',
    protocol: 'ANP',
    adapter: 'Core',
    name: 'anp_discover',
    description: 'Broadcast agent discovery signal on the ANP mesh.',
    domain: 'nexus.internal',
    params: [{ name: 'capability', type: 'string', description: 'Optional capability filter' }],
    mockResponse: (args) => ({
      discovered: [
        { id: 'nexus-praxis', capability: 'orchestration', endpoint: 'anp://nexus/praxis' },
        { id: 'szl-guardian', capability: 'governance', endpoint: 'anp://szl/guardian' },
      ],
      filter: args.capability || null,
      ts: new Date().toISOString(),
    }),
  },
];

const ALL_TOOLS: DemoTool[] = [
  ...EXISTING_MCP_TOOLS,
  ...ADSAGENT_TOOLS,
  ...FINCEPT_TOOLS,
  ...HYPERFRAMES_TOOLS,
  ...FIGMA_TOOLS,
  ...CAMOFOX_TOOLS,
  ...EXISTING_A2A_TOOLS,
  ...GITHUB_TOOLS,
  ...EXISTING_ACP_TOOLS,
  ...LINEAR_TOOLS,
  ...EXISTING_ANP_TOOLS,
  ...TOKEN_CDN_TOOLS,
];

const PROTOCOLS = ['MCP', 'A2A', 'ACP', 'ANP'] as const;

const ADAPTER_META: Record<string, { color: string; isDemo: boolean }> = {
  'Core': { color: '#7c8ea4', isDemo: false },
  'AdsAgent': { color: '#f59e0b', isDemo: true },
  'Toprank': { color: '#5baa8a', isDemo: true },
  'Fincept Terminal': { color: '#4d8fcc', isDemo: true },
  'HyperFrames': { color: '#fb923c', isDemo: true },
  'Figma': { color: '#a259ff', isDemo: true },
  'GitHub': { color: '#e8f0fe', isDemo: true },
  'Linear': { color: '#5e6ad2', isDemo: true },
  'Design-Token CDN': { color: '#22d3ee', isDemo: true },
  Camofox: { color: '#f472b6', isDemo: true },
};

const PROTOCOL_META: Record<string, { color: string; description: string; badge: string }> = {
  MCP: {
    color: '#4d8fcc',
    description: 'Model Context Protocol — Anthropic standard for tool calling',
    badge: 'Live',
  },
  A2A: {
    color: '#9b7cc8',
    description: 'Agent-to-Agent protocol — Google standard for agent interop',
    badge: 'Loopback',
  },
  ACP: {
    color: '#5baa8a',
    description: 'Agent Communication Protocol — IBM standard for enterprise agents',
    badge: 'Loopback',
  },
  ANP: {
    color: '#c9a85c',
    description: 'Agent Network Protocol — decentralized agent discovery',
    badge: 'Loopback',
  },
};

interface InvokeResult {
  status: 'success' | 'error';
  output: unknown;
  durationMs: number;
  traceId: string;
}

function formatRelative(iso?: string): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return '';
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  return `${hr}h ago`;
}

export default function Bridge() {
  const [protocolFilter, setProtocolFilter] = useState<string>('all');
  const [adapterFilter, setAdapterFilter] = useState<string>('all');
  const [calling, setCalling] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, InvokeResult>>({});
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [callArgs, setCallArgs] = useState<Record<string, string>>({});

  const handleCall = useCallback(
    async (tool: DemoTool) => {
      let args: Record<string, unknown> = {};
      try {
        const raw = callArgs[tool.id];
        if (raw && raw !== '{}') args = JSON.parse(raw);
      } catch {
        return;
      }
      setCalling(tool.id);
      await new Promise((r) => setTimeout(r, 320 + Math.random() * 480));
      const output = tool.mockResponse(args);
      setResults((prev) => ({
        ...prev,
        [tool.id]: {
          status: 'success',
          output,
          durationMs: Math.floor(320 + Math.random() * 480),
          traceId: 'trace_' + Math.random().toString(36).slice(2, 10),
        },
      }));
      setCalling(null);
    },
    [callArgs],
  );

  const adapters = ['all', ...Array.from(new Set(ALL_TOOLS.map((t) => t.adapter)))];
  const filtered = ALL_TOOLS.filter(
    (t) =>
      (protocolFilter === 'all' || t.protocol === protocolFilter) &&
      (adapterFilter === 'all' || t.adapter === adapterFilter),
  );

  const groupedByProtocol = PROTOCOLS.map((proto) => ({
    proto,
    tools: filtered.filter((t) => t.protocol === proto),
  })).filter(({ tools }) => tools.length > 0);

  const totalDemo = ALL_TOOLS.filter((t) => ADAPTER_META[t.adapter]?.isDemo).length;

  return (
    <div className="min-h-full bg-praxis-bg p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Network className="w-5 h-5 text-praxis-green" />
          <div>
            <h1 className="text-lg font-semibold">Universal Protocol Bridge</h1>
            <p className="text-xs text-muted-foreground">
              MCP · A2A · ACP · ANP · AdsAgent · Toprank · Fincept Terminal · HyperFrames · Figma · GitHub · Linear · Camofox · Design-Token CDN · {totalDemo} demo adapters
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          {PROTOCOLS.map((proto) => {
            const meta = PROTOCOL_META[proto];
            const count = ALL_TOOLS.filter((t) => t.protocol === proto).length;
            return (
              <button
                key={proto}
                onClick={() => setProtocolFilter(protocolFilter === proto ? 'all' : proto)}
                className="rounded-lg border p-3 text-left transition-all"
                style={{
                  borderColor: protocolFilter === proto ? meta.color : 'var(--gi-border-subtle)',
                  background:
                    protocolFilter === proto
                      ? `linear-gradient(135deg, ${meta.color}08 0%, transparent 100%)`
                      : 'var(--gi-bg-surface)',
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold" style={{ color: meta.color }}>
                    {proto}
                  </span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded"
                    style={{ color: meta.color, backgroundColor: `${meta.color}15` }}
                  >
                    {meta.badge}
                  </span>
                </div>
                <div className="text-[10px] text-muted-foreground/60 leading-snug mb-2">
                  {meta.description}
                </div>
                <div className="text-[10px] font-mono" style={{ color: meta.color }}>
                  {count} tools
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {adapters.map((a) => (
            <button
              key={a}
              onClick={() => setAdapterFilter(a)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-mono transition-colors ${
                adapterFilter === a
                  ? 'border-praxis-cyan/40 bg-praxis-cyan/10 text-praxis-cyan'
                  : 'border-praxis bg-praxis-bg text-muted-foreground/60 hover:text-foreground'
              }`}
            >
              {a === 'HyperFrames' && <Film className="w-3 h-3" />}
              {a === 'Figma' && <Figma className="w-3 h-3" />}
              {a === 'GitHub' && <Github className="w-3 h-3" />}
              {a === 'Linear' && <Zap className="w-3 h-3" />}
              {a === 'Design-Token CDN' && <Cpu className="w-3 h-3" />}
              {a === 'Camofox' && <EyeOff className="w-3 h-3" />}
              {a}
              {a !== 'all' && ADAPTER_META[a]?.isDemo && (
                <span className="text-[8px] px-1 py-0.5 rounded bg-praxis-amber/10 text-praxis-amber border border-praxis-amber/20">
                  DEMO
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="space-y-5">
          {groupedByProtocol.map(({ proto, tools: protoTools }) => {
            const meta = PROTOCOL_META[proto];
            return (
              <div key={proto}>
                <h2
                  className="text-xs font-mono uppercase tracking-widest mb-3 flex items-center gap-2"
                  style={{ color: meta.color }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  {proto} — {protoTools.length} tools
                </h2>
                <div className="space-y-2">
                  {protoTools.map((tool) => (
                    <ToolCard
                      key={tool.id}
                      tool={tool}
                      color={meta.color}
                      onCall={() => handleCall(tool)}
                      calling={calling === tool.id}
                      result={results[tool.id]}
                      expanded={expandedTool === tool.id}
                      onExpand={() => setExpandedTool((e) => (e === tool.id ? null : tool.id))}
                      args={callArgs[tool.id] ?? '{}'}
                      onArgsChange={(v) => setCallArgs((prev) => ({ ...prev, [tool.id]: v }))}
                    />
                  ))}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground/40">
              <Network className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm">No tools match the current filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ToolCard({
  tool,
  color,
  onCall,
  calling,
  result,
  expanded,
  onExpand,
  args,
  onArgsChange,
}: {
  tool: DemoTool;
  color: string;
  onCall: () => void;
  calling: boolean;
  result?: InvokeResult;
  expanded: boolean;
  onExpand: () => void;
  args: string;
  onArgsChange: (v: string) => void;
}) {
  const adapterMeta = ADAPTER_META[tool.adapter];
  const isDemo = adapterMeta?.isDemo;

  return (
    <div
      className="rounded-lg border overflow-hidden bg-praxis-surface transition-all"
      style={{ borderColor: expanded ? `${color}30` : 'var(--gi-border-subtle)' }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={onExpand} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="text-sm font-semibold font-mono">{tool.name}</span>
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={{ color, backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
              >
                {tool.protocol}
              </span>
              {isDemo && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1 text-praxis-amber bg-praxis-amber/10 border border-praxis-amber/30">
                  <Sparkles className="w-2.5 h-2.5" />
                  {tool.adapter} · DEMO
                </span>
              )}
              <span className="text-[9px] text-muted-foreground/40 font-mono">{tool.domain}</span>
            </div>
            <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
          </div>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          {result &&
            (result.status === 'success' ? (
              <CheckCircle className="w-3.5 h-3.5 text-praxis-green" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-praxis-red" />
            ))}
          <button
            onClick={onCall}
            disabled={calling}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
            style={{ color, backgroundColor: `${color}10`, border: `1px solid ${color}30` }}
          >
            {calling ? <Loader className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            Call
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-praxis pt-3 space-y-3">
          {tool.params.length > 0 && (
            <div>
              <label className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-1.5 block">
                Parameters
              </label>
              <div className="bg-praxis-bg rounded-lg p-3 space-y-1">
                {tool.params.map((p) => (
                  <div key={p.name} className="flex items-start gap-2 text-[10px] font-mono">
                    <span className="text-praxis-cyan shrink-0">{p.name}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="text-muted-foreground/60">{p.type}</span>
                    {p.required && <span className="text-praxis-amber/70 shrink-0">required</span>}
                    <span className="text-muted-foreground/40 ml-1">{p.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-1 block">
              Arguments (JSON)
            </label>
            <textarea
              value={args}
              onChange={(e) => onArgsChange(e.target.value)}
              rows={3}
              className="w-full bg-praxis-bg border border-praxis rounded-lg px-3 py-2 text-xs font-mono resize-none focus:outline-none text-foreground"
              placeholder="{}"
            />
          </div>
          {result && (
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <label className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">
                  Response
                </label>
                <span className="text-[9px] font-mono text-muted-foreground/40">
                  {result.durationMs}ms · {result.traceId}
                </span>
                {isDemo && (
                  <span className="text-[9px] font-mono text-praxis-amber/60 ml-auto">
                    scripted / loopback
                  </span>
                )}
              </div>
              <div className="bg-praxis-bg rounded-lg p-3 text-xs font-mono text-muted-foreground overflow-auto max-h-40">
                {JSON.stringify(result.output, null, 2)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
