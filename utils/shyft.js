require("dotenv").config();
const { ShyftSdk,Network } = require('@shyft-to/js');

let shyftInstance;

// Helper function to convert string network to ShyftSdk Network enum
const getShyftNetwork = (network = 'devnet') => {
    if (!network) return Network.Devnet; // Default fallback
    
    switch (network.toLowerCase()) {
      case "mainnet-beta":
      case "mainnet":
        return Network.Mainnet;
      case "devnet":
        return Network.Devnet;
      case "testnet":
        return Network.Testnet;
      default:
        return Network.Devnet;
    }
};

function getShyftInstance() {
    if (!shyftInstance) {
        if (!process.env.SHYFT_API_KEY) {
            throw new Error('SHYFT_API_KEY is not set in environment variables');
        }
        
        const network = process.env.SOLANA_NETWORK || 'devnet';
        
        shyftInstance = new ShyftSdk({
            apiKey: process.env.SHYFT_API_KEY,
            network: getShyftNetwork(network),
        });
    }
    return shyftInstance;
}

module.exports = {
    getShyftInstance,
    getShyftNetwork
};
