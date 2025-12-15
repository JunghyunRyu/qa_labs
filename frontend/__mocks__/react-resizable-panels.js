/** Mock for react-resizable-panels */

const React = require('react');

const PanelGroup = ({ children }) => React.createElement('div', { 'data-testid': 'panel-group' }, children);
const Panel = ({ children }) => React.createElement('div', { 'data-testid': 'panel' }, children);
const PanelResizeHandle = () => React.createElement('div', { 'data-testid': 'panel-resize-handle' });

module.exports = {
  PanelGroup,
  Panel,
  PanelResizeHandle,
};
