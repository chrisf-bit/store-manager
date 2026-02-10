import { forwardRef, useEffect, useState } from 'react';

type GuidePhase = 'plan' | 'execute' | 'reflect';
type GamePhase = 'intro' | 'active' | 'results' | 'end';

interface GuidePanelProps {
  currentRound: number;
  guidePhase: GuidePhase;
  gamePhase: GamePhase;
  isOpen: boolean;
  onToggle: () => void;
}

const PHASE_ORDER: GuidePhase[] = ['plan', 'execute', 'reflect'];

function isPhaseDone(current: GuidePhase, check: GuidePhase): boolean {
  return PHASE_ORDER.indexOf(check) < PHASE_ORDER.indexOf(current);
}

interface GuideContent {
  title: string;
  content: string;
  tip?: string;
}

function getGuideContent(round: number, guidePhase: GuidePhase, gamePhase: GamePhase): GuideContent {
  if (gamePhase === 'intro') {
    return {
      title: 'Welcome, Store Manager',
      content: 'You\'ve just been appointed as store manager at FreshWay Markets. Review your starting metrics to understand the current state of your store across financial performance, customer satisfaction, team engagement, and operations.',
      tip: 'Pay attention to all four metric categories. A successful store manager balances them all.',
    };
  }

  if (gamePhase === 'end') {
    return {
      title: 'Performance Review',
      content: 'Your balanced scorecard shows how well you managed across all four dimensions. A "Ready" or "High Performing" grade means you balanced all areas well.',
      tip: 'Download the JSON report for a detailed breakdown of every round, decision, and event.',
    };
  }

  const weekNum = round + 1;

  if (guidePhase === 'plan') {
    const planContent: Record<number, GuideContent> = {
      1: {
        title: `Week ${weekNum} — Plan`,
        content: 'Review your current metrics and read through this week\'s scenarios. Each scenario presents a realistic management challenge — think about the trade-offs before deciding.',
        tip: 'Check the Metrics tab to see where your store stands. Understanding your position helps you make better scenario choices.',
      },
      2: {
        title: `Week ${weekNum} — Plan`,
        content: 'You\'re building momentum. Review how your metrics shifted last week and read this week\'s new scenarios carefully. Your decisions are starting to compound.',
        tip: 'Watch your trends in the Charts tab. Consistent small improvements compound over 4 rounds.',
      },
      3: {
        title: `Week ${weekNum} — Plan`,
        content: 'You\'re under pressure now. Check where your biggest gaps are — compliance, engagement, satisfaction, profitability? This week\'s scenarios will test your priorities.',
        tip: 'Think about what your scorecard will look like. Balance is key to a good grade.',
      },
      4: {
        title: `Week ${weekNum} — Final Plan`,
        content: 'Last week. Review everything carefully — this is your final chance to influence the outcome. The scenarios this week are about legacy and finishing strong.',
        tip: 'Focus on your weakest scorecard area for maximum impact.',
      },
    };
    return planContent[weekNum] || planContent[1];
  }

  if (guidePhase === 'execute') {
    return {
      title: `Week ${weekNum} — Execute`,
      content: 'Select your responses to each scenario and make your 4 operational decisions. There\'s no single "right" answer — think about what your store needs most right now.',
      tip: 'Don\'t forget to check both the Scenarios and Decisions tabs. You need to complete both to submit.',
    };
  }

  // reflect
  const reflectContent: Record<number, GuideContent> = {
    1: {
      title: `Week ${weekNum} — Reflect`,
      content: 'Your first week\'s results are in. Green numbers are improvements, red numbers show deterioration. Look at the metric changes to understand cause and effect.',
    },
    2: {
      title: `Week ${weekNum} — Reflect`,
      content: 'Halfway through. Are you seeing the trade-offs from your decisions? Check the Charts tab to see your trajectory over time.',
    },
    3: {
      title: `Week ${weekNum} — Reflect`,
      content: 'Third week done. Your trends are established now. One round left — use these results to plan your final approach.',
    },
    4: {
      title: `Week ${weekNum} — Final Reflect`,
      content: 'That\'s your final week complete! Head to the Results tab to see the full impact, then continue to your performance review and scorecard.',
    },
  };
  return reflectContent[weekNum] || reflectContent[1];
}

const GuidePanel = forwardRef<HTMLElement, GuidePanelProps>(function GuidePanel({ currentRound, guidePhase, gamePhase, isOpen, onToggle }, ref) {
  const [content, setContent] = useState<GuideContent>(() =>
    getGuideContent(currentRound, guidePhase, gamePhase)
  );

  useEffect(() => {
    setContent(getGuideContent(currentRound, guidePhase, gamePhase));
  }, [currentRound, guidePhase, gamePhase]);

  return (
    <aside
      ref={ref}
      className={`guide-panel ${isOpen ? '' : 'collapsed'}`}
      role="complementary"
      aria-label="Round Guide"
    >
      {/* Toggle button — positioned at middle of right edge via CSS */}
      <button
        className="guide-toggle"
        onClick={onToggle}
        aria-label={isOpen ? 'Collapse guide' : 'Expand guide'}
      >
        {isOpen ? '\u2039' : '\u203A'}
      </button>

      {isOpen && (
        <div className="p-5">
          {/* Phase progress: Plan → Execute → Reflect */}
          {gamePhase !== 'intro' && gamePhase !== 'end' && (
            <div className="phase-progress mb-5">
              {PHASE_ORDER.map((p, i) => (
                <div key={p} className="phase-step">
                  <div
                    className={`phase-dot ${
                      guidePhase === p ? 'active' : isPhaseDone(guidePhase, p) ? 'done' : ''
                    }`}
                  >
                    {isPhaseDone(guidePhase, p) ? '\u2713' : i + 1}
                  </div>
                  <span
                    className={`phase-label ${
                      guidePhase === p ? 'active' : isPhaseDone(guidePhase, p) ? 'done' : ''
                    }`}
                  >
                    {p === 'plan' ? 'Plan' : p === 'execute' ? 'Execute' : 'Reflect'}
                  </span>
                  {i < 2 && (
                    <div
                      className={`phase-connector ${isPhaseDone(guidePhase, p) ? 'done' : ''}`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Round progress */}
          <div className="round-indicator mb-6 justify-center">
            {[1, 2, 3, 4].map((r, i) => {
              const completed =
                r < currentRound + (gamePhase === 'results' || gamePhase === 'end' ? 1 : 0);
              const current =
                r === currentRound + (gamePhase === 'active' ? 1 : 0) && !completed;
              return (
                <div key={r} className="flex items-center">
                  <div
                    className={`round-dot ${
                      completed ? 'completed' : current ? 'current' : 'upcoming'
                    }`}
                  >
                    {completed ? '\u2713' : `Q${r}`}
                  </div>
                  {i < 3 && (
                    <div className={`round-connector ${completed ? 'completed' : ''}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Content */}
          <div className="animate-fadeIn">
            <h2 className="text-lg font-bold text-text-primary mb-2">{content.title}</h2>
            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              {content.content}
            </p>

            {/* Tip */}
            {content.tip && (
              <div className="bg-brand-600/10 border border-brand-600/20 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <span className="text-brand-400 text-sm mt-0.5">Tip</span>
                  <p className="text-sm text-brand-300 leading-relaxed">{content.tip}</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick reference */}
          <div className="mt-6 pt-4 border-t border-border">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              Quick Reference
            </h3>
            <div className="space-y-2 text-xs text-text-secondary">
              <div className="flex justify-between">
                <span>Revenue</span>
                <span className="text-text-muted">= Footfall x Conversion x Basket</span>
              </div>
              <div className="flex justify-between">
                <span>Net Profit</span>
                <span className="text-text-muted">= Gross - Labour - Waste - Shrink</span>
              </div>
              <div className="flex justify-between">
                <span>Satisfaction</span>
                <span className="text-text-muted">Avail + Queue + Engagement</span>
              </div>
            </div>

            {gamePhase === 'active' && (
              <div className="mt-4 p-3 bg-surface-card border border-border rounded-lg">
                <p className="text-xs text-text-muted">
                  Complete all <strong className="text-text-secondary">Scenarios</strong> and{' '}
                  <strong className="text-text-secondary">Decisions</strong> to submit your week.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collapsed state */}
      {!isOpen && (
        <div className="flex flex-col items-center pt-16 gap-4">
          <div
            className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center font-bold"
            title={`Q${currentRound + 1}`}
          >
            {currentRound + 1 > 4 ? '\u2713' : `Q${currentRound + 1}`}
          </div>
          <div className="text-xs text-text-muted" style={{ writingMode: 'vertical-rl' }}>
            Guide
          </div>
        </div>
      )}
    </aside>
  );
});

export default GuidePanel;
