async function bank_resource(banks) {
  const Components = (await import("../components.mjs")).Components;

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
          position: 4,
          type: "mixed",
          isVisible: { list: false, edit: true, show: true },
          components: {
            show: Components.JsonViewer,
            list: Components.JsonViewer,
            edit: Components.JsonEditor,
          },
        },
        updatedAt: { isVisible: false },
        createdAt: { isVisible: false },
      },
      actions: {
        show: {
          after: async (response) => {
            const record = response.record;

            // Check if the field is flattened
            if (record && record.params) {
              const flatData = record.params;
              const reconstructedSchema = [];

              Object.keys(flatData).forEach((key) => {
                if (key.startsWith("account_info_schema.")) {
                  const [, index, field] = key.split(".");
                  reconstructedSchema[index] = reconstructedSchema[index] || {};
                  reconstructedSchema[index][field] = flatData[key];
                }
              });

              // Replace the flattened schema with the reconstructed array
              record.params.account_info_schema = reconstructedSchema;
            }

            return response;
          },
        },
        edit: {
          after: async (response) => {
            const record = response.record;

            if (record && record.params) {
              const flatData = record.params;
              const reconstructedSchema = [];

              Object.keys(flatData).forEach((key) => {
                if (key.startsWith("account_info_schema.")) {
                  const [, index, field] = key.split(".");
                  reconstructedSchema[index] = reconstructedSchema[index] || {};
                  reconstructedSchema[index][field] = flatData[key];
                }
              });

              record.params.account_info_schema = reconstructedSchema;
            }

            return response;
          },
        },
      },
      parent: { name: null }, // Make "Banks" a top-level resource
    },
  };
}

module.exports = bank_resource;
 