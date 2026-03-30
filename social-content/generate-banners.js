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
};

const OUTPUT_DIR = path.join(__dirname, 'banners');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function drawGrid(doc, width, height) {
  doc.save();
  doc.opacity(0.04);
  for (let x = 0; x < width; x += 30) {
    doc.moveTo(x, 0).lineTo(x, height).strokeColor(COLORS.cyan).lineWidth(0.3).stroke();
  }
  for (let y = 0; y < height; y += 30) {
    doc.moveTo(0, y).lineTo(width, y).strokeColor(COLORS.cyan).lineWidth(0.3).stroke();
  }
  doc.restore();
}

function drawNodes(doc, width, height) {
  doc.save();
  const nodes = [];
  const nodeCount = Math.floor((width * height) / 50000);
  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      x: 100 + Math.random() * (width - 200),
      y: 50 + Math.random() * (height - 100),
    });
  }

  doc.opacity(0.06);
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < width * 0.25) {
        doc.moveTo(nodes[i].x, nodes[i].y).lineTo(nodes[j].x, nodes[j].y)
          .strokeColor(COLORS.gold).lineWidth(0.5).stroke();
      }
    }
  }

  doc.opacity(0.25);
  nodes.forEach(n => {
    doc.circle(n.x, n.y, 3).fill(COLORS.gold);
  });
  doc.restore();
}

function generateBanner(filename, width, height) {
  const ptWidth = width * 0.75;
  const ptHeight = height * 0.75;

  const outputPath = path.join(OUTPUT_DIR, filename);
  const doc = new PDFDocument({ size: [ptWidth, ptHeight], margin: 0 });
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  doc.rect(0, 0, ptWidth, ptHeight).fill(COLORS.bg);

  drawGrid(doc, ptWidth, ptHeight);
  drawNodes(doc, ptWidth, ptHeight);

  doc.rect(0, 0, ptWidth, 4).fill(COLORS.cyan);
  doc.rect(0, ptHeight - 4, ptWidth, 4).fill(COLORS.cyan);

  const centerY = ptHeight / 2;

  doc.save();
  doc.opacity(0.08);
  doc.roundedRect(ptWidth * 0.1, centerY - ptHeight * 0.3, ptWidth * 0.8, ptHeight * 0.6, 8)
    .strokeColor(COLORS.gold).lineWidth(1).stroke();
  doc.restore();

  const titleSize = Math.max(16, Math.min(42, ptWidth * 0.035));
  const subtitleSize = Math.max(10, Math.min(20, ptWidth * 0.015));
  const taglineSize = Math.max(8, Math.min(14, ptWidth * 0.01));

  doc.font('Helvetica-Bold').fontSize(titleSize).fillColor(COLORS.white);
  doc.text('SZL HOLDINGS', 0, centerY - titleSize * 1.8, { width: ptWidth, align: 'center' });

  doc.font('Helvetica').fontSize(subtitleSize).fillColor(COLORS.gold);
  doc.text('Technology Holding Company', 0, centerY - titleSize * 0.3, { width: ptWidth, align: 'center' });

  doc.font('Helvetica').fontSize(taglineSize).fillColor(COLORS.lightGray);
  doc.text('AI  \u2022  Cybersecurity  \u2022  Predictive Intelligence  \u2022  Maritime  \u2022  Creative Tech', 0, centerY + subtitleSize * 1.5, { width: ptWidth, align: 'center' });

  doc.font('Helvetica').fontSize(taglineSize * 0.9).fillColor(COLORS.midGray);
  doc.text('szlholdings.com', 0, centerY + subtitleSize * 3.5, { width: ptWidth, align: 'center' });

  doc.end();

  return new Promise(resolve => stream.on('finish', () => {
    console.log(`Generated: ${filename} (${width}x${height}px)`);
    resolve();
  }));
}

async function main() {
  await generateBanner('header-x-1500x500.pdf', 1500, 500);
  await generateBanner('header-linkedin-1584x396.pdf', 1584, 396);
  await generateBanner('header-youtube-2560x1440.pdf', 2560, 1440);
  await generateBanner('header-instagram-1080x1080.pdf', 1080, 1080);
  console.log('\nAll platform header PDFs generated successfully!');
  console.log('Note: Export these PDFs as PNG images for uploading to each platform.');
}

main().catch(console.error);
