const  models   = require("../models/index");
const {
  errorResponse,
  successResponse,
} = require('../utils/rest');
const Messages = require('../utils/messages');
const httpCodes = require('../utils/httpCodes');
require('dotenv').config();
const jwt = require('jsonwebtoken');
// const JWT_SECRET="D8A1D6A9AC52BBEB78B7F65AAF0998E39219654D38B5AF425CD2F3A15020437F";
// method for login and implemting jwt login
exports.login = async function(req, res){
    const { address, email, password } = req.body;
    try {
        console.log("email", email);
        const user = await models.user.findOne({ where: { email } });
        console.log("user", user);
        if (!user) {
            return errorResponse(res, httpCodes.badReq,Messages.usernotFound);  
        }
        // const isPasswordValid = await bcrypt.compare(password, user.password);
        // if (!isPasswordValid) {
        //     return errorResponse(res,httpCodes.badReq, Messages.invalidCredentials);
        // }

        const token = jwt.sign({ email: user.email, address: user.address }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log("token", token);
      return successResponse(res, Messages.success, token);
    } catch (error) {
        return errorResponse(res, httpCodes.serverError,Messages.systemError);
    }
}
