#!/usr/bin/env node
// Regenerates artifacts/mockup-sandbox/src/pages/patternAtlasMetadata.generated.ts
// by scanning lib/shared-ui/src/index.ts and each component's source file for
// its *Props interface (or inline destructured props).
//
// Run from repo root:  node artifacts/mockup-sandbox/scripts/generate-pattern-atlas-metadata.mjs

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), '../../..');
const SRC = path.join(ROOT, 'lib/shared-ui/src');
const INDEX = path.join(SRC, 'index.ts');
const OUT = path.join(ROOT, 'artifacts/mockup-sandbox/src/pages/patternAtlasMetadata.generated.ts');

function resolveFile(p) {
  const c = [`${p}.tsx`, `${p}.ts`, path.join(p, 'index.tsx'), path.join(p, 'index.ts')];
  for (const x of c) if (existsSync(x)) return x;
  return null;
}

function findTopColon(s) {
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if ('{[(<'.includes(ch)) depth++;
    else if ('}])>'.includes(ch)) depth--;
    else if (ch === ':' && depth === 0) return i;
  }
  return -1;
}

function findPropsInterface(src, name) {
  const pName = `${name}Props`;
  let re = new RegExp(`(?:export\\s+)?interface\\s+${pName}\\s*(?:extends[^{]+)?\\{([\\s\\S]*?)\\n\\}`, 'm');
  let mm = src.match(re);
  if (mm) return mm[1];
  re = new RegExp(`(?:export\\s+)?type\\s+${pName}\\s*=\\s*\\{([\\s\\S]*?)\\n\\}`, 'm');
  mm = src.match(re);
  if (mm) return mm[1];
  return null;
}

function findInlineProps(src, name) {
  const reFn = new RegExp(`(?:export\\s+)?(?:default\\s+)?function\\s+${name}\\s*\\(([\\s\\S]*?)\\)\\s*[:{]`, 'm');
  const reConstFn = new RegExp(`(?:export\\s+)?const\\s+${name}\\s*[:=][^=]*=\\s*\\(([\\s\\S]*?)\\)\\s*=>`, 'm');
  const reForwardRef = new RegExp(`(?:export\\s+)?const\\s+${name}\\s*=\\s*forwardRef[^(]*\\(\\s*\\(([\\s\\S]*?)\\)\\s*=>`, 'm');
  const sig = src.match(reFn)?.[1] || src.match(reConstFn)?.[1] || src.match(reForwardRef)?.[1];
  if (!sig) return null;
  const colonIdx = findTopColon(sig);
  if (colonIdx < 0) return null;
  const typeStr = sig.slice(colonIdx + 1).trim();
  const idMatch = typeStr.match(/^([A-Z]\w*)/);
  if (idMatch) {
    const tn = idMatch[1];
    let re = new RegExp(`(?:export\\s+)?interface\\s+${tn}\\s*(?:extends[^{]+)?\\{([\\s\\S]*?)\\n\\}`, 'm');
    let mm = src.match(re);
    if (mm) return mm[1];
    re = new RegExp(`(?:export\\s+)?type\\s+${tn}\\s*=\\s*\\{([\\s\\S]*?)\\n\\}`, 'm');
    mm = src.match(re);
    if (mm) return mm[1];
  }
  if (typeStr.startsWith('{')) {
    let depth = 0, start = -1;
    for (let i = 0; i < typeStr.length; i++) {
      if (typeStr[i] === '{') { if (depth === 0) start = i + 1; depth++; }
      else if (typeStr[i] === '}') { depth--; if (depth === 0) return typeStr.slice(start, i); }
    }
  }
  return null;
}

function bracketBalance(s) {
  // Count brackets, ignoring `>` that's part of `=>` arrow notation,
  // and ignoring `<`/`>` inside string/template literals.
  let opens = 0, closes = 0;
  let inStr = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (c === '\\') { i++; continue; }
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { inStr = c; continue; }
    if (c === '{' || c === '(' || c === '[' || c === '<') opens++;
    else if (c === '}' || c === ')' || c === ']') closes++;
    else if (c === '>') {
      if (s[i - 1] === '=') continue; // arrow `=>`
      closes++;
    }
  }
  return { opens, closes };
}

function parseFields(body) {
  body = body.replace(/\/\*[\s\S]*?\*\//g, '');
  const lines = body.split('\n');
  const out = [];
  let comment = '';
  let buf = '';
  for (const line of lines) {
    const t = line.trim();
    if (!t) { comment = ''; continue; }
    if (t.startsWith('//')) { comment = t.replace(/^\/\/\s*/, ''); continue; }
    buf += ` ${line}`;
    const { opens, closes } = bracketBalance(buf);
    if (opens === closes && /[;,]\s*$/.test(buf.trim())) {
      const ft = buf.trim().replace(/[;,]\s*$/, '');
      const ci = findTopColon(ft);
      if (ci > 0) {
        const nameRaw = ft.slice(0, ci).trim();
        const optional = nameRaw.endsWith('?');
        const fname = nameRaw.replace(/\?$/, '').replace(/^readonly\s+/, '');
        const ty = ft.slice(ci + 1).trim();
        if (/^[a-zA-Z_$][\w$]*$/.test(fname)) {
          out.push({ name: fname, type: ty.replace(/\s+/g, ' '), required: !optional, description: comment || '' });
        }
      }
      buf = ''; comment = '';
    }
  }
  return out;
}

function traceComponentToFile(name, file, depth = 0) {
  if (depth > 4) return null;
  let src;
  try { src = readFileSync(file, 'utf-8'); } catch { return null; }
  const declRe = new RegExp(`(?:export\\s+)?(?:default\\s+)?(?:function|const|let|var|class)\\s+${name}\\b`);
  if (declRe.test(src)) return file;
  const reExportRe = /export\s*(?:type\s*)?\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = reExportRe.exec(src))) {
    const inner = m[1], from = m[2];
    for (let item of inner.split(',')) {
      item = item.trim();
      if (!item) continue;
      const a = item.match(/^(\w+)\s+as\s+(\w+)$/);
      const fin = a ? a[2] : item.replace(/\s+as\s+\w+$/, '').trim();
      const orig = a ? a[1] : fin;
      if (fin === name) {
        const r = resolveFile(path.join(path.dirname(file), from));
        if (r) {
          const t = traceComponentToFile(orig, r, depth + 1);
          if (t) return t;
        }
      }
    }
  }
  const star = /export\s*\*\s*from\s*['"]([^'"]+)['"]/g;
  while ((m = star.exec(src))) {
    const r = resolveFile(path.join(path.dirname(file), m[1]));
    if (r) { const t = traceComponentToFile(name, r, depth + 1); if (t) return t; }
  }
  return null;
}

function categorize(name, _fromPath, source) {
  const lc = name.toLowerCase();
  if (source.includes('design-system')) {
    if (/(table|chart|kpi|metric|graph|tornado|pressure|confidence|review)/.test(lc)) return 'Data Display';
    if (/(shell|sidebar|footer|header|hero|cta|featuregrid|article|case)/.test(lc)) return 'Layout';
    if (/(alert|skeleton|empty|loading|error)/.test(lc)) return 'Feedback';
    if (/(audit|evidence|export|inquiry)/.test(lc)) return 'Forms & Drawers';
    return 'Design System';
  }
  if (source.includes('/pulse/') || name.startsWith('Pulse')) return 'Pulse';
  if (source.includes('document-engine')) return 'Document Engine';
  if (source.includes('/onboarding/')) return 'Onboarding';
  if (source.includes('/analytics')) return 'Analytics';
  if (source.includes('receipt-graph') || /Provenance|Receipt|Trust/.test(name)) return 'Receipt Graph';
  if (source.includes('operational-primitives') || name.startsWith('Operational')) return 'Operational Primitives';
  if (name.startsWith('Cortex')) return 'Cortex AI';
  if (/(autonomy|alloydecision|decisioncard|decisionshield|decisionreceipt|decisioncenter|simulation|whatif|recommendation|alloy)/.test(lc)) return 'AI Controls';
  if (/(constellation|knowledge|hierarchical|timelinegraph|nodedetail|graphlegend|graphstats|graphqldata|tornado|cohort|funnel|probabilitydensity|cumulativedist|confidenceband|scenariocomparison|simulationresult)/.test(lc)) return 'Visualization';
  if (/(twin|sourcehealth|freshness|status|sync|realtime|policyresult|policyverdict|stale|servicestatus)/.test(lc)) return 'Monitoring';
  if (/(audit|provenance|trace|explain|observability|eval|run|trustsummary)/.test(lc)) return 'Observability';
  if (/(banner|toast|notification|merge|alert|skeleton|empty|loading|error|tip|nps|feedback|micro|outcome|prompt|setupalert)/.test(lc)) return 'Feedback';
  if (/(auth|guard|role|gate|paywall|access)/.test(lc)) return 'Auth';
  if (/(badge|pill|chip|tag)/.test(lc)) return 'Identity';
  if (/(provider|tenant|brand|appmode|sandbox|demo|stakeholder|production|analyticsprovider)/.test(lc)) return 'Providers';
  if (/(settings|cookie|language|contact|inquiry|newsletter|live|user|welcome|gettingstarted|product)/.test(lc)) return 'Utility';
  if (/(card|panel|drawer)/.test(lc)) return 'Surfaces';
  if (/(timeline|nav|sidebar|footer|header|hero|cta|featuregrid|layout|dashboard|shell|ecosystem|atlas)/.test(lc)) return 'Layout';
  if (/(particle|energy|ambient)/.test(lc)) return 'Ambient';
  if (/(briefing|history|presence|multiplayer|crdt|merge)/.test(lc)) return 'Collaboration';
  return 'Other';
}

const STATUS_OVERRIDES = {
  CrdtEntityPanel: 'experimental', DigitalTwinCard: 'experimental',
  CortexVoice: 'experimental', CortexVoiceTrigger: 'experimental',
  ConstellationGraph: 'beta', CortexEntityGraph: 'beta', CortexWhatIf: 'beta',
  SimulationCockpit: 'beta', SimulationCockpitCompact: 'beta',
  SimulationProgressTracker: 'beta', SimulationResultCard: 'beta',
  KnowledgeGraphViz: 'beta', HierarchicalGraphViz: 'beta',
  TimelineGraphViz: 'beta', UnifiedKnowledgeGraphViz: 'beta',
  EnergyPulse: 'beta', ParticleField: 'experimental',
  PowerBiEmbed: 'beta', EntityCommentThread: 'beta',
  MultiplayerSessionBanner: 'beta', SessionPresenceBar: 'beta',
};

const TYPE_SUFFIXES = ['Props','Config','Options','Type','Types','Colors','Color','Styles','Style','Labels','Label','Status','Statuses','Mode','Event','Events','Context','Schema','Entry','Item','Items','Args','Params','Payload','Result','Response','Request','Error','Action','Actions','Spec','Def','Info','Meta','Map','Signal','Level','Severity','Category'];
function isComponent(n) { for (const s of TYPE_SUFFIXES) if (n.endsWith(s)) return false; return true; }

function shortType(t) {
  let s = String(t).replace(/\s+/g, ' ').trim();
  if (s.length > 120) s = `${s.slice(0, 117)}\u2026`;
  return s;
}

function main() {
  const indexSrc = readFileSync(INDEX, 'utf-8');
  const blockRe = /export\s*(?:type\s*)?\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g;
  const nameToOriginal = new Map();
  let m;
  while ((m = blockRe.exec(indexSrc))) {
    const inner = m[1], fromPath = m[2];
    for (let item of inner.split(',')) {
      item = item.trim();
      if (!item || item.startsWith('type ') || item === 'type') continue;
      const a = item.match(/^(\w+)\s+as\s+(\w+)$/);
      const fin = a ? a[2] : item.replace(/\s+as\s+\w+$/, '').trim();
      const orig = a ? a[1] : fin;
      if (fin === 'default') continue;
      if (!nameToOriginal.has(fin)) nameToOriginal.set(fin, { fromPath, originalName: orig });
    }
  }

  const components = [...nameToOriginal.keys()]
    .filter((n) => /^[A-Z]/.test(n) && !/^[A-Z][A-Z0-9_]+$/.test(n) && isComponent(n))
    .sort();

  const lines = [];
  lines.push('// Auto-generated by scripts/generate-pattern-atlas-metadata.mjs \u2014 do not edit.');
  lines.push('// Regenerate when lib/shared-ui exports change.');
  lines.push('');
  lines.push('export interface GeneratedPropDef {');
  lines.push('  name: string;');
  lines.push('  type: string;');
  lines.push('  required: boolean;');
  lines.push('  description: string;');
  lines.push('}');
  lines.push('');
  lines.push('export interface GeneratedComponentMeta {');
  lines.push('  category: string;');
  lines.push('  status: "stable" | "beta" | "experimental";');
  lines.push('  source: string;');
  lines.push('  props: GeneratedPropDef[];');
  lines.push('}');
  lines.push('');
  lines.push('export const GENERATED_METADATA: Record<string, GeneratedComponentMeta> = {');

  for (const name of components) {
    const { fromPath, originalName } = nameToOriginal.get(name);
    const startFile = resolveFile(path.join(SRC, fromPath));
    let actualFile = startFile;
    if (startFile) {
      const traced = traceComponentToFile(originalName, startFile);
      if (traced) actualFile = traced;
    }
    let propsList = [];
    if (actualFile) {
      const src = readFileSync(actualFile, 'utf-8');
      const found = findPropsInterface(src, originalName);
      if (found) propsList = parseFields(found);
      else {
        const inline = findInlineProps(src, originalName);
        if (inline) propsList = parseFields(inline);
      }
    }
    const sourceRel = actualFile ? path.relative(ROOT, actualFile) : `lib/shared-ui/src/${fromPath.replace(/^\.\//, '')}`;
    const cat = categorize(name, fromPath, sourceRel);
    const status = STATUS_OVERRIDES[name] ?? 'stable';
    lines.push(`  ${JSON.stringify(name)}: {`);
    lines.push(`    category: ${JSON.stringify(cat)},`);
    lines.push(`    status: ${JSON.stringify(status)},`);
    lines.push(`    source: ${JSON.stringify(sourceRel)},`);
    lines.push(`    props: [`);
    for (const p of propsList) {
      lines.push(`      { name: ${JSON.stringify(p.name)}, type: ${JSON.stringify(shortType(p.type))}, required: ${p.required}, description: ${JSON.stringify(p.description || '')} },`);
    }
    lines.push(`    ],`);
    lines.push(`  },`);
  }
  lines.push('};');
  lines.push('');

  writeFileSync(OUT, lines.join('\n'));
}

main();
