// admin-components/JsonViewer.jsx
import React from 'react';

const JsonViewer = (props) => {
  const { record, property } = props;

  // Get the value of the property
  const value = record?.params[property.name];

  // Safely parse the value if it's a string
  let parsedValue;
  try {
    parsedValue = typeof value === 'string' ? JSON.parse(value) : value;
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    parsedValue = value; // Fallback to the raw value
  }

  return (
    <div>
      {parsedValue ? (
        <pre
          style={{
            background: '#f6f8fa',
            padding: '10px',
            borderRadius: '5px',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
          }}
        >
          {JSON.stringify(parsedValue, null, 2)}
        </pre>
      ) : (
        <p>No data available</p>
      )}
    </div>
  );
};

export default JsonViewer;
