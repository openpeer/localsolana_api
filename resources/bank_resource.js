async function bank_resource(banks,fiat_currencies, banks_fiat_currencies) {
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
        fiatCurrencies:{
          position:5,
          components:{
            show: Components.FiatCurrencyIdLink,
            edit: Components.ChooseFiatCurrency
          }
        },
        image:{
          isVisible:{list: false, edit: true, show: true, filter:false}
        },
        updatedAt: { isVisible: false },
        createdAt: { isVisible: false },
      },
      actions: {
        list:{
          isAccessible:true,
          handler:async(request, response, context)=>{
            const { resource } = context;
            // Get page and limit parameters from the request, with defaults
            const page = parseInt(request.query.page || "1", 10);
            const limit = parseInt(request.query.perPage || "10", 10);
            const offset = (page - 1) * limit;

            const filters = Object.keys(request.query)
                              .filter(key => key.startsWith('filters.'))
                              .reduce((acc, key) => {
                                const filterKey = key.replace('filters.', ''); // Remove 'filters.' prefix
                                acc[filterKey] = request.query[key]; // Add the filter to the accumulator
                                return acc;
                              }, {});

            const where1 = {}, where2={};

            Object.keys(filters).forEach(filterKey=>{
              const value=filters[filterKey];
              if(filterKey==="fiatCurrencies") where2['code']=value;
              else where1[filterKey]=(value==='true')?true:(value==='false')?false:value;
            }); 
  
            try {
              const { rows, count: total } = await banks.findAndCountAll({
                include: [{ model: fiat_currencies, as: 'fiatCurrencies', attributes: ['code'], where:where2 }],
                order: [["id", "DESC"]],
                limit,
                offset,
                where:where1,
                raw: false,
                distinct: true,
              });

              rows.forEach((value)=>{
                const res=value.dataValues.fiatCurrencies;
                value.dataValues.fiatCurrencies = res.map(currency => currency.dataValues.code).join(', ');                
              });

              return {
                records: rows.map((record) =>
                  resource.build(record.toJSON())
                ),
                meta: {
                  total,        // Total count of records
                  perPage: limit,  // Number of records per page
                  page,           // Current page number
                },
              };
            } catch (error) {
              console.log("Error :", error);
            }
          },
        },
        show: {
          after: async (response) => {
            const record = response.record;

            const getData = await banks.findOne({
              include: [{ model: fiat_currencies, as: 'fiatCurrencies', attributes: ['id','name',] }],
              where:{
                id:record.params.id
              }
            });
            
            record.params['fiatCurrencies']=getData.dataValues.fiatCurrencies;

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
          before: async (request) => {

            if(request.payload?.id){
              Object.keys(request.payload).forEach((key) => {
                if (key.startsWith('getAllFiatCurrencies.')) delete request.payload[key];
              });
    
              const newlySelectedCurrencies = Object.keys(request.payload)
                                              .filter((data)=> data.startsWith('fiatCurrencies.'))
                                              .reduce((acc, key) => {
                                                acc.push(request.payload[key]); // Add the fiatCurrencies to the accumulator
                                                return acc;
                                              }, []);
  
                
              await banks_fiat_currencies.destroy({
                where:{
                  bank_id:request.payload.id
                }
              });

              const dataToInsert = newlySelectedCurrencies.map(currencyId => ({
                bank_id: request.payload.id,
                fiat_currency_id: currencyId
              }));

              await banks_fiat_currencies.bulkCreate(dataToInsert);

            }

            return request;
          },
          after: async (response) => {
            const record = response.record;

            const getData = await banks.findOne({
              include: [{ model: fiat_currencies, as: 'fiatCurrencies', attributes: ['id','name',] }],
              where:{
                id:record.params.id
              }
            });

            const getAllFiatCurrencies = await fiat_currencies.findAll({
              attributes:['id','name']
            });
            
            record.params['fiatCurrencies']=getData?.dataValues.fiatCurrencies.map((value)=>value.id);
            record.params['getAllFiatCurrencies']=getAllFiatCurrencies?.map((value)=>value.dataValues);

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
 