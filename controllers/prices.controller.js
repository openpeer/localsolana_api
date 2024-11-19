require("dotenv").config();
const axios = require("axios");
const {getCachedPrice} = require('../utils/cache');
const AutomaticPriceFetchCron = require("../crons/automatic_price_fetch_cron");
const priceCron = new AutomaticPriceFetchCron();
const {
    errorResponse,
    successResponse,
  } = require('../utils/rest');
  const Messages = require('../utils/messages');
  const httpCodes = require('../utils/httpCodes');
  

async function fetchApiData(url) {
    try {
      const response = await axios.get(url, {
        headers: {
          accept: "application/json",
          "x-cg-pro-api-key": process.env.COINGECKO_API_KEY,
        },
      });
      if (response.status === 200) {
        console.log('Actual API Response',response);
        return response.data;
      }else{
        return null;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

exports.fetchData = async (req, res) => {
    try {
        const {token, fiat} = req.query; 
        let cachedPrice = getCachedPrice(token,fiat);
        if(cachedPrice!=null){
            return successResponse(res, Messages.success, { [token]: { [fiat]: cachedPrice }});
        }
        await priceCron.fetchSingleTokenPrice(token,fiat);
         cachedPrice = getCachedPrice(token,fiat);
        if(cachedPrice!=null){
            return successResponse(res, Messages.success, { [token]: { [fiat]: cachedPrice }});
        }else{
              return errorResponse(res, httpCodes.badReq,"There is an error while fetching the prices");
          }
        // let response = await fetchApiData(`https://pro-api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${vs_currencies}`)
        // if(response != null){
        //   console.log('Coingecko response',response);
        //     let totalPrice = response;
        //     return successResponse(res, Messages.success, totalPrice);
        // }else{
        //     return errorResponse(res, httpCodes.badReq,"There is an error while fetching the prices");
        // }
        
    } catch (error) {
        console.log(error, "error");
        return errorResponse(res, httpCodes.serverError,Messages.systemError);
    }
}
