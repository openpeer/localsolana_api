require('dotenv').config();

const port = process.env.PORT || 8081;
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const setupSocketHandlers = require('./routes/socket.route');
const http = require('http'); // Required for creating an HTTP server
const https = require('https'); // Required for creating an HTTPS server

const app = express(); // Create an express app
let server;
let url;
if (process.env.PROD === 'true') {
    // Production setup with HTTPS
    const certDir = `/etc/letsencrypt/live`; // Directory for SSL certificates
    const domain = process.env.HOST; // Domain name for the certificate
    const httpsOptions = {
        key: fs.readFileSync(`${certDir}/${domain}/privkey.pem`), // Read private key
        cert: fs.readFileSync(`${certDir}/${domain}/fullchain.pem`) // Read certificate
    };
    server = https.createServer(httpsOptions, app); // Create an HTTPS server
} else {
    // Development setup with HTTP
    server = http.createServer(app); // Create an HTTP server
}

// Set up Socket.IO
const { Server } = require('socket.io');
const io = new Server(server);
setupSocketHandlers(io);
// Middleware for API routes and authentication
const apiRoutes = require('./api/routes/routes');
const authMiddleware = require('./middlewares/auth.middleware');

// Middleware
app.use(express.json()); // Parse application/json
// app.use(express.urlencoded({ extended: true })); // Parse application/x-www-form-urlencoded
// app.use(cookieParser(process.env.CookieID));
app.set('view engine', 'pug');

// Define the home route
app.get('/', (req, res) => {
    res.render('index', {
        name: 'Ductn'
    });
});

// Use API routes
const createRouter = require('./api/routes/routes');
app.use('/api', createRouter(io));
// Start the server
server.listen(port, () => {
    console.log('Server is running on port ' + port);
});
