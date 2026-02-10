interface MetricCardProps {
  label: string;
  value: number | string;
  unit?: string;
  prefix?: string;
  delta?: number;
  category: 'financial' | 'customer' | 'people' | 'operations';
  compact?: boolean;
}

const CATEGORY_COLORS = {
  financial: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
  customer: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' },
  people: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
  operations: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
};

// For some metrics, a negative delta is good (waste, shrink, queue, absence, attrition, complaints)
const INVERSE_METRICS = new Set([
  'wastePct', 'shrinkPct', 'queueTimeMins', 'absenceRatePct', 'attritionRisk', 'complaintsCount',
]);

export default function MetricCard({
  label,
  value,
  unit,
  prefix,
  delta,
  category,
  compact,
}: MetricCardProps) {
  const colors = CATEGORY_COLORS[category];
  const isInverse = INVERSE_METRICS.has(label);

  const deltaDisplay =
    delta !== undefined && Math.abs(delta) > 0.01 ? (
      <span
        className={`text-xs font-medium ml-1 ${
          (delta > 0 && !isInverse) || (delta < 0 && isInverse)
            ? 'metric-delta-positive'
            : 'metric-delta-negative'
        }`}
      >
        {delta > 0 ? '+' : ''}
        {typeof delta === 'number' && Math.abs(delta) < 1
          ? delta.toFixed(1)
          : Math.round(delta)}
      </span>
    ) : null;

  if (compact) {
    return (
      <div className={`metric-card ${colors.bg} ${colors.border} p-3`}>
        <div className="text-xs text-text-muted mb-1 truncate">{formatLabel(label)}</div>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold text-text-primary">
            {prefix}{typeof value === 'number' ? formatValue(value) : value}{unit}
          </span>
          {deltaDisplay}
        </div>
      </div>
    );
  }

  return (
    <div className={`metric-card ${colors.bg} ${colors.border}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">
          {formatLabel(label)}
        </span>
        <span className={`text-xs font-medium ${colors.text} px-2 py-0.5 rounded-full ${colors.bg}`}>
          {category}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-text-primary">
          {prefix}{typeof value === 'number' ? formatValue(value) : value}
        </span>
        {unit && <span className="text-sm text-text-muted">{unit}</span>}
        {deltaDisplay}
      </div>
    </div>
  );
}

function formatLabel(key: string): string {
  const labels: Record<string, string> = {
    revenue: 'Revenue',
    grossMarginPct: 'Gross Margin',
    labourCostPct: 'Labour Cost',
    wastePct: 'Waste',
    shrinkPct: 'Shrink',
    netProfit: 'Net Profit',
    availabilityPct: 'Availability',
    queueTimeMins: 'Queue Time',
    complianceScore: 'Compliance',
    engagementScore: 'Engagement',
    absenceRatePct: 'Absence Rate',
    attritionRisk: 'Attrition Risk',
    customerSatisfaction: 'Satisfaction',
    complaintsCount: 'Complaints',
    loyaltyIndex: 'Loyalty',
    footfall: 'Footfall',
    conversion: 'Conversion',
    basketSize: 'Basket Size',
  };
  return labels[key] || key;
}

function formatValue(val: number): string {
  if (val >= 10000) return val.toLocaleString();
  if (val >= 100) return Math.round(val).toString();
  if (Number.isInteger(val)) return val.toString();
  return val.toFixed(1);
}

export { formatLabel };
