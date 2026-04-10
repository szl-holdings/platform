import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const doc = new PDFDocument({
  size: 'LETTER',
  margins: { top: 50, bottom: 50, left: 55, right: 55 },
  info: {
    Title: 'SZL Holdings — LinkedIn Posting Guide & Investor Showcase',
    Author: 'Stephen Lutar',
    Subject: 'Step-by-step LinkedIn posting guide with investor-ready content',
  }
});

const outputPath = path.resolve('export/SZL-LinkedIn-Investor-Guide.pdf');
doc.pipe(fs.createWriteStream(outputPath));

const gold = '#D4A054';
const dark = '#0f172a';
const gray = '#64748b';
const medGray = '#475569';
const white = '#ffffff';
const lightBg = '#f8fafc';

const pageW = doc.page.width;
const contentW = pageW - 110;

function drawPageHeader(title) {
  doc.rect(0, 0, pageW, 90).fill(dark);
  doc.fillColor(gold).fontSize(24).font('Helvetica-Bold');
  doc.text('SZL Holdings', 55, 25);
  doc.fillColor('#94a3b8').fontSize(10).font('Helvetica');
  doc.text(title, 55, 55);
  doc.fillColor(gold).fontSize(8);
  doc.text('CONFIDENTIAL', pageW - 130, 30);
  doc.y = 110;
}

function sectionHead(text) {
  doc.moveDown(0.8);
  doc.fillColor(gold).fontSize(13).font('Helvetica-Bold');
  doc.text(text, 55);
  doc.moveTo(55, doc.y + 2).lineTo(55 + contentW, doc.y + 2).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
  doc.moveDown(0.5);
}

function stepNumber(num, title) {
  doc.moveDown(0.5);
  const y = doc.y;
  doc.circle(75, y + 8, 12).fill(gold);
  doc.fillColor(white).fontSize(11).font('Helvetica-Bold');
  doc.text(String(num), 67, y + 2, { width: 16, align: 'center' });
  doc.fillColor(dark).fontSize(12).font('Helvetica-Bold');
  doc.text(title, 95, y + 1);
  doc.moveDown(0.3);
}

function body(text, opts = {}) {
  doc.fillColor(opts.color || '#334155').fontSize(opts.size || 10).font(opts.font || 'Helvetica');
  doc.text(text, opts.x || 55, undefined, { width: opts.width || contentW, lineGap: 3, ...opts });
}

function bullet(text, indent = 70) {
  doc.fillColor('#334155').fontSize(10).font('Helvetica');
  doc.text(`•  ${text}`, indent, undefined, { width: contentW - (indent - 55), lineGap: 2 });
}

function tipBox(text) {
  const y = doc.y + 5;
  doc.rect(55, y, contentW, 30).fillAndStroke('#fef9ee', '#e2c07a');
  doc.fillColor('#92400e').fontSize(9).font('Helvetica-Bold');
  doc.text('TIP: ', 65, y + 9, { continued: true });
  doc.font('Helvetica').text(text, { width: contentW - 30 });
  doc.y = y + 38;
}

function postBlock(text) {
  const lines = text.split('\n');
  const lineHeight = 13;
  const blockH = lines.length * lineHeight + 20;
  
  if (doc.y + blockH > doc.page.height - 60) {
    doc.addPage();
    drawPageHeader('LinkedIn Posting Guide');
  }
  
  const y = doc.y + 3;
  doc.rect(55, y, contentW, blockH).fillAndStroke(lightBg, '#cbd5e1');
  doc.moveTo(55, y).lineTo(55, y + blockH).lineWidth(3).strokeColor(gold).stroke();
  
  doc.fillColor('#1e293b').fontSize(9).font('Courier');
  let curY = y + 10;
  for (const line of lines) {
    doc.text(line, 68, curY, { width: contentW - 25 });
    curY += lineHeight;
  }
  doc.y = y + blockH + 8;
}

// ═══════════════════════════════════════════
// PAGE 1 — COVER + OVERVIEW
// ═══════════════════════════════════════════
drawPageHeader('LinkedIn Posting Guide for Investors');

doc.fillColor(dark).fontSize(20).font('Helvetica-Bold');
doc.text('How to Post on LinkedIn', 55, 120);
doc.fillColor(medGray).fontSize(12).font('Helvetica');
doc.text('Step-by-step guide to sharing your GitHub and platform upgrades', 55);
doc.text('Optimized for investor discovery and design partner conversations', 55);
doc.moveDown(1);

body('This guide gives you everything you need to make one high-impact LinkedIn post that shows what you\'ve built, links to your GitHub profiles, and invites investor and buyer conversations — without exposing any source code or IP.');
doc.moveDown(0.5);

sectionHead('WHAT THIS POST ACCOMPLISHES');
bullet('Establishes credibility — real screenshots, real numbers, real platforms');
bullet('Drives traffic to your GitHub profiles (both personal and organization)');
bullet('Signals availability for acquisition, investment, or design partner conversations');
bullet('Protects IP — no code, no architecture details, no downloadable assets');
bullet('Uses LinkedIn algorithm best practices — text-only post with links in comments');

sectionHead('BEFORE YOU POST — CHECKLIST');
doc.moveDown(0.3);
bullet('Your GitHub personal profile is public: github.com/stephenlutar2-hash');
bullet('Your GitHub org profile is public: github.com/szl-holdings');
bullet('Both display screenshots of all platforms in a visual grid');
bullet('All source code repos are PRIVATE — no code visible anywhere');
bullet('No releases or download links exist on any repository');
bullet('Your LinkedIn profile headline mentions SZL Holdings and your role');

// ═══════════════════════════════════════════
// PAGE 2 — STEP-BY-STEP
// ═══════════════════════════════════════════
doc.addPage();
drawPageHeader('LinkedIn Posting Guide');

doc.fillColor(dark).fontSize(18).font('Helvetica-Bold');
doc.text('Step-by-Step Instructions', 55, 110);
doc.moveDown(0.5);

stepNumber(1, 'Open LinkedIn and Start a New Post');
body('Go to linkedin.com. Click "Start a post" at the top of your feed. Make sure you\'re posting from your personal profile (Stephen Lutar), not a company page.');
doc.moveDown(0.3);

stepNumber(2, 'Copy and Paste the Post Text');
body('Copy the exact text from the next page of this PDF. Paste it into the LinkedIn post editor. Do NOT add any images or documents to the post itself — text-only posts get more reach on LinkedIn.');
doc.moveDown(0.3);

tipBox('LinkedIn\'s algorithm favors text-only posts. Put your links in the FIRST COMMENT, not in the post body. This increases reach by 2-3x.');

stepNumber(3, 'Publish the Post');
body('Click "Post" to publish. Do not schedule it — post it live so you can immediately add the comment with links.');
doc.moveDown(0.3);

stepNumber(4, 'Immediately Add the First Comment');
body('As soon as the post is live, add a comment with your links. Copy the comment text from page 4 of this PDF. This keeps the links visible but doesn\'t hurt your reach.');
doc.moveDown(0.3);

stepNumber(5, 'Engage With Responses');
body('When people comment or react, respond within the first hour. LinkedIn boosts posts that get early engagement. Keep responses professional and brief. If someone asks about the code or architecture, direct them to email you for an NDA conversation.');
doc.moveDown(0.3);

tipBox('Best times to post on LinkedIn: Tuesday-Thursday, 8-10 AM your timezone. Avoid weekends and Mondays.');

stepNumber(6, 'Follow Up in 24 Hours');
body('If the post gets good traction (10+ reactions, 3+ comments), post a follow-up comment the next day with one additional insight about your platform. This re-surfaces the post in the feed.');

// ═══════════════════════════════════════════
// PAGE 3 — THE POST TEXT
// ═══════════════════════════════════════════
doc.addPage();
drawPageHeader('LinkedIn Posting Guide');

doc.fillColor(dark).fontSize(18).font('Helvetica-Bold');
doc.text('The Post — Copy This Exactly', 55, 110);
doc.moveDown(0.3);
doc.fillColor(gray).fontSize(9).font('Helvetica');
doc.text('Select all text in the gray box below. Copy. Paste into LinkedIn.', 55);
doc.moveDown(0.5);

postBlock(`Just shipped a major upgrade to the SZL Holdings presence.

One founder. Six platforms. 16 live applications.
One TypeScript monorepo. One compounding architecture.

What we build:

Vessels — Maritime fleet command and intelligence
Aegis — Unified defense and security operations
Terra — Real estate market intelligence and deal pipeline
Lyte — Business observability that surfaces risk before it compounds
PRISM Counsel — Legal matter command with deadline tracking
Carlota Jo — Private advisory coordination

The numbers:
446 database tables
1,618+ API endpoints
8 web apps + 8 mobile apps
Full TypeScript — zero JavaScript

What changed this week:
— Visual showcase across both GitHub profiles
— Real screenshots of every platform
— Architecture documentation and operating philosophy
— Investor-ready documentation

The principles:
— AI cannot execute without human confirmation
— Every recommendation includes citations and confidence
— Failures surface immediately. They never hide.
— One architecture, six verticals, compounding returns.

Open to design partner conversations, enterprise
evaluation, and investment introductions.

Links in comments.`);

doc.moveDown(0.3);
body('HASHTAGS — Add these at the very end of your post:', { font: 'Helvetica-Bold' });
doc.moveDown(0.2);
postBlock(`#SZLHoldings #AI #AIGovernance #TypeScript #StartupFounder
#EnterpriseAI #BusinessObservability #MaritimeTech #PropTech
#LegalTech #Cybersecurity #BuildInPublic #SoloFounder`);

// ═══════════════════════════════════════════
// PAGE 4 — THE COMMENT TEXT
// ═══════════════════════════════════════════
doc.addPage();
drawPageHeader('LinkedIn Posting Guide');

doc.fillColor(dark).fontSize(18).font('Helvetica-Bold');
doc.text('First Comment — Copy This', 55, 110);
doc.moveDown(0.3);
doc.fillColor(gray).fontSize(9).font('Helvetica');
doc.text('Post this as a comment IMMEDIATELY after publishing. This is where your links go.', 55);
doc.moveDown(0.5);

postBlock(`Links:

GitHub (personal): github.com/stephenlutar2-hash
GitHub (organization): github.com/szl-holdings
Platform: szlholdings.com
Writing: szlholdings.substack.com

For code review, architecture walkthrough, or buyer
conversations — reach me at stephenlutar2@gmail.com

All source code is in private repositories.
Access available under NDA for qualified parties.`);

doc.moveDown(1);
sectionHead('WHAT TO SAY WHEN PEOPLE ASK ABOUT THE CODE');
doc.moveDown(0.3);

body('Someone will ask to see the code. Here\'s how to handle it:', { font: 'Helvetica-Bold' });
doc.moveDown(0.5);

body('If they ask casually:', { font: 'Helvetica-Bold', color: gold });
postBlock(`Thanks for the interest! The source code is in private
repositories. Happy to do a walkthrough under NDA —
send me a note at stephenlutar2@gmail.com`);

doc.moveDown(0.3);
body('If they seem like a serious buyer/investor:', { font: 'Helvetica-Bold', color: gold });
postBlock(`Appreciate the interest. I have a detailed architecture
document and can arrange a live demo. Let me send you
more information — what's the best email?`);

doc.moveDown(0.3);
body('If they ask for open-source or public access:', { font: 'Helvetica-Bold', color: gold });
postBlock(`This is proprietary enterprise software — not open source.
The GitHub profiles show what the platforms do. For
architecture details, happy to chat privately.`);

// ═══════════════════════════════════════════
// PAGE 5 — SCREENSHOTS + LINKS REFERENCE
// ═══════════════════════════════════════════
doc.addPage();
drawPageHeader('Platform Showcase');

doc.fillColor(dark).fontSize(18).font('Helvetica-Bold');
doc.text('Your Platforms — What Investors See', 55, 110);
doc.moveDown(0.3);
doc.fillColor(gray).fontSize(9).font('Helvetica');
doc.text('These screenshots are embedded in your GitHub profiles. Investors see them when they click your links.', 55);
doc.moveDown(0.5);

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

const imgW = 230;
const imgH = 125;
let col = 0;
let rowY = doc.y;

for (let i = 0; i < screenshotFiles.length; i++) {
  const { file, label } = screenshotFiles[i];
  const imgPath = path.resolve(`screenshots/${file}`);
  
  if (rowY + imgH + 30 > doc.page.height - 60) {
    doc.addPage();
    drawPageHeader('Platform Showcase');
    rowY = 110;
    col = 0;
  }
  
  const x = col === 0 ? 55 : 55 + imgW + 18;
  
  try {
    doc.save();
    doc.roundedRect(x, rowY, imgW, imgH, 4).clip();
    doc.image(imgPath, x, rowY, { width: imgW, height: imgH, fit: [imgW, imgH] });
    doc.restore();
    doc.roundedRect(x, rowY, imgW, imgH, 4).strokeColor('#e2e8f0').lineWidth(1).stroke();
  } catch(e) {}
  
  doc.fillColor(dark).fontSize(8).font('Helvetica-Bold');
  doc.text(label, x, rowY + imgH + 5, { width: imgW, align: 'center' });
  
  col++;
  if (col === 2) {
    col = 0;
    rowY += imgH + 28;
  }
}

if (col === 1) rowY += imgH + 28;

// ═══════════════════════════════════════════
// PAGE 6 — SECURITY + CONTACT
// ═══════════════════════════════════════════
doc.addPage();
drawPageHeader('Security & Contact');

doc.fillColor(dark).fontSize(18).font('Helvetica-Bold');
doc.text('What Is Protected', 55, 110);
doc.moveDown(0.5);

body('Your GitHub presence is designed to show authority without exposing intellectual property:');
doc.moveDown(0.5);

bullet('All source code repositories are PRIVATE — no one can see your code');
bullet('No GitHub releases exist — no downloadable source archives');
bullet('No tar.gz or zip files in any repository or git history');
bullet('Screenshots show the UI only — no code, no architecture diagrams, no database schemas');
bullet('The only public repos are your profile READMEs — they contain zero source code');
bullet('Clean IP — all code written by you, no contractor dependencies');
doc.moveDown(0.5);

body('What IS visible (by design):', { font: 'Helvetica-Bold' });
doc.moveDown(0.3);
bullet('Platform names and descriptions');
bullet('Screenshots of each application\'s user interface');
bullet('High-level tech stack (TypeScript, React, PostgreSQL, etc.)');
bullet('Operating principles and philosophy');
bullet('Contact information');
doc.moveDown(0.5);

body('What is NOT visible:', { font: 'Helvetica-Bold' });
doc.moveDown(0.3);
bullet('Source code — none is accessible');
bullet('Database schema or table structure');
bullet('API endpoint definitions or documentation');
bullet('Architecture diagrams or system design');
bullet('Business logic or proprietary algorithms');
bullet('Authentication or security implementation');

doc.moveDown(1);
sectionHead('CONTACT INFORMATION');
doc.moveDown(0.3);

doc.fillColor(dark).fontSize(14).font('Helvetica-Bold');
doc.text('Stephen Lutar');
doc.fillColor(medGray).fontSize(11).font('Helvetica');
doc.text('Founder & CEO — SZL Holdings');
doc.moveDown(0.5);

bullet('Email: stephenlutar2@gmail.com');
bullet('LinkedIn: linkedin.com/in/stephenlutar');
bullet('Platform: szlholdings.com');
bullet('Substack: szlholdings.substack.com');
bullet('X / Twitter: x.com/szlholdings');
bullet('GitHub: github.com/stephenlutar2-hash');
bullet('Organization: github.com/szl-holdings');

doc.moveDown(1.5);
doc.fillColor(gray).fontSize(8).font('Helvetica');
doc.text('This document is confidential. Prepared for Stephen Lutar. Do not distribute.', { align: 'center' });

doc.end();
console.log('PDF generated:', outputPath);
