// admin-components/JsonEditor.jsx
import React, { useState } from 'react';

const JsonEditor = (props) => {
  const { record, property, onChange } = props;
  const [value, setValue] = useState(record.params[property.name] || {});

  const handleChange = (event) => {
    const newValue = JSON.parse(event.target.value);
    setValue(newValue);
    onChange(property.name, newValue);
  };

  return (
    <div>
      <textarea
        style={{ width: '100%', height: '200px' }}
        value={JSON.stringify(value, null, 2)}
        onChange={handleChange}
      />
    </div>
  );
};

export default JsonEditor;