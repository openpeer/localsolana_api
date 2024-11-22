// components/OrderIdLink.js
import React from 'react';

const OrderIdLink = (props) => {
  const { record, property } = props;
  const orderId = record.params[property.name];

  const currentUrl = window.location.href;

  if(currentUrl.includes('/show')){
    return (
      <section class="sc-dmqHEX fGPrHl adminjs_Box">
            <label className='sc-eDDNvR izJNTD adminjs_Label'>Order Id</label>
            <a
            href={`/admin/resources/orders/records/${orderId}/show`}
            rel="noopener noreferrer"
            style={{ color: '#1d72b8', textDecoration: 'underline' }}
            >
            {orderId}
            </a>
        </section>
    );
  }

  return (
    <a
      href={`/admin/resources/orders/records/${orderId}/show`}
      rel="noopener noreferrer"
      style={{ color: '#1d72b8', textDecoration: 'underline' }}
    >
      {orderId}
    </a>
  );
};

export default OrderIdLink;
