import { z } from 'zod';
import {
  StoreSizeSchema,
  RegionSchema,
  RunStatusSchema,
  CreateRunSchema,
  DecisionCategorySchema,
  SubmitDecisionsSchema,
  MetricsSchema,
  GradeSchema,
} from './schemas';

export type StoreSize = z.infer<typeof StoreSizeSchema>;
export type Region = z.infer<typeof RegionSchema>;
export type RunStatus = z.infer<typeof RunStatusSchema>;
export type CreateRunInput = z.infer<typeof CreateRunSchema>;
export type DecisionCategory = z.infer<typeof DecisionCategorySchema>;
export type SubmitDecisionsInput = z.infer<typeof SubmitDecisionsSchema>;
export type Metrics = z.infer<typeof MetricsSchema>;
export type Grade = z.infer<typeof GradeSchema>;

export interface DecisionOption {
  key: string;
  label: string;
  description: string;
}

export interface DecisionTemplate {
  id: string;
  category: DecisionCategory;
  title: string;
  options: DecisionOption[];
}

export interface EventTemplate {
  id: string;
  category: string;
  title: string;
  description: string;
  weightBase: number;
  effects: Record<string, number>;
}

export interface RoundState {
  id: string;
  runId: string;
  roundNumber: number;
  metrics: Metrics;
  narrativeText: string;
}

export interface DecisionSelection {
  id: string;
  runId: string;
  roundNumber: number;
  decisionTemplateId: string;
  optionKey: string;
}

export interface EventInstance {
  id: string;
  runId: string;
  roundNumber: number;
  eventTemplateId: string;
  resolvedEffects: Record<string, number>;
  eventTemplate?: EventTemplate;
}

export interface SimulationRun {
  id: string;
  createdAt: string;
  storeName: string;
  storeSize: StoreSize;
  region: Region;
  currentRound: number;
  status: RunStatus;
  runSeed: number;
}

export interface RoundData {
  roundState: RoundState;
  decisions: DecisionTemplate[];
  allocationTemplates?: AllocationTemplate[];
  scenarios?: Scenario[];
  previousDecisions?: DecisionSelection[];
  previousEvent?: EventInstance;
}

export interface RoundResult {
  roundState: RoundState;
  previousState: RoundState;
  decisions: DecisionSelection[];
  event: EventInstance;
  metricDeltas: Partial<Metrics>;
  explanation: string;
}

export interface ScorecardCategory {
  name: string;
  score: number;
  metrics: { label: string; value: number | string; trend: 'up' | 'down' | 'flat' }[];
}

export interface ScenarioOption {
  label: string;
  description: string;
  effects: Record<string, number>;
}

export interface Scenario {
  id: string;
  round: number;
  category: string;
  delivery: string;
  title: string;
  description: string;
  options: ScenarioOption[];
}

export interface ScenarioSelection {
  scenarioId: string;
  optionIndex: number;
}

export interface AllocationItem {
  key: string;
  label: string;
  description: string;
}

export interface AllocationTemplate {
  id: string;
  category: 'budget' | 'time';
  title: string;
  description: string;
  total: number;
  unit: string;
  step: number;
  items: AllocationItem[];
}

export interface AllocationSelection {
  allocationTemplateId: string;
  allocations: Record<string, number>;
}

export interface EndReport {
  run: SimulationRun;
  grade: Grade;
  overallScore: number;
  scorecard: ScorecardCategory[];
  strengths: string[];
  risks: string[];
  recommendations: string[];
  rounds: {
    roundNumber: number;
    state: RoundState;
    decisions: DecisionSelection[];
    event: EventInstance;
  }[];
}
