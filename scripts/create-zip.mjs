import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SCREENSHOTS = path.join(ROOT, 'screenshots');
const OUTPUT = path.join(SCREENSHOTS, 'szl-portfolio.zip');

const fflate = await import('/home/runner/workspace/node_modules/.pnpm/fflate@0.8.2/node_modules/fflate/esm/index.mjs');
const { zipSync } = fflate;

const filemap = {};

function addDir(dirPath, zipPrefix) {
  if (!fs.existsSync(dirPath)) {
    console.warn(`Directory not found: ${dirPath}`);
    return;
  }
  const files = fs.readdirSync(dirPath).filter(f => /\.(jpg|jpeg|png|pdf)$/i.test(f));
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const zipPath = `${zipPrefix}/${file}`;
    console.log(`Adding: ${zipPath}`);
    filemap[zipPath] = [fs.readFileSync(fullPath), { level: 0 }];
  }
}

addDir(path.join(SCREENSHOTS, 'web-apps'), 'web-apps');
addDir(path.join(SCREENSHOTS, 'alloy-platform'), 'alloy-platform');
addDir(path.join(SCREENSHOTS, 'mobile-apps'), 'mobile-apps');

const pdfPath = path.join(SCREENSHOTS, 'szl-portfolio-linkedin.pdf');
if (fs.existsSync(pdfPath)) {
  console.log('Adding: szl-portfolio-linkedin.pdf');
  filemap['szl-portfolio-linkedin.pdf'] = [fs.readFileSync(pdfPath), { level: 0 }];
}

const zipped = zipSync(filemap);
fs.writeFileSync(OUTPUT, zipped);

const size = fs.statSync(OUTPUT).size;
console.log(`\nZip created: ${OUTPUT}`);
console.log(`Size: ${(size / 1024 / 1024).toFixed(2)} MB`);
console.log(`Files: ${Object.keys(filemap).length}`);
