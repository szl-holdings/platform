import { getEnv } from '@szl-holdings/env';
import pino from 'pino';

export const logger = pino({ name: 'ml-pipeline', level: getEnv().LOG_LEVEL ?? 'info' });
