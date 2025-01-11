import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Set test environment
process.env.NODE_ENV = 'test';

// Set test RPC URL if not already set
if (!process.env.SOLANA_RPC_URL) {
  process.env.SOLANA_RPC_URL = 'http://localhost:8899';
}

// Set test public keys if not already set
if (!process.env.TEST_SELLER_PUBKEY) {
  process.env.TEST_SELLER_PUBKEY = 'AczLKrdS6hFGNoTWg9AaS9xhuPfZgVTPxL2W8XzZMDjH';
}

if (!process.env.TEST_BUYER_PUBKEY) {
  process.env.TEST_BUYER_PUBKEY = 'UoZhCnPhqW3bbEeuwghh3oQ549xjp3xeccTGHKonaxa';
}

if (!process.env.TEST_USDT_TOKEN) {
  process.env.TEST_USDT_TOKEN = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB';
}

// Set fee recipient and payer to use test seller/buyer if not already set
if (!process.env.FEE_RECIPIENT) {
  process.env.FEE_RECIPIENT = process.env.TEST_SELLER_PUBKEY;
}

if (!process.env.FEE_PAYER) {
  process.env.FEE_PAYER = process.env.TEST_BUYER_PUBKEY;
}

// Override console methods for better test output
const originalLog = console.log;
const originalError = console.error;

console.log = function (...args) {
  const formattedArgs = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
  );
  originalLog.apply(console, formattedArgs);
};

console.error = function (...args) {
  const formattedArgs = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
  );
  originalError.apply(console, formattedArgs);
}; 