function fiat_currencies_resource(fiat_currencies) {
  return {
    resource: fiat_currencies,
    options: {
      properties: {
        id: {
          position: 1,
          isVisible: { list: true, edit: false, show: true, filter: false },
        },
        code: {
          position: 2,
          isVisible: { list: true, edit: true, show: true, filter: true },
        },
        name: {
          position: 3,
          isVisible: { list: true, edit: true, show: true, filter: true },
        },
        createdAt: {
          position: 4,
          isVisible: { list: true, edit: true, show: true, filter: true },
        },
        updatedAt: {
          position: 5,
          isVisible: { list: true, edit: true, show: true, filter: true },
        },
        symbol: {
          position: 6,
          isVisible: { list: true, edit: true, show: true, filter: true },
        },
        country_code: {
          position: 7,
          isVisible: { list: true, edit: true, show: true, filter: true },
        },
        position: {
          position: 8,
          isVisible: { list: true, edit: true, show: true, filter: true },
        },
        allow_binance_rates: {
          position: 9,
          isVisible: { list: true, edit: true, show: true, filter: true },
        },
        default_price_source: {
          position: 10,
          isVisible: { list: true, edit: true, show: true, filter: true },
        },
      },
      parent: { name: null }, // Make "Banks" a top-level resource
    },
  };
}

module.exports = fiat_currencies_resource;
