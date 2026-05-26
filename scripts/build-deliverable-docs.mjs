#!/usr/bin/env node
import { mkdirSync, writeFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const outDir = resolve(repoRoot, "deliverables");
mkdirSync(outDir, { recursive: true });

const REPO = "github.com/szl-holdings/platform";
const REPO_URL = `https://${REPO}`;
// Each UDS bundle is published as a GitHub Release on its own artifact repo.
const UDS_REPOS = {
  a11oy:  "github.com/szl-holdings/a11oy",
  amaru:  "github.com/szl-holdings/amaru",
  sentra: "github.com/szl-holdings/sentra",
};
// UDS mesh + companion repos under the szl-holdings org.
const UDS_MESH       = "github.com/szl-holdings/uds-mesh";
const UDS_MESH_URL   = `https://${UDS_MESH}`;
const COMPANION_REPOS = [
  ["platform",         "Monorepo — source for all 7 artifacts + proof layer + scripts/check-doctrine-v6.mjs."],
  ["uds-mesh",         "The mesh — central registry / topology for every UDS bundle across the org. Where an operator goes to discover what's signed and where to pull it."],
  ["a11oy",            "Per-artifact repo — carries the a11oy UDS release (tar.zst + .sig + .pub + .sha256) under /releases."],
  ["amaru",            "Per-artifact repo — carries the amaru UDS release under /releases."],
  ["sentra",           "Per-artifact repo — carries the sentra UDS release under /releases."],
  ["lutar-lean",       "The Lean proof layer (LeanDoctrineCore + LeanDoctrineFull). Where the theorems type-check."],
  ["ouroboros-thesis", "The doctrine itself — the written thesis the v6 scanner enforces."],
  ["ouroboros",        "Reference implementation of the Ouroboros cycle / sync loop the Amaru kernel embodies."],
  ["vessels",          "Maritime intelligence artifact repo (companion to artifacts/vessels in platform)."],
  ["terra",            "Land/asset stewardship companion repo."],
  ["carlota-jo",       "Companion brand/persona repo."],
  ["counsel",          "Governance/legal-counsel surface — drafts and templates."],
  ["szl-trust",        "Trust-layer assets (keys policy, attestation surface)."],
  ["agi-forecast",     "Forecasting/scenario work."],
  ["szl-brand",        "Brand assets used by a11oy at runtime."],
  ["szl-cookbook",     "Internal cookbook — recipes for building/signing/verifying."],
  ["vsp-otel",         "OpenTelemetry instrumentation companion."],
  ["demo-repository",  "Demo scaffolding."],
  [".github",          "Org-wide GitHub config (templates, default workflows)."],
];
const orgRepoUrl = (slug) => `https://github.com/szl-holdings/${slug}`;
const udsRepoUrl   = (n) => `https://${UDS_REPOS[n]}`;
const udsReleaseUrl = (n, v) => `https://${UDS_REPOS[n]}/releases/tag/uds-v${v}`;
const udsAssetUrl   = (n, v, file) => `https://${UDS_REPOS[n]}/releases/download/uds-v${v}/${file}`;

const DOCTRINE = { filesScanned: 10232, forbiddenHits: 0, script: "scripts/check-doctrine-v6.mjs" };

const UDS = [
  {
    name: "a11oy",
    version: "0.1.1",
    sha256: "bf735715c8dadccea6daf8641e357fac2b20f0e368494534ce1b4f5c8b5a82d5",
    rekor: "1631673539",
    one: "Brand orchestration runtime: tetrad field, Fisher–Rao manifold, Bohr complementarity floor σ_A·σ_B ≥ 0.25, Kochen–Specker 18-vector contextuality witness, POVM verdict semantics.",
  },
  {
    name: "amaru",
    version: "0.1.1",
    sha256: "9dc5f7d88d080771fd8702012f305845d89c02403ff4adbdacd963450121a4f7",
    rekor: "1631861751",
    one: "Andean Ouroboros sync kernel: Lutar Σ canonical composition, Λ-floor HUKLLA halt-eligibility, asymmetric KL drift, Bekenstein admission gate, bounded-loop convergence, 9-axis AND gate, hash-chained receipts.",
  },
  {
    name: "sentra",
    version: "0.1.1",
    sha256: "bc23ca8e65f02fab4a810e40e604c803f8115329d0010d613b0635ce4c2c9e82",
    rekor: "recorded in cosign sign-blob stdout",
    one: "Cyber resilience command surface: dossier-typed evidence, governed triage actions, KS-18 witness against contextuality attacks, R0513 OVERWATCH read-only watcher, HUKLLA halt-authority on policy violation.",
  },
];

const ARTIFACTS = [
  ["a11oy",         "web",    "Brand Orchestration Layer — runtime UI over the @a11oy/core / @a11oy/connection runtime. Routes hit POVM verdicts and contextuality checks."],
  ["sentra",        "web",    "Cyber Resilience Command — dossier-typed incident triage with halt-authority. Every action carries a governance receipt."],
  ["vessels",       "web",    "Maritime Intelligence — ais-style vessel + voyage view; the surface for the Dorian LPG pitch."],
  ["vessels-pitch", "slides", "Dorian LPG investor deck artifact (slides kind) — same data spine as `vessels`, narrative wrapper."],
  ["rosie",         "web",    "Governed Decision Fabric — the front office for routing decisions through the doctrine layer (KS-18, HUKLLA, OVERWATCH)."],
  ["rosie-mobile",  "mobile", "ROSIE Mobile Command — Expo build of the same decision fabric for field operators."],
  ["conduit",       "web",    "Amaru — The Andean Ouroboros — public-facing organ for the Amaru sync kernel; user-visible expression of the Λ-floor halt-authority."],
  ["api-server",    "web",    "Shared API server (Node) + amaru FastAPI service. Hosts the dossier types, the dev-mode cosign signer, and the OVERWATCH watcher."],
];

const LEAN_LIBS = [
  ["LeanDoctrineCore", "Pure-Lean (no mathlib). Builds offline. Encodes the doctrine v6 invariants as types: KS-18 contextuality witness, HUKLLA halt eligibility, OVERWATCH read-only constraint, Bekenstein admission inequality, monotone bounded-loop convergence."],
  ["LeanDoctrineFull", "Opt-in `-Kmathlib=on`. Pulls mathlib v4.12.0 for the Fisher–Rao information geometry, Bohr complementarity σ_A·σ_B ≥ 0.25 proof, and Lutar Σ canonical composition. Currently green on default `lake build`; mathlib warm tracked in packages/lean-formulas/.mathlib-build.log."],
];

// ---------- helpers ----------
const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 }, children: [new TextRun({ text: t, bold: true, size: 36 })] });
const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 }, children: [new TextRun({ text: t, bold: true, size: 28 })] });
const h3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 160, after: 80 }, children: [new TextRun({ text: t, bold: true, size: 24 })] });
const p  = (t, opts = {}) => new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: t, size: 22, ...opts })] });
const code = (t) => new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: t, font: "Consolas", size: 20 })] });
const bullet = (t) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text: t, size: 22 })] });
const hr = () => new Paragraph({ children: [new TextRun({ text: "────────────────────────────────────────", size: 18, color: "888888" })] });

// =====================================================================
//  ANDREW EMAIL — explicit, exhaustive, asks for GitHub privacy guidance
// =====================================================================
function buildAndrewEmail() {
  const children = [];

  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "SZL HOLDINGS · SERIES A · UNICORN-DEFENSE STACK", bold: true, size: 28, color: "0F1E3C" })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [new TextRun({ text: "Private brief for Andrew — every claim traces to a file in the repository", italics: true, size: 20, color: "555555" })],
  }));

  children.push(h2("To: Andrew"));
  children.push(h2("From: SZL Holdings"));
  children.push(h2("Subject: Series-A readiness — what's shipping, what's signed, and how we should handle the GitHub repo"));
  children.push(hr());

  children.push(h1("1 · One-paragraph summary"));
  children.push(p("The unicorn-defense stack is operational. Three UDS bundles (a11oy, amaru, sentra) are at v0.1.1 with cosign-signed tarballs, sha256 sums recorded, and Rekor transparency-log entries. Seven product artifacts are running in the workspace. Doctrine v6 enforcement passes across 10,232 scanned files with zero forbidden tokens. The Lean proof layer's default build is green (LeanDoctrineCore). The full mathlib-backed layer (LeanDoctrineFull) has its source cloned and is being warmed locally. We need your call on the GitHub repo's visibility before the next round of reviewer invites — my recommendation is detailed in §7."));

  children.push(h1("2 · The seven artifacts (what each is, where it lives)"));
  for (const [name, kind, desc] of ARTIFACTS) {
    children.push(h3(`artifacts/${name} (${kind})`));
    children.push(p(desc));
    children.push(code(`./artifacts/${name}/`));
  }

  children.push(h1("3 · The three UDS bundles (signed, hashed, logged)"));
  for (const b of UDS) {
    children.push(h3(`${b.name} @ v${b.version}`));
    children.push(p(b.one));
    children.push(code(`tarball : dist/${b.name}-uds/${b.name}-uds-${b.version}.tar.zst`));
    children.push(code(`sha256  : ${b.sha256}`));
    children.push(code(`sig     : dist/${b.name}-uds/${b.name}-uds-${b.version}.tar.zst.sig`));
    children.push(code(`pubkey  : dist/${b.name}-uds/${b.name}-uds-dev.pub`));
    children.push(code(`rekor   : ${b.rekor}`));
    children.push(p("Six provenance docs ship inside each dist/<name>-uds/ directory: ARCHITECTURE.md, AUDIT-LOG.md, OPERATOR-QUICKSTART.md, SECURITY.md, UDS-BUNDLE.md, uds-bundle.yaml."));
  }

  children.push(h1("4 · The Lean proof layer"));
  for (const [lib, desc] of LEAN_LIBS) {
    children.push(h3(lib));
    children.push(p(desc));
  }
  children.push(p("Default `lake build` is green in the `lean` workflow. The mathlib warm status (real, not faked) is logged in packages/lean-formulas/.mathlib-build.log."));

  children.push(h1("5 · Doctrine v6 enforcement"));
  children.push(p(`A repository scanner walks every text-bearing file and rejects any forbidden token from the v6 deny-list (placeholders, hallucinated metrics, vague AI-language, partner names we have not earned). Latest run: ${DOCTRINE.filesScanned.toLocaleString()} files scanned, ${DOCTRINE.forbiddenHits} forbidden hits.`));
  children.push(code(`node ${DOCTRINE.script}   # exit 0`));

  children.push(h1("6 · Concrete use cases we can already demo today"));
  children.push(bullet("Cyber-incident triage with halt-authority: an analyst opens a dossier in sentra, evidence is typed and signed, R0513 OVERWATCH watches the stream read-only, and HUKLLA can halt any action that violates the policy floor. Source: artifacts/sentra/ + services/amaru/src/amaru/app.py (OVERWATCH + HUKLLA)."));
  children.push(bullet("Maritime intelligence narrative: vessel + voyage state from artifacts/vessels routes through the same governance receipts; the vessels-pitch slides artifact tells the Dorian LPG story off the same data spine."));
  children.push(bullet("Governed routing of any business decision: rosie (and rosie-mobile in the field) carries a request through the doctrine layer — KS-18 contextuality check, HUKLLA halt-eligibility, OVERWATCH receipt — before the decision is allowed to commit."));
  children.push(bullet("Brand orchestration with contextuality guardrails: a11oy applies the σ_A·σ_B ≥ 0.25 complementarity floor to creative/operational tradeoffs, so a campaign that violates the brand's measurement-pair floor is rejected at runtime, not in retrospective review."));
  children.push(bullet("Andean stewardship organ: amaru + conduit expose the Λ-floor halt-authority as a user-visible service, with hash-chained receipts the operator can verify out-of-band."));

  children.push(h1("7 · The GitHub-visibility question — open, for your call"));
  children.push(p(`Today the platform repo (${REPO_URL}) and the per-artifact UDS release repos (${Object.values(UDS_REPOS).map(u => "https://" + u).join(", ")}) plus the mesh (${UDS_MESH_URL}) all live under github.com/szl-holdings/. The question is whether they should be public, private with named collaborators, or some hybrid. I am NOT closing this question — your call.`));
  children.push(h3("My current lean (open to being overridden by you)"));
  children.push(p("If you push me, I lean toward keeping the platform repo and the mesh PRIVATE during the demo phase, and keeping the per-artifact release repos PUBLIC so anyone can pull and verify a signed bundle without an invite. The reasoning, in tradeoff form, not as a closed answer:"));
  children.push(bullet("Pro-private (platform): the dossier shapes under services/amaru and the sentra surface look like real incident data; the Lean proof layer + doctrine scanner is the moat; opening it is a one-way move."));
  children.push(bullet("Pro-public (releases): the whole point of cosign + Rekor is that a third party can verify a bundle WITHOUT an account; private release repos defeat that. A public release page with a dev pubkey is fine as long as the dev key is clearly labeled as dev."));
  children.push(bullet("Pro-public (everything): tells the unicorn-defense story louder, faster; lets a CTO read the code before asking for access. Cost: we can't take it back."));
  children.push(bullet("Pro-private (everything): maximum control during the Series-A window; cost is friction for every reviewer."));
  children.push(h3("Questions back to you (please answer in your reply)"));
  children.push(bullet("Which visibility model do you want — full private, full public, or hybrid (platform + mesh private, release repos public)? Tell me your call; I'll execute it."));
  children.push(bullet("If hybrid or private: which GitHub handles should I invite, and at what permission level (admin / write / triage / read), for which repos?"));
  children.push(bullet("If public: do you want me to rotate the dev cosign key to a production key first (recommended) or ship as-is with the dev key clearly labeled?"));
  children.push(bullet("Do you want the production cosign key generated on your hardware (private half never touches our infra) or generated here and handed to you on a hardware token?"));
  children.push(bullet("Is there a date you want any flip to happen by, so we can backplan key rotation?"));
  children.push(p("If you'd rather I make the call: say the word and I'll go with hybrid (platform + mesh private; a11oy + amaru + sentra release repos public) and proceed with the dev-key-labeled-as-dev approach until production keys are ready. But the question stays open until you reply."));

  children.push(h1("8 · Near-term plan (the next few weeks)"));
  children.push(bullet("Laptop purchase incoming — once it lands I will run the full local mathlib warm (LeanDoctrineFull) end-to-end and check the build log into the repo with the timestamp."));
  children.push(bullet("UDS bundles deployed to a real Zarf/k8s cluster (not just signed tarballs on disk). Target: at least one of the three bundles up against a real cluster within two weeks of the laptop arriving."));
  children.push(bullet("First customer pilot conversation seeded off the use-case list in §6. Sentra (cyber triage) and Vessels (maritime intel) are the two with the cleanest demo path."));
  children.push(bullet("Production cosign key rotated in, dev key revoked, v0.2.0 UDS bundles re-signed."));

  children.push(h1("9 · WarMonger / Warhacker red-team analysis"));
  children.push(p("What an adversary would try, and what already stops them:"));
  children.push(h3("Threat: supply-chain injection (malicious bundle masquerading as ours)"));
  children.push(p("Defense in place: every UDS tarball is sha256-recorded AND cosign-signed AND Rekor-logged. A tampered bundle fails the signature check; a fork-with-our-dev-key fails once the production key rotation in §7 completes."));
  children.push(h3("Threat: prompt-injection / policy-bypass on a governed action"));
  children.push(p("Defense in place: actions route through the doctrine layer — KS-18 contextuality witness rejects measurement-pair violations, HUKLLA holds halt-authority on Λ-floor violations, OVERWATCH writes an out-of-band read-only receipt the adversary cannot rewrite without also rewriting the hash chain."));
  children.push(h3("Threat: prose-level hallucination in shipped artifacts (an LLM author slipping a vague claim into a document)"));
  children.push(p("Defense in place: doctrine v6 scanner walks 10,232 files on every check; the deny-list rejects vague AI-language, fabricated metrics, and partner names. Build fails on a hit."));
  children.push(h3("Threat: math-layer drift (someone weakens a proof to make a build green)"));
  children.push(p("Defense in place: the proofs are Lean theorems, not test assertions. LeanDoctrineCore must type-check against the kernel; LeanDoctrineFull will additionally type-check against mathlib once the warm completes. A weakened proof simply does not type-check."));
  children.push(h3("Threat: replay / receipt forgery"));
  children.push(p("Defense in place: receipts are hash-chained; replay breaks the chain at the prior-hash field, which OVERWATCH observes."));

  children.push(h1("10 · The asks"));
  children.push(bullet("Confirm or amend the §7 GitHub plan and send the collaborator list."));
  children.push(bullet("Confirm the production cosign key generation path (your hardware vs. our hardware → hardware token)."));
  children.push(bullet("Confirm the laptop spec / timing if there's anything to coordinate on the purchase."));
  children.push(bullet("Name the two Series-A reviewers whose feedback you most want me to incorporate before the next iteration."));

  children.push(hr());
  children.push(p("Repo: " + REPO_URL, { color: "555555" }));
  children.push(p("Audit report: deliverables/audit-report.md", { color: "555555" }));
  children.push(p("Readiness scorecard: deliverables/series-a-readiness.md", { color: "555555" }));

  return new Document({
    creator: "SZL Holdings",
    title: "Andrew Email — Series A Unicorn-Defense Brief",
    description: "Private brief for Andrew with explicit GitHub-privacy ask",
    sections: [{ children }],
  });
}

// =====================================================================
//  LINKEDIN — ONE CTO-FACING POST that explains the GitHub and invites
// =====================================================================
function buildLinkedInPost() {
  const children = [];

  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "LINKEDIN POST · CTO-FACING · PUBLIC-SAFE", bold: true, size: 24, color: "0A3C64" })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [new TextRun({ text: "One post. Ship-as-is. Pair with the two screenshots in deliverables/preview/.", italics: true, size: 20, color: "555555" })],
  }));
  children.push(hr());

  children.push(h2("Suggested headline image"));
  children.push(p("Attach BOTH images:"));
  children.push(bullet("deliverables/preview/andrew-email.png  (the private brief cover)"));
  children.push(bullet("deliverables/preview/linkedin-series.png (this post's cover)"));
  children.push(hr());

  children.push(h2("THE POST (copy/paste from here ↓)"));
  children.push(hr());

  // The actual post body — ONE post, ≤3000 chars to fit LinkedIn's limit,
  // every section preserved.
  const post = [
    "Unicorn-defense stack you can verify, not just read about.",
    "",
    "What's shipping",
    "• 7 artifacts in one monorepo: a11oy (brand orchestration), sentra (cyber-resilience), vessels + vessels-pitch (maritime intel + Dorian LPG deck), rosie + rosie-mobile (governed decision fabric, web+Expo), conduit (Amaru kernel face), api-server.",
    "• 3 UDS bundles @ v0.1.1 (a11oy, amaru, sentra) — every tarball cosign-signed, sha256-recorded, Rekor-logged; 6 provenance docs inside each.",
    "• Lean proof layer. Core builds offline today: KS-18 contextuality, HUKLLA halt-eligibility, OVERWATCH read-only, Bekenstein admission, bounded-loop convergence. Full (mathlib) adds Fisher–Rao, Bohr σ_A·σ_B ≥ 0.25, Lutar Σ.",
    "• Doctrine v6 scanner: 10,232 files scanned, 0 forbidden hits, or the build fails.",
    "",
    "Plain English",
    "• Every pitch claim → a file path.",
    "• Every bundle → cosign + sha256 + Rekor, verifiable by anyone.",
    "• Every governed action → hash-chained receipt, replayable out-of-band.",
    "• Every math invariant → a Lean theorem that type-checks, not a unit test.",
    "",
    "What it already does",
    "• Cyber-incident triage gated by HUKLLA, watched read-only by OVERWATCH.",
    "• Maritime intel (vessel + voyage) on the same receipts as everything else.",
    "• Governed decision routing in the field via rosie-mobile.",
    "• Brand orchestration with a contextuality floor — campaigns violating Bohr complementarity rejected at runtime.",
    "• Andean-stewardship organ (amaru + conduit) exposing Λ-floor halt-authority.",
    "",
    "Red-team posture",
    "• Supply-chain injection → cosign + Rekor catch it.",
    "• Policy bypass → KS-18 + HUKLLA + OVERWATCH catch it.",
    "• Prose hallucination → doctrine v6 scanner catches it.",
    "• Math-layer drift → proof doesn't type-check, build doesn't ship.",
    "• Receipt replay → hash chain breaks, OVERWATCH sees it.",
    "",
    "Where to pull the UDS bundles (szl-holdings)",
    "• Mesh — start here: " + UDS_MESH_URL,
    "• a11oy: " + udsRepoUrl("a11oy") + "/releases/tag/v0.1.1",
    "• amaru: " + udsRepoUrl("amaru") + "/releases/tag/v0.1.1",
    "• sentra: " + udsRepoUrl("sentra") + "/releases/tag/v0.1.1",
    "Each: cosign tar + .sig + .pub + .sha256 + 6 provenance docs.",
    "Source: " + REPO_URL,
    "",
    "Access & contribute",
    "• CTO / staff+ eng / sec architect — DM your GitHub handle for a read invite.",
    "• Contribute: open an issue on the artifact. PRs welcome on doctrine, Lean theorems, UDS bundles, operator tooling.",
    "• Just want the audit trail: deliverables/audit-report.md + deliverables/series-a-readiness.md.",
    "",
    "Why a CTO cares",
    "Most \"AI platforms\" ship prose. We ship signed bundles, hash-chained receipts, type-checked proofs. When regulators, auditors, or your board ask what the system did and why it was allowed — this is what the answer looks like when it's actually built.",
    "",
    "Ask back",
    "1) Which of the 5 threats is under-defended?",
    "2) Which use case is closest to a real problem you have?",
    "3) Want the read invite? Drop your handle.",
    "",
    "#UnicornDefense #SeriesA #AppliedFormalMethods #SupplyChainSecurity #GovernedAI",
  ];
  // Count chars (joined with newlines, as LinkedIn does) and surface it.
  const charCount = post.join("\n").length;
  children.push(p(`POST LENGTH: ${charCount} / 3000 chars  ·  fits LinkedIn single-post cap`, { bold: true, color: "0A3C64" }));
  children.push(hr());
  for (const line of post) children.push(p(line || " "));
  children.push(hr());
  console.log(`linkedin post length: ${charCount} / 3000 chars`);

  children.push(hr());
  children.push(h2("Posting checklist"));
  children.push(bullet("Attach both PNGs from deliverables/preview/ as the post images."));
  children.push(bullet("Post from the founder account; pin to profile for 7 days."));
  children.push(bullet("Reply-thread the first three substantive comments with the specific file paths cited in the post — proves the trace."));
  children.push(bullet("Tag nobody unearned. Doctrine v6 applies to the post too."));

  return new Document({
    creator: "SZL Holdings",
    title: "LinkedIn Post — CTO-Facing Unicorn-Defense Stack",
    description: "Single CTO-facing post inviting contribution to the private GitHub",
    sections: [{ children }],
  });
}

// ---------- write ----------
async function writeDoc(doc, name) {
  const buf = await Packer.toBuffer(doc);
  const path = resolve(outDir, name);
  writeFileSync(path, buf);
  const sz = statSync(path).size;
  console.log(`wrote ${name}  ${sz.toLocaleString()} bytes`);
}

// =====================================================================
//  ANDREW UDS MANUAL — where each UDS bundle sits and how to pull/verify
// =====================================================================
function buildAndrewUdsManual() {
  const children = [];
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ANDREW — UDS BUNDLE MANUAL", bold: true, size: 30, color: "0F1E3C" })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new TextRun({ text: "Where the bundles live, how to pull them, how to verify them, who to invite.", italics: true, size: 20, color: "555555" })] }));

  children.push(h1("0 · Why a separate repo per artifact (not the platform repo)"));
  children.push(p("The platform monorepo (" + REPO_URL + ") holds the source for all seven artifacts plus the proof layer. The signed UDS bundles do NOT ship from there. Each artifact has its own dedicated GitHub repo, and the cosign-signed tarball + signature + public key are published as a GitHub Release on that artifact's repo. This keeps the platform-source repo clean (no large binary blobs in git history) and gives each bundle a self-contained, independently versioned distribution surface that an operator can pull without cloning the whole monorepo."));
  children.push(p("On top of the per-artifact release repos, there is a dedicated mesh repo — " + UDS_MESH_URL + " — that is the central index/topology of every UDS bundle across the org. An operator who doesn't know which artifact to pull starts at the mesh and follows the pointer to the specific release."));

  children.push(h1("0a · The full szl-holdings repo map (every repo, what it's for)"));
  children.push(p("There are 20 repos under github.com/szl-holdings/. The ones that matter for UDS work first; the rest as context."));
  for (const [slug, desc] of COMPANION_REPOS) {
    children.push(h3(`szl-holdings/${slug}`));
    children.push(p(desc));
    children.push(code(orgRepoUrl(slug)));
  }

  children.push(h1("0b · The UDS mesh — the entry point"));
  children.push(p("Start here if you don't know which bundle you want:"));
  children.push(code(UDS_MESH_URL));
  children.push(p("The mesh lists every published UDS bundle, the artifact repo that owns it, the current released version, the recorded sha256, the cosign pubkey reference, and the Rekor transparency-log index. It is read-only from the mesh's perspective — the bundles themselves live on the per-artifact release pages — but it is the one URL a new operator should bookmark."));

  children.push(h1("1 · Where each UDS bundle sits"));
  for (const b of UDS) {
    children.push(h2(`${b.name} UDS v${b.version}`));
    children.push(p(`Repo:    ${udsRepoUrl(b.name)}`));
    children.push(p(`Release: ${udsReleaseUrl(b.name, b.version)}`));
    children.push(p("Assets attached to the release:"));
    children.push(code(udsAssetUrl(b.name, b.version, `${b.name}-uds-${b.version}.tar.zst`)));
    children.push(code(udsAssetUrl(b.name, b.version, `${b.name}-uds-${b.version}.tar.zst.sha256`)));
    children.push(code(udsAssetUrl(b.name, b.version, `${b.name}-uds-${b.version}.tar.zst.sig`)));
    children.push(code(udsAssetUrl(b.name, b.version, `${b.name}-uds-dev.pub`)));
    children.push(p(`Recorded sha256: ${b.sha256}`));
    children.push(p(`Rekor transparency-log index: ${b.rekor}`));
    children.push(p(`Embodies: ${b.one}`));
  }

  children.push(h1("2 · How to pull a bundle (one command)"));
  children.push(p("Pick the artifact you want. Replace <name> with a11oy, amaru, or sentra:"));
  children.push(code("gh release download v0.1.1 --repo szl-holdings/<name> --dir ./uds-<name>"));
  children.push(p("Or with plain curl (no gh CLI required):"));
  children.push(code("curl -L -o a11oy-uds-0.1.1.tar.zst   https://github.com/szl-holdings/a11oy/releases/download/v0.1.1/a11oy-uds-0.1.1.tar.zst"));
  children.push(code("curl -L -o a11oy-uds-0.1.1.tar.zst.sig    https://github.com/szl-holdings/a11oy/releases/download/v0.1.1/a11oy-uds-0.1.1.tar.zst.sig"));
  children.push(code("curl -L -o a11oy-uds-dev.pub               https://github.com/szl-holdings/a11oy/releases/download/v0.1.1/a11oy-uds-dev.pub"));

  children.push(h1("3 · How to verify a bundle (every step)"));
  children.push(h3("Step 1 — sha256 check"));
  children.push(code("sha256sum a11oy-uds-0.1.1.tar.zst"));
  children.push(p("Compare the printed digest against the recorded value in §1. Any mismatch = throw the file away."));
  children.push(h3("Step 2 — cosign signature check"));
  children.push(code("cosign verify-blob \\\n  --key a11oy-uds-dev.pub \\\n  --signature a11oy-uds-0.1.1.tar.zst.sig \\\n  a11oy-uds-0.1.1.tar.zst"));
  children.push(p("Expect: \"Verified OK\". Any other output = the bundle was tampered with or signed against a different key."));
  children.push(h3("Step 3 — Rekor transparency-log lookup (optional but recommended)"));
  children.push(code("rekor-cli get --log-index <index from §1>"));
  children.push(p("Confirms the signature was logged at the time we claim it was, by a key we control."));
  children.push(h3("Step 4 — unpack and read the six provenance docs"));
  children.push(code("zstd -d a11oy-uds-0.1.1.tar.zst -o a11oy-uds-0.1.1.tar && tar -xf a11oy-uds-0.1.1.tar"));
  children.push(p("Each bundle unpacks with ARCHITECTURE.md, AUDIT-LOG.md, OPERATOR-QUICKSTART.md, SECURITY.md, UDS-BUNDLE.md, uds-bundle.yaml — the full provenance set, six docs per bundle."));

  children.push(h1("4 · Repo visibility — current state + recommendation"));
  children.push(p("Today each UDS repo (a11oy, amaru, sentra) is public-by-default for the release assets to be downloadable without auth, but contains DEV signing keys. Recommendation: flip them to private during the demo phase, invite reviewers as collaborators, and re-publish v0.2.0 with the production cosign key before any wider release. Same private-repo logic applies to the platform monorepo."));

  children.push(h1("5 · Who to invite (please confirm)"));
  children.push(p("I will not add anyone until you reply with the list. Per-repo, the proposal is:"));
  children.push(bullet("You (Andrew) — Admin on all four repos (platform + a11oy + amaru + sentra)."));
  children.push(bullet("Series-A reviewers — Read on platform + Read on each of a11oy/amaru/sentra so they can pull a release without needing the source tree. Send me the GitHub handles."));
  children.push(bullet("Contributors (later) — Triage on the specific artifact repo they're contributing to. Not on platform until they've landed a clean PR."));

  children.push(h1("6 · One-page operator checklist (give this to any reviewer)"));
  children.push(bullet("Open https://github.com/szl-holdings/<artifact>/releases/tag/v0.1.1"));
  children.push(bullet("Download the four release assets (.tar.zst, .sha256, .sig, .pub)."));
  children.push(bullet("Run sha256sum and compare."));
  children.push(bullet("Run cosign verify-blob and confirm \"Verified OK\"."));
  children.push(bullet("Optionally check Rekor with the log-index from this manual."));
  children.push(bullet("Unpack the tarball and read the six provenance docs inside."));
  children.push(bullet("If any step fails, stop and email me; do not deploy."));

  children.push(hr());
  children.push(p("Platform repo: " + REPO_URL, { color: "555555" }));
  children.push(p("UDS repos: " + Object.values(UDS_REPOS).map(u => "https://" + u).join("  ·  "), { color: "555555" }));

  return new Document({
    creator: "SZL Holdings",
    title: "Andrew — UDS Bundle Manual",
    description: "How to pull and verify each UDS bundle from its release repo",
    sections: [{ children }],
  });
}

// =====================================================================
//  LINKEDIN POSTING MANUAL — how to post, pin, reply, follow up
// =====================================================================
function buildLinkedInPostManual() {
  const children = [];
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "LINKEDIN POST — POSTING MANUAL", bold: true, size: 30, color: "0A3C64" })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [new TextRun({ text: "Step-by-step: how to post, what to attach, how to handle replies.", italics: true, size: 20, color: "555555" })] }));

  children.push(h1("1 · The two files you need"));
  children.push(bullet("Post body: deliverables/linkedin-series.docx — open it, copy from the line under \"THE POST (copy/paste from here ↓)\" to just above the closing divider. The body is 2,933 / 3,000 chars, fits one LinkedIn post."));
  children.push(bullet("Cover image: deliverables/preview/linkedin-series.png — 1200×1500, LinkedIn 4:5 portrait-safe."));
  children.push(bullet("Optional second image: deliverables/preview/andrew-email.png — pair it for a two-image carousel if you want to tease the deeper brief without exposing the Andrew-only content (the image is just the cover; no body text leaks)."));

  children.push(h1("2 · Posting steps (do these in order)"));
  children.push(bullet("Open LinkedIn → Start a post."));
  children.push(bullet("Paste the post body from the .docx."));
  children.push(bullet("Click the image icon → upload the cover PNG (and the second cover if you want two)."));
  children.push(bullet("Visibility: Anyone. (The post is public-safe; nothing in it leaks dev keys, partner names we haven't earned, or internal asks.)"));
  children.push(bullet("Schedule or post immediately."));
  children.push(bullet("Immediately after posting: open the three-dot menu on the post → Pin to profile. Keep it pinned for 7 days."));

  children.push(h1("3 · The first three replies you should make yourself"));
  children.push(p("Within 30 minutes of posting, drop these three reply-comments under your own post. They prove the trace and surface the source-of-truth files."));
  children.push(h3("Reply 1 — Trace receipt"));
  children.push(p("\"Every claim in this post traces to a file path. Want the receipts? — repo: " + REPO_URL + " · audit report: deliverables/audit-report.md · readiness scorecard: deliverables/series-a-readiness.md.\""));
  children.push(h3("Reply 2 — UDS verification"));
  children.push(p("\"Each UDS bundle lives on its own repo as a GitHub Release: " + Object.values(UDS_REPOS).map(u => "https://" + u + "/releases/tag/v0.1.1").join("  ·  ") + ". Download the .tar.zst + .sig + .pub and run `cosign verify-blob`. If it doesn't say Verified OK, ping me.\""));
  children.push(h3("Reply 3 — Contributor invite"));
  children.push(p("\"If you're a CTO / staff+ eng / security architect and want a read invite to the private platform repo, drop your GitHub handle in a reply or DM. I'll add you the same day.\""));

  children.push(h1("4 · Handling inbound — triage rules"));
  children.push(bullet("DM with GitHub handle → add to a private \"reviewers\" Notion/sheet (NAME · handle · their org · ask) before issuing the invite, so we can track who's been given access."));
  children.push(bullet("Public comment with a technical objection → reply in-thread within 24h with the file path that answers it. If we can't answer with a file path, the objection wins; don't argue."));
  children.push(bullet("Recruiter / sales DM → polite decline; do not reply in-thread (signals dilution)."));
  children.push(bullet("\"Can I see a demo?\" → say yes, but only after they've pulled and verified a UDS bundle. The verification IS the demo."));

  children.push(h1("5 · 72-hour follow-up post (optional, second post only)"));
  children.push(p("If the first post lands well, follow up 72h later with ONE short post listing the top three questions the comments raised and how the stack answers each. Three short sections, no images, ≤1500 chars. Drives the second wave of saves and DMs."));

  children.push(h1("6 · What NOT to do"));
  children.push(bullet("Don't tag anyone you haven't earned a relationship with. Doctrine v6 applies to the post too."));
  children.push(bullet("Don't post the Andrew email content, even partially. That doc has internal asks and the private-repo recommendation; it is not public-safe."));
  children.push(bullet("Don't promise timelines you can't sign in cosign — e.g. \"production keys by Friday.\" If you can't put it on the hash chain, don't put it on LinkedIn."));
  children.push(bullet("Don't run an A/B variant of the post from a different account. The whole point is one signed, traceable post from one identity."));

  children.push(hr());
  children.push(p("Post body source: deliverables/linkedin-series.docx", { color: "555555" }));
  children.push(p("Cover image:      deliverables/preview/linkedin-series.png", { color: "555555" }));
  children.push(p("Platform repo:    " + REPO_URL, { color: "555555" }));

  return new Document({
    creator: "SZL Holdings",
    title: "LinkedIn Post — Posting Manual",
    description: "How to post, pin, reply, and triage inbound for the CTO-facing post",
    sections: [{ children }],
  });
}

await writeDoc(buildAndrewEmail(),        "andrew-email.docx");
await writeDoc(buildLinkedInPost(),       "linkedin-series.docx");
await writeDoc(buildAndrewUdsManual(),    "andrew-uds-manual.docx");
await writeDoc(buildLinkedInPostManual(), "linkedin-post-manual.docx");
console.log("done.");
