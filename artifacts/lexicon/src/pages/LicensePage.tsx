import { useState } from 'react';
import { useParams, Link } from 'wouter';
import {
  ArrowLeft,
  Copy,
  Check,
  X,
  Code2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Download,
  GitCompare,
  Shield,
  FileText,
} from 'lucide-react';
import {
  getLicenseById,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  PERMISSIONS,
  CONDITIONS,
  LIMITATIONS,
} from '@/data/licenses';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '/lexicon';

export default function LicensePage() {
  const params = useParams<{ id: string }>();
  const license = getLicenseById(params.id || '');
  const [textExpanded, setTextExpanded] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  if (!license) {
    return (
      <div className="max-w-2xl mx-auto mt-24 px-6 text-center animate-fade-in">
        <div className="w-20 h-20 bg-lexicon-surface-raised border border-lexicon-border rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FileText size={32} className="text-lexicon-text-muted" />
        </div>
        <h1 className="text-3xl font-extrabold text-lexicon-text mb-4">License Not Found</h1>
        <p className="text-lexicon-text-muted mb-8 text-lg">
          We couldn't find a license matching "
          <code className="text-lexicon-blue bg-lexicon-blue/10 px-2 py-0.5 rounded font-mono">
            {params.id}
          </code>
          " in the catalog.
        </p>
        <Link href={`${BASE}/`}>
          <span
            className="inline-flex items-center gap-2 px-6 py-3 bg-lexicon-blue hover:bg-lexicon-blue-dim text-lexicon-surface font-semibold rounded-lg transition-colors cursor-pointer"
            data-testid="link-back-catalog"
          >
            <ArrowLeft size={18} /> Back to Catalog
          </span>
        </Link>
      </div>
    );
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    });
  }

  const hfYaml = `---\nlicense: ${license.id}\n---`;
  const licenseBadge = `[![License: ${license.id}](https://img.shields.io/badge/License-${encodeURIComponent(license.shortName || license.id)}-blue.svg)](${license.fullTextUrl || '#'})`;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Back */}
      <Link href={`${BASE}/`}>
        <span
          className="inline-flex items-center gap-1.5 text-sm font-medium text-lexicon-text-muted hover:text-lexicon-text transition-colors mb-8 cursor-pointer"
          data-testid="link-back-nav"
        >
          <ArrowLeft size={16} /> Back to Catalog
        </span>
      </Link>

      {/* Header */}
      <div className="mb-10 border-b border-lexicon-border pb-8">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <code className="text-xl md:text-2xl font-mono font-extrabold text-lexicon-blue bg-lexicon-blue/10 px-2.5 py-0.5 rounded-lg border border-lexicon-blue/20">
                {license.id}
              </code>
              {license.spdxId && (
                <span className="text-xs font-semibold px-2 py-1 bg-lexicon-surface-raised text-lexicon-text border border-lexicon-border rounded-md shadow-sm">
                  SPDX: {license.spdxId}
                </span>
              )}
              {!license.onHuggingFace && (
                <span className="text-xs font-bold px-2 py-1 bg-lexicon-purple/15 text-lexicon-purple border border-lexicon-purple/30 rounded-md uppercase tracking-wide">
                  +LEXICON (not on HF)
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-lexicon-text mb-4 leading-tight">
              {license.name}
            </h1>
            <div className="flex flex-wrap gap-2.5">
              <span
                className={`text-xs font-bold px-3 py-1.5 rounded-md uppercase tracking-wider ${CATEGORY_COLORS[license.category]}`}
              >
                {CATEGORY_LABELS[license.category]}
              </span>
              <span className="text-xs font-medium px-3 py-1.5 rounded-md bg-lexicon-surface-raised text-lexicon-text-muted border border-lexicon-border flex items-center gap-1.5">
                <GitCompare size={14} className="opacity-50" /> {license.family} Family
              </span>
              {license.yearIntroduced && (
                <span className="text-xs font-medium px-3 py-1.5 rounded-md bg-lexicon-surface-raised text-lexicon-text-muted border border-lexicon-border">
                  Est. {license.yearIntroduced}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0 lg:mt-2">
            <Link href={`${BASE}/compare?ids=${license.id}`}>
              <span
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-lexicon-blue/10 hover:bg-lexicon-blue/20 text-lexicon-blue border border-lexicon-blue/30 rounded-lg text-sm font-semibold transition-colors cursor-pointer shadow-[0_0_15px_rgba(79,142,247,0.1)]"
                data-testid="button-compare-lic"
              >
                <GitCompare size={16} /> Compare
              </span>
            </Link>
            {license.fullTextUrl && (
              <a
                href={license.fullTextUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-lexicon-surface-raised hover:bg-lexicon-surface-raised-hover text-lexicon-text border border-lexicon-border hover:border-lexicon-text-muted rounded-lg text-sm font-semibold transition-colors"
                data-testid="link-external-source"
              >
                <ExternalLink size={16} /> Source
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
        {/* Main content */}
        <div className="flex flex-col gap-8">
          {/* TL;DR */}
          <section className="bg-lexicon-surface-raised border border-lexicon-border rounded-xl p-6 md:p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-lexicon-blue"></div>
            <h2 className="text-xs font-bold text-lexicon-text-muted uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
              <Shield size={14} className="text-lexicon-blue" /> Executive Summary
            </h2>
            <p className="text-lexicon-text text-lg leading-relaxed font-medium">{license.tldr}</p>
          </section>

          {/* Permissions / Conditions / Limitations */}
          <section className="bg-lexicon-surface-raised border border-lexicon-border rounded-xl overflow-hidden shadow-sm">
            <div className="bg-lexicon-surface px-6 py-4 border-b border-lexicon-border">
              <h2 className="text-sm font-bold text-lexicon-text uppercase tracking-wide">
                Rights & Obligations
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-lexicon-border">
              {/* Permissions */}
              <div className="p-6 bg-lexicon-green/5">
                <h3 className="text-xs font-bold text-lexicon-green uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Check size={14} /> Permissions
                </h3>
                {license.permissions.length === 0 ? (
                  <p className="text-sm text-lexicon-text-muted italic">None explicitly granted</p>
                ) : (
                  <ul className="space-y-3">
                    {license.permissions.map((p) => (
                      <li
                        key={p}
                        className="text-sm text-lexicon-text font-medium flex items-start gap-2 group"
                        title={PERMISSIONS[p]?.description}
                      >
                        <span className="text-lexicon-green mt-0.5 opacity-50 group-hover:opacity-100 transition-opacity">
                          ✓
                        </span>
                        <span>{PERMISSIONS[p]?.label || p}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Conditions */}
              <div className="p-6 bg-lexicon-amber/5">
                <h3 className="text-xs font-bold text-lexicon-amber uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="text-[10px]">◉</span> Conditions
                </h3>
                {license.conditions.length === 0 ? (
                  <p className="text-sm text-lexicon-text-muted italic">No conditions</p>
                ) : (
                  <ul className="space-y-3">
                    {license.conditions.map((c) => (
                      <li
                        key={c}
                        className="text-sm text-lexicon-text font-medium flex items-start gap-2 group"
                        title={CONDITIONS[c]?.description}
                      >
                        <span className="text-lexicon-amber mt-0.5 opacity-50 group-hover:opacity-100 transition-opacity">
                          ◉
                        </span>
                        <span>{CONDITIONS[c]?.label || c}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Limitations */}
              <div className="p-6 bg-lexicon-red/5">
                <h3 className="text-xs font-bold text-lexicon-red uppercase tracking-wider mb-4 flex items-center gap-2">
                  <X size={14} /> Limitations
                </h3>
                {license.limitations.length === 0 ? (
                  <p className="text-sm text-lexicon-text-muted italic">None specified</p>
                ) : (
                  <ul className="space-y-3">
                    {license.limitations.map((l) => (
                      <li
                        key={l}
                        className="text-sm text-lexicon-text font-medium flex items-start gap-2 group"
                        title={LIMITATIONS[l]?.description}
                      >
                        <span className="text-lexicon-red mt-0.5 opacity-50 group-hover:opacity-100 transition-opacity">
                          ✗
                        </span>
                        <span>{LIMITATIONS[l]?.label || l}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          {/* Details */}
          <section className="bg-lexicon-surface-raised border border-lexicon-border rounded-xl p-6 md:p-8 shadow-sm">
            <h2 className="text-sm font-bold text-lexicon-text uppercase tracking-wide mb-4">
              Detailed Analysis
            </h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-lexicon-text-muted text-[15px] leading-relaxed">
                {license.summary}
              </p>
            </div>
            {license.notHuggingFaceNote && (
              <div className="mt-6 p-4 bg-lexicon-purple/10 border border-lexicon-purple/30 rounded-lg flex items-start gap-3">
                <div className="p-1 bg-lexicon-purple/20 rounded text-lexicon-purple mt-0.5">
                  <Shield size={14} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-lexicon-purple uppercase tracking-wider mb-1">
                    Lexicon Note
                  </h4>
                  <p className="text-sm text-lexicon-purple/90">{license.notHuggingFaceNote}</p>
                </div>
              </div>
            )}
          </section>

          {/* Compatibility */}
          {(license.compatibleWith.length > 0 || license.incompatibleWith.length > 0) && (
            <section className="bg-lexicon-surface-raised border border-lexicon-border rounded-xl overflow-hidden shadow-sm">
              <div className="bg-lexicon-surface px-6 py-4 border-b border-lexicon-border flex justify-between items-center">
                <h2 className="text-sm font-bold text-lexicon-text uppercase tracking-wide">
                  Ecosystem Compatibility
                </h2>
                <Link href={`${BASE}/matrix`}>
                  <span className="text-xs text-lexicon-blue hover:underline cursor-pointer">
                    View full matrix
                  </span>
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-lexicon-border">
                <div className="p-6">
                  <h3 className="text-xs font-bold text-lexicon-green uppercase tracking-wider mb-4 flex items-center gap-2">
                    Compatible With
                  </h3>
                  {license.compatibleWith.length === 0 ? (
                    <p className="text-sm text-lexicon-text-muted italic">
                      None explicitly documented
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {license.compatibleWith.map((id) => (
                        <Link key={id} href={`${BASE}/license/${id}`}>
                          <span className="text-xs font-mono font-semibold px-2.5 py-1.5 rounded-md bg-lexicon-green/10 text-lexicon-green border border-lexicon-green/20 hover:bg-lexicon-green/20 transition-colors cursor-pointer shadow-sm">
                            {id}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xs font-bold text-lexicon-red uppercase tracking-wider mb-4 flex items-center gap-2">
                    Incompatible With
                  </h3>
                  {license.incompatibleWith.length === 0 ? (
                    <p className="text-sm text-lexicon-text-muted italic">
                      None explicitly documented
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {license.incompatibleWith.map((id) => (
                        <Link key={id} href={`${BASE}/license/${id}`}>
                          <span className="text-xs font-mono font-semibold px-2.5 py-1.5 rounded-md bg-lexicon-red/10 text-lexicon-red border border-lexicon-red/20 hover:bg-lexicon-red/20 transition-colors cursor-pointer shadow-sm">
                            {id}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Full Text */}
          {license.fullText && (
            <section className="bg-lexicon-surface-raised border border-lexicon-border rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => setTextExpanded(!textExpanded)}
                className="w-full px-6 py-5 bg-lexicon-surface flex justify-between items-center hover:bg-lexicon-surface-raised transition-colors focus:outline-none"
                data-testid="button-toggle-text"
              >
                <h2 className="text-sm font-bold text-lexicon-text uppercase tracking-wide flex items-center gap-2">
                  <FileText size={16} /> Original License Text
                </h2>
                <div className="flex items-center gap-2 text-xs font-semibold text-lexicon-text-muted bg-lexicon-surface-raised border border-lexicon-border px-3 py-1.5 rounded-md">
                  {textExpanded ? (
                    <>
                      <ChevronUp size={14} /> Hide
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} /> Show
                    </>
                  )}
                </div>
              </button>

              {textExpanded && (
                <div className="p-6 md:p-8 bg-[#0a101d] border-t border-lexicon-border animate-fade-in overflow-x-auto">
                  <pre className="text-[13px] font-mono text-lexicon-text-muted/80 leading-relaxed whitespace-pre-wrap break-words">
                    {license.fullText}
                  </pre>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-20">
          {/* Implementation Panel */}
          <div className="bg-lexicon-surface-raised border border-lexicon-blue/30 rounded-xl p-6 shadow-[0_0_30px_rgba(79,142,247,0.05)]">
            <h2 className="text-sm font-bold text-lexicon-text uppercase tracking-wide flex items-center gap-2 mb-6">
              <Code2 size={16} className="text-lexicon-blue" /> Implement
            </h2>

            {/* HF YAML */}
            <div className="mb-5 group">
              <div className="flex justify-between items-end mb-2">
                <div className="text-xs font-bold text-lexicon-text-muted uppercase tracking-wider">
                  Hugging Face YAML
                </div>
              </div>
              <div className="relative bg-[#050810] border border-lexicon-border rounded-lg p-3 group-hover:border-lexicon-blue/50 transition-colors">
                <pre className="text-xs font-mono text-lexicon-purple m-0 leading-normal">
                  {hfYaml}
                </pre>
                <button
                  onClick={() => copy(hfYaml, 'yaml')}
                  title="Copy YAML"
                  className={`absolute top-2 right-2 p-1.5 rounded-md bg-lexicon-surface-raised border transition-all ${copied === 'yaml' ? 'text-lexicon-green border-lexicon-green/50' : 'text-lexicon-text-muted border-lexicon-border hover:text-lexicon-text hover:border-lexicon-text-muted'}`}
                  data-testid="button-copy-yaml"
                >
                  {copied === 'yaml' ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Badge */}
            <div className="mb-6 group">
              <div className="text-xs font-bold text-lexicon-text-muted uppercase tracking-wider mb-2">
                Markdown Badge
              </div>
              <div className="relative bg-[#050810] border border-lexicon-border rounded-lg p-3 group-hover:border-lexicon-blue/50 transition-colors">
                <div className="text-[11px] font-mono text-lexicon-text-muted/70 break-all pr-8">
                  {licenseBadge}
                </div>
                <button
                  onClick={() => copy(licenseBadge, 'badge')}
                  title="Copy badge"
                  className={`absolute top-2 right-2 p-1.5 rounded-md bg-lexicon-surface-raised border transition-all ${copied === 'badge' ? 'text-lexicon-green border-lexicon-green/50' : 'text-lexicon-text-muted border-lexicon-border hover:text-lexicon-text hover:border-lexicon-text-muted'}`}
                  data-testid="button-copy-badge"
                >
                  {copied === 'badge' ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Download LICENSE file */}
            {license.fullText && (
              <button
                onClick={() => {
                  const blob = new Blob([license.fullText!], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'LICENSE';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-lexicon-blue text-lexicon-surface font-bold text-sm rounded-lg hover:bg-lexicon-blue-dim transition-colors shadow-[0_0_15px_rgba(79,142,247,0.2)] hover:shadow-[0_0_20px_rgba(79,142,247,0.4)]"
                data-testid="button-download"
              >
                <Download size={16} /> Download LICENSE
              </button>
            )}
          </div>

          {/* Metadata */}
          <div className="bg-lexicon-surface-raised border border-lexicon-border rounded-xl p-6">
            <h2 className="text-xs font-bold text-lexicon-text-muted uppercase tracking-wider mb-4">
              Metadata
            </h2>
            <div className="space-y-3">
              {license.steward && <MetaRow label="Steward" value={license.steward} />}
              {license.yearIntroduced && (
                <MetaRow label="Year" value={String(license.yearIntroduced)} />
              )}
              <MetaRow label="Family" value={license.family} />
              <MetaRow
                label="HF Native"
                value={license.onHuggingFace ? 'Yes' : 'No'}
                isPositive={license.onHuggingFace}
              />
            </div>
          </div>

          {/* Context */}
          {(license.notableAdopters?.length || license.recommendedFor?.length) && (
            <div className="bg-lexicon-surface-raised border border-lexicon-border rounded-xl p-6">
              {license.recommendedFor && license.recommendedFor.length > 0 && (
                <div className="mb-5 last:mb-0">
                  <h2 className="text-xs font-bold text-lexicon-green uppercase tracking-wider mb-3">
                    Recommended For
                  </h2>
                  <ul className="space-y-2">
                    {license.recommendedFor.map((r) => (
                      <li key={r} className="text-sm text-lexicon-text flex items-start gap-2">
                        <span className="text-lexicon-green mt-0.5">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {license.notableAdopters && license.notableAdopters.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold text-lexicon-text-muted uppercase tracking-wider mb-3">
                    Notable Adopters
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {license.notableAdopters.map((a) => (
                      <span
                        key={a}
                        className="text-xs font-medium px-2.5 py-1 bg-lexicon-surface border border-lexicon-border text-lexicon-text rounded-md shadow-sm"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetaRow({
  label,
  value,
  isPositive,
}: {
  label: string;
  value: string;
  isPositive?: boolean;
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-lexicon-border/50 last:border-0 last:pb-0">
      <span className="text-sm text-lexicon-text-muted">{label}</span>
      <span
        className={`text-sm font-semibold ${isPositive !== undefined ? (isPositive ? 'text-lexicon-green' : 'text-lexicon-purple') : 'text-lexicon-text'}`}
      >
        {value}
      </span>
    </div>
  );
}
