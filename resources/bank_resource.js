function bank_resource(banks) {
  return {
    resource: banks,
    options: {
      properties: {
        id: { position: 1 },
        name: {
          position: 2,
          isVisible: { list: true, edit: true, show: true, filter: true },
        },
        color: { position: 3 },
        account_info_schema: {
          isVisible: { list: true, edit: true, show: true },
        },
        updatedAt: { isVisible: false },
        createdAt: { isVisible: false },
      },
      parent: { name: null }, // Make "Banks" a top-level resource
    },
  };
}

module.exports = bank_resource;
