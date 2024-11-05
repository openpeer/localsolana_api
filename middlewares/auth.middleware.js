const jwt = require('jsonwebtoken');
const models = require('../models/index');
const Messages = require('../utils/messages');
const httpCodes = require('../utils/httpCodes');
require('dotenv').config();
const crypto = require('crypto');


const authenticateToken = async (req, res, next) => {
    try {

        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (token == null) return res.sendStatus(401);
            try {
                // Verify and decode the token
                const decodedToken = jwt.decode(token);
                  // Extract address and expiration from the token
    const { verified_credentials, exp } = decodedToken;

    if (!verified_credentials || verified_credentials.length === 0) {
      return res.status(401).json({ message: 'Invalid token structure' });
    }

    const address = verified_credentials[0].address;

    // Check if the token has expired
    if (Date.now() / 1000 > exp) {
      return res.status(401).json({ message: 'Token has expired' });
    }

                // Check if the address (or user identifier) exists in the database
                const user = await models.user.findOne({ where: { address: address } });
            
                if (!user) {
                  return res.status(403).send('User not found or invalid address'); // Forbidden
                }
            
                req.user = user; // Attach user info to request
                console.log(req.user, "-----user");
                next(); // Pass control to the next middleware or route handler
            } catch (error) {
                console.error('Error decoding JWT:', error);
                return res.sendStatus(403); // If token is invalid, return Forbidden
              }
    } catch (err) {
        console.log(err)
        return err; 
    }
};

const authenticateSocket = async (socket, next) => {
  try {
      console.log('---- in authenticate toekn');
      const token = socket.handshake.query.token;
      if (!token) {
          return next(new Error('Authentication error'));
      }

       // Verify and decode the token
       const decodedToken = jwt.decode(token);
       // Extract address and expiration from the token
    const { verified_credentials, exp } = decodedToken;

    if (!verified_credentials || verified_credentials.length === 0) {
    return res.status(401).json({ message: 'Invalid token structure' });
    }

    const address = verified_credentials[0].address;

    // Check if the token has expired
    if (Date.now() / 1000 > exp) {
    return res.status(401).json({ message: 'Token has expired' });
    }

        // Check if the address (or user identifier) exists in the database
        const user = await models.user.findOne({ where: { address: address } });
    
        if (!user) {
          return res.status(403).send('User not found or invalid address'); // Forbidden
        }
    
        socket.user = user; // Attach user info to request
        console.log(socket.user, "-----user");
        next();
      } catch (err) {
          console.error('Error in authenticateSocket middleware:', err);
          next(new Error('Internal server error'));
      }
};

module.exports = {authenticateToken,authenticateSocket};
