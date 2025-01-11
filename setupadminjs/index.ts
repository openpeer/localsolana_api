import models from "../models/index";
import resource from '../resources';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import path from 'path';
import express from 'express';
import AdminJS from 'adminjs';
import { componentLoader } from '../components';
import AdminJSExpress from '@adminjs/express';
import { Store } from 'express-session';

// Use require for AdminJS Sequelize since it doesn't have type declarations
const AdminJSSequelize = require('@adminjs/sequelize');

interface AuthenticatedUser {
  email: string;
  role: number;
  id: string;
  title: string;
}

// Integrate AdminJS
export async function setupAdminJS(app: express.Application, sessionStore: Store): Promise<void> {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10);

  AdminJS.registerAdapter({
    Resource: AdminJSSequelize.Resource,
    Database: AdminJSSequelize.Database,
  });

  const bankResource = await resource.bank_resource(models.banks, models.fiat_currencies, models.banks_fiat_currencies);
  const disputeResource = await resource.dispute_resource(models.Dispute, models.user_disputes, models.dispute_files, models.Order);

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
      disputeResource,
    ],
    rootPath: "/admin",
    branding: { companyName: "Local Solana Admin Panel" },
    componentLoader
  });

  adminJs.watch();

  // Store user role in session
  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
    adminJs,
    {
      authenticate: async (email: string, password: string): Promise<AuthenticatedUser | null> => {
        try {
          let userRole = 0;
          let authenticatedUser: AuthenticatedUser | null = null;
  
          // Check for super admin
          if (email === ADMIN_EMAIL && bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
            authenticatedUser = { 
              email, 
              role: 1,
              id: 'admin',
              title: 'Super Admin'
            };
          } else {
            // Find user in the admin_users table
            const adminUser = await models.adminUsers.findOne({ where: { email } });
            
            if (adminUser && bcrypt.compareSync(password, adminUser.encrypted_password)) {
              authenticatedUser = { 
                email: adminUser.email, 
                role: 0,
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
      cookiePassword: process.env.SESSION_KEY || 'default-session-key',
    },
    null,
    {
      store: sessionStore, // Use the same session store
      resave: false,
      saveUninitialized: false,
      secret: process.env.SESSION_KEY || 'default-session-key',
      cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        sameSite: 'strict'
      },
      name: 'adminjs'
    }
  );

  app.use(adminJs.options.rootPath, adminRouter);
} 