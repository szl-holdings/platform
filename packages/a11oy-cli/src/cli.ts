#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { client } from './client.js';
import { formatOutput } from './output.js';
import type { OutputFormat } from './output.js';

const program = new Command();

program
  .name('a11oy')
  .description('A11oy Terminal CLI')
  .version('1.0.0');

program.option('-o, --output <format>', 'output format (json, table)', 'table');
program.option('--tenant <id>', 'tenant ID', 'default');
program.option('--dry-run', 'perform a dry run');
program.option('--trace', 'enable tracing');
program.option('--verbose', 'enable verbose output');

program.hook('preAction', (thisCommand) => {
  const options = thisCommand.opts();
  client.setTenant(options.tenant);
});

// a11oy now
program
  .command('now')
  .description('display NOW Board metrics')
  .action(async (options) => {
    const response = await client.get('/api/a11oy/now');
    formatOutput(response, options.output as OutputFormat);
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
    formatOutput(response, options.output as OutputFormat);
  });

signals
  .command('get <id>')
  .description('get signal by ID')
  .action(async (id, options) => {
    const response = await client.get(`/api/a11oy/signals/${id}`);
    formatOutput(response, options.output as OutputFormat);
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
    formatOutput(response, options.output as OutputFormat);
  });

signals
  .command('explain <id>')
  .description('get signal explanation')
  .action(async (id, options) => {
    const response = await client.get(`/api/a11oy/signals/${id}?explain=true`);
    formatOutput(response, options.output as OutputFormat);
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
    formatOutput(response, options.output as OutputFormat);
  });

outcomes
  .command('drift')
  .description('get outcomes with drift analysis')
  .action(async (options) => {
    const response = await client.get('/api/a11oy/outcomes?drift=true');
    formatOutput(response, options.output as OutputFormat);
  });

// a11oy workcells
const workcells = program.command('workcells').description('manage workcells');

workcells
  .command('list')
  .description('list workcells')
  .action(async (options) => {
    const response = await client.get('/api/a11oy/workcells');
    formatOutput(response, options.output as OutputFormat);
  });

workcells
  .command('get <id>')
  .description('get workcell by ID')
  .action(async (id, options) => {
    const response = await client.get(`/api/a11oy/workcells/${id}`);
    formatOutput(response, options.output as OutputFormat);
  });

workcells
  .command('start')
  .description('start a workcell')
  .action(async (options) => {
    const response = await client.post('/api/a11oy/workcells', {});
    formatOutput(response, options.output as OutputFormat);
  });

workcells
  .command('replay <id>')
  .description('replay a workcell')
  .action(async (id, options) => {
    const response = await client.post(`/api/a11oy/workcells/${id}/replay`);
    formatOutput(response, options.output as OutputFormat);
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
    formatOutput(response, options.output as OutputFormat);
  });

actions
  .command('brief <id>')
  .description('get action brief')
  .action(async (id, options) => {
    const response = await client.get(`/api/a11oy/actions/${id}`);
    formatOutput(response, options.output as OutputFormat);
  });

actions
  .command('approve <id>')
  .description('approve an action')
  .requiredOption('--approved-by <name>', 'name of the approver')
  .action(async (id, options) => {
    const response = await client.post(`/api/a11oy/actions/${id}/approve`, { approvedBy: options.approvedBy });
    formatOutput(response, options.output as OutputFormat);
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
    formatOutput(response, options.output as OutputFormat);
  });

actions
  .command('verify <id>')
  .description('verify an action')
  .action(async (id, options) => {
    const response = await client.post(`/api/a11oy/actions/${id}/verify`);
    formatOutput(response, options.output as OutputFormat);
  });

// a11oy proof
const proof = program.command('proof').description('manage proofs');

proof
  .command('list')
  .description('list proofs')
  .action(async (options) => {
    const response = await client.get('/api/a11oy/proof');
    formatOutput(response, options.output as OutputFormat);
  });

proof
  .command('get <entityId>')
  .description('get proof by entity ID')
  .action(async (entityId, options) => {
    const response = await client.get(`/api/a11oy/proof/${entityId}`);
    formatOutput(response, options.output as OutputFormat);
  });

proof
  .command('create <actionId>')
  .description('create proof for an action')
  .action(async (actionId, options) => {
    const response = await client.post('/api/a11oy/proof', { actionId });
    formatOutput(response, options.output as OutputFormat);
  });

// a11oy governance
const governance = program.command('governance').description('manage governance');

governance
  .command('policies')
  .description('list governance policies')
  .action(async (options) => {
    const response = await client.get('/api/a11oy/governance');
    formatOutput(response, options.output as OutputFormat);
  });

governance
  .command('check <actionId>')
  .description('perform dry-run policy check')
  .action(async (actionId, options) => {
    const response = await client.post('/api/a11oy/pce', { actionId, dryRun: true });
    formatOutput(response, options.output as OutputFormat);
  });

// a11oy agents
const agents = program.command('agents').description('manage agents');

agents
  .command('list')
  .description('list agents')
  .action(async (options) => {
    const response = await client.get('/api/a11oy/agents');
    formatOutput(response, options.output as OutputFormat);
  });

agents
  .command('trust <id>')
  .description('get agent trust score')
  .action(async (id, options) => {
    const response = await client.get(`/api/a11oy/agents/${id}`);
    formatOutput(response, options.output as OutputFormat);
  });

// a11oy tools
const tools = program.command('tools').description('manage tools');

tools
  .command('list')
  .description('list tools')
  .action(async (options) => {
    const response = await client.get('/api/a11oy/tools');
    formatOutput(response, options.output as OutputFormat);
  });

tools
  .command('simulate <id>')
  .description('simulate tool run')
  .action(async (id, options) => {
    const response = await client.post(`/api/a11oy/tools/${id}/simulate`);
    formatOutput(response, options.output as OutputFormat);
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
    formatOutput(response, options.output as OutputFormat);
  });

// a11oy evals
program
  .command('evals')
  .command('run <targetId>')
  .description('run evaluation')
  .action(async (targetId, options) => {
    const response = await client.post('/api/a11oy/evals/run', { targetId });
    formatOutput(response, options.output as OutputFormat);
  });

// a11oy memory
program
  .command('memory')
  .command('status')
  .description('get memory status')
  .action(async (options) => {
    const response = await client.get('/api/a11oy/memory');
    formatOutput(response, options.output as OutputFormat);
  });

// a11oy demo
const demo = program.command('demo').description('manage demo');

demo
  .command('seed')
  .description('seed demo data')
  .action(async (options) => {
    const response = await client.post('/api/a11oy/demo/seed');
    formatOutput(response, options.output as OutputFormat);
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
    const response = await client.post('/api/a11oy/demo/reset');
    formatOutput(response, options.output as OutputFormat);
  });

demo
  .command('scenario <name>')
  .description('run named demo scenario')
  .action(async (name, options) => {
    const response = await client.post('/api/a11oy/demo/scenario', { name });
    formatOutput(response, options.output as OutputFormat);
  });

// a11oy pce
const pce = program.command('pce').description('manage PCE contracts');

pce
  .command('create')
  .description('create PCE contract')
  .action(async (options) => {
    const response = await client.post('/api/a11oy/pce');
    formatOutput(response, options.output as OutputFormat);
  });

pce
  .command('validate <id>')
  .description('validate PCE contract')
  .action(async (id, options) => {
    const response = await client.post(`/api/a11oy/pce/${id}/validate`);
    formatOutput(response, options.output as OutputFormat);
  });

pce
  .command('explain <id>')
  .description('get PCE contract explanation')
  .action(async (id, options) => {
    const response = await client.get(`/api/a11oy/pce/${id}`);
    formatOutput(response, options.output as OutputFormat);
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

// a11oy shell
program
  .command('shell')
  .description('interactive REPL')
  .action(async () => {
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.cyan('a11oy> ')
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
