import winston from 'winston';
import path from 'path';

// Create formatters for the logs
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, operation, ...meta }) => {
    // Special formatting for test environment
    if (process.env.NODE_ENV === 'test') {
      const formatValue = (value: unknown): string => {
        if (typeof value === 'object' && value !== null) {
          return '\n' + JSON.stringify(value, null, 2);
        }
        return String(value);
      };

      const metaStr = Object.keys(meta).length > 0 
        ? '\n' + JSON.stringify(meta, null, 2)
        : '';
      
      const messageStr = message ? formatValue(message) : '';
      
      if (operation) {
        return `[${level.toUpperCase()}] Operation: ${operation}${
          messageStr ? '\nMessage: ' + messageStr : ''
        }${metaStr}`;
      }
      return `[${level.toUpperCase()}]${
        messageStr ? ' Message: ' + messageStr : ''
      }${metaStr}`;
    }
    
    // Regular formatting for other environments
    return JSON.stringify({
      timestamp,
      level,
      message,
      operation,
      ...meta
    });
  })
);

// Get log level from environment, default to 'info' in development and 'error' in production
const LOG_LEVEL = process.env.ESCROW_LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'error' : 'info');

// Create the escrow logger
const escrowLogger = winston.createLogger({
  level: LOG_LEVEL,
  format: logFormat,
  transports: []
});

// In production, only log to stdout/stderr
if (process.env.NODE_ENV === 'production') {
  escrowLogger.add(new winston.transports.Console({
    level: LOG_LEVEL,
    format: winston.format.json()
  }));
} else {
  // In development/staging/test, log to files and console
  escrowLogger.add(new winston.transports.File({ 
    filename: path.join(__dirname, '../logs/escrow-error.log'),
    level: 'error'
  }));
  escrowLogger.add(new winston.transports.File({ 
    filename: path.join(__dirname, '../logs/escrow-combined.log'),
    level: LOG_LEVEL
  }));
  escrowLogger.add(new winston.transports.Console({
    format: logFormat,
    level: LOG_LEVEL
  }));
}

interface ErrorDetails {
  operation: string;
  error: {
    message: string;
    stack?: string;
    code?: string;
    parseError?: string;
  };
  context: Record<string, any>;
  solanaError?: {
    instruction: number;
    type: string;
  };
}

export function logEscrowOperation(operation: string, data: Record<string, any>): void {
  if (LOG_LEVEL === 'none') return;
  escrowLogger.info({
    operation,
    message: data,
    ...data
  });
}

export function logEscrowError(operation: string, error: Error | string, context: Record<string, any> = {}): void {
  if (LOG_LEVEL === 'none') return;
  const errorDetails: ErrorDetails = {
    operation,
    error: {
      message: error instanceof Error ? error.message : error.toString(),
      stack: error instanceof Error ? error.stack : undefined,
      code: error instanceof Error ? (error as any).code : undefined
    },
    context
  };

  // Handle Solana-specific error parsing
  if (error instanceof Error && error.message && error.message.includes('InstructionError')) {
    try {
      const match = error.message.match(/{.*}/);
      if (match) {
        const parsedError = JSON.parse(match[0]);
        errorDetails.solanaError = {
          instruction: parsedError.InstructionError[0],
          type: parsedError.InstructionError[1],
        };
      }
    } catch (e) {
      errorDetails.error.parseError = e instanceof Error ? e.message : String(e);
    }
  }

  escrowLogger.error(errorDetails);
}

export { escrowLogger }; 