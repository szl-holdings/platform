import { createReadStream, statSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { createServer } from 'node:http';

const DIST_DIR = resolve(process.cwd(), 'dist');
const PORT = Number(process.env.PORT ?? 5173);
const BASE_PATH = '/${{ values.domainSlug }}';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':  'font/ttf',
  '.txt':  'text/plain; charset=utf-8',
  '.map':  'application/json; charset=utf-8',
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'content-type': type });
  res.end(body);
}

function tryFile(absPath) {
  try {
    const st = statSync(absPath);
    return st.isFile() ? st : null;
  } catch {
    return null;
  }
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost:' + PORT);
  let path = url.pathname;

  // Health endpoints — Score readinessProbe + platform health checks.
  if (path === '/health' || path === BASE_PATH + '/health') {
    return send(res, 200, JSON.stringify({ status: 'ok' }), MIME['.json']);
  }
  if (path === '/ready' || path === BASE_PATH + '/ready') {
    return send(res, 200, JSON.stringify({ ready: true }), MIME['.json']);
  }

  // Strip the base path prefix so we resolve relative to dist/.
  if (path.startsWith(BASE_PATH + '/')) path = path.slice(BASE_PATH.length);
  if (path === BASE_PATH) path = '/';

  const filePath = join(DIST_DIR, path === '/' ? 'index.html' : path);
  const stat = tryFile(filePath);

  // SPA fallback — serve index.html for any unknown route so React Router can handle it.
  const finalPath = stat ? filePath : join(DIST_DIR, 'index.html');
  const finalStat = tryFile(finalPath);
  if (!finalStat) {
    return send(res, 404, 'Not Found');
  }

  const type = MIME[extname(finalPath).toLowerCase()] ?? 'application/octet-stream';
  res.writeHead(200, { 'content-type': type, 'content-length': finalStat.size });
  createReadStream(finalPath).pipe(res);
});

server.listen(PORT, () => {
  console.log('[${{ values.domainSlug }}] static server listening on :' + PORT + BASE_PATH + '/');
});
