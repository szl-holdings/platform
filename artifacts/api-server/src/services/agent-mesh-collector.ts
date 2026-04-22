import {
  agentMeshContainmentRulesTable,
  agentMeshDriftSnapshotsTable,
  agentMeshEdgesTable,
  agentMeshExposuresTable,
  agentMeshMcpServersTable,
  agentMeshResilienceIndexTable,
  agentMeshRuntimesTable,
  agentMeshSecretsTable,
  auditEventsTable,
  db,
} from '@szl-holdings/db';
import { serverTelemetry } from '@szl-holdings/observability';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import { desc, eq, sql } from 'drizzle-orm';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { logger } from '../lib/logger';

export type TrustState = 'trusted' | 'unverified' | 'quarantined';

interface RuntimeRow {
  id: string;
  name: string;
  version: string;
  sourceRegistry: string;
  trustState: TrustState;
  configFiles: string[];
  activeAgentIds: string[];
  lastSeen: string;
}

interface McpRow {
  id: string;
  name: string;
  packageRef: string;
  version: string;
  pinned: boolean;
  sourceRegistry: string;
  trustState: TrustState;
  runtimeIds: string[];
  allowedEgressDomains: string[];
  detectedEgressDomains: string[];
  lastSeen: string;
}

interface SecretRow {
  id: string;
  label: string;
  format: 'github-pat' | 'api-key' | 'oauth-token' | 'env-var';
  foundInFile: string;
  entropy: number;
  reachableByAgentIds: string[];
  reachableByMcpIds: string[];
  lastDetectedAt: string;
}

interface EdgeRow {
  id: string;
  agentId: string;
  mcpServerId: string;
  tools: string[];
  dataReadPaths: string[];
  detectedAt: string;
}

interface ExposureRow {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  affectedAgentIds: string[];
  affectedSecretIds: string[];
  affectedMcpIds: string[];
  explanation: string;
  owaspCategory: string;
  owaspRef: string;
  cveRefs: string[];
  fixType: string;
  fixLabel: string;
  proofHash: string;
  status: 'open' | 'fix-pending' | 'resolved';
  detectedAt: string;
}

interface ResilienceIndexRow {
  overall: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  secretHygiene: number;
  permissionSurface: number;
  supplyChain: number;
  egressContainment: number;
  scheduleHygiene: number;
  instructionTamperingRisk: number;
  crossAgentBlastRadius: number;
  openExposures: number;
  pendingApprovals: number;
  topExposure: string | null;
  computedAt: string;
}

export type EnforcementMode = 'log-only' | 'block' | 'quarantine';

interface ContainmentRuleRow {
  id: string;
  name: string;
  agentClass: string;
  allowedMcpServers: string[];
  allowedTools: string[];
  allowedReadPaths: string[];
  allowedEgressDomains: string[];
  tier: 'critical' | 'elevated' | 'standard';
  enforcementMode: EnforcementMode;
  violationCount: number;
  lastEvaluatedAt: string;
}

interface DriftSnapshotRow {
  id: string;
  configFile: string;
  changedAt: string;
  changedBy: string;
  policyApproved: boolean;
  approvedBy: string | null;
  rolledBackBy: string | null;
  rolledBackAt: string | null;
  diff: { removed: string[]; added: string[] };
  linkedExposureIds: string[];
}

export interface ScanResult {
  scannedFiles: string[];
  runtimes: RuntimeRow[];
  mcpServers: McpRow[];
  secrets: SecretRow[];
  edges: EdgeRow[];
  exposures: ExposureRow[];
  containmentRules: ContainmentRuleRow[];
  driftSnapshots: DriftSnapshotRow[];
  resilienceIndex: ResilienceIndexRow;
  scannedAt: string;
}

// ---------- Path discovery ----------

const ENV_PATHS_KEY = 'AGENT_MESH_CONFIG_PATHS';

function defaultConfigCandidates(): string[] {
  const home = os.homedir();
  const cwd = process.cwd();
  return [
    // Claude Desktop
    path.join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
    path.join(home, '.config', 'Claude', 'claude_desktop_config.json'),
    path.join(home, 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json'),
    // Cursor
    path.join(home, '.cursor', 'mcp.json'),
    // Claude Code
    path.join(home, '.claude', 'settings.json'),
    path.join(home, '.claude', 'CLAUDE.md'),
    path.join(home, 'CLAUDE.md'),
    path.join(cwd, 'CLAUDE.md'),
    // Codex
    path.join(home, '.codex', 'config.json'),
    // Generic mcp.json fallbacks
    path.join(cwd, 'mcp.json'),
    path.join(cwd, '.mcp.json'),
  ];
}

export function resolveScanPaths(extra: string[] = []): string[] {
  const env = (process.env[ENV_PATHS_KEY] ?? '')
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const all = [...env, ...extra, ...defaultConfigCandidates()];
  return Array.from(new Set(all.map((p) => path.resolve(p))));
}

// ---------- Parsing helpers ----------

const SECRET_PATTERNS: { format: SecretRow['format']; rx: RegExp }[] = [
  { format: 'github-pat', rx: /^(ghp|ghs|gho|ghr|github_pat)_[A-Za-z0-9_]{20,}$/ },
  { format: 'oauth-token', rx: /^(xox[bopa]|sk-)[A-Za-z0-9-_]{16,}$/ },
  { format: 'api-key', rx: /^[A-Za-z0-9_-]{24,}$/ },
];

function shannonEntropy(s: string): number {
  if (!s) return 0;
  const map = new Map<string, number>();
  for (const ch of s) map.set(ch, (map.get(ch) ?? 0) + 1);
  let h = 0;
  for (const c of map.values()) {
    const p = c / s.length;
    h -= p * Math.log2(p);
  }
  return Number(h.toFixed(2));
}

function classifySecret(label: string, value: string): SecretRow['format'] | null {
  const upper = label.toUpperCase();
  if (upper.includes('TOKEN') && /^(ghp|ghs|gho|ghr|github_pat)_/.test(value)) return 'github-pat';
  for (const { format, rx } of SECRET_PATTERNS) {
    if (rx.test(value)) return format;
  }
  if (/(KEY|TOKEN|SECRET|PASSWORD|PAT)$/i.test(label) && value.length >= 16) return 'env-var';
  return null;
}

function safeParseJson(raw: string): Record<string, unknown> | null {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function trustForRegistry(registry: string, packageRef: string): TrustState {
  if (registry === 'anthropic.com' || registry === 'cursor.sh') return 'trusted';
  if (packageRef.startsWith('@modelcontextprotocol/')) return 'trusted';
  if (/^mcp-(ext|unknown|test)/.test(packageRef)) return 'quarantined';
  return 'unverified';
}

function inferRegistryFromPackage(pkg: string): string {
  if (pkg.startsWith('@modelcontextprotocol/') || pkg.startsWith('mcp-'))
    return 'registry.npmjs.org';
  return 'unknown';
}

function isPinnedArgs(args: string[] | undefined): boolean {
  if (!args) return false;
  return args.some((a) => /@\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/.test(a));
}

function gradeFor(overall: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (overall >= 90) return 'A';
  if (overall >= 75) return 'B';
  if (overall >= 60) return 'C';
  if (overall >= 40) return 'D';
  return 'F';
}

// ---------- Per-file collectors ----------

interface ParseContext {
  runtimes: Map<string, RuntimeRow>;
  mcpServers: Map<string, McpRow>;
  secrets: Map<string, SecretRow>;
  edges: EdgeRow[];
  exposures: ExposureRow[];
  scannedFiles: string[];
  // For each scanned config file, the set of canonical "MCP server" lines it
  // declares. Used to compute drift across scans (added/removed entries per
  // file) and to attribute drift back to the originating file.
  fileMcpLines: Map<string, Set<string>>;
  // For each scanned config file, additional canonical "permission" lines
  // (allow/deny entries from runtime permissions blocks). Drift in these
  // also yields a recorded snapshot.
  filePermissionLines: Map<string, Set<string>>;
  // Free-form per-runtime allow/deny derived from explicit `permissions`
  // blocks in the config. Keyed by runtime id.
  runtimePermissions: Map<string, { allow: Set<string>; deny: Set<string> }>;
}

function canonicalMcpLine(
  name: string,
  packageRef: string,
  version: string,
  env?: Record<string, string>,
): string {
  const envKeys = env ? Object.keys(env).sort().join(',') : '';
  return `${name}: ${packageRef}@${version}${envKeys ? ` [env: ${envKeys}]` : ''}`;
}

function recordFileMcp(ctx: ParseContext, file: string, line: string): void {
  let set = ctx.fileMcpLines.get(file);
  if (!set) {
    set = new Set();
    ctx.fileMcpLines.set(file, set);
  }
  set.add(line);
}

function recordFilePermission(ctx: ParseContext, file: string, line: string): void {
  let set = ctx.filePermissionLines.get(file);
  if (!set) {
    set = new Set();
    ctx.filePermissionLines.set(file, set);
  }
  set.add(line);
}

function ensureMcp(
  ctx: ParseContext,
  name: string,
  runtimeId: string,
  raw: { command?: string; args?: string[]; env?: Record<string, string> },
): McpRow {
  const id = `mcp-${name}`;
  let row = ctx.mcpServers.get(id);
  const args = raw.args ?? [];
  const packageRef =
    args.find((a) => a.startsWith('@') || a.startsWith('mcp-')) ?? args[args.length - 1] ?? name;
  const cleanRef = packageRef.replace(/@\d.*$/, '');
  const versionMatch = packageRef.match(/@(\d[\w.\-+]*)$/);
  const version = versionMatch ? versionMatch[1] : 'unpinned';
  const sourceRegistry = inferRegistryFromPackage(cleanRef);
  if (!row) {
    row = {
      id,
      name,
      packageRef: cleanRef,
      version,
      pinned: isPinnedArgs(args),
      sourceRegistry,
      trustState: trustForRegistry(sourceRegistry, cleanRef),
      runtimeIds: [],
      allowedEgressDomains: [],
      detectedEgressDomains: [],
      lastSeen: new Date().toISOString(),
    };
    ctx.mcpServers.set(id, row);
  }
  if (!row.runtimeIds.includes(runtimeId)) row.runtimeIds.push(runtimeId);
  // Track this server as part of the file currently being parsed (last entry
  // in scannedFiles). This is what powers per-file drift detection.
  const currentFile = ctx.scannedFiles[ctx.scannedFiles.length - 1];
  if (currentFile) {
    recordFileMcp(ctx, currentFile, canonicalMcpLine(name, cleanRef, version, raw.env));
  }
  if (raw.env) {
    for (const [envKey, envVal] of Object.entries(raw.env)) {
      // Detect domains in env (e.g. ALLOWED_HOSTS or BASE_URL)
      const domainMatch = String(envVal).match(/https?:\/\/([^/\s"]+)/g);
      if (domainMatch) {
        for (const m of domainMatch) {
          const host = m.replace(/^https?:\/\//, '');
          if (!row.allowedEgressDomains.includes(host)) row.allowedEgressDomains.push(host);
        }
      }
      // Secret extraction
      const fmt = classifySecret(envKey, String(envVal));
      if (fmt) {
        const secretId = `secret-${envKey.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        const existing = ctx.secrets.get(secretId);
        const reachableMcpIds = existing?.reachableByMcpIds ?? [];
        if (!reachableMcpIds.includes(id)) reachableMcpIds.push(id);
        ctx.secrets.set(secretId, {
          id: secretId,
          label: envKey,
          format: fmt,
          foundInFile: ctx.scannedFiles[ctx.scannedFiles.length - 1] ?? '',
          entropy: shannonEntropy(String(envVal)),
          reachableByAgentIds: existing?.reachableByAgentIds ?? [],
          reachableByMcpIds: reachableMcpIds,
          lastDetectedAt: new Date().toISOString(),
        });
      }
    }
  }
  return row;
}

function parseClaudeDesktopConfig(ctx: ParseContext, file: string, contents: string): void {
  const json = safeParseJson(contents);
  if (!json) return;
  const runtimeId = 'rt-claude-desktop';
  const agentId = 'agent-claude-main';
  const runtime: RuntimeRow = ctx.runtimes.get(runtimeId) ?? {
    id: runtimeId,
    name: 'Claude Desktop',
    version: String(json.version ?? '0.9.x'),
    sourceRegistry: 'anthropic.com',
    trustState: 'trusted',
    configFiles: [],
    activeAgentIds: [agentId],
    lastSeen: new Date().toISOString(),
  };
  if (!runtime.configFiles.includes(file)) runtime.configFiles.push(file);
  ctx.runtimes.set(runtimeId, runtime);

  extractPermissions(ctx, file, runtimeId, json.permissions);

  const servers =
    (json.mcpServers as Record<
      string,
      { command?: string; args?: string[]; env?: Record<string, string> }
    >) ?? {};
  for (const [name, srv] of Object.entries(servers)) {
    const mcp = ensureMcp(ctx, name, runtimeId, srv);
    ctx.edges.push({
      id: `edge-${agentId}-${mcp.id}`,
      agentId,
      mcpServerId: mcp.id,
      tools: [],
      dataReadPaths: [],
      detectedAt: new Date().toISOString(),
    });
    // Mark secrets reachable by this agent
    for (const sec of ctx.secrets.values()) {
      if (sec.reachableByMcpIds.includes(mcp.id) && !sec.reachableByAgentIds.includes(agentId)) {
        sec.reachableByAgentIds.push(agentId);
      }
    }
  }
}

function parseCursorMcp(ctx: ParseContext, file: string, contents: string): void {
  const json = safeParseJson(contents);
  if (!json) return;
  const runtimeId = 'rt-cursor';
  const agentId = 'agent-cursor-composer';
  const runtime: RuntimeRow = ctx.runtimes.get(runtimeId) ?? {
    id: runtimeId,
    name: 'Cursor',
    version: 'unknown',
    sourceRegistry: 'cursor.sh',
    trustState: 'trusted',
    configFiles: [],
    activeAgentIds: [agentId],
    lastSeen: new Date().toISOString(),
  };
  if (!runtime.configFiles.includes(file)) runtime.configFiles.push(file);
  ctx.runtimes.set(runtimeId, runtime);

  // Cursor stores per-server `disabled: true` flags; treat as deny entries.
  const cursorServers = (json.mcpServers as Record<string, { disabled?: boolean }>) ?? {};
  for (const [name, srv] of Object.entries(cursorServers)) {
    if (srv?.disabled) {
      const perms = ctx.runtimePermissions.get(runtimeId) ?? {
        allow: new Set<string>(),
        deny: new Set<string>(),
      };
      perms.deny.add(`mcp:${name}`);
      ctx.runtimePermissions.set(runtimeId, perms);
      recordFilePermission(ctx, file, `deny mcp:${name}`);
    }
  }

  const servers =
    (json.mcpServers as Record<
      string,
      { command?: string; args?: string[]; env?: Record<string, string> }
    >) ?? {};
  for (const [name, srv] of Object.entries(servers)) {
    const mcp = ensureMcp(ctx, name, runtimeId, srv);
    ctx.edges.push({
      id: `edge-${agentId}-${mcp.id}`,
      agentId,
      mcpServerId: mcp.id,
      tools: [],
      dataReadPaths: [],
      detectedAt: new Date().toISOString(),
    });
    for (const sec of ctx.secrets.values()) {
      if (sec.reachableByMcpIds.includes(mcp.id) && !sec.reachableByAgentIds.includes(agentId)) {
        sec.reachableByAgentIds.push(agentId);
      }
    }
  }
}

function extractPermissions(
  ctx: ParseContext,
  file: string,
  runtimeId: string,
  raw: unknown,
): void {
  if (!raw || typeof raw !== 'object') return;
  const obj = raw as { allow?: unknown; deny?: unknown };
  const perms = ctx.runtimePermissions.get(runtimeId) ?? {
    allow: new Set<string>(),
    deny: new Set<string>(),
  };
  if (Array.isArray(obj.allow)) {
    for (const item of obj.allow) {
      if (typeof item === 'string' && item.length > 0) {
        perms.allow.add(item);
        recordFilePermission(ctx, file, `allow ${item}`);
      }
    }
  }
  if (Array.isArray(obj.deny)) {
    for (const item of obj.deny) {
      if (typeof item === 'string' && item.length > 0) {
        perms.deny.add(item);
        recordFilePermission(ctx, file, `deny ${item}`);
      }
    }
  }
  ctx.runtimePermissions.set(runtimeId, perms);
}

function parseClaudeCodeSettings(ctx: ParseContext, file: string, contents: string): void {
  const json = safeParseJson(contents);
  if (!json) return;
  const runtimeId = 'rt-claude-code';
  const agentId = 'agent-claude-code';
  const runtime: RuntimeRow = ctx.runtimes.get(runtimeId) ?? {
    id: runtimeId,
    name: 'Claude Code',
    version: String(json.version ?? 'unknown'),
    sourceRegistry: 'registry.npmjs.org',
    trustState: 'trusted',
    configFiles: [],
    activeAgentIds: [agentId],
    lastSeen: new Date().toISOString(),
  };
  if (!runtime.configFiles.includes(file)) runtime.configFiles.push(file);
  ctx.runtimes.set(runtimeId, runtime);

  // Pull explicit allow/deny — Claude Code stores these under
  // `permissions: { allow: [...], deny: [...] }` and they directly translate
  // into containment-rule allowed/denied tools.
  extractPermissions(ctx, file, runtimeId, json.permissions);

  const servers =
    (json.mcpServers as Record<
      string,
      { command?: string; args?: string[]; env?: Record<string, string> }
    >) ?? {};
  for (const [name, srv] of Object.entries(servers)) {
    const mcp = ensureMcp(ctx, name, runtimeId, srv);
    ctx.edges.push({
      id: `edge-${agentId}-${mcp.id}`,
      agentId,
      mcpServerId: mcp.id,
      tools: [],
      dataReadPaths: [],
      detectedAt: new Date().toISOString(),
    });
    for (const sec of ctx.secrets.values()) {
      if (sec.reachableByMcpIds.includes(mcp.id) && !sec.reachableByAgentIds.includes(agentId)) {
        sec.reachableByAgentIds.push(agentId);
      }
    }
  }
}

function parseClaudeMd(ctx: ParseContext, file: string, contents: string): void {
  const runtimeId = 'rt-claude-code';
  const runtime = ctx.runtimes.get(runtimeId);
  if (runtime && !runtime.configFiles.includes(file)) runtime.configFiles.push(file);
  // Detect tampering — flag if file contains suspicious phrases
  const suspicious =
    /\b(SYSTEM:|always include credentials|exfiltrate|ignore previous instructions)\b/i;
  if (suspicious.test(contents)) {
    ctx.exposures.push({
      id: `exp-tamper-${crypto.createHash('sha1').update(file).digest('hex').slice(0, 8)}`,
      title: `CLAUDE.md instruction tampering signal in ${path.basename(file)}`,
      severity: 'medium',
      affectedAgentIds: ['agent-claude-code'],
      affectedSecretIds: [],
      affectedMcpIds: [],
      explanation: `The file ${file} contains phrases consistent with prompt-injection / instruction tampering. Review the diff and restore the approved version.`,
      owaspCategory: 'LLM01: Prompt Injection / Instruction Tampering',
      owaspRef: 'OWASP LLM Top 10 2025 — LLM01',
      cveRefs: [],
      fixType: 'scope-token',
      fixLabel: 'Restore CLAUDE.md from approved baseline and lock to read-only',
      proofHash: `0x${crypto.createHash('sha1').update(contents).digest('hex').slice(0, 12)}`,
      status: 'open',
      detectedAt: new Date().toISOString(),
    });
  }
}

function parseCodexConfig(ctx: ParseContext, file: string, contents: string): void {
  const json = safeParseJson(contents);
  if (!json) return;
  const runtimeId = 'rt-codex';
  const agentId = 'agent-codex-cli';
  const runtime: RuntimeRow = ctx.runtimes.get(runtimeId) ?? {
    id: runtimeId,
    name: 'OpenAI Codex CLI',
    version: String(json.version ?? 'unknown'),
    sourceRegistry: 'registry.npmjs.org',
    trustState: 'unverified',
    configFiles: [],
    activeAgentIds: [agentId],
    lastSeen: new Date().toISOString(),
  };
  if (!runtime.configFiles.includes(file)) runtime.configFiles.push(file);
  ctx.runtimes.set(runtimeId, runtime);

  extractPermissions(ctx, file, runtimeId, json.permissions);

  const servers =
    (json.mcpServers as Record<
      string,
      { command?: string; args?: string[]; env?: Record<string, string> }
    >) ?? {};
  for (const [name, srv] of Object.entries(servers)) {
    const mcp = ensureMcp(ctx, name, runtimeId, srv);
    ctx.edges.push({
      id: `edge-${agentId}-${mcp.id}`,
      agentId,
      mcpServerId: mcp.id,
      tools: [],
      dataReadPaths: [],
      detectedAt: new Date().toISOString(),
    });
    for (const sec of ctx.secrets.values()) {
      if (sec.reachableByMcpIds.includes(mcp.id) && !sec.reachableByAgentIds.includes(agentId)) {
        sec.reachableByAgentIds.push(agentId);
      }
    }
  }
}

// ---------- Containment rule derivation ----------

const RUNTIME_TO_AGENT_CLASS: Record<string, string> = {
  'rt-claude-desktop': 'claude-desktop',
  'rt-cursor': 'cursor',
  'rt-codex': 'codex-cli',
  'rt-claude-code': 'claude-code',
};

// Stable rule ids that align with the MCP gateway's seed rows so each runtime
// upserts into a single row instead of producing duplicates next to the
// gateway-managed defaults.
const RUNTIME_TO_RULE_ID: Record<string, string> = {
  'rt-claude-desktop': 'rule-claude-standard',
  'rt-cursor': 'rule-cursor-elevated',
  'rt-codex': 'rule-codex-restricted',
  'rt-claude-code': 'rule-claude-code',
};

const RUNTIME_TO_RULE_NAME: Record<string, string> = {
  'rt-claude-desktop': 'Claude Standard Policy',
  'rt-cursor': 'Cursor Elevated Policy',
  'rt-codex': 'Codex CLI Restricted Policy',
  'rt-claude-code': 'Claude Code Policy',
};

function tierForRuntime(
  runtimeId: string,
  mcps: McpRow[],
  hasUnverified: boolean,
  hasQuarantined: boolean,
): 'critical' | 'elevated' | 'standard' {
  if (hasQuarantined) return 'critical';
  if (runtimeId === 'rt-codex') return mcps.length > 0 ? 'elevated' : 'standard';
  if (hasUnverified) return 'elevated';
  return 'standard';
}

function enforcementForTier(tier: 'critical' | 'elevated' | 'standard'): EnforcementMode {
  if (tier === 'critical') return 'quarantine';
  if (tier === 'elevated') return 'block';
  return 'log-only';
}

function deriveContainmentRules(ctx: ParseContext, scannedAt: string): ContainmentRuleRow[] {
  const rules: ContainmentRuleRow[] = [];
  const allMcps = [...ctx.mcpServers.values()];

  for (const runtime of ctx.runtimes.values()) {
    const runtimeMcps = allMcps.filter((m) => m.runtimeIds.includes(runtime.id));
    const perms = ctx.runtimePermissions.get(runtime.id);

    // Split deny entries into MCP-server denies (stored as `mcp:<name>` by
    // both Cursor's `disabled: true` flag and explicit `permissions.deny`
    // arrays) and tool-level denies. MCP denies must exclude the
    // corresponding server from allowedMcpServers — and downstream from
    // its tools and egress domains — so the rule reflects what is
    // actually permitted at runtime.
    const deniedMcpNames = new Set<string>();
    const toolDenies = new Set<string>();
    if (perms) {
      for (const d of perms.deny) {
        const m = d.match(/^mcp:(.+)$/);
        const captured = m?.[1];
        if (captured) deniedMcpNames.add(captured.trim());
        else toolDenies.add(d);
      }
    }

    // Trust-based filtering: never list a quarantined server as allowed,
    // and drop any server explicitly denied via a runtime deny entry.
    const allowedMcpServers = runtimeMcps
      .filter((m) => m.trustState !== 'quarantined')
      .filter((m) => !deniedMcpNames.has(m.name))
      .map((m) => m.id);
    const allowedMcpServerSet = new Set(allowedMcpServers);

    // Tools allowed = union of edge tools for this runtime's agents,
    // intersected/extended by explicit permissions. Edges to a now-denied
    // MCP server should not contribute their tools to the allowlist.
    const runtimeAgentIds = new Set(runtime.activeAgentIds);
    const edgeTools = new Set<string>();
    const readPaths = new Set<string>();
    for (const edge of ctx.edges) {
      if (!runtimeAgentIds.has(edge.agentId)) continue;
      if (!allowedMcpServerSet.has(edge.mcpServerId)) continue;
      for (const t of edge.tools) edgeTools.add(t);
      for (const p of edge.dataReadPaths) readPaths.add(p);
    }
    if (perms) {
      for (const a of perms.allow) {
        // Permissions like "Bash(npm install)" / "Read(src/**)" — keep raw.
        edgeTools.add(a);
      }
      for (const tool of toolDenies) edgeTools.delete(tool);
    }

    // Allowed egress: union from servers that are both non-quarantined AND
    // present in the final allowed MCP set, so a denied server cannot leak
    // its egress domains into the rule.
    const egress = new Set<string>();
    for (const m of runtimeMcps) {
      if (!allowedMcpServerSet.has(m.id)) continue;
      for (const d of m.allowedEgressDomains) egress.add(d);
    }

    const hasUnverified = runtimeMcps.some((m) => m.trustState === 'unverified');
    const hasQuarantined = runtimeMcps.some((m) => m.trustState === 'quarantined');
    const tier = tierForRuntime(runtime.id, runtimeMcps, hasUnverified, hasQuarantined);

    // Violations: count exposures touching any of this runtime's agents
    // or any of this runtime's MCP servers.
    const runtimeMcpIds = new Set(runtimeMcps.map((m) => m.id));
    const violationCount = ctx.exposures.filter(
      (e) =>
        e.affectedAgentIds.some((a) => runtimeAgentIds.has(a)) ||
        e.affectedMcpIds.some((m) => runtimeMcpIds.has(m)),
    ).length;

    const agentClass = RUNTIME_TO_AGENT_CLASS[runtime.id] ?? runtime.id.replace(/^rt-/, '');
    rules.push({
      id: RUNTIME_TO_RULE_ID[runtime.id] ?? `rule-${runtime.id}`,
      name: RUNTIME_TO_RULE_NAME[runtime.id] ?? `${runtime.name} Policy`,
      agentClass,
      allowedMcpServers,
      allowedTools: [...edgeTools],
      allowedReadPaths: [...readPaths],
      allowedEgressDomains: [...egress],
      tier,
      enforcementMode: enforcementForTier(tier),
      violationCount,
      lastEvaluatedAt: scannedAt,
    });
  }

  return rules;
}

// ---------- Drift detection ----------

interface PreviousFileState {
  mcpLines: Map<string, Set<string>>;
  permissionLines: Map<string, Set<string>>;
}

async function loadPreviousFileState(orgId: number | null): Promise<PreviousFileState> {
  const out: PreviousFileState = { mcpLines: new Map(), permissionLines: new Map() };
  try {
    const [runtimes, mcps, drifts] = await Promise.all([
      db.execute(
        sql`SELECT id, config_files FROM agent_mesh_runtimes WHERE org_id IS NOT DISTINCT FROM ${orgId}`,
      ),
      db.execute(
        sql`SELECT id, name, package_ref, version, runtime_ids FROM agent_mesh_mcp_servers WHERE org_id IS NOT DISTINCT FROM ${orgId}`,
      ),
      // Reconstruct each file's last-known permission line set by replaying
      // its drift history (added - removed). Without this we cannot detect
      // permission-only edits between scans because the source-of-truth
      // tables don't store raw allow/deny lines per file.
      db.execute(sql`
        SELECT config_file, diff
        FROM agent_mesh_drift_snapshots
        WHERE org_id IS NOT DISTINCT FROM ${orgId}
        ORDER BY changed_at ASC
      `),
    ]);
    const runtimeFiles = new Map<string, string[]>();
    for (const r of runtimes.rows as Record<string, unknown>[]) {
      const id = String(r.id);
      const files = Array.isArray(r.config_files) ? (r.config_files as string[]) : [];
      // Only JSON config files participate in MCP-line drift; CLAUDE.md and
      // other markdown have no MCP server entries.
      runtimeFiles.set(
        id,
        files.filter((f) => !/\.md$/i.test(f)),
      );
    }
    for (const m of mcps.rows as Record<string, unknown>[]) {
      const name = String(m.name);
      const pkg = String(m.package_ref ?? name);
      const version = String(m.version ?? 'unpinned');
      const line = canonicalMcpLine(name, pkg, version);
      const runtimeIds = Array.isArray(m.runtime_ids) ? (m.runtime_ids as string[]) : [];
      for (const rid of runtimeIds) {
        const files = runtimeFiles.get(rid) ?? [];
        for (const f of files) {
          let set = out.mcpLines.get(f);
          if (!set) {
            set = new Set();
            out.mcpLines.set(f, set);
          }
          // Strip env-key suffix from current canonical lines for comparison —
          // previous state cannot reconstruct env keys without more storage.
          set.add(line);
        }
      }
    }
    // Replay drift history per file to recover the prior permission line set.
    for (const d of drifts.rows as Record<string, unknown>[]) {
      const file = String(d.config_file);
      const diff = (d.diff as { added?: string[]; removed?: string[] } | null) ?? {};
      let set = out.permissionLines.get(file);
      if (!set) {
        set = new Set();
        out.permissionLines.set(file, set);
      }
      for (const line of diff.added ?? []) {
        if (isPermissionLine(line)) set.add(line);
      }
      for (const line of diff.removed ?? []) {
        if (isPermissionLine(line)) set.delete(line);
      }
    }
  } catch (err) {
    logger.debug(
      { err },
      '[agent-mesh-collector] loadPreviousFileState failed (treating as first scan)',
    );
  }
  return out;
}

function isPermissionLine(line: string): boolean {
  return /^(allow |deny )/.test(line);
}

function stripEnvSuffix(line: string): string {
  return line.replace(/ \[env: [^\]]*\]$/, '');
}

// Resolve the operator who last edited a config file. Tries (in order):
//   1) `git log -1 --format=%an -- <file>` so version-controlled configs
//      surface the real author from repo blame.
//   2) The file owner from `fs.stat` — mapped to a username when it matches
//      the current process user, otherwise reported as `uid:<n>`.
// Falls back to "unknown" if nothing resolves. The cache is provided by the
// caller so it lives only for the duration of a single scan — long-lived
// collector processes must not reuse stale attribution across scans. We
// also do NOT cache "unknown" so a transient git/stat failure on one scan
// can recover on the next.
export type ChangedByCache = Map<string, string>;

export function resolveChangedBy(file: string, cache: ChangedByCache): string {
  const cached = cache.get(file);
  if (cached) return cached;
  let resolved = 'unknown';
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%an', '--', file], {
      cwd: path.dirname(file),
      encoding: 'utf-8',
      timeout: 1500,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (out) resolved = out;
  } catch {
    // not a git repo, git unavailable, or file untracked
  }
  if (resolved === 'unknown') {
    try {
      const stats = fs.statSync(file);
      const uid = stats.uid;
      const current = os.userInfo();
      if (current.uid === uid && current.username) {
        resolved = current.username;
      } else {
        resolved = `uid:${uid}`;
      }
    } catch {
      // leave as unknown
    }
  }
  if (resolved !== 'unknown') cache.set(file, resolved);
  return resolved;
}

function computeDriftSnapshots(
  ctx: ParseContext,
  prev: PreviousFileState,
  scannedAt: string,
): DriftSnapshotRow[] {
  // Per-scan cache — never reused across scans, so attribution stays fresh
  // when file ownership or the latest git author changes between runs.
  const changedByCache: ChangedByCache = new Map();
  const drifts: DriftSnapshotRow[] = [];
  const seenFiles = new Set<string>([
    ...ctx.fileMcpLines.keys(),
    ...ctx.filePermissionLines.keys(),
    ...prev.mcpLines.keys(),
    ...prev.permissionLines.keys(),
  ]);

  for (const file of seenFiles) {
    if (/\.md$/i.test(file)) continue; // markdown handled via tampering exposures
    const currentMcpRaw = ctx.fileMcpLines.get(file) ?? new Set<string>();
    const previousMcpRaw = prev.mcpLines.get(file) ?? new Set<string>();
    // Compare on env-stripped form so we don't false-positive on env-only churn.
    const currentMcp = new Set([...currentMcpRaw].map(stripEnvSuffix));
    const previousMcp = new Set([...previousMcpRaw].map(stripEnvSuffix));

    const currentPerms = ctx.filePermissionLines.get(file) ?? new Set<string>();
    const previousPerms = prev.permissionLines.get(file) ?? new Set<string>();

    // Combine MCP-line and permission-line diffs into a single per-file
    // drift entry — operators see one timeline row per changed file even
    // when the change spans both kinds of edits.
    const addedMcp = [...currentMcp].filter((l) => !previousMcp.has(l));
    const removedMcp = [...previousMcp].filter((l) => !currentMcp.has(l));
    const addedPerm = [...currentPerms].filter((l) => !previousPerms.has(l));
    const removedPerm = [...previousPerms].filter((l) => !currentPerms.has(l));
    const added = [...addedMcp, ...addedPerm].sort();
    const removed = [...removedMcp, ...removedPerm].sort();
    if (added.length === 0 && removed.length === 0) continue;
    const previousRaw = new Set([...previousMcpRaw, ...previousPerms]);

    // Link drift to any exposures whose affected MCPs match a name appearing
    // in the diff lines (mcpName always precedes the colon).
    const namesInDiff = new Set<string>();
    for (const line of [...added, ...removed]) {
      const colon = line.indexOf(':');
      if (colon > 0) namesInDiff.add(line.slice(0, colon).trim());
    }
    const linkedExposureIds: string[] = [];
    for (const exp of ctx.exposures) {
      const touches = exp.affectedMcpIds.some((id) => namesInDiff.has(id.replace(/^mcp-/, '')));
      if (touches) linkedExposureIds.push(exp.id);
    }

    const idHash = crypto
      .createHash('sha1')
      .update(`${file}|${scannedAt}`)
      .digest('hex')
      .slice(0, 12);
    const isFirstScan = previousRaw.size === 0 && removed.length === 0;
    drifts.push({
      id: `drift-${idHash}`,
      configFile: file,
      changedAt: scannedAt,
      changedBy: resolveChangedBy(file, changedByCache),
      // First-time discovery is treated as policy-approved (it's the baseline,
      // not an unauthorised change). Subsequent diffs are unapproved until an
      // operator approves them.
      policyApproved: isFirstScan,
      approvedBy: isFirstScan ? 'scan-baseline' : null,
      rolledBackBy: null,
      rolledBackAt: null,
      diff: { removed, added },
      linkedExposureIds,
    });
  }

  // Markdown-driven drift: when a CLAUDE.md exposure was emitted this scan
  // and we have a previous baseline for that file (any exposure with an
  // identical title? not reliable), record the file as drifted with the
  // exposure linked. Keep it simple: any LLM01 exposure becomes a drift row.
  for (const exp of ctx.exposures) {
    if (!exp.owaspCategory.startsWith('LLM01')) continue;
    const fileMatch = exp.title.match(/in (.+)$/);
    const file = fileMatch?.[1];
    if (!file) continue;
    const idHash = crypto
      .createHash('sha1')
      .update(`${file}|${scannedAt}|tamper`)
      .digest('hex')
      .slice(0, 12);
    drifts.push({
      id: `drift-${idHash}`,
      configFile: file,
      changedAt: scannedAt,
      changedBy: resolveChangedBy(file, changedByCache),
      policyApproved: false,
      approvedBy: null,
      rolledBackBy: null,
      rolledBackAt: null,
      diff: {
        removed: [],
        added: ['<instruction-tampering signal detected — see linked exposure>'],
      },
      linkedExposureIds: [exp.id],
    });
  }

  return drifts;
}

// ---------- Resilience computation ----------

function computeResilienceIndex(ctx: ParseContext): ResilienceIndexRow {
  const runtimes = [...ctx.runtimes.values()];
  const mcps = [...ctx.mcpServers.values()];
  const secrets = [...ctx.secrets.values()];

  // Synthesize core exposures from collected facts.
  const synthesized: ExposureRow[] = [];

  // 1) Cross-agent secret blast radius
  for (const sec of secrets) {
    if (sec.reachableByAgentIds.length >= 2) {
      synthesized.push({
        id: `exp-secret-${sec.id}`,
        title: `${sec.label} reachable by ${sec.reachableByAgentIds.length} agents and ${sec.reachableByMcpIds.length} MCP servers — blast radius ${sec.reachableByAgentIds.length >= 3 ? 'critical' : 'high'}`,
        severity: sec.reachableByAgentIds.length >= 3 ? 'critical' : 'high',
        affectedAgentIds: sec.reachableByAgentIds,
        affectedSecretIds: [sec.id],
        affectedMcpIds: sec.reachableByMcpIds,
        explanation: `Secret ${sec.label} (${sec.format}) is reachable across multiple agents via shared MCP servers. Compromise of any single agent grants full access. Rotate and scope to least-privilege.`,
        owaspCategory: 'LLM08: Excessive Agency / Credential Exfiltration',
        owaspRef: 'OWASP LLM Top 10 2025 — LLM08',
        cveRefs: [],
        fixType: 'rotate-secret',
        fixLabel: `Rotate ${sec.label} and scope to least-privilege`,
        proofHash: `0x${crypto
          .createHash('sha1')
          .update(sec.id + sec.lastDetectedAt)
          .digest('hex')
          .slice(0, 12)}`,
        status: 'open',
        detectedAt: new Date().toISOString(),
      });
    }
  }

  // 2) Quarantined / unverified MCP servers
  for (const mcp of mcps) {
    if (mcp.trustState === 'quarantined') {
      synthesized.push({
        id: `exp-quarantine-${mcp.id}`,
        title: `Unverified MCP server ${mcp.name} detected — supply chain injection risk`,
        severity: 'critical',
        affectedAgentIds: [],
        affectedSecretIds: [],
        affectedMcpIds: [mcp.id],
        explanation: `${mcp.packageRef} was registered without registry verification. Quarantine immediately and revoke agent access.`,
        owaspCategory: 'Agentic-03: Supply Chain Injection / MCP Trojan',
        owaspRef: 'OWASP Agentic AI Top 10 2026 — A03',
        cveRefs: [],
        fixType: 'quarantine-server',
        fixLabel: `Quarantine ${mcp.name} and revoke agent MCP access`,
        proofHash: `0x${crypto
          .createHash('sha1')
          .update(mcp.id + mcp.lastSeen)
          .digest('hex')
          .slice(0, 12)}`,
        status: 'fix-pending',
        detectedAt: new Date().toISOString(),
      });
    }
  }

  // 3) Unpinned servers
  const unpinned = mcps.filter((m) => !m.pinned);
  if (unpinned.length > 0) {
    synthesized.push({
      id: 'exp-unpinned',
      title: `${unpinned.length} MCP server${unpinned.length === 1 ? '' : 's'} unpinned — version drift attack surface`,
      severity: 'high',
      affectedAgentIds: [],
      affectedSecretIds: [],
      affectedMcpIds: unpinned.map((m) => m.id),
      explanation: `These servers rely on floating registry resolution. A malicious publisher could inject a tampered version on the next install.`,
      owaspCategory: 'Agentic-03: Supply Chain Injection',
      owaspRef: 'OWASP Agentic AI Top 10 2026 — A03',
      cveRefs: [],
      fixType: 'pin-version',
      fixLabel: `Pin ${unpinned
        .map((m) => m.name)
        .slice(0, 5)
        .join(', ')}`,
      proofHash: `0x${crypto
        .createHash('sha1')
        .update(unpinned.map((m) => m.id).join(','))
        .digest('hex')
        .slice(0, 12)}`,
      status: 'open',
      detectedAt: new Date().toISOString(),
    });
  }

  // Combine with already-collected exposures (e.g. CLAUDE.md tampering).
  const allExposures = [...ctx.exposures, ...synthesized];
  ctx.exposures.splice(0, ctx.exposures.length, ...allExposures);

  const openCount = allExposures.filter((e) => e.status !== 'resolved').length;
  const criticalCount = allExposures.filter((e) => e.severity === 'critical').length;
  const highCount = allExposures.filter((e) => e.severity === 'high').length;

  // Subscores (0-100, higher is healthier).
  const secretHygiene = Math.max(
    0,
    100 - secrets.reduce((acc, s) => acc + (s.reachableByAgentIds.length >= 2 ? 35 : 10), 0),
  );
  const permissionSurface = Math.max(0, 100 - ctx.edges.length * 4);
  const supplyChain = Math.max(
    0,
    100 - unpinned.length * 12 - mcps.filter((m) => m.trustState !== 'trusted').length * 18,
  );
  const egressContainment = Math.max(
    0,
    100 -
      mcps.reduce((acc, m) => {
        const overflow = Math.max(
          0,
          m.detectedEgressDomains.length - m.allowedEgressDomains.length,
        );
        return acc + overflow * 12;
      }, 0),
  );
  const scheduleHygiene = runtimes.length > 0 ? 80 : 100;
  const instructionTamperingRisk = Math.max(
    0,
    100 - ctx.exposures.filter((e) => e.owaspCategory.startsWith('LLM01')).length * 35,
  );
  const crossAgentBlastRadius = Math.max(
    0,
    100 - secrets.reduce((acc, s) => acc + s.reachableByAgentIds.length * 15, 0),
  );

  const overall = Math.round(
    secretHygiene * 0.22 +
      permissionSurface * 0.16 +
      supplyChain * 0.18 +
      egressContainment * 0.13 +
      scheduleHygiene * 0.07 +
      instructionTamperingRisk * 0.1 +
      crossAgentBlastRadius * 0.14,
  );

  const top = [...allExposures].sort(
    (a, b) => severityWeight(b.severity) - severityWeight(a.severity),
  )[0];

  return {
    overall,
    grade: gradeFor(overall),
    secretHygiene: Math.round(secretHygiene),
    permissionSurface: Math.round(permissionSurface),
    supplyChain: Math.round(supplyChain),
    egressContainment: Math.round(egressContainment),
    scheduleHygiene: Math.round(scheduleHygiene),
    instructionTamperingRisk: Math.round(instructionTamperingRisk),
    crossAgentBlastRadius: Math.round(crossAgentBlastRadius),
    openExposures: openCount,
    pendingApprovals: criticalCount + Math.min(highCount, 3),
    topExposure: top?.title ?? null,
    computedAt: new Date().toISOString(),
  };
}

function severityWeight(s: string): number {
  return { critical: 4, high: 3, medium: 2, low: 1 }[s] ?? 0;
}

// ---------- Public API ----------

export async function runMeshScan(
  opts: { extraPaths?: string[]; orgId?: number | null } = {},
): Promise<ScanResult> {
  const candidates = resolveScanPaths(opts.extraPaths ?? []);
  const ctx: ParseContext = {
    runtimes: new Map(),
    mcpServers: new Map(),
    secrets: new Map(),
    edges: [],
    exposures: [],
    scannedFiles: [],
    fileMcpLines: new Map(),
    filePermissionLines: new Map(),
    runtimePermissions: new Map(),
  };

  // Snapshot the previous DB state *before* we wipe it, so we can compute
  // per-file drift (added/removed MCP entries since the last scan).
  const previousFileState = await loadPreviousFileState(opts.orgId ?? null);

  for (const file of candidates) {
    let stats: fs.Stats;
    try {
      stats = fs.statSync(file);
    } catch {
      continue;
    }
    if (!stats.isFile()) continue;
    let contents: string;
    try {
      contents = fs.readFileSync(file, 'utf-8');
    } catch (err) {
      logger.debug({ err, file }, '[agent-mesh-collector] failed to read file');
      continue;
    }
    ctx.scannedFiles.push(file);
    const base = path.basename(file).toLowerCase();
    try {
      if (base === 'claude_desktop_config.json') parseClaudeDesktopConfig(ctx, file, contents);
      else if (base === 'mcp.json' || base === '.mcp.json') parseCursorMcp(ctx, file, contents);
      else if (base === 'settings.json' && file.includes('.claude'))
        parseClaudeCodeSettings(ctx, file, contents);
      else if (base === 'claude.md') parseClaudeMd(ctx, file, contents);
      else if (file.includes('.codex')) parseCodexConfig(ctx, file, contents);
    } catch (err) {
      logger.warn({ err, file }, '[agent-mesh-collector] parse error — skipping file');
    }
  }

  const resilienceIndex = computeResilienceIndex(ctx);
  const scannedAt = new Date().toISOString();

  // Containment rules and drift snapshots are derived AFTER exposures/index
  // so they can incorporate trust state, quarantines, and tampering signals.
  const containmentRules = deriveContainmentRules(ctx, scannedAt);
  const driftSnapshots = computeDriftSnapshots(ctx, previousFileState, scannedAt);

  const result: ScanResult = {
    scannedFiles: ctx.scannedFiles,
    runtimes: [...ctx.runtimes.values()],
    mcpServers: [...ctx.mcpServers.values()],
    secrets: [...ctx.secrets.values()],
    edges: ctx.edges,
    exposures: ctx.exposures,
    containmentRules,
    driftSnapshots,
    resilienceIndex,
    scannedAt,
  };

  await persistScan(result, opts.orgId ?? null);
  await detectAndRaiseResilienceDrop(result, opts.orgId ?? null);
  return result;
}

// ---------- Drop detection & alerts ----------

const DROP_OVERALL_THRESHOLD = Number(process.env.MESH_ALERT_DROP_THRESHOLD ?? '10');
const SUBINDEX_DROP_THRESHOLD = Number(process.env.MESH_ALERT_SUBINDEX_THRESHOLD ?? '15');

type SubIndexKey =
  | 'secretHygiene'
  | 'permissionSurface'
  | 'supplyChain'
  | 'egressContainment'
  | 'scheduleHygiene'
  | 'instructionTamperingRisk'
  | 'crossAgentBlastRadius';

const SUBINDEX_KEYS: SubIndexKey[] = [
  'secretHygiene',
  'permissionSurface',
  'supplyChain',
  'egressContainment',
  'scheduleHygiene',
  'instructionTamperingRisk',
  'crossAgentBlastRadius',
];

async function detectAndRaiseResilienceDrop(
  result: ScanResult,
  orgId: number | null,
): Promise<void> {
  try {
    // Read the previous index for this org (the one inserted just before this run).
    const previousRows = await db
      .select()
      .from(agentMeshResilienceIndexTable)
      .where(
        orgId === null
          ? sql`${agentMeshResilienceIndexTable.orgId} IS NULL`
          : eq(agentMeshResilienceIndexTable.orgId, orgId),
      )
      .orderBy(desc(agentMeshResilienceIndexTable.computedAt))
      .limit(2);

    // The most recent row is the one we just persisted. The second is the prior.
    const prior = previousRows[1];
    if (!prior) return;

    const current = result.resilienceIndex;
    const overallDrop = prior.overall - current.overall;
    const subIndexBefore: Record<(typeof SUBINDEX_KEYS)[number], number> = {
      secretHygiene: prior.secretHygiene,
      permissionSurface: prior.permissionSurface,
      supplyChain: prior.supplyChain,
      egressContainment: prior.egressContainment,
      scheduleHygiene: prior.scheduleHygiene,
      instructionTamperingRisk: prior.instructionTamperingRisk,
      crossAgentBlastRadius: prior.crossAgentBlastRadius,
    };
    const droppedSubIndices: { key: string; from: number; to: number; delta: number }[] = [];
    for (const key of SUBINDEX_KEYS) {
      const before = subIndexBefore[key];
      const after = current[key];
      const delta = before - after;
      if (delta >= SUBINDEX_DROP_THRESHOLD) {
        droppedSubIndices.push({ key: String(key), from: before, to: after, delta });
      }
    }
    const gradeSlipped =
      prior.grade !== current.grade &&
      severityGradeWeight(current.grade) >
        severityGradeWeight(prior.grade as ResilienceIndexRow['grade']);

    if (overallDrop < DROP_OVERALL_THRESHOLD && droppedSubIndices.length === 0 && !gradeSlipped) {
      return;
    }

    const severity: 'warning' | 'critical' =
      overallDrop >= DROP_OVERALL_THRESHOLD * 2 || current.grade === 'F' ? 'critical' : 'warning';

    const reasonParts: string[] = [];
    if (overallDrop >= DROP_OVERALL_THRESHOLD) {
      reasonParts.push(`overall ${prior.overall} → ${current.overall} (−${overallDrop})`);
    }
    if (gradeSlipped) {
      reasonParts.push(`grade ${prior.grade} → ${current.grade}`);
    }
    for (const s of droppedSubIndices) {
      reasonParts.push(`${s.key} ${s.from} → ${s.to} (−${s.delta})`);
    }
    const reason = reasonParts.join(' · ');

    logger.warn(
      { orgId, overallDrop, gradeSlipped, droppedSubIndices, current: current.overall },
      '[agent-mesh-collector] resilience drop detected',
    );

    // Surface in the platform telemetry alert feed (visible in Sentra ops dashboards).
    try {
      serverTelemetry.raiseAlert({
        type: 'agent_mesh_resilience_drop',
        message: `Sentra: agent-mesh resilience dropped — ${reason}`,
        severity,
        metadata: {
          orgId,
          overall: current.overall,
          previousOverall: prior.overall,
          grade: current.grade,
          previousGrade: prior.grade,
          topExposure: current.topExposure,
          openExposures: current.openExposures,
          droppedSubIndices,
          computedAt: current.computedAt,
        },
      });
    } catch (err) {
      logger.debug({ err }, '[agent-mesh-collector] raiseAlert failed');
    }

    // Persist a durable audit trail entry so Sentra and Pulse digests can replay drops.
    try {
      await db.insert(auditEventsTable).values({
        action: 'agent_mesh_resilience_drop',
        entityType: 'agent_mesh_resilience_index',
        entityId: orgId !== null ? String(orgId) : null,
        newValues: {
          orgId,
          severity,
          reason,
          overall: current.overall,
          previousOverall: prior.overall,
          grade: current.grade,
          previousGrade: prior.grade,
          topExposure: current.topExposure,
          openExposures: current.openExposures,
          pendingApprovals: current.pendingApprovals,
          droppedSubIndices,
          computedAt: current.computedAt,
        },
      });
    } catch (err) {
      logger.debug({ err }, '[agent-mesh-collector] audit insert failed');
    }
  } catch (err) {
    logger.warn({ err }, '[agent-mesh-collector] drop detection failed');
  }
}

function severityGradeWeight(g: ResilienceIndexRow['grade']): number {
  return { A: 1, B: 2, C: 3, D: 4, F: 5 }[g] ?? 0;
}

export interface ScheduledMeshScanReport {
  succeeded: { orgId: number | null; result: ScanResult }[];
  failed: { orgId: number | null; error: string }[];
  scannedAt: string;
}

/**
 * Run a scheduled mesh telemetry scan for every active tenant plus the global
 * (orgId=null) slice. Active tenants are discovered from the `organizations`
 * table at runtime (status='active' AND is_active=true), so newly created
 * orgs are picked up on the next tick without configuration changes.
 *
 * The optional `MESH_SCHEDULED_ORG_IDS` env var can supplement discovery with
 * additional org ids (e.g. for orgs in unusual states), and the optional
 * `MESH_SCHEDULED_ONLY_ORG_IDS` env var can restrict scans to an explicit
 * allow-list. Returns a structured report so the scheduler can record
 * partial-failure status.
 */
export async function runScheduledMeshScan(): Promise<ScheduledMeshScanReport> {
  const onlyEnv = (process.env.MESH_SCHEDULED_ONLY_ORG_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number.parseInt(s, 10))
    .filter(Number.isFinite);

  let targets: (number | null)[];
  if (onlyEnv.length > 0) {
    targets = [...onlyEnv];
  } else {
    const discovered = await discoverActiveOrgIds();
    const extraEnv = (process.env.MESH_SCHEDULED_ORG_IDS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => Number.parseInt(s, 10))
      .filter(Number.isFinite);
    const merged = new Set<number | null>([null, ...discovered, ...extraEnv]);
    targets = Array.from(merged);
  }

  const succeeded: ScheduledMeshScanReport['succeeded'] = [];
  const failed: ScheduledMeshScanReport['failed'] = [];
  for (const orgId of targets) {
    try {
      const result = await runMeshScan({ orgId });
      succeeded.push({ orgId, result });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn({ err, orgId }, '[agent-mesh-collector] scheduled scan failed for org');
      failed.push({ orgId, error: message });
    }
  }
  return { succeeded, failed, scannedAt: new Date().toISOString() };
}

async function discoverActiveOrgIds(): Promise<number[]> {
  try {
    // Use raw SQL to avoid a hard dependency on the organizations schema export
    // here — the table is part of the shared db schema but not always in the
    // collector's narrow imports. Safe: read-only, no user input interpolated.
    const rows = await db.execute(
      sql`SELECT id FROM organizations WHERE status = 'active' AND is_active = true`,
    );
    const list =
      (rows as unknown as { rows?: { id: number }[] }).rows ??
      (rows as unknown as { id: number }[]);
    return Array.from(list)
      .map((r) => Number(r.id))
      .filter((n) => Number.isFinite(n));
  } catch (err) {
    logger.warn(
      { err },
      '[agent-mesh-collector] could not discover active orgs; scanning global slice only',
    );
    return [];
  }
}

async function persistScan(result: ScanResult, orgId: number | null): Promise<void> {
  try {
    // Wipe and reseed the per-org slice so the table reflects the latest scan.
    await db.execute(
      sql`DELETE FROM agent_mesh_runtimes WHERE org_id IS NOT DISTINCT FROM ${orgId}`,
    );
    await db.execute(
      sql`DELETE FROM agent_mesh_mcp_servers WHERE org_id IS NOT DISTINCT FROM ${orgId}`,
    );
    await db.execute(
      sql`DELETE FROM agent_mesh_secrets WHERE org_id IS NOT DISTINCT FROM ${orgId}`,
    );
    await db.execute(sql`DELETE FROM agent_mesh_edges WHERE org_id IS NOT DISTINCT FROM ${orgId}`);
    await db.execute(
      sql`DELETE FROM agent_mesh_exposures WHERE org_id IS NOT DISTINCT FROM ${orgId}`,
    );

    if (result.runtimes.length) {
      await db.insert(agentMeshRuntimesTable).values(
        result.runtimes.map((r) => ({
          id: r.id,
          orgId,
          name: r.name,
          version: r.version,
          sourceRegistry: r.sourceRegistry,
          trustState: r.trustState,
          configFiles: r.configFiles,
          activeAgentIds: r.activeAgentIds,
          lastSeen: new Date(r.lastSeen),
          updatedAt: new Date(),
        })),
      );
    }
    if (result.mcpServers.length) {
      await db.insert(agentMeshMcpServersTable).values(
        result.mcpServers.map((m) => ({
          id: m.id,
          orgId,
          name: m.name,
          packageRef: m.packageRef,
          version: m.version,
          pinned: m.pinned,
          sourceRegistry: m.sourceRegistry,
          trustState: m.trustState,
          runtimeIds: m.runtimeIds,
          allowedEgressDomains: m.allowedEgressDomains,
          detectedEgressDomains: m.detectedEgressDomains,
          lastSeen: new Date(m.lastSeen),
          updatedAt: new Date(),
        })),
      );
    }
    if (result.secrets.length) {
      await db.insert(agentMeshSecretsTable).values(
        result.secrets.map((s) => ({
          id: s.id,
          orgId,
          label: s.label,
          format: s.format,
          foundInFile: s.foundInFile,
          entropy: s.entropy,
          reachableByAgentIds: s.reachableByAgentIds,
          reachableByMcpIds: s.reachableByMcpIds,
          lastDetectedAt: new Date(s.lastDetectedAt),
          updatedAt: new Date(),
        })),
      );
    }
    if (result.edges.length) {
      await db.insert(agentMeshEdgesTable).values(
        result.edges.map((e) => ({
          id: e.id,
          orgId,
          agentId: e.agentId,
          mcpServerId: e.mcpServerId,
          tools: e.tools,
          dataReadPaths: e.dataReadPaths,
          detectedAt: new Date(e.detectedAt),
        })),
      );
    }
    if (result.exposures.length) {
      await db.insert(agentMeshExposuresTable).values(
        result.exposures.map((e) => ({
          id: e.id,
          orgId,
          title: e.title,
          severity: e.severity,
          affectedAgentIds: e.affectedAgentIds,
          affectedSecretIds: e.affectedSecretIds,
          affectedMcpIds: e.affectedMcpIds,
          explanation: e.explanation,
          owaspCategory: e.owaspCategory,
          owaspRef: e.owaspRef,
          cveRefs: e.cveRefs,
          fixType: e.fixType,
          fixLabel: e.fixLabel,
          proofHash: e.proofHash,
          status: e.status,
          detectedAt: new Date(e.detectedAt),
          updatedAt: new Date(),
        })),
      );
    }

    // Containment rules: upsert by id. Update derived fields (allowed*,
    // tier, violationCount, lastEvaluatedAt) but leave enforcementMode and
    // pendingModeChange untouched — those are operator-managed via the MCP
    // gateway routes and surviving across scans is required so a critical
    // change request stays pending until a Guardian decision is recorded.
    if (result.containmentRules.length) {
      for (const rule of result.containmentRules) {
        await db
          .insert(agentMeshContainmentRulesTable)
          .values({
            id: rule.id,
            orgId,
            name: rule.name,
            agentClass: rule.agentClass,
            allowedMcpServers: rule.allowedMcpServers,
            allowedTools: rule.allowedTools,
            allowedReadPaths: rule.allowedReadPaths,
            allowedEgressDomains: rule.allowedEgressDomains,
            tier: rule.tier,
            enforcementMode: rule.enforcementMode,
            violationCount: rule.violationCount,
            lastEvaluatedAt: new Date(rule.lastEvaluatedAt),
          })
          .onConflictDoUpdate({
            target: agentMeshContainmentRulesTable.id,
            set: {
              name: rule.name,
              agentClass: rule.agentClass,
              allowedMcpServers: rule.allowedMcpServers,
              allowedTools: rule.allowedTools,
              allowedReadPaths: rule.allowedReadPaths,
              allowedEgressDomains: rule.allowedEgressDomains,
              tier: rule.tier,
              violationCount: rule.violationCount,
              lastEvaluatedAt: new Date(rule.lastEvaluatedAt),
              // Intentionally NOT updating enforcementMode or pendingModeChange.
            },
          });
      }
    }

    // Drift snapshots: append-only history. Skip insert if a row with the
    // same id already exists (deterministic id from file + scannedAt).
    if (result.driftSnapshots.length) {
      for (const drift of result.driftSnapshots) {
        await db
          .insert(agentMeshDriftSnapshotsTable)
          .values({
            id: drift.id,
            orgId,
            configFile: drift.configFile,
            changedAt: new Date(drift.changedAt),
            changedBy: drift.changedBy,
            policyApproved: drift.policyApproved,
            approvedBy: drift.approvedBy,
            diff: drift.diff,
            linkedExposureIds: drift.linkedExposureIds,
          })
          .onConflictDoNothing({ target: agentMeshDriftSnapshotsTable.id });
      }
    }

    await db.insert(agentMeshResilienceIndexTable).values({
      orgId,
      overall: result.resilienceIndex.overall,
      grade: result.resilienceIndex.grade,
      secretHygiene: result.resilienceIndex.secretHygiene,
      permissionSurface: result.resilienceIndex.permissionSurface,
      supplyChain: result.resilienceIndex.supplyChain,
      egressContainment: result.resilienceIndex.egressContainment,
      scheduleHygiene: result.resilienceIndex.scheduleHygiene,
      instructionTamperingRisk: result.resilienceIndex.instructionTamperingRisk,
      crossAgentBlastRadius: result.resilienceIndex.crossAgentBlastRadius,
      openExposures: result.resilienceIndex.openExposures,
      pendingApprovals: result.resilienceIndex.pendingApprovals,
      topExposure: result.resilienceIndex.topExposure,
      computedAt: new Date(result.resilienceIndex.computedAt),
    });
  } catch (err) {
    logger.warn(
      { err },
      '[agent-mesh-collector] persistence failed — scan still returned in-memory',
    );
  }
}

export interface MeshState {
  runtimes: RuntimeRow[];
  mcpServers: McpRow[];
  secrets: SecretRow[];
  edges: EdgeRow[];
  exposures: ExposureRow[];
  containmentRules: ContainmentRuleRow[];
  driftSnapshots: DriftSnapshotRow[];
  resilienceIndex: ResilienceIndexRow | null;
  source: 'live' | 'empty';
  scannedFiles: string[];
}

export async function loadMeshState(orgId: number | null = null): Promise<MeshState> {
  try {
    const [runtimes, mcps, secrets, edges, exposures, rules, drifts, latestIndex] =
      await Promise.all([
        db.execute(
          sql`SELECT * FROM agent_mesh_runtimes WHERE org_id IS NOT DISTINCT FROM ${orgId}`,
        ),
        db.execute(
          sql`SELECT * FROM agent_mesh_mcp_servers WHERE org_id IS NOT DISTINCT FROM ${orgId}`,
        ),
        db.execute(
          sql`SELECT * FROM agent_mesh_secrets WHERE org_id IS NOT DISTINCT FROM ${orgId}`,
        ),
        db.execute(sql`SELECT * FROM agent_mesh_edges WHERE org_id IS NOT DISTINCT FROM ${orgId}`),
        db.execute(
          sql`SELECT * FROM agent_mesh_exposures WHERE org_id IS NOT DISTINCT FROM ${orgId}`,
        ),
        db.execute(
          sql`SELECT * FROM agent_mesh_containment_rules WHERE org_id IS NOT DISTINCT FROM ${orgId}`,
        ),
        db.execute(
          sql`SELECT * FROM agent_mesh_drift_snapshots WHERE org_id IS NOT DISTINCT FROM ${orgId} ORDER BY changed_at DESC LIMIT 50`,
        ),
        db
          .select()
          .from(agentMeshResilienceIndexTable)
          .orderBy(desc(agentMeshResilienceIndexTable.computedAt))
          .limit(1),
      ]);

    const runtimeRows = (runtimes.rows as Record<string, unknown>[]).map(rowToRuntime);
    const idx = latestIndex[0];

    const empty = runtimeRows.length === 0 && (mcps.rows as unknown[]).length === 0;

    return {
      runtimes: runtimeRows,
      mcpServers: (mcps.rows as Record<string, unknown>[]).map(rowToMcp),
      secrets: (secrets.rows as Record<string, unknown>[]).map(rowToSecret),
      edges: (edges.rows as Record<string, unknown>[]).map(rowToEdge),
      exposures: (exposures.rows as Record<string, unknown>[]).map(rowToExposure),
      containmentRules: (rules.rows as Record<string, unknown>[]).map(rowToContainmentRule),
      driftSnapshots: (drifts.rows as Record<string, unknown>[]).map(rowToDriftSnapshot),
      resilienceIndex: idx
        ? {
            overall: idx.overall,
            grade: idx.grade as 'A' | 'B' | 'C' | 'D' | 'F',
            secretHygiene: idx.secretHygiene,
            permissionSurface: idx.permissionSurface,
            supplyChain: idx.supplyChain,
            egressContainment: idx.egressContainment,
            scheduleHygiene: idx.scheduleHygiene,
            instructionTamperingRisk: idx.instructionTamperingRisk,
            crossAgentBlastRadius: idx.crossAgentBlastRadius,
            openExposures: idx.openExposures,
            pendingApprovals: idx.pendingApprovals,
            topExposure: idx.topExposure,
            computedAt:
              idx.computedAt instanceof Date
                ? idx.computedAt.toISOString()
                : String(idx.computedAt),
          }
        : null,
      source: empty && !idx ? 'empty' : 'live',
      scannedFiles: [],
    };
  } catch (err) {
    logger.warn({ err }, '[agent-mesh-collector] loadMeshState failed');
    return {
      runtimes: [],
      mcpServers: [],
      secrets: [],
      edges: [],
      exposures: [],
      containmentRules: [],
      driftSnapshots: [],
      resilienceIndex: null,
      source: 'empty',
      scannedFiles: [],
    };
  }
}

function rowToRuntime(r: Record<string, unknown>): RuntimeRow {
  return {
    id: String(r.id),
    name: String(r.name),
    version: String(r.version ?? 'unknown'),
    sourceRegistry: String(r.source_registry ?? 'unknown'),
    trustState: (r.trust_state as TrustState) ?? 'unverified',
    configFiles: (r.config_files as string[]) ?? [],
    activeAgentIds: (r.active_agent_ids as string[]) ?? [],
    lastSeen:
      r.last_seen instanceof Date
        ? (r.last_seen as Date).toISOString()
        : String(r.last_seen),
  };
}

function rowToMcp(r: Record<string, unknown>): McpRow {
  return {
    id: String(r.id),
    name: String(r.name),
    packageRef: String(r.package_ref ?? ''),
    version: String(r.version ?? 'unknown'),
    pinned: Boolean(r.pinned),
    sourceRegistry: String(r.source_registry ?? 'unknown'),
    trustState: (r.trust_state as TrustState) ?? 'unverified',
    runtimeIds: (r.runtime_ids as string[]) ?? [],
    allowedEgressDomains: (r.allowed_egress_domains as string[]) ?? [],
    detectedEgressDomains: (r.detected_egress_domains as string[]) ?? [],
    lastSeen:
      r.last_seen instanceof Date
        ? (r.last_seen as Date).toISOString()
        : String(r.last_seen),
  };
}

function rowToSecret(r: Record<string, unknown>): SecretRow {
  return {
    id: String(r.id),
    label: String(r.label),
    format: (r.format as SecretRow['format']) ?? 'env-var',
    foundInFile: String(r.found_in_file ?? ''),
    entropy: Number(r.entropy ?? 0),
    reachableByAgentIds: (r.reachable_by_agent_ids as string[]) ?? [],
    reachableByMcpIds: (r.reachable_by_mcp_ids as string[]) ?? [],
    lastDetectedAt:
      r.last_detected_at instanceof Date
        ? (r.last_detected_at as Date).toISOString()
        : String(r.last_detected_at),
  };
}

function rowToEdge(r: Record<string, unknown>): EdgeRow {
  return {
    id: String(r.id),
    agentId: String(r.agent_id),
    mcpServerId: String(r.mcp_server_id),
    tools: (r.tools as string[]) ?? [],
    dataReadPaths: (r.data_read_paths as string[]) ?? [],
    detectedAt:
      r.detected_at instanceof Date
        ? (r.detected_at as Date).toISOString()
        : String(r.detected_at),
  };
}

function rowToExposure(r: Record<string, unknown>): ExposureRow {
  return {
    id: String(r.id),
    title: String(r.title),
    severity: (r.severity as ExposureRow['severity']) ?? 'medium',
    affectedAgentIds: (r.affected_agent_ids as string[]) ?? [],
    affectedSecretIds: (r.affected_secret_ids as string[]) ?? [],
    affectedMcpIds: (r.affected_mcp_ids as string[]) ?? [],
    explanation: String(r.explanation ?? ''),
    owaspCategory: String(r.owasp_category ?? ''),
    owaspRef: String(r.owasp_ref ?? ''),
    cveRefs: (r.cve_refs as string[]) ?? [],
    fixType: String(r.fix_type ?? 'scope-token'),
    fixLabel: String(r.fix_label ?? ''),
    proofHash: String(r.proof_hash ?? ''),
    status: (r.status as ExposureRow['status']) ?? 'open',
    detectedAt:
      r.detected_at instanceof Date
        ? (r.detected_at as Date).toISOString()
        : String(r.detected_at),
  };
}

function rowToContainmentRule(r: Record<string, unknown>): ContainmentRuleRow {
  return {
    id: String(r.id),
    name: String(r.name),
    agentClass: String(r.agent_class),
    allowedMcpServers: (r.allowed_mcp_servers as string[]) ?? [],
    allowedTools: (r.allowed_tools as string[]) ?? [],
    allowedReadPaths: (r.allowed_read_paths as string[]) ?? [],
    allowedEgressDomains: (r.allowed_egress_domains as string[]) ?? [],
    tier: (r.tier as ContainmentRuleRow['tier']) ?? 'standard',
    enforcementMode: (r.enforcement_mode as EnforcementMode) ?? 'log-only',
    violationCount: Number(r.violation_count ?? 0),
    lastEvaluatedAt:
      r.last_evaluated_at instanceof Date
        ? (r.last_evaluated_at as Date).toISOString()
        : String(r.last_evaluated_at),
  };
}

function rowToDriftSnapshot(r: Record<string, unknown>): DriftSnapshotRow {
  const diff = (r.diff as { removed?: string[]; added?: string[] } | null) ?? {};
  return {
    id: String(r.id),
    configFile: String(r.config_file),
    changedAt:
      r.changed_at instanceof Date
        ? (r.changed_at as Date).toISOString()
        : String(r.changed_at),
    changedBy: String(r.changed_by ?? 'unknown'),
    policyApproved: Boolean(r.policy_approved),
    approvedBy: r.approved_by == null ? null : String(r.approved_by),
    rolledBackBy: r.rolled_back_by == null ? null : String(r.rolled_back_by),
    rolledBackAt:
      r.rolled_back_at == null
        ? null
        : r.rolled_back_at instanceof Date
          ? (r.rolled_back_at as Date).toISOString()
          : String(r.rolled_back_at),
    diff: { removed: diff.removed ?? [], added: diff.added ?? [] },
    linkedExposureIds: (r.linked_exposure_ids as string[]) ?? [],
  };
}
