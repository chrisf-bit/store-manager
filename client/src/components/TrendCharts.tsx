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

export default function TrendCharts({ roundStates }: TrendChartsProps) {
  const sorted = [...roundStates].sort((a, b) => a.roundNumber - b.roundNumber);

  const profitData = sorted.map((rs) => ({
    name: rs.roundNumber === 0 ? 'Start' : `Wk ${rs.roundNumber}`,
    'Net Profit': (rs.metrics as Metrics).netProfit,
    Revenue: (rs.metrics as Metrics).revenue,
  }));

  const satisfactionData = sorted.map((rs) => ({
    name: rs.roundNumber === 0 ? 'Start' : `Wk ${rs.roundNumber}`,
    Satisfaction: (rs.metrics as Metrics).customerSatisfaction,
    Engagement: (rs.metrics as Metrics).engagementScore,
    Compliance: (rs.metrics as Metrics).complianceScore,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Profit trend */}
      <div className="bg-surface-light border border-border rounded-xl p-4">
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
          Financial Trend
        </h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={profitData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} width={55} />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="Net Profit"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="Revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                yAxisId={0}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Satisfaction trend */}
      <div className="bg-surface-light border border-border rounded-xl p-4">
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
          People & Customer Trend
        </h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={satisfactionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[0, 100]} width={35} />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Line type="monotone" dataKey="Satisfaction" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
              <Line type="monotone" dataKey="Engagement" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#a855f7', r: 4 }} />
              <Line type="monotone" dataKey="Compliance" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
