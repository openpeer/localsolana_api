function token_resource(token){
    return {
        resource: token,
        options: {
          properties: {
            id: { position: 1 },
            chain_id: { isVisible: false },
            updatedAt: { isVisible: { list: false, edit: false, filter: true } },
            createdAt: { isVisible: { list: false, edit: false, filter: true } },
          },
          parent: { name: null }, // Make "Banks" a top-level resource
          actions: {
            new: { isVisible: false },
          },
        },
      };
};

module.exports = token_resource;