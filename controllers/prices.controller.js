const request = require('request');
const { promisify } = require('util');
const requestPromise = promisify(request);
const {
    errorResponse,
    successResponse,
  } = require('../utils/rest');
  const Messages = require('../utils/messages');
  const httpCodes = require('../utils/httpCodes');
  

async function fetchApiData(url) {
    try {
      const response = await requestPromise({
        url: url,
        headers: {
          'x-cg-pro-api-key': 'CG-gXS1ybJ6xXUbGWdpgBH4Yp4C' 
        },
        json: true // Automatically parses the JSON response
      });
    //   console.log("response", response);
      return response?.body;
      console.log('Data:', response.body); // Access response body
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

exports.fetchData = async (req, res) => {
    try {
        const {ids, vs_currencies, quantity} = req.query; 
        let response = await fetchApiData(`https://pro-api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${vs_currencies}`)
        if(response !== null){
            let totalPrice = response;
            return successResponse(res, Messages.success, totalPrice);
        }else{
            return errorResponse(res, httpCodes.badReq,"There is an error while fetching the prices");
        }
        
    } catch (error) {
        console.log(error, "error");
        return errorResponse(res, httpCodes.serverError,Messages.systemError);
    }
}
