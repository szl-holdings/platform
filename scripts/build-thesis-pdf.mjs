#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, basename } from 'node:path';
import MarkdownIt from 'markdown-it';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
if (args.length < 4) {
  console.error('usage: build-thesis-pdf.mjs <input.md> <output.pdf> <title> <subtitle>');
  process.exit(2);
}
const [inputPath, outputPath, title, subtitle] = args;
const md = new MarkdownIt({ html: true, linkify: true, typographer: true });
const source = readFileSync(inputPath, 'utf-8');
const parts = source.split(/^---\s*$/m);
const body = parts.length > 1 ? parts.slice(1).join('---') : source;
const rendered = md.render(body);
const today = new Date().toISOString().slice(0, 10);
const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${title}</title>
<style>
  @page { size: Letter; margin: 1in 1in 1in 1in; }
  @page :first { margin-top: 2.2in; }
  html { font-family: "Charter","Palatino Linotype","Times New Roman",serif; font-size: 10.5pt; color:#111; }
  body { line-height: 1.5; max-width: 6.5in; margin: 0 auto; }
  .titlepage { page-break-after: always; text-align:center; padding-top: 1.5in; }
  .titlepage h1 { font-size: 26pt; font-weight: 700; line-height: 1.15; margin: 0 0 0.4in; }
  .titlepage .subtitle { font-size: 16pt; font-style: italic; color:#333; margin: 0 0 0.9in; line-height:1.3; }
  .titlepage .author { font-size: 13pt; margin: 0.4in 0 0.05in; }
  .titlepage .affil { font-size: 11pt; color:#444; margin: 0; }
  .titlepage .meta { font-size: 10pt; color:#555; margin-top: 1.6in; }
  .titlepage .doi { font-size: 9.5pt; color:#666; margin-top: 0.25in; font-family: "SF Mono","Menlo",monospace; }
  h1, h2, h3, h4 { font-family: "Optima","Helvetica Neue",Arial,sans-serif; color:#0b2545; line-height:1.25; }
  h1 { font-size: 18pt; margin-top: 0.4in; padding-bottom: 0.05in; border-bottom: 1.5pt solid #0b2545; }
  h2 { font-size: 14pt; margin-top: 0.32in; }
  h3 { font-size: 12pt; margin-top: 0.22in; color:#1a3a6e; }
  h4 { font-size: 11pt; margin-top: 0.18in; color:#2a4a7a; }
  p { text-align: justify; margin: 0.06in 0 0.12in; orphans:3; widows:3; }
  ul, ol { margin: 0.05in 0 0.15in 0.25in; padding-left: 0.2in; }
  li { margin: 0.04in 0; }
  blockquote { border-left: 3pt solid #c9b787; margin: 0.2in 0.3in; padding: 0.05in 0.2in; color:#333; font-style: italic; background:#fcfaf5; }
  code { font-family: "SF Mono","Menlo","Consolas",monospace; font-size: 9.5pt; background:#f5f5f7; padding: 0.5pt 3pt; border-radius: 2pt; }
  pre { font-family: "SF Mono","Menlo","Consolas",monospace; font-size: 9pt; background:#f7f7f9; border:0.5pt solid #e1e1e6; border-radius:3pt; padding:8pt 10pt; overflow-x:auto; line-height:1.4; page-break-inside: avoid; }
  pre code { background:transparent; padding:0; font-size:9pt; }
  table { width: 100%; border-collapse: collapse; margin: 0.15in 0; font-size: 9.5pt; page-break-inside: avoid; }
  th { background:#f0f3f8; text-align:left; padding: 4pt 6pt; border-bottom: 1pt solid #c9d2e0; font-family:"Optima","Helvetica Neue",Arial,sans-serif; color:#0b2545; }
  td { padding: 3pt 6pt; border-bottom: 0.5pt solid #e8ebf0; vertical-align: top; }
  tr:nth-child(even) td { background:#fafbfd; }
  hr { border: none; border-top: 0.5pt solid #c9d2e0; margin: 0.3in 0; }
  a { color:#0b4f9c; text-decoration: none; }
  strong { color:#0b2545; }
  .footer-rule { margin-top: 0.4in; border-top: 0.5pt solid #ccc; font-size: 9pt; text-align:center; color:#666; padding-top: 6pt; }
</style></head>
<body>
  <div class="titlepage">
    <h1>${title}</h1>
    <div class="subtitle">${subtitle}</div>
    <div class="author">Stephen P. Lutar Jr.</div>
    <div class="affil">SZL Holdings &middot; SZL Consulting Ltd</div>
    <div class="affil">ORCID 0009-0001-0110-4173 &middot; inquiries@szlholdings.com</div>
    <div class="meta">May ${today.slice(8,10)}, ${today.slice(0,4)} &middot; License CC&nbsp;BY&nbsp;4.0</div>
    <div class="doi">github.com/szl-holdings/ouroboros-thesis</div>
  </div>
  ${rendered}
  <div class="footer-rule">&copy; 2026 SZL Holdings &middot; The Ouroboros Thesis &middot; CC BY 4.0</div>
</body>
</html>`;
mkdirSync(dirname(outputPath), { recursive: true });
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.pdf({
    path: outputPath,
    format: 'Letter',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate:
      '<div style="font-size:8pt;color:#888;width:100%;text-align:center;font-family:Helvetica,Arial,sans-serif;">' +
      basename(outputPath, '.pdf') + ' &nbsp;&middot;&nbsp; <span class="pageNumber"></span> / <span class="totalPages"></span>' +
      '</div>',
    margin: { top: '0.85in', bottom: '0.85in', left: '1in', right: '1in' },
  });
  console.log('wrote', outputPath);
} finally {
  await browser.close();
}
