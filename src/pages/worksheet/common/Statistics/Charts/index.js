
import { reportTypes } from './common';
import BarChart from './BarChart';
import LineChart from './LineChart';
import PieChart from './PieChart';
import NumberChart from './NumberChart';
import RadarChart from './RadarChart';
import FunnelChart from './FunnelChart';
import DualAxes from './DualAxes';
import PivotTable from './PivotTable';
import AntPivotTable from './AntPivotTable';
import CountryLayer from './CountryLayer';
import VerificationDataLength from './VerificationDataLength';

const charts = {
  [reportTypes.LineChart]: VerificationDataLength(LineChart),
  [reportTypes.BarChart]: VerificationDataLength(BarChart),
  [reportTypes.PieChart]: VerificationDataLength(PieChart),
  [reportTypes.NumberChart]: NumberChart,
  [reportTypes.RadarChart]: VerificationDataLength(RadarChart),
  [reportTypes.FunnelChart]: FunnelChart,
  [reportTypes.DualAxes]: VerificationDataLength(DualAxes),
  [reportTypes.PivotTable]: AntPivotTable,
  [reportTypes.CountryLayer]: CountryLayer,
}

export default charts;
