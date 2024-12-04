// controllers/lists/shared/validation.js
const { errorResponse } = require('../../../utils/rest');
const httpCodes = require('../../../utils/httpCodes');

exports.validateListPrice = (margin_type, price, margin) => {
  if (margin_type === 1) { // Floating rate
    if (price !== null) {
      return { 
        isValid: false, 
        error: "Price must be null for floating rate listings" 
      };
    }
    if (!margin) {
      return { 
        isValid: false, 
        error: "Margin is required for floating rate listings" 
      };
    }
  } else { // Fixed rate
    if (!price) {
      return { 
        isValid: false, 
        error: "Price is required for fixed rate listings" 
      };
    }
    if (margin !== null) {
      return { 
        isValid: false, 
        error: "Margin must be null for fixed rate listings" 
      };
    }
  }
  return { isValid: true };
};