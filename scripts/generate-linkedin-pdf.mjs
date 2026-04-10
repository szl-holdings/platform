import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const doc = new PDFDocument({
  size: 'LETTER',
  margins: { top: 50, bottom: 50, left: 55, right: 55 },
  info: {
    Title: 'SZL Holdings — GitHub & Platform Showcase',
    Author: 'Stephen Lutar',
    Subject: 'LinkedIn Post + GitHub Profile Showcase',
  }
});

const outputPath = path.resolve('export/SZL-LinkedIn-GitHub-Showcase.pdf');
doc.pipe(fs.createWriteStream(outputPath));

const gold = '#D4A054';
const dark = '#0f172a';
const gray = '#64748b';
const white = '#ffffff';
const lightGray = '#f1f5f9';

function drawHeader() {
  doc.rect(0, 0, doc.page.width, 100).fill(dark);
  doc.fillColor(gold).fontSize(28).font('Helvetica-Bold');
  doc.text('SZL Holdings', 55, 30, { align: 'left' });
  doc.fillColor(white).fontSize(11).font('Helvetica');
  doc.text('Governed Operational Intelligence Platforms', 55, 65, { align: 'left' });
  doc.fillColor(gray).fontSize(9);
  doc.text('stephenlutar2@gmail.com  |  szlholdings.com  |  linkedin.com/in/stephenlutar', 55, 82, { align: 'left' });
  doc.moveDown(2);
}

function sectionTitle(title) {
  doc.moveDown(0.5);
  doc.fillColor(gold).fontSize(14).font('Helvetica-Bold');
  doc.text(title);
  doc.moveTo(55, doc.y + 2).lineTo(doc.page.width - 55, doc.y + 2).strokeColor(gold).lineWidth(1).stroke();
  doc.moveDown(0.5);
}

function bodyText(text) {
  doc.fillColor('#1e293b').fontSize(10).font('Helvetica');
  doc.text(text, { lineGap: 3 });
}

function bulletPoint(text) {
  doc.fillColor('#1e293b').fontSize(10).font('Helvetica');
  doc.text(`  •  ${text}`, { lineGap: 2 });
}

function statBox(label, value) {
  doc.fillColor(gold).fontSize(18).font('Helvetica-Bold');
  doc.text(value, { continued: true });
  doc.fillColor(gray).fontSize(10).font('Helvetica');
  doc.text(`  ${label}`);
}

drawHeader();
doc.y = 120;

sectionTitle('LINKEDIN POST — Ready to Copy & Paste');
doc.moveDown(0.3);

doc.rect(50, doc.y, doc.page.width - 100, 2).fill(lightGray);
doc.moveDown(0.5);

bodyText('Just finished a major upgrade to the SZL Holdings GitHub presence — and I wanted to share what we\'ve built.');
doc.moveDown(0.5);
bodyText('One founder. Six platforms. 16 live applications. One TypeScript monorepo.');
doc.moveDown(0.5);

doc.fillColor(dark).fontSize(10).font('Helvetica-Bold');
doc.text('Since the last update:');
doc.font('Helvetica');
bulletPoint('Full visual showcase on both GitHub profiles (personal + organization)');
bulletPoint('Real screenshots of every platform embedded in READMEs');
bulletPoint('Architecture documentation, tech stack, and operating philosophy');
bulletPoint('All source code secured in private repos — no downloads, no releases, no leaks');
bulletPoint('Buyer memo and investor-ready documentation');
doc.moveDown(0.5);

doc.fillColor(dark).fontSize(10).font('Helvetica-Bold');
doc.text('The platforms, all live and deployed:');
doc.font('Helvetica');
doc.moveDown(0.3);

const platforms = [
  ['Vessels', 'Maritime fleet command, AIS analytics, voyage management, sanctions screening'],
  ['Aegis', 'Unified SOC command, threat correlation, CVE tracking, incident governance'],
  ['Terra', 'Real estate market intelligence, distress engine, deal pipeline'],
  ['Lyte', 'Business observability, execution risk detection, ownership drift analysis'],
  ['PRISM Counsel', 'Legal matter command, deadline tracking, pressure scoring, proof chains'],
  ['Carlota Jo', 'Private advisory coordination for luxury residential environments'],
];

for (const [name, desc] of platforms) {
  doc.fillColor(gold).fontSize(10).font('Helvetica-Bold');
  doc.text(`  ${name}`, { continued: true });
  doc.fillColor('#475569').font('Helvetica');
  doc.text(` — ${desc}`);
}

doc.moveDown(0.5);
doc.fillColor(dark).fontSize(10).font('Helvetica-Bold');
doc.text('The numbers:');
doc.font('Helvetica');
bulletPoint('446 database tables');
bulletPoint('1,618+ API endpoints');
bulletPoint('8 web applications + 8 mobile apps');
bulletPoint('Full TypeScript — zero JavaScript');
bulletPoint('One compounding architecture');

doc.moveDown(0.5);
doc.fillColor(dark).fontSize(10).font('Helvetica-Bold');
doc.text('The principles:');
doc.font('Helvetica');
bulletPoint('AI cannot execute without human confirmation');
bulletPoint('Every recommendation includes source citations and confidence scores');
bulletPoint('Failures surface immediately — they never hide');
bulletPoint('Shared fabric, domain specialization');

doc.moveDown(0.5);
doc.fillColor(dark).fontSize(10).font('Helvetica-Bold');
doc.text('Links:');
doc.font('Helvetica');
bulletPoint('GitHub (personal): github.com/stephenlutar2-hash');
bulletPoint('GitHub (organization): github.com/szl-holdings');
bulletPoint('Platform: szlholdings.com');
bulletPoint('Writing: szlholdings.substack.com');

doc.moveDown(0.5);
bodyText('Open to design partner conversations, enterprise evaluation, and investment introductions.');
doc.moveDown(0.3);
doc.fillColor(dark).font('Helvetica-Bold').fontSize(10);
doc.text('stephenlutar2@gmail.com');
doc.moveDown(0.5);
doc.fillColor(gray).font('Helvetica').fontSize(8);
doc.text('#SZLHoldings #GitHub #AI #AIGovernance #TypeScript #StartupFounder #EnterpriseAI #BusinessObservability #MaritimeTech #PropTech #LegalTech #Cybersecurity #BuildInPublic #SoloFounder');

doc.addPage();
drawHeader();
doc.y = 120;

sectionTitle('GITHUB PROFILES — What Buyers and Investors See');
doc.moveDown(0.3);

doc.fillColor(dark).fontSize(11).font('Helvetica-Bold');
doc.text('Personal Profile: github.com/stephenlutar2-hash');
doc.fillColor(gray).fontSize(9).font('Helvetica');
doc.text('Public profile README with embedded screenshots of all 8 web applications, SVG banners, tech stack icons, platform descriptions, architecture overview, and contact links.');
doc.moveDown(0.5);

doc.fillColor(dark).fontSize(11).font('Helvetica-Bold');
doc.text('Organization Profile: github.com/szl-holdings');
doc.fillColor(gray).fontSize(9).font('Helvetica');
doc.text('Organization README with animated header, badge metrics, full platform grid with screenshots, tech stack, operating philosophy, and investor contact information.');
doc.moveDown(0.5);

doc.fillColor(dark).fontSize(11).font('Helvetica-Bold');
doc.text('Platform Repository: szl-holdings-platform (PRIVATE)');
doc.fillColor(gray).fontSize(9).font('Helvetica');
doc.text('Private repository with polished README, embedded screenshots, architecture documentation. Source code access available under NDA for qualified buyers.');
doc.moveDown(1);

sectionTitle('PLATFORM SCREENSHOTS');
doc.moveDown(0.3);

const screenshotFiles = [
  { file: 'vessels.jpg', label: 'Vessels — Maritime Intelligence' },
  { file: 'firestorm-aegis.jpg', label: 'Aegis — Defense & Intelligence' },
  { file: 'terra.jpg', label: 'Terra — Real Estate Intelligence' },
  { file: 'lyte-command-center.jpg', label: 'Lyte — Business Observability' },
  { file: 'prism-counsel.jpg', label: 'PRISM Counsel — Legal Matter Command' },
  { file: 'carlota-jo.jpg', label: 'Carlota Jo — Private Advisory' },
  { file: 'szl-holdings.jpg', label: 'SZL Holdings — Command Surface' },
  { file: 'stephen-site-fresh.jpg', label: 'Stephen Lutar — Founder Portfolio' },
];

const imgWidth = 230;
const imgHeight = 130;
let col = 0;
let rowY = doc.y;

for (let i = 0; i < screenshotFiles.length; i++) {
  const { file, label } = screenshotFiles[i];
  const imgPath = path.resolve(`screenshots/${file}`);
  
  if (rowY + imgHeight + 25 > doc.page.height - 60) {
    doc.addPage();
    drawHeader();
    rowY = 120;
    col = 0;
  }
  
  const x = col === 0 ? 55 : 55 + imgWidth + 15;
  
  try {
    doc.image(imgPath, x, rowY, { width: imgWidth, height: imgHeight, fit: [imgWidth, imgHeight] });
  } catch(e) {}
  
  doc.fillColor(dark).fontSize(8).font('Helvetica-Bold');
  doc.text(label, x, rowY + imgHeight + 3, { width: imgWidth, align: 'center' });
  
  col++;
  if (col === 2) {
    col = 0;
    rowY += imgHeight + 25;
  }
}

if (col === 1) rowY += imgHeight + 25;
doc.y = rowY + 10;

if (doc.y > doc.page.height - 200) {
  doc.addPage();
  drawHeader();
  doc.y = 120;
}

sectionTitle('SECURITY POSTURE');
doc.moveDown(0.3);
bulletPoint('All source code repositories are PRIVATE');
bulletPoint('No tar.gz or zip files in any repository or git history');
bulletPoint('No GitHub releases with source code download links');
bulletPoint('Only public repos: personal profile README (required) and org .github (required for org profile)');
bulletPoint('Neither public repo contains source code');
bulletPoint('Clean IP — all code founder-written, no contractor dependencies');
bulletPoint('Standard open-source dependencies (MIT/Apache licensed)');

doc.moveDown(1);
sectionTitle('CONTACT');
doc.moveDown(0.3);
doc.fillColor(dark).fontSize(11).font('Helvetica-Bold');
doc.text('Stephen Lutar');
doc.fillColor(gray).fontSize(10).font('Helvetica');
doc.text('Founder & CEO — SZL Holdings');
doc.moveDown(0.3);
bulletPoint('Email: stephenlutar2@gmail.com');
bulletPoint('LinkedIn: linkedin.com/in/stephenlutar');
bulletPoint('Platform: szlholdings.com');
bulletPoint('Substack: szlholdings.substack.com');
bulletPoint('X: x.com/szlholdings');

doc.moveDown(1);
doc.fillColor(gray).fontSize(8).font('Helvetica');
doc.text('This document is confidential and intended for serious buyers and partners only.', { align: 'center' });

doc.end();
console.log('PDF generated:', outputPath);
