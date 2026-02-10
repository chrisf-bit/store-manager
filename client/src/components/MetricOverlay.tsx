import type { Metrics } from 'shared';

interface MetricNotification {
  id: string;
  label: string;
  delta: number;
  isPositive: boolean;
}

interface MetricOverlayProps {
  roundNumber: number;
  notifications: MetricNotification[];
  onClose: () => void;
}

const METRIC_LABELS: Record<keyof Metrics, string> = {
  revenue: 'Revenue',
  grossMarginPct: 'Gross Margin',
  labourCostPct: 'Labour Cost',
  wastePct: 'Waste',
  shrinkPct: 'Shrink',
  netProfit: 'Net Profit',
  customerSatisfaction: 'Customer Satisfaction',
  complaintsCount: 'Complaints',
  loyaltyIndex: 'Loyalty Index',
  engagementScore: 'Engagement',
  absenceRatePct: 'Absence Rate',
  attritionRisk: 'Attrition Risk',
  availabilityPct: 'Availability',
  queueTimeMins: 'Queue Time',
  complianceScore: 'Compliance',
  footfall: 'Footfall',
  conversion: 'Conversion',
  basketSize: 'Basket Size',
};

/**
 * Lower-is-better metrics: improvement = negative delta
 */
const INVERTED_METRICS = new Set<string>([
  'labourCostPct',
  'wastePct',
  'shrinkPct',
  'complaintsCount',
  'absenceRatePct',
  'attritionRisk',
  'queueTimeMins',
]);

/**
 * Calculate metric notifications from before/after metrics.
 * Only includes metrics that changed.
 */
export function calcNotifications(
  before: Metrics,
  after: Metrics
): MetricNotification[] {
  const notifications: MetricNotification[] = [];
  for (const key of Object.keys(before) as (keyof Metrics)[]) {
    const delta = Math.round((after[key] - before[key]) * 10) / 10;
    if (delta === 0) continue;
    notifications.push({
      id: `${Date.now()}-${key}`,
      label: METRIC_LABELS[key] || key,
      delta,
      isPositive: INVERTED_METRICS.has(key) ? delta < 0 : delta > 0,
    });
  }
  return notifications;
}

export default function MetricOverlay({
  roundNumber,
  notifications,
  onClose,
}: MetricOverlayProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="metric-overlay-backdrop" onClick={onClose}>
      <div
        className="metric-overlay-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Key metric changes this quarter"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-text-primary uppercase tracking-wide">
            Key Metric Changes
          </h2>
          <span className="text-xs text-text-muted bg-brand-600/20 px-3 py-1 rounded-full">
            Q{roundNumber}
          </span>
        </div>

        {/* Animated alert tiles */}
        <div className="flex flex-col gap-2 mb-6">
          {notifications.map((n, i) => {
            const displayDelta = n.delta > 0 ? `+${n.delta}` : `${n.delta}`;

            return (
              <div
                key={n.id}
                className={`metric-overlay-item ${n.isPositive ? 'positive' : 'negative'}`}
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <span className="metric-overlay-label">{n.label}</span>
                <span className={`metric-overlay-delta ${n.isPositive ? 'positive' : 'negative'}`}>
                  {displayDelta}
                </span>
              </div>
            );
          })}
        </div>

        {/* Close button */}
        <button onClick={onClose} className="btn-primary w-full justify-center">
          Continue
        </button>
      </div>
    </div>
  );
}
