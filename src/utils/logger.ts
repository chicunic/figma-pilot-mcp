// MCP uses stdio communication, logs output to stderr
const log = (level: string, message: string, data?: unknown) => {
  const timestamp = new Date().toISOString();
  const logLine = data
    ? `[${timestamp}] [${level}] ${message} ${JSON.stringify(data)}`
    : `[${timestamp}] [${level}] ${message}`;
  console.error(logLine);
};

export const logger = {
  info: (message: string, data?: unknown) => log("INFO", message, data),
  warn: (message: string, data?: unknown) => log("WARN", message, data),
  error: (message: string, data?: unknown) => log("ERROR", message, data),
  debug: (message: string, data?: unknown) => {
    if (process.env.DEBUG) {
      log("DEBUG", message, data);
    }
  },
};
