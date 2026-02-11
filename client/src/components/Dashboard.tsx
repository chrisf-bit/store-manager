import type { ComponentType } from 'react';
import type { Metrics, RoundState } from 'shared';
import { Wallet, Heart, Users, Settings } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import MetricCard from './MetricCard';
import TrendCharts from './TrendCharts';

interface DashboardProps {
  metrics: Metrics;
  narrative: string;
  roundNumber: number;
  allRoundStates: RoundState[];
  onMakeDecisions: () => void;
}

interface MetricDef {
  key: keyof Metrics;
  category: 'financial' | 'customer' | 'people' | 'operations';
  prefix?: string;
  unit?: string;
}

const METRIC_GROUPS: { title: string; Icon: ComponentType<LucideProps>; metrics: MetricDef[] }[] = [
  {
    title: 'Financial',
    Icon: Wallet,
    metrics: [
      { key: 'revenue', category: 'financial', prefix: '£' },
      { key: 'grossMarginPct', category: 'financial', unit: '%' },
      { key: 'labourCostPct', category: 'financial', unit: '%' },
      { key: 'wastePct', category: 'financial', unit: '%' },
      { key: 'shrinkPct', category: 'financial', unit: '%' },
      { key: 'netProfit', category: 'financial', prefix: '£' },
    ],
  },
  {
    title: 'Customer',
    Icon: Heart,
    metrics: [
      { key: 'customerSatisfaction', category: 'customer' },
      { key: 'complaintsCount', category: 'customer' },
      { key: 'loyaltyIndex', category: 'customer' },
    ],
  },
  {
    title: 'People',
    Icon: Users,
    metrics: [
      { key: 'engagementScore', category: 'people' },
      { key: 'absenceRatePct', category: 'people', unit: '%' },
      { key: 'attritionRisk', category: 'people' },
    ],
  },
  {
    title: 'Operations',
    Icon: Settings,
    metrics: [
      { key: 'availabilityPct', category: 'operations', unit: '%' },
      { key: 'queueTimeMins', category: 'operations', unit: ' mins' },
      { key: 'complianceScore', category: 'operations' },
    ],
  },
];

export default function Dashboard({
  metrics,
  narrative,
  roundNumber,
  allRoundStates,
  onMakeDecisions,
}: DashboardProps) {
  return (
    <div className="animate-fadeIn">
      {/* Narrative */}
      <div className="bg-surface-light border border-border rounded-xl p-4 md:p-6 mb-6">
        <div
          className="text-sm md:text-base text-text-secondary leading-relaxed prose-strong:text-text-primary"
          dangerouslySetInnerHTML={{
            __html: narrative
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\n/g, '<br/>'),
          }}
        />
      </div>

      {/* Trend charts (only show after round 1) */}
      {allRoundStates.length > 1 && (
        <TrendCharts roundStates={allRoundStates} />
      )}

      {/* Metric groups */}
      <div className="space-y-6">
        {METRIC_GROUPS.map((group) => (
          <div key={group.title}>
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
              <group.Icon size={16} className="text-text-muted" /> {group.title}
            </h3>
            <div className="metrics-grid">
              {group.metrics.map((m) => (
                <MetricCard
                  key={m.key}
                  label={m.key}
                  value={metrics[m.key]}
                  prefix={m.prefix}
                  unit={m.unit}
                  category={m.category}
                  compact
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Action */}
      <div className="mt-8 flex justify-center">
        <button onClick={onMakeDecisions} className="btn-primary text-lg">
          Make Decisions for Week {roundNumber + 1}
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
