type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

function log(level: LogLevel, message: string, data?: unknown): void {
  const timestamp = new Date().toISOString();
  const suffix = data ? ` ${JSON.stringify(data)}` : '';
  console.error(`[${timestamp}] [${level}] ${message}${suffix}`);
}

export const logger = {
  info(message: string, data?: unknown): void {
    log('INFO', message, data);
  },
  warn(message: string, data?: unknown): void {
    log('WARN', message, data);
  },
  error(message: string, data?: unknown): void {
    log('ERROR', message, data);
  },
  debug(message: string, data?: unknown): void {
    if (process.env.DEBUG) {
      log('DEBUG', message, data);
    }
  },
};
