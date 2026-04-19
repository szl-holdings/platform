import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createWriteStream } from "node:fs";
import MarkdownIt from "markdown-it";
import PDFDocument from "pdfkit";
import type Token from "markdown-it/lib/token.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..", "..");

// SZL Holdings palette — gold accent, dark navy header strip, light leave-behind body.
const BRAND = {
  ink: "#0a0608",
  text: "#1a1d24",
  muted: "#5a6270",
  gold: "#d4a054",
  goldDark: "#a87a3a",
  rule: "#e6e1d6",
  bgSoft: "#faf6ee",
  navy: "#0e1726",
};

const FONT = {
  display: "Helvetica-Bold",
  body: "Helvetica",
  bodyBold: "Helvetica-Bold",
  bodyItalic: "Helvetica-Oblique",
  mono: "Courier",
};

interface BriefMeta {
  source: string;
  output: string;
  title: string;
  eyebrow: string;
  footerLeft: string;
  maxPages: number;
}

const briefs: BriefMeta[] = [
  {
    source: "ops/market/executive-demo-brief-leavebehind.md",
    output: "ops/market/executive-demo-brief.pdf",
    title: "Executive Demo Brief",
    eyebrow: "SZL Holdings · Sales Leave-Behind",
    footerLeft: "SZL Holdings — Executive Demo Brief",
    maxPages: 2,
  },
  {
    source: "ops/market/operator-demo-brief-leavebehind.md",
    output: "ops/market/operator-demo-brief.pdf",
    title: "Operator Demo Brief",
    eyebrow: "SZL Holdings · Sales Leave-Behind",
    footerLeft: "SZL Holdings — Operator Demo Brief",
    maxPages: 2,
  },
];

const md = new MarkdownIt({ html: false, linkify: false, typographer: true });

type InlineRun = { text: string; bold?: boolean; italic?: boolean; code?: boolean };

// PDFKit's built-in Helvetica uses WinAnsi encoding which lacks several
// common Unicode glyphs. Replace them with safe equivalents so they render
// instead of falling back to question marks or stray punctuation.
const GLYPH_REPLACEMENTS: Array<[RegExp, string]> = [
  [/→/g, "->"],
  [/←/g, "<-"],
  [/↑/g, "^"],
  [/↓/g, "v"],
  [/⇒/g, "=>"],
  [/⇐/g, "<="],
  [/✓/g, "+"],
  [/✗/g, "x"],
  [/[\u2018\u2019]/g, "'"],
  [/[\u201C\u201D]/g, '"'],
  [/\u2026/g, "..."],
  [/\u00A0/g, " "],
];

function normalizeGlyphs(s: string): string {
  let out = s;
  for (const [re, rep] of GLYPH_REPLACEMENTS) out = out.replace(re, rep);
  return out;
}

function inlineRuns(token: Token): InlineRun[] {
  const out: InlineRun[] = [];
  let bold = 0;
  let italic = 0;
  for (const child of token.children ?? []) {
    switch (child.type) {
      case "text":
        if (child.content) out.push({ text: normalizeGlyphs(child.content), bold: bold > 0, italic: italic > 0 });
        break;
      case "strong_open": bold++; break;
      case "strong_close": bold--; break;
      case "em_open": italic++; break;
      case "em_close": italic--; break;
      case "code_inline":
        out.push({ text: normalizeGlyphs(child.content), code: true });
        break;
      case "softbreak":
      case "hardbreak":
        out.push({ text: " ", bold: bold > 0, italic: italic > 0 });
        break;
      case "link_open":
      case "link_close":
        break;
      default:
        if (child.content) out.push({ text: normalizeGlyphs(child.content), bold: bold > 0, italic: italic > 0 });
    }
  }
  return out;
}

function fontFor(run: InlineRun): string {
  if (run.code) return FONT.mono;
  if (run.bold && run.italic) return "Helvetica-BoldOblique";
  if (run.bold) return FONT.bodyBold;
  if (run.italic) return FONT.bodyItalic;
  return FONT.body;
}

function renderInline(
  doc: PDFKit.PDFDocument,
  runs: InlineRun[],
  opts: { size: number; color: string; lineGap?: number; indent?: number },
) {
  const { size, color, lineGap = 2, indent = 0 } = opts;
  const startX = doc.page.margins.left + indent;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right - indent;
  doc.x = startX;
  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];
    const isLast = i === runs.length - 1;
    doc.font(fontFor(run)).fontSize(size).fillColor(run.code ? BRAND.goldDark : color);
    doc.text(run.text, { continued: !isLast, lineGap, width });
  }
  doc.fillColor(color);
}

function renderTitleBlock(doc: PDFKit.PDFDocument, brief: BriefMeta) {
  doc.fillColor(BRAND.gold).font(FONT.body).fontSize(8).text("DEMO LEAVE-BEHIND", { characterSpacing: 3 });
  doc.moveDown(0.2);
  doc.fillColor(BRAND.ink).font(FONT.display).fontSize(22).text(brief.title);
  const { left } = doc.page.margins;
  doc.rect(left, doc.y + 3, 56, 2.5).fill(BRAND.gold);
  doc.moveDown(0.9);
}

function renderTokens(doc: PDFKit.PDFDocument, tokens: Token[]) {
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];

    if (t.type === "heading_open") {
      const level = parseInt(t.tag.slice(1), 10);
      const inline = tokens[i + 1];
      const runs = inlineRuns(inline);
      const text = runs.map((r) => r.text).join("");
      i += 3;

      // First H1 is the title — already rendered separately. Skip H1s entirely.
      if (level === 1) continue;

      doc.moveDown(level === 2 ? 0.5 : 0.35);
      if (level === 2) {
        const { left, right } = doc.page.margins;
        const width = doc.page.width - left - right;
        const y0 = doc.y;
        doc.rect(left, y0, width, 17).fill(BRAND.bgSoft);
        doc.rect(left, y0, 3, 17).fill(BRAND.gold);
        doc.fillColor(BRAND.ink).font(FONT.display).fontSize(10);
        doc.text(text.toUpperCase(), left + 10, y0 + 4, {
          width: width - 14,
          characterSpacing: 1,
          lineBreak: false,
        });
        doc.y = y0 + 21;
      } else {
        doc.fillColor(BRAND.goldDark).font(FONT.display).fontSize(9.5);
        doc.text(text, { characterSpacing: 0.4 });
        doc.moveDown(0.15);
      }
      continue;
    }

    if (t.type === "paragraph_open") {
      const inline = tokens[i + 1];
      const runs = inlineRuns(inline);
      i += 3;
      renderInline(doc, runs, { size: 8.8, color: BRAND.text, lineGap: 2 });
      doc.moveDown(0.35);
      continue;
    }

    if (t.type === "blockquote_open") {
      const inner: Token[] = [];
      let depth = 1;
      let j = i + 1;
      while (j < tokens.length && depth > 0) {
        if (tokens[j].type === "blockquote_open") depth++;
        else if (tokens[j].type === "blockquote_close") {
          depth--;
          if (depth === 0) break;
        }
        if (depth > 0) inner.push(tokens[j]);
        j++;
      }
      i = j + 1;

      const { left } = doc.page.margins;
      doc.moveDown(0.15);
      const innerStartY = doc.y;
      for (const inT of inner) {
        if (inT.type === "inline") {
          const runs = inlineRuns(inT);
          doc.font(FONT.bodyItalic);
          renderInline(doc, runs, { size: 9.5, color: BRAND.navy, lineGap: 3, indent: 12 });
          doc.moveDown(0.2);
        }
      }
      const endY = doc.y;
      doc.rect(left, innerStartY - 1, 2.5, Math.max(endY - innerStartY + 1, 12)).fill(BRAND.gold);
      doc.fillColor(BRAND.text);
      doc.moveDown(0.3);
      continue;
    }

    if (t.type === "bullet_list_open" || t.type === "ordered_list_open") {
      const ordered = t.type === "ordered_list_open";
      let idx = 1;
      let depth = 1;
      let j = i + 1;
      while (j < tokens.length && depth > 0) {
        const tk = tokens[j];
        if (tk.type === "bullet_list_open" || tk.type === "ordered_list_open") depth++;
        else if (tk.type === "bullet_list_close" || tk.type === "ordered_list_close") {
          depth--;
          if (depth === 0) break;
        }
        if (depth === 1 && tk.type === "list_item_open") {
          let k = j + 1;
          let id = 1;
          const itemInline: InlineRun[] = [];
          while (k < tokens.length && id > 0) {
            if (tokens[k].type === "list_item_open") id++;
            else if (tokens[k].type === "list_item_close") {
              id--;
              if (id === 0) break;
            }
            if (tokens[k].type === "inline" && id === 1) {
              if (itemInline.length > 0) itemInline.push({ text: " " });
              itemInline.push(...inlineRuns(tokens[k]));
            }
            k++;
          }
          const { left } = doc.page.margins;
          const bulletX = left + 2;
          const textIndent = 14;
          const yStart = doc.y;
          doc.fillColor(BRAND.gold).font(FONT.bodyBold).fontSize(9);
          const marker = ordered ? `${idx}.` : "•";
          doc.text(marker, bulletX, yStart, { lineBreak: false, width: 12 });
          doc.x = left + textIndent;
          doc.y = yStart;
          renderInline(doc, itemInline, { size: 8.8, color: BRAND.text, lineGap: 2, indent: textIndent });
          doc.moveDown(0.1);
          idx++;
          j = k;
        }
        j++;
      }
      i = j + 1;
      doc.moveDown(0.2);
      continue;
    }

    if (t.type === "hr") {
      doc.moveDown(0.2);
      const { left, right } = doc.page.margins;
      const width = doc.page.width - left - right;
      doc.rect(left, doc.y, width, 0.5).fill(BRAND.rule);
      doc.moveDown(0.5);
      i++;
      continue;
    }

    if (t.type === "table_open") {
      const rows: { cells: InlineRun[][]; head?: boolean }[] = [];
      let depth = 1;
      let j = i + 1;
      let inHead = false;
      let currentRow: InlineRun[][] | null = null;
      let currentRowHead = false;
      while (j < tokens.length && depth > 0) {
        const tk = tokens[j];
        if (tk.type === "table_open") depth++;
        else if (tk.type === "table_close") {
          depth--;
          if (depth === 0) break;
        }
        if (tk.type === "thead_open") inHead = true;
        else if (tk.type === "thead_close") inHead = false;
        else if (tk.type === "tr_open") {
          currentRow = [];
          currentRowHead = inHead;
        } else if (tk.type === "tr_close") {
          if (currentRow) rows.push({ cells: currentRow, head: currentRowHead });
          currentRow = null;
        } else if ((tk.type === "td_open" || tk.type === "th_open") && currentRow) {
          const inline = tokens[j + 1];
          if (inline && inline.type === "inline") currentRow.push(inlineRuns(inline));
          else currentRow.push([]);
        }
        j++;
      }
      i = j + 1;

      if (rows.length === 0) continue;
      const { left, right } = doc.page.margins;
      const width = doc.page.width - left - right;
      const colCount = Math.max(...rows.map((r) => r.cells.length));
      const colWidth = width / colCount;

      for (const row of rows) {
        const isHead = row.head === true;
        const cellHeights: number[] = [];
        const cellTexts: string[] = [];
        for (let c = 0; c < colCount; c++) {
          const runs = row.cells[c] ?? [];
          const txt = runs.map((r) => r.text).join("");
          cellTexts.push(txt);
          doc.font(isHead ? FONT.bodyBold : FONT.body).fontSize(8.2);
          cellHeights.push(doc.heightOfString(txt || " ", { width: colWidth - 10 }));
        }
        const rowH = Math.max(...cellHeights) + 7;
        const y = doc.y;
        if (isHead) {
          doc.rect(left, y, width, rowH).fill(BRAND.navy);
        } else {
          doc.rect(left, y + rowH - 0.4, width, 0.4).fill(BRAND.rule);
        }
        for (let c = 0; c < colCount; c++) {
          doc.font(isHead ? FONT.bodyBold : FONT.body).fontSize(8.2);
          doc.fillColor(isHead ? "#ffffff" : BRAND.text);
          doc.text(cellTexts[c] ?? "", left + c * colWidth + 5, y + 3.5, {
            width: colWidth - 10,
            lineBreak: true,
          });
        }
        doc.y = y + rowH;
      }
      doc.moveDown(0.35);
      continue;
    }

    i++;
  }
}

function drawBrandFooter(doc: PDFKit.PDFDocument, brief: BriefMeta, pageNum: number, totalPages: number) {
  const { left, right, bottom } = doc.page.margins;
  const width = doc.page.width - left - right;
  const y = doc.page.height - bottom + 14;
  doc.rect(left, y - 6, width, 0.6).fill(BRAND.rule);
  doc.fillColor(BRAND.gold).font(FONT.bodyBold).fontSize(7).text("SZL HOLDINGS", left, y, {
    width: width / 2,
    align: "left",
    lineBreak: false,
    characterSpacing: 1.5,
  });
  doc.fillColor(BRAND.muted).font(FONT.body).fontSize(7).text(brief.footerLeft, left + width / 2 - 60, y, {
    width: 120,
    align: "center",
    lineBreak: false,
  });
  doc.fillColor(BRAND.muted).font(FONT.body).fontSize(7).text(`Page ${pageNum} / ${totalPages}`, left, y, {
    width,
    align: "right",
    lineBreak: false,
  });
}

async function generate(brief: BriefMeta) {
  const sourceAbs = join(repoRoot, brief.source);
  const outAbs = join(repoRoot, brief.output);
  mkdirSync(dirname(outAbs), { recursive: true });
  const text = readFileSync(sourceAbs, "utf8");
  const tokens = md.parse(text, {});

  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: 56, bottom: 44, left: 52, right: 52 },
    info: {
      Title: brief.title,
      Author: "SZL Holdings",
      Subject: "Demo Leave-Behind",
      Keywords: "SZL Holdings, governed autonomy, demo brief",
    },
    autoFirstPage: false,
    bufferPages: true,
  });

  const stream = createWriteStream(outAbs);
  doc.pipe(stream);

  doc.addPage();
  renderTitleBlock(doc, brief);
  renderTokens(doc, tokens);

  // Add brand footer to every page now that content has been laid out.
  const range = doc.bufferedPageRange();
  for (let p = 0; p < range.count; p++) {
    doc.switchToPage(range.start + p);
    drawBrandFooter(doc, brief, p + 1, range.count);
  }

  doc.end();

  await new Promise<void>((res, rej) => {
    stream.on("finish", () => res());
    stream.on("error", rej);
  });

  if (range.count > brief.maxPages) {
    throw new Error(
      `Page count guard: ${brief.output} produced ${range.count} pages but max is ${brief.maxPages}. ` +
        `Trim ${brief.source} to fit the leave-behind format.`,
    );
  }

  console.log(`✓ Generated ${brief.output} (${range.count} page${range.count === 1 ? "" : "s"})`);
}

async function main() {
  for (const b of briefs) await generate(b);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
