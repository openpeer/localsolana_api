const models = require("../models/index");
const resource = require('../resources');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');

// Integrate AdminJS
async function setupAdminJS(app) {
  const AdminJS = (await import("adminjs")).default;
  const componentLoader = (await import('../components.mjs')).componentLoader;
  const AdminJSExpress = (await import("@adminjs/express")).default;
  const AdminJSSequelize = (await import("@adminjs/sequelize")).default;

  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
  const ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'securepassword', 10);

  AdminJS.registerAdapter({
    Resource: AdminJSSequelize.Resource,
    Database: AdminJSSequelize.Database,
  });
  const bankResource = await resource.bank_resource(models.banks);
  // Session setup
  app.use(
    session({
      secret: process.env.SESSION_KEY,
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false }
    })
  );

  // Initialize AdminJS with no resources
  const adminJs = new AdminJS({
    resources: [
      resource.admin_user_resource(models.adminUsers),
      resource.user_resource(models.user),
      bankResource,
      resource.fiat_currencies_resource(models.fiat_currencies),
      resource.token_resource(models.tokens),
      resource.list_resource(models.lists),
      resource.order_resource(models.Order),
      resource.dispute_resource(models.Dispute),
    ],
    rootPath: "/admin",
    branding: { companyName: "Local Solana Admin Panel" },
    componentLoader:componentLoader
  });
  adminJs.watch();
  // Store user role in session
  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
    adminJs,
    {
      authenticate: async (email, password) => {
        try {
          let userRole = 0;
          let authenticatedUser = null;
  
          // Check for super admin
          if (email === ADMIN_EMAIL && bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
            userRole = 1;
            authenticatedUser = { 
              email, 
              role: userRole,
              // Add any other properties you want to access in currentAdmin
              id: 'admin',
              title: 'Super Admin'
            };
          } else {
            // Find user in the admin_users table
            const adminUser = await models.adminUsers.findOne({ where: { email } });
            
            if (adminUser && bcrypt.compareSync(password, adminUser.encrypted_password)) {
              userRole = 0;
              authenticatedUser = { 
                email: adminUser.email, 
                role: userRole,
                id: adminUser.id,
                title: 'Regular Admin'
              };
            }
          }
  
          console.log('Authenticated user:', authenticatedUser); // Debug log
          return authenticatedUser;
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
      cookieName: 'adminjs',
      cookiePassword: process.env.SESSION_KEY,
    },
    null,
    {
      resave: false,
      saveUninitialized: false,
      secret: process.env.SESSION_KEY,
      cookie: {
        httpOnly: true,
        secure: false,
      },
      name: 'adminjs'
    }
  );

  app.use(adminJs.options.rootPath, adminRouter);
}

module.exports = { setupAdminJS };