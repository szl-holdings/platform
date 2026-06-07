import { getEnv } from '@szl-holdings/env';
import pino from 'pino';

const _env = getEnv();
const isProduction = _env.NODE_ENV === 'production';

export const logger = pino({
  level: _env.LOG_LEVEL ?? 'info',
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true },
        },
      }),
});
