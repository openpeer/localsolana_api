const fs = require('fs');
const path = require('path');

// Only log in development mode
const isDevelopment = process.env.NODE_ENV === 'development';
const logDir = 'logs';
const shyftLogFile = path.join(logDir, 'shyft-operations.log');

// Ensure log directory exists
if (isDevelopment && !fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

function formatLogEntry(type, operation, details) {
  const timestamp = new Date().toISOString();
  const costType = type === 'API' ? '(100 credits)' : '(1 credit)';
  
  return `[${timestamp}] ${type} ${costType} - ${operation}\n` +
         `Details: ${JSON.stringify(details, null, 2)}\n` +
         '-'.repeat(80) + '\n';
}

function logShyftOperation(type, operation, details = {}) {
  if (!isDevelopment) return;

  try {
    const logEntry = formatLogEntry(type, operation, details);
    fs.appendFileSync(shyftLogFile, logEntry);
  } catch (error) {
    console.error('Error writing to Shyft log:', error);
  }
}

// Specific logging functions for different types of operations
const ShyftLogger = {
  logRPC: (operation, details) => logShyftOperation('RPC', operation, details),
  logAPI: (operation, details) => logShyftOperation('API', operation, details),
};

module.exports = ShyftLogger; 