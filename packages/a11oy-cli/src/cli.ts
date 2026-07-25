#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { exportArticle12 } from './article12.js';
import { client } from './client.js';
import { formatOutput, type OutputFormat } from './output.js';

const program = new Command();

program.name('a11oy').description('A11oy Terminal CLI').version('1.0.0');

program.option('-o, --output <format>', 'output format (json, table)', 'table');
program.option('--tenant <id>', 'tenant ID', 'default');
program.option('--dry-run', 'perform a dry run');
program.option('--trace', 'enable tracing');
program.option('--verbose', 'enable verbose output');

program.hook('preAction', (thisCommand) => {
  const options = thisCommand.optsWithGlobals();
  client.setTenant(options.tenant);
});

function globalOutputFormat(localOpts: Record<string, any> = {}): OutputFormat {
  const global = program.opts();
  return (localOpts.output ?? global.output ?? 'table') as OutputFormat;
}

function localError(message: string, format: OutputFormat): never {
  if (format === 'json') {
    const envelope: import('./envelope.js').Envelope<never> = {
      ok: false,
      error: { code: 'CLI_VALIDATION', message },
      meta: { requestId: 'local', timestamp: new Date().toISOString() },
    };
    console.log(JSON.stringify(envelope, null, 2));
  } else {
    console.error(chalk.red('Error:'), message);
  }
  process.exit(1);
}

// a11oy now
program
  .command('now')
  .description('display NOW Board metrics')
  .action(async (options) => {
    const response = await client.get('/api/a11oy/now');
    formatOutput(response, globalOutputFormat(options));
  });

// a11oy signals
const signals = program.command('signals').description('manage signals');

signals
  .command('list')
  .description('list signals')
  .option('--vertical <vertical>', 'filter by vertical')
  .option('--severity <severity>', 'filter by severity')
  .option('--status <status>', 'filter by status')
  .action(async (options) => {
    const query = new URLSearchParams(options).toString();
    const response = await client.get(`/api/a11oy/signals?${query}`);
    formatOutput(response, globalOutputFormat(options));
  });

signals
  .command('get <id>')
  .description('get signal by ID')
  .action(async (id, options) => {
    const response = await client.get(`/api/a11oy/signals/${id}`);
    formatOutput(response, globalOutputFormat(options));
  });

signals
  .command('ingest')
  .description('ingest signals')
  .option('--file <path>', 'path to signals file')
  .action(async (options) => {
    let data;
    if (options.file) {
      const fs = await import('fs');
      data = JSON.parse(fs.readFileSync(options.file, 'utf8'));
    } else {
      // Read from stdin
      const fs = await import('fs');
      data = JSON.parse(fs.readFileSync(0, 'utf8'));
    }
    const response = await client.post('/api/a11oy/signals', data);
    formatOutput(response, globalOutputFormat(options));
  });

signals
  .command('explain <id>')
  .description('get signal explanation')
  .action(async (id, options) => {
    const response = await client.get(`/api/a11oy/signals/${id}?explain=true`);
    formatOutput(response, globalOutputFormat(options));
  });

// a11oy outcomes
const outcomes = program.command('outcomes').description('manage outcomes');

outcomes
  .command('list')
  .description('list outcomes')
  .option('--status <status>', 'filter by status')
  .action(async (options) => {
    const query = new URLSearchParams(options).toString();
    const response = await client.get(`/api/a11oy/outcomes?${query}`);
    formatOutput(response, globalOutputFormat(options));
  });

outcomes
  .command('drift')
  .description('get outcomes with drift analysis')
  .action(async (options) => {
    const response = await client.get('/api/a11oy/outcomes?drift=true');
    formatOutput(response, globalOutputFormat(options));
  });

// a11oy workcells
const workcells = program.command('workcells').description('manage workcells');

workcells
  .command('list')
  .description('list workcells')
  .action(async (options) => {
    const response = await client.get('/api/a11oy/workcells');
    formatOutput(response, globalOutputFormat(options));
  });

workcells
  .command('get <id>')
  .description('get workcell by ID')
  .action(async (id, options) => {
    const response = await client.get(`/api/a11oy/workcells/${id}`);
    formatOutput(response, globalOutputFormat(options));
  });

workcells
  .command('start [signalId]')
  .description('start a new workcell, optionally seeded from a signal ID')
  .option('--name <name>', 'workcell name', 'CLI Workcell')
  .option('--vertical <vertical>', 'target vertical', 'alloy-core')
  .action(async (signalId, options) => {
    const body = {
      name: options.name,
      vertical: options.vertical,
      ...(signalId ? { originSignalIds: [signalId] } : {}),
    };
    if (program.opts().dryRun) {
      const previewEnvelope: import('./envelope.js').Envelope<Record<string, unknown>> = {
        ok: true,
        data: { dryRun: true, ...body, id: 'wc-preview' },
        meta: { requestId: 'dry-run', timestamp: new Date().toISOString() },
      };
      formatOutput(previewEnvelope, globalOutputFormat(options));
      return;
    }
    const response = await client.post('/api/a11oy/workcells', body);
    formatOutput(response, globalOutputFormat(options));
  });

workcells
  .command('replay <id>')
  .description('replay a workcell')
  .action(async (id, options) => {
    const response = await client.post(`/api/a11oy/workcells/${id}/replay`);
    formatOutput(response, globalOutputFormat(options));
  });

// a11oy actions
const actions = program.command('actions').description('manage actions');

actions
  .command('list')
  .description('list actions')
  .option('--status <status>', 'filter by status')
  .action(async (options) => {
    const query = new URLSearchParams(options).toString();
    const response = await client.get(`/api/a11oy/actions?${query}`);
    formatOutput(response, globalOutputFormat(options));
  });

actions
  .command('brief <id>')
  .description('get action brief')
  .action(async (id, options) => {
    const response = await client.get(`/api/a11oy/actions/${id}`);
    formatOutput(response, globalOutputFormat(options));
  });

actions
  .command('approve <id>')
  .description('approve an action')
  .option('--approved-by <name>', 'name of the approver')
  .option('--acknowledged [value]', 'governance acknowledgment (pass "true" to confirm)')
  .action(async (id, options) => {
    const format = globalOutputFormat(options);
    const isAcknowledged = options.acknowledged === true || options.acknowledged === 'true';
    if (!options.approvedBy && !isAcknowledged) {
      localError('one of --approved-by <name> or --acknowledged true is required.', format);
    }
    const body: Record<string, unknown> = {};
    if (options.approvedBy) body.approvedBy = options.approvedBy;
    if (isAcknowledged) body.acknowledged = true;
    const response = await client.post(`/api/a11oy/actions/${id}/approve`, body);
    formatOutput(response, format);
  });

actions
  .command('execute <id>')
  .description('execute an action')
  .option('--acknowledged', 'acknowledge the danger')
  .action(async (id, options) => {
    if (!options.acknowledged) {
      console.error(chalk.red('Error: --acknowledged flag is required for action execution.'));
      process.exit(1);
    }
    const response = await client.post(`/api/a11oy/actions/${id}/execute`);
    formatOutput(response, globalOutputFormat(options));
  });

actions
  .command('verify <id>')
  .description('verify an action')
  .action(async (id, options) => {
    const response = await client.post(`/api/a11oy/actions/${id}/verify`);
    formatOutput(response, globalOutputFormat(options));
  });

// a11oy proof
const proof = program.command('proof').description('manage proofs');

proof
  .command('list')
  .description('list proofs')
  .action(async (options) => {
    const response = await client.get('/api/a11oy/proof');
    formatOutput(response, globalOutputFormat(options));
  });

proof
  .command('get <entityId>')
  .description('get proof by entity ID')
  .action(async (entityId, options) => {
    const response = await client.get(`/api/a11oy/proof/${entityId}`);
    formatOutput(response, globalOutputFormat(options));
  });

proof
  .command('create <actionId>')
  .description('create proof for an action')
  .action(async (actionId, options) => {
    const response = await client.post('/api/a11oy/proof', { actionId });
    formatOutput(response, globalOutputFormat(options));
  });

// a11oy governance
const governance = program.command('governance').description('manage governance');

governance
  .command('policies')
  .description('list governance policies')
  .action(async (options) => {
    const response = await client.get('/api/a11oy/governance');
    formatOutput(response, globalOutputFormat(options));
  });

governance
  .command('check <actionId>')
  .description('perform dry-run policy check')
  .action(async (actionId, options) => {
    const response = await client.post('/api/a11oy/pce', { actionId, dryRun: true });
    formatOutput(response, globalOutputFormat(options));
  });

// a11oy agents
const agents = program.command('agents').description('manage agents');

agents
  .command('list')
  .description('list agents')
  .action(async (options) => {
    const response = await client.get('/api/a11oy/agents');
    formatOutput(response, globalOutputFormat(options));
  });

agents
  .command('trust <id>')
  .description('get agent trust score')
  .action(async (id, options) => {
    const response = await client.get(`/api/a11oy/agents/${id}`);
    formatOutput(response, globalOutputFormat(options));
  });

// a11oy tools
const tools = program.command('tools').description('manage tools');

tools
  .command('list')
  .description('list tools')
  .action(async (options) => {
    const response = await client.get('/api/a11oy/tools');
    formatOutput(response, globalOutputFormat(options));
  });

tools
  .command('simulate <id>')
  .description('simulate tool run')
  .action(async (id, options) => {
    const response = await client.post(`/api/a11oy/tools/${id}/simulate`);
    formatOutput(response, globalOutputFormat(options));
  });

tools
  .command('run <id>')
  .description('run tool')
  .option('--acknowledged', 'acknowledge the danger')
  .action(async (id, options) => {
    if (!options.acknowledged) {
      console.error(chalk.red('Error: --acknowledged flag is required for tool execution.'));
      process.exit(1);
    }
    const response = await client.post(`/api/a11oy/tools/${id}/run`);
    formatOutput(response, globalOutputFormat(options));
  });

// a11oy evals
program
  .command('evals')
  .command('run <targetId>')
  .description('run evaluation')
  .action(async (targetId, options) => {
    const response = await client.post('/api/a11oy/evals/run', { targetId });
    formatOutput(response, globalOutputFormat(options));
  });

// a11oy memory
program
  .command('memory')
  .command('status')
  .description('get memory status')
  .action(async (options) => {
    const response = await client.get('/api/a11oy/memory');
    formatOutput(response, globalOutputFormat(options));
  });

// a11oy demo
const demo = program.command('demo').description('manage demo');

demo
  .command('seed')
  .description('seed demo data')
  .action(async (options) => {
    const response = await client.post('/api/a11oy/demo/seed');
    formatOutput(response, globalOutputFormat(options));
  });

demo
  .command('reset')
  .description('reset demo data')
  .requiredOption('--acknowledged <bool>', 'acknowledge the reset')
  .action(async (options) => {
    if (options.acknowledged !== 'true') {
      console.error(chalk.red('Error: --acknowledged true is required for demo reset.'));
      process.exit(1);
    }
    const response = await client.post('/api/a11oy/demo/reset', { acknowledged: true });
    formatOutput(response, globalOutputFormat(options));
  });

demo
  .command('scenario <name>')
  .description('run named demo scenario')
  .action(async (name, options) => {
    const response = await client.post('/api/a11oy/demo/scenario', { name });
    formatOutput(response, globalOutputFormat(options));
  });

// a11oy pce
const pce = program.command('pce').description('manage PCE contracts');

pce
  .command('create')
  .description('create PCE contract')
  .action(async (options) => {
    const response = await client.post('/api/a11oy/pce');
    formatOutput(response, globalOutputFormat(options));
  });

pce
  .command('validate <id>')
  .description('validate PCE contract')
  .action(async (id, options) => {
    const response = await client.post(`/api/a11oy/pce/${id}/validate`);
    formatOutput(response, globalOutputFormat(options));
  });

pce
  .command('explain <id>')
  .description('get PCE contract explanation')
  .action(async (id, options) => {
    const response = await client.get(`/api/a11oy/pce/${id}`);
    formatOutput(response, globalOutputFormat(options));
  });

// a11oy doctor
program
  .command('doctor')
  .description('check connectivity, env vars, deps')
  .action(async () => {
    console.log(chalk.cyan('A11oy Doctor Diagnostics:'));
    console.log(`API Base URL: ${process.env.A11OY_API_BASE_URL || 'http://localhost:80'}`);
    console.log(`API Key: ${process.env.A11OY_API_KEY ? 'Set' : 'Not Set'}`);

    try {
      const response = await client.get('/api/a11oy/now');
      if (response.ok) {
        console.log(chalk.green('✓ API Connectivity: OK'));
      } else {
        console.log(chalk.yellow('! API Connectivity: Failed (but reached server)'));
        console.log(chalk.dim(response.error.message));
      }
    } catch (e: any) {
      console.log(chalk.red('✗ API Connectivity: unreachable'));
      console.log(chalk.dim(e.message));
    }
  });

// a11oy article12
program
  .command('article12')
  .description('export a signed EU AI Act Article 12 evidence package')
  .option('--export', 'create a signed Article 12 tar archive')
  .requiredOption('--from <date>', 'inclusive start date or ISO timestamp')
  .requiredOption('--to <date>', 'inclusive end date or ISO timestamp')
  .option(
    '--input <path>',
    'Article 12 source JSON',
    process.env.A11OY_ARTICLE12_SOURCE,
  )
  .option(
    '--signing-key <path>',
    'Ed25519 private key PEM',
    process.env.A11OY_ARTICLE12_SIGNING_KEY,
  )
  .option('--output <path>', 'output tar path')
  .action(async (options) => {
    const format = globalOutputFormat(options);
    if (!options.export) {
      localError('--export is required.', format);
    }
    if (!options.input) {
      localError(
        '--input or A11OY_ARTICLE12_SOURCE is required.',
        format,
      );
    }
    if (!options.signingKey) {
      localError(
        '--signing-key or A11OY_ARTICLE12_SIGNING_KEY is required.',
        format,
      );
    }

    const safeRange = `${options.from}-${options.to}`.replace(
      /[^0-9A-Za-z._-]+/g,
      '_',
    );
    try {
      const result = exportArticle12({
        inputPath: options.input,
        outputPath: options.output ?? `article12-${safeRange}.tar`,
        signingKeyPath: options.signingKey,
        from: options.from,
        to: options.to,
      });
      const envelope: import('./envelope.js').Envelope<typeof result> = {
        ok: true,
        data: result,
        meta: {
          requestId: `article12-${result.archiveSha256.slice(0, 12)}`,
          timestamp: new Date().toISOString(),
        },
      };
      formatOutput(envelope, format);
    } catch (error) {
      localError(
        error instanceof Error ? error.message : String(error),
        format,
      );
    }
  });

// a11oy shell
program
  .command('shell')
  .description('interactive REPL')
  .action(async () => {
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.cyan('a11oy> '),
    });

    console.log('A11oy Interactive Shell (type "exit" to quit)');
    rl.prompt();

    rl.on('line', async (line) => {
      const trimmed = line.trim();
      if (trimmed === 'exit' || trimmed === 'quit') {
        rl.close();
        return;
      }
      if (trimmed) {
        const args = trimmed.split(/\s+/);
        await program.parseAsync(['node', 'a11oy', ...args]);
      }
      rl.prompt();
    }).on('close', () => {
      process.exit(0);
    });
  });

// a11oy mcp
program
  .command('mcp')
  .description('start MCP server')
  .option('--services <services>', 'comma-separated services to enable', 'read,demo')
  .action(async (options) => {
    const { startMcpServer } = await import('./mcp/server.js');
    await startMcpServer(options.services.split(','));
  });

program.parse(process.argv);
