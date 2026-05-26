import { writeFileSync } from "node:fs";
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from "docx";

const SUBJECT = "Quick follow-up — UDS mesh + visibility question + corrected release URLs";

const lines = [
  ["h1", "Andrew — quick follow-up (only what's new)"],
  ["p", "Three things I left dangling in the last brief; nothing else has changed."],

  ["h2", "1 · The UDS mesh is the entry point"],
  ["p", "I'd been giving you per-artifact release links one at a time. There is a single mesh repo that indexes every UDS bundle across the org. Bookmark this; it's the one URL anyone needs:"],
  ["code", "https://github.com/szl-holdings/uds-mesh"],
  ["p", "The mesh lists each bundle's owning artifact repo, current version, sha256, cosign pubkey reference, and Rekor index. The signed tarballs themselves live on the per-artifact release pages."],

  ["h2", "2 · Corrected release tag URLs"],
  ["p", "Earlier links I sent used the tag pattern v0.1.1. The actual tag pattern is uds-v0.1.1. Correct URLs:"],
  ["code", "https://github.com/szl-holdings/a11oy/releases/tag/uds-v0.1.1"],
  ["code", "https://github.com/szl-holdings/amaru/releases/tag/uds-v0.1.1"],
  ["code", "https://github.com/szl-holdings/sentra/releases/tag/uds-v0.1.1"],
  ["p", "Each release ships: cosign-signed tarball + .sig + .pub + .sha256 + the 6 provenance docs (ARCHITECTURE, AUDIT-LOG, OPERATOR-QUICKSTART, SECURITY, UDS-BUNDLE, uds-bundle.yaml)."],

  ["h2", "3 · The GitHub-visibility question is still open — your call"],
  ["p", "I'm not closing this on my own. The tradeoff in one paragraph:"],
  ["bullet", "Per-artifact release repos benefit from being PUBLIC — the whole point of cosign + Rekor is anyone can verify a bundle without an account."],
  ["bullet", "The platform monorepo (github.com/szl-holdings/platform) and the mesh probably want to stay PRIVATE during the demo phase — the dossier shapes and the doctrine/proof layer is the moat."],
  ["bullet", "If you'd rather I pick: I'll go hybrid (platform + mesh private, release repos public, dev cosign key labeled as dev until production key is rotated). Say the word and I'll execute."],
  ["p", "Either way please send me back: which visibility model, and any GitHub handles you want invited (with permission level) so I can issue the invites."],

  ["h2", "4 · The LinkedIn post is ready"],
  ["p", "Single CTO-facing post (≤3000 chars), explicit pull paths to the mesh and each release, red-team posture summary, ends with an invite for GitHub handles. Cover image is a real proof-receipt screenshot showing sha256 verification, lake build output, and a real Lean theorem from Connection/NullSpace.lean. I'll post on your green-light."],

  ["h2", "Asks (please reply to any/all)"],
  ["bullet", "Visibility model: full private / full public / hybrid / 'you pick'?"],
  ["bullet", "GitHub handles to invite (with permission level), if any?"],
  ["bullet", "OK to publish the LinkedIn post, or do you want eyes on it first?"],

  ["p", "Everything else (full artifact list, UDS provenance, Lean layer, doctrine v6 results, near-term plan) is in the prior brief — nothing changed there."],
];

const f = (t, opts={}) => new TextRun({ text: t, ...opts });
const p = (t, opts={}) => new Paragraph({ spacing:{after:120}, children: [f(t, opts)] });
const h1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing:{before:240, after:120}, children: [f(t, { bold:true, size:30, color:"0F1E3C" })] });
const h2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing:{before:200, after:80}, children: [f(t, { bold:true, size:26, color:"0F1E3C" })] });
const bullet = (t) => new Paragraph({ bullet:{level:0}, spacing:{after:60}, children: [f(t)] });
const code = (t) => new Paragraph({ spacing:{after:60}, children: [f(t, { font:"Courier New", size:20, color:"0A3C64" })] });

const kids = lines.map(([k, t]) => k==="h1"?h1(t):k==="h2"?h2(t):k==="bullet"?bullet(t):k==="code"?code(t):p(t));

const doc = new Document({
  creator: "SZL Holdings",
  title: SUBJECT,
  description: "Short follow-up to Andrew — UDS mesh + visibility question + corrected release URLs",
  sections: [{ children: [
    new Paragraph({ alignment: AlignmentType.CENTER, children: [f("Subject: " + SUBJECT, { italics:true, color:"555555" })] }),
    new Paragraph({ children: [f("")] }),
    ...kids,
  ]}],
});

Packer.toBuffer(doc).then(buf => {
  writeFileSync("deliverables/downloads/andrew-followup.docx", buf);
  console.log("wrote deliverables/downloads/andrew-followup.docx", buf.length, "bytes");
});

// Also write plain-text
const txt = [
  "Subject: " + SUBJECT,
  "",
  ...lines.flatMap(([k, t]) => {
    if (k === "h1" || k === "h2") return ["", t, "=".repeat(t.length), ""];
    if (k === "bullet") return ["  • " + t];
    if (k === "code") return ["  " + t];
    return [t, ""];
  }),
].join("\n");
writeFileSync("deliverables/downloads/andrew-followup.txt", txt);
console.log("wrote deliverables/downloads/andrew-followup.txt", txt.length, "chars");
console.log("\n===== EMAIL TEXT =====\n" + txt);
