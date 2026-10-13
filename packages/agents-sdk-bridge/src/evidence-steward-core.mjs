import { createHash } from 'node:crypto';

const CATALOG_SCHEMA = 'szl.hf-catalog-snapshot/v1';
const BINDINGS_SCHEMA = 'szl.model-source-bindings/v2';
const PORTFOLIO_SCHEMA = 'szl.model-kernel-portfolio/v1';
const OUTPUT_SCHEMA = 'szl.evidence-steward/v1';
const ORGANIZATION = 'SZLHOLDINGS';
const MAX_MODELS = 50;
const STALE_AFTER_DAYS = 30;
const DAY_MS = 86_400_000;
const COMPLETENESS_RULE =
  'Follow rel=next cursor links to exhaustion; reject a full terminal page without a next link.';
const FIXTURE_BLOBS = Object.freeze({
  catalog: '67300a17f2255f7e10cd23eed4cb0dfed597ff29',
  bindings: '3f59306bf19d0ecd3321c5243b1f3dc55cc85385',
  portfolio: '151ce1e4c1ca9fb3096793a192b2599f4b454575',
});
const FIXTURE_CANONICAL_DIGESTS = Object.freeze({
  catalog: '638f73ca32d148d98c8421685f06c0a94cb93b26536306ed264d8b03b9eee31c',
  bindings: 'ad3b12f2d1bc9e27f030b7c980f194f9e15687c78315bda3073af9c5a28a4469',
  portfolio: 'bc3d0949474d7a8c9076113d4fc9212dcbfc37f4d5ae6cc44605d142bcdecc7c',
});

const SOURCE_PATHS = Object.freeze({
  catalog: {
    repository: 'szl-holdings/platform',
    path: 'audit/evidence/huggingface-public-catalog.snapshot.json',
    ref: 'f2f8df6f89056e9104587674ccec0855dd5b177a',
  },
  bindings: {
    repository: 'szl-holdings/szl-forge',
    path: 'publishing/model-source-bindings.json',
    ref: '53287761f823c3b5114e3e741b17568229688331',
  },
  portfolio: {
    repository: 'szl-holdings/szl-forge',
    path: 'portfolio/model_portfolio.json',
    ref: '53287761f823c3b5114e3e741b17568229688331',
  },
});

const LAMBDA_PROOF = Object.freeze({
  repository: 'szl-holdings/platform',
  path: 'replit-sync/conjecture/PROVEN_STATE_CANONICAL.md',
  ref: 'f2f8df6f89056e9104587674ccec0855dd5b177a',
  git_blob_sha1: '9c950a168cc887d6345fe873c10e354cca5bd1e5',
});

const BOUND_CLASSES = new Set(['fine_tuned_model', 'fine_tuned_adapter', 'quantized_model']);
const PORTFOLIO_KINDS = new Set(['trained_model', 'quantized_model', 'software_kernel']);
const PROMOTION_STATES = new Set([
  'NOT_PROMOTED_LIMITED_EVIDENCE',
  'NOT_PROMOTED_RESEARCH_ONLY',
  'NOT_PROMOTED_OPERATIONAL_RESEARCH_DEMO',
]);

function fail(code) {
  throw new Error(`EVIDENCE_STEWARD_${code}`);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireObject(value, code) {
  if (!isObject(value)) fail(code);
  return value;
}

function requireExactKeys(value, keys, code) {
  requireObject(value, code);
  if (JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([...keys].sort())) fail(code);
}

function requireString(value, code, max = 2_000) {
  if (typeof value !== 'string' || value.length === 0 || value.length > max) fail(code);
  return value;
}

function canonicalDate(value, code) {
  requireString(value, code, 32);
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== value) fail(code);
  return date.getTime();
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (isObject(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  }
  if (value === undefined || typeof value === 'function' ||
      (typeof value === 'number' && !Number.isFinite(value))) fail('SOURCE_VALUE_INVALID');
  return JSON.stringify(value);
}

function digest(value) {
  return createHash('sha256').update(canonical(value)).digest('hex');
}

/** Verify a fixed reviewed source blob without accepting a path or URL. */
export function verifyEvidenceStewardFixtureBlob(kind, bytes) {
  if (!Object.hasOwn(FIXTURE_BLOBS, kind) || !(bytes instanceof Uint8Array) ||
      bytes.byteLength > 1_048_576) fail('FIXTURE_BLOB_ARGS_INVALID');
  const actual = createHash('sha1')
    .update(`blob ${bytes.byteLength}\0`)
    .update(bytes)
    .digest('hex');
  if (actual !== FIXTURE_BLOBS[kind]) fail(`SOURCE_BLOB_MISMATCH:${kind}`);
}

function withDigest(value) {
  return { ...value, digest: `sha256:${digest(value)}` };
}

function requireAssetId(value, code) {
  if (typeof value !== 'string' || !/^SZLHOLDINGS\/[A-Za-z0-9._-]{1,100}$/.test(value)) {
    fail(code);
  }
  return value;
}

function requireSafePath(value, code) {
  requireString(value, code, 240);
  if (!/^[A-Za-z0-9._/-]+$/.test(value) || value.startsWith('/') ||
      value.split('/').some((part) => part === '' || part === '.' || part === '..')) fail(code);
}

function validateCatalog(catalog, asOfMs) {
  requireObject(catalog, 'CATALOG_INVALID');
  if (catalog.schema !== CATALOG_SCHEMA || catalog.organization !== ORGANIZATION ||
      catalog.evidenceLabel !== 'MEASURED') fail('CATALOG_INVALID');
  const observedMs = canonicalDate(catalog.observedAt, 'CATALOG_DATE_INVALID');
  if (observedMs > asOfMs) fail('CATALOG_DATE_IN_FUTURE');
  const source = requireObject(catalog.source, 'CATALOG_SOURCE_INVALID');
  if (source.apiBase !== 'https://huggingface.co/api' ||
      source.pagination !== 'RFC_LINK_CURSOR' ||
      source.completenessRule !== COMPLETENESS_RULE ||
      !Number.isInteger(source.pageSize) || source.pageSize < 1 || source.pageSize > 100) {
    fail('CATALOG_SOURCE_INVALID');
  }
  const assets = requireObject(catalog.assets, 'CATALOG_ASSETS_INVALID');
  if (JSON.stringify(Object.keys(assets).sort()) !== JSON.stringify(['datasets', 'models', 'spaces'])) {
    fail('CATALOG_ASSETS_INVALID');
  }
  for (const type of ['models', 'datasets', 'spaces']) {
    const group = requireObject(assets[type], 'CATALOG_GROUP_INVALID');
    if (!Array.isArray(group.ids) || group.ids.length > (type === 'models' ? MAX_MODELS : 256) ||
        group.count !== group.ids.length || !Number.isInteger(group.pages) || group.pages < 1) {
      fail('CATALOG_GROUP_INVALID');
    }
    for (const id of group.ids) requireAssetId(id, 'CATALOG_ASSET_ID_INVALID');
    if (JSON.stringify(group.ids) !== JSON.stringify([...new Set(group.ids)].sort())) {
      fail('CATALOG_ASSETS_NOT_SORTED_UNIQUE');
    }
  }
  return { modelIds: assets.models.ids, observedMs };
}

function validateBindings(bindings) {
  requireObject(bindings, 'BINDINGS_INVALID');
  if (bindings.schema !== BINDINGS_SCHEMA ||
      bindings.source_repository !== 'szl-holdings/szl-forge' ||
      !Array.isArray(bindings.artifacts) || bindings.artifacts.length > MAX_MODELS) {
    fail('BINDINGS_INVALID');
  }
  const policy = requireObject(bindings.policy, 'BINDINGS_POLICY_INVALID');
  if (policy.artifact_equivalence !== 'NOT_CLAIMED' ||
      policy.reproducible_build !== 'NOT_CLAIMED') fail('BINDINGS_POLICY_INVALID');
  const byId = new Map();
  for (const artifact of bindings.artifacts) {
    requireObject(artifact, 'BINDING_INVALID');
    const id = requireAssetId(artifact.repo_id, 'BINDING_ID_INVALID');
    if (byId.has(id) || !BOUND_CLASSES.has(artifact.artifact_class) ||
        !PROMOTION_STATES.has(artifact.promotion_state)) fail('BINDING_INVALID');
    requireSafePath(artifact.source_path, 'BINDING_SOURCE_PATH_INVALID');
    requireString(artifact.maturity, 'BINDING_MATURITY_INVALID', 100);
    requireString(artifact.role, 'BINDING_ROLE_INVALID', 100);
    if (!Array.isArray(artifact.source_files) || artifact.source_files.length > 64) {
      fail('BINDING_SOURCE_FILES_INVALID');
    }
    for (const path of artifact.source_files) requireSafePath(path, 'BINDING_SOURCE_FILES_INVALID');
    if (!Array.isArray(artifact.required_hub_files) || artifact.required_hub_files.length > 32) {
      fail('BINDING_REQUIRED_FILES_INVALID');
    }
    for (const path of artifact.required_hub_files) requireSafePath(path, 'BINDING_REQUIRED_FILES_INVALID');
    const weightHashes = requireObject(artifact.expected_weight_sha256, 'BINDING_WEIGHT_HASHES_INVALID');
    if (Object.keys(weightHashes).length > 16) fail('BINDING_WEIGHT_HASHES_INVALID');
    for (const [path, hash] of Object.entries(weightHashes)) {
      requireSafePath(path, 'BINDING_WEIGHT_HASHES_INVALID');
      if (typeof hash !== 'string' || !/^[a-f0-9]{64}$/.test(hash)) fail('BINDING_WEIGHT_HASHES_INVALID');
    }
    if (!Array.isArray(artifact.limitations) || artifact.limitations.length > 24 ||
        artifact.limitations.some((text) => typeof text !== 'string' || text.length > 2_000)) {
      fail('BINDING_LIMITATIONS_INVALID');
    }
    if (!isObject(artifact.signed_receipts) ||
        artifact.signed_receipts.claim_scope !== 'REPOSITORY_DECLARED_KEY_CONTINUITY_ONLY') {
      fail('BINDING_RECEIPT_SCOPE_INVALID');
    }
    for (const field of ['public_key', 'training', 'evaluation']) {
      requireSafePath(artifact.signed_receipts[field], 'BINDING_RECEIPT_PATH_INVALID');
    }
    if (artifact.signed_receipts.release !== undefined) {
      requireSafePath(artifact.signed_receipts.release, 'BINDING_RECEIPT_PATH_INVALID');
    }
    if (artifact.autonomy_boundary !== undefined &&
        (artifact.autonomy_boundary?.autonomous_execution !== false ||
         artifact.autonomy_boundary?.controller_validation_required !== true)) {
      fail('BINDING_AUTONOMY_INVALID');
    }
    byId.set(id, artifact);
  }
  return byId;
}

function validatePortfolio(portfolio) {
  requireObject(portfolio, 'PORTFOLIO_INVALID');
  if (portfolio.schema !== PORTFOLIO_SCHEMA || portfolio.organization !== ORGANIZATION ||
      !Array.isArray(portfolio.artifacts) || portfolio.artifacts.length > MAX_MODELS) {
    fail('PORTFOLIO_INVALID');
  }
  const byId = new Map();
  for (const artifact of portfolio.artifacts) {
    requireObject(artifact, 'PORTFOLIO_ENTRY_INVALID');
    const id = requireAssetId(artifact.repo_id, 'PORTFOLIO_ID_INVALID');
    if (byId.has(id) || !PORTFOLIO_KINDS.has(artifact.kind) ||
        artifact.autonomy_eligible !== false) fail('PORTFOLIO_ENTRY_INVALID');
    requireString(artifact.maturity, 'PORTFOLIO_MATURITY_INVALID', 100);
    if (artifact.github_source !== null && artifact.github_source !== undefined) {
      let url;
      try { url = new URL(artifact.github_source); } catch { fail('PORTFOLIO_SOURCE_INVALID'); }
      if (url.origin !== 'https://github.com' ||
          !url.pathname.startsWith('/szl-holdings/') || url.username || url.password ||
          url.search || url.hash) fail('PORTFOLIO_SOURCE_INVALID');
    }
    if (artifact.limitations !== undefined &&
        (!Array.isArray(artifact.limitations) || artifact.limitations.length > 24 ||
         artifact.limitations.some((text) => typeof text !== 'string' || text.length > 2_000))) {
      fail('PORTFOLIO_LIMITATIONS_INVALID');
    }
    byId.set(id, artifact);
  }
  return byId;
}

function classify(binding, portfolio) {
  if (portfolio?.kind === 'software_kernel') return binding ? 'UNKNOWN' : 'SOFTWARE';
  if (binding?.promotion_state === 'NOT_PROMOTED_RESEARCH_ONLY' ||
      binding?.maturity?.includes('RESEARCH_ONLY') ||
      portfolio?.maturity?.includes('RESEARCH_ONLY')) return 'RESEARCH_ONLY';
  if (binding?.promotion_state?.startsWith('NOT_PROMOTED_')) return 'NOT_PROMOTED';
  return 'UNKNOWN';
}

function sourceLinks(refs, names) {
  return names.map((name) => ({ ...refs[name] }));
}

/** Build one offline, proposal-only steward from fixed, supplied source records. */
export function createEvidenceSteward(sources, asOf) {
  requireExactKeys(sources, ['catalog', 'bindings', 'portfolio'], 'SOURCES_INVALID');
  try { sources = structuredClone(sources); } catch { fail('SOURCES_NOT_CLONEABLE'); }
  const asOfMs = canonicalDate(asOf, 'AS_OF_INVALID');
  const { modelIds: sourceModelIds, observedMs } = validateCatalog(sources.catalog, asOfMs);
  const bindings = validateBindings(sources.bindings);
  const portfolio = validatePortfolio(sources.portfolio);
  const verifiedDigests = Object.fromEntries(Object.entries(FIXTURE_CANONICAL_DIGESTS).map(([name, expected]) => {
    const actual = digest(sources[name]);
    if (actual !== expected) fail(`SOURCE_DIGEST_MISMATCH:${name}`);
    return [name, actual];
  }));
  const modelIds = [...sourceModelIds];
  const modelIdSet = new Set(modelIds);
  const stale = asOfMs - observedMs > STALE_AFTER_DAYS * DAY_MS;
  const ageDays = Math.floor((asOfMs - observedMs) / DAY_MS);
  const refs = Object.fromEntries(Object.entries(SOURCE_PATHS).map(([name, location]) => [
    name,
    { ...location, canonical_json_sha256: verifiedDigests[name] },
  ]));

  function checkedAssetId(args) {
    requireExactKeys(args, ['asset_id'], 'ASSET_ARGS_INVALID');
    const id = requireAssetId(args.asset_id, 'ASSET_ID_INVALID');
    if (!modelIdSet.has(id)) fail('ASSET_NOT_IN_CATALOG');
    return id;
  }

  function entry(id) {
    const binding = bindings.get(id);
    const item = portfolio.get(id);
    const classification = classify(binding, item);
    return { binding, item, classification };
  }

  function listCatalog(args) {
    requireExactKeys(args, ['asset_type', 'limit'], 'LIST_ARGS_INVALID');
    if (args.asset_type !== 'models' || ![5, 10, 25].includes(args.limit)) fail('LIST_ARGS_INVALID');
    return withDigest({
      schema: OUTPUT_SCHEMA,
      tool: 'list_catalog',
      as_of: asOf,
      observed_at: sources.catalog.observedAt,
      catalog_age_days: ageDays,
      catalog_stale: stale,
      total: modelIds.length,
      assets: modelIds.slice(0, args.limit).map((id) => {
        const { binding, item, classification } = entry(id);
        return {
          asset_id: id,
          classification,
          maturity: binding?.maturity ?? item?.maturity ?? 'UNKNOWN',
          promotion_state: binding?.promotion_state ?? 'UNKNOWN',
        };
      }),
      evidence: sourceLinks(refs, ['catalog', 'bindings', 'portfolio']),
    });
  }

  function inspectAsset(args) {
    const id = checkedAssetId(args);
    const { binding, item, classification } = entry(id);
    return withDigest({
      schema: OUTPUT_SCHEMA,
      tool: 'inspect_asset',
      as_of: asOf,
      asset_id: id,
      classification,
      artifact_class: binding?.artifact_class ?? item?.kind ?? 'UNKNOWN',
      maturity: binding?.maturity ?? item?.maturity ?? 'UNKNOWN',
      promotion_state: binding?.promotion_state ?? 'UNKNOWN',
      role: binding?.role ?? item?.role ?? null,
      source_binding: binding ? {
        repository: sources.bindings.source_repository,
        source_path: binding.source_path,
        source_files: [...binding.source_files],
      } : null,
      github_source: item?.github_source ?? null,
      expected_weight_sha256: binding ? { ...binding.expected_weight_sha256 } : {},
      signed_receipts: binding ? { ...binding.signed_receipts } : null,
      receipt_claim_scope: binding?.signed_receipts.claim_scope ?? 'NOT_ESTABLISHED',
      runtime_output_signature: binding && id === 'SZLHOLDINGS/SZL-Khipu-1.5B-GGUF'
        ? 'UNSIGNED' : 'NOT_ESTABLISHED',
      limitations: binding ? [...binding.limitations] : [...(item?.limitations ?? [])],
      qualified_inference: 'NOT_ESTABLISHED',
      autonomous_execution: false,
      lambda_conjecture_1: 'OPEN',
      evidence: [
        ...sourceLinks(refs, ['catalog', ...(binding ? ['bindings'] : []), ...(item ? ['portfolio'] : [])]),
        { ...LAMBDA_PROOF },
      ],
    });
  }

  function gapsFor(id) {
    const { binding, item, classification } = entry(id);
    const gaps = [];
    const add = (code, detail, names) => gaps.push({ code, detail, evidence: sourceLinks(refs, names) });
    if (stale) add('CATALOG_STALE', 'The tracked public catalog is older than 30 days.', ['catalog']);
    if (!binding) add('CURATED_BINDING_MISSING', 'No curated model source binding covers this asset.', ['bindings']);
    if (!item) add('PORTFOLIO_ENTRY_MISSING', 'The scoped portfolio has no entry for this asset.', ['portfolio']);
    if (item && !item.github_source) add('SOURCE_UNBOUND', 'The portfolio does not identify a GitHub source.', ['portfolio']);
    if (classification === 'SOFTWARE') add('SOFTWARE_NOT_MODEL', 'This is software, not qualified model inference.', ['portfolio']);
    if (classification === 'RESEARCH_ONLY') add('RESEARCH_ONLY', 'Research evidence does not qualify autonomous inference.', ['bindings', 'portfolio']);
    if (classification === 'UNKNOWN') add('CLASSIFICATION_UNKNOWN', 'Available sources do not establish a qualifying class.', ['catalog', 'bindings', 'portfolio']);
    if (binding && item?.kind === 'software_kernel') {
      add('CLASSIFICATION_CONFLICT', 'Curated binding and scoped portfolio disagree on artifact class.', ['bindings', 'portfolio']);
    }
    if (binding) add('NOT_PROMOTED', 'The curated binding explicitly blocks promotion.', ['bindings']);
    if (binding && id === 'SZLHOLDINGS/SZL-Khipu-1.5B-GGUF') {
      add('RUNTIME_OUTPUT_UNSIGNED', 'Runtime outputs are unsigned; training and evaluation receipts do not cover them.', ['bindings']);
    }
    add('QUALIFIED_INFERENCE_NOT_ESTABLISHED', 'Catalog and source records do not establish qualified live inference.', ['catalog', 'bindings', 'portfolio']);
    return gaps;
  }

  function assessEvidenceGaps(args) {
    const id = checkedAssetId(args);
    return withDigest({
      schema: OUTPUT_SCHEMA,
      tool: 'assess_evidence_gaps',
      as_of: asOf,
      asset_id: id,
      gaps: gapsFor(id),
      qualified_inference: 'NOT_ESTABLISHED',
    });
  }

  function proposeNextStep(args) {
    const id = checkedAssetId(args);
    const { binding, item, classification } = entry(id);
    let step = 'REVIEW_BOUND_EVIDENCE';
    let reason = 'Review the bounded source, receipt scope, and missing qualification evidence.';
    if (classification === 'SOFTWARE') {
      step = 'REVIEW_SOFTWARE_CONTRACT';
      reason = 'Review software contracts and tests for this Hub model-type asset.';
    } else if (classification === 'RESEARCH_ONLY') {
      step = 'REVIEW_RESEARCH_EVALUATION';
      reason = 'Review the recorded evaluation limits before any use proposal.';
    } else if (!binding || !item || classification === 'UNKNOWN') {
      step = 'RECONCILE_SOURCE_BINDING';
      reason = 'Resolve missing or conflicting source classification evidence.';
    } else if (stale) {
      step = 'REFRESH_PUBLIC_CATALOG';
      reason = 'Review a new public catalog observation before current-state claims.';
    }
    return withDigest({
      schema: OUTPUT_SCHEMA,
      tool: 'propose_next_step',
      as_of: asOf,
      asset_id: id,
      classification,
      proposal: {
        step,
        reason,
        approval_required: true,
        approval_state: 'PENDING_HUMAN_REVIEW',
        execution: 'NOT_CONFIGURED',
        autonomous_execution: false,
      },
      gap_codes: gapsFor(id).map((gap) => gap.code),
      evidence: sourceLinks(refs, ['catalog', ...(binding ? ['bindings'] : []), ...(item ? ['portfolio'] : [])]),
    });
  }

  return { modelIds: [...modelIds], listCatalog, inspectAsset, assessEvidenceGaps, proposeNextStep };
}
