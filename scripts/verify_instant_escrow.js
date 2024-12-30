const { Connection, PublicKey } = require('@solana/web3.js');
const models = require('../models');
const chalk = require('chalk');

class InstantEscrowVerifier {
  constructor() {
    if (!process.env.SOLANA_RPC_URL) {
      throw new Error('SOLANA_RPC_URL environment variable is not set');
    }
    this.connection = new Connection(process.env.SOLANA_RPC_URL);
  }

  async verifyInstantEscrowLists() {
    try {
      const lists = await models.lists.findAll({
        attributes: ["id", "seller_id", "token_id", "total_available_amount", "status"],
        where: { escrow_type: 1 },
        include: [
          {
            model: models.user,
            as: "seller",
            attributes: ["id", "address", "contract_address", "name"],
          },
          {
            model: models.tokens,
            as: "token",
            attributes: ["address", "symbol", "decimals"]
          }
        ],
      });

      console.log(chalk.bgBlue.white.bold(`Found ${lists.length} instant escrow lists to verify`));
      
      const results = [];
      
      for (const list of lists) {
        try {
          console.log(chalk.cyan(`\nProcessing list ${list.id}:`));
          console.log('Token:', list.token?.symbol);
          console.log('Seller contract:', list.seller?.contract_address);

          if (!list.token?.address || !list.seller?.contract_address) {
            console.error(chalk.red(`List ${list.id}: Missing token or seller address`));
            continue;
          }

          let tokenMint, sellerPubkey;
          try {
            tokenMint = new PublicKey(list.token.address);
            sellerPubkey = new PublicKey(list.seller.contract_address);
          } catch (error) {
            console.error(chalk.red(`List ${list.id}: Invalid public key format`));
            continue;
          }

          let balance = 0;
          // Check token balance for SPL tokens
          if (list.token.address !== '11111111111111111111111111111111') {
            try {
              const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
                sellerPubkey,
                { mint: tokenMint }
              );
              balance = tokenAccounts.value.reduce((total, acc) => 
                total + (acc.account.data.parsed.info.tokenAmount.uiAmount || 0), 0);
            } catch (error) {
              console.log(chalk.yellow(`No token account found for seller ${list.seller.contract_address}`));
            }
          } else {
            // For SOL, get the account balance directly
            try {
              const solBalance = await this.connection.getBalance(sellerPubkey);
              balance = solBalance / 1e9; // Convert lamports to SOL
            } catch (error) {
              console.log(chalk.yellow(`No SOL balance found for seller ${list.seller.contract_address}`));
            }
          }

          const statusColors = {
            inactive: chalk.yellow,
            active: chalk.green,
            cancelled: chalk.red
          };

          const statusText = {
            0: 'inactive',
            1: 'active',
            2: 'cancelled'
          }[list.status] || 'unknown';

          const coloredStatus = statusColors[statusText] 
            ? statusColors[statusText](statusText) 
            : chalk.gray(statusText);

          const problems = [];
          if (statusText === 'active') {
            if (balance < list.total_available_amount) {
              problems.push('Insufficient balance');
            }
          }

          results.push({
            listId: list.id,
            token: list.token.symbol,
            seller: list.seller.name || 'Unknown',
            sellerContract: list.seller.contract_address.slice(0, 8) + '...',
            available: list.total_available_amount,
            balance: balance,
            status: statusText,
            problems: problems.length ? problems.join(', ') : '✓'
          });

          console.log(chalk.green(`Balance: ${balance} ${list.token.symbol}`));
          console.log(chalk.blue(`Available Amount: ${list.total_available_amount} ${list.token.symbol}`));
          console.log(`Status: ${coloredStatus}`);
          if (problems.length) {
            console.log(chalk.red(`Problems: ${problems.join(', ')}`));
          }

        } catch (error) {
          console.error(chalk.red(`Error processing list ${list.id}:`), error);
        }
      }

      // Sort results: active first, then inactive, then cancelled, then by token
      const statusOrder = {
        'active': 0,
        'inactive': 1,
        'cancelled': 2,
        'unknown': 3
      };

      const sortedResults = results.sort((a, b) => {
        // First sort by status
        const statusDiff = statusOrder[a.status] - statusOrder[b.status];
        if (statusDiff !== 0) return statusDiff;
        
        // Then sort by token
        return a.token.localeCompare(b.token);
      });

      // Print results in table format
      console.table(sortedResults);

    } catch (error) {
      console.error(chalk.red('Error in verifyInstantEscrowLists:'), error);
    }
  }
}

// Run the verification
if (require.main === module) {
  const verifier = new InstantEscrowVerifier();
  verifier.verifyInstantEscrowLists()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = InstantEscrowVerifier; 