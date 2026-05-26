import { writeFileSync, mkdirSync } from "node:fs";
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from "docx";

mkdirSync("deliverables/downloads", { recursive: true });

const f = (t, o={}) => new TextRun({ text: t, ...o });
const p = (t, o={}) => new Paragraph({ spacing:{after:120}, children:[f(t,o)] });
const h1 = (t) => new Paragraph({ heading:HeadingLevel.HEADING_1, spacing:{before:240,after:120}, children:[f(t,{bold:true,size:30,color:"0F1E3C"})] });
const h2 = (t) => new Paragraph({ heading:HeadingLevel.HEADING_2, spacing:{before:200,after:80}, children:[f(t,{bold:true,size:26,color:"0F1E3C"})] });
const b  = (t) => new Paragraph({ bullet:{level:0}, spacing:{after:60}, children:[f(t)] });
const c  = (t) => new Paragraph({ spacing:{after:60}, children:[f(t,{font:"Courier New",size:20,color:"0A3C64"})] });

// ============ EMAIL ============
const EMAIL_SUBJECT = "Follow-up — UDS mesh, corrected release URLs, visibility question";
const emailKids = [
  new Paragraph({ alignment: AlignmentType.CENTER, children:[f("Subject: " + EMAIL_SUBJECT, {italics:true,color:"555555"})] }),
  new Paragraph({ children:[f("")] }),
  h1("Andrew — quick follow-up (only what's new)"),
  p("Three things I left dangling in the last brief; nothing else has changed."),

  h2("1 · The UDS mesh is the entry point"),
  p("I'd been giving you per-artifact release links one at a time. There is a single mesh repo that indexes every UDS bundle across the org. Bookmark this; it's the one URL anyone needs:"),
  c("https://github.com/szl-holdings/uds-mesh"),
  p("The mesh lists each bundle's owning artifact repo, current version, sha256, cosign pubkey reference, and Rekor index. The signed tarballs themselves live on the per-artifact release pages."),

  h2("2 · Corrected release tag URLs"),
  p("Earlier links used tag pattern v0.1.1. Actual tag pattern is uds-v0.1.1. Correct URLs:"),
  c("https://github.com/szl-holdings/a11oy/releases/tag/uds-v0.1.1   (current)"),
  c("https://github.com/szl-holdings/a11oy/releases/tag/uds-v0.1.0   (prior — for diff/changelog)"),
  c("https://github.com/szl-holdings/amaru/releases/tag/uds-v0.1.1"),
  c("https://github.com/szl-holdings/sentra/releases/tag/uds-v0.1.1"),
  p("Each release ships: cosign-signed tarball + .sig + .pub + .sha256 + 6 provenance docs (ARCHITECTURE, AUDIT-LOG, OPERATOR-QUICKSTART, SECURITY, UDS-BUNDLE, uds-bundle.yaml)."),

  h2("3 · The GitHub-visibility question is still open — your call"),
  p("I'm not closing this on my own. The tradeoff in one paragraph:"),
  b("Per-artifact release repos benefit from being PUBLIC — the whole point of cosign + Rekor is anyone can verify a bundle without an account."),
  b("The platform monorepo (github.com/szl-holdings/platform) and the mesh probably want to stay PRIVATE during the demo phase — the dossier shapes and the doctrine/proof layer are the moat."),
  b("If you'd rather I pick: I'll go hybrid (platform + mesh private, release repos public, dev cosign key labeled as dev until the production key is rotated). Say the word and I'll execute."),
  p("Either way please send back: which visibility model, and any GitHub handles you want invited (with permission level) so I can issue the invites."),

  h2("4 · The LinkedIn post is ready"),
  p("Single CTO-facing post (≤3000 chars), explicit pull paths to the mesh and each release, red-team posture summary, ends with an invite for GitHub handles. Cover image is a real proof-receipt screenshot showing sha256 verification, lake build output, and a real Lean theorem from Connection/NullSpace.lean. I'll post on your green-light."),

  h2("Asks (please reply to any/all)"),
  b("Visibility model: full private / full public / hybrid / 'you pick'?"),
  b("GitHub handles to invite (with permission level), if any?"),
  b("OK to publish the LinkedIn post, or do you want eyes on it first?"),

  p("Everything else (full artifact list, UDS provenance, Lean layer, doctrine v6 results, near-term plan) is in the prior brief — nothing changed there."),
];
const emailDoc = new Document({
  creator:"SZL Holdings", title:EMAIL_SUBJECT, description:"Andrew follow-up email",
  sections:[{ children: emailKids }],
});
Packer.toBuffer(emailDoc).then(buf => {
  writeFileSync("deliverables/downloads/andrew-email.docx", buf);
  console.log("wrote deliverables/downloads/andrew-email.docx", buf.length, "bytes");
});

// ============ LINKEDIN POST ============
const POST_TITLE = "LinkedIn post — Unicorn-defense Series A";
const POST_LINES = [
  "Unicorn-defense stack you can verify, not just read about.",
  "",
  "What's shipping",
  "• 7 artifacts: a11oy (brand), sentra (cyber-resilience), vessels + vessels-pitch (maritime intel + Dorian LPG deck), rosie + rosie-mobile (governed decisions), conduit (Amaru kernel), api-server.",
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
  "• Mesh — start here: https://github.com/szl-holdings/uds-mesh",
  "• a11oy (current): https://github.com/szl-holdings/a11oy/releases/tag/uds-v0.1.1",
  "• a11oy (prior):   https://github.com/szl-holdings/a11oy/releases/tag/uds-v0.1.0",
  "• amaru:  https://github.com/szl-holdings/amaru/releases/tag/uds-v0.1.1",
  "• sentra: https://github.com/szl-holdings/sentra/releases/tag/uds-v0.1.1",
  "Source: https://github.com/szl-holdings/platform",
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
const charCount = POST_LINES.join("\n").length;
const postKids = [
  new Paragraph({ alignment: AlignmentType.CENTER, children:[f(POST_TITLE,{bold:true,size:28,color:"0F1E3C"})] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children:[f(`Length: ${charCount} / 3000 chars  ·  fits LinkedIn cap`,{italics:true,color:"555555"})] }),
  new Paragraph({ children:[f("")] }),
  new Paragraph({ children:[f("Copy the block below into the LinkedIn composer.",{italics:true,color:"555555"})] }),
  new Paragraph({ children:[f("")] }),
  ...POST_LINES.map(l => p(l || " ")),
];
const postDoc = new Document({
  creator:"SZL Holdings", title:POST_TITLE, description:"Single LinkedIn post — unicorn-defense Series A",
  sections:[{ children: postKids }],
});
Packer.toBuffer(postDoc).then(buf => {
  writeFileSync("deliverables/downloads/linkedin-post.docx", buf);
  console.log("wrote deliverables/downloads/linkedin-post.docx", buf.length, "bytes  ·  post length", charCount, "chars");
});
