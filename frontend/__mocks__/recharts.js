/** Mock for recharts */

const React = require('react');

const MockChart = ({ children }) => React.createElement('div', { 'data-testid': 'mock-chart' }, children);
const MockComponent = ({ children }) => React.createElement('div', null, children);

module.exports = {
  ResponsiveContainer: MockChart,
  PieChart: MockChart,
  Pie: MockComponent,
  Cell: MockComponent,
  Tooltip: MockComponent,
  Legend: MockComponent,
  BarChart: MockChart,
  Bar: MockComponent,
  XAxis: MockComponent,
  YAxis: MockComponent,
  CartesianGrid: MockComponent,
  LineChart: MockChart,
  Line: MockComponent,
  Area: MockComponent,
  AreaChart: MockChart,
  RadarChart: MockChart,
  Radar: MockComponent,
  PolarGrid: MockComponent,
  PolarAngleAxis: MockComponent,
  PolarRadiusAxis: MockComponent,
  ComposedChart: MockChart,
  Treemap: MockChart,
  Sankey: MockChart,
  RadialBarChart: MockChart,
  RadialBar: MockComponent,
  Scatter: MockComponent,
  ScatterChart: MockChart,
  Sector: MockComponent,
  ReferenceLine: MockComponent,
  ReferenceArea: MockComponent,
  ReferenceDot: MockComponent,
  Brush: MockComponent,
  ErrorBar: MockComponent,
  Funnel: MockComponent,
  FunnelChart: MockChart,
  LabelList: MockComponent,
  Label: MockComponent,
  Text: MockComponent,
};
