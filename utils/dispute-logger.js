const winston = require('winston');
const path = require('path');

// Only create logger if in development environment
const isDevelopment = process.env.NODE_ENV === 'development';

// Create the logger instance
const disputeLogger = isDevelopment ? winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...metadata }) => {
      let msg = `${timestamp} [${level}]: ${message}`;
      if (Object.keys(metadata).length > 0) {
        msg += `\nMetadata: ${JSON.stringify(metadata, null, 2)}`;
      }
      return msg;
    })
  ),
  transports: [
    // Write to dispute-debug.log
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/dispute-debug.log'),
      level: 'debug'
    }),
    // Also log to console in development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
}) : null;

// Helper functions
const logDisputeAction = (action, data) => {
  if (isDevelopment && disputeLogger) {
    disputeLogger.debug(action, data);
  }
};

const logDisputeError = (error, context) => {
  if (isDevelopment && disputeLogger) {
    disputeLogger.error(error.message, {
      error: error.stack,
      context
    });
  }
};

const logDisputeQuery = (query, params) => {
  if (isDevelopment && disputeLogger) {
    disputeLogger.debug('Database Query', {
      query,
      params
    });
  }
};

module.exports = {
  logDisputeAction,
  logDisputeError,
  logDisputeQuery
}; 