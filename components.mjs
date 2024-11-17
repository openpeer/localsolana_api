import { ComponentLoader } from 'adminjs';

const componentLoader = new ComponentLoader();

const Components = {
    JsonViewer: componentLoader.add('JsonViewer', './admin-components/JsonViewer.jsx'),
    JsonEditor: componentLoader.add('JsonEditor', './admin-components/JsonEditor.jsx'),
    // other custom components
};

export { componentLoader, Components };