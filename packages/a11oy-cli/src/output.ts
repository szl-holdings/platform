import Table from 'cli-table3';
import chalk from 'chalk';
import type { Envelope } from './envelope.js';

export type OutputFormat = 'json' | 'table';

export function formatOutput<T>(envelope: Envelope<T>, format: OutputFormat = 'table') {
  if (format === 'json') {
    console.log(JSON.stringify(envelope, null, 2));
    return;
  }

  if (!envelope.ok) {
    console.error(chalk.red('Error:'), envelope.error.message);
    if (envelope.error.detail) {
      console.error(chalk.dim(envelope.error.detail));
    }
    process.exit(1);
  }

  const result = envelope.result;

  if (Array.isArray(result)) {
    if (result.length === 0) {
      console.log('No records found.');
      return;
    }

    const keys = Object.keys(result[0]);
    const table = new Table({
      head: keys.map(k => chalk.cyan(k)),
      style: { head: [], border: [] }
    });

    result.forEach((item: any) => {
      table.push(keys.map(k => String(item[k] ?? '')));
    });

    console.log(table.toString());
  } else if (typeof result === 'object' && result !== null) {
    const table = new Table();
    Object.entries(result).forEach(([key, value]) => {
      table.push({ [chalk.cyan(key)]: typeof value === 'object' ? JSON.stringify(value) : String(value) });
    });
    console.log(table.toString());
  } else {
    console.log(result);
  }

  if (envelope.meta) {
    console.error(chalk.dim(`\nRequest ID: ${envelope.meta.requestId}`));
  }
}
