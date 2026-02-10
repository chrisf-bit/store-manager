import { useState } from 'react';
import type { Scenario } from 'shared';

interface ScenarioPanelProps {
  scenarios: Scenario[];
  selections: Record<string, number>;
  onSelect: (scenarioId: string, optionIndex: number) => void;
  narrative?: string;
  roundNumber: number;
}

const CATEGORY_STYLES: Record<string, string> = {
  people: 'scenario-category people',
  commercial: 'scenario-category commercial',
  operational: 'scenario-category operational',
  leadership: 'scenario-category leadership',
};

export default function ScenarioPanel({
  scenarios,
  selections,
  onSelect,
  narrative,
  roundNumber,
}: ScenarioPanelProps) {
  // Track which scenario we're viewing (stepped flow)
  const [currentIndex, setCurrentIndex] = useState(0);
  // Track local selection before confirming
  const [pendingOption, setPendingOption] = useState<number | null>(null);

  if (scenarios.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">No scenarios for this round.</p>
      </div>
    );
  }

  const allDone = scenarios.every((s) => selections[s.id] !== undefined);
  const scenario = scenarios[currentIndex];
  const isConfirmed = selections[scenario.id] !== undefined;

  const handleConfirm = () => {
    if (pendingOption === null) return;
    onSelect(scenario.id, pendingOption);
    setPendingOption(null);

    // Auto-advance to next unconfirmed scenario after a brief pause
    if (currentIndex < scenarios.length - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 300);
    }
  };

  const goToScenario = (idx: number) => {
    setCurrentIndex(idx);
    setPendingOption(null);
  };

  return (
    <div className="animate-fadeIn">
      {/* Narrative intro — only show on first scenario */}
      {currentIndex === 0 && narrative && (
        <div className="bg-surface-light border border-border rounded-xl p-4 md:p-5 mb-5">
          <div
            className="text-sm text-text-secondary leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: narrative
                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-text-primary">$1</strong>')
                .replace(/\n/g, '<br/>'),
            }}
          />
        </div>
      )}

      {/* Header with progress */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold">Week {roundNumber} Scenarios</h2>
          <p className="text-sm text-text-secondary mt-1">
            Scenario {currentIndex + 1} of {scenarios.length}
          </p>
        </div>
      </div>

      {/* Progress bar — dots for each scenario */}
      <div className="flex items-center gap-2 mb-5" aria-label={`Progress: ${Object.keys(selections).length} of ${scenarios.length} scenarios completed`}>
        {scenarios.map((s, i) => {
          const isDone = selections[s.id] !== undefined;
          const isCurrent = i === currentIndex;
          return (
            <button
              key={s.id}
              onClick={() => goToScenario(i)}
              className="flex items-center gap-2"
              style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
            >
              <div
                style={{
                  width: isCurrent ? 28 : isDone ? 22 : 8,
                  height: 4,
                  borderRadius: 2,
                  background: isDone
                    ? 'var(--color-brand-500)'
                    : isCurrent
                      ? 'var(--color-brand-600)'
                      : 'var(--color-surface-lighter)',
                  transition: 'all 0.3s ease',
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Current scenario card */}
      <div key={scenario.id} className="scenario-card active animate-fadeIn">
        {/* Header */}
        <div className="scenario-header">
          <div className="scenario-delivery">{scenario.delivery}</div>
          <span className={CATEGORY_STYLES[scenario.category] || 'scenario-category'}>
            {scenario.category}
          </span>
          <h3 className="text-base font-bold text-text-primary mt-1">{scenario.title}</h3>
          <p className="text-sm text-text-secondary leading-relaxed mt-2">
            {scenario.description}
          </p>
        </div>

        {/* Options */}
        <div role="radiogroup" aria-label={`Options for ${scenario.title}`}>
          {scenario.options.map((option, idx) => {
            const isSelected = isConfirmed
              ? selections[scenario.id] === idx
              : pendingOption === idx;

            return (
              <div
                key={idx}
                className={`scenario-option ${isSelected ? 'selected' : ''} ${isConfirmed ? 'locked' : ''}`}
                onClick={() => {
                  if (!isConfirmed) setPendingOption(idx);
                }}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !isConfirmed) {
                    e.preventDefault();
                    setPendingOption(idx);
                  }
                }}
              >
                <div className={`scenario-radio ${isSelected ? 'selected' : ''}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-text-primary mb-1">
                    {option.label}
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {option.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Confirm / navigation buttons */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <button
            onClick={() => goToScenario(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="btn-secondary text-sm"
            style={{ opacity: currentIndex === 0 ? 0.3 : 1 }}
          >
            Previous
          </button>

          <div className="flex gap-3">
            {!isConfirmed ? (
              <button
                onClick={handleConfirm}
                disabled={pendingOption === null}
                className="btn-primary text-sm"
              >
                Confirm Decision
              </button>
            ) : currentIndex < scenarios.length - 1 ? (
              <button
                onClick={() => goToScenario(currentIndex + 1)}
                className="btn-primary text-sm"
              >
                Next Scenario
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : allDone ? (
              <span className="text-sm text-brand-400 font-semibold">All scenarios complete</span>
            ) : null}
          </div>
        </div>
      </div>

      {/* All done message */}
      {allDone && (
        <div className="mt-5 p-4 bg-brand-600/10 border border-brand-600/20 rounded-lg text-center animate-fadeIn">
          <p className="text-sm text-brand-300">
            All {scenarios.length} scenarios responded. Switch to the <strong>Decisions</strong> tab to make your operational choices.
          </p>
        </div>
      )}
    </div>
  );
}
