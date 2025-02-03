const { execSync } = require('child_process');
const models = require('../models');
const chalk = require('chalk');

class UserBalanceVerifier {
  // Standard token addresses
  TOKENS = {
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    SOL: '11111111111111111111111111111111'
  };

  async getTokenBalance(walletAddress, tokenMint) {
    try {
      const output = execSync(
        `spl-token balance --url mainnet-beta ${tokenMint} --owner ${walletAddress}`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
      );
      return parseFloat(output) || 0;
    } catch (error) {
      return 0;
    }
  }

  async getSolBalance(walletAddress) {
    try {
      const output = execSync(
        `solana balance --url mainnet-beta ${walletAddress}`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
      );
      return parseFloat(output) || 0;
    } catch (error) {
      return 0;
    }
  }

  async checkUserBalances() {
    try {
      // Get all users with contract addresses
      const users = await models.user.findAll({
        attributes: ["id", "name", "email", "contract_address"],
        where: {
          contract_address: {
            [models.Sequelize.Op.not]: null,
            [models.Sequelize.Op.ne]: ''
          }
        }
      });

      console.log(chalk.blue(`Checking balances for ${users.length} users...`));
      
      const results = [];
      
      for (const user of users) {
        process.stdout.write(
          chalk.cyan(`\nChecking user ${user.id} (${user.name})... `)
        );

        if (!user.contract_address) {
          console.log(chalk.red('No wallet address'));
          continue;
        }

        // Check SOL balance
        process.stdout.write('SOL ');
        const solBalance = await this.getSolBalance(user.contract_address);
        
        // Wait 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check USDC balance
        process.stdout.write('USDC ');
        const usdcBalance = await this.getTokenBalance(
          user.contract_address, 
          this.TOKENS.USDC
        );
        
        // Wait 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check USDT balance
        process.stdout.write('USDT ');
        const usdtBalance = await this.getTokenBalance(
          user.contract_address, 
          this.TOKENS.USDT
        );

        // Format balances
        const balances = {
          SOL: solBalance,
          USDC: usdcBalance,
          USDT: usdtBalance
        };

        // Log non-zero balances immediately
        const nonZeroBalances = Object.entries(balances)
          .filter(([_, balance]) => balance > 0)
          .map(([symbol, balance]) => `${balance} ${symbol}`)
          .join(', ');

        if (nonZeroBalances) {
          console.log(chalk.green(`Found: ${nonZeroBalances}`));
        } else {
          console.log(chalk.gray('No funds'));
        }

        // Add to results if any balance is non-zero
        if (Object.values(balances).some(balance => balance > 0)) {
          results.push({
            'User ID': user.id,
            'Name': user.name,
            'Email': user.email,
            'SOL': solBalance.toFixed(4),
            'USDC': usdcBalance.toFixed(2),
            'USDT': usdtBalance.toFixed(2),
            'Wallet': user.contract_address.slice(0, 8) + '...'
          });
        }

        // Wait 2 seconds before next user
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      if (results.length > 0) {
        console.log(chalk.yellow('\nUsers with non-zero balances:'));
        console.table(results);
        console.log(chalk.green(`\nFound ${results.length} user(s) with funds`));
      } else {
        console.log(chalk.green('\nNo users with funds found'));
      }

    } catch (error) {
      console.error(chalk.red('Error:', error));
    }
  }
}

const verifier = new UserBalanceVerifier();
verifier.checkUserBalances()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 