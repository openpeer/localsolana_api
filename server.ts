import dotenv from 'dotenv';
import fs from 'fs';
import express, { Express, Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import http from 'http';
import https from 'https';
import { Server } from 'socket.io';
import { startListeningSolanaEvents } from "./utils/web3Utils";
import automaticOrderCancellationCron from "./crons/automatic_order_cancellation_cron";
import balanceFetchCron from "./crons/automatic_balance_fetch_cron";
import AutomaticPriceFetchCron from "./crons/automatic_price_fetch_cron";
import AutomaticBinancePriceFetcher from "./crons/automatic_binance_price_fetch_cron";
// import { setupAdminJS } from './setupadminjs';
import { cache } from './utils/cache';
import { sq as sequelize } from './config/database';
import connectSessionSequelize from 'connect-session-sequelize';
import createRouter from './api/routes/routes';
import setupSocketHandlers from './api/routes/socket.route';
import { PublicKey } from "@solana/web3.js";
import { ProgramService } from "./services/ProgramService";

dotenv.config();

const port = process.env.PORT || 3000;
const app: Express = express();

const SessionStore = connectSessionSequelize(session.Store);

const startServer = async () => {
  try {
    // Try to connect to the database
    await sequelize.authenticate();
    console.log("Database connection established successfully.");
  } catch (error) {
    console.error("Warning: Database connection failed:", error);
    // Continue anyway - your app might have routes that don't need DB
  }

  const sessionStore = new SessionStore({
    db: sequelize,
    tableName: 'sessions', // Explicit table name
    expiration: 24 * 60 * 60 * 1000, // Session expiration (1 day)
    checkExpirationInterval: 15 * 60 * 1000, // Clean up expired sessions every 15 mins
  });

  sessionStore.sync();

  let server;
  
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
  const io = new Server(server);
  setupSocketHandlers(io);
  
  // As soon as the server starts, start listening for our program events.
  startListeningSolanaEvents(io);

  // Middleware
  app.use(express.json());
  app.set('view engine', 'pug');

  // Basic health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).send('OK');
  });

  // Temporarily disable AdminJS setup
  // await setupAdminJS(app, sessionStore);
  // console.log("AdminJS setup complete");

  // Use API routes
  app.use('/api', createRouter(io));

  // Error handling middleware
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });

  // Add test endpoint for building release funds transaction
  app.post('/api/test/build-release-funds', async (req, res) => {
    try {
      const { orderId, seller, buyer, token } = req.body;
      
      // Validate inputs
      if (!orderId || !seller || !buyer || !token) {
        return res.status(400).json({ 
          error: 'Missing required parameters. Need orderId, seller, buyer, and token addresses.' 
        });
      }

      // Create mock order with status 1
      const order = {
        dataValues: {
          status: 1
        }
      };

      // Build transaction
      const programService = ProgramService.getInstance();
      const transaction = await programService.buildReleaseFundsTransaction({
        orderId,
        seller: new PublicKey(seller),
        buyer: new PublicKey(buyer),
        token: new PublicKey(token),
        order
      });

      // Return transaction details
      return res.json({
        success: true,
        transaction: {
          recentBlockhash: transaction.recentBlockhash,
          feePayer: transaction.feePayer?.toBase58(),
          instructions: transaction.instructions.map(ix => ({
            programId: ix.programId.toBase58(),
            keys: ix.keys.map(key => ({
              pubkey: key.pubkey.toBase58(),
              isSigner: key.isSigner,
              isWritable: key.isWritable
            })),
            data: ix.data.toString('base64')
          }))
        }
      });

    } catch (error) {
      console.error('Error building transaction:', error);
      return res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error building transaction' 
      });
    }
  });

  // Start the server
  server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`Database host: ${process.env.DB_HOST}`);
  });

  // Initialize price crons
  const priceCron = new AutomaticPriceFetchCron();
  const binancePriceCron = new AutomaticBinancePriceFetcher();
  
  // Start both price crons
  priceCron.startCron();
  binancePriceCron.startCron();

  // Check cache and run initial price fetches if needed
  const keys = cache.keys();
  if (keys.length > 0) {
    console.log('Cache has values:', keys);
  } else {
    console.log('Cache is empty. Running Initial Price Fetches');
    try {
      await priceCron.fetchTokenPrices();
      await binancePriceCron.fetchAllPrices();
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