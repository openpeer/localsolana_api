const priceSourceFunction = (value) => {
    if(value == 1){
        return "binance_min";
    }else if(value == 2){
        return "binance_max";
    }else if (value == 4) {
        return "coingecko";
    }else{
        return "binance_min";
    }
}

module.exports.priceSourceFunction = priceSourceFunction;