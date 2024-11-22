import { ComponentLoader } from 'adminjs';
const componentLoader = new ComponentLoader();
const Components = {
    JsonViewer: componentLoader.add('JsonViewer', './admin-components/JsonViewer.jsx'),
    JsonEditor: componentLoader.add('JsonEditor', './admin-components/JsonEditor.jsx'),
    OrderIdLink: componentLoader.add('OrderIdLink', './admin-components/OrderIdLink.jsx'),
    UserIdLink: componentLoader.add('UserIdLink','./admin-components/UserIdLink.jsx'),
    Evidence: componentLoader.add('Evidence','./admin-components/Evidence.jsx'),
    FiatCurrencyIdLink: componentLoader.add('FiatCurrencyIdLink','./admin-components/FiatCurrencyIdLink.jsx'),
    ChooseFiatCurrency: componentLoader.add('ChooseFiatCurrency','./admin-components/ChooseFiatCurrency')
    // other custom components
};
export { componentLoader, Components };