import { Router } from 'express';
import { CreateRunSchema, SubmitDecisionsSchema } from 'shared';
import type { Metrics, DecisionTemplate, DecisionOption, EndReport, ScorecardCategory } from 'shared';
import {
  getInitialMetrics,
  resolveRound,
  selectEvent,
  deriveNarrative,
  calculateScorecard,
  calculateGrade,
  generateStrengths,
  generateRisks,
  generateRecommendations,
} from './sim/engine';
import { createRng } from './sim/helpers';
import { getScenariosForRound } from './sim/scenarios';
import { store } from './store';

export const router = Router();

// Helper to safely get a string param
function param(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0] || '';
  return val || '';
}

// POST /runs — Create a new simulation run
router.post('/runs', (req, res) => {
  try {
    const parsed = CreateRunSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const { storeName, storeSize, region } = parsed.data;
    const runSeed = Math.floor(Math.random() * 2147483647);

    const run = store.createRun({
      storeName,
      storeSize,
      region,
      runSeed,
      currentRound: 0,
      status: 'in_progress',
    });

    // Create initial round state (round 0)
    const initialMetrics = getInitialMetrics(storeSize);
    store.addRoundState({
      runId: run.id,
      roundNumber: 0,
      metricsJson: initialMetrics as unknown as Record<string, number>,
      narrativeText: `Welcome to **${storeName}**! You're the new store manager. Your ${storeSize} store in the ${region} region is ready for you to lead. Review your starting metrics and make your first set of decisions.`,
    });

    res.status(201).json({
      ...run,
      currentMetrics: initialMetrics,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create run' });
  }
});

// GET /runs/:id — Get run metadata
router.get('/runs/:id', (req, res) => {
  try {
    const id = param(req.params.id);
    const run = store.getRun(id);
    if (!run) {
      res.status(404).json({ error: 'Run not found' });
      return;
    }
    res.json(run);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch run' });
  }
});

// GET /runs/:id/round/:n — Get round state + available decisions
router.get('/runs/:id/round/:n', (req, res) => {
  try {
    const id = param(req.params.id);
    const roundNumber = parseInt(param(req.params.n), 10);

    const run = store.getRun(id);
    if (!run) {
      res.status(404).json({ error: 'Run not found' });
      return;
    }

    const roundState = store.getRoundState(id, roundNumber);
    if (!roundState) {
      res.status(404).json({ error: 'Round state not found' });
      return;
    }

    // Get decision templates
    const templates = store.getDecisionTemplates();
    const decisions: DecisionTemplate[] = templates.map((dt) => ({
      id: dt.id,
      category: dt.category as DecisionTemplate['category'],
      title: dt.title,
      options: dt.optionsJson,
    }));

    // Get previous round decisions and event if applicable
    let previousDecisions = undefined;
    let previousEvent = undefined;

    if (roundNumber > 0) {
      const prevDecs = store.getDecisionSelections(id, roundNumber);
      if (prevDecs.length > 0) previousDecisions = prevDecs;

      const prevEvt = store.getEventInstance(id, roundNumber);
      if (prevEvt) {
        const et = store.getEventTemplate(prevEvt.eventTemplateId);
        previousEvent = {
          ...prevEvt,
          resolvedEffects: prevEvt.resolvedEffectsJson,
          eventTemplate: et ? { ...et, effects: et.effectsJson } : undefined,
        };
      }
    }

    // Get scenarios for the next round
    const nextRound = roundNumber + 1;
    const scenarios = nextRound <= 4 ? getScenariosForRound(nextRound) : [];

    res.json({
      roundState: {
        id: roundState.id,
        runId: roundState.runId,
        roundNumber: roundState.roundNumber,
        metrics: roundState.metricsJson,
        narrativeText: roundState.narrativeText,
      },
      decisions,
      scenarios,
      previousDecisions,
      previousEvent,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch round data' });
  }
});

// POST /runs/:id/round/:n/decisions — Submit decisions for a round
router.post('/runs/:id/round/:n/decisions', (req, res) => {
  try {
    const id = param(req.params.id);
    const roundNumber = parseInt(param(req.params.n), 10);

    const parsed = SubmitDecisionsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
      return;
    }

    const run = store.getRun(id);
    if (!run) {
      res.status(404).json({ error: 'Run not found' });
      return;
    }

    if (run.status === 'completed') {
      res.status(400).json({ error: 'Run is already completed' });
      return;
    }

    if (roundNumber !== run.currentRound + 1) {
      res.status(400).json({ error: `Expected round ${run.currentRound + 1}, got ${roundNumber}` });
      return;
    }

    if (roundNumber > 4) {
      res.status(400).json({ error: 'Maximum 4 rounds' });
      return;
    }

    // Get current metrics
    const currentRoundState = store.getRoundState(id, run.currentRound);
    if (!currentRoundState) {
      res.status(500).json({ error: 'Current round state not found' });
      return;
    }
    const currentMetrics = currentRoundState.metricsJson as unknown as Metrics;

    // Validate decisions
    const decisionSet: Record<string, string> = {};
    for (const dec of parsed.data.decisions) {
      const template = store.getDecisionTemplate(dec.decisionTemplateId);
      if (!template) {
        res.status(400).json({ error: `Invalid decision template: ${dec.decisionTemplateId}` });
        return;
      }
      if (!template.optionsJson.find((o) => o.key === dec.optionKey)) {
        res.status(400).json({ error: `Invalid option ${dec.optionKey} for template ${template.title}` });
        return;
      }
      decisionSet[template.category] = dec.optionKey;
    }

    for (const cat of ['commercial', 'labour', 'operations', 'investment']) {
      if (!decisionSet[cat]) {
        res.status(400).json({ error: `Missing decision for category: ${cat}` });
        return;
      }
    }

    // Create RNG for this round
    const rng = createRng(run.runSeed + roundNumber * 1000);

    // Select event
    const allEvents = store.getEventTemplates();
    const usedEventIds = store.getEventInstances(id).map((e) => e.eventTemplateId);

    const selectedEvent = selectEvent(
      allEvents.map((e) => ({
        id: e.id,
        category: e.category,
        weightBase: e.weightBase,
        effectsJson: e.effectsJson,
      })),
      currentMetrics,
      rng,
      usedEventIds
    );

    // Collect scenario effects
    const scenarioEffects: Record<string, number> = {};
    const scenarioSelections = parsed.data.scenarioSelections || [];
    const roundScenarios = getScenariosForRound(roundNumber);
    for (const sel of scenarioSelections) {
      const scenario = roundScenarios.find((s) => s.id === sel.scenarioId);
      if (scenario && scenario.options[sel.optionIndex]) {
        const effects = scenario.options[sel.optionIndex].effects;
        for (const [key, val] of Object.entries(effects)) {
          scenarioEffects[key] = (scenarioEffects[key] || 0) + val;
        }
      }
    }

    // Merge scenario effects into event effects for resolution
    const combinedEventEffects = { ...selectedEvent.effectsJson };
    for (const [key, val] of Object.entries(scenarioEffects)) {
      combinedEventEffects[key] = (combinedEventEffects[key] || 0) + val;
    }

    // Resolve the round
    const resolution = resolveRound(
      currentMetrics,
      decisionSet as { commercial: string; labour: string; operations: string; investment: string },
      combinedEventEffects,
      rng
    );

    // Get event template for narrative
    const eventTemplate = allEvents.find((e) => e.id === selectedEvent.id)!;

    // Generate narrative
    const narrative = deriveNarrative(
      resolution.newMetrics,
      currentMetrics,
      { title: eventTemplate.title, description: eventTemplate.description },
      decisionSet as { commercial: string; labour: string; operations: string; investment: string },
      roundNumber
    );

    // Persist
    for (const dec of parsed.data.decisions) {
      store.addDecisionSelection({
        runId: id,
        roundNumber,
        decisionTemplateId: dec.decisionTemplateId,
        optionKey: dec.optionKey,
      });
    }

    const eventInstance = store.addEventInstance({
      runId: id,
      roundNumber,
      eventTemplateId: selectedEvent.id,
      resolvedEffectsJson: resolution.eventEffects,
    });

    const newRoundState = store.addRoundState({
      runId: id,
      roundNumber,
      metricsJson: resolution.newMetrics as unknown as Record<string, number>,
      narrativeText: narrative,
    });

    const isCompleted = roundNumber >= 4;
    store.updateRun(id, {
      currentRound: roundNumber,
      status: isCompleted ? 'completed' : 'in_progress',
    });

    // Return result
    res.json({
      roundState: {
        id: newRoundState.id,
        runId: newRoundState.runId,
        roundNumber: newRoundState.roundNumber,
        metrics: resolution.newMetrics,
        narrativeText: narrative,
      },
      previousState: {
        id: currentRoundState.id,
        runId: currentRoundState.runId,
        roundNumber: currentRoundState.roundNumber,
        metrics: currentMetrics,
        narrativeText: currentRoundState.narrativeText,
      },
      decisions: parsed.data.decisions.map((d) => ({
        ...d,
        id: '',
        runId: id,
        roundNumber,
      })),
      event: {
        id: eventInstance.id,
        runId: id,
        roundNumber,
        eventTemplateId: selectedEvent.id,
        resolvedEffects: resolution.eventEffects,
        eventTemplate: {
          id: eventTemplate.id,
          category: eventTemplate.category,
          title: eventTemplate.title,
          description: eventTemplate.description,
          weightBase: eventTemplate.weightBase,
          effects: eventTemplate.effectsJson,
        },
      },
      metricDeltas: resolution.deltas,
      explanation: narrative,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process round' });
  }
});

// GET /runs/:id/report — Full JSON report
router.get('/runs/:id/report', (req, res) => {
  try {
    const id = param(req.params.id);

    const run = store.getRun(id);
    if (!run) {
      res.status(404).json({ error: 'Run not found' });
      return;
    }

    const roundStates = store.getAllRoundStates(id);
    const decisions = store.getDecisionSelections(id);
    const events = store.getEventInstances(id);

    // Get final metrics
    const finalState = roundStates.find((rs) => rs.roundNumber === run.currentRound);
    if (!finalState) {
      res.status(500).json({ error: 'No final state found' });
      return;
    }

    const finalMetrics = finalState.metricsJson as unknown as Metrics;
    const scorecard = calculateScorecard(finalMetrics);
    const grade = calculateGrade(scorecard.overall);

    const scorecardCategories: ScorecardCategory[] = [
      {
        name: 'Financial',
        score: scorecard.financial,
        metrics: [
          { label: 'Revenue', value: `£${finalMetrics.revenue.toLocaleString()}`, trend: getTrend(roundStates, 'revenue') },
          { label: 'Gross Margin', value: `${finalMetrics.grossMarginPct}%`, trend: getTrend(roundStates, 'grossMarginPct') },
          { label: 'Waste', value: `${finalMetrics.wastePct}%`, trend: getInverseTrend(roundStates, 'wastePct') },
          { label: 'Net Profit', value: `£${finalMetrics.netProfit.toLocaleString()}`, trend: getTrend(roundStates, 'netProfit') },
        ],
      },
      {
        name: 'Customer',
        score: scorecard.customer,
        metrics: [
          { label: 'Satisfaction', value: finalMetrics.customerSatisfaction, trend: getTrend(roundStates, 'customerSatisfaction') },
          { label: 'Loyalty Index', value: finalMetrics.loyaltyIndex, trend: getTrend(roundStates, 'loyaltyIndex') },
          { label: 'Complaints', value: finalMetrics.complaintsCount, trend: getInverseTrend(roundStates, 'complaintsCount') },
        ],
      },
      {
        name: 'People',
        score: scorecard.people,
        metrics: [
          { label: 'Engagement', value: finalMetrics.engagementScore, trend: getTrend(roundStates, 'engagementScore') },
          { label: 'Absence Rate', value: `${finalMetrics.absenceRatePct}%`, trend: getInverseTrend(roundStates, 'absenceRatePct') },
          { label: 'Attrition Risk', value: finalMetrics.attritionRisk, trend: getInverseTrend(roundStates, 'attritionRisk') },
        ],
      },
      {
        name: 'Operations',
        score: scorecard.operations,
        metrics: [
          { label: 'Availability', value: `${finalMetrics.availabilityPct}%`, trend: getTrend(roundStates, 'availabilityPct') },
          { label: 'Queue Time', value: `${finalMetrics.queueTimeMins} mins`, trend: getInverseTrend(roundStates, 'queueTimeMins') },
          { label: 'Compliance', value: finalMetrics.complianceScore, trend: getTrend(roundStates, 'complianceScore') },
        ],
      },
    ];

    const report: EndReport = {
      run: {
        id: run.id,
        createdAt: run.createdAt,
        storeName: run.storeName,
        storeSize: run.storeSize as any,
        region: run.region as any,
        currentRound: run.currentRound,
        status: run.status as any,
        runSeed: run.runSeed,
      },
      grade,
      overallScore: scorecard.overall,
      scorecard: scorecardCategories,
      strengths: generateStrengths(finalMetrics),
      risks: generateRisks(finalMetrics),
      recommendations: generateRecommendations(finalMetrics),
      rounds: roundStates
        .filter((rs) => rs.roundNumber > 0)
        .map((rs) => {
          const roundDecisions = decisions
            .filter((d) => d.roundNumber === rs.roundNumber)
            .map((d) => ({
              id: d.id,
              runId: d.runId,
              roundNumber: d.roundNumber,
              decisionTemplateId: d.decisionTemplateId,
              optionKey: d.optionKey,
            }));
          const roundEvent = events.find((e) => e.roundNumber === rs.roundNumber);
          const et = roundEvent ? store.getEventTemplate(roundEvent.eventTemplateId) : undefined;
          return {
            roundNumber: rs.roundNumber,
            state: {
              id: rs.id,
              runId: rs.runId,
              roundNumber: rs.roundNumber,
              metrics: rs.metricsJson as unknown as Metrics,
              narrativeText: rs.narrativeText,
            },
            decisions: roundDecisions,
            event: roundEvent
              ? {
                  id: roundEvent.id,
                  runId: roundEvent.runId,
                  roundNumber: roundEvent.roundNumber,
                  eventTemplateId: roundEvent.eventTemplateId,
                  resolvedEffects: roundEvent.resolvedEffectsJson,
                  eventTemplate: et
                    ? { id: et.id, category: et.category, title: et.title, description: et.description, weightBase: et.weightBase, effects: et.effectsJson }
                    : undefined!,
                }
              : undefined!,
          };
        }),
    };

    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

function getTrend(
  roundStates: { roundNumber: number; metricsJson: Record<string, number> }[],
  key: string
): 'up' | 'down' | 'flat' {
  if (roundStates.length < 2) return 'flat';
  const sorted = [...roundStates].sort((a, b) => a.roundNumber - b.roundNumber);
  const first = sorted[0].metricsJson[key] ?? 0;
  const last = sorted[sorted.length - 1].metricsJson[key] ?? 0;
  const diff = last - first;
  if (Math.abs(diff) < 0.5) return 'flat';
  return diff > 0 ? 'up' : 'down';
}

function getInverseTrend(
  roundStates: { roundNumber: number; metricsJson: Record<string, number> }[],
  key: string
): 'up' | 'down' | 'flat' {
  const trend = getTrend(roundStates, key);
  if (trend === 'up') return 'down';
  if (trend === 'down') return 'up';
  return 'flat';
}
