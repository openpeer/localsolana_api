//function that will sign the transactions received as Base64 encoded and received via POST request
require("dotenv").config();
const models = require("../models/index");
const { getShyftInstance, getShyftNetwork } = require("../utils/shyft");
const { errorResponse, successResponse } = require("../utils/rest");
const idl = require("../idl/local_solana_migrate.json");
const httpCodes = require("../utils/httpCodes");
const Messages = require("../utils/messages");
const { logEscrowOperation, logEscrowError } = require("../utils/logger");
const { PublicKey, Message, Transaction } = require("@solana/web3.js");
const bs58 = require("bs58");
const { ProgramService } = require('../services/ProgramService');

async function validateAndLogRawTransaction(transaction) {
  try {
    // Log the raw transaction string
    logEscrowOperation("transaction:rawValidation", {
      length: transaction.length,
      first20Chars: transaction.substring(0, 20),
      last20Chars: transaction.substring(transaction.length - 20),
      isBase64: /^[A-Za-z0-9+/]*={0,2}$/.test(transaction)
    });

    // Try base64 decode
    const buffer = Buffer.from(transaction, 'base64');
    
    // Enhanced buffer logging
    logEscrowOperation("transaction:base64Decode", {
      bufferLength: buffer.length,
      firstBytes: Array.from(buffer.slice(0, 16)),  // Increased from 4 to 16
      lastBytes: Array.from(buffer.slice(-16)),     // Increased from 4 to 16
      hexDump: buffer.toString('hex').substring(0, 100), // First 50 bytes as hex
      utf8Sample: buffer.toString('utf8').substring(0, 100) // Try to see if there's any readable data
    });

    return buffer;
  } catch (e) {
    logEscrowError("transaction:validationError", e, {
      rawLength: transaction?.length,
      sample: transaction?.substring(0, 100),  // Increased from 50 to 100
      isBase64: /^[A-Za-z0-9+/]*={0,2}$/.test(transaction)
    });
    throw e;
  }
}

async function decodeTransaction(encodedTransaction) {
  try {
    const buffer = await validateAndLogRawTransaction(encodedTransaction);
    
    // Try to decode as Transaction first
    try {
      const tx = Transaction.from(buffer);
      logEscrowOperation("transaction:transactionDecode", {
        recentBlockhash: tx.recentBlockhash,
        feePayer: tx.feePayer?.toBase58(),
        numSignatures: tx.signatures.length,
        signatures: tx.signatures.map(s => ({
          publicKey: s.publicKey?.toBase58(),
          signature: s.signature ? Buffer.from(s.signature).toString('base64') : null
        }))
      });
    } catch (txError) {
      logEscrowError("transaction:transactionDecodeError", txError, {
        bufferLength: buffer.length,
        bufferHex: buffer.toString('hex').substring(0, 100)
      });
    }

    // Log raw buffer before Message decode
    logEscrowOperation("transaction:preMessageDecode", {
      bufferLength: buffer.length,
      header: Array.from(buffer.slice(0, 32)),  // Log first 32 bytes
      messageFormat: buffer[0], // Should be 1 or 2 for legacy/v0
      numSignatures: buffer[1]  // Second byte should match required signatures
    });

    // Decode as Message
    const message = Message.from(buffer);
    
    // Log raw message data
    logEscrowOperation("transaction:messageRaw", {
      rawMessage: {
        header: {
          numRequiredSignatures: message.header.numRequiredSignatures,
          numReadonlySignedAccounts: message.header.numReadonlySignedAccounts,
          numReadonlyUnsignedAccounts: message.header.numReadonlyUnsignedAccounts
        },
        accountKeyCount: message.accountKeys.length,
        recentBlockhash: message.recentBlockhash,
        instructionCount: message.instructions.length,
        accountKeyStrings: message.accountKeys.map(key => key.toBase58())
    }});
    
    // Log detailed message header
    logEscrowOperation("transaction:messageHeader", {
      numRequiredSignatures: message.header.numRequiredSignatures,
      numReadonlySignedAccounts: message.header.numReadonlySignedAccounts,
      numReadonlyUnsignedAccounts: message.header.numReadonlyUnsignedAccounts
    });

    // Map and log account keys with roles
    const accountKeys = message.accountKeys.map((key, index) => {
      const isWritable = index < (message.header.numRequiredSignatures - message.header.numReadonlySignedAccounts) ||
        (index >= message.header.numRequiredSignatures && 
         index < (message.accountKeys.length - message.header.numReadonlyUnsignedAccounts));
      const isSigner = index < message.header.numRequiredSignatures;
      
      return {
        pubkey: key.toBase58(),
        index,
        isSigner,
        isWritable
      };
    });

    // Log account roles separately for clarity
    logEscrowOperation("transaction:accountRoles", {
      accounts: accountKeys,
      summary: {
        totalAccounts: accountKeys.length,
        signers: accountKeys.filter(a => a.isSigner).length,
        writableAccounts: accountKeys.filter(a => a.isWritable).length
      }
    });

    // Decode and log each instruction in detail
    const decodedInstructions = message.instructions.map((ix, index) => {
      const programId = message.accountKeys[ix.programIdIndex].toBase58();
      const accounts = ix.accounts.map(acc => ({
        index: acc,
        pubkey: message.accountKeys[acc].toBase58()
      }));
      
      let decodedData;
      try {
        // Log raw instruction data first
        const rawData = Array.from(ix.data);
        logEscrowOperation("transaction:instructionRawData", {
          index,
          programId,
          dataLength: rawData.length,
          firstBytes: rawData.slice(0, 16),
          asBase58: bs58.encode(ix.data)
        });

        decodedData = bs58.encode(ix.data);
        // Try to match with IDL instructions
        const discriminator = Array.from(ix.data.slice(0, 8));
        const matchingInstruction = Object.values(idl.instructions).find(
          inst => inst.discriminator.every((b, i) => b === discriminator[i])
        );
        
        if (matchingInstruction) {
          logEscrowOperation("transaction:instructionMatch", {
            index,
            name: matchingInstruction.name,
            discriminator: discriminator,
            accounts: matchingInstruction.accounts.map((acc, i) => ({
              name: acc.name,
              providedPubkey: accounts[i]?.pubkey,
              isWritable: acc.writable,
              isSigner: accounts[i]?.isSigner
            }))
          });
        } else {
          logEscrowOperation("transaction:noInstructionMatch", {
            index,
            discriminator,
            availableInstructions: Object.keys(idl.instructions)
          });
        }
      } catch (e) {
        logEscrowError("transaction:instructionDecodeError", e, {
          index,
          programId,
          rawData: Array.from(ix.data)
        });
        decodedData = {error: e.message, raw: Array.from(ix.data)};
      }

      return {
        index,
        programId,
        accounts,
        data: decodedData
      };
    });

    logEscrowOperation("transaction:instructions", {
      count: decodedInstructions.length,
      instructions: decodedInstructions,
      summary: {
        programIds: [...new Set(decodedInstructions.map(ix => ix.programId))],
        accountsUsed: [...new Set(decodedInstructions.flatMap(ix => ix.accounts.map(a => a.pubkey)))]
      }
    });

    return {
      numReadonlySignedAccounts: message.header.numReadonlySignedAccounts,
      numReadonlyUnsignedAccounts: message.header.numReadonlyUnsignedAccounts,
      numRequiredSignatures: message.header.numRequiredSignatures,
      accountKeys,
      instructions: decodedInstructions
    };
  } catch (e) {
    logEscrowError("transaction:decodeError", e, {
      raw: encodedTransaction
    });
    return {
      error: e.message,
      raw: encodedTransaction
    };
  }
}

async function getAccountInfo(connection, pubkey) {
  try {
    const accountInfo = await connection.getAccountInfo(new PublicKey(pubkey));
    
    // Enhanced account info logging
    const info = {
      exists: !!accountInfo,
      owner: accountInfo?.owner?.toBase58(),
      executable: accountInfo?.executable,
      lamports: accountInfo?.lamports,
      dataLength: accountInfo?.data?.length,
      rentEpoch: accountInfo?.rentEpoch
    };

    // Try to identify account type
    if (accountInfo?.owner?.toBase58() === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
      info.type = 'Token Account';
    } else if (pubkey === '11111111111111111111111111111111') {
      info.type = 'System Program';
    }

    // For PDA verification
    try {
      const [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('escrow')],
        new PublicKey(process.env.PROGRAM_ID)
      );
      if (pubkey === escrowPda.toBase58()) {
        info.type = 'Escrow PDA';
      }
    } catch (e) {
      // PDA check failed, not critical
    }

    return info;
  } catch (e) {
    logEscrowError("account:infoError", e, {
      pubkey
    });
    return {
      error: e.message,
      pubkey
    };
  }
}

exports.processTransaction = async (req, res) => {
  const { transaction, order_id } = req.body;
  
  logEscrowOperation("processTransaction:start", {
    order_id,
    user_id: req.user?.dataValues?.id,
    has_transaction: !!transaction
  });

  if (!transaction) {
    logEscrowError("processTransaction:validation", new Error("Missing transaction data"), {
      order_id,
      user_id: req.user?.dataValues?.id
    });
    return errorResponse(res, httpCodes.badReq, Messages.missingData);
  }

  try {
    // Validate raw transaction first
    await validateAndLogRawTransaction(transaction);

    // Get all required data
    const order = await models.Order.findByPk(order_id);
    if (!order) {
      throw new Error('Order not found');
    }

    const list = await models.lists.findByPk(order.dataValues.list_id);
    const seller = await models.user.findByPk(order.dataValues.seller_id);
    const buyer = await models.user.findByPk(order.dataValues.buyer_id);
    const token = await models.tokens.findByPk(list.dataValues.token_id);

    logEscrowOperation("processTransaction:orderDetails", {
      order_status: order.dataValues.status,
      seller_id: order.dataValues.seller_id,
      buyer_id: order.dataValues.buyer_id,
      seller_address: seller?.dataValues?.address,
      buyer_address: buyer?.dataValues?.address,
      token_amount: order.dataValues.token_amount,
      token_address: token?.dataValues?.address,
      token_symbol: token?.dataValues?.symbol
    });

    // Authorization check
    if (
      order.dataValues.seller_id !== req.user.dataValues.id &&
      order.dataValues.buyer_id !== req.user.dataValues.id &&
      req.user.dataValues.id !== process.env.ARBITRATOR_ADDRESS
    ) {
      throw new Error("Not authorized");
    }

    // Build and validate expected transaction
    const programService = ProgramService.getInstance();
    const expectedTx = await programService.buildReleaseFundsTransaction({
      orderId: order_id,
      seller: new PublicKey(seller.dataValues.address),
      buyer: new PublicKey(buyer.dataValues.address),
      token: new PublicKey(token.dataValues.address),
      order
    });

    // Decode and log actual transaction
    const decodedTx = await decodeTransaction(transaction);
    logEscrowOperation("processTransaction:decodedTransaction", {
      order_id,
      decoded: decodedTx
    });

    // Process via Shyft
    const signature = await getShyftInstance().txnRelayer.sign({
      encodedTransaction: transaction,
      network: getShyftNetwork(process.env.SOLANA_NETWORK),
    });

    if (signature) {
      logEscrowOperation("processTransaction:confirming", {
        order_id,
        signature
      });

      await getShyftInstance().connection.confirmTransaction(
        signature,
        "confirmed"
      );

      // Save transaction
      const txRecord = await models.transactions.create({
        order_id: order_id,
        tx_hash: signature
      });

      logEscrowOperation("processTransaction:success", {
        order_id,
        signature,
        transaction_id: txRecord.id
      });

      return successResponse(res, Messages.success, signature);
    }

    throw new Error("Failed to get signature");

  } catch (error) {
    const errorContext = {
      order_id,
      user_id: req.user?.dataValues?.id,
      transaction_decode: await decodeTransaction(transaction)
    };

    logEscrowError("processTransaction:error", error, errorContext);

    // Handle program errors
    if (error.message?.startsWith("{") && error.message?.endsWith("}")) {
      try {
        const parsedError = JSON.parse(error.message);
        if (parsedError.InstructionError?.[1]?.Custom !== undefined) {
          const errorCode = parsedError.InstructionError[1].Custom;
          const programError = idl.errors.find(e => e.code === errorCode);
          return errorResponse(res, httpCodes.serverError, programError?.msg || "Unknown program error");
        }
      } catch (parseError) {
        logEscrowError("processTransaction:parseError", parseError, errorContext);
      }
    }

    return errorResponse(res, httpCodes.serverError, error.message || Messages.systemError);
  }
};
