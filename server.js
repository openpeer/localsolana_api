// server.js

require('dotenv').config();
const fs = require('fs');
const port = process.env.PORT || 3000; 
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const http = require('http');
const https = require('https');
const { startListeningSolanaEvents } = require("./utils/web3Utils");
const automaticOrderCancellationCron = require("./crons/automatic_order_cancellation_cron");
const balanceFetchCron = require("./crons/automatic_balance_fetch_cron");
const AutomaticPriceFetchCron = require("./crons/automatic_price_fetch_cron");
const AutomaticBinancePriceFetcher = require("./crons/automatic_binance_price_fetch_cron"); // Import Binance price fetcher
const {setupAdminJS} = require('./setupadminjs');
const {cache} = require('./utils/cache');

// Initialize express app
const app = express();

// Database connection check
const { sq: sequelize } = require('./config/database');
const connectSessionSequelize = require('connect-session-sequelize')(session.Store);

const startServer = async () => {
  try {
    // Try to connect to the database
    await sequelize.authenticate();
    console.log("Database connection established successfully.");
  } catch (error) {
    console.error("Warning: Database connection failed:", error);
    // Continue anyway - your app might have routes that don't need DB
  }

  const sessionStore = new connectSessionSequelize({
    db: sequelize,
    tableName: 'sessions', // Explicit table name
    expiration: 24 * 60 * 60 * 1000, // Session expiration (1 day)
    checkExpirationInterval: 15 * 60 * 1000, // Clean up expired sessions every 15 mins
  });

  sessionStore.sync();

  let server;
  let url;
  
  if (process.env.PROD === 'true') {
    try {
      const certDir = `/etc/letsencrypt/live`;
      const domain = process.env.HOST;
      const httpsOptions = {
        key: fs.readFileSync(`${certDir}/${domain}/privkey.pem`),
        cert: fs.readFileSync(`${certDir}/${domain}/fullchain.pem`)
      };
      server = https.createServer(httpsOptions, app);
    } catch (error) {
      console.error("HTTPS setup failed:", error);
      console.log("Falling back to HTTP");
      server = http.createServer(app);
    }
  } else {
    server = http.createServer(app);
  }

  // Set up Socket.IO
  const socketIo = require('socket.io');
  const io = socketIo(server);
  const setupSocketHandlers = require('./api/routes/socket.route');
  setupSocketHandlers(io);
  // As soon as the server starts, start listening for our program events.
  startListeningSolanaEvents(io);

  // Middleware
  app.use(express.json());
  app.set('view engine', 'pug');

  // Basic health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).send('OK');
  });

  setupAdminJS(app, sessionStore)
  .then(() => {
    console.log("AdminJS setup complete"); 
  })
  .catch((err) => console.error("Error setting up AdminJS:", err));

  // Use API routes
  const createRouter = require('./api/routes/routes');
  app.use('/api', createRouter(io));

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });

  // Start the server
  server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Database host: ${process.env.DB_HOST}`);
  });

  // Initialize price crons
  const priceCron = new AutomaticPriceFetchCron();
  const binancePriceCron = new AutomaticBinancePriceFetcher(); // Initialize Binance price fetcher
  
  // Start both price crons
  priceCron.startCron();
  binancePriceCron.startCron(); // Start Binance price fetching cron

  // Check cache and run initial price fetches if needed
  const keys = cache.keys();
  if (keys.length > 0) {
    console.log('Cache has values:', keys);
  } else {
    console.log('Cache is empty. Running Initial Price Fetches');
    try {
      await priceCron.fetchTokenPrices();
      await binancePriceCron.fetchAllPrices(); // Fetch initial Binance prices
    } catch (error) {
      console.error('Initial price fetch failed:', error);
    }
  }
};

// Start the application
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});