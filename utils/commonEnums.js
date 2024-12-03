const priceSourceFunction = (value) => {
    switch(value) {
        case 0:
            return "coingecko";
        case 1:
            return "binance_median";
        case 2:
            return "binance_min";
        case 3:
            return "binance_max";
        default:
            return "coingecko"; // Default fallback
    }
}

module.exports.priceSourceFunction = priceSourceFunction;