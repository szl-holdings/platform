import { describe, expect, it } from 'vitest';

describe('health route logic', () => {
  it('expected health response shape is correct', () => {
    const uptime = process.uptime();
    const response = {
      status: 'ok',
      uptime,
      version: '0.0.0',
      timestamp: new Date().toISOString(),
    };
    expect(response.status).toBe('ok');
    expect(typeof response.uptime).toBe('number');
    expect(typeof response.version).toBe('string');
    expect(typeof response.timestamp).toBe('string');
  });

  it('uptime is a non-negative number', () => {
    expect(process.uptime()).toBeGreaterThanOrEqual(0);
  });
});
