require('dotenv').config();
const {Knock} = require('@knocklabs/node');

// Initialize the Knock client with your Knock API Key
const knock = new Knock(process.env.KNOCK_API_KEY);
console.log("Knock instance:", knock);
console.log("Knock workflows:", knock.workflows);
module.exports = knock;
