//function that will sign the transactions received as Base64 encoded and received via POST request
require("dotenv").config();
const models = require("../models/index");
const { getShyftInstance, getShyftNetwork } = require("../utils/shyft");
const { errorResponse, successResponse } = require("../utils/rest");
const idl = require("../idl/local_solana_migrate.json");
const httpCodes = require("../utils/httpCodes");
const Messages = require("../utils/messages");
exports.processTransaction = async (req, res) => {
  const { transaction, order_id } = req.body;
  console.log("Transaction for signing", transaction, order_id);
  let order;
  if (!transaction) {
    return errorResponse(res, httpCodes.badReq, Messages.missingData);
  }

  if (order_id !== undefined) {
    //check if order_id is not there then order not need to be checked as transaction is for other use
    //check whether the order exists
    order = await models.Order.findByPk(order_id);
    if (!order) {
        return errorResponse(res, httpCodes.badReq, Messages.orderNotFound);
    }
    console.log('User is ', req.user.dataValues.id);
    //check whether user is authorized to access the order. user should be either seller or buyer or if order is disputed then you need to be arbitrator
    if (
      order.dataValues.seller_id !== req.user.dataValues.id &&
      order.dataValues.buyer_id !== req.user.dataValues.id &&
      req.user.dataValues.id !== process.env.ARBITRATOR_ADDRESS
    ) {
        return errorResponse(res, httpCodes.badReq, Messages.notAuthorized);
    }
  }
  try {
    const signature = await getShyftInstance().txnRelayer.sign({
      encodedTransaction: transaction,
      network: getShyftNetwork(process.env.SOLANA_NETWORK),
    });

    if (signature) {
      const txSignature = signature;
      await getShyftInstance().connection.confirmTransaction(
        txSignature,
        "confirmed"
      );

      if (order_id !== undefined) {
        const payload = {
           order_id: order_id, 
            tx_hash: txSignature
          }
        // add the signedTx to the transactions table corresponding to the order id.
        const affectedRows =await models.transactions.create(payload);
        console.log('Transaction added',affectedRows);

      }

      return successResponse(res, Messages.success, txSignature);
    } else {
      return errorResponse(res, httpCodes.serverError, Messages.systemError);
    }
  } catch (error) {
    console.error("Error here is ", error);
    const errorMessage = error.message || error.toString();
    console.error("ErrorMessage here is ", errorMessage);
    if (errorMessage.startsWith("{") && errorMessage.endsWith("}")) {
      const parsedError = JSON.parse(errorMessage);
      if (
        parsedError.InstructionError &&
        Array.isArray(parsedError.InstructionError)
      ) {
        const [index, instructionError] = parsedError.InstructionError;
        if (instructionError.Custom !== undefined) {
          console.log(
            "This is an InstructionError with a custom error code:",
            instructionError.Custom
          );
          let message = idl.errors[instructionError.Custom];
          return errorResponse(res, httpCodes.serverError, message);
        }
      }
    } else {
        console.log("Returning normal message");
      return errorResponse(res, httpCodes.serverError, errorMessage);
    }
  }
};
