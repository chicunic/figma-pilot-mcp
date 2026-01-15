export enum ErrorCode {
  // Connection errors (1xxx)
  NOT_CONNECTED = 1001,
  CONNECTION_FAILED = 1002,
  CONNECTION_TIMEOUT = 1003,
  CHANNEL_NOT_FOUND = 1004,
  WEBSOCKET_ERROR = 1005,

  // Node errors (2xxx)
  NODE_NOT_FOUND = 2001,
  INVALID_NODE_TYPE = 2002,
  NODE_LOCKED = 2003,
  NODE_NOT_EDITABLE = 2004,
  PARENT_NOT_FOUND = 2005,

  // Command errors (3xxx)
  UNKNOWN_COMMAND = 3001,
  INVALID_PARAMS = 3002,
  COMMAND_TIMEOUT = 3003,
  COMMAND_FAILED = 3004,
  BATCH_PARTIAL_FAILURE = 3005,

  // Permission errors (4xxx)
  READ_NOT_ALLOWED = 4001,
  WRITE_NOT_ALLOWED = 4002,
  FEATURE_DISABLED = 4003,

  // Resource errors (5xxx)
  FONT_NOT_FOUND = 5001,
  STYLE_NOT_FOUND = 5002,
  COMPONENT_NOT_FOUND = 5003,
  VARIABLE_NOT_FOUND = 5004,
  IMAGE_LOAD_FAILED = 5005,

  // Plugin errors (6xxx)
  PLUGIN_ERROR = 6001,
  PLUGIN_NOT_RUNNING = 6002,
}

export interface PilotError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export class FigmaPilotError extends Error {
  code: ErrorCode;
  details?: Record<string, unknown>;

  constructor(code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'FigmaPilotError';
    this.code = code;
    this.details = details;
  }

  toJSON(): PilotError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

const errorMessages: Record<ErrorCode, string> = {
  [ErrorCode.NOT_CONNECTED]: 'Not connected to Figma. Use pilot_connect first.',
  [ErrorCode.CONNECTION_FAILED]: 'Failed to connect to Figma plugin.',
  [ErrorCode.CONNECTION_TIMEOUT]: 'Connection to Figma timed out.',
  [ErrorCode.CHANNEL_NOT_FOUND]: 'Channel not found. Make sure the Figma plugin is running.',
  [ErrorCode.WEBSOCKET_ERROR]: 'WebSocket communication error.',

  [ErrorCode.NODE_NOT_FOUND]: 'Node not found.',
  [ErrorCode.INVALID_NODE_TYPE]: 'Invalid node type for this operation.',
  [ErrorCode.NODE_LOCKED]: 'Node is locked and cannot be modified.',
  [ErrorCode.NODE_NOT_EDITABLE]: 'Node is not editable.',
  [ErrorCode.PARENT_NOT_FOUND]: 'Parent node not found.',

  [ErrorCode.UNKNOWN_COMMAND]: 'Unknown command.',
  [ErrorCode.INVALID_PARAMS]: 'Invalid parameters.',
  [ErrorCode.COMMAND_TIMEOUT]: 'Command timed out.',
  [ErrorCode.COMMAND_FAILED]: 'Command execution failed.',
  [ErrorCode.BATCH_PARTIAL_FAILURE]: 'Some batch commands failed.',

  [ErrorCode.READ_NOT_ALLOWED]: 'Read operations not allowed in write-only mode.',
  [ErrorCode.WRITE_NOT_ALLOWED]: 'Write operations not allowed.',
  [ErrorCode.FEATURE_DISABLED]: 'This feature is disabled.',

  [ErrorCode.FONT_NOT_FOUND]: 'Font not found or not loaded.',
  [ErrorCode.STYLE_NOT_FOUND]: 'Style not found.',
  [ErrorCode.COMPONENT_NOT_FOUND]: 'Component not found.',
  [ErrorCode.VARIABLE_NOT_FOUND]: 'Variable not found.',
  [ErrorCode.IMAGE_LOAD_FAILED]: 'Failed to load image.',

  [ErrorCode.PLUGIN_ERROR]: 'Figma plugin error.',
  [ErrorCode.PLUGIN_NOT_RUNNING]: 'Figma plugin is not running.',
};

export function createError(
  code: ErrorCode,
  customMessage?: string,
  details?: Record<string, unknown>,
): FigmaPilotError {
  const message = customMessage || errorMessages[code];
  return new FigmaPilotError(code, message, details);
}

const NOT_FOUND_PATTERNS: Array<[string, ErrorCode]> = [
  ['node', ErrorCode.NODE_NOT_FOUND],
  ['font', ErrorCode.FONT_NOT_FOUND],
  ['style', ErrorCode.STYLE_NOT_FOUND],
  ['component', ErrorCode.COMPONENT_NOT_FOUND],
  ['variable', ErrorCode.VARIABLE_NOT_FOUND],
];

const ERROR_PATTERNS: Array<[string, ErrorCode]> = [
  ['timeout', ErrorCode.COMMAND_TIMEOUT],
  ['locked', ErrorCode.NODE_LOCKED],
  ['not a frame', ErrorCode.INVALID_NODE_TYPE],
  ['not a text', ErrorCode.INVALID_NODE_TYPE],
  ['not an instance', ErrorCode.INVALID_NODE_TYPE],
  ['unknown command', ErrorCode.UNKNOWN_COMMAND],
];

export function parsePluginError(errorMessage: string): FigmaPilotError {
  const lowerMessage = errorMessage.toLowerCase();

  if (lowerMessage.includes('not found')) {
    for (const [keyword, code] of NOT_FOUND_PATTERNS) {
      if (lowerMessage.includes(keyword)) {
        return createError(code, errorMessage);
      }
    }
  }

  for (const [pattern, code] of ERROR_PATTERNS) {
    if (lowerMessage.includes(pattern)) {
      return createError(code, errorMessage);
    }
  }

  return createError(ErrorCode.COMMAND_FAILED, errorMessage);
}

export function formatErrorResponse(error: unknown): string {
  if (error instanceof FigmaPilotError) {
    return JSON.stringify({
      error: true,
      code: error.code,
      message: error.message,
      details: error.details,
    });
  }

  if (error instanceof Error) {
    const pilotError = parsePluginError(error.message);
    return JSON.stringify({
      error: true,
      code: pilotError.code,
      message: pilotError.message,
    });
  }

  return JSON.stringify({
    error: true,
    code: ErrorCode.COMMAND_FAILED,
    message: String(error),
  });
}
