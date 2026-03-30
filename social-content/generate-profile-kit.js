const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const COLORS = {
  bg: '#0a0a0f',
  bgCard: '#12121a',
  bgBox: '#1a1a2e',
  cyan: '#00d4ff',
  cyanDark: '#0099bb',
  gold: '#c8a84e',
  white: '#ffffff',
  lightGray: '#cccccc',
  midGray: '#888888',
  darkGray: '#333344',
  green: '#00cc88',
  red: '#ff4444',
};

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;
const OUTPUT_DIR = path.join(__dirname, 'pdf-guides');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'social-media-profile-kit.pdf');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const doc = new PDFDocument({
  size: 'LETTER',
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  bufferPages: true,
  info: {
    Title: 'SZL Holdings — Social Media Profile Kit',
    Author: 'Stephen Lutar',
    Subject: 'Complete Social Media Profile & Launch Content',
    Creator: 'SZL Holdings',
  },
});

const stream = fs.createWriteStream(OUTPUT_FILE);
doc.pipe(stream);

let currentY = MARGIN;

function drawPageBackground() {
  doc.save();
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill(COLORS.bg);
  doc.restore();
}

function ensureSpace(needed) {
  if (currentY + needed > PAGE_HEIGHT - MARGIN) {
    doc.addPage();
    drawPageBackground();
    currentY = MARGIN;
  }
}

function drawLine(y, color = COLORS.darkGray) {
  doc.save();
  doc.moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).strokeColor(color).lineWidth(0.5).stroke();
  doc.restore();
}

function writeTitle(text, size = 28) {
  ensureSpace(size + 20);
  doc.font('Helvetica-Bold').fontSize(size).fillColor(COLORS.cyan);
  doc.text(text, MARGIN, currentY, { width: CONTENT_WIDTH });
  currentY = doc.y + 10;
}

function writeSubtitle(text, size = 18) {
  ensureSpace(size + 15);
  doc.font('Helvetica-Bold').fontSize(size).fillColor(COLORS.white);
  doc.text(text, MARGIN, currentY, { width: CONTENT_WIDTH });
  currentY = doc.y + 8;
}

function writeSubheading(text, size = 14) {
  ensureSpace(size + 12);
  doc.font('Helvetica-Bold').fontSize(size).fillColor(COLORS.gold);
  doc.text(text, MARGIN, currentY, { width: CONTENT_WIDTH });
  currentY = doc.y + 6;
}

function writeBody(text, size = 10) {
  ensureSpace(size + 8);
  doc.font('Helvetica').fontSize(size).fillColor(COLORS.lightGray);
  doc.text(text, MARGIN, currentY, { width: CONTENT_WIDTH, lineGap: 3 });
  currentY = doc.y + 6;
}

function writeBullet(text, indent = 15) {
  ensureSpace(18);
  doc.font('Helvetica').fontSize(10).fillColor(COLORS.cyan);
  doc.text('\u2022', MARGIN + indent - 12, currentY);
  doc.font('Helvetica').fontSize(10).fillColor(COLORS.lightGray);
  doc.text(text, MARGIN + indent, currentY, { width: CONTENT_WIDTH - indent });
  currentY = doc.y + 4;
}

function writeLabel(label, value) {
  ensureSpace(20);
  doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.gold);
  doc.text(label + ':', MARGIN + 10, currentY);
  const labelWidth = doc.widthOfString(label + ':');
  doc.font('Helvetica').fontSize(10).fillColor(COLORS.white);
  doc.text(value, MARGIN + 10 + labelWidth + 8, currentY, { width: CONTENT_WIDTH - 20 - labelWidth - 8 });
  currentY = doc.y + 4;
}

function writeCopyBox(title, text) {
  const textHeight = doc.font('Helvetica').fontSize(9).heightOfString(text, { width: CONTENT_WIDTH - 30 });
  const boxHeight = textHeight + 40;
  ensureSpace(boxHeight + 10);

  doc.save();
  doc.roundedRect(MARGIN, currentY, CONTENT_WIDTH, boxHeight, 4).fillAndStroke(COLORS.bgBox, COLORS.cyanDark);
  doc.restore();

  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.cyan);
  doc.text(title, MARGIN + 12, currentY + 8, { width: CONTENT_WIDTH - 24 });

  doc.font('Helvetica').fontSize(9).fillColor(COLORS.white);
  doc.text(text, MARGIN + 12, currentY + 22, { width: CONTENT_WIDTH - 24, lineGap: 2 });

  currentY += boxHeight + 8;
}

function writeNote(text) {
  const textHeight = doc.font('Helvetica').fontSize(9).heightOfString(text, { width: CONTENT_WIDTH - 40 });
  const boxHeight = textHeight + 20;
  ensureSpace(boxHeight + 10);

  doc.save();
  doc.roundedRect(MARGIN, currentY, CONTENT_WIDTH, boxHeight, 4).fillAndStroke('#1a2a1a', COLORS.green);
  doc.restore();

  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.green);
  doc.text('NOTE:', MARGIN + 12, currentY + 8);
  doc.font('Helvetica').fontSize(9).fillColor(COLORS.lightGray);
  doc.text(text, MARGIN + 55, currentY + 8, { width: CONTENT_WIDTH - 67 });

  currentY += boxHeight + 8;
}

function newSection() {
  doc.addPage();
  drawPageBackground();
  currentY = MARGIN;
}

function embedImage(imagePath, maxWidth, maxHeight) {
  if (!fs.existsSync(imagePath)) return;
  try {
    const imgWidth = Math.min(maxWidth, CONTENT_WIDTH);
    ensureSpace(maxHeight + 10);
    const xCenter = MARGIN + (CONTENT_WIDTH - imgWidth) / 2;
    doc.image(imagePath, xCenter, currentY, { width: imgWidth, height: maxHeight, fit: [imgWidth, maxHeight] });
    currentY += maxHeight + 10;
  } catch (e) {}
}

drawPageBackground();

doc.font('Helvetica-Bold').fontSize(36).fillColor(COLORS.cyan);
doc.text('SZL HOLDINGS', MARGIN, 100, { width: CONTENT_WIDTH, align: 'center' });

doc.font('Helvetica').fontSize(14).fillColor(COLORS.gold);
doc.text('SOCIAL MEDIA PROFILE KIT', MARGIN, 150, { width: CONTENT_WIDTH, align: 'center' });
doc.text('& LAUNCH CONTENT', MARGIN, 170, { width: CONTENT_WIDTH, align: 'center' });

drawLine(200, COLORS.cyan);

doc.font('Helvetica').fontSize(12).fillColor(COLORS.white);
doc.text('Complete Profile Setup for All Platforms', MARGIN, 220, { width: CONTENT_WIDTH, align: 'center' });
doc.text('X  |  LinkedIn  |  Instagram  |  YouTube  |  Medium  |  Substack', MARGIN, 240, { width: CONTENT_WIDTH, align: 'center' });

doc.font('Helvetica').fontSize(10).fillColor(COLORS.midGray);
doc.text('Prepared for Stephen Lutar', MARGIN, 280, { width: CONTENT_WIDTH, align: 'center' });
doc.text('Founder & CTO, SZL Holdings', MARGIN, 296, { width: CONTENT_WIDTH, align: 'center' });
doc.text('stephen@szlholdings.com', MARGIN, 312, { width: CONTENT_WIDTH, align: 'center' });

const heroPath = path.join(__dirname, 'screenshots', 'szl-holdings-hero.jpg');
if (fs.existsSync(heroPath)) {
  try {
    doc.image(heroPath, MARGIN + 80, 340, { width: CONTENT_WIDTH - 160, height: 180, fit: [CONTENT_WIDTH - 160, 180] });
  } catch(e) {}
}

doc.font('Helvetica').fontSize(9).fillColor(COLORS.darkGray);
doc.text('CONFIDENTIAL — For Personal Use Only', MARGIN, PAGE_HEIGHT - 60, { width: CONTENT_WIDTH, align: 'center' });


newSection();
writeTitle('TABLE OF CONTENTS');
currentY += 10;

const tocItems = [
  ['Section 1', 'Quick Reference Card — Handles, URLs & Schedule'],
  ['Section 2', 'X (@szlholdings) — Profile Content'],
  ['Section 3', 'LinkedIn (Personal Page) — Profile Content'],
  ['Section 4', 'Instagram (@szlholdings) — Profile Content'],
  ['Section 5', 'YouTube (@SZLHoldings) — Channel Content'],
  ['Section 6', 'Medium (szlholdings) — Publication Content'],
  ['Section 7', 'Substack (szlholdings) — Publication Content'],
  ['Section 8', 'Inaugural First Posts — All Platforms'],
  ['Section 9', 'LinkedIn Carousel Guide'],
  ['Section 10', 'Platform Banner & Header Specifications'],
];

tocItems.forEach(([section, title]) => {
  doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.cyan);
  doc.text(section, MARGIN, currentY);
  doc.font('Helvetica').fontSize(11).fillColor(COLORS.white);
  doc.text(title, MARGIN + 90, currentY);
  currentY += 26;
});


newSection();
writeTitle('SECTION 1');
writeSubtitle('Quick Reference Card');
drawLine(currentY, COLORS.cyan);
currentY += 15;

writeSubheading('Account Handles & URLs');
currentY += 5;

const accounts = [
  { platform: 'X (Twitter)', handle: '@szlholdings', url: 'https://x.com/szlholdings' },
  { platform: 'LinkedIn', handle: 'Stephen Lutar (Personal)', url: 'https://linkedin.com/in/stephenlutar' },
  { platform: 'Instagram', handle: '@szlholdings', url: 'https://instagram.com/szlholdings' },
  { platform: 'YouTube', handle: '@SZLHoldings', url: 'https://youtube.com/@SZLHoldings' },
  { platform: 'Medium', handle: '@szlholdings', url: 'https://medium.com/@szlholdings' },
  { platform: 'Substack', handle: 'szlholdings', url: 'https://szlholdings.substack.com' },
  { platform: 'Website', handle: 'szlholdings.com', url: 'https://szlholdings.com' },
  { platform: 'Email', handle: 'stephen@szlholdings.com', url: '' },
];

accounts.forEach(a => {
  ensureSpace(18);
  doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.gold);
  doc.text(a.platform, MARGIN + 10, currentY, { width: 100 });
  doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.white);
  doc.text(a.handle, MARGIN + 115, currentY, { width: 150 });
  doc.font('Helvetica').fontSize(9).fillColor(COLORS.cyan);
  doc.text(a.url, MARGIN + 275, currentY, { width: CONTENT_WIDTH - 285 });
  currentY += 18;
});

currentY += 15;
writeSubheading('Weekly Posting Schedule');
currentY += 5;

const schedule = [
  { platform: 'LinkedIn', frequency: 'Tuesday & Thursday', time: '8:00-9:00 AM GMT', type: 'B2B professional insights' },
  { platform: 'X (Twitter)', frequency: 'Mon, Wed, Fri', time: '12:00-1:00 PM GMT', type: 'Tech insights & threads' },
  { platform: 'Instagram', frequency: 'Tuesday & Friday', time: '11:00 AM-1:00 PM GMT', type: 'Visual content & carousels' },
  { platform: 'YouTube', frequency: 'Thursday', time: '2:00-4:00 PM GMT', type: 'Long-form content & demos' },
  { platform: 'Medium', frequency: 'Wednesday', time: 'Morning GMT', type: 'Technical deep-dives & essays' },
  { platform: 'Substack', frequency: 'Monday', time: 'Morning GMT', type: 'Weekly newsletter' },
];

schedule.forEach(s => {
  ensureSpace(18);
  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.gold);
  doc.text(s.platform, MARGIN + 10, currentY, { width: 80 });
  doc.font('Helvetica').fontSize(9).fillColor(COLORS.white);
  doc.text(s.frequency, MARGIN + 95, currentY, { width: 110 });
  doc.font('Helvetica').fontSize(9).fillColor(COLORS.lightGray);
  doc.text(s.time, MARGIN + 210, currentY, { width: 120 });
  doc.font('Helvetica').fontSize(9).fillColor(COLORS.midGray);
  doc.text(s.type, MARGIN + 340, currentY, { width: CONTENT_WIDTH - 350 });
  currentY += 18;
});

currentY += 10;
writeSubheading('Content Formula');
writeBullet('60% Professional insights & thought leadership');
writeBullet('20% Personal story & founder journey');
writeBullet('20% Company updates & platform reveals');

currentY += 10;
writeSubheading('Primary Hashtags (use on every post)');
writeCopyBox('ALWAYS USE', '#BuildInPublic  #TechFounder  #SZLHoldings  #Innovation');

writeSubheading('Rotating Hashtags (pick 3-4 per post)');
writeCopyBox('ROTATE FROM', '#AI  #MachineLearning  #Cybersecurity  #Observability  #PredictiveAI  #StartupLife  #FounderJourney  #TechLeadership  #SaaS  #B2B  #EnterpriseAI  #SecurityOps  #DataScience  #StrategicConsulting  #CreativeTech  #FullStack  #SystemDesign  #ProductDevelopment  #MaritimeTech');


newSection();
writeTitle('SECTION 2');
writeSubtitle('X (@szlholdings) — Profile Content');
drawLine(currentY, COLORS.cyan);
currentY += 15;

writeNote('X bio limit: 160 characters. All fields below are copy-paste ready.');
currentY += 5;

writeSubheading('Display Name');
writeCopyBox('DISPLAY NAME (copy this)', 'Stephen Lutar | SZL Holdings');

writeSubheading('Bio (160 characters)');
writeCopyBox('X BIO (copy this — 158 chars)',
  'Founder & CTO @SZLHoldings | Building an interconnected tech ecosystem: AI, cybersecurity, predictive intelligence, maritime & creative tech | #BuildInPublic');

writeSubheading('Location');
writeCopyBox('LOCATION', 'United Kingdom');

writeSubheading('Website');
writeCopyBox('WEBSITE URL', 'https://szlholdings.com');

writeSubheading('Category');
writeCopyBox('CATEGORY', 'Technology & Computing');

writeSubheading('Extended Description (for Pinned Tweet or Profile Thread)');
writeCopyBox('EXTENDED DESCRIPTION',
  `I'm building SZL Holdings — a portfolio of 15+ interconnected technology platforms spanning AI research, cybersecurity operations, predictive intelligence, intelligent observability, maritime tech, creative AI, and strategic consulting.

Every platform is production-grade. Every one was designed, engineered, and deployed by one person. And every one connects to the others in ways that make the whole greater than the sum of its parts.

The ecosystem includes: INCA (AI research intelligence), Lyte (observability), ROSIE + Aegis + Firestorm (cybersecurity stack), Nimbus + Beacon (predictive analytics), Vessels (maritime intelligence), DreamEra + Dreamscape (creative tech), Zeus (orchestration), and Carlota Jo (strategic consulting).

Follow along as I build in public and reveal the architecture behind the entire system.`);

writeSubheading('Pinned Tweet Suggestion');
writeCopyBox('PIN THIS TWEET',
  `I built an entire technology ecosystem. Alone.

15+ interconnected platforms:
- AI research intelligence
- Cybersecurity operations
- Predictive analytics
- Maritime intelligence
- Creative AI
- Strategic consulting

All production-grade. All connected.

This is SZL Holdings. Follow along.

szlholdings.com

#BuildInPublic #TechFounder #SZLHoldings`);


newSection();
writeTitle('SECTION 3');
writeSubtitle('LinkedIn (Personal Page) — Profile Content');
drawLine(currentY, COLORS.cyan);
currentY += 15;

writeNote('LinkedIn personal profile — not a company page. Stephen has 2,000 existing followers to leverage.');
currentY += 5;

writeSubheading('Headline (220 chars max)');
writeCopyBox('LINKEDIN HEADLINE (copy this)',
  'Founder & CTO | SZL Holdings | Building 15+ interconnected AI, cybersecurity, maritime & creative tech platforms | System architect | #BuildInPublic');

writeSubheading('About Section');
writeCopyBox('LINKEDIN ABOUT (copy this)',
  `I'm building something ambitious: SZL Holdings — a technology holding company with a portfolio of 15+ interconnected production-grade platforms spanning AI research, cybersecurity, predictive intelligence, observability, maritime tech, creative technology, and strategic consulting.

Every platform was designed, engineered, and shipped by me — from system architecture to production deployment. The ecosystem is built on one thesis: interconnected platforms create exponentially more value than isolated tools.

THE ECOSYSTEM:
\u2022 INCA — AI research intelligence & experiment tracking
\u2022 Lyte — Intelligent observability & system monitoring
\u2022 ROSIE — AI-powered threat detection & security operations
\u2022 Aegis — Enterprise defensive security & compliance
\u2022 Firestorm — Incident response simulation & training
\u2022 Nimbus — Predictive AI & confidence-scored forecasting
\u2022 Beacon — Cross-platform analytics & decision intelligence
\u2022 Vessels — Maritime intelligence & vessel tracking
\u2022 Zeus — Platform orchestration & modular architecture
\u2022 DreamEra — Creative AI & neural storytelling
\u2022 Dreamscape — Immersive creative experiences
\u2022 AlloyScape — Infrastructure operations & integration
\u2022 Carlota Jo — Strategic consulting & advisory

MY CORE BELIEFS:
1. The best technology doesn't just solve problems — it creates systems that anticipate, protect, and evolve
2. Architecture matters more than any individual feature
3. The connections between platforms create more value than the platforms themselves
4. Building in public is the fastest way to earn trust

I specialise in full-stack platform development, system architecture, AI/ML, cybersecurity, and strategic technology consulting.

Previously worked across enterprise software, consulting, and technology leadership roles.

Let's connect — I'm always interested in conversations with people building ambitious things.

stephen@szlholdings.com | szlholdings.com`);

writeSubheading('Featured Section Suggestions');
writeBullet('SZL Holdings website — link to szlholdings.com with description "The technology holding company I founded"');
writeBullet('Apps Showcase — link to the full platform catalog');
writeBullet('Carlota Jo Consulting — link to the strategic advisory arm');
writeBullet('Week 1 LinkedIn post (once published) — pin as featured content');
writeBullet('LinkedIn carousel PDFs — upload the ecosystem overview carousel');

currentY += 5;
writeSubheading('Experience Entry — SZL Holdings');
writeCopyBox('EXPERIENCE ENTRY',
  `Title: Founder & CTO
Company: SZL Holdings
Location: United Kingdom
Start Date: [Your start date]
Description:

Founded and built SZL Holdings, a technology holding company with a portfolio of 15+ interconnected production-grade platforms. Sole designer, engineer, and architect of the entire ecosystem.

Key achievements:
\u2022 Designed and built 15+ production-grade platforms spanning AI, cybersecurity, predictive intelligence, observability, maritime tech, and creative AI
\u2022 Architected an interconnected ecosystem where intelligence flows between platforms for compound value
\u2022 Developed a three-layer cybersecurity stack (ROSIE + Aegis + Firestorm) covering detection, defense, and response
\u2022 Built AI research intelligence platform (INCA) serving as the ecosystem's central nervous system
\u2022 Created maritime intelligence platform (Vessels) for vessel tracking and route analysis
\u2022 Established strategic consulting practice (Carlota Jo) bridging technology and business advisory

Tech stack: TypeScript, React, Node.js, Python, PostgreSQL, AI/ML, real-time systems, system architecture`);

writeSubheading('Experience Entry — Carlota Jo Consulting');
writeCopyBox('CONSULTING EXPERIENCE',
  `Title: Principal Consultant
Company: Carlota Jo Consulting
Location: United Kingdom
Description:

Strategic advisory arm of SZL Holdings, delivering elite consulting for enterprises, family offices, and institutional investors. Practice areas include digital transformation strategy, AI integration advisory, security posture assessment, and portfolio management.

"Where Vision Meets Precision"`);


newSection();
writeTitle('SECTION 4');
writeSubtitle('Instagram (@szlholdings) — Profile Content');
drawLine(currentY, COLORS.cyan);
currentY += 15;

writeNote('Instagram bio limit: 150 characters. Visual-first platform — focus on portfolio screenshots and branded graphics.');
currentY += 5;

writeSubheading('Display Name');
writeCopyBox('DISPLAY NAME', 'SZL Holdings | Stephen Lutar');

writeSubheading('Bio (150 characters)');
writeCopyBox('INSTAGRAM BIO (copy this — 147 chars)',
  `Founder building 15+ tech platforms \u2022 AI \u2022 Cybersecurity \u2022 Maritime \u2022 Creative Tech\nOne ecosystem. One engineer.\n\u2B07 See the portfolio`);

writeSubheading('Website Link');
writeCopyBox('WEBSITE', 'https://szlholdings.com');

writeSubheading('Category');
writeCopyBox('CATEGORY', 'Science, Technology & Engineering');

writeSubheading('Story Highlights Suggestions');
writeBullet('"Ecosystem" — Screenshots of all platforms with brief descriptions');
writeBullet('"Security" — ROSIE, Aegis, Firestorm screenshots and features');
writeBullet('"AI/ML" — INCA, Nimbus, Beacon screenshots');
writeBullet('"Maritime" — Vessels intelligence platform');
writeBullet('"Creative" — DreamEra and Dreamscape visuals');
writeBullet('"Build Log" — Behind-the-scenes of building the ecosystem');
writeBullet('"Consulting" — Carlota Jo practice areas and approach');

currentY += 5;
writeSubheading('Content Strategy');
writeBullet('Carousel posts: Multi-slide branded decks explaining each platform');
writeBullet('Reels: 30-60 second walkthrough of each platform dashboard');
writeBullet('Stories: Daily build log, code snippets, architecture decisions');
writeBullet('Grid aesthetic: Consistent dark theme with cyan/gold accent colours matching SZL brand');


newSection();
writeTitle('SECTION 5');
writeSubtitle('YouTube (@SZLHoldings) — Channel Content');
drawLine(currentY, COLORS.cyan);
currentY += 15;

writeSubheading('Channel Name');
writeCopyBox('CHANNEL NAME', 'SZL Holdings');

writeSubheading('Channel Handle');
writeCopyBox('HANDLE', '@SZLHoldings');

writeSubheading('Channel Description');
writeCopyBox('CHANNEL DESCRIPTION (copy this)',
  `SZL Holdings is a technology holding company with a portfolio of 15+ interconnected production-grade platforms spanning AI research, cybersecurity operations, predictive intelligence, observability, maritime tech, creative AI, and strategic consulting.

On this channel, you'll find:
\u2022 Platform deep-dives and architecture walkthroughs
\u2022 Build-in-public updates showing real development progress
\u2022 System design breakdowns and technical decision-making
\u2022 AI and cybersecurity insights from building production platforms
\u2022 The founder journey of building an entire tech ecosystem as a solo engineer

Founded and built by Stephen Lutar — every platform in the ecosystem was designed, engineered, and deployed by one person.

Website: https://szlholdings.com
LinkedIn: https://linkedin.com/in/stephenlutar
X: https://x.com/szlholdings

#BuildInPublic #TechFounder #SZLHoldings`);

writeSubheading('About Section (Short)');
writeCopyBox('ABOUT',
  'One engineer. 15+ interconnected tech platforms. AI, cybersecurity, predictive intelligence, maritime tech, and more. Building the future in public.');

writeSubheading('Channel Links');
writeBullet('Website: https://szlholdings.com');
writeBullet('LinkedIn: https://linkedin.com/in/stephenlutar');
writeBullet('X / Twitter: https://x.com/szlholdings');
writeBullet('Instagram: https://instagram.com/szlholdings');
writeBullet('Medium: https://medium.com/@szlholdings');
writeBullet('Substack: https://szlholdings.substack.com');

currentY += 5;
writeSubheading('Channel Keywords');
writeCopyBox('KEYWORDS (paste into Studio > Channel > Basic Info)',
  'SZL Holdings, tech founder, build in public, AI, artificial intelligence, cybersecurity, predictive analytics, observability, maritime technology, creative AI, system architecture, full stack, startup, solo founder, technology ecosystem, enterprise software, security operations, machine learning, TypeScript, React');

writeSubheading('Suggested Playlists');
writeBullet('"The Ecosystem" — Overview and architecture of SZL Holdings');
writeBullet('"Platform Deep Dives" — Individual walkthroughs of each platform');
writeBullet('"Build in Public" — Development updates and progress');
writeBullet('"System Design" — Architecture decisions and technical breakdowns');
writeBullet('"Security Stack" — Cybersecurity platform features and methodology');


newSection();
writeTitle('SECTION 6');
writeSubtitle('Medium (szlholdings) — Publication Content');
drawLine(currentY, COLORS.cyan);
currentY += 15;

writeSubheading('Display Name');
writeCopyBox('DISPLAY NAME', 'Stephen Lutar');

writeSubheading('Bio');
writeCopyBox('MEDIUM BIO (copy this)',
  'Founder & CTO of SZL Holdings. Building 15+ interconnected tech platforms spanning AI, cybersecurity, predictive intelligence, maritime tech, and creative AI. Writing about system architecture, the founder journey, and building in public.');

writeSubheading('Publication Name');
writeCopyBox('PUBLICATION NAME', 'SZL Holdings — Building in Public');

writeSubheading('Publication Description');
writeCopyBox('PUBLICATION DESCRIPTION (copy this)',
  `Inside the architecture, decisions, and lessons from building an entire technology ecosystem as a solo founder. SZL Holdings spans 15+ interconnected platforms covering AI research, cybersecurity operations, predictive intelligence, intelligent observability, maritime tech, creative AI, and strategic consulting.

This publication covers:
\u2022 Technical deep-dives into platform architecture and system design
\u2022 The interconnection model: how platforms share intelligence for compound value
\u2022 Lessons from building production-grade software across multiple domains
\u2022 The founder journey: decisions, mistakes, and insights from building alone
\u2022 Industry perspectives on AI, cybersecurity, and emerging technology

Written by Stephen Lutar, Founder & CTO of SZL Holdings.`);

writeSubheading('Recommended Tags');
writeBullet('Technology, Artificial Intelligence, Cybersecurity, Startup, Software Engineering');
writeBullet('System Design, Architecture, Build In Public, Founder, Machine Learning');
writeBullet('Predictive Analytics, Maritime, Creative Tech, Observability, SaaS');


newSection();
writeTitle('SECTION 7');
writeSubtitle('Substack (szlholdings) — Publication Content');
drawLine(currentY, COLORS.cyan);
currentY += 15;

writeSubheading('Publication Name');
writeCopyBox('PUBLICATION NAME', 'The SZL Signal');

writeSubheading('Tagline');
writeCopyBox('TAGLINE', 'Inside the architecture of a one-person technology ecosystem');

writeSubheading('Description');
writeCopyBox('SUBSTACK DESCRIPTION (copy this)',
  `The SZL Signal is a weekly dispatch from the founder of SZL Holdings — a technology holding company with 15+ interconnected production-grade platforms spanning AI research, cybersecurity, predictive intelligence, maritime tech, creative AI, and strategic consulting.

Each week, you'll get:
\u2022 Behind-the-scenes architecture decisions and technical deep-dives
\u2022 The real story of building an entire tech ecosystem as a solo engineer
\u2022 Insights on AI, cybersecurity, and emerging technology trends
\u2022 Platform updates and new feature reveals
\u2022 Honest reflections on the founder journey — what worked, what didn't, and what I'd do differently

This isn't a polished corporate newsletter. It's a builder's journal. Raw, honest, and technical.

If you're interested in system design, ambitious technology projects, or the intersection of AI, security, and creative tech — subscribe and join the journey.`);

writeSubheading('About Page Content');
writeCopyBox('ABOUT PAGE (copy this)',
  `Hi, I'm Stephen Lutar.

I'm the founder of SZL Holdings, and I'm building something that most people would call impossible: an entire interconnected technology ecosystem, designed, engineered, and deployed by one person.

The SZL ecosystem currently includes 15+ production-grade platforms:

\u2022 INCA — AI research intelligence
\u2022 Lyte — Intelligent observability
\u2022 ROSIE, Aegis, Firestorm — Three-layer cybersecurity stack
\u2022 Nimbus & Beacon — Predictive intelligence & analytics
\u2022 Vessels — Maritime intelligence
\u2022 DreamEra & Dreamscape — Creative AI platforms
\u2022 Zeus — Platform orchestration
\u2022 AlloyScape — Infrastructure operations
\u2022 Carlota Jo — Strategic consulting

Every platform connects to the others. Intelligence flows between them. The whole is greater than the sum of its parts.

The SZL Signal is where I share the journey: architecture decisions, technical deep-dives, honest founder reflections, and weekly platform updates.

I believe the best way to build trust is to build in public. So that's what I'm doing.

Connect with me:
\u2022 Website: szlholdings.com
\u2022 LinkedIn: linkedin.com/in/stephenlutar
\u2022 X: x.com/szlholdings
\u2022 Email: stephen@szlholdings.com`);

writeSubheading('Welcome Email Draft');
writeCopyBox('WELCOME EMAIL (sent to new subscribers)',
  `Subject: Welcome to The SZL Signal

Hi there,

Thanks for subscribing to The SZL Signal. You've just joined a front-row seat to something ambitious.

I'm Stephen Lutar, and I'm building SZL Holdings — an interconnected technology ecosystem of 15+ production-grade platforms spanning AI research, cybersecurity, predictive intelligence, maritime tech, creative AI, and strategic consulting. All built by one person.

Here's what you can expect every week:

1. ARCHITECTURE INSIGHTS — How the platforms are designed and why those decisions were made
2. BUILD UPDATES — Real progress, not polished press releases
3. INDUSTRY PERSPECTIVES — My take on AI, cybersecurity, and emerging tech
4. HONEST REFLECTIONS — What's working, what's not, and what I'm learning

If you're new to SZL Holdings, here's where to start:
\u2022 szlholdings.com — The main portfolio site
\u2022 The Ecosystem Overview — See all 15+ platforms and how they connect

I read every reply. If you have questions, ideas, or just want to say hello — hit reply.

Let's build something great.

Stephen
Founder & CTO, SZL Holdings`);


newSection();
writeTitle('SECTION 8');
writeSubtitle('Inaugural First Posts — All Platforms');
drawLine(currentY, COLORS.cyan);
currentY += 15;

writeBody('Copy-paste ready first posts for each platform, tailored to format and audience. Post these as your inaugural "we\'re here" announcements.');
currentY += 10;

writeSubheading('X (@szlholdings) — First Tweet Thread');
writeCopyBox('TWEET 1 OF 5',
  `I've been building quietly for a year. Today I'm going public.

Introducing SZL Holdings — a portfolio of 15+ interconnected technology platforms. AI, cybersecurity, predictive intelligence, maritime tech, creative AI, and consulting.

All production-grade. All built by one engineer.

Thread \u2B07`);

writeCopyBox('TWEET 2 OF 5',
  `The ecosystem:

\u2022 INCA — AI research intelligence
\u2022 Lyte — Intelligent observability
\u2022 ROSIE + Aegis + Firestorm — Cybersecurity stack
\u2022 Nimbus + Beacon — Predictive analytics
\u2022 Vessels — Maritime intelligence
\u2022 DreamEra + Dreamscape — Creative AI
\u2022 Zeus — Orchestration
\u2022 Carlota Jo — Consulting`);

writeCopyBox('TWEET 3 OF 5',
  `Why interconnected?

Because isolated tools create data silos. Connected platforms create intelligence.

When your security system talks to your observability platform, and your AI research feeds your predictions — you get compound value that no single tool can match.`);

writeCopyBox('TWEET 4 OF 5',
  `Over the next 8 weeks, I'm pulling back the curtain on every platform.

Architecture decisions. Technical deep-dives. Honest lessons.

If you're building something ambitious — follow along.

#BuildInPublic starts now.`);

writeCopyBox('TWEET 5 OF 5',
  `I'm Stephen Lutar. Builder. Founder. System architect.

And I'm just getting started.

szlholdings.com

#BuildInPublic #TechFounder #SZLHoldings`);

currentY += 10;
writeSubheading('LinkedIn — First Post (Long-Form)');
writeCopyBox('LINKEDIN FIRST POST (copy this)',
  `What happens when a single engineer decides to build an entire technology ecosystem from scratch?

Not a startup. Not a side project. An ecosystem.

Over the past year, I've been quietly building SZL Holdings — a portfolio of interconnected platforms spanning AI research, cybersecurity, predictive intelligence, observability, maritime tech, creative AI, and strategic consulting.

Every platform is production-grade. Every one was designed, engineered, and shipped by one person. And every one connects to the others in ways that make the whole greater than the sum of its parts.

THE ECOSYSTEM:
\u2022 INCA — AI research intelligence & experiment tracking
\u2022 Lyte — Intelligent observability & system monitoring
\u2022 ROSIE + Aegis + Firestorm — Three-layer cybersecurity stack
\u2022 Nimbus + Beacon — Predictive analytics & forecasting
\u2022 Vessels — Maritime intelligence & vessel tracking
\u2022 DreamEra + Dreamscape — Creative AI & immersive experiences
\u2022 Zeus — Platform orchestration
\u2022 Carlota Jo — Strategic consulting & advisory

Over the next 8 weeks, I'm going to pull back the curtain on every single one.

Here's what I've learned so far:
1. The best systems think like ecosystems, not silos
2. Building in public is uncomfortable — but it's the fastest way to earn trust
3. The hardest skill isn't coding. It's knowing what to build next

This is Week 1. The Genesis. SZL Holdings is the foundation.

Let's connect — I'm always interested in conversations with people building ambitious things.

#BuildInPublic #TechFounder #SZLHoldings #Innovation #StartupLife #FounderJourney #TechLeadership #AI #Cybersecurity`);

currentY += 10;
writeSubheading('Instagram — First Post Caption');
writeCopyBox('INSTAGRAM FIRST POST (copy this)',
  `One engineer. One ecosystem. 15+ platforms.

Introducing SZL Holdings \u2014 a technology holding company I\u2019ve been quietly building for the past year.

The portfolio spans:
\u2726 AI research intelligence (INCA)
\u2726 Cybersecurity operations (ROSIE, Aegis, Firestorm)
\u2726 Predictive analytics (Nimbus, Beacon)
\u2726 Maritime intelligence (Vessels)
\u2726 Creative AI (DreamEra, Dreamscape)
\u2726 Strategic consulting (Carlota Jo)

Every platform is production-grade. Every one connects to the others.

The whole is greater than the sum of its parts.

Over the next 8 weeks, I\u2019m revealing everything. Follow along.

\u2014\u2014\u2014
#BuildInPublic #TechFounder #SZLHoldings #Innovation #AI #Cybersecurity #StartupLife #FounderJourney #CreativeTech #MaritimeTech #PredictiveAI #SystemDesign #TechLeadership #SoloFounder`);

currentY += 10;
writeSubheading('YouTube — First Community Post');
writeCopyBox('YOUTUBE COMMUNITY POST (copy this)',
  `\ud83d\udce2 Welcome to SZL Holdings on YouTube!

I'm Stephen Lutar, and I've spent the past year building something ambitious: an entire interconnected technology ecosystem. Alone.

15+ production-grade platforms spanning AI research, cybersecurity, predictive intelligence, maritime tech, creative AI, and strategic consulting.

On this channel, you'll see:
\u2022 Platform deep-dives and architecture walkthroughs
\u2022 Build-in-public updates with real development progress
\u2022 System design breakdowns and technical decisions
\u2022 The honest founder journey — wins, mistakes, and lessons

First video coming soon: "The SZL Ecosystem — How 15+ Platforms Connect"

Subscribe and hit the bell so you don't miss it.

What platform would you like me to deep-dive first? Drop a comment below!

#BuildInPublic #TechFounder #SZLHoldings`);

currentY += 10;
writeSubheading('Medium — First Article Introduction');
writeCopyBox('MEDIUM FIRST ARTICLE (copy this)',
  `Title: I Built an Entire Technology Ecosystem. Alone. Here's Why.

---

What happens when a single engineer decides to build not one product, but an entire interconnected technology ecosystem?

That's the question I set out to answer a year ago. Today, I'm sharing the result.

SZL Holdings is a technology holding company with a portfolio of 15+ production-grade platforms. Each one was designed, engineered, and deployed by me — from system architecture to production deployment.

But this isn't a story about building a lot of things. It's a story about building connected things.

THE THESIS

Isolated tools create data silos. Connected platforms create intelligence.

When your AI research platform (INCA) feeds insights to your predictive engine (Nimbus), and your observability platform (Lyte) informs your security stack (ROSIE, Aegis, Firestorm), you get something that no individual tool can deliver: compound intelligence.

Every new platform makes every existing platform smarter. Every data point improves every prediction. The whole isn't just greater than the sum of its parts — it's a fundamentally different thing.

THE ECOSYSTEM

Here's what I built:

\u2022 INCA — AI research intelligence & experiment tracking
\u2022 Lyte — Intelligent observability & system monitoring
\u2022 ROSIE — AI-powered threat detection & security operations
\u2022 Aegis — Enterprise defensive security & compliance
\u2022 Firestorm — Incident response simulation & training
\u2022 Nimbus — Predictive AI & forecasting
\u2022 Beacon — Cross-platform analytics & alerting
\u2022 Vessels — Maritime intelligence & vessel tracking
\u2022 Zeus — Platform orchestration & architecture
\u2022 DreamEra — Creative AI & neural storytelling
\u2022 Dreamscape — Immersive creative experiences
\u2022 AlloyScape — Infrastructure operations
\u2022 Carlota Jo — Strategic consulting & advisory

Over the coming weeks, I'll be publishing deep-dives into each platform — the architecture decisions, the mistakes, and the lessons learned.

If you're interested in system design, AI, cybersecurity, or the founder journey — follow along. This is just the beginning.

\u2014 Stephen Lutar, Founder & CTO, SZL Holdings`);

currentY += 10;
writeSubheading('Substack — First Newsletter / Welcome Post');
writeCopyBox('SUBSTACK FIRST POST (copy this)',
  `Title: Welcome to The SZL Signal

---

Hi, I'm Stephen Lutar, and you're reading the first edition of The SZL Signal.

This newsletter exists because I believe the best way to build trust is to build in public. And I'm building something worth watching.

WHAT IS SZL HOLDINGS?

SZL Holdings is a technology holding company with a portfolio of 15+ interconnected production-grade platforms. Every platform was designed, engineered, and deployed by one person — me.

The ecosystem spans AI research, cybersecurity operations, predictive intelligence, intelligent observability, maritime tech, creative AI, and strategic consulting. And every platform connects to the others, sharing intelligence and creating compound value.

WHAT TO EXPECT FROM THIS NEWSLETTER

Every week, you'll get:

1. ARCHITECTURE DEEP-DIVE — A look inside how one of the platforms is built, the design decisions behind it, and the technical trade-offs I made.

2. BUILD UPDATE — What I shipped this week, what I'm working on next, and the real numbers behind the progress.

3. FOUNDER REFLECTION — The honest story. What's working, what's not, and what I'd do differently if I started over.

4. INDUSTRY PERSPECTIVE — My take on a trend, tool, or idea in AI, cybersecurity, or technology at large.

WHY SHOULD YOU CARE?

If you're interested in any of these, this newsletter is for you:
\u2022 System architecture and platform design
\u2022 The intersection of AI and cybersecurity
\u2022 Building ambitious technology as a solo founder
\u2022 The reality of shipping production software across multiple domains

NEXT WEEK

The first real edition drops next Monday. I'll be breaking down the architecture of INCA — the AI research intelligence platform that serves as the central nervous system of the entire SZL ecosystem.

Until then, hit reply and tell me: what part of the ecosystem are you most curious about?

Let's build.

Stephen
Founder & CTO, SZL Holdings
stephen@szlholdings.com`);


newSection();
writeTitle('SECTION 9');
writeSubtitle('LinkedIn Carousel Guide');
drawLine(currentY, COLORS.cyan);
currentY += 15;

writeBody('Five LinkedIn carousel PDFs have been generated as separate files. Upload these directly to LinkedIn as document posts for maximum engagement.');
currentY += 10;

const carousels = [
  { file: 'carousel-1-ecosystem-overview.pdf', title: 'The SZL Ecosystem — One Engineer, 15+ Platforms', desc: 'Overview of the complete SZL Holdings portfolio, the interconnection model, and the thesis behind building an ecosystem.' },
  { file: 'carousel-2-cybersecurity-stack.pdf', title: 'Why One Security Tool Isn\'t Enough', desc: 'The three-layer cybersecurity defense model: ROSIE (detection), Aegis (defense), Firestorm (response).' },
  { file: 'carousel-3-ai-analytics.pdf', title: 'From Data Drowning to Predictive Intelligence', desc: 'How INCA, Nimbus, and Beacon work together as the AI and analytics brain of the ecosystem.' },
  { file: 'carousel-4-maritime-intelligence.pdf', title: 'Maritime Intelligence — Vessels Platform', desc: 'How Vessels brings AI-powered intelligence to maritime operations, vessel tracking, and route analysis.' },
  { file: 'carousel-5-creative-tech.pdf', title: 'Creative Tech as Competitive Advantage', desc: 'DreamEra and Dreamscape — why creative AI platforms are the secret weapon of the SZL ecosystem.' },
];

carousels.forEach((c, i) => {
  writeSubheading(`Carousel ${i + 1}: ${c.title}`);
  writeLabel('File', c.file);
  writeBody(c.desc);
  currentY += 5;
});

writeNote('Upload carousel PDFs directly to LinkedIn using "Create a post" > Document icon. Add a caption with relevant hashtags for maximum reach.');


newSection();
writeTitle('SECTION 10');
writeSubtitle('Platform Banner & Header Specifications');
drawLine(currentY, COLORS.cyan);
currentY += 15;

writeBody('Platform-specific banner/header images have been generated in the banners/ directory. Upload these to each platform\'s profile header area.');
currentY += 10;

const bannerSpecs = [
  { platform: 'X (Twitter) Header', size: '1500 x 500 px', file: 'header-x-1500x500.png' },
  { platform: 'LinkedIn Banner', size: '1584 x 396 px', file: 'header-linkedin-1584x396.png' },
  { platform: 'YouTube Channel Art', size: '2560 x 1440 px', file: 'header-youtube-2560x1440.png' },
  { platform: 'Instagram Profile (Square)', size: '1080 x 1080 px', file: 'header-instagram-1080x1080.png' },
];

bannerSpecs.forEach(b => {
  writeLabel(b.platform, `${b.size} — ${b.file}`);
});

currentY += 15;
writeSubheading('Brand Colours for Custom Graphics');
currentY += 5;

const brandColors = [
  { name: 'Background (Dark)', hex: '#0a0a0f' },
  { name: 'Surface', hex: '#12121a' },
  { name: 'Primary Cyan', hex: '#00d4ff' },
  { name: 'Gold Accent', hex: '#c8a84e' },
  { name: 'Text (White)', hex: '#ffffff' },
  { name: 'Text (Muted)', hex: '#cccccc' },
  { name: 'Success Green', hex: '#00cc88' },
];

brandColors.forEach(c => {
  writeLabel(c.name, c.hex);
});

currentY += 10;
writeSubheading('Typography');
writeBullet('Headings: Serif font (e.g., Playfair Display) — matches SZL Holdings website');
writeBullet('Body: Clean sans-serif (e.g., Inter, Helvetica) — professional and readable');
writeBullet('Accents: Monospace for technical details and platform names');

doc.end();

stream.on('finish', () => {
  console.log(`Profile Kit PDF generated: ${OUTPUT_FILE}`);
  const stats = fs.statSync(OUTPUT_FILE);
  console.log(`File size: ${(stats.size / 1024).toFixed(0)} KB`);
});
