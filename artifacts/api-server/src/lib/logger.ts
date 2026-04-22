import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import pino from 'pino';
import { fileURLToPath } from 'node:url';

const isProduction = process.env.NODE_ENV === 'production';

const SERVICE_NAME = process.env.OTEL_SERVICE_NAME ?? 'szl-api-server';
const SERVICE_ENV = process.env.NODE_ENV ?? 'development';

let SERVICE_VERSION = '0.0.0';
try {
  const require = createRequire(import.meta.url);
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const pkg = require(join(__dirname, '../../package.json'));
  SERVICE_VERSION = pkg.version ?? '0.0.0';
} catch {
  // version remains default
}

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: {
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    env: SERVICE_ENV,
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      "req.headers['x-csrf-token']",
      "req.headers['x-internal-token']",
      "req.headers['x-api-key']",
      "res.headers['set-cookie']",
      'req.body.password',
      'req.body.currentPassword',
      'req.body.newPassword',
      'req.body.token',
      'req.body.accessToken',
      'req.body.refreshToken',
      'req.body.idToken',
      'req.body.apiKey',
      'req.body.api_key',
      'req.body.secret',
      'req.body.clientSecret',
      'req.body.client_secret',
      'req.body.sessionToken',
      'req.body.privateKey',
      'req.body.private_key',
      'req.body.webhookSecret',
      'req.body.webhook_secret',
      '*.password',
      '*.accessToken',
      '*.refreshToken',
      '*.apiKey',
      '*.api_key',
      '*.secret',
      '*.clientSecret',
      '*.client_secret',
      '*.privateKey',
      '*.private_key',
      '*.sessionToken',
      '*.session_token',
      '*.webhookSecret',
      '*.webhook_secret',
    ],
    censor: '[REDACTED]',
    remove: false,
  },
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true },
        },
      }),
});
