function user_resource(user) {
  return {
    resource: user,
    options: {
      properties: {
        id: { position: 1 },
        address: { position: 2 },
        name: { position: 3 },
        email: { position: 4 },
        twitter: { position: 5 },
        timezone: { position: 6 },
        password: { isVisible: false },
        createdAt: { isVisible: false },
        updatedAt: { isVisible: false },
      },
      parent: { name: null },
    },
  };

  // return {
  //   resource: user,
  //   options: {
  //     properties: {
  //       id: { position: 1 },
  //       address: { position: 2 },
  //       name: { position: 3 },
  //       email: { position: 4 },
  //       twitter: { position: 5 },
  //       timezone: { position: 6 },
  //       password: { isVisible: false },
  //       createdAt: { isVisible: false },
  //       updatedAt: { isVisible: false },
  //     },
  //     actions: {
  //       new: { isAccessible: false },
  //       edit: { isAccessible: false },
  //       delete: { isAccessible: false },
  //       bulkDelete: { isAccessible: false },
  //       list: { 
  //         isAccessible: ({ currentAdmin }) => {
  //           console.log('List access check - currentAdmin:', currentAdmin);
  //           return currentAdmin && currentAdmin.role === 1;
  //         },
  //         before: async (request, context) => {
  //           console.log('List before hook - context:', context.currentAdmin);
  //           return request;
  //         },
  //         after: async (response, context) => {
  //           console.log('List after hook - context:', context.currentAdmin);
  //           return response;
  //         }
  //       },
  //       show: { 
  //         isAccessible: ({ currentAdmin }) => {
  //           console.log('Show access check - currentAdmin:', currentAdmin);
  //           return currentAdmin && currentAdmin.role === 1;
  //         }
  //       },
  //     },
  //     parent: { name: null },
  //   }
  // };
}

module.exports = user_resource;
