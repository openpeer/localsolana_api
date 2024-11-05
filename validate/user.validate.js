const Joi = require('joi');

const validationUserSchema = Joi.object({
    address: Joi.string().required().messages({
      'any.required': 'Address is required'
    }),
    
  });
  module.exports = {
    validationUserSchema
  }