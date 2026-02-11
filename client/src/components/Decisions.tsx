import { useState, type ComponentType } from 'react';
import type { DecisionTemplate, DecisionOption } from 'shared';
import { Briefcase, Users, Settings } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface DecisionsProps {
  templates: DecisionTemplate[];
  roundNumber: number;
  selections: Record<string, string>;
  onSelect: (templateId: string, optionKey: string) => void;
  onAllComplete?: () => void;
}

const CATEGORY_LABELS: Record<string, { label: string; Icon: ComponentType<LucideProps>; desc: string }> = {
  commercial: {
    label: 'Commercial Strategy',
    Icon: Briefcase,
    desc: 'How will you position your store in the market this week?',
  },
  labour: {
    label: 'Labour & Staffing',
    Icon: Users,
    desc: 'How will you manage your team\'s hours and capacity?',
  },
  operations: {
    label: 'Operations Focus',
    Icon: Settings,
    desc: 'Where will you direct your operations effort?',
  },
};

const CATEGORY_ORDER = ['commercial', 'labour', 'operations'];

export default function Decisions({
  templates,
  roundNumber,
  selections,
  onSelect,
  onAllComplete,
}: DecisionsProps) {
  const sortedTemplates = [...templates].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [pendingOption, setPendingOption] = useState<string | null>(null);

  if (sortedTemplates.length === 0) return null;

  const template = sortedTemplates[currentIndex];
  const cat = CATEGORY_LABELS[template.category];
  const isConfirmed = !!selections[template.id];
  const allDone = sortedTemplates.every((t) => selections[t.id]);

  const handleConfirm = () => {
    if (pendingOption === null) return;
    onSelect(template.id, pendingOption);
    setPendingOption(null);

    if (currentIndex < sortedTemplates.length - 1) {
      // Auto-advance to next unconfirmed decision
      setTimeout(() => setCurrentIndex(currentIndex + 1), 300);
    } else {
      // Last decision confirmed — notify parent
      const willBeAllDone = sortedTemplates.every(
        (t) => t.id === template.id || selections[t.id]
      );
      if (willBeAllDone && onAllComplete) {
        setTimeout(() => onAllComplete(), 500);
      }
    }
  };

  const goTo = (idx: number) => {
    setCurrentIndex(idx);
    setPendingOption(null);
  };

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold">Week {roundNumber} Decisions</h2>
          <p className="text-sm text-text-secondary mt-1">
            Decision {currentIndex + 1} of {sortedTemplates.length}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-5">
        {sortedTemplates.map((t, i) => {
          const isDone = !!selections[t.id];
          const isCurrent = i === currentIndex;
          return (
            <button
              key={t.id}
              onClick={() => goTo(i)}
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

      {/* Current decision card */}
      <div key={template.id} className="animate-fadeIn">
        <div className="flex items-center gap-2 mb-4">
          {cat && <cat.Icon size={20} className="text-text-secondary flex-shrink-0" />}
          <div>
            <h3 className="text-base font-bold">{cat?.label || template.title}</h3>
            <p className="text-xs text-text-muted">{cat?.desc}</p>
          </div>
        </div>

        <div className="decisions-grid">
          {(template.options as DecisionOption[]).map((option) => {
            const isSelected = isConfirmed
              ? selections[template.id] === option.key
              : pendingOption === option.key;

            return (
              <button
                key={option.key}
                onClick={() => {
                  if (!isConfirmed) setPendingOption(option.key);
                }}
                className={`decision-option text-left ${isSelected ? 'selected' : ''} ${isConfirmed ? 'locked' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border-brand-500 bg-brand-500'
                        : 'border-surface-lighter'
                    }`}
                  >
                    {isSelected && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm mb-1">{option.label}</div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {option.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Confirm / navigation */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <button
            onClick={() => goTo(Math.max(0, currentIndex - 1))}
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
            ) : currentIndex < sortedTemplates.length - 1 ? (
              <button
                onClick={() => goTo(currentIndex + 1)}
                className="btn-primary text-sm"
              >
                Next Decision
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : allDone ? (
              <span className="text-sm text-brand-400 font-semibold">All decisions made</span>
            ) : null}
          </div>
        </div>
      </div>

      {/* All done message */}
      {allDone && (
        <div className="mt-5 p-4 bg-brand-600/10 border border-brand-600/20 rounded-lg text-center animate-fadeIn">
          <p className="text-sm text-brand-300">
            All {sortedTemplates.length} decisions confirmed. You're ready to submit this week.
          </p>
        </div>
      )}
    </div>
  );
}
