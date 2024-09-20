/* -----------------------------------------------------------------------
   * @ description : Here defines all rest functions.
----------------------------------------------------------------------- */
const successData = (message = "Success", data) => {
  return {
    status: 200,
    code: 200,
    message,
    data: data ? data : undefined,
    env: process.env.NODE_ENV
  };
};


const errorData = (status = 500, message = 'Error', data = [], errors = {}) => {
  return {
    status: status,
    code: status,
    message,
    data: data ? data : [],
    errors: errors ? errors : [],
    env: process.env.NODE_ENV
  };
};

const errorCodeData = (status = 500, code = 500, message = 'Error', data = [], errors = {}) => {
  return {
    status: status,
    code: code,
    message,
    data: data ? data : [],
    errors: errors ? errors : [],
    env: process.env.NODE_ENV
  };
};

exports.errorCodeResponse = (res, status = 500, code = 500, message = 'Error', data = [], errors = {}) => {
  return res.status(status).send(errorCodeData(status, code, message, data, errors));
}
exports.errorResponse = (res, status = 500, message = 'Error', data = [], errors = {}) => {
  return res.status(status).send(errorData(status, message, data, errors));
}

exports.successResponse = (res, message = 'Success', data) => {
  return res.json(successData(message, data));
  //return res.json(data);
  //return res.status(status).send(errorData(status, error.message));
}