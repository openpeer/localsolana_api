function list_resource(lists) {
  return {
    resource: lists,
    options: {
      properties: {
        id: { position: 1 },
        seller_id: { position: 2 },
        updatedAt: { isVisible: { list: false, edit: false, filter: true } },
        createdAt: { isVisible: { list: false, edit: false, filter: true } },
      },
      parent: { name: null }, // Make "Banks" a top-level resource
      actions: {
        new: { isVisible: false }, // Hide the "Create new" action
      },
    },
  };
}

module.exports = list_resource;
