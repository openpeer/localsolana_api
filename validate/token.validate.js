const Joi = require('joi');

const validationSchemaForToken = Joi.object({
    id: Joi.number().required().messages({
      'any.required': 'Id is required'
    }),
    
  });
  module.exports = {
    validationSchemaForToken
  }