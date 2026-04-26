import pino from 'pino';

export function createLogger(name: string) {
  const level =
    typeof process !== 'undefined' && process.env?.LOG_LEVEL
      ? process.env.LOG_LEVEL
      : 'info';
  return pino({ name, level });
}
