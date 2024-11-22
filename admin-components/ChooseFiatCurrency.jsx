// components/ChooseFiatCurrency.js
import React, { useEffect, useState } from 'react';

const ChooseFiatCurrency = (props) => {
  const { record, property, onChange } = props;
  
  // Get initial selected currencies (checked ones) from record.params
  const fiatCurrencies = record.params[property.name] || [];
  const getAllFiatCurrencies = record.params["getAllFiatCurrencies"] || [];

  // State to track selected fiat currencies
  const [selectedCurrencies, setSelectedCurrencies] = useState(fiatCurrencies);


  // Handle checkbox change (check/uncheck)
  const handleCheckboxChange = (value) => {
    const id=value.toString();
    // Update selected currencies by adding/removing the currency ID
    console.log("Here it is",id, selectedCurrencies,selectedCurrencies.includes(id.toString()) )
    const updatedSelection = selectedCurrencies.includes(id)
      ? selectedCurrencies.filter(currencyId => currencyId !== id) // Remove if already selected
      : [...selectedCurrencies, id]; // Add if not selected

      console.log(updatedSelection);
    setSelectedCurrencies(updatedSelection); // Update local state
  
    // Pass the updated list of selected fiat currencies to AdminJS using onChange
    onChange(property.name, updatedSelection);  // Send the selected currencies (array) to AdminJS
  };

  return (
    <section className="sc-dmqHEX eYgoZG adminjs_Box">
      <div className="sc-hjsqBZ hmjTG">
        <label className='sc-eDDNvR klhTot adminjs_Label'>Fiat Currencies</label>
        {
          getAllFiatCurrencies.length > 0 ? getAllFiatCurrencies.map((data) => (
            <div key={data.id}>
              <input
                type="checkbox"
                checked={selectedCurrencies.includes(data.id)} // Controlled checkbox
                onChange={() => handleCheckboxChange(data.id)} // Handle checkbox change
              />
              {data.name}
            </div>
          )) : (
            <>No Fiat Currency Found</>
          )
        }
      </div>
    </section>
  );
};

export default ChooseFiatCurrency;
