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
};

const SLIDE_WIDTH = 1080;
const SLIDE_HEIGHT = 1080;
const OUTPUT_DIR = path.join(__dirname, 'pdf-guides');
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function drawSlideBackground(doc) {
  doc.save();
  doc.rect(0, 0, SLIDE_WIDTH, SLIDE_HEIGHT).fill(COLORS.bg);

  doc.rect(0, 0, SLIDE_WIDTH, 6).fill(COLORS.cyan);

  doc.save();
  doc.opacity(0.03);
  for (let i = 0; i < SLIDE_WIDTH; i += 40) {
    doc.moveTo(i, 0).lineTo(i, SLIDE_HEIGHT).strokeColor(COLORS.cyan).lineWidth(0.5).stroke();
  }
  for (let i = 0; i < SLIDE_HEIGHT; i += 40) {
    doc.moveTo(0, i).lineTo(SLIDE_WIDTH, i).strokeColor(COLORS.cyan).lineWidth(0.5).stroke();
  }
  doc.restore();

  doc.restore();
}

function drawFooter(doc, slideNum, totalSlides) {
  doc.rect(0, SLIDE_HEIGHT - 70, SLIDE_WIDTH, 70).fill(COLORS.bgCard);
  doc.moveTo(0, SLIDE_HEIGHT - 70).lineTo(SLIDE_WIDTH, SLIDE_HEIGHT - 70).strokeColor(COLORS.darkGray).lineWidth(1).stroke();

  doc.font('Helvetica-Bold').fontSize(16).fillColor(COLORS.gold);
  doc.text('SZL HOLDINGS', 60, SLIDE_HEIGHT - 52, { width: 300 });

  doc.font('Helvetica').fontSize(14).fillColor(COLORS.midGray);
  doc.text(`${slideNum} / ${totalSlides}`, SLIDE_WIDTH - 160, SLIDE_HEIGHT - 52, { width: 100, align: 'right' });
}

function drawTitleSlide(doc, title, subtitle, slideNum, totalSlides) {
  drawSlideBackground(doc);

  doc.save();
  doc.opacity(0.08);
  doc.rect(60, 200, SLIDE_WIDTH - 120, 4).fill(COLORS.gold);
  doc.rect(60, SLIDE_HEIGHT - 280, SLIDE_WIDTH - 120, 4).fill(COLORS.gold);
  doc.restore();

  doc.font('Helvetica-Bold').fontSize(18).fillColor(COLORS.gold);
  doc.text('SZL HOLDINGS', 60, 120, { width: SLIDE_WIDTH - 120, align: 'center' });

  doc.font('Helvetica-Bold').fontSize(52).fillColor(COLORS.white);
  doc.text(title, 80, 320, { width: SLIDE_WIDTH - 160, align: 'center', lineGap: 10 });

  doc.font('Helvetica').fontSize(22).fillColor(COLORS.lightGray);
  doc.text(subtitle, 100, 560, { width: SLIDE_WIDTH - 200, align: 'center', lineGap: 5 });

  doc.font('Helvetica').fontSize(16).fillColor(COLORS.midGray);
  doc.text('Stephen Lutar | Founder & CTO', 100, 700, { width: SLIDE_WIDTH - 200, align: 'center' });

  doc.font('Helvetica').fontSize(14).fillColor(COLORS.cyan);
  doc.text('#BuildInPublic  #SZLHoldings', 100, 740, { width: SLIDE_WIDTH - 200, align: 'center' });

  drawFooter(doc, slideNum, totalSlides);
}

function drawContentSlide(doc, heading, bullets, slideNum, totalSlides, accentColor = COLORS.cyan) {
  drawSlideBackground(doc);

  doc.rect(60, 80, 6, 50).fill(accentColor);

  doc.font('Helvetica-Bold').fontSize(38).fillColor(COLORS.white);
  doc.text(heading, 85, 85, { width: SLIDE_WIDTH - 170, lineGap: 5 });

  let y = doc.y + 40;
  bullets.forEach(bullet => {
    doc.font('Helvetica-Bold').fontSize(14).fillColor(accentColor);
    doc.text('\u25B8', 100, y);
    doc.font('Helvetica').fontSize(20).fillColor(COLORS.lightGray);
    doc.text(bullet, 130, y, { width: SLIDE_WIDTH - 230, lineGap: 4 });
    y = doc.y + 20;
  });

  drawFooter(doc, slideNum, totalSlides);
}

function drawQuoteSlide(doc, quote, attribution, slideNum, totalSlides) {
  drawSlideBackground(doc);

  doc.font('Helvetica-Bold').fontSize(80).fillColor(COLORS.gold);
  doc.text('\u201C', 80, 180);

  doc.font('Helvetica-Bold').fontSize(34).fillColor(COLORS.white);
  doc.text(quote, 100, 300, { width: SLIDE_WIDTH - 200, align: 'center', lineGap: 12 });

  if (attribution) {
    doc.font('Helvetica').fontSize(18).fillColor(COLORS.midGray);
    doc.text('\u2014 ' + attribution, 100, doc.y + 30, { width: SLIDE_WIDTH - 200, align: 'center' });
  }

  drawFooter(doc, slideNum, totalSlides);
}

function drawCTASlide(doc, heading, body, cta, slideNum, totalSlides) {
  drawSlideBackground(doc);

  doc.save();
  doc.roundedRect(100, 200, SLIDE_WIDTH - 200, 500, 20).fillAndStroke(COLORS.bgBox, COLORS.cyanDark);
  doc.restore();

  doc.font('Helvetica-Bold').fontSize(36).fillColor(COLORS.cyan);
  doc.text(heading, 140, 260, { width: SLIDE_WIDTH - 280, align: 'center', lineGap: 8 });

  doc.font('Helvetica').fontSize(20).fillColor(COLORS.lightGray);
  doc.text(body, 140, doc.y + 30, { width: SLIDE_WIDTH - 280, align: 'center', lineGap: 6 });

  doc.font('Helvetica-Bold').fontSize(22).fillColor(COLORS.gold);
  doc.text(cta, 140, doc.y + 30, { width: SLIDE_WIDTH - 280, align: 'center' });

  doc.font('Helvetica').fontSize(16).fillColor(COLORS.cyan);
  doc.text('szlholdings.com', 140, doc.y + 20, { width: SLIDE_WIDTH - 280, align: 'center' });

  drawFooter(doc, slideNum, totalSlides);
}

function generateCarousel(filename, slides) {
  const outputPath = path.join(OUTPUT_DIR, filename);
  const doc = new PDFDocument({ size: [SLIDE_WIDTH, SLIDE_HEIGHT], margin: 0 });
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  slides.forEach((slide, i) => {
    if (i > 0) doc.addPage();
    slide.render(doc, i + 1, slides.length);
  });

  doc.end();
  return new Promise(resolve => stream.on('finish', () => {
    console.log(`Generated: ${filename}`);
    resolve();
  }));
}


const carousel1 = [
  { render: (doc, n, t) => drawTitleSlide(doc, 'The SZL Ecosystem', 'One engineer. 15+ interconnected platforms.\nHow one person built a complete technology ecosystem.', n, t) },
  { render: (doc, n, t) => drawContentSlide(doc, 'The Problem with Modern Tech', [
    'Most companies build isolated tools that never talk to each other',
    'Data lives in silos — no cross-platform intelligence',
    'Security, analytics, and AI operate independently',
    'The result: expensive tooling with fractional value',
  ], n, t) },
  { render: (doc, n, t) => drawQuoteSlide(doc, 'What if every platform talked to every other platform?', 'The SZL Thesis', n, t) },
  { render: (doc, n, t) => drawContentSlide(doc, '15+ Production Platforms', [
    'INCA — AI Research Intelligence',
    'Lyte — Intelligent Observability',
    'ROSIE + Aegis + Firestorm — Cybersecurity Stack',
    'Nimbus + Beacon — Predictive Analytics',
    'Vessels — Maritime Intelligence',
    'DreamEra + Dreamscape — Creative AI',
    'Zeus — Platform Orchestration',
    'Carlota Jo — Strategic Consulting',
  ], n, t, COLORS.gold) },
  { render: (doc, n, t) => drawContentSlide(doc, 'The Interconnection Model', [
    'Intelligence flows between every platform',
    'INCA feeds research to Nimbus for predictions',
    'Lyte observability informs the security stack',
    'Beacon aggregates signals across the entire ecosystem',
    'Every new platform makes every existing one smarter',
  ], n, t) },
  { render: (doc, n, t) => drawQuoteSlide(doc, 'Architecture matters more than any individual feature. The connections create more value than the platforms themselves.', null, n, t) },
  { render: (doc, n, t) => drawCTASlide(doc, 'Follow the Journey', 'Over 8 weeks, every platform will be revealed.\nArchitecture decisions. Technical deep-dives.\nHonest lessons from building alone.', '#BuildInPublic #SZLHoldings', n, t) },
];

const carousel2 = [
  { render: (doc, n, t) => drawTitleSlide(doc, 'Why One Security Tool Isn\'t Enough', 'The three-layer cybersecurity defense model\nbuilt into the SZL ecosystem.', n, t) },
  { render: (doc, n, t) => drawContentSlide(doc, 'The Security Problem', [
    'Most companies buy ONE security product and call it done',
    'That\'s like having a lock but no alarm and no fire escape',
    'Detection, defense, and response are different disciplines',
    'They require different tools, UIs, and mental models',
  ], n, t, '#ff4444') },
  { render: (doc, n, t) => drawContentSlide(doc, 'Layer 1: ROSIE — Detection', [
    'AI-powered threat detection and automated triage',
    'First responder working 24/7 without fatigue',
    'Natural language threat analysis via Alloy AI assistant',
    'Real-time alerting and incident classification',
  ], n, t, COLORS.cyan) },
  { render: (doc, n, t) => drawContentSlide(doc, 'Layer 2: AEGIS — Defense', [
    'Enterprise defensive perimeter management',
    'Access controls and vulnerability assessment',
    'Compliance monitoring and reporting',
    'When a threat is identified, the doors are already locked',
  ], n, t, COLORS.gold) },
  { render: (doc, n, t) => drawContentSlide(doc, 'Layer 3: FIRESTORM — Response', [
    'Incident response simulation and scenario training',
    'Response coordination and procedure management',
    'Practice for every eventuality before it happens',
    'The war room for when the worst-case arrives',
  ], n, t, '#ff6600') },
  { render: (doc, n, t) => drawQuoteSlide(doc, 'Security isn\'t a product. It\'s a system. The best architecture mirrors how security teams actually think and work.', null, n, t) },
  { render: (doc, n, t) => drawCTASlide(doc, 'Three Platforms. One Defense Layer.', 'Detection. Defense. Response.\nEach purpose-built, all sharing intelligence.\nThis is how security should work.', '#BuildInPublic #Cybersecurity #SZLHoldings', n, t) },
];

const carousel3 = [
  { render: (doc, n, t) => drawTitleSlide(doc, 'From Data Drowning to Predictive Intelligence', 'How INCA, Nimbus, and Beacon transform\nraw data into actionable foresight.', n, t) },
  { render: (doc, n, t) => drawContentSlide(doc, 'The Data Problem', [
    'Most teams are drowning in data and starving for insight',
    '47 dashboards and zero understanding',
    'Metrics without context are just noise',
    'Retrospective analysis is already too late',
  ], n, t) },
  { render: (doc, n, t) => drawContentSlide(doc, 'INCA — The Brain', [
    'AI research intelligence and experiment tracking',
    'Real-time model performance benchmarking',
    'Cross-platform intelligence aggregation',
    'The central nervous system of the ecosystem',
    'Surfaces signal from noise',
  ], n, t, COLORS.green) },
  { render: (doc, n, t) => drawContentSlide(doc, 'Nimbus — The Forecaster', [
    'Predictive AI with confidence-scored forecasting',
    'Takes INCA intelligence + Lyte monitoring data',
    'Asks one question: "What happens next?"',
    'Pattern analysis across multiple domains',
  ], n, t, '#9966ff') },
  { render: (doc, n, t) => drawContentSlide(doc, 'Beacon — The Signal', [
    'Cross-platform analytics and alerting',
    'Trend detection and anomaly highlighting',
    'Intelligence reports across the entire ecosystem',
    'Where Nimbus predicts, Beacon surfaces',
  ], n, t, COLORS.cyan) },
  { render: (doc, n, t) => drawQuoteSlide(doc, 'A 70% accurate prediction that arrives 3 hours early is infinitely more valuable than a 99% accurate post-mortem.', null, n, t) },
  { render: (doc, n, t) => drawCTASlide(doc, 'Speed of Insight > Perfection of Analysis', 'The AI stack gets smarter as the ecosystem grows.\nMore platforms = more data = better predictions.\nCompound intelligence in action.', '#BuildInPublic #AI #SZLHoldings', n, t) },
];

const carousel4 = [
  { render: (doc, n, t) => drawTitleSlide(doc, 'Maritime Intelligence — Vessels', 'AI-powered insights for maritime operations,\nvessel tracking, and route analysis.', n, t) },
  { render: (doc, n, t) => drawContentSlide(doc, 'Why Maritime Intelligence?', [
    'Maritime is a $14T industry operating on outdated tools',
    'Vessel tracking lacks AI-powered analysis',
    'Route optimization is largely manual',
    'Risk assessment depends on experience, not data',
    'The opportunity for technology disruption is massive',
  ], n, t) },
  { render: (doc, n, t) => drawContentSlide(doc, 'Vessels Platform Capabilities', [
    'Real-time vessel tracking and monitoring',
    'AI-powered route analysis and optimization',
    'Risk assessment using predictive intelligence',
    'Fleet management and operational dashboards',
    'Integration with the broader SZL ecosystem',
  ], n, t, COLORS.cyan) },
  { render: (doc, n, t) => drawContentSlide(doc, 'The Ecosystem Advantage', [
    'Vessels connects to Nimbus for predictive route forecasting',
    'Lyte provides observability across maritime operations',
    'INCA aggregates maritime intelligence research',
    'Beacon surfaces cross-domain maritime signals',
    'No standalone maritime tool can offer this depth',
  ], n, t, COLORS.gold) },
  { render: (doc, n, t) => drawQuoteSlide(doc, 'The future of maritime isn\'t just digital — it\'s intelligent. AI-powered, predictive, and connected.', null, n, t) },
  { render: (doc, n, t) => drawCTASlide(doc, 'Maritime Meets AI', 'Vessels brings the power of the SZL ecosystem\nto one of the world\'s oldest industries.\nIntelligent. Predictive. Connected.', '#BuildInPublic #MaritimeTech #SZLHoldings', n, t) },
];

const carousel5 = [
  { render: (doc, n, t) => drawTitleSlide(doc, 'Creative Tech as Competitive Advantage', 'Why DreamEra and Dreamscape are the\nsecret weapons of the SZL ecosystem.', n, t) },
  { render: (doc, n, t) => drawContentSlide(doc, 'The Creative Gap in Tech', [
    'Everyone builds dashboards, APIs, and analytics',
    'Few invest in creative technology platforms',
    'The companies that win won\'t just have the best algorithms',
    'They\'ll have the best experiences and interfaces',
    'Creative tech is undervalued — and that\'s an opportunity',
  ], n, t) },
  { render: (doc, n, t) => drawContentSlide(doc, 'DreamEra — The Canvas', [
    'Creative AI storytelling and concept generation',
    'Neural narrative synthesis and artifact mapping',
    'Transform concepts into living, breathing story worlds',
    'Where ideas get their first visual form',
  ], n, t, '#ff66cc') },
  { render: (doc, n, t) => drawContentSlide(doc, 'Dreamscape — The Experience', [
    'Immersive digital experience creation',
    'Explore worlds and craft digital artifacts',
    'Generate extraordinary creative content',
    'Creativity as a technology platform',
  ], n, t, '#9966ff') },
  { render: (doc, n, t) => drawContentSlide(doc, 'Why It Makes Everything Better', [
    'Building creative tools uses different mental muscles',
    'Creative thinking improves technical architecture',
    'User experience insights transfer across all platforms',
    'Creative AI research feeds back into INCA intelligence',
    'The ecosystem benefits from cognitive diversity',
  ], n, t, COLORS.gold) },
  { render: (doc, n, t) => drawQuoteSlide(doc, 'Creative tech is competitive advantage disguised as art.', null, n, t) },
  { render: (doc, n, t) => drawCTASlide(doc, 'Build Serious Things. Build Beautiful Things.', 'DreamEra + Dreamscape prove that a tech\necosystem needs both function and expression.\nThe future of tech is expressive.', '#BuildInPublic #CreativeTech #SZLHoldings', n, t) },
];

async function main() {
  await generateCarousel('carousel-1-ecosystem-overview.pdf', carousel1);
  await generateCarousel('carousel-2-cybersecurity-stack.pdf', carousel2);
  await generateCarousel('carousel-3-ai-analytics.pdf', carousel3);
  await generateCarousel('carousel-4-maritime-intelligence.pdf', carousel4);
  await generateCarousel('carousel-5-creative-tech.pdf', carousel5);
  console.log('\nAll 5 carousel PDFs generated successfully!');
}

main().catch(console.error);
