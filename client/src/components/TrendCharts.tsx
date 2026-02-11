import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { RoundState, Metrics } from 'shared';

interface TrendChartsProps {
  roundStates: RoundState[];
}

interface ChartDef {
  title: string;
  metricKey: keyof Metrics;
  color: string;
  prefix?: string;
  unit?: string;
}

const CHARTS: ChartDef[] = [
  { title: 'Revenue', metricKey: 'revenue', color: '#3b82f6', prefix: '£' },
  { title: 'Net Profit', metricKey: 'netProfit', color: '#10b981', prefix: '£' },
  { title: 'Gross Margin', metricKey: 'grossMarginPct', color: '#06b6d4', unit: '%' },
  { title: 'Customer Satisfaction', metricKey: 'customerSatisfaction', color: '#8b5cf6' },
  { title: 'Engagement', metricKey: 'engagementScore', color: '#a855f7' },
  { title: 'Compliance', metricKey: 'complianceScore', color: '#f59e0b' },
  { title: 'Waste', metricKey: 'wastePct', color: '#ef4444', unit: '%' },
  { title: 'Availability', metricKey: 'availabilityPct', color: '#22c55e', unit: '%' },
];

const tooltipStyle = {
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '8px',
  fontSize: '12px',
};

export default function TrendCharts({ roundStates }: TrendChartsProps) {
  const sorted = [...roundStates].sort((a, b) => a.roundNumber - b.roundNumber);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {CHARTS.map((chart) => {
        const data = sorted.map((rs) => ({
          name: rs.roundNumber === 0 ? 'Start' : `W${rs.roundNumber}`,
          value: (rs.metrics as Metrics)[chart.metricKey],
        }));

        const values = data.map((d) => d.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const padding = Math.max((max - min) * 0.15, 1);

        return (
          <div
            key={chart.metricKey}
            className="bg-surface-light border border-border rounded-xl p-3"
          >
            <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2 truncate">
              {chart.title}
            </h4>
            <div style={{ height: 120 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    width={45}
                    tickLine={false}
                    axisLine={false}
                    domain={[Math.floor(min - padding), Math.ceil(max + padding)]}
                    tickFormatter={(v: number) =>
                      chart.prefix
                        ? `${chart.prefix}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                        : `${v}${chart.unit || ''}`
                    }
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number) => [
                      `${chart.prefix || ''}${value.toLocaleString()}${chart.unit || ''}`,
                      chart.title,
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={chart.color}
                    strokeWidth={2}
                    dot={{ fill: chart.color, r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
}
