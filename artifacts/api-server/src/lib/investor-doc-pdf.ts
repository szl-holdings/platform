import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

const BRAND = {
  bg: [10, 12, 16] as [number, number, number],
  surface: [17, 19, 24] as [number, number, number],
  border: [30, 34, 48] as [number, number, number],
  primary: [194, 165, 90] as [number, number, number],
  primaryLight: [212, 188, 130] as [number, number, number],
  text: [232, 224, 208] as [number, number, number],
  muted: [122, 128, 153] as [number, number, number],
  code: [106, 170, 114] as [number, number, number],
};

const MARGIN = 72;
const CONTENT_WIDTH = 612 - MARGIN * 2; // letter = 612 pts wide

function newPage(doc: PDFKit.PDFDocument): void {
  doc.addPage();
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(BRAND.bg);
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number): void {
  if (doc.y + needed > doc.page.height - 80) {
    newPage(doc);
  }
}

function stripInline(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1');
}

function renderH1(doc: PDFKit.PDFDocument, text: string): void {
  ensureSpace(doc, 50);
  doc.moveDown(0.4);
  doc.rect(MARGIN, doc.y, CONTENT_WIDTH, 2).fill(BRAND.primary);
  doc.moveDown(0.2);
  doc
    .font('Helvetica-Bold')
    .fontSize(18)
    .fillColor(BRAND.text)
    .text(stripInline(text), MARGIN, doc.y, { width: CONTENT_WIDTH });
  doc.moveDown(0.5);
}

function renderH2(doc: PDFKit.PDFDocument, text: string): void {
  ensureSpace(doc, 40);
  doc.moveDown(0.6);
  doc
    .font('Helvetica-Bold')
    .fontSize(13)
    .fillColor(BRAND.primaryLight)
    .text(stripInline(text), MARGIN, doc.y, { width: CONTENT_WIDTH });
  doc.rect(MARGIN, doc.y, CONTENT_WIDTH, 0.5).fill(BRAND.border);
  doc.moveDown(0.3);
}

function renderH3(doc: PDFKit.PDFDocument, text: string): void {
  ensureSpace(doc, 30);
  doc.moveDown(0.4);
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(BRAND.text)
    .text(stripInline(text), MARGIN, doc.y, { width: CONTENT_WIDTH });
  doc.moveDown(0.25);
}

function renderH4(doc: PDFKit.PDFDocument, text: string): void {
  ensureSpace(doc, 25);
  doc.moveDown(0.3);
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(BRAND.muted)
    .text(stripInline(text).toUpperCase(), MARGIN, doc.y, {
      width: CONTENT_WIDTH,
      characterSpacing: 1,
    });
  doc.moveDown(0.2);
}

function renderParagraph(doc: PDFKit.PDFDocument, text: string): void {
  const clean = stripInline(text.trim());
  if (!clean) return;
  ensureSpace(doc, 20);
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(BRAND.text)
    .text(clean, MARGIN, doc.y, { width: CONTENT_WIDTH, lineGap: 2 });
  doc.moveDown(0.35);
}

function renderBullet(doc: PDFKit.PDFDocument, text: string, indent = 0): void {
  const clean = stripInline(text.trim());
  if (!clean) return;
  ensureSpace(doc, 18);
  const x = MARGIN + indent * 16;
  const textX = x + 14;
  doc.circle(x + 4, doc.y + 5, 2).fill(BRAND.primary);
  const before = doc.y;
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(BRAND.text)
    .text(clean, textX, before, { width: CONTENT_WIDTH - textX + MARGIN, lineGap: 2 });
  doc.moveDown(0.2);
}

function renderNumbered(doc: PDFKit.PDFDocument, text: string, num: number): void {
  const clean = stripInline(text.trim());
  if (!clean) return;
  ensureSpace(doc, 18);
  const textX = MARGIN + 20;
  const before = doc.y;
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(BRAND.muted)
    .text(`${num}.`, MARGIN, before, { width: 18 });
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(BRAND.text)
    .text(clean, textX, before, { width: CONTENT_WIDTH - 20, lineGap: 2 });
  doc.moveDown(0.2);
}

function renderCodeLine(doc: PDFKit.PDFDocument, line: string): void {
  doc
    .font('Courier')
    .fontSize(8)
    .fillColor(BRAND.code)
    .text(line || ' ', MARGIN + 8, doc.y, { width: CONTENT_WIDTH - 16, lineGap: 1 });
}

function renderCodeBlock(doc: PDFKit.PDFDocument, lines: string[]): void {
  const blockHeight = lines.length * 12 + 16;
  ensureSpace(doc, Math.min(blockHeight, 120));
  const blockY = doc.y;
  doc
    .rect(MARGIN, blockY - 2, CONTENT_WIDTH, Math.min(blockHeight, doc.page.height - blockY - 80))
    .fill(BRAND.surface);
  doc.moveDown(0.15);
  for (const line of lines.slice(0, 40)) {
    renderCodeLine(doc, line);
  }
  if (lines.length > 40) {
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(BRAND.muted)
      .text(`… (${lines.length - 40} more lines)`, MARGIN + 8, doc.y);
  }
  doc.moveDown(0.4);
}

function renderTableRow(doc: PDFKit.PDFDocument, cells: string[], isHeader: boolean): void {
  const cellW = CONTENT_WIDTH / Math.max(cells.length, 1);
  const rowY = doc.y;
  if (isHeader) {
    doc.rect(MARGIN, rowY - 2, CONTENT_WIDTH, 20).fill(BRAND.surface);
  }
  cells.forEach((cell, i) => {
    const x = MARGIN + i * cellW;
    const clean = stripInline(cell.trim());
    if (isHeader) {
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor(BRAND.muted)
        .text(clean.toUpperCase(), x + 4, rowY + 2, { width: cellW - 8, lineGap: 1 });
    } else {
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(BRAND.text)
        .text(clean, x + 4, rowY, { width: cellW - 8, lineGap: 1 });
    }
  });
  const rowH = isHeader ? 22 : Math.max(doc.y - rowY + 4, 16);
  doc.rect(MARGIN, rowY + (isHeader ? 18 : rowH), CONTENT_WIDTH, 0.5).fill(BRAND.border);
  doc.moveDown(0.2);
}

function renderHRule(doc: PDFKit.PDFDocument): void {
  doc.moveDown(0.4);
  doc.rect(MARGIN, doc.y, CONTENT_WIDTH, 0.5).fill(BRAND.border);
  doc.moveDown(0.4);
}

function drawPageHeader(doc: PDFKit.PDFDocument): void {
  doc.rect(MARGIN, MARGIN, CONTENT_WIDTH, 2).fill(BRAND.primary);
  doc
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor(BRAND.muted)
    .text('SZL HOLDINGS — CONFIDENTIAL', MARGIN, MARGIN + 8, {
      characterSpacing: 1.5,
      width: CONTENT_WIDTH,
    });
  doc.moveDown(0.5);
}

function drawFooters(doc: PDFKit.PDFDocument, docTitle: string): void {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    const y = doc.page.height - 50;
    doc.rect(MARGIN, y, CONTENT_WIDTH, 0.5).fill(BRAND.border);
    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(BRAND.muted)
      .text(
        `SZL Holdings — ${docTitle}  |  Confidential  |  Page ${i + 1} of ${range.count}  |  ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`,
        MARGIN,
        y + 10,
        { align: 'center', width: CONTENT_WIDTH },
      );
  }
}

export function generateInvestorDocPdf(
  markdownContent: string,
  docTitle: string,
  subtitle: string,
): PassThrough {
  const doc = new PDFDocument({
    size: 'letter',
    margins: { top: 100, bottom: 72, left: MARGIN, right: MARGIN },
    info: {
      Title: docTitle,
      Author: 'SZL Holdings',
      Creator: 'SZL Holdings Document Engine',
      Subject: 'Investor Confidential',
    },
    bufferPages: true,
  });

  const stream = new PassThrough();
  doc.pipe(stream);

  doc.rect(0, 0, doc.page.width, doc.page.height).fill(BRAND.bg);
  drawPageHeader(doc);

  doc
    .font('Helvetica-Bold')
    .fontSize(24)
    .fillColor(BRAND.text)
    .text(docTitle, MARGIN, doc.y + 8, { width: CONTENT_WIDTH });
  doc.moveDown(0.4);
  doc
    .font('Helvetica')
    .fontSize(11)
    .fillColor(BRAND.muted)
    .text(subtitle, MARGIN, doc.y, { width: CONTENT_WIDTH });
  doc.moveDown(0.3);
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(BRAND.muted)
    .text(
      `Prepared: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}  ·  Confidential — For qualified investors only`,
      MARGIN,
      doc.y,
      { width: CONTENT_WIDTH },
    );
  doc.rect(MARGIN, doc.y + 10, CONTENT_WIDTH, 1).fill(BRAND.primary);
  doc.moveDown(1.2);

  const lines = markdownContent.split('\n');
  let i = 0;
  let orderedCounter = 0;
  let inCodeBlock = false;
  const codeLines: string[] = [];

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        renderCodeBlock(doc, codeLines);
        codeLines.length = 0;
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      i++;
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      i++;
      continue;
    }

    if (line.startsWith('#### ')) {
      renderH4(doc, line.slice(5));
      orderedCounter = 0;
    } else if (line.startsWith('### ')) {
      renderH3(doc, line.slice(4));
      orderedCounter = 0;
    } else if (line.startsWith('## ')) {
      renderH2(doc, line.slice(3));
      orderedCounter = 0;
    } else if (line.startsWith('# ')) {
      renderH1(doc, line.slice(2));
      orderedCounter = 0;
    } else if (line.startsWith('---')) {
      renderHRule(doc);
      orderedCounter = 0;
    } else if (line.match(/^\s*[-*+] /)) {
      const indent = Math.floor((line.match(/^(\s*)/)?.[1].length ?? 0) / 2);
      renderBullet(doc, line.replace(/^\s*[-*+] /, ''), indent);
      orderedCounter = 0;
    } else if (line.match(/^\d+\. /)) {
      orderedCounter++;
      renderNumbered(doc, line.replace(/^\d+\. /, ''), orderedCounter);
    } else if (line.startsWith('|')) {
      const separatorMatch = lines[i + 1]?.startsWith('|---') || lines[i + 1]?.startsWith('| ---');
      const cells = line
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());
      if (cells.length > 0) {
        renderTableRow(doc, cells, separatorMatch);
        if (separatorMatch) {
          i += 2;
          continue;
        }
        orderedCounter = 0;
      }
    } else if (line.trim() === '') {
      orderedCounter = 0;
    } else {
      renderParagraph(doc, line);
      orderedCounter = 0;
    }

    i++;
  }

  if (inCodeBlock && codeLines.length > 0) {
    renderCodeBlock(doc, codeLines);
  }

  drawFooters(doc, docTitle);
  doc.end();

  return stream;
}
