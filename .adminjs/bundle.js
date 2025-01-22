(function (React) {
  'use strict';

  function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

  var React__default = /*#__PURE__*/_interopDefault(React);

  // admin-components/JsonViewer.jsx
  const JsonViewer = props => {
    const {
      record,
      property
    } = props;

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
    return /*#__PURE__*/React__default.default.createElement("div", null, parsedValue ? /*#__PURE__*/React__default.default.createElement("pre", {
      style: {
        background: '#f6f8fa',
        padding: '10px',
        borderRadius: '5px',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word'
      }
    }, JSON.stringify(parsedValue, null, 2)) : /*#__PURE__*/React__default.default.createElement("p", null, "No data available"));
  };

  // admin-components/JsonEditor.jsx
  const JsonEditor = props => {
    const {
      record,
      property,
      onChange
    } = props;
    const [value, setValue] = React.useState(record.params[property.name] || {});
    const handleChange = event => {
      const newValue = JSON.parse(event.target.value);
      setValue(newValue);
      onChange(property.name, newValue);
    };
    return /*#__PURE__*/React__default.default.createElement("div", null, /*#__PURE__*/React__default.default.createElement("textarea", {
      style: {
        width: '100%',
        height: '200px'
      },
      value: JSON.stringify(value, null, 2),
      onChange: handleChange
    }));
  };

  // components/OrderIdLink.js
  const OrderIdLink = props => {
    const {
      record,
      property
    } = props;
    const orderId = record.params[property.name];
    const currentUrl = window.location.href;
    if (currentUrl.includes('/show')) {
      return /*#__PURE__*/React__default.default.createElement("section", {
        class: "sc-dmqHEX fGPrHl adminjs_Box"
      }, /*#__PURE__*/React__default.default.createElement("label", {
        className: "sc-eDDNvR izJNTD adminjs_Label"
      }, "Order Id"), /*#__PURE__*/React__default.default.createElement("a", {
        href: `/admin/resources/orders/records/${orderId}/show`,
        rel: "noopener noreferrer",
        style: {
          color: '#1d72b8',
          textDecoration: 'underline'
        }
      }, orderId));
    }
    return /*#__PURE__*/React__default.default.createElement("a", {
      href: `/admin/resources/orders/records/${orderId}/show`,
      rel: "noopener noreferrer",
      style: {
        color: '#1d72b8',
        textDecoration: 'underline'
      }
    }, orderId);
  };

  // components/UserIdLink.js
  const UserIdLink = props => {
    const {
      record,
      property
    } = props;
    const userId = record.params[property.name];
    const currentUrl = window.location.href;
    console.log("Here", record.params[property.name]);
    if (currentUrl.includes('/show')) {
      return /*#__PURE__*/React__default.default.createElement("section", {
        class: "sc-dmqHEX fGPrHl adminjs_Box"
      }, /*#__PURE__*/React__default.default.createElement("label", {
        className: "sc-eDDNvR izJNTD adminjs_Label"
      }, "Winner"), userId ? /*#__PURE__*/React__default.default.createElement("a", {
        href: `/admin/resources/users/records/${userId}/show`,
        rel: "noopener noreferrer",
        style: {
          color: '#1d72b8',
          textDecoration: 'underline'
        }
      }, userId) : /*#__PURE__*/React__default.default.createElement(React__default.default.Fragment, null, "Empty"));
    }
    return /*#__PURE__*/React__default.default.createElement("a", {
      href: `/admin/resources/users/records/${userId}/show`,
      rel: "noopener noreferrer",
      style: {
        color: '#1d72b8',
        textDecoration: 'underline'
      }
    }, userId);
  };

  // components/Evidence.js
  const Evidence = props => {
    const {
      record,
      property
    } = props;
    const edidenceDetails = record.params[property.name];
    console.log("Here", record.params[property.name]);
    if (Object.keys(edidenceDetails).length > 0) {
      return /*#__PURE__*/React__default.default.createElement("section", {
        class: "sc-dmqHEX fGPrHl adminjs_Box"
      }, /*#__PURE__*/React__default.default.createElement("div", {
        style: {
          display: "flex",
          gap: "1rem",
          width: "100%"
        }
      }, /*#__PURE__*/React__default.default.createElement("div", {
        style: {
          flex: "1 1 33%",
          maxWidth: "33%"
        }
      }, /*#__PURE__*/React__default.default.createElement("label", {
        className: "sc-eDDNvR izJNTD adminjs_Label"
      }, property.name === "seller_evidence" ? "Seller Evidence" : "Buyer Evidence")), /*#__PURE__*/React__default.default.createElement("div", {
        style: {
          flex: "2 1 67%",
          maxWidth: "67%"
        }
      }, /*#__PURE__*/React__default.default.createElement("label", {
        className: "sc-eDDNvR izJNTD adminjs_Label"
      }, "User"), /*#__PURE__*/React__default.default.createElement("a", {
        href: `/admin/resources/users/records/${edidenceDetails.user_id}/show`,
        rel: "noopener noreferrer",
        style: {
          color: "#1d72b8",
          textDecoration: "underline"
        }
      }, /*#__PURE__*/React__default.default.createElement("div", null, edidenceDetails.user_id)), /*#__PURE__*/React__default.default.createElement("br", null), /*#__PURE__*/React__default.default.createElement("label", {
        className: "sc-eDDNvR izJNTD adminjs_Label"
      }, "Comments"), /*#__PURE__*/React__default.default.createElement("div", null, edidenceDetails.comments), /*#__PURE__*/React__default.default.createElement("br", null), /*#__PURE__*/React__default.default.createElement("label", {
        className: "sc-eDDNvR izJNTD adminjs_Label"
      }, "Created At"), /*#__PURE__*/React__default.default.createElement("div", null, edidenceDetails.createdAt), /*#__PURE__*/React__default.default.createElement("br", null), /*#__PURE__*/React__default.default.createElement("label", {
        className: "sc-eDDNvR izJNTD adminjs_Label"
      }, "Files"), /*#__PURE__*/React__default.default.createElement("div", {
        style: {
          width: "100%",
          overflow: "hidden"
        }
      }, edidenceDetails.files.map((data, index) => {
        return /*#__PURE__*/React__default.default.createElement("img", {
          key: index // Always provide a unique key for list items
          ,
          src: data,
          alt: `Image ${index}`,
          style: {
            maxWidth: "100%",
            // Ensure the image does not exceed the container width
            maxHeight: "100%",
            // Ensure the image does not exceed the container height
            objectFit: "contain",
            // Scale the image to fit within the container without distorting
            marginBottom: "10px" // Optional: Add some space between images
          }
        });
      })))));
    }
    return /*#__PURE__*/React__default.default.createElement("section", {
      class: "sc-dmqHEX fGPrHl adminjs_Box"
    }, /*#__PURE__*/React__default.default.createElement("div", {
      style: {
        display: "flex",
        gap: "1rem",
        width: "100%"
      }
    }, /*#__PURE__*/React__default.default.createElement("div", {
      style: {
        flex: "1 1 33%",
        maxWidth: "33%"
      }
    }, /*#__PURE__*/React__default.default.createElement("label", {
      className: "sc-eDDNvR izJNTD adminjs_Label"
    }, property.name === "seller_evidence" ? "Seller Evidence" : "Buyer Evidence")), /*#__PURE__*/React__default.default.createElement("div", {
      style: {
        flex: "2 1 67%",
        maxWidth: "67%"
      }
    }, "No evidence found")));
  };

  // components/UserIdLink.js
  const FiatCurrencyIdLink = props => {
    const {
      record,
      property
    } = props;
    const fiatCurrencies = record.params[property.name];
    return /*#__PURE__*/React__default.default.createElement("section", {
      class: "sc-dmqHEX fGPrHl adminjs_Box"
    }, /*#__PURE__*/React__default.default.createElement("label", {
      className: "sc-eDDNvR izJNTD adminjs_Label"
    }, "Fiat Currencies"), fiatCurrencies.length > 0 ? fiatCurrencies.map((data, index) => {
      return /*#__PURE__*/React__default.default.createElement("div", {
        key: index
      }, /*#__PURE__*/React__default.default.createElement("a", {
        href: `/admin/resources/fiat_currencies/records/${data.id}/show`,
        rel: "noopener noreferrer",
        style: {
          color: '#1d72b8',
          textDecoration: 'underline'
        }
      }, data.name));
    }) : /*#__PURE__*/React__default.default.createElement(React__default.default.Fragment, null, "No Fiat Currency Found"))
    // <a
    //   href={`/admin/resources/fiat_currencies/records/${userId}/show`}
    //   rel="noopener noreferrer"
    //   style={{ color: '#1d72b8', textDecoration: 'underline' }}
    // >
    //   {userId}
    // </a>
    ;
  };

  // components/ChooseFiatCurrency.js
  const ChooseFiatCurrency = props => {
    const {
      record,
      property,
      onChange
    } = props;

    // Get initial selected currencies (checked ones) from record.params
    const fiatCurrencies = record.params[property.name] || [];
    const getAllFiatCurrencies = record.params["getAllFiatCurrencies"] || [];

    // State to track selected fiat currencies
    const [selectedCurrencies, setSelectedCurrencies] = React.useState(fiatCurrencies);

    // Handle checkbox change (check/uncheck)
    const handleCheckboxChange = value => {
      const id = value.toString();
      // Update selected currencies by adding/removing the currency ID
      console.log("Here it is", id, selectedCurrencies, selectedCurrencies.includes(id.toString()));
      const updatedSelection = selectedCurrencies.includes(id) ? selectedCurrencies.filter(currencyId => currencyId !== id) // Remove if already selected
      : [...selectedCurrencies, id]; // Add if not selected

      console.log(updatedSelection);
      setSelectedCurrencies(updatedSelection); // Update local state

      // Pass the updated list of selected fiat currencies to AdminJS using onChange
      onChange(property.name, updatedSelection); // Send the selected currencies (array) to AdminJS
    };
    return /*#__PURE__*/React__default.default.createElement("section", {
      className: "sc-dmqHEX eYgoZG adminjs_Box"
    }, /*#__PURE__*/React__default.default.createElement("div", {
      className: "sc-hjsqBZ hmjTG"
    }, /*#__PURE__*/React__default.default.createElement("label", {
      className: "sc-eDDNvR klhTot adminjs_Label"
    }, "Fiat Currencies"), getAllFiatCurrencies.length > 0 ? getAllFiatCurrencies.map(data => /*#__PURE__*/React__default.default.createElement("div", {
      key: data.id
    }, /*#__PURE__*/React__default.default.createElement("input", {
      type: "checkbox",
      checked: selectedCurrencies.includes(data.id) // Controlled checkbox
      ,
      onChange: () => handleCheckboxChange(data.id) // Handle checkbox change
    }), data.name)) : /*#__PURE__*/React__default.default.createElement(React__default.default.Fragment, null, "No Fiat Currency Found")));
  };

  AdminJS.UserComponents = {};
  AdminJS.UserComponents.JsonViewer = JsonViewer;
  AdminJS.UserComponents.JsonEditor = JsonEditor;
  AdminJS.UserComponents.OrderIdLink = OrderIdLink;
  AdminJS.UserComponents.UserIdLink = UserIdLink;
  AdminJS.UserComponents.Evidence = Evidence;
  AdminJS.UserComponents.FiatCurrencyIdLink = FiatCurrencyIdLink;
  AdminJS.UserComponents.ChooseFiatCurrency = ChooseFiatCurrency;

})(React);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlcyI6WyIuLi9hZG1pbi1jb21wb25lbnRzL0pzb25WaWV3ZXIuanN4IiwiLi4vYWRtaW4tY29tcG9uZW50cy9Kc29uRWRpdG9yLmpzeCIsIi4uL2FkbWluLWNvbXBvbmVudHMvT3JkZXJJZExpbmsuanN4IiwiLi4vYWRtaW4tY29tcG9uZW50cy9Vc2VySWRMaW5rLmpzeCIsIi4uL2FkbWluLWNvbXBvbmVudHMvRXZpZGVuY2UuanN4IiwiLi4vYWRtaW4tY29tcG9uZW50cy9GaWF0Q3VycmVuY3lJZExpbmsuanN4IiwiLi4vYWRtaW4tY29tcG9uZW50cy9DaG9vc2VGaWF0Q3VycmVuY3kuanN4IiwiZW50cnkuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gYWRtaW4tY29tcG9uZW50cy9Kc29uVmlld2VyLmpzeFxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcblxuY29uc3QgSnNvblZpZXdlciA9IChwcm9wcykgPT4ge1xuICBjb25zdCB7IHJlY29yZCwgcHJvcGVydHkgfSA9IHByb3BzO1xuXG4gIC8vIEdldCB0aGUgdmFsdWUgb2YgdGhlIHByb3BlcnR5XG4gIGNvbnN0IHZhbHVlID0gcmVjb3JkPy5wYXJhbXNbcHJvcGVydHkubmFtZV07XG5cbiAgLy8gU2FmZWx5IHBhcnNlIHRoZSB2YWx1ZSBpZiBpdCdzIGEgc3RyaW5nXG4gIGxldCBwYXJzZWRWYWx1ZTtcbiAgdHJ5IHtcbiAgICBwYXJzZWRWYWx1ZSA9IHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyBKU09OLnBhcnNlKHZhbHVlKSA6IHZhbHVlO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBwYXJzZSBKU09OOicsIGVycm9yKTtcbiAgICBwYXJzZWRWYWx1ZSA9IHZhbHVlOyAvLyBGYWxsYmFjayB0byB0aGUgcmF3IHZhbHVlXG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxkaXY+XG4gICAgICB7cGFyc2VkVmFsdWUgPyAoXG4gICAgICAgIDxwcmVcbiAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgYmFja2dyb3VuZDogJyNmNmY4ZmEnLFxuICAgICAgICAgICAgcGFkZGluZzogJzEwcHgnLFxuICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNXB4JyxcbiAgICAgICAgICAgIHdoaXRlU3BhY2U6ICdwcmUtd3JhcCcsXG4gICAgICAgICAgICB3b3JkV3JhcDogJ2JyZWFrLXdvcmQnLFxuICAgICAgICAgIH19XG4gICAgICAgID5cbiAgICAgICAgICB7SlNPTi5zdHJpbmdpZnkocGFyc2VkVmFsdWUsIG51bGwsIDIpfVxuICAgICAgICA8L3ByZT5cbiAgICAgICkgOiAoXG4gICAgICAgIDxwPk5vIGRhdGEgYXZhaWxhYmxlPC9wPlxuICAgICAgKX1cbiAgICA8L2Rpdj5cbiAgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEpzb25WaWV3ZXI7XG4iLCIvLyBhZG1pbi1jb21wb25lbnRzL0pzb25FZGl0b3IuanN4XG5pbXBvcnQgUmVhY3QsIHsgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5cbmNvbnN0IEpzb25FZGl0b3IgPSAocHJvcHMpID0+IHtcbiAgY29uc3QgeyByZWNvcmQsIHByb3BlcnR5LCBvbkNoYW5nZSB9ID0gcHJvcHM7XG4gIGNvbnN0IFt2YWx1ZSwgc2V0VmFsdWVdID0gdXNlU3RhdGUocmVjb3JkLnBhcmFtc1twcm9wZXJ0eS5uYW1lXSB8fCB7fSk7XG5cbiAgY29uc3QgaGFuZGxlQ2hhbmdlID0gKGV2ZW50KSA9PiB7XG4gICAgY29uc3QgbmV3VmFsdWUgPSBKU09OLnBhcnNlKGV2ZW50LnRhcmdldC52YWx1ZSk7XG4gICAgc2V0VmFsdWUobmV3VmFsdWUpO1xuICAgIG9uQ2hhbmdlKHByb3BlcnR5Lm5hbWUsIG5ld1ZhbHVlKTtcbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxkaXY+XG4gICAgICA8dGV4dGFyZWFcbiAgICAgICAgc3R5bGU9e3sgd2lkdGg6ICcxMDAlJywgaGVpZ2h0OiAnMjAwcHgnIH19XG4gICAgICAgIHZhbHVlPXtKU09OLnN0cmluZ2lmeSh2YWx1ZSwgbnVsbCwgMil9XG4gICAgICAgIG9uQ2hhbmdlPXtoYW5kbGVDaGFuZ2V9XG4gICAgICAvPlxuICAgIDwvZGl2PlxuICApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgSnNvbkVkaXRvcjsiLCIvLyBjb21wb25lbnRzL09yZGVySWRMaW5rLmpzXHJcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XHJcblxyXG5jb25zdCBPcmRlcklkTGluayA9IChwcm9wcykgPT4ge1xyXG4gIGNvbnN0IHsgcmVjb3JkLCBwcm9wZXJ0eSB9ID0gcHJvcHM7XHJcbiAgY29uc3Qgb3JkZXJJZCA9IHJlY29yZC5wYXJhbXNbcHJvcGVydHkubmFtZV07XHJcblxyXG4gIGNvbnN0IGN1cnJlbnRVcmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcclxuXHJcbiAgaWYoY3VycmVudFVybC5pbmNsdWRlcygnL3Nob3cnKSl7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICA8c2VjdGlvbiBjbGFzcz1cInNjLWRtcUhFWCBmR1BySGwgYWRtaW5qc19Cb3hcIj5cclxuICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nc2MtZURETnZSIGl6Sk5URCBhZG1pbmpzX0xhYmVsJz5PcmRlciBJZDwvbGFiZWw+XHJcbiAgICAgICAgICAgIDxhXHJcbiAgICAgICAgICAgIGhyZWY9e2AvYWRtaW4vcmVzb3VyY2VzL29yZGVycy9yZWNvcmRzLyR7b3JkZXJJZH0vc2hvd2B9XHJcbiAgICAgICAgICAgIHJlbD1cIm5vb3BlbmVyIG5vcmVmZXJyZXJcIlxyXG4gICAgICAgICAgICBzdHlsZT17eyBjb2xvcjogJyMxZDcyYjgnLCB0ZXh0RGVjb3JhdGlvbjogJ3VuZGVybGluZScgfX1cclxuICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICB7b3JkZXJJZH1cclxuICAgICAgICAgICAgPC9hPlxyXG4gICAgICAgIDwvc2VjdGlvbj5cclxuICAgICk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gKFxyXG4gICAgPGFcclxuICAgICAgaHJlZj17YC9hZG1pbi9yZXNvdXJjZXMvb3JkZXJzL3JlY29yZHMvJHtvcmRlcklkfS9zaG93YH1cclxuICAgICAgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiXHJcbiAgICAgIHN0eWxlPXt7IGNvbG9yOiAnIzFkNzJiOCcsIHRleHREZWNvcmF0aW9uOiAndW5kZXJsaW5lJyB9fVxyXG4gICAgPlxyXG4gICAgICB7b3JkZXJJZH1cclxuICAgIDwvYT5cclxuICApO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgT3JkZXJJZExpbms7XHJcbiIsIi8vIGNvbXBvbmVudHMvVXNlcklkTGluay5qc1xyXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xyXG5cclxuY29uc3QgVXNlcklkTGluayA9IChwcm9wcykgPT4ge1xyXG4gIGNvbnN0IHsgcmVjb3JkLCBwcm9wZXJ0eSB9ID0gcHJvcHM7XHJcbiAgY29uc3QgdXNlcklkID0gcmVjb3JkLnBhcmFtc1twcm9wZXJ0eS5uYW1lXTtcclxuICBjb25zdCBjdXJyZW50VXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWY7XHJcblxyXG4gIGNvbnNvbGUubG9nKFwiSGVyZVwiLCByZWNvcmQucGFyYW1zW3Byb3BlcnR5Lm5hbWVdKTtcclxuXHJcbiAgaWYoY3VycmVudFVybC5pbmNsdWRlcygnL3Nob3cnKSl7XHJcbiAgICByZXR1cm4gKFxyXG4gICAgICA8c2VjdGlvbiBjbGFzcz1cInNjLWRtcUhFWCBmR1BySGwgYWRtaW5qc19Cb3hcIj5cclxuICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nc2MtZURETnZSIGl6Sk5URCBhZG1pbmpzX0xhYmVsJz5XaW5uZXI8L2xhYmVsPlxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgdXNlcklkP1xyXG4gICAgICAgICAgICAgIDxhXHJcbiAgICAgICAgICAgIGhyZWY9e2AvYWRtaW4vcmVzb3VyY2VzL3VzZXJzL3JlY29yZHMvJHt1c2VySWR9L3Nob3dgfVxyXG4gICAgICAgICAgICByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCJcclxuICAgICAgICAgICAgc3R5bGU9e3sgY29sb3I6ICcjMWQ3MmI4JywgdGV4dERlY29yYXRpb246ICd1bmRlcmxpbmUnIH19XHJcbiAgICAgICAgICAgID5cclxuICAgICAgICAgICAge3VzZXJJZH1cclxuICAgICAgICAgICAgPC9hPlxyXG4gICAgICAgICAgICAgIDpcclxuICAgICAgICAgICAgICA8PkVtcHR5PC8+XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgPC9zZWN0aW9uPlxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIHJldHVybiAoXHJcbiAgICA8YVxyXG4gICAgICBocmVmPXtgL2FkbWluL3Jlc291cmNlcy91c2Vycy9yZWNvcmRzLyR7dXNlcklkfS9zaG93YH1cclxuICAgICAgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiXHJcbiAgICAgIHN0eWxlPXt7IGNvbG9yOiAnIzFkNzJiOCcsIHRleHREZWNvcmF0aW9uOiAndW5kZXJsaW5lJyB9fVxyXG4gICAgPlxyXG4gICAgICB7dXNlcklkfVxyXG4gICAgPC9hPlxyXG4gICk7XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBVc2VySWRMaW5rO1xyXG4iLCIvLyBjb21wb25lbnRzL0V2aWRlbmNlLmpzXHJcbmltcG9ydCBSZWFjdCBmcm9tIFwicmVhY3RcIjtcclxuXHJcbmNvbnN0IEV2aWRlbmNlID0gKHByb3BzKSA9PiB7XHJcbiAgY29uc3QgeyByZWNvcmQsIHByb3BlcnR5IH0gPSBwcm9wcztcclxuICBjb25zdCBlZGlkZW5jZURldGFpbHMgPSByZWNvcmQucGFyYW1zW3Byb3BlcnR5Lm5hbWVdO1xyXG4gIGNvbnNvbGUubG9nKFwiSGVyZVwiLCByZWNvcmQucGFyYW1zW3Byb3BlcnR5Lm5hbWVdKTtcclxuXHJcbiAgaWYgKE9iamVjdC5rZXlzKGVkaWRlbmNlRGV0YWlscykubGVuZ3RoID4gMCkge1xyXG4gICAgcmV0dXJuIChcclxuICAgICAgPHNlY3Rpb24gY2xhc3M9XCJzYy1kbXFIRVggZkdQckhsIGFkbWluanNfQm94XCI+XHJcbiAgICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiBcImZsZXhcIiwgZ2FwOiBcIjFyZW1cIiwgd2lkdGg6IFwiMTAwJVwiIH19PlxyXG4gICAgICAgICAgey8qIExlZnQgU2lkZSAoMS8zIHdpZHRoKSAqL31cclxuICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZmxleDogXCIxIDEgMzMlXCIsIG1heFdpZHRoOiBcIjMzJVwiIH19PlxyXG4gICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwic2MtZURETnZSIGl6Sk5URCBhZG1pbmpzX0xhYmVsXCI+XHJcbiAgICAgICAgICAgICAge3Byb3BlcnR5Lm5hbWUgPT09IFwic2VsbGVyX2V2aWRlbmNlXCJcclxuICAgICAgICAgICAgICAgID8gXCJTZWxsZXIgRXZpZGVuY2VcIlxyXG4gICAgICAgICAgICAgICAgOiBcIkJ1eWVyIEV2aWRlbmNlXCJ9XHJcbiAgICAgICAgICAgIDwvbGFiZWw+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICB7LyogUmlnaHQgU2lkZSAoMi8zIHdpZHRoKSAqL31cclxuICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZmxleDogXCIyIDEgNjclXCIsIG1heFdpZHRoOiBcIjY3JVwiIH19PlxyXG4gICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPVwic2MtZURETnZSIGl6Sk5URCBhZG1pbmpzX0xhYmVsXCI+VXNlcjwvbGFiZWw+XHJcbiAgICAgICAgICAgIDxhXHJcbiAgICAgICAgICAgICAgaHJlZj17YC9hZG1pbi9yZXNvdXJjZXMvdXNlcnMvcmVjb3Jkcy8ke2VkaWRlbmNlRGV0YWlscy51c2VyX2lkfS9zaG93YH1cclxuICAgICAgICAgICAgICByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCJcclxuICAgICAgICAgICAgICBzdHlsZT17eyBjb2xvcjogXCIjMWQ3MmI4XCIsIHRleHREZWNvcmF0aW9uOiBcInVuZGVybGluZVwiIH19XHJcbiAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICA8ZGl2PntlZGlkZW5jZURldGFpbHMudXNlcl9pZH08L2Rpdj5cclxuICAgICAgICAgICAgPC9hPlxyXG4gICAgICAgICAgICA8YnIvPlxyXG5cclxuICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cInNjLWVERE52UiBpekpOVEQgYWRtaW5qc19MYWJlbFwiPkNvbW1lbnRzPC9sYWJlbD5cclxuICAgICAgICAgICAgPGRpdj57ZWRpZGVuY2VEZXRhaWxzLmNvbW1lbnRzfTwvZGl2PlxyXG4gICAgICAgICAgICA8YnIvPlxyXG5cclxuICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cInNjLWVERE52UiBpekpOVEQgYWRtaW5qc19MYWJlbFwiPkNyZWF0ZWQgQXQ8L2xhYmVsPlxyXG4gICAgICAgICAgICA8ZGl2PntlZGlkZW5jZURldGFpbHMuY3JlYXRlZEF0fTwvZGl2PlxyXG4gICAgICAgICAgICA8YnIvPlxyXG5cclxuICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cInNjLWVERE52UiBpekpOVEQgYWRtaW5qc19MYWJlbFwiPkZpbGVzPC9sYWJlbD5cclxuICAgICAgICAgICAgPGRpdiBzdHlsZT17eyB3aWR0aDogXCIxMDAlXCIsIG92ZXJmbG93OiBcImhpZGRlblwiIH19PlxyXG4gICAgICAgICAgICAgICAge2VkaWRlbmNlRGV0YWlscy5maWxlcy5tYXAoKGRhdGEsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgICAgICA8aW1nXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleT17aW5kZXh9IC8vIEFsd2F5cyBwcm92aWRlIGEgdW5pcXVlIGtleSBmb3IgbGlzdCBpdGVtc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzcmM9e2RhdGF9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsdD17YEltYWdlICR7aW5kZXh9YH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWF4V2lkdGg6IFwiMTAwJVwiLCAvLyBFbnN1cmUgdGhlIGltYWdlIGRvZXMgbm90IGV4Y2VlZCB0aGUgY29udGFpbmVyIHdpZHRoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1heEhlaWdodDogXCIxMDAlXCIsIC8vIEVuc3VyZSB0aGUgaW1hZ2UgZG9lcyBub3QgZXhjZWVkIHRoZSBjb250YWluZXIgaGVpZ2h0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdEZpdDogXCJjb250YWluXCIsIC8vIFNjYWxlIHRoZSBpbWFnZSB0byBmaXQgd2l0aGluIHRoZSBjb250YWluZXIgd2l0aG91dCBkaXN0b3J0aW5nXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmdpbkJvdHRvbTogXCIxMHB4XCIsIC8vIE9wdGlvbmFsOiBBZGQgc29tZSBzcGFjZSBiZXR3ZWVuIGltYWdlc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9fVxyXG4gICAgICAgICAgICAgICAgICAgIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIH0pfVxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICA8L3NlY3Rpb24+XHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIChcclxuICAgIDxzZWN0aW9uIGNsYXNzPVwic2MtZG1xSEVYIGZHUHJIbCBhZG1pbmpzX0JveFwiPlxyXG4gICAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogXCJmbGV4XCIsIGdhcDogXCIxcmVtXCIsIHdpZHRoOiBcIjEwMCVcIiB9fT5cclxuICAgICAgICA8ZGl2IHN0eWxlPXt7IGZsZXg6IFwiMSAxIDMzJVwiLCBtYXhXaWR0aDogXCIzMyVcIiB9fT5cclxuICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cInNjLWVERE52UiBpekpOVEQgYWRtaW5qc19MYWJlbFwiPlxyXG4gICAgICAgICAgICAgICAge3Byb3BlcnR5Lm5hbWUgPT09IFwic2VsbGVyX2V2aWRlbmNlXCJcclxuICAgICAgICAgICAgICAgID8gXCJTZWxsZXIgRXZpZGVuY2VcIlxyXG4gICAgICAgICAgICAgICAgOiBcIkJ1eWVyIEV2aWRlbmNlXCJ9XHJcbiAgICAgICAgICAgIDwvbGFiZWw+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPGRpdiBzdHlsZT17eyBmbGV4OiBcIjIgMSA2NyVcIiwgbWF4V2lkdGg6IFwiNjclXCIgfX0+XHJcbiAgICAgICAgICAgIE5vIGV2aWRlbmNlIGZvdW5kXHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgPC9zZWN0aW9uPlxyXG4gICk7XHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBFdmlkZW5jZTtcclxuIiwiLy8gY29tcG9uZW50cy9Vc2VySWRMaW5rLmpzXHJcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XHJcblxyXG5jb25zdCBGaWF0Q3VycmVuY3lJZExpbmsgPSAocHJvcHMpID0+IHtcclxuICBjb25zdCB7IHJlY29yZCwgcHJvcGVydHkgfSA9IHByb3BzO1xyXG4gIGNvbnN0IGZpYXRDdXJyZW5jaWVzID0gcmVjb3JkLnBhcmFtc1twcm9wZXJ0eS5uYW1lXTtcclxuXHJcbiAgcmV0dXJuIChcclxuICAgIDxzZWN0aW9uIGNsYXNzPVwic2MtZG1xSEVYIGZHUHJIbCBhZG1pbmpzX0JveFwiPlxyXG4gICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J3NjLWVERE52UiBpekpOVEQgYWRtaW5qc19MYWJlbCc+RmlhdCBDdXJyZW5jaWVzPC9sYWJlbD5cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZpYXRDdXJyZW5jaWVzLmxlbmd0aD4wP1xyXG4gICAgICAgICAgICBmaWF0Q3VycmVuY2llcy5tYXAoKGRhdGEsIGluZGV4KT0+e1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGtleT17aW5kZXh9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8YVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaHJlZj17YC9hZG1pbi9yZXNvdXJjZXMvZmlhdF9jdXJyZW5jaWVzL3JlY29yZHMvJHtkYXRhLmlkfS9zaG93YH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbD1cIm5vb3BlbmVyIG5vcmVmZXJyZXJcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgY29sb3I6ICcjMWQ3MmI4JywgdGV4dERlY29yYXRpb246ICd1bmRlcmxpbmUnIH19XHJcbiAgICAgICAgICAgICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtkYXRhLm5hbWV9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYT5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgOlxyXG4gICAgICAgICAgICA8Pk5vIEZpYXQgQ3VycmVuY3kgRm91bmQ8Lz5cclxuICAgICAgICB9XHJcbiAgICA8L3NlY3Rpb24+XHJcbiAgICAvLyA8YVxyXG4gICAgLy8gICBocmVmPXtgL2FkbWluL3Jlc291cmNlcy9maWF0X2N1cnJlbmNpZXMvcmVjb3Jkcy8ke3VzZXJJZH0vc2hvd2B9XHJcbiAgICAvLyAgIHJlbD1cIm5vb3BlbmVyIG5vcmVmZXJyZXJcIlxyXG4gICAgLy8gICBzdHlsZT17eyBjb2xvcjogJyMxZDcyYjgnLCB0ZXh0RGVjb3JhdGlvbjogJ3VuZGVybGluZScgfX1cclxuICAgIC8vID5cclxuICAgIC8vICAge3VzZXJJZH1cclxuICAgIC8vIDwvYT5cclxuICApO1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgRmlhdEN1cnJlbmN5SWRMaW5rO1xyXG4iLCIvLyBjb21wb25lbnRzL0Nob29zZUZpYXRDdXJyZW5jeS5qc1xyXG5pbXBvcnQgUmVhY3QsIHsgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcclxuXHJcbmNvbnN0IENob29zZUZpYXRDdXJyZW5jeSA9IChwcm9wcykgPT4ge1xyXG4gIGNvbnN0IHsgcmVjb3JkLCBwcm9wZXJ0eSwgb25DaGFuZ2UgfSA9IHByb3BzO1xyXG4gIFxyXG4gIC8vIEdldCBpbml0aWFsIHNlbGVjdGVkIGN1cnJlbmNpZXMgKGNoZWNrZWQgb25lcykgZnJvbSByZWNvcmQucGFyYW1zXHJcbiAgY29uc3QgZmlhdEN1cnJlbmNpZXMgPSByZWNvcmQucGFyYW1zW3Byb3BlcnR5Lm5hbWVdIHx8IFtdO1xyXG4gIGNvbnN0IGdldEFsbEZpYXRDdXJyZW5jaWVzID0gcmVjb3JkLnBhcmFtc1tcImdldEFsbEZpYXRDdXJyZW5jaWVzXCJdIHx8IFtdO1xyXG5cclxuICAvLyBTdGF0ZSB0byB0cmFjayBzZWxlY3RlZCBmaWF0IGN1cnJlbmNpZXNcclxuICBjb25zdCBbc2VsZWN0ZWRDdXJyZW5jaWVzLCBzZXRTZWxlY3RlZEN1cnJlbmNpZXNdID0gdXNlU3RhdGUoZmlhdEN1cnJlbmNpZXMpO1xyXG5cclxuXHJcbiAgLy8gSGFuZGxlIGNoZWNrYm94IGNoYW5nZSAoY2hlY2svdW5jaGVjaylcclxuICBjb25zdCBoYW5kbGVDaGVja2JveENoYW5nZSA9ICh2YWx1ZSkgPT4ge1xyXG4gICAgY29uc3QgaWQ9dmFsdWUudG9TdHJpbmcoKTtcclxuICAgIC8vIFVwZGF0ZSBzZWxlY3RlZCBjdXJyZW5jaWVzIGJ5IGFkZGluZy9yZW1vdmluZyB0aGUgY3VycmVuY3kgSURcclxuICAgIGNvbnNvbGUubG9nKFwiSGVyZSBpdCBpc1wiLGlkLCBzZWxlY3RlZEN1cnJlbmNpZXMsc2VsZWN0ZWRDdXJyZW5jaWVzLmluY2x1ZGVzKGlkLnRvU3RyaW5nKCkpIClcclxuICAgIGNvbnN0IHVwZGF0ZWRTZWxlY3Rpb24gPSBzZWxlY3RlZEN1cnJlbmNpZXMuaW5jbHVkZXMoaWQpXHJcbiAgICAgID8gc2VsZWN0ZWRDdXJyZW5jaWVzLmZpbHRlcihjdXJyZW5jeUlkID0+IGN1cnJlbmN5SWQgIT09IGlkKSAvLyBSZW1vdmUgaWYgYWxyZWFkeSBzZWxlY3RlZFxyXG4gICAgICA6IFsuLi5zZWxlY3RlZEN1cnJlbmNpZXMsIGlkXTsgLy8gQWRkIGlmIG5vdCBzZWxlY3RlZFxyXG5cclxuICAgICAgY29uc29sZS5sb2codXBkYXRlZFNlbGVjdGlvbik7XHJcbiAgICBzZXRTZWxlY3RlZEN1cnJlbmNpZXModXBkYXRlZFNlbGVjdGlvbik7IC8vIFVwZGF0ZSBsb2NhbCBzdGF0ZVxyXG4gIFxyXG4gICAgLy8gUGFzcyB0aGUgdXBkYXRlZCBsaXN0IG9mIHNlbGVjdGVkIGZpYXQgY3VycmVuY2llcyB0byBBZG1pbkpTIHVzaW5nIG9uQ2hhbmdlXHJcbiAgICBvbkNoYW5nZShwcm9wZXJ0eS5uYW1lLCB1cGRhdGVkU2VsZWN0aW9uKTsgIC8vIFNlbmQgdGhlIHNlbGVjdGVkIGN1cnJlbmNpZXMgKGFycmF5KSB0byBBZG1pbkpTXHJcbiAgfTtcclxuXHJcbiAgcmV0dXJuIChcclxuICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cInNjLWRtcUhFWCBlWWdvWkcgYWRtaW5qc19Cb3hcIj5cclxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJzYy1oanNxQlogaG1qVEdcIj5cclxuICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdzYy1lREROdlIga2xoVG90IGFkbWluanNfTGFiZWwnPkZpYXQgQ3VycmVuY2llczwvbGFiZWw+XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgZ2V0QWxsRmlhdEN1cnJlbmNpZXMubGVuZ3RoID4gMCA/IGdldEFsbEZpYXRDdXJyZW5jaWVzLm1hcCgoZGF0YSkgPT4gKFxyXG4gICAgICAgICAgICA8ZGl2IGtleT17ZGF0YS5pZH0+XHJcbiAgICAgICAgICAgICAgPGlucHV0XHJcbiAgICAgICAgICAgICAgICB0eXBlPVwiY2hlY2tib3hcIlxyXG4gICAgICAgICAgICAgICAgY2hlY2tlZD17c2VsZWN0ZWRDdXJyZW5jaWVzLmluY2x1ZGVzKGRhdGEuaWQpfSAvLyBDb250cm9sbGVkIGNoZWNrYm94XHJcbiAgICAgICAgICAgICAgICBvbkNoYW5nZT17KCkgPT4gaGFuZGxlQ2hlY2tib3hDaGFuZ2UoZGF0YS5pZCl9IC8vIEhhbmRsZSBjaGVja2JveCBjaGFuZ2VcclxuICAgICAgICAgICAgICAvPlxyXG4gICAgICAgICAgICAgIHtkYXRhLm5hbWV9XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgKSkgOiAoXHJcbiAgICAgICAgICAgIDw+Tm8gRmlhdCBDdXJyZW5jeSBGb3VuZDwvPlxyXG4gICAgICAgICAgKVxyXG4gICAgICAgIH1cclxuICAgICAgPC9kaXY+XHJcbiAgICA8L3NlY3Rpb24+XHJcbiAgKTtcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IENob29zZUZpYXRDdXJyZW5jeTtcclxuIiwiQWRtaW5KUy5Vc2VyQ29tcG9uZW50cyA9IHt9XG5pbXBvcnQgSnNvblZpZXdlciBmcm9tICcuLi9hZG1pbi1jb21wb25lbnRzL0pzb25WaWV3ZXInXG5BZG1pbkpTLlVzZXJDb21wb25lbnRzLkpzb25WaWV3ZXIgPSBKc29uVmlld2VyXG5pbXBvcnQgSnNvbkVkaXRvciBmcm9tICcuLi9hZG1pbi1jb21wb25lbnRzL0pzb25FZGl0b3InXG5BZG1pbkpTLlVzZXJDb21wb25lbnRzLkpzb25FZGl0b3IgPSBKc29uRWRpdG9yXG5pbXBvcnQgT3JkZXJJZExpbmsgZnJvbSAnLi4vYWRtaW4tY29tcG9uZW50cy9PcmRlcklkTGluaydcbkFkbWluSlMuVXNlckNvbXBvbmVudHMuT3JkZXJJZExpbmsgPSBPcmRlcklkTGlua1xuaW1wb3J0IFVzZXJJZExpbmsgZnJvbSAnLi4vYWRtaW4tY29tcG9uZW50cy9Vc2VySWRMaW5rJ1xuQWRtaW5KUy5Vc2VyQ29tcG9uZW50cy5Vc2VySWRMaW5rID0gVXNlcklkTGlua1xuaW1wb3J0IEV2aWRlbmNlIGZyb20gJy4uL2FkbWluLWNvbXBvbmVudHMvRXZpZGVuY2UnXG5BZG1pbkpTLlVzZXJDb21wb25lbnRzLkV2aWRlbmNlID0gRXZpZGVuY2VcbmltcG9ydCBGaWF0Q3VycmVuY3lJZExpbmsgZnJvbSAnLi4vYWRtaW4tY29tcG9uZW50cy9GaWF0Q3VycmVuY3lJZExpbmsnXG5BZG1pbkpTLlVzZXJDb21wb25lbnRzLkZpYXRDdXJyZW5jeUlkTGluayA9IEZpYXRDdXJyZW5jeUlkTGlua1xuaW1wb3J0IENob29zZUZpYXRDdXJyZW5jeSBmcm9tICcuLi9hZG1pbi1jb21wb25lbnRzL0Nob29zZUZpYXRDdXJyZW5jeSdcbkFkbWluSlMuVXNlckNvbXBvbmVudHMuQ2hvb3NlRmlhdEN1cnJlbmN5ID0gQ2hvb3NlRmlhdEN1cnJlbmN5Il0sIm5hbWVzIjpbIkpzb25WaWV3ZXIiLCJwcm9wcyIsInJlY29yZCIsInByb3BlcnR5IiwidmFsdWUiLCJwYXJhbXMiLCJuYW1lIiwicGFyc2VkVmFsdWUiLCJKU09OIiwicGFyc2UiLCJlcnJvciIsImNvbnNvbGUiLCJSZWFjdCIsImNyZWF0ZUVsZW1lbnQiLCJzdHlsZSIsImJhY2tncm91bmQiLCJwYWRkaW5nIiwiYm9yZGVyUmFkaXVzIiwid2hpdGVTcGFjZSIsIndvcmRXcmFwIiwic3RyaW5naWZ5IiwiSnNvbkVkaXRvciIsIm9uQ2hhbmdlIiwic2V0VmFsdWUiLCJ1c2VTdGF0ZSIsImhhbmRsZUNoYW5nZSIsImV2ZW50IiwibmV3VmFsdWUiLCJ0YXJnZXQiLCJ3aWR0aCIsImhlaWdodCIsIk9yZGVySWRMaW5rIiwib3JkZXJJZCIsImN1cnJlbnRVcmwiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImhyZWYiLCJpbmNsdWRlcyIsImNsYXNzIiwiY2xhc3NOYW1lIiwicmVsIiwiY29sb3IiLCJ0ZXh0RGVjb3JhdGlvbiIsIlVzZXJJZExpbmsiLCJ1c2VySWQiLCJsb2ciLCJGcmFnbWVudCIsIkV2aWRlbmNlIiwiZWRpZGVuY2VEZXRhaWxzIiwiT2JqZWN0Iiwia2V5cyIsImxlbmd0aCIsImRpc3BsYXkiLCJnYXAiLCJmbGV4IiwibWF4V2lkdGgiLCJ1c2VyX2lkIiwiY29tbWVudHMiLCJjcmVhdGVkQXQiLCJvdmVyZmxvdyIsImZpbGVzIiwibWFwIiwiZGF0YSIsImluZGV4Iiwia2V5Iiwic3JjIiwiYWx0IiwibWF4SGVpZ2h0Iiwib2JqZWN0Rml0IiwibWFyZ2luQm90dG9tIiwiRmlhdEN1cnJlbmN5SWRMaW5rIiwiZmlhdEN1cnJlbmNpZXMiLCJpZCIsIkNob29zZUZpYXRDdXJyZW5jeSIsImdldEFsbEZpYXRDdXJyZW5jaWVzIiwic2VsZWN0ZWRDdXJyZW5jaWVzIiwic2V0U2VsZWN0ZWRDdXJyZW5jaWVzIiwiaGFuZGxlQ2hlY2tib3hDaGFuZ2UiLCJ0b1N0cmluZyIsInVwZGF0ZWRTZWxlY3Rpb24iLCJmaWx0ZXIiLCJjdXJyZW5jeUlkIiwidHlwZSIsImNoZWNrZWQiLCJBZG1pbkpTIiwiVXNlckNvbXBvbmVudHMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7RUFBQTtFQUdBLE1BQU1BLFVBQVUsR0FBSUMsS0FBSyxJQUFLO0lBQzVCLE1BQU07TUFBRUMsTUFBTTtFQUFFQyxJQUFBQTtFQUFTLEdBQUMsR0FBR0YsS0FBSzs7RUFFbEM7SUFDQSxNQUFNRyxLQUFLLEdBQUdGLE1BQU0sRUFBRUcsTUFBTSxDQUFDRixRQUFRLENBQUNHLElBQUksQ0FBQzs7RUFFM0M7RUFDQSxFQUFBLElBQUlDLFdBQVc7SUFDZixJQUFJO0VBQ0ZBLElBQUFBLFdBQVcsR0FBRyxPQUFPSCxLQUFLLEtBQUssUUFBUSxHQUFHSSxJQUFJLENBQUNDLEtBQUssQ0FBQ0wsS0FBSyxDQUFDLEdBQUdBLEtBQUs7S0FDcEUsQ0FBQyxPQUFPTSxLQUFLLEVBQUU7RUFDZEMsSUFBQUEsT0FBTyxDQUFDRCxLQUFLLENBQUMsdUJBQXVCLEVBQUVBLEtBQUssQ0FBQztNQUM3Q0gs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
