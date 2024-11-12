// cronJob.js
const cron = require("node-cron");
const { Connection, PublicKey } = require("@solana/web3.js");
const models = require("../models"); // Import your models for database access
(async () => {
  // Use dynamic import for p-limit
  const pLimit = (await import("p-limit")).default;

  // Initialize Solana connection (use mainnet-beta or the network you're using)
  const connection = new Connection(`${process.env.SOLANA_RPC_URL}`);
  const limit = pLimit(5); // Limit the number of concurrent requests
  // Function to fetch balance for a given Solana wallet
  async function getSolanaWalletBalance(walletAddress, tokenMintAddresses) {
    try {
      const publicKey = new PublicKey(walletAddress);

      // // Fetch SOL balance
      // const solBalance = await connection.getMultipleAccountsInfo(publicKey);
      // const solBalanceInSOL = solBalance / 1e9; // Convert lamports to SOL

      // Fetch SPL token balances (USDC, USDT, etc.)
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        {
          programId: new PublicKey(
            "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
          ), // Solana Token Program ID
        }
      );

      // Initialize balances for each token
      const tokenBalances = {};
      tokenMintAddresses.forEach((mintAddress) => {
        tokenBalances[mintAddress] = 0;
      });

      // Loop through token accounts to find balances
      tokenAccounts.value.forEach((account) => {
        const tokenAmount =
          account.account.data.parsed.info.tokenAmount.uiAmount;
        const mintAddress = account.account.data.parsed.info.mint;

        if (tokenMintAddresses.includes(mintAddress)) {
          tokenBalances[mintAddress] = tokenAmount;
        }
      });

      return { solBalanceInSOL, tokenBalances };
    } catch (error) {
      console.error(
        `Error fetching balance for wallet ${walletAddress}:`,
        error
      );
      return null;
    }
  }

  // Function to fetch and update balances for multiple wallet addresses
  async function fetchAndUpdateBalances(walletAddresses) {
    try {
      // Convert wallet addresses to PublicKey objects
      const publicKeys = walletAddresses.map(
        (address) => new PublicKey(address)
      );

      // Fetch account info for all public keys in a single call
      const accountsInfo = await connection.getMultipleAccountsInfo(publicKeys);

      // Map over the accounts info and extract balances in SOL
      const balances = accountsInfo.map((accountInfo, index) => {
        console.log("Account Info  ", accountInfo);
        if (accountInfo === null) return null; // If account info is null, return null
        return {
          walletAddress: walletAddresses[index],
          balance: accountInfo.lamports / 1e9, // Convert lamports to SOL
        };
      });

      // Update balances in the database
      for (const balanceInfo of balances) {
        if (balanceInfo !== null) {
          //   await models.user.update(
          //     { sol_balance: balanceInfo.balance },
          //     { where: { contract_address: balanceInfo.walletAddress } }
          //   );
          console.log("Account Info  ", balanceInfo);
          console.log( 
            "Balance for ",
            balanceInfo.walletAddress,
            " is ",
            balanceInfo.balance == 0 ? 0 : balanceInfo.balance - 0.00167736
          );
        }
      }

      console.log("Balances updated successfully for all wallets.");
    } catch (error) {
      console.error("Error fetching and updating balances:", error);
    }
  }

  // Fetch wallet addresses and update balances in batches
  async function updateWalletBalances() {
    try {
      const lists = await models.lists.findAll({
        attributes: ["seller_id"],
        where: { escrow_type: 1 },
        include: [
          {
            model: models.user,
            as: "seller",
            attributes: ["contract_address"],
          },
          {
            model: models.tokens,
            as: "token",
            attributes: ["address", "symbol"],
          },
        ],
      });

      const tokens = await models.tokens.findAll();
      const tokenMap = {}; // Create a map of token addresses to symbols

      // Populate the tokenMap
      tokens.forEach((token) => {
        tokenMap[token.address] = token.symbol;
      });

      // Categorize wallet addresses based on the token type
      const usdcWalletAddresses = new Set();
      const usdtWalletAddresses = new Set();
      const solWalletAddresses = new Set();

      for (const list of lists) {
        const walletAddress = list.seller?.contract_address;
        if (!walletAddress) continue; // Use `continue` to skip if walletAddress is not available

        const mintAddress = list.token?.address;
        const tokenSymbol = tokenMap[mintAddress]; // Get the symbol using the token address
        

        // Categorize based on token symbol
        if (tokenSymbol === "USDC") {
          usdcWalletAddresses.add(walletAddress);
        } else if (tokenSymbol === "USDT") {
          usdtWalletAddresses.add(walletAddress);
        } else if (tokenSymbol === "SOL") {
          solWalletAddresses.add(walletAddress);
        }
      }
      // Convert Sets back to arrays if needed
      const usdcArray = Array.from(usdcWalletAddresses);
      const usdtArray = Array.from(usdtWalletAddresses);
      const solArray = Array.from(solWalletAddresses);

      if (solArray.length > 0) {
        await fetchAndUpdateBalances(solArray);
      }
    } catch (error) {
      console.error("Error updating wallet balances:", error);
    }
  }

  // Schedule the CRON job to run every 10 minutes
  cron.schedule("*/10 * * * *", () => {
    console.log("Running CRON job to update Solana wallet balances...");
    updateWalletBalances();
  });
})();
