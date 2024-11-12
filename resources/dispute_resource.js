function dispute_resource(dispute){
    return {
        resource: dispute,
        options: {
          properties: {
            name: {
              isVisible: false,
            },
          },
          parent: { name: null }, // Make "Banks" a top-level resource
        },
      };
};

module.exports=dispute_resource;