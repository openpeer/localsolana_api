const winston = require('winston');
const path = require('path');

// Create formatters for the logs
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
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
  // In development/staging, log to files and console
  escrowLogger.add(new winston.transports.File({ 
    filename: path.join(__dirname, '../logs/escrow-error.log'),
    level: 'error'
  }));
  escrowLogger.add(new winston.transports.File({ 
    filename: path.join(__dirname, '../logs/escrow-combined.log'),
    level: LOG_LEVEL
  }));
  escrowLogger.add(new winston.transports.Console({
    format: winston.format.simple(),
    level: LOG_LEVEL
  }));
}

function logEscrowOperation(operation, data) {
  if (LOG_LEVEL === 'none') return;
  escrowLogger.info({
    operation,
    ...data
  });
}

function logEscrowError(operation, error, context = {}) {
  if (LOG_LEVEL === 'none') return;
  const errorDetails = {
    operation,
    error: {
      message: error.message || error.toString(),
      stack: error.stack,
      code: error.code
    },
    context
  };

  // Handle Solana-specific error parsing
  if (error.message && error.message.includes('InstructionError')) {
    try {
      const parsedError = JSON.parse(error.message.match(/{.*}/)[0]);
      errorDetails.solanaError = {
        instruction: parsedError.InstructionError[0],
        type: parsedError.InstructionError[1],
      };
    } catch (e) {
      errorDetails.error.parseError = e.message;
    }
  }

  escrowLogger.error(errorDetails);
}

module.exports = {
  escrowLogger,
  logEscrowOperation,
  logEscrowError
}; 