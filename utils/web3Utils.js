const { PublicKey } = require("@solana/web3.js");

exports.getTradeId = function (orderID) {
  const [escrowPda_, escrowStateBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), Buffer.from(String(orderID))],
    new PublicKey("1w3ekpHrruiEJPYKpQH6rQssTRNKCKiqUjfQeJXTTrX")
  );
  return escrowPda_;
};
