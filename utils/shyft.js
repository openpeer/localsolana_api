require("dotenv").config();
const { ShyftSdk,Network } = require('@shyft-to/js');

let shyftInstance;

function getShyftInstance() {
    if (!shyftInstance) {
        shyftInstance = new ShyftSdk({
            apiKey: process.env.SHYFT_API_KEY,
            network: getShyftNetwork(process.env.SOLANA_NETWORK), // Convert string to Network enum
          });
    }
    return shyftInstance;
}

// Helper function to convert string network to ShyftSdk Network enum
const getShyftNetwork = (network) => {
    switch (network.toLowerCase()) {
      case "mainnet-beta":
      case "mainnet":
        return Network.Mainnet;
      case "devnet":
        return Network.Devnet;
      case "testnet":
        return Network.Testnet;
      default:
        return Network.Devnet; // Default to devnet if unknown
    }
  };

module.exports = {
    getShyftInstance,
    getShyftNetwork
};
