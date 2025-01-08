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

// Create the escrow logger
const escrowLogger = winston.createLogger({
  format: logFormat,
  transports: [
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/escrow-error.log'),
      level: 'error'
    }),
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/escrow-combined.log')
    })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  escrowLogger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

function logEscrowOperation(operation, data) {
  escrowLogger.info({
    operation,
    ...data
  });
}

function logEscrowError(operation, error, context = {}) {
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