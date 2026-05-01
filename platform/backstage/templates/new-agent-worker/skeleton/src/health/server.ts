import { createServer, IncomingMessage, ServerResponse } from 'node:http';

let ready = false;

export function setReady(value: boolean) {
  ready = value;
}

function respond(res: ServerResponse, status: number, body: unknown) {
  const json = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(json);
}

export function startHealthServer(port = 9090) {
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    if (req.url === '/health') {
      respond(res, 200, {
        status: 'ok',
        worker: '${{ values.agentSlug }}-worker',
        uptime: Math.floor(process.uptime()),
      });
    } else if (req.url === '/ready') {
      if (ready) {
        respond(res, 200, { ready: true });
      } else {
        respond(res, 503, { ready: false, reason: 'warming up' });
      }
    } else {
      respond(res, 404, { error: 'not found' });
    }
  });

  server.listen(port, () => {
    console.log(`Health server listening on :${port}`);
  });

  return server;
}
