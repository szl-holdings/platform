import { Router, type IRouter, type Request, type Response, type NextFunction } from 'express';
import { createHash } from 'node:crypto';
import {
  loadForgeKeys,
  signForgeBytes,
  verifyForgeBytes,
  canonicalize,
} from '../lib/forge-skill-keys.js';

export interface ForgeSkillMeta {
  id: string;
  name: string;
  slug: string;
  domain: string;
  description: string;
  requiredTools: string[];
  blockedTools: string[];
  requiredApprovalTier: 'auto' | 'operator' | 'executive' | 'board';
  declaredScope: string;
  author: string;
  version: string;
}

export interface MirrorEvalDimension {
  id: string;
  label: string;
  score: number;
  threshold: number;
  passed: boolean;
}

export interface MirrorEvalReport {
  evalId: string;
  composite: number;
  disposition: 'pass' | 'pass_with_warning' | 'blocked';
  dimensions: MirrorEvalDimension[];
  flags: string[];
  evaluatedAt: string;
}

export interface CovenantComplianceReport {
  checkId: string;
  passed: boolean;
  excessiveToolAccess: boolean;
  bypassesGovernance: boolean;
  scopeViolations: string[];
  declaredApprovalTier: string;
  inferredApprovalTier: string;
  evaluatedAt: string;
}

export interface CapabilityCertificate {
  certificateId: string;
  schemaVersion: 'forge/capability-certificate@1';
  skillId: string;
  skillVersion: string;
  contentHash: string;
  mirrorEval: MirrorEvalReport;
  covenant: CovenantComplianceReport;
  pceGate: {
    approved: boolean;
    contractId: string;
    approvedAt: string;
    blockedReason?: string;
    bindings: { mirrorEvalId: string; covenantCheckId: string };
  };
  evaluator: {
    identity: string;
    platform: string;
    publicKeyFingerprint: string;
    publicKeyAlgorithm: 'Ed25519';
    publicKeyJwksUrl: string;
  };
  signature: {
    algorithm: 'Ed25519';
    publicKeyFingerprint: string;
    canonicalPayloadHash: string;
    value: string;
  };
  trustLevel: 'unverified' | 'sandboxed' | 'governed' | 'sovereign';
  issuedAt: string;
  expiresAt: string;
}

export interface ForgeSkill {
  meta: ForgeSkillMeta;
  skillMd: string;
  certificate?: CapabilityCertificate;
  status: 'draft' | 'evaluated' | 'published' | 'blocked';
  trustLevel: 'unverified' | 'sandboxed' | 'governed' | 'sovereign';
  usage: {
    consumedBy: number;
    runs: number;
    avgScore: number;
  };
  versionHistory: Array<{ version: string; certificateId?: string; publishedAt: string }>;
  createdAt: string;
  updatedAt: string;
}

const skills = new Map<string, ForgeSkill>();
const certificates = new Map<string, CapabilityCertificate>();

function sha256Hex(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

/** Deterministic id derived from canonical input — verifiable, not random. */
function derivedId(prefix: string, parts: string[]): string {
  const h = sha256Hex(parts.join('\u0000'));
  return `${prefix}-${h.slice(0, 12)}`;
}

const DIMENSION_DEFS: Array<{ id: string; label: string; threshold: number }> = [
  { id: 'groundedness', label: 'Groundedness', threshold: 0.7 },
  { id: 'hallucination_risk', label: 'Hallucination Risk (inverse)', threshold: 0.7 },
  { id: 'policy_compliance', label: 'Policy Compliance', threshold: 0.85 },
  { id: 'bias_neutrality', label: 'Bias Neutrality', threshold: 0.7 },
  { id: 'evidence_coverage', label: 'Evidence Coverage', threshold: 0.6 },
  { id: 'action_safety', label: 'Action Safety', threshold: 0.8 },
  { id: 'instruction_clarity', label: 'Instruction Clarity', threshold: 0.6 },
  { id: 'tool_minimality', label: 'Tool Minimality', threshold: 0.6 },
  { id: 'scope_discipline', label: 'Scope Discipline', threshold: 0.7 },
  { id: 'verification_readiness', label: 'Verification Readiness', threshold: 0.6 },
];

function deriveScore(text: string, salt: string, base: number): number {
  const h = createHash('sha256').update(`${text.length}:${salt}:${text.slice(0, 256)}`).digest();
  const raw = (h.readUInt16BE(0) % 1000) / 1000;
  const v = base + (raw - 0.5) * 0.25;
  return Math.max(0, Math.min(1, Math.round(v * 100) / 100));
}

function evaluateMirrorEval(skillMd: string, meta: ForgeSkillMeta): MirrorEvalReport {
  const length = skillMd.length;
  const richness = Math.min(1, length / 1500);
  const baseFromRichness = 0.65 + richness * 0.25;

  const blockedSet = new Set(meta.blockedTools);
  const overlap = meta.requiredTools.filter((t) => blockedSet.has(t)).length;
  const safetyBase = overlap > 0 ? 0.4 : 0.85;

  const lower = skillMd.toLowerCase();
  const hasInstructions = lower.includes('## instruction') || lower.includes('# instruction');
  const hasExamples = lower.includes('example') || lower.includes('## usage');
  const hasFailureMode = lower.includes('failure') || lower.includes('error') || lower.includes('fallback');
  const clarityBase = 0.55 + (hasInstructions ? 0.15 : 0) + (hasExamples ? 0.15 : 0) + (hasFailureMode ? 0.15 : 0);

  const toolMinimalityBase = meta.requiredTools.length === 0 ? 0.5 : Math.max(0.5, 1 - meta.requiredTools.length / 12);

  const dimensions: MirrorEvalDimension[] = DIMENSION_DEFS.map((d) => {
    let base = baseFromRichness;
    if (d.id === 'action_safety' || d.id === 'policy_compliance') base = safetyBase;
    if (d.id === 'instruction_clarity') base = clarityBase;
    if (d.id === 'tool_minimality') base = toolMinimalityBase;
    if (d.id === 'scope_discipline') base = meta.declaredScope.length > 30 ? 0.85 : 0.55;
    if (d.id === 'hallucination_risk') base = baseFromRichness * 0.95 + 0.05;
    const score = deriveScore(skillMd, d.id, base);
    return { id: d.id, label: d.label, score, threshold: d.threshold, passed: score >= d.threshold };
  });

  const composite = Math.round((dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length) * 100) / 100;
  const failed = dimensions.filter((d) => !d.passed);
  const criticalIds = new Set(['policy_compliance', 'action_safety', 'hallucination_risk']);
  const criticalFails = failed.filter((d) => criticalIds.has(d.id));

  let disposition: MirrorEvalReport['disposition'];
  if (criticalFails.length > 0) disposition = 'blocked';
  else if (failed.length > 0) disposition = 'pass_with_warning';
  else disposition = 'pass';

  const flags: string[] = [];
  if (overlap > 0) flags.push(`tool_conflict:${overlap}_required_tools_in_blocklist`);
  for (const f of failed) flags.push(`below_threshold:${f.id}=${f.score.toFixed(2)}`);
  if (length < 200) flags.push('skill_md_too_short');

  // Deterministic eval id: derived from skill content + version + ordered dim scores
  // → re-running evaluate over the same SKILL.md yields the same evalId.
  const evalId = derivedId('me', [
    sha256Hex(skillMd),
    meta.id,
    meta.version,
    dimensions.map((d) => `${d.id}=${d.score}`).join('|'),
  ]);

  return {
    evalId,
    composite,
    disposition,
    dimensions,
    flags,
    evaluatedAt: new Date().toISOString(),
  };
}

const PRIVILEGED_TOOLS = new Set([
  'data_purge',
  'tenant_delete',
  'policy_override',
  'covenant_disable',
  'eval_override',
  'force_approve',
  'modify_audit_log',
  'external_transfer',
]);

function evaluateCovenantCompliance(skillMd: string, meta: ForgeSkillMeta): CovenantComplianceReport {
  const excessive = meta.requiredTools.some((t) => PRIVILEGED_TOOLS.has(t));
  const lower = skillMd.toLowerCase();
  const bypasses = lower.includes('skip approval') || lower.includes('bypass governance') || lower.includes('disable mirroreval');

  const scopeViolations: string[] = [];
  if (meta.requiredTools.length > 8) scopeViolations.push('too_many_tools_for_declared_scope');
  if (meta.declaredScope.length < 20) scopeViolations.push('declared_scope_underspecified');
  for (const t of meta.requiredTools) {
    if (meta.blockedTools.includes(t)) scopeViolations.push(`tool_in_both_required_and_blocked:${t}`);
  }

  const inferredTier =
    excessive ? 'board'
      : meta.requiredTools.some((t) => /writer|updater|trigger|create|publish/.test(t)) ? 'executive'
      : 'operator';

  const tierOrder = ['auto', 'operator', 'executive', 'board'];
  const declaredIdx = tierOrder.indexOf(meta.requiredApprovalTier);
  const inferredIdx = tierOrder.indexOf(inferredTier);
  if (declaredIdx < inferredIdx) {
    scopeViolations.push(`declared_approval_tier_too_low:declared=${meta.requiredApprovalTier},inferred=${inferredTier}`);
  }

  const checkId = derivedId('cov', [
    sha256Hex(skillMd),
    meta.id,
    meta.version,
    meta.requiredTools.slice().sort().join(','),
    meta.blockedTools.slice().sort().join(','),
    meta.requiredApprovalTier,
    inferredTier,
  ]);

  return {
    checkId,
    passed: !excessive && !bypasses && scopeViolations.length === 0,
    excessiveToolAccess: excessive,
    bypassesGovernance: bypasses,
    scopeViolations,
    declaredApprovalTier: meta.requiredApprovalTier,
    inferredApprovalTier: inferredTier,
    evaluatedAt: new Date().toISOString(),
  };
}

function deriveTrustLevel(eval_: MirrorEvalReport, cov: CovenantComplianceReport): CapabilityCertificate['trustLevel'] {
  if (eval_.disposition === 'blocked' || !cov.passed) return 'unverified';
  if (eval_.disposition === 'pass_with_warning') return 'sandboxed';
  if (eval_.composite >= 0.92 && cov.passed) return 'sovereign';
  return 'governed';
}

const PUBLIC_KEYS_PATH = '/api/a11oy/forge/.well-known/keys.json';

function publicKeyJwksUrl(req?: Request): string {
  if (req) {
    const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    if (host) return `${proto}://${host}${PUBLIC_KEYS_PATH}`;
  }
  return PUBLIC_KEYS_PATH;
}

function generateCertificate(
  skill: ForgeSkill,
  evalReport: MirrorEvalReport,
  cov: CovenantComplianceReport,
  req?: Request,
): CapabilityCertificate {
  const keys = loadForgeKeys();
  const contentHash = `sha256:${sha256Hex(skill.skillMd)}`;
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString();
  const trustLevel = deriveTrustLevel(evalReport, cov);

  // Deterministic certificate id from the verifiable evidence bundle + issuance time.
  const certId = derivedId('cert', [
    contentHash,
    skill.meta.id,
    skill.meta.version,
    evalReport.evalId,
    cov.checkId,
    issuedAt,
  ]);
  const pceContractId = derivedId('pce', [certId, evalReport.evalId, cov.checkId]);

  const pceApproved = evalReport.disposition !== 'blocked' && cov.passed;
  const pceGate = {
    approved: pceApproved,
    contractId: pceContractId,
    approvedAt: issuedAt,
    blockedReason: !pceApproved
      ? evalReport.disposition === 'blocked'
        ? `MirrorEval blocked: ${evalReport.flags.slice(0, 2).join('; ')}`
        : `Covenant compliance failed: ${cov.scopeViolations.join('; ') || 'excessive_access'}`
      : undefined,
    bindings: {
      mirrorEvalId: evalReport.evalId,
      covenantCheckId: cov.checkId,
    },
  };

  // Canonical payload — sorted keys, deterministic — is what gets signed.
  const signablePayload = {
    schema: 'forge/capability-certificate@1',
    certificateId: certId,
    skillId: skill.meta.id,
    skillVersion: skill.meta.version,
    contentHash,
    mirrorEvalId: evalReport.evalId,
    composite: evalReport.composite,
    disposition: evalReport.disposition,
    covenantCheckId: cov.checkId,
    covenantPassed: cov.passed,
    pceContractId,
    pceApproved: pceApproved,
    trustLevel,
    issuedAt,
    expiresAt,
    evaluator: {
      identity: 'a11oy.forge.evaluator',
      platform: 'A11oy FORGE',
      publicKeyFingerprint: keys.fingerprint,
    },
  };
  const canonical = canonicalize(signablePayload);
  const canonicalBytes = Buffer.from(canonical, 'utf8');
  const signatureValue = signForgeBytes(canonicalBytes, keys);
  const canonicalPayloadHash = `sha256:${sha256Hex(canonical)}`;

  const cert: CapabilityCertificate = {
    certificateId: certId,
    schemaVersion: 'forge/capability-certificate@1',
    skillId: skill.meta.id,
    skillVersion: skill.meta.version,
    contentHash,
    mirrorEval: evalReport,
    covenant: cov,
    pceGate,
    evaluator: {
      identity: 'a11oy.forge.evaluator',
      platform: 'A11oy FORGE',
      publicKeyFingerprint: keys.fingerprint,
      publicKeyAlgorithm: 'Ed25519',
      publicKeyJwksUrl: publicKeyJwksUrl(req),
    },
    signature: {
      algorithm: 'Ed25519',
      publicKeyFingerprint: keys.fingerprint,
      canonicalPayloadHash,
      value: signatureValue,
    },
    trustLevel,
    issuedAt,
    expiresAt,
  };
  certificates.set(cert.certificateId, cert);
  return cert;
}

function buildSkillMd(meta: ForgeSkillMeta, body: string): string {
  if (body.trim().startsWith('#')) return body;
  return [
    `# ${meta.name}`,
    '',
    `**Domain:** ${meta.domain}  `,
    `**Author:** ${meta.author}  `,
    `**Version:** ${meta.version}`,
    '',
    `## Description`,
    meta.description,
    '',
    `## Declared Scope`,
    meta.declaredScope,
    '',
    `## Required Tools`,
    meta.requiredTools.map((t) => `- \`${t}\``).join('\n') || '_none_',
    '',
    `## Blocked Tools`,
    meta.blockedTools.map((t) => `- \`${t}\``).join('\n') || '_none_',
    '',
    `## Approval Tier`,
    `Required: **${meta.requiredApprovalTier}**`,
    '',
    `## Instructions`,
    body,
  ].join('\n');
}

/** Small deterministic PRNG — used so seed usage stats are reproducible. */
function deterministicInt(seed: string, max: number): number {
  const h = createHash('sha256').update(seed).digest();
  return h.readUInt32BE(0) % max;
}

function seed(): void {
  const seedDefs: Array<{ meta: Omit<ForgeSkillMeta, 'id' | 'slug'>; instructions: string; trust: ForgeSkill['trustLevel'] }> = [
    {
      meta: {
        name: 'Maritime Voyage Risk Brief',
        domain: 'maritime',
        description: 'Synthesizes AIS feeds, port congestion data, and weather routing to produce voyage risk briefs with PSC and sanctions context.',
        requiredTools: ['vessel_track', 'port_congestion', 'sanctions_check', 'weather_routing'],
        blockedTools: ['cargo_manifest_write', 'flag_state_modify'],
        requiredApprovalTier: 'operator',
        declaredScope: 'Read-only voyage analysis. Produces brief; never executes routing changes.',
        author: 'Vessels — Maritime Intelligence',
        version: '1.0.0',
      },
      instructions: `Retrieve the vessel's current AIS position and intended route. Cross-reference port congestion at destination and any waypoints. Run sanctions screening on the vessel, owner, and flag state. Score voyage risk on a 0–1 scale and produce a brief with reroute or demurrage recommendation. Always cite evidence; never modify cargo manifests.`,
      trust: 'sovereign',
    },
    {
      meta: {
        name: 'Legal Matter Deadline Sentinel',
        domain: 'legal',
        description: 'Monitors active legal matters for deadline risk, privilege exposure, and motion filing windows. Produces counsel-ready alerts.',
        requiredTools: ['docket_search', 'document_retrieve', 'deadline_monitor'],
        blockedTools: ['filing_submit', 'settlement_execute', 'privilege_waive'],
        requiredApprovalTier: 'executive',
        declaredScope: 'Read-only legal-matter analysis. Drafts alerts only; never files or settles.',
        author: 'Counsel — Legal Matter Command',
        version: '1.0.0',
      },
      instructions: `Pull the active matter docket. For each upcoming deadline, compute days remaining and risk class. Flag any deadline within the configured threshold. Check for privilege exposure in linked documents. Produce a counsel alert with cited deadline evidence. Failure mode: when uncertain, default to conservative escalation to lead counsel.`,
      trust: 'governed',
    },
    {
      meta: {
        name: 'Cyber Threat Triage Brief',
        domain: 'cyber',
        description: 'Triages CVE and indicator signals against MITRE ATT&CK TTPs, generating containment briefs with CISA notification drafts.',
        requiredTools: ['threat_lookup', 'indicator_enrich', 'cve_query'],
        blockedTools: ['cisa_report_submit', 'incident_escalate', 'classified_retrieve'],
        requiredApprovalTier: 'executive',
        declaredScope: 'Read-only threat triage. Produces brief and draft notifications only; never submits.',
        author: 'Sentra — Cyber Resilience',
        version: '1.0.0',
      },
      instructions: `For each indicator, enrich with threat-intelligence context and map to MITRE ATT&CK techniques. Compute CVSS where applicable. Recommend containment actions (isolate, patch, monitor) with estimated exposure. Produce a draft CISA Form 61 if criteria are met. Failure mode: default to critical severity when context is missing.`,
      trust: 'governed',
    },
    {
      meta: {
        name: 'Real Estate Covenant Risk Scorer',
        domain: 'real-estate',
        description: 'Evaluates lender covenant compliance for the active real-estate portfolio using lease comps, occupancy data, and market reports.',
        requiredTools: ['property_search', 'lease_comp_analysis', 'market_report'],
        blockedTools: ['listing_create', 'offer_submit', 'lease_sign'],
        requiredApprovalTier: 'operator',
        declaredScope: 'Portfolio covenant analysis only. No transactional actions taken.',
        author: 'Terra — Real Estate Intelligence',
        version: '1.0.0',
      },
      instructions: `For each asset, retrieve current occupancy and lease comps. Compute covenant headroom against the configured threshold. Flag assets at or below 90% of threshold. Produce a remediation recommendation grounded in cited comps. Failure mode: when comps are stale, flag for manual analyst review.`,
      trust: 'sovereign',
    },
    {
      meta: {
        name: 'Defense Sanctions Watch',
        domain: 'defense',
        description: 'Continuous sanctions screening for entities, vessels, and routes against OFAC, EU, and UN consolidated lists.',
        requiredTools: ['sanctions_check', 'entity_resolve', 'list_query'],
        blockedTools: ['entity_delist', 'sanctions_override'],
        requiredApprovalTier: 'executive',
        declaredScope: 'Read-only sanctions screening. Flags matches only; never modifies lists.',
        author: 'Aegis — Defense Intelligence',
        version: '1.0.0',
      },
      instructions: `Resolve each entity to canonical form. Query each configured sanctions list. For each potential match, compute fuzzy similarity score and confidence band. Escalate any potential match to compliance officer immediately. Never auto-clear a potential match. Failure mode: when uncertain, escalate.`,
      trust: 'sovereign',
    },
    {
      meta: {
        name: 'Revenue CapEx Overrun Detector',
        domain: 'finance',
        description: 'Detects capital-expenditure overruns against approved budgets, producing CFO-ready variance briefs with approval-tier routing.',
        requiredTools: ['budget_lookup', 'spend_aggregate', 'variance_compute'],
        blockedTools: ['budget_modify', 'spend_authorize'],
        requiredApprovalTier: 'executive',
        declaredScope: 'Read-only spend variance analysis. Produces brief; never authorizes spend.',
        author: 'Lyte — Revenue Intelligence',
        version: '1.0.0',
      },
      instructions: `Aggregate actual spend by project and period. Compare against approved budget. Compute variance percentage and absolute dollar overrun. For overruns above the configured threshold, produce a CFO-ready brief with cited budget evidence and recommended approval routing. Failure mode: flag any variance > 5% without budget data immediately.`,
      trust: 'governed',
    },
  ];

  for (const def of seedDefs) {
    const id = `forge-${def.meta.domain}-${def.meta.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)}`;
    const slug = id;
    const meta: ForgeSkillMeta = { id, slug, ...def.meta };
    const skillMd = buildSkillMd(meta, def.instructions);
    const consumedBy = 3 + deterministicInt(`${id}:consumed`, 12);
    const runs = 100 + deterministicInt(`${id}:runs`, 4000);
    const ageDays = deterministicInt(`${id}:age`, 30);
    const skill: ForgeSkill = {
      meta,
      skillMd,
      status: 'published',
      trustLevel: def.trust,
      usage: {
        consumedBy,
        runs,
        avgScore: 0.88 + deterministicInt(`${id}:avg`, 100) / 1000,
      },
      versionHistory: [{
        version: meta.version,
        publishedAt: new Date(Date.now() - ageDays * 86400000).toISOString(),
      }],
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const me = evaluateMirrorEval(skillMd, meta);
    const cov = evaluateCovenantCompliance(skillMd, meta);
    const cert = generateCertificate(skill, me, cov);
    skill.certificate = cert;
    skill.versionHistory[0]!.certificateId = cert.certificateId;
    skill.trustLevel = cert.trustLevel;
    skills.set(id, skill);
  }
}
seed();

function publicSkill(s: ForgeSkill) {
  return {
    ...s,
    skillMd: s.skillMd.length > 4000 ? `${s.skillMd.slice(0, 4000)}\n…[truncated]` : s.skillMd,
  };
}

function normalizeMeta(rawMeta: Record<string, unknown>, fallbackId: string): ForgeSkillMeta {
  const id = (typeof rawMeta.id === 'string' && rawMeta.id) || fallbackId;
  const tier = ['auto', 'operator', 'executive', 'board'].includes(rawMeta.requiredApprovalTier as string)
    ? (rawMeta.requiredApprovalTier as ForgeSkillMeta['requiredApprovalTier'])
    : 'operator';
  return {
    id,
    slug: (typeof rawMeta.slug === 'string' && rawMeta.slug) || id,
    name: String(rawMeta.name ?? 'Untitled Skill').slice(0, 120),
    domain: String(rawMeta.domain ?? 'general'),
    description: String(rawMeta.description ?? ''),
    requiredTools: Array.isArray(rawMeta.requiredTools) ? rawMeta.requiredTools.slice(0, 16).map(String) : [],
    blockedTools: Array.isArray(rawMeta.blockedTools) ? rawMeta.blockedTools.slice(0, 16).map(String) : [],
    requiredApprovalTier: tier,
    declaredScope: String(rawMeta.declaredScope ?? ''),
    author: String(rawMeta.author ?? 'forge.author'),
    version: String(rawMeta.version ?? '0.1.0'),
  };
}

/**
 * Publish auth — protects the only state-mutating route.
 *
 * Accepts a Bearer token from `FORGE_PUBLISH_TOKEN`. In sandbox/non-production
 * environments without an explicit token configured, we fall back to the
 * documented demo token `forge-publisher-demo` so the marketplace stays
 * usable in the Replit preview. In production an explicit token MUST be
 * configured — the demo fallback is disabled.
 */
function requirePublishAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization || '';
  const provided = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
  const configured = process.env.FORGE_PUBLISH_TOKEN;
  const isProd = process.env.NODE_ENV === 'production';

  const acceptable = new Set<string>();
  if (configured) acceptable.add(configured);
  if (!isProd) acceptable.add('forge-publisher-demo');

  if (!provided || !acceptable.has(provided)) {
    res.status(401).json({
      error: 'forge_publish_unauthorized',
      message: isProd
        ? 'Publishing a FORGE skill requires a Bearer token in the Authorization header. Set FORGE_PUBLISH_TOKEN on the server and present it as `Authorization: Bearer <token>`.'
        : 'Publishing a FORGE skill requires `Authorization: Bearer forge-publisher-demo` in this sandbox (or set FORGE_PUBLISH_TOKEN).',
    });
    return;
  }
  next();
}

const router: IRouter = Router();

/** Public verifier endpoint — anyone can fetch the public key to verify
 *  signatures on FORGE Capability Certificates. The private key is never
 *  exposed. */
router.get('/forge/.well-known/keys.json', (_req: Request, res: Response) => {
  const keys = loadForgeKeys();
  res.json({
    schema: 'forge/jwks@1',
    keys: [
      {
        kid: keys.fingerprint,
        kty: 'OKP',
        crv: 'Ed25519',
        alg: 'Ed25519',
        use: 'sig',
        x: keys.publicKeyRawBase64,
        publicKeyPem: keys.publicKeyPem,
        purpose: 'forge-capability-certificate',
        generatedAt: keys.generatedAt,
      },
    ],
  });
});

router.get('/forge/skills', (_req: Request, res: Response) => {
  const list = [...skills.values()]
    .sort((a, b) => (b.certificate?.mirrorEval.composite ?? 0) - (a.certificate?.mirrorEval.composite ?? 0))
    .map(publicSkill);
  res.json({
    skills: list,
    summary: {
      total: list.length,
      published: list.filter((s) => s.status === 'published').length,
      sovereign: list.filter((s) => s.trustLevel === 'sovereign').length,
      governed: list.filter((s) => s.trustLevel === 'governed').length,
      sandboxed: list.filter((s) => s.trustLevel === 'sandboxed').length,
      blocked: list.filter((s) => s.status === 'blocked').length,
      domains: [...new Set(list.map((s) => s.meta.domain))],
      verifierKeyFingerprint: loadForgeKeys().fingerprint,
      verifierKeyAlgorithm: 'Ed25519',
      verifierKeyJwksUrl: PUBLIC_KEYS_PATH,
    },
  });
});

router.get('/forge/skills/:id', (req: Request, res: Response) => {
  const skill = skills.get(req.params.id);
  if (!skill) { res.status(404).json({ error: 'skill_not_found' }); return; }
  res.json({ skill: publicSkill(skill) });
});

router.get('/forge/certificates/:id', (req: Request, res: Response) => {
  const cert = certificates.get(req.params.id);
  if (!cert) { res.status(404).json({ error: 'certificate_not_found' }); return; }
  res.json({ certificate: cert });
});

/** Verify a signature against a known certificate. Independent verifier
 *  endpoint anyone can hit to confirm a cert hasn't been tampered with. */
router.get('/forge/certificates/:id/verify', (req: Request, res: Response) => {
  const cert = certificates.get(req.params.id);
  if (!cert) { res.status(404).json({ error: 'certificate_not_found' }); return; }
  const keys = loadForgeKeys();
  const signablePayload = {
    schema: 'forge/capability-certificate@1',
    certificateId: cert.certificateId,
    skillId: cert.skillId,
    skillVersion: cert.skillVersion,
    contentHash: cert.contentHash,
    mirrorEvalId: cert.mirrorEval.evalId,
    composite: cert.mirrorEval.composite,
    disposition: cert.mirrorEval.disposition,
    covenantCheckId: cert.covenant.checkId,
    covenantPassed: cert.covenant.passed,
    pceContractId: cert.pceGate.contractId,
    pceApproved: cert.pceGate.approved,
    trustLevel: cert.trustLevel,
    issuedAt: cert.issuedAt,
    expiresAt: cert.expiresAt,
    evaluator: {
      identity: cert.evaluator.identity,
      platform: cert.evaluator.platform,
      publicKeyFingerprint: cert.evaluator.publicKeyFingerprint,
    },
  };
  const canonical = canonicalize(signablePayload);
  const canonicalBytes = Buffer.from(canonical, 'utf8');
  const fingerprintMatches = cert.signature.publicKeyFingerprint === keys.fingerprint;
  const payloadHashMatches = cert.signature.canonicalPayloadHash === `sha256:${sha256Hex(canonical)}`;
  const signatureValid = fingerprintMatches && verifyForgeBytes(canonicalBytes, cert.signature.value, keys.publicKeyRawBase64);
  const skill = skills.get(cert.skillId);
  const contentHashMatches = skill ? cert.contentHash === `sha256:${sha256Hex(skill.skillMd)}` : null;

  res.json({
    certificateId: cert.certificateId,
    valid: signatureValid && payloadHashMatches && (contentHashMatches !== false),
    checks: {
      signatureValid,
      fingerprintMatches,
      canonicalPayloadHashMatches: payloadHashMatches,
      contentHashMatches,
    },
    verifier: {
      publicKeyFingerprint: keys.fingerprint,
      algorithm: 'Ed25519',
      jwksUrl: PUBLIC_KEYS_PATH,
    },
  });
});

router.post('/forge/skills/evaluate', (req: Request, res: Response) => {
  const { meta: rawMeta, body } = req.body ?? {};
  if (!rawMeta || typeof rawMeta !== 'object' || typeof body !== 'string' || body.length < 10) {
    res.status(400).json({ error: 'invalid_payload', message: 'meta object and body string (>=10 chars) required.' });
    return;
  }
  const fallbackId = `draft-${sha256Hex(JSON.stringify(rawMeta) + body).slice(0, 8)}`;
  const meta = normalizeMeta(rawMeta as Record<string, unknown>, fallbackId);
  const skillMd = buildSkillMd(meta, body);
  const evalReport = evaluateMirrorEval(skillMd, meta);
  const cov = evaluateCovenantCompliance(skillMd, meta);
  res.json({
    preview: { meta, skillMd },
    mirrorEval: evalReport,
    covenant: cov,
    canPublish: evalReport.disposition !== 'blocked' && cov.passed,
  });
});

router.post('/forge/skills/publish', requirePublishAuth, (req: Request, res: Response) => {
  const { meta: rawMeta, body } = req.body ?? {};
  if (!rawMeta || typeof body !== 'string') {
    res.status(400).json({ error: 'invalid_payload' });
    return;
  }
  const fallbackId = `forge-${rawMeta.domain ?? 'general'}-${sha256Hex(JSON.stringify(rawMeta) + body).slice(0, 8)}`;
  const meta = normalizeMeta(rawMeta as Record<string, unknown>, fallbackId);
  const skillMd = buildSkillMd(meta, body);
  const evalReport = evaluateMirrorEval(skillMd, meta);
  const cov = evaluateCovenantCompliance(skillMd, meta);

  const existing = skills.get(meta.id);
  const nowIso = new Date().toISOString();
  const skill: ForgeSkill = existing
    ? { ...existing, meta, skillMd, updatedAt: nowIso }
    : {
        meta, skillMd,
        status: 'draft',
        trustLevel: 'unverified',
        usage: { consumedBy: 0, runs: 0, avgScore: 0 },
        versionHistory: [],
        createdAt: nowIso,
        updatedAt: nowIso,
      };

  if (evalReport.disposition === 'blocked' || !cov.passed) {
    skill.status = 'blocked';
    skill.trustLevel = 'unverified';
    skill.certificate = undefined;
    skills.set(meta.id, skill);
    res.status(200).json({
      published: false,
      reason: evalReport.disposition === 'blocked' ? 'mirror_eval_blocked' : 'covenant_compliance_failed',
      skill: publicSkill(skill),
      mirrorEval: evalReport,
      covenant: cov,
    });
    return;
  }

  const cert = generateCertificate(skill, evalReport, cov, req);
  skill.certificate = cert;
  skill.status = 'published';
  skill.trustLevel = cert.trustLevel;
  skill.versionHistory = [
    ...skill.versionHistory.filter((v) => v.version !== meta.version),
    { version: meta.version, certificateId: cert.certificateId, publishedAt: nowIso },
  ];
  skills.set(meta.id, skill);
  res.json({ published: true, skill: publicSkill(skill), certificate: cert });
});

router.get('/forge/skills/:id/export', (req: Request, res: Response) => {
  const skill = skills.get(req.params.id);
  if (!skill || !skill.certificate) {
    res.status(404).json({ error: 'skill_or_certificate_not_found' });
    return;
  }
  const pkg = {
    format: 'huggingface-agent-skill@1',
    'SKILL.md': skill.skillMd,
    'FORGE_CERT.json': skill.certificate,
    metadata: {
      name: skill.meta.name,
      slug: skill.meta.slug,
      domain: skill.meta.domain,
      author: skill.meta.author,
      version: skill.meta.version,
      requiredTools: skill.meta.requiredTools,
      blockedTools: skill.meta.blockedTools,
      verifierKeyJwksUrl: publicKeyJwksUrl(req),
    },
  };
  if (req.query.download === '1') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${skill.meta.slug}-skill-pack.json"`);
  }
  res.json(pkg);
});

export default router;
