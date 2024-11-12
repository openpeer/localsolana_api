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
}

module.exports = user_resource;
