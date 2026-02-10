import type { Metrics, RoundResult, DecisionTemplate, DecisionOption } from 'shared';
import MetricCard, { formatLabel } from './MetricCard';

interface ResultsProps {
  result: RoundResult;
  decisionTemplates: DecisionTemplate[];
  roundNumber: number;
  onContinue: () => void;
  isLastRound: boolean;
}

const CATEGORY_FOR_METRIC: Record<string, 'financial' | 'customer' | 'people' | 'operations'> = {
  revenue: 'financial',
  grossMarginPct: 'financial',
  labourCostPct: 'financial',
  wastePct: 'financial',
  shrinkPct: 'financial',
  netProfit: 'financial',
  availabilityPct: 'operations',
  queueTimeMins: 'operations',
  complianceScore: 'operations',
  engagementScore: 'people',
  absenceRatePct: 'people',
  attritionRisk: 'people',
  customerSatisfaction: 'customer',
  complaintsCount: 'customer',
  loyaltyIndex: 'customer',
  footfall: 'financial',
  conversion: 'operations',
  basketSize: 'financial',
};

const INVERSE_METRICS = new Set([
  'wastePct', 'shrinkPct', 'queueTimeMins', 'absenceRatePct', 'attritionRisk', 'complaintsCount',
]);

export default function Results({
  result,
  decisionTemplates,
  roundNumber,
  onContinue,
  isLastRound,
}: ResultsProps) {
  const { metricDeltas, event, explanation } = result;

  // Sort deltas by absolute magnitude
  const sortedDeltas = Object.entries(metricDeltas as Record<string, number>)
    .filter(([, v]) => Math.abs(v) > 0.01)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

  // Get decision labels
  const getDecisionLabel = (templateId: string, optionKey: string) => {
    const template = decisionTemplates.find((t) => t.id === templateId);
    if (!template) return optionKey;
    const option = (template.options as DecisionOption[]).find((o) => o.key === optionKey);
    return option?.label || optionKey;
  };

  const getTemplateTitle = (templateId: string) => {
    const template = decisionTemplates.find((t) => t.id === templateId);
    return template?.title || 'Unknown';
  };

  return (
    <div className="animate-fadeIn">
      <h2 className="text-xl font-bold mb-2">Week {roundNumber} Results</h2>
      <p className="text-sm text-text-secondary mb-6">
        Here's how your store performed this week.
      </p>

      {/* Narrative */}
      <div className="bg-surface-light border border-border rounded-xl p-4 md:p-6 mb-6">
        <div
          className="text-sm text-text-secondary leading-relaxed prose-strong:text-text-primary"
          dangerouslySetInnerHTML={{
            __html: explanation
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\n/g, '<br/>'),
          }}
        />
      </div>

      {/* Event */}
      {event?.eventTemplate && (
        <div className="event-card mb-6 animate-slideUp">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">⚡</span>
            <h3 className="font-bold text-warning">{event.eventTemplate.title}</h3>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            {event.eventTemplate.description}
          </p>
        </div>
      )}

      {/* Your decisions recap */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
          Your Decisions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {result.decisions.map((dec) => (
            <div
              key={dec.decisionTemplateId}
              className="bg-surface-light border border-border rounded-lg px-4 py-3 flex items-center gap-3"
            >
              <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs text-text-muted truncate">{getTemplateTitle(dec.decisionTemplateId)}</div>
                <div className="text-sm font-medium truncate">{getDecisionLabel(dec.decisionTemplateId, dec.optionKey)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Metric changes */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
          Metric Changes
        </h3>
        {sortedDeltas.length === 0 ? (
          <p className="text-sm text-text-muted">No significant changes this round.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 stagger-children">
            {sortedDeltas.map(([key, delta]) => {
              const isInverse = INVERSE_METRICS.has(key);
              const isGood = (delta > 0 && !isInverse) || (delta < 0 && isInverse);
              return (
                <div
                  key={key}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                    isGood
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-red-500/5 border-red-500/20'
                  }`}
                >
                  <span className="text-sm text-text-secondary">{formatLabel(key)}</span>
                  <span
                    className={`text-sm font-bold ${
                      isGood ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {delta > 0 ? '+' : ''}
                    {Math.abs(delta) < 1 ? delta.toFixed(1) : Math.round(delta)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Continue */}
      <div className="mt-8 flex justify-center">
        <button onClick={onContinue} className="btn-primary text-lg">
          {isLastRound ? 'View Final Scorecard' : `Continue to Week ${roundNumber + 1}`}
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
