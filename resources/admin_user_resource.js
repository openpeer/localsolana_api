const { request } = require("express");

function admin_user_resource(admin_user) {
  return {
    resource: admin_user,
    options: {
      properties: {
        id: {
          position: 1,
          isVisible: {
            list: true,
            edit: false,
            filter: true,
            show: true,
            new: false,
          },
        },
        email: {
          position: 2,
          defaultValue: null,
          props:{autocomplete:"off"},
          isVisible: {
            list: true,
            edit: true,
            filter: true,
            show: true,
            new: true,
          },
        },
        password: {
          position: 3,
          type: 'password',
          default: null,  
          props: { autocomplete: "new-password" },
          isVisible: {
            list: false,
            edit: true,
            filter: false,
            show: false,
            new: true,
          },
        },
        role: {
          position: 4,
          isVisible: {
            list: true,
            edit: true,
            filter: true,
            show: true,
            new: false,
          },
        },
        createdAt: {
          position: 5,
          isVisible: {
            list: true,
            edit: false,
            filter: true,
            show: true,
            new: false,
          },
        },
        updatedAt: {
          position: 6,
          isVisible: {
            list: true,
            edit: false,
            filter: true,
            show: true,
            new: false,
          },
        },
        reset_password_token: {
          isVisible: false,
        },
        reset_password_sent_at: {
          isVisible: false,
        },
        remember_created_at: {
          isVisible: false,
        },
        encrypted_password: {
          isVisible: false,
        },
      },
      actions: {
        new: { isAccessible: true,
          before: async (request) => {
            if (request.payload.password) {
              // Hash the password manually before saving
              const bcrypt = require('bcryptjs');
              request.payload.encrypted_password = await bcrypt.hash(request.payload.password, 10);
              request.payload.password = undefined; // Remove plain password from payload
            }
            return request;
          },
         },
        edit: { isAccessible: true },
        bulkDelete: { isAccessible: true },
      },
      parent: { name: null },
    },
  };
}

module.exports = admin_user_resource;
