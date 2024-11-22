// components/UserIdLink.js
import React from 'react';

const UserIdLink = (props) => {
  const { record, property } = props;
  const userId = record.params[property.name];
  const currentUrl = window.location.href;

  console.log("Here", record.params[property.name]);

  if(currentUrl.includes('/show')){
    return (
      <section class="sc-dmqHEX fGPrHl adminjs_Box">
            <label className='sc-eDDNvR izJNTD adminjs_Label'>Winner</label>
            {
              userId?
              <a
            href={`/admin/resources/users/records/${userId}/show`}
            rel="noopener noreferrer"
            style={{ color: '#1d72b8', textDecoration: 'underline' }}
            >
            {userId}
            </a>
              :
              <>Empty</>
            }
            
        </section>
    );
  }

  return (
    <a
      href={`/admin/resources/users/records/${userId}/show`}
      rel="noopener noreferrer"
      style={{ color: '#1d72b8', textDecoration: 'underline' }}
    >
      {userId}
    </a>
  );
};

export default UserIdLink;
