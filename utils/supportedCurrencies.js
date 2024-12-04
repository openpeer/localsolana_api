const COINGECKO_SUPPORTED_CURRENCIES = [
  "btc", "eth", "ltc", "bch", "bnb", "eos", "xrp", "xlm", "link", "dot", "yfi",
  "usd", "aed", "ars", "aud", "bdt", "bhd", "bmd", "brl", "cad", "chf", "clp",
  "cny", "czk", "dkk", "eur", "gbp", "gel", "hkd", "huf", "idr", "ils", "inr",
  "jpy", "krw", "kwd", "lkr", "mmk", "mxn", "myr", "ngn", "nok", "nzd", "php",
  "pkr", "pln", "rub", "sar", "sek", "sgd", "thb", "try", "twd", "uah", "vef",
  "vnd", "zar", "xdr", "xag", "xau", "bits", "sats"
];

// Removed duplicates (currencies already supported by CoinGecko)
const BINANCE_SUPPORTED_CURRENCIES = [
  "COP", "VES", "PEN", "KES", "MAD", "EGP"
];

module.exports = {
  COINGECKO_SUPPORTED_CURRENCIES,
  BINANCE_SUPPORTED_CURRENCIES,
  isCoinGeckoSupported: (currency) => COINGECKO_SUPPORTED_CURRENCIES.includes(currency.toLowerCase()),
  isBinanceSupported: (currency) => BINANCE_SUPPORTED_CURRENCIES.includes(currency.toUpperCase())
};