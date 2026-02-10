import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type {
  SimulationRun,
  RoundState,
  DecisionTemplate,
  RoundResult,
  Metrics,
  Scenario,
} from 'shared';
import { api } from '../api';
import GuidePanel from '../components/GuidePanel';
import { TutorialPrompt, TutorialOverlay, TUTORIAL_STEPS } from '../components/Tutorial';
import type { TutorialRefMap } from '../components/Tutorial';
import ScenarioPanel from '../components/ScenarioPanel';
import Decisions from '../components/Decisions';
import Results from '../components/Results';
import EndSummary from '../components/EndSummary';
import MetricCard from '../components/MetricCard';
import TrendCharts from '../components/TrendCharts';
import MetricOverlay, { calcNotifications } from '../components/MetricOverlay';

type GamePhase = 'intro' | 'active' | 'results' | 'end';
type ActiveTab = 'scenarios' | 'decisions' | 'metrics' | 'charts' | 'results';
type GuidePhase = 'plan' | 'execute' | 'reflect';

/* ---------- Metric definitions for the Metrics tab ---------- */
interface MetricDef {
  key: keyof Metrics;
  category: 'financial' | 'customer' | 'people' | 'operations';
  prefix?: string;
  unit?: string;
}

const METRIC_GROUPS: { title: string; icon: string; metrics: MetricDef[] }[] = [
  {
    title: 'Financial',
    icon: '💰',
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
    icon: '😊',
    metrics: [
      { key: 'customerSatisfaction', category: 'customer' },
      { key: 'complaintsCount', category: 'customer' },
      { key: 'loyaltyIndex', category: 'customer' },
    ],
  },
  {
    title: 'People',
    icon: '👥',
    metrics: [
      { key: 'engagementScore', category: 'people' },
      { key: 'absenceRatePct', category: 'people', unit: '%' },
      { key: 'attritionRisk', category: 'people' },
    ],
  },
  {
    title: 'Operations',
    icon: '⚙️',
    metrics: [
      { key: 'availabilityPct', category: 'operations', unit: '%' },
      { key: 'queueTimeMins', category: 'operations', unit: ' mins' },
      { key: 'complianceScore', category: 'operations' },
    ],
  },
];

export default function Game() {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();

  /* ---- Core state ---- */
  const [run, setRun] = useState<SimulationRun | null>(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [activeTab, setActiveTab] = useState<ActiveTab>('scenarios');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* ---- Round data ---- */
  const [allRoundStates, setAllRoundStates] = useState<RoundState[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<Metrics | null>(null);
  const [narrative, setNarrative] = useState('');
  const [decisionTemplates, setDecisionTemplates] = useState<DecisionTemplate[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);

  /* ---- Selection state ---- */
  const [decisionSelections, setDecisionSelections] = useState<Record<string, string>>({});
  const [scenarioSelections, setScenarioSelections] = useState<Record<string, number>>({});

  /* ---- UI state ---- */
  const [guideOpen, setGuideOpen] = useState(
    typeof window !== 'undefined' && window.innerWidth >= 1024
  );
  const [showTutorialPrompt, setShowTutorialPrompt] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showMetricOverlay, setShowMetricOverlay] = useState(false);
  const [metricNotifications, setMetricNotifications] = useState<
    { id: string; label: string; delta: number; isPositive: boolean }[]
  >([]);

  /* ---- Tutorial refs ---- */
  const guidePanelRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const tutorialRefMap: TutorialRefMap = useMemo(
    () => ({
      guide: guidePanelRef,
      header: headerRef,
      tabs: tabBarRef,
      content: contentRef,
      footer: footerRef,
    }),
    []
  );

  /* ---- Derived ---- */
  const guidePhase: GuidePhase =
    phase === 'results'
      ? 'reflect'
      : phase === 'active' && (activeTab === 'decisions' || activeTab === 'scenarios')
        ? 'execute'
        : 'plan';

  const decisionCount = Object.keys(decisionSelections).length;
  const scenarioCount = Object.keys(scenarioSelections).length;
  const allDecisionsSelected =
    decisionTemplates.length > 0 && decisionTemplates.every((t) => decisionSelections[t.id]);
  const allScenariosSelected =
    scenarios.length === 0 || scenarios.every((s) => scenarioSelections[s.id] !== undefined);
  const canSubmit = allDecisionsSelected && allScenariosSelected;

  /* ---- Load round data ---- */
  const loadRound = useCallback(
    async (roundNumber: number) => {
      if (!runId) return;
      try {
        const data = await api.getRound(runId, roundNumber);
        setDecisionTemplates(data.decisions);
        setScenarios(data.scenarios || []);
        setCurrentMetrics(data.roundState.metrics);
        setNarrative(data.roundState.narrativeText);

        setAllRoundStates((prev) => {
          const existing = prev.filter((rs) => rs.roundNumber !== roundNumber);
          return [...existing, data.roundState].sort((a, b) => a.roundNumber - b.roundNumber);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load round data');
      }
    },
    [runId]
  );

  /* ---- Initial load ---- */
  useEffect(() => {
    if (!runId) return;

    const init = async () => {
      try {
        const runData = await api.getRun(runId);
        setRun(runData);
        setCurrentRound(runData.currentRound);

        if (runData.status === 'completed') {
          for (let i = 0; i <= runData.currentRound; i++) {
            await loadRound(i);
          }
          setPhase('end');
          setShowTutorialPrompt(false);
        } else {
          await loadRound(runData.currentRound);
          setPhase(runData.currentRound === 0 ? 'intro' : 'active');
          if (runData.currentRound > 0) setActiveTab('scenarios');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load simulation');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [runId, loadRound]);

  /* ---- Begin week (from intro phase) ---- */
  const handleBeginWeek = () => {
    setDecisionSelections({});
    setScenarioSelections({});
    setActiveTab(scenarios.length > 0 ? 'scenarios' : 'decisions');
    setPhase('active');
  };

  /* ---- Tutorial handlers ---- */
  const handleStartTutorial = () => {
    setShowTutorialPrompt(false);
    // Enter active phase so all UI elements (tabs, footer) are visible
    handleBeginWeek();
    setTutorialStep(0);
    setShowTutorial(true);
  };

  const handleTutorialNext = () => {
    if (tutorialStep < TUTORIAL_STEPS.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      setShowTutorial(false);
    }
  };

  const handleTutorialPrev = () => {
    if (tutorialStep > 0) setTutorialStep(tutorialStep - 1);
  };

  const handleTutorialSkip = () => {
    setShowTutorial(false);
  };

  /* ---- Submit decisions + scenarios ---- */
  const handleSubmit = async () => {
    if (!runId || !canSubmit) return;
    setSubmitting(true);
    setError('');

    try {
      const nextRound = currentRound + 1;
      const decisions = decisionTemplates.map((t) => ({
        decisionTemplateId: t.id,
        optionKey: decisionSelections[t.id],
      }));
      const scenarioSels = scenarios.map((s) => ({
        scenarioId: s.id,
        optionIndex: scenarioSelections[s.id],
      }));

      const result = await api.submitDecisions(runId, nextRound, {
        decisions,
        scenarioSelections: scenarioSels.length > 0 ? scenarioSels : undefined,
      });

      setLastResult(result);
      setAllRoundStates((prev) => {
        const existing = prev.filter((rs) => rs.roundNumber !== nextRound);
        return [...existing, result.roundState].sort((a, b) => a.roundNumber - b.roundNumber);
      });

      setCurrentRound(nextRound);
      setCurrentMetrics(result.roundState.metrics);

      // Calculate and show metric changes overlay
      const notifications = calcNotifications(
        result.previousState.metrics,
        result.roundState.metrics
      );
      if (notifications.length > 0) {
        setMetricNotifications(notifications);
        setShowMetricOverlay(true);
      }

      setPhase('results');
      setActiveTab('results');

      const updatedRun = await api.getRun(runId);
      setRun(updatedRun);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit decisions');
    } finally {
      setSubmitting(false);
    }
  };

  /* ---- Continue to next round ---- */
  const handleContinue = async () => {
    if (currentRound >= 4) {
      setPhase('end');
    } else {
      await loadRound(currentRound);
      setDecisionSelections({});
      setScenarioSelections({});
      setActiveTab('scenarios');
      setPhase('active');
    }
  };

  /* ---- Tab configuration ---- */
  const getTabs = (): { key: ActiveTab; label: string; badge?: string; pulse?: boolean }[] => {
    if (phase === 'results') {
      return [
        { key: 'results', label: 'Results' },
        { key: 'metrics', label: 'Metrics' },
        ...(allRoundStates.length > 1
          ? [{ key: 'charts' as ActiveTab, label: 'Charts' }]
          : []),
      ];
    }
    if (phase === 'active') {
      const tabs: { key: ActiveTab; label: string; badge?: string; pulse?: boolean }[] = [];
      if (scenarios.length > 0) {
        tabs.push({
          key: 'scenarios',
          label: 'Scenarios',
          badge: `${scenarioCount}/${scenarios.length}`,
        });
      }
      tabs.push({
        key: 'decisions',
        label: 'Decisions',
        badge: `${decisionCount}/${decisionTemplates.length}`,
      });
      tabs.push({ key: 'metrics', label: 'Metrics', pulse: true });
      if (allRoundStates.length > 1) {
        tabs.push({ key: 'charts', label: 'Charts' });
      }
      return tabs;
    }
    return [];
  };

  /* ---- Loading / error screens ---- */
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-3 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mb-4" />
          <p className="text-text-secondary">Loading your store...</p>
        </div>
      </div>
    );
  }

  if (error && !run) {
    return (
      <div className="h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-danger text-lg mb-4">{error}</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const tabs = getTabs();

  return (
    <div className="h-screen flex" id="main-content">
      {/* Tutorial prompt */}
      {showTutorialPrompt && phase === 'intro' && currentRound === 0 && (
        <TutorialPrompt
          onStart={handleStartTutorial}
          onSkip={() => setShowTutorialPrompt(false)}
        />
      )}

      {/* Metric changes overlay */}
      {showMetricOverlay && (
        <MetricOverlay
          roundNumber={currentRound}
          notifications={metricNotifications}
          onClose={() => setShowMetricOverlay(false)}
        />
      )}

      {/* Tutorial overlay (pinned tiles) */}
      {showTutorial && (
        <TutorialOverlay
          step={tutorialStep}
          refMap={tutorialRefMap}
          onNext={handleTutorialNext}
          onPrev={handleTutorialPrev}
          onSkip={handleTutorialSkip}
        />
      )}

      {/* Guide Panel */}
      <GuidePanel
        ref={guidePanelRef}
        currentRound={currentRound}
        guidePhase={guidePhase}
        gamePhase={phase}
        isOpen={guideOpen}
        onToggle={() => setGuideOpen(!guideOpen)}
      />

      {/* Mobile guide backdrop */}
      <div
        className={`guide-backdrop ${guideOpen ? 'visible' : ''}`}
        onClick={() => setGuideOpen(false)}
      />

      {/* Mobile guide toggle */}
      <button
        className="mobile-guide-btn"
        onClick={() => setGuideOpen(!guideOpen)}
        aria-label="Toggle guide panel"
      >
        {guideOpen ? '\u2715' : '\u2630'}
      </button>

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header ref={headerRef} className="flex-shrink-0 bg-surface/90 backdrop-blur-sm border-b border-border px-4 md:px-6 py-3 z-20">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">SM</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold truncate">
                  {run?.storeName || 'FreshWay Markets'}
                </h1>
                <p className="text-xs text-text-muted">
                  {run?.storeSize &&
                    `${run.storeSize.charAt(0).toUpperCase() + run.storeSize.slice(1)} store`}
                  {run?.region && ` \u00B7 ${run.region}`}
                </p>
              </div>
            </div>

            {/* Round progress */}
            {phase !== 'end' && (
              <div className="round-indicator">
                {[1, 2, 3, 4].map((r, i) => (
                  <div key={r} className="flex items-center">
                    <div
                      className={`round-dot text-xs ${
                        r <= currentRound
                          ? 'completed'
                          : r === currentRound + 1 && phase === 'active'
                            ? 'current'
                            : 'upcoming'
                      }`}
                    >
                      {r <= currentRound ? '\u2713' : `Q${r}`}
                    </div>
                    {i < 3 && (
                      <div
                        className={`round-connector ${r <= currentRound ? 'completed' : ''}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Tab bar */}
        {tabs.length > 0 && (
          <div ref={tabBarRef} className="game-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`game-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                {tab.badge && <span className="tab-badge">{tab.badge}</span>}
                {tab.pulse && <span className="tab-pulse" />}
              </button>
            ))}
          </div>
        )}

        {/* Scrollable content area */}
        <div ref={contentRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
          <div className="max-w-5xl mx-auto">
            {/* Error toast */}
            {error && (
              <div className="bg-danger/10 border border-danger/30 text-danger rounded-lg px-4 py-3 mb-4 text-sm flex items-center justify-between">
                <span>{error}</span>
                <button
                  onClick={() => setError('')}
                  className="text-danger/60 hover:text-danger ml-4"
                >
                  \u2715
                </button>
              </div>
            )}

            {/* ===== INTRO PHASE ===== */}
            {phase === 'intro' && currentMetrics && (
              <div className="animate-fadeIn">
                {/* Narrative */}
                <div className="bg-surface-light border border-border rounded-xl p-4 md:p-6 mb-6">
                  <div
                    className="text-sm md:text-base text-text-secondary leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: narrative
                        .replace(
                          /\*\*(.*?)\*\*/g,
                          '<strong class="text-text-primary">$1</strong>'
                        )
                        .replace(/\n/g, '<br/>'),
                    }}
                  />
                </div>

                {/* Starting metrics */}
                <div className="space-y-5 mb-8">
                  {METRIC_GROUPS.map((group) => (
                    <div key={group.title}>
                      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span>{group.icon}</span> {group.title}
                      </h3>
                      <div className="metrics-grid">
                        {group.metrics.map((m) => (
                          <MetricCard
                            key={m.key}
                            label={m.key}
                            value={currentMetrics[m.key]}
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

                {/* Begin button */}
                <div className="flex justify-center">
                  <button onClick={handleBeginWeek} className="btn-primary text-lg">
                    Begin Week 1
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M7 4L13 10L7 16"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* ===== ACTIVE PHASE — Scenarios tab ===== */}
            {phase === 'active' && activeTab === 'scenarios' && (
              <ScenarioPanel
                scenarios={scenarios}
                selections={scenarioSelections}
                onSelect={(id, idx) =>
                  setScenarioSelections((prev) => ({ ...prev, [id]: idx }))
                }
                narrative={narrative}
                roundNumber={currentRound + 1}
              />
            )}

            {/* ===== ACTIVE PHASE — Decisions tab ===== */}
            {phase === 'active' && activeTab === 'decisions' && (
              <Decisions
                templates={decisionTemplates}
                roundNumber={currentRound + 1}
                selections={decisionSelections}
                onSelect={(id, key) =>
                  setDecisionSelections((prev) => ({ ...prev, [id]: key }))
                }
              />
            )}

            {/* ===== Metrics tab (active + results phases) ===== */}
            {(phase === 'active' || phase === 'results') &&
              activeTab === 'metrics' &&
              currentMetrics && (
                <div className="animate-fadeIn">
                  <div className="mb-5">
                    <h2 className="text-lg font-bold">Store Metrics</h2>
                    <p className="text-sm text-text-secondary mt-1">
                      Current performance across all key indicators. Use these to inform your
                      decisions.
                    </p>
                  </div>
                  <div className="space-y-5">
                    {METRIC_GROUPS.map((group) => (
                      <div key={group.title}>
                        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
                          <span>{group.icon}</span> {group.title}
                        </h3>
                        <div className="metrics-grid">
                          {group.metrics.map((m) => (
                            <MetricCard
                              key={m.key}
                              label={m.key}
                              value={currentMetrics[m.key]}
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
                </div>
              )}

            {/* ===== Charts tab (active + results phases) ===== */}
            {(phase === 'active' || phase === 'results') &&
              activeTab === 'charts' &&
              allRoundStates.length > 1 && (
                <div className="animate-fadeIn">
                  <div className="mb-5">
                    <h2 className="text-lg font-bold">Performance Trends</h2>
                    <p className="text-sm text-text-secondary mt-1">
                      Track how your metrics have changed over time.
                    </p>
                  </div>
                  <TrendCharts roundStates={allRoundStates} />
                </div>
              )}

            {/* ===== RESULTS PHASE — Results tab ===== */}
            {phase === 'results' && activeTab === 'results' && lastResult && (
              <Results
                result={lastResult}
                decisionTemplates={decisionTemplates}
                roundNumber={currentRound}
                onContinue={handleContinue}
                isLastRound={currentRound >= 4}
              />
            )}

            {/* ===== END PHASE ===== */}
            {phase === 'end' && runId && (
              <EndSummary runId={runId} onRestart={() => navigate('/create')} />
            )}
          </div>
        </div>

        {/* Submit footer — during active phase */}
        {phase === 'active' && (
          <div ref={footerRef} className="flex-shrink-0 border-t border-border bg-surface-light/80 backdrop-blur-sm px-4 py-3 z-10">
            <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
              <div className="text-sm text-text-secondary hidden sm:block">
                {scenarios.length > 0 && (
                  <>
                    Scenarios:{' '}
                    <strong className="text-text-primary">
                      {scenarioCount}/{scenarios.length}
                    </strong>
                    {' \u00B7 '}
                  </>
                )}
                Decisions:{' '}
                <strong className="text-text-primary">
                  {decisionCount}/{decisionTemplates.length}
                </strong>
              </div>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="btn-primary"
              >
                {submitting ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Submit Week {currentRound + 1}
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M7 4L13 10L7 16"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
