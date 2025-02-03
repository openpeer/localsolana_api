const { execSync } = require('child_process');
const models = require('../models');
const chalk = require('chalk');

class OrderEscrowVerifier {
  // Standard token addresses
  TOKENS = {
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    SOL: '11111111111111111111111111111111'
  };

  async getTokenBalance(escrowAddress, tokenMint) {
    try {
      const output = execSync(
        `spl-token balance --url mainnet-beta ${tokenMint} --owner ${escrowAddress}`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
      );
      return parseFloat(output) || 0;
    } catch (error) {
      return 0;
    }
  }

  async getSolBalance(escrowAddress) {
    try {
      const output = execSync(
        `solana balance --url mainnet-beta ${escrowAddress}`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
      );
      return parseFloat(output) || 0;
    } catch (error) {
      return 0;
    }
  }

  async checkAllTokenBalances(escrowAddress) {
    const balances = {};
    
    // Check SOL
    balances.SOL = await this.getSolBalance(escrowAddress);
    
    // Check USDC
    balances.USDC = await this.getTokenBalance(escrowAddress, this.TOKENS.USDC);
    
    // Check USDT
    balances.USDT = await this.getTokenBalance(escrowAddress, this.TOKENS.USDT);

    return balances;
  }

  async verifyOrderEscrows() {
    try {
      const orders = await models.Order.findAll({
        attributes: ["id", "trade_id", "status", "buyer_id", "seller_id"],
        where: {
          trade_id: {
            [models.Sequelize.Op.not]: null,
            [models.Sequelize.Op.ne]: ''
          }
        },
        include: [{
          model: models.lists,
          as: "list",
          attributes: ["id"],
          include: [{
            model: models.tokens,
            as: "token",
            attributes: ["address", "symbol"]
          }]
        },
        {
          model: models.user,
          as: "buyer",
          attributes: ["name", "address"]
        },
        {
          model: models.user,
          as: "seller",
          attributes: ["name", "address"]
        }]
      });

      console.log(chalk.blue(`Checking ${orders.length} escrow accounts...`));
      
      const results = [];
      
      for (const order of orders) {
        process.stdout.write(`Checking order ${chalk.cyan(order.id)}... `);
        
        let balances;
        if (!order.list?.token?.address) {
          console.log(chalk.yellow('No token info, checking all tokens...'));
          balances = await this.checkAllTokenBalances(order.trade_id);
        } else {
          const tokenAddress = order.list.token.address;
          const tokenSymbol = order.list.token.symbol;
          balances = {
            [tokenSymbol]: tokenAddress === this.TOKENS.SOL ? 
              await this.getSolBalance(order.trade_id) :
              await this.getTokenBalance(order.trade_id, tokenAddress)
          };
        }

        // Check if any balance is greater than 0
        const nonZeroBalances = Object.entries(balances)
          .filter(([_, balance]) => balance > 0)
          .map(([symbol, balance]) => `${balance} ${symbol}`)
          .join(', ');

        if (nonZeroBalances) {
          console.log(chalk.yellow(`Found ${nonZeroBalances}`));
          const statusText = {
            0: 'pending',
            1: 'active',
            2: 'completed',
            3: 'cancelled',
            4: 'disputed'
          }[order.status] || 'unknown';

          results.push({
            'Order ID': order.id,
            'Trade ID': order.trade_id,
            'Balance': nonZeroBalances,
            'Status': statusText,
            'Buyer': order.buyer?.name || 'Unknown',
            'Seller': order.seller?.name || 'Unknown'
          });
        } else {
          console.log(chalk.gray('Empty'));
        }

        // Sleep for 1 second between checks
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (results.length > 0) {
        console.log(chalk.yellow('\nEscrow accounts with non-zero balances:'));
        console.table(results);
        console.log(chalk.green(`\nFound ${results.length} escrow(s) with funds`));
      } else {
        console.log(chalk.green('\nNo escrow accounts with funds found'));
      }

    } catch (error) {
      console.error(chalk.red('Error:', error));
    }
  }
}

const verifier = new OrderEscrowVerifier();
verifier.verifyOrderEscrows()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 