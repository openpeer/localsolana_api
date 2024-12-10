const cron = require("node-cron");
const { Connection, PublicKey } = require("@solana/web3.js");
const models = require("../models");
const { Op } = require("sequelize");
const chalk = require('chalk');

class AutomaticBalanceFetcher {
  async initialize() {
    this.connection = new Connection(`${process.env.SOLANA_RPC_URL}`);
    const pLimit = await import('p-limit');
    this.pLimit = pLimit.default(5);
  }

  async startCron() {
    await this.initialize();
    console.log(chalk.bgBlue.white.bold("🕒 STARTING BALANCE FETCHING CRON JOB..."));
    await this.updateWalletBalances();
    
    // Schedule future runs if needed
    cron.schedule("*/10 * * * *", async () => {
      console.log(chalk.bgYellow.black.bold("⚡ FETCHING WALLET BALANCES..."));
      await this.updateWalletBalances();
    });
  }

  async updateWalletBalances() {
    try {
      const lists = await models.lists.findAll({
        attributes: ["id", "seller_id"],
        where: { escrow_type: 1 },
        include: [
          {
            model: models.user,
            as: "seller",
            attributes: ["id", "address", "contract_address"],
            logging: true
          },
          {
            model: models.tokens,
            as: "token",
            attributes: ["address", "symbol"]
          }
        ],
        logging: true
      });

      // Group unique wallet addresses
      const walletAddresses = new Set(lists.map(list => list.seller?.contract_address).filter(Boolean));
      
      console.log(chalk.bgBlue.white.bold(`Checking balances for ${walletAddresses.size} wallets`));

      for (const walletAddress of walletAddresses) {
        try {
          const publicKey = new PublicKey(walletAddress);
          
          // Get SOL balance
          const solBalance = await this.connection.getBalance(publicKey);
          const solUiBalance = solBalance / 1e9; // Convert lamports to SOL
          
          // Get USDC balance (using mint address)
          const usdcMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
          const usdcAccounts = await this.connection.getParsedTokenAccountsByOwner(publicKey, { mint: usdcMint });
          const usdcBalance = usdcAccounts.value.reduce((total, acc) => 
            total + (acc.account.data.parsed.info.tokenAmount.uiAmount || 0), 0);
          
          // Get USDT balance (using mint address)
          const usdtMint = new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB');
          const usdtAccounts = await this.connection.getParsedTokenAccountsByOwner(publicKey, { mint: usdtMint });
          const usdtBalance = usdtAccounts.value.reduce((total, acc) => 
            total + (acc.account.data.parsed.info.tokenAmount.uiAmount || 0), 0);

          console.log(chalk.cyan(`Wallet ${walletAddress}:`));
          console.log(chalk.green(`  SOL: ${solUiBalance.toFixed(4)}`));
          console.log(chalk.green(`  USDC: ${usdcBalance.toFixed(4)}`));
          console.log(chalk.green(`  USDT: ${usdtBalance.toFixed(4)}`));

        } catch (error) {
          console.error(chalk.red(`Error fetching balances for wallet ${walletAddress}:`), error);
        }
      }

    } catch (error) {
      console.error(chalk.bgRed.white.bold("❌ Error updating wallet balances:"), chalk.red(error));
    }
  }
}

// Create instance
const balanceFetcher = new AutomaticBalanceFetcher();

// If this file is run directly (not required as a module)
if (require.main === module) {
  balanceFetcher.startCron()
    .catch(console.error);
}

module.exports = balanceFetcher;
