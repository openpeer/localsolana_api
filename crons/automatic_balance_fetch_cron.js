const cron = require("node-cron");
const { Connection, PublicKey } = require("@solana/web3.js");
const models = require("../models"); // Import your models for database access
const { Op } = require("sequelize"); // Import Op for Sequelize operations

(async () => {
  const pLimit = (await import("p-limit")).default;

  // Initialize Solana connection
  const connection = new Connection(`${process.env.SOLANA_RPC_URL}`);
  const limit = pLimit(5); // Limit the number of concurrent requests to 5

  // Function to fetch and update SPL token balances using p-limit
  async function fetchAndUpdateSPLTokenBalances(walletAddresses, tokenSymbol, mintAddress) {
    const tokenBalances = [];

    // Function to fetch balance for a single wallet
    const fetchBalanceForWallet = async (walletAddress) => {
      try {
        const publicKey = new PublicKey(walletAddress);
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
          programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"), // Solana Token Program ID
        });

        let balance = 0;
        tokenAccounts.value.forEach((account) => {
          if (account.account.data.parsed.info.mint === mintAddress) {
            balance += account.account.data.parsed.info.tokenAmount.uiAmount;
          }
        });

        tokenBalances.push({ walletAddress, balance });
      } catch (error) {
        console.error(`Error fetching balance for wallet ${walletAddress}:`, error);
        // Skip this wallet and continue
      }
    };

    // Use p-limit to limit the number of concurrent balance fetches
    const fetchPromises = walletAddresses.map((walletAddress) => limit(() => fetchBalanceForWallet(walletAddress)));
    await Promise.all(fetchPromises);

    // Update available_token_amount for the relevant lists
    for (const { walletAddress, balance } of tokenBalances) {
      const listsToUpdate = await models.lists.findAll({
        where: {
          escrow_type: 1,
          "$seller.contract_address$": walletAddress,
          "$token.symbol$": tokenSymbol,
          status: {
            [Op.notIn]: [0, 2], // Exclude status 0 and 2
          },
        },
        include: [
          {
            model: models.user,
            as: "seller",
            attributes: ["contract_address"],
          },
          {
            model: models.tokens,
            as: "token",
            attributes: ["symbol"],
          },
        ],
      });

      for (const list of listsToUpdate) {
        console.log(`Updating ${tokenSymbol} balance for list:`, list.id, "with balance:", balance);
        await models.lists.update(
          {
            total_available_amount: balance,
          },
          { where: { id: list.id } }
        );
      }
    }

    console.log(`Balances for ${tokenSymbol} updated successfully.`);
  }

  // Function to fetch and update SOL balances using p-limit
  async function fetchAndUpdateSOLBalances(walletAddresses) {
    const solBalances = [];

    // Function to fetch SOL balance for a single wallet
    const fetchSOLBalanceForWallet = async (walletAddress) => {
      try {
        const publicKey = new PublicKey(walletAddress);
        const accountInfo = await connection.getAccountInfo(publicKey);

        const balance = accountInfo ? accountInfo.lamports / 1e9 : 0; // Convert lamports to SOL
        solBalances.push({ walletAddress, balance });
      } catch (error) {
        console.error(`Error fetching SOL balance for wallet ${walletAddress}:`, error);
        // Skip this wallet and continue
      }
    };

    // Use p-limit to limit the number of concurrent SOL balance fetches
    const fetchPromises = walletAddresses.map((walletAddress) => limit(() => fetchSOLBalanceForWallet(walletAddress)));
    await Promise.all(fetchPromises);

    // Update available_token_amount for SOL-based lists
    for (const { walletAddress, balance } of solBalances) {
      const listsToUpdate = await models.lists.findAll({
        where: {
          escrow_type: 1,
          "$seller.contract_address$": walletAddress,
          "$token.symbol$": "SOL", // Only update SOL-based lists
          status: {
            [Op.notIn]: [0, 2], // Exclude status 0 and 2
          },
        },
        include: [
          {
            model: models.user,
            as: "seller",
            attributes: ["contract_address"],
          },
          {
            model: models.tokens,
            as: "token",
            attributes: ["symbol"],
          },
        ],
      });

      for (const list of listsToUpdate) {
        console.log("Updating SOL balance for list:", list.id, "with balance:", balance);
        await models.lists.update(
          {
            total_available_amount: balance,
            last_balance_fetch: new Date(), // Update last fetch time
          },
          { where: { id: list.id } }
        );
      }
    }

    console.log("SOL balances updated successfully.");
  }

  // Function to fetch wallet addresses and update balances
  async function updateWalletBalances() {
    try {
      const lists = await models.lists.findAll({
        attributes: ["id", "seller_id"],
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
        tokenMap[token.address] = { symbol: token.symbol, address: token.address };
      });

      // Categorize wallet addresses based on the token type
      const usdcWalletAddresses = new Set();
      const usdtWalletAddresses = new Set();
      const solWalletAddresses = new Set();

      for (const list of lists) {
        const walletAddress = list.seller?.contract_address;
        if (!walletAddress) continue;

        const mintAddress = list.token?.address;
        const tokenSymbol = tokenMap[mintAddress]?.symbol;

        // Categorize based on token symbol
        if (tokenSymbol === "USDC") {
          usdcWalletAddresses.add(walletAddress);
        } else if (tokenSymbol === "USDT") {
          usdtWalletAddresses.add(walletAddress);
        } else if (tokenSymbol === "SOL") {
          solWalletAddresses.add(walletAddress);
        }
      }

      // Convert Sets back to arrays
      const usdcArray = Array.from(usdcWalletAddresses);
      const usdtArray = Array.from(usdtWalletAddresses);
      const solArray = Array.from(solWalletAddresses);

      // Fetch and update SOL balances
      if (solArray.length > 0) {
        await fetchAndUpdateSOLBalances(solArray);
      }

      // Fetch and update USDC balances
      if (usdcArray.length > 0) {
        const usdcMintAddress = tokenMap[Object.keys(tokenMap).find((key) => tokenMap[key].symbol === "USDC")].address;
        await fetchAndUpdateSPLTokenBalances(usdcArray, "USDC", usdcMintAddress);
      }

      // Fetch and update USDT balances
      if (usdtArray.length > 0) {
        const usdtMintAddress = tokenMap[Object.keys(tokenMap).find((key) => tokenMap[key].symbol === "USDT")].address;
        await fetchAndUpdateSPLTokenBalances(usdtArray, "USDT", usdtMintAddress);
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
