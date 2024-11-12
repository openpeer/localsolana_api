const cron = require("node-cron");
const { Connection, PublicKey } = require("@solana/web3.js");
const models = require("../models");
const { Op } = require('sequelize');

(async () => {
  const pLimit = (await import("p-limit")).default;

  // Initialize Solana connection
  const connection = new Connection(`${process.env.SOLANA_RPC_URL}`);
  const limit = pLimit(5); // Limit the number of concurrent requests

  // Function to batch process wallet addresses
  function createBatches(array, batchSize) {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  // Function to fetch and update SPL token balances in batches
  async function fetchAndUpdateSPLTokenBalances(walletAddresses, tokenSymbol, mintAddress) {
    const batches = createBatches(walletAddresses, 3); // Batch size of 3

    for (const batch of batches) {
      try {
        const tokenBalances = [];

        // Fetch token balances for each wallet in the batch
        for (const walletAddress of batch) {
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
        }

        // Update available_token_amount for the relevant lists
        for (const { walletAddress, balance } of tokenBalances) {
          const listsToUpdate = await models.lists.findAll({
            where: {
              escrow_type: 1,
              "$seller.contract_address$": walletAddress,
              "$token.symbol$": tokenSymbol,
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
              { total_available_amount: balance },
              { where: { id: list.id } }
            );
          }
        }

        console.log(`Batch of ${tokenSymbol} balances updated successfully.`);
      } catch (error) {
        console.error(`Error fetching ${tokenSymbol} balances for a batch, skipping batch:`, error);
        // Skip this batch and continue with the next one
        continue;
      }
    }
  }

  // Function to fetch and update SOL balances
  async function fetchAndUpdateSOLBalances(walletAddresses) {
    try {
      const publicKeys = walletAddresses.map((address) => new PublicKey(address));
      const accountsInfo = await connection.getMultipleAccountsInfo(publicKeys);

      // Map over the accounts info and extract balances in SOL
      const balances = accountsInfo.map((accountInfo, index) => {
        if (accountInfo === null) return null;
        return {
          walletAddress: walletAddresses[index],
          balance: accountInfo.lamports / 1e9, // Convert lamports to SOL
        };
      });

      // Update available_token_amount for SOL-based lists
      for (const balanceInfo of balances) {
        if (balanceInfo !== null) {
          const listsToUpdate = await models.lists.findAll({
            where: {
              escrow_type: 1,
              "$seller.contract_address$": balanceInfo.walletAddress,
              "$token.symbol$": "SOL", // Only update SOL-based lists
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
            console.log("Updating SOL balance for list:", list.id, "with balance:", balanceInfo.balance);
            await models.lists.update(
              { total_available_amount: balanceInfo.balance },
              { where: { id: list.id } }
            );
          }
        }
      }

      console.log("SOL balances updated successfully for all relevant lists.");
    } catch (error) {
      console.error("Error fetching and updating SOL balances:", error);
    }
  }

  // Fetch wallet addresses and update balances in batches
  async function updateWalletBalances() {
    try {
      const lists = await models.lists.findAll({
        attributes: ["id", "seller_id"],
        where: { escrow_type: 1,status: {
            [Op.notIn]: [0, 2],
          }, },
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
        if (!walletAddress) continue; // Skip if walletAddress is not available

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

      // Fetch and update USDC balances in batches
      if (usdcArray.length > 0) {
        const usdcMintAddress = tokenMap[Object.keys(tokenMap).find(key => tokenMap[key].symbol === "USDC")].address;
        await fetchAndUpdateSPLTokenBalances(usdcArray, "USDC", usdcMintAddress);
      }

      // Fetch and update USDT balances in batches
      if (usdtArray.length > 0) {
        const usdtMintAddress = tokenMap[Object.keys(tokenMap).find(key => tokenMap[key].symbol === "USDT")].address;
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
