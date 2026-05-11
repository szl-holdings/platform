import http from 'http';
import { client } from '../client.js';
import type { Envelope } from '../envelope.js';

const PORT = parseInt(process.env.A11OY_MCP_PORT || '4311', 10);

export async function startMcpServer(services: string[]) {
  const server = http.createServer(async (req, res) => {
    if (req.method !== 'POST' || req.url !== '/') {
      res.writeHead(404);
      res.end();
      return;
    }

    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const { tool, args } = JSON.parse(body);
        let result: Envelope<any>;

        switch (tool) {
          case 'a11oy_now':
            result = await client.get('/api/a11oy/now');
            break;
          case 'a11oy_signals_list':
            result = await client.get('/api/a11oy/signals');
            break;
          case 'a11oy_signal_explain':
            result = await client.get(`/api/a11oy/signals/${args.id}?explain=true`);
            break;
          case 'a11oy_workcell_start':
            result = await client.post('/api/a11oy/workcells', args);
            break;
          case 'a11oy_workcell_replay':
            result = await client.post(`/api/a11oy/workcells/${args.id}/replay`);
            break;
          case 'a11oy_action_brief':
            result = await client.get(`/api/a11oy/actions/${args.id}`);
            break;
          case 'a11oy_action_approve':
            result = await client.post(`/api/a11oy/actions/${args.id}/approve`, args);
            break;
          case 'a11oy_action_execute':
            if (args.acknowledged !== true) {
              result = {
                ok: false,
                error: { code: 'UNAUTHORIZED', message: 'acknowledged=true required' },
                meta: { requestId: 'mcp', timestamp: new Date().toISOString() },
              };
            } else {
              result = await client.post(`/api/a11oy/actions/${args.id}/execute`);
            }
            break;
          case 'a11oy_proof_create':
            result = await client.post('/api/a11oy/proof', args);
            break;
          case 'a11oy_proof_get':
            result = await client.get(`/api/a11oy/proof/${args.entityId}`);
            break;
          case 'a11oy_eval_run':
            result = await client.post('/api/a11oy/evals/run', args);
            break;
          case 'a11oy_tool_simulate':
            result = await client.post(`/api/a11oy/tools/${args.id}/simulate`);
            break;
          case 'a11oy_board_packet':
            result = await client.get('/api/a11oy/now?packet=true');
            break;
          case 'a11oy_pce_create':
            result = await client.post('/api/a11oy/pce', args);
            break;
          case 'a11oy_pce_validate':
            result = await client.post(`/api/a11oy/pce/${args.id}/validate`);
            break;
          default:
            result = {
              ok: false,
              error: { code: 'UNKNOWN_TOOL', message: `Tool ${tool} not found` },
              meta: { requestId: 'mcp', timestamp: new Date().toISOString() },
            };
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (e: any) {
        // Sanitize raw error text before reflecting it: strip control chars and
        // cap length so attacker-supplied payloads can't smuggle markup or
        // inflate the response (CodeQL js/xss-through-exception).
        const rawMsg = typeof e?.message === 'string' ? e.message : 'parse error';
        const safeMsg = rawMsg
          // eslint-disable-next-line no-control-regex
          // biome-ignore lint/suspicious/noControlCharactersInRegex: deliberate XSS-defence sanitiser that strips ASCII control characters (CodeQL js/xss-through-exception remediation)
          .replace(/[\u0000-\u001f\u007f<>]/g, '')
          .slice(0, 200);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: { code: 'PARSE_ERROR', message: safeMsg } }));
      }
    });
  });

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`A11oy MCP server listening on 127.0.0.1:${PORT}`);
    console.log(`Enabled services: ${services.join(', ')}`);
  });
}
