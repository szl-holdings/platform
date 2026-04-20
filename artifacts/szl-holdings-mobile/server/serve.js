const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT ?? '8083', 10);
const DIST = path.resolve(__dirname, '..', 'dist');

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

function serveFile(res, filePath) {
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(DIST + path.sep) && resolved !== DIST) {
    return false;
  }
  if (!fs.existsSync(resolved)) return false;
  const ext = path.extname(resolved);
  const type = MIME[ext] || 'application/octet-stream';
  const data = fs.readFileSync(resolved);
  res.writeHead(200, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(data);
  return true;
}

const server = http.createServer((req, res) => {
  const rawUrl = req.url.split('?')[0];
  const safeRelative = rawUrl.replace(/^\/+/, '') || 'index.html';
  const filePath = path.resolve(DIST, safeRelative);

  if (!filePath.startsWith(DIST + path.sep) && filePath !== DIST) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  if (!serveFile(res, filePath)) {
    const fallback = path.resolve(DIST, 'index.html');
    if (!serveFile(res, fallback)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    }
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[szl-holdings-mobile] Static server → http://0.0.0.0:${PORT}`);
});
