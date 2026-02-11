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

  // Only show top metric changes to avoid scrolling
  const topDeltas = sortedDeltas.slice(0, 6);

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">Week {roundNumber} Results</h2>
        {event?.eventTemplate && (
          <span className="text-xs font-semibold text-warning bg-warning/10 px-3 py-1 rounded-full">
            Event: {event.eventTemplate.title}
          </span>
        )}
      </div>

      {/* Narrative - compact */}
      <div className="bg-surface-light border border-border rounded-xl p-4 mb-4">
        <div
          className="text-sm text-text-secondary leading-relaxed prose-strong:text-text-primary"
          dangerouslySetInnerHTML={{
            __html: explanation
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\n/g, '<br/>'),
          }}
        />
      </div>

      {/* Decisions + Metric changes side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Your decisions recap */}
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            Your Decisions
          </h3>
          <div className="flex flex-col gap-1.5">
            {result.decisions.map((dec) => (
              <div
                key={dec.decisionTemplateId}
                className="bg-surface-light border border-border rounded-lg px-3 py-2 flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs text-text-muted">{getTemplateTitle(dec.decisionTemplateId)}: </span>
                  <span className="text-xs font-medium">{getDecisionLabel(dec.decisionTemplateId, dec.optionKey)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Metric changes */}
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            Key Metric Changes
          </h3>
          {topDeltas.length === 0 ? (
            <p className="text-xs text-text-muted">No significant changes this round.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {topDeltas.map(([key, delta]) => {
                const isInverse = INVERSE_METRICS.has(key);
                const isGood = (delta > 0 && !isInverse) || (delta < 0 && isInverse);
                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                      isGood
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-red-500/5 border-red-500/20'
                    }`}
                  >
                    <span className="text-xs text-text-secondary">{formatLabel(key)}</span>
                    <span
                      className={`text-xs font-bold ${
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
      </div>

      {/* Continue */}
      <div className="flex justify-center">
        <button onClick={onContinue} className="btn-primary">
          {isLastRound ? 'View Final Scorecard' : `Continue to Week ${roundNumber + 1}`}
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
