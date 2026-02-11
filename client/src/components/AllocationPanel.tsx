import { useState } from 'react';
import type { AllocationTemplate } from 'shared';

interface AllocationPanelProps {
  templates: AllocationTemplate[];
  roundNumber: number;
  allocations: Record<string, Record<string, number>>;
  onAllocate: (templateId: string, allocations: Record<string, number>) => void;
  onAllComplete?: () => void;
}

const CATEGORY_META: Record<string, { icon: string }> = {
  budget: { icon: '💰' },
  time: { icon: '🕐' },
};

export default function AllocationPanel({
  templates,
  roundNumber,
  allocations,
  onAllocate,
  onAllComplete,
}: AllocationPanelProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());

  if (templates.length === 0) return null;

  const template = templates[currentIndex];
  const meta = CATEGORY_META[template.category];
  const isConfirmed = confirmed.has(template.id);
  const allDone = templates.every((t) => confirmed.has(t.id));

  // Current allocations for this template
  const current = allocations[template.id] || {};
  const totalAllocated = Object.values(current).reduce((sum, v) => sum + v, 0);
  const remaining = template.total - totalAllocated;

  const handleChange = (itemKey: string, delta: number) => {
    if (isConfirmed) return;
    const currentVal = current[itemKey] || 0;
    const newVal = Math.max(0, currentVal + delta);
    const newTotal = totalAllocated - currentVal + newVal;
    if (newTotal > template.total) return;

    onAllocate(template.id, { ...current, [itemKey]: newVal });
  };

  const handleSlider = (itemKey: string, rawValue: number) => {
    if (isConfirmed) return;
    // Snap to nearest step
    const snapped = Math.round(rawValue / template.step) * template.step;
    const currentVal = current[itemKey] || 0;
    const otherTotal = totalAllocated - currentVal;
    const maxAllowed = template.total - otherTotal;
    const clamped = Math.min(Math.max(0, snapped), maxAllowed);

    onAllocate(template.id, { ...current, [itemKey]: clamped });
  };

  const handleConfirm = () => {
    const newConfirmed = new Set(confirmed);
    newConfirmed.add(template.id);
    setConfirmed(newConfirmed);

    if (currentIndex < templates.length - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 300);
    } else {
      const willBeAllDone = templates.every(
        (t) => t.id === template.id || newConfirmed.has(t.id)
      );
      if (willBeAllDone && onAllComplete) {
        setTimeout(() => onAllComplete(), 500);
      }
    }
  };

  const goTo = (idx: number) => setCurrentIndex(idx);

  const formatValue = (value: number) => {
    if (template.unit === '£') return `£${value.toLocaleString()}`;
    return `${value} ${template.unit}`;
  };

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold">Week {roundNumber} Allocations</h2>
          <p className="text-sm text-text-secondary mt-1">
            Allocation {currentIndex + 1} of {templates.length}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-5">
        {templates.map((t, i) => {
          const isDone = confirmed.has(t.id);
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

      {/* Current allocation card */}
      <div key={template.id} className="animate-fadeIn">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">{meta?.icon}</span>
          <div>
            <h3 className="text-base font-bold">{template.title}</h3>
            <p className="text-xs text-text-muted">{template.description}</p>
          </div>
        </div>

        {/* Remaining indicator */}
        <div className="flex items-center justify-between mb-4 px-3 py-2 bg-surface-light border border-border rounded-lg">
          <span className="text-sm text-text-secondary">
            Total: <strong className="text-text-primary">{formatValue(template.total)}</strong>
          </span>
          <span className={`text-sm font-bold ${remaining === 0 ? 'text-emerald-400' : remaining < 0 ? 'text-red-400' : 'text-amber-400'}`}>
            {remaining === 0 ? 'Fully allocated' : `${formatValue(remaining)} remaining`}
          </span>
        </div>

        {/* Allocation items */}
        <div className="flex flex-col gap-3">
          {template.items.map((item) => {
            const value = current[item.key] || 0;
            const pct = template.total > 0 ? (value / template.total) * 100 : 0;

            return (
              <div
                key={item.key}
                className={`bg-surface-light border rounded-lg px-4 py-3 ${
                  isConfirmed ? 'border-border opacity-80' : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="text-sm font-semibold">{item.label}</span>
                    <p className="text-xs text-text-muted">{item.description}</p>
                  </div>
                  <span className="text-sm font-bold text-brand-400 ml-3 whitespace-nowrap">
                    {formatValue(value)}
                  </span>
                </div>

                {/* Slider row with +/- buttons */}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => handleChange(item.key, -template.step)}
                    disabled={isConfirmed || value <= 0}
                    className="w-7 h-7 rounded-md bg-surface border border-border flex items-center justify-center text-text-secondary hover:bg-surface-lighter disabled:opacity-30 transition-colors flex-shrink-0"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={template.total}
                    step={template.step}
                    value={value}
                    disabled={isConfirmed}
                    onChange={(e) => handleSlider(item.key, Number(e.target.value))}
                    className="allocation-slider flex-1"
                    style={{
                      '--slider-pct': `${pct}%`,
                    } as React.CSSProperties}
                  />
                  <button
                    onClick={() => handleChange(item.key, template.step)}
                    disabled={isConfirmed || remaining <= 0}
                    className="w-7 h-7 rounded-md bg-surface border border-border flex items-center justify-center text-text-secondary hover:bg-surface-lighter disabled:opacity-30 transition-colors flex-shrink-0"
                  >
                    +
                  </button>
                </div>
              </div>
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
                className="btn-primary text-sm"
              >
                Confirm Allocation
              </button>
            ) : currentIndex < templates.length - 1 ? (
              <button
                onClick={() => goTo(currentIndex + 1)}
                className="btn-primary text-sm"
              >
                Next Allocation
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : allDone ? (
              <span className="text-sm text-brand-400 font-semibold">All allocations set</span>
            ) : null}
          </div>
        </div>
      </div>

      {/* All done message */}
      {allDone && (
        <div className="mt-5 p-4 bg-brand-600/10 border border-brand-600/20 rounded-lg text-center animate-fadeIn">
          <p className="text-sm text-brand-300">
            Budget and time fully allocated. Submitting your week...
          </p>
        </div>
      )}
    </div>
  );
}
