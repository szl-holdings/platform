// Public-facing /governance route — Track C-01
// Drop-in from operational_payload/patches/governance-page.tsx.
// Existing internal pages (trust-governance, governance-posture) are unaffected;
// the public route lives at /governance and the legacy internal page at /internal/governance.

import { useEffect, useState } from "react";

type GovernanceStats = {
  anchored_total: number;
  last_anchored_at: string | null;
  agents: string[];
  last_trust_publish: string;
  schema?: string;
};

const TRUST_DOCS = [
  { id: "A11OY-01", title: "FedRAMP Authorization Disclosure", reviewed: "2026-04-30", version: "1.0" },
  { id: "A11OY-02", title: "CMMC 2.0 / NIST SP 800-171 Rev. 3 Gap Assessment", reviewed: "2026-04-30", version: "1.0" },
  { id: "A11OY-03", title: "Bias Testing Methodology", reviewed: "2026-04-30", version: "1.0" },
  { id: "A11OY-04", title: "US Data Residency Policy", reviewed: "2026-04-30", version: "1.0" },
  { id: "A11OY-05", title: "72-Hour Incident Response Procedure", reviewed: "2026-04-30", version: "1.0" },
  { id: "SENTRA-01", title: "SOC 2 Type II Plan", reviewed: "2026-04-30", version: "1.0" },
  { id: "SENTRA-02", title: "Incident Response Runbook", reviewed: "2026-04-30", version: "1.0" },
  { id: "SENTRA-03", title: "Threat Feed Catalog", reviewed: "2026-04-30", version: "1.0" },
  { id: "SENTRA-04", title: "Penetration Testing Plan", reviewed: "2026-04-30", version: "1.0" },
  { id: "AMARU-01", title: "Data Classification Policy (CUI/PII/Public)", reviewed: "2026-04-30", version: "1.0" },
  { id: "AMARU-02", title: "Retention and Deletion Policy", reviewed: "2026-04-30", version: "1.0" },
  { id: "AMARU-03", title: "COTS-ERP Integration Posture", reviewed: "2026-04-30", version: "1.0" },
  { id: "AMARU-04", title: "Privacy Impact Assessment Template", reviewed: "2026-04-30", version: "1.0" },
];

const NYSTEC_MAP: Array<[string, string, string, string]> = [
  ["A11oy",  "FedRAMP authorization disclosure",   "A11OY-01",  "Published"],
  ["A11oy",  "CMMC / NIST SP 800-171",              "A11OY-02",  "Published"],
  ["A11oy",  "Bias testing methodology",            "A11OY-03",  "Published"],
  ["A11oy",  "US-only data residency",              "A11OY-04",  "Published"],
  ["A11oy",  "72-hr incident response",             "A11OY-05",  "Published"],
  ["Sentra", "SOC 2 Type II",                       "SENTRA-01", "Plan published; Type II 2027-Q4"],
  ["Sentra", "Incident response runbook",           "SENTRA-02", "Published"],
  ["Sentra", "Threat feed catalog",                 "SENTRA-03", "Published"],
  ["Sentra", "Penetration testing",                 "SENTRA-04", "Plan + current letter on request"],
  ["Amaru",  "Data classification",                 "AMARU-01",  "Published"],
  ["Amaru",  "Retention / deletion",                "AMARU-02",  "Published"],
  ["Amaru",  "COTS-ERP integration",                "AMARU-03",  "Published"],
  ["Amaru",  "Privacy impact assessment",           "AMARU-04",  "Template published"],
];

export default function GovernancePage() {
  const [stats, setStats] = useState<GovernanceStats | null>(null);
  const [statsErr, setStatsErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/governance/stats")
      .then((r) => (r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`)))
      .then((d) => alive && setStats(d))
      .catch((e) => alive && setStatsErr(String(e)));
    return () => { alive = false; };
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 text-slate-100">
      <section className="border-b border-slate-800 pb-12">
        <h1 className="text-5xl font-semibold tracking-tight">Governance you can replay.</h1>
        <p className="mt-6 max-w-3xl text-lg text-slate-300">
          Every decision our AI makes is anchored in an append-only evidence ledger.
          Anyone, anywhere, can replay any production public run to its primary source.
          This page is the index.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/replay-attestation" className="rounded bg-emerald-500 px-5 py-3 font-medium text-slate-900 hover:bg-emerald-400">
            Replay an attestation
          </a>
          <a href="/demo" className="rounded border border-slate-700 px-5 py-3 hover:border-slate-500">
            Watch the 90-second demo
          </a>
          <a href="mailto:inquiries@szlholdings.com" className="rounded border border-slate-700 px-5 py-3 hover:border-slate-500">
            Email procurement
          </a>
        </div>
      </section>

      <section className="border-b border-slate-800 py-12" id="public-agents">
        <h2 className="text-2xl font-semibold">Live evidence-ledger header</h2>
        <p className="mt-2 text-slate-400">
          Counts come from the public append-only ledger. Each anchored run is independently
          replayable via <a className="underline" href="/replay-attestation">/replay-attestation</a>.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Tile label="Anchored public runs" value={stats?.anchored_total} />
          <Tile label="Public agents" value={stats?.agents?.length ?? 0} />
          <Tile label="Last anchored" value={stats?.last_anchored_at ?? "—"} isText />
          <Tile label="Last trust publish" value={stats?.last_trust_publish} isText />
        </div>
        {stats?.agents && stats.agents.length > 0 && (
          <p className="mt-4 text-sm text-slate-400">
            Active public agents:{" "}
            {stats.agents.map((a, i) => (
              <span key={a} className="font-mono">
                {a}{i < stats.agents.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        )}
        {statsErr && <p className="mt-4 text-sm text-amber-400">Stats endpoint unreachable: {statsErr}</p>}
      </section>

      <section className="border-b border-slate-800 py-12">
        <h2 className="text-2xl font-semibold">Trust &amp; compliance documents</h2>
        <table className="mt-6 w-full text-sm">
          <thead className="text-left text-slate-400">
            <tr>
              <th className="py-2 pr-4">ID</th>
              <th className="py-2 pr-4">Title</th>
              <th className="py-2 pr-4">Version</th>
              <th className="py-2 pr-4">Last reviewed</th>
              <th className="py-2 pr-4">Read</th>
              <th className="py-2 pr-4">Source</th>
            </tr>
          </thead>
          <tbody>
            {TRUST_DOCS.map((d) => (
              <tr key={d.id} className="border-t border-slate-800">
                <td className="py-2 pr-4 font-mono text-xs">{d.id}</td>
                <td className="py-2 pr-4">{d.title}</td>
                <td className="py-2 pr-4">{d.version}</td>
                <td className="py-2 pr-4 text-slate-400">{d.reviewed}</td>
                <td className="py-2 pr-4"><a className="underline" href={`/trust/${d.id}`}>read</a></td>
                <td className="py-2 pr-4">
                  <a className="underline" target="_blank" rel="noreferrer"
                     href={`https://github.com/szl-holdings/szl-holdings-platform/blob/master/docs/trust/${d.id.toLowerCase()}-${docSlug(d.id)}.md`}>
                    github
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="border-b border-slate-800 py-12">
        <h2 className="text-2xl font-semibold">NYSTEC alignment summary</h2>
        <p className="mt-2 text-slate-400">
          Mapped to the April 2026 NYSTEC pre-briefing. Updated as documents revise.
        </p>
        <table className="mt-6 w-full text-sm">
          <thead className="text-left text-slate-400">
            <tr>
              <th className="py-2 pr-4">Product</th>
              <th className="py-2 pr-4">NYSTEC gap</th>
              <th className="py-2 pr-4">Closing document</th>
              <th className="py-2 pr-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {NYSTEC_MAP.map(([product, gap, docId, status]) => (
              <tr key={`${product}-${gap}`} className="border-t border-slate-800">
                <td className="py-2 pr-4">{product}</td>
                <td className="py-2 pr-4">{gap}</td>
                <td className="py-2 pr-4 font-mono text-xs">
                  <a className="underline" href={`/trust/${docId}`}>{docId}</a>
                </td>
                <td className="py-2 pr-4 text-slate-300">{status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="border-b border-slate-800 py-12">
        <h2 className="text-2xl font-semibold">Researchers &amp; coordinated disclosure</h2>
        <p className="mt-4 max-w-3xl text-slate-300">
          Report security findings to <a className="underline" href="mailto:security@szlholdings.com">security@szlholdings.com</a>.
          Our coordinated-disclosure policy and PGP key fingerprint are published in our&nbsp;
          <a className="underline" href="/.well-known/security.txt">security.txt</a>.
        </p>
      </section>

      <section className="py-12 text-slate-400">
        <p>
          <strong className="text-slate-100">SZL Holdings</strong> · United States ·{" "}
          <a className="underline" href="mailto:inquiries@szlholdings.com">inquiries@szlholdings.com</a>
        </p>
      </section>
    </main>
  );
}

function docSlug(id: string): string {
  const slugs: Record<string, string> = {
    "A11OY-01": "fedramp-authorization-disclosure",
    "A11OY-02": "cmmc-nist-800-171-gap-assessment",
    "A11OY-03": "bias-testing-methodology",
    "A11OY-04": "us-data-residency",
    "A11OY-05": "incident-response-72hr",
    "SENTRA-01": "soc2-type-2-plan",
    "SENTRA-02": "incident-response-runbook",
    "SENTRA-03": "threat-feed-catalog",
    "SENTRA-04": "penetration-testing-plan",
    "AMARU-01": "data-classification",
    "AMARU-02": "retention-deletion",
    "AMARU-03": "cots-erp-integration",
    "AMARU-04": "privacy-impact-assessment",
  };
  return slugs[id] ?? "";
}

function Tile({ label, value, isText = false }: { label: string; value?: number | string; isText?: boolean }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-900 p-5">
      <div className="text-xs uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold">
        {value === undefined ? <span className="text-slate-600">—</span> : isText ? value : value.toLocaleString()}
      </div>
    </div>
  );
}
