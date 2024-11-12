const models = require("../models/index");
const resource=require('../resources');
// Integrate AdminJS
async function setupAdminJS(app) {
  // Dynamically import AdminJS and related modules
  const AdminJS = (await import("adminjs")).default;
  const AdminJSExpress = (await import("@adminjs/express")).default;
  const AdminJSSequelize = (await import("@adminjs/sequelize")).default;

//   console.log(models.banks);

  AdminJS.registerAdapter({
    Resource: AdminJSSequelize.Resource,
    Database: AdminJSSequelize.Database,
  });

  const adminJs = new AdminJS({
    resources: [
        resource.dispute_resource(models.Dispute),
        resource.user_resource(models.user),
        resource.order_resource(models.Order),
        resource.bank_resource(models.banks),
        resource.fiat_currencies_resource(models.fiat_currencies),
        resource.list_resource(models.lists),
        resource.dispute_resource(models.tokens),
    ],
    rootPath: "/admin",
    branding: { companyName: "Local Solana Admin Panel" },
  });

  const adminRouter = AdminJSExpress.buildRouter(adminJs);
  app.use(adminJs.options.rootPath, adminRouter);
}

module.exports={setupAdminJS};


