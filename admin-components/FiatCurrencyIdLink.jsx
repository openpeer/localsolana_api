// components/UserIdLink.js
import React from 'react';

const FiatCurrencyIdLink = (props) => {
  const { record, property } = props;
  const fiatCurrencies = record.params[property.name];

  return (
    <section class="sc-dmqHEX fGPrHl adminjs_Box">
        <label className='sc-eDDNvR izJNTD adminjs_Label'>Fiat Currencies</label>
        {
            fiatCurrencies.length>0?
            fiatCurrencies.map((data, index)=>{
                return (
                    <div key={index}>
                        <a
                            href={`/admin/resources/fiat_currencies/records/${data.id}/show`}
                            rel="noopener noreferrer"
                            style={{ color: '#1d72b8', textDecoration: 'underline' }}
                        >
                            {data.name}
                        </a>
                    </div>
                )
            })
            :
            <>No Fiat Currency Found</>
        }
    </section>
    // <a
    //   href={`/admin/resources/fiat_currencies/records/${userId}/show`}
    //   rel="noopener noreferrer"
    //   style={{ color: '#1d72b8', textDecoration: 'underline' }}
    // >
    //   {userId}
    // </a>
  );
};

export default FiatCurrencyIdLink;
