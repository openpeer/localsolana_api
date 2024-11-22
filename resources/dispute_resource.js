const { Sequelize } = require("sequelize");
require("dotenv").config();

async function  dispute_resource(dispute, userDisputeModel, disputeFilesModel, orderModel){
  const Components = (await import("../components.mjs")).Components;


  // List of properties to be hidden
  const hiddenProperties = [
    "updated_at",
    "updatedAt",
    "createdAt",
    "winner_id",
  ];

  // Properties configuration with dynamic visibility handling
  const properties = {
    id: {
      position: 1,
    },
    order_id: {
      position: 2,
      isVisible: { list: true, show: true, edit: false, filter: true },
      components: {
        list: Components.OrderIdLink,
        show: Components.OrderIdLink,
      },      
    },
    resolved: {
      position: 3,
    },
    winner: {
      position: 4,
      isVisible: { list: true, show: true, edit: false, filter: true },
      components: {
        list: Components.UserIdLink,
        show: Components.UserIdLink,
      }, 
    },
    created_at: {
      position: 5,
    },
    seller_evidence:{
      position:6,
      isVisible:{
        list:false,
        filter:false,
        show:true,
        edit:false
      },
      components: {
        show: Components.Evidence,
      }, 
    },
    buyer_evidence:{
      position:7,
      isVisible:{
        list:false,
        filter:false,
        show:true,
        edit:false
      },
      components: {
        show: Components.Evidence,
      }, 
    },
    updated_at: {},
    updatedAt: {},
    createdAt: {},
    winner_id: {},
  };

  // Dynamically set `isVisible: false` for hidden properties
  hiddenProperties.forEach((property) => {
    if (properties[property]) {
      properties[property].isVisible = false;
    }
  });

  return {
    resource: dispute,
    options: {
      properties: properties,
      // Actions configuration
      actions: {
        list: {
          isAccessible: true,
          handler: async (request, response, context) => {
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

            const where = {};

            Object.keys(filters).forEach(filterKey=>{
              const value=filters[filterKey];

              if (filterKey.includes('~~')) {
                const [field, condition] = filterKey.split('~~'); // Split the filter into field and condition
                if (condition === 'from') {
                  where[field] = { ...where[field], [Sequelize.Op.gte]: new Date(value) }; // "greater than or equal to"
                } else if (condition === 'to') {
                  where[field] = { ...where[field], [Sequelize.Op.lte]: new Date(value) }; // "less than or equal to"
                }
              }else {
                where[filterKey]=(value==='true')?true:(value==='false')?false:value;
              }
            }); 

            try {
              const { rows, count: total } = await dispute.findAndCountAll({
                attributes: [
                  "id",
                  "order_id",
                  "resolved",
                  ["winner_id", "winner"],
                  "created_at",
                ],
                order: [["id", "DESC"]],
                limit,
                offset,
                where,
                raw: false, // Ensure we get Sequelize model instances
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
              console.error("Error in list handler:", error);
              throw error;
            }
          },
        },
        new: {
          isAccessible: false,
        },
        edit: {
          isAccessible: false
        },
        delete: {
          isAccessible: false,
        },
        bulkDelete: {
          isAccessible: false,
        },
        show: {
          isAccessible: true,

          handler:async(request, response, context)=>{
            const { record, resource } = context;
            try{

              const record1 = await dispute.findOne({
                attributes: [
                  "id",
                  "order_id",
                  "resolved",
                  ["winner_id", "winner"],
                  "created_at",
                ],
                where:{
                  id:record.get('id')
                },
                raw: false, // Ensure we get Sequelize model instances
              }); 

              const user_disputes=await userDisputeModel.findAll({
                where:{
                  dispute_id:record.get('id')
                },
                raw: false
              });

              const order_details = await orderModel.findOne({
                where:{
                  id:record.get('order_id')
                }
              });

              if(!order_details){
                throw new Error("order details not found.");
              }

              const seller_evidence = user_disputes
                                      .filter((data)=>data.dataValues.user_id===order_details.seller_id)
                                      .reduce((acc, data) => {
                                        acc = data.dataValues; // Add the filter to the accumulator
                                        return acc;
                                      }, {});

              const buyer_evidence =  user_disputes
                                      .filter((data)=>data.dataValues.user_id!==order_details.seller_id)
                                      .reduce((acc, data) => {
                                        acc = data.dataValues; // Add the filter to the accumulator
                                        return acc;
                                      }, {});


              if(seller_evidence?.id){
                const evidence_files = await disputeFilesModel.findAll({
                  where:{
                    user_dispute_id:seller_evidence?.id
                  },
                  raw: false
                });
                
                seller_evidence["files"]=evidence_files.map((data)=>{
                  return `${process.env.DISPUTE_IMAGES_BASE_URL}/${record.get('order_id')}/${data.dataValues.filename}`;
                });
              }

              if(buyer_evidence?.id){
                const evidence_files = await disputeFilesModel.findAll({
                  where:{
                    user_dispute_id:buyer_evidence?.id
                  },
                  raw: false
                });

                buyer_evidence["files"]=evidence_files.map((data)=>{
                  return `${process.env.DISPUTE_IMAGES_BASE_URL}/${record.get('order_id')}/${data.dataValues.filename}`;
                });
              }

              Object.keys(record1.dataValues).forEach((key)=>{
                record.params[key]=record1.dataValues[key];
              });

              record.params[`seller_evidence`]=seller_evidence;
              record.params[`buyer_evidence`]=buyer_evidence;

              // Explicitly return a record
              return {
                record: {...record.toJSON()},
                message: 'Record retrieved successfully'
              };
            }
            catch(error){
              console.error("Error in show handler:", error);
              throw new error;
            }
          }

        },
      },

      // Explicitly set null parent to avoid navigation issues
      parent: { name: null },
    },
  };
};

module.exports = dispute_resource;
