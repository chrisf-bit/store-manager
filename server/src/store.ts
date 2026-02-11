import { v4 as uuid } from 'uuid';
import type { DecisionOption } from 'shared';
import { getScenariosForRound, type Scenario } from './sim/scenarios';

// --- In-memory data store for the demo ---

export interface RunRecord {
  id: string;
  createdAt: string;
  storeName: string;
  storeSize: string;
  region: string;
  currentRound: number;
  status: string;
  runSeed: number;
}

export interface RoundStateRecord {
  id: string;
  runId: string;
  roundNumber: number;
  metricsJson: Record<string, number>;
  narrativeText: string;
}

export interface DecisionTemplateRecord {
  id: string;
  category: string;
  title: string;
  optionsJson: DecisionOption[];
}

export interface DecisionSelectionRecord {
  id: string;
  runId: string;
  roundNumber: number;
  decisionTemplateId: string;
  optionKey: string;
}

export interface AllocationTemplateRecord {
  id: string;
  category: 'budget' | 'time';
  title: string;
  description: string;
  total: number;
  unit: string;
  step: number;
  itemsJson: { key: string; label: string; description: string }[];
}

export interface EventTemplateRecord {
  id: string;
  category: string;
  title: string;
  description: string;
  weightBase: number;
  effectsJson: Record<string, number>;
}

export interface EventInstanceRecord {
  id: string;
  runId: string;
  roundNumber: number;
  eventTemplateId: string;
  resolvedEffectsJson: Record<string, number>;
}

// Storage
const runs = new Map<string, RunRecord>();
const roundStates = new Map<string, RoundStateRecord[]>(); // runId -> states
const decisionSelections = new Map<string, DecisionSelectionRecord[]>(); // runId -> selections
const eventInstances = new Map<string, EventInstanceRecord[]>(); // runId -> instances
const decisionTemplates: DecisionTemplateRecord[] = [];
const allocationTemplates: AllocationTemplateRecord[] = [];
const eventTemplates: EventTemplateRecord[] = [];

// --- Seed data ---

function seed() {
  // Decision templates
  decisionTemplates.push(
    {
      id: uuid(),
      category: 'commercial',
      title: 'Pricing & Promotions Strategy',
      optionsJson: [
        { key: 'protect_margin', label: 'Protect Margin', description: 'Hold prices firm to protect gross margin at the expense of footfall. Fewer promotions, premium positioning.' },
        { key: 'balanced', label: 'Balanced Approach', description: 'Moderate promotions. Steady footfall with reasonable margin. A safe middle-ground.' },
        { key: 'drive_volume', label: 'Drive Volume', description: 'Increase promotional activity to boost footfall. Margin will dip but basket count rises. More pressure on store operations.' },
        { key: 'aggressive_competitor', label: 'Aggressive vs Competitor', description: 'Undercut the local competitor hard. Big footfall surge, significant margin hit, and heavy workload on the team.' },
      ],
    },
    {
      id: uuid(),
      category: 'labour',
      title: 'Labour & Staffing Plan',
      optionsJson: [
        { key: 'cut_hours', label: 'Cut Hours', description: 'Reduce colleague hours to save costs. Savings hit the bottom line but service, availability, and morale will suffer.' },
        { key: 'hold_hours', label: 'Hold Hours', description: 'Maintain current staffing levels. No change in cost or capacity. Stability but no improvement.' },
        { key: 'add_hours', label: 'Add Hours', description: 'Invest in additional contracted hours. Better availability and service, but labour cost rises.' },
        { key: 'add_overtime', label: 'Add Overtime', description: 'Use overtime to cover gaps. Quick fix for capacity, but expensive and can fatigue the team if sustained.' },
      ],
    },
    {
      id: uuid(),
      category: 'operations',
      title: 'Operations Focus',
      optionsJson: [
        { key: 'availability', label: 'Availability Routines', description: 'Prioritise on-shelf availability. Run gap scans, fix counts, and manage replenishment tightly.' },
        { key: 'queue_management', label: 'Queue Management', description: 'Focus on reducing checkout wait times. Staff tills, open self-scan, and manage peak flow.' },
        { key: 'waste_control', label: 'Waste Control', description: 'Crack down on waste and markdowns. Tighter ordering, better rotation, reduced disposal costs.' },
        { key: 'compliance', label: 'Compliance & Standards', description: 'Focus on health & safety, food hygiene, and operational standards. Reduces risk but takes time from trading.' },
      ],
    },
  );

  // Allocation templates
  allocationTemplates.push(
    {
      id: uuid(),
      category: 'budget',
      title: 'Weekly Budget',
      description: 'Allocate your £5,000 weekly discretionary budget across four investment areas.',
      total: 5000,
      unit: '£',
      step: 500,
      itemsJson: [
        { key: 'equipment', label: 'Equipment', description: 'Fridges, ovens, tills, fixtures. Reduces breakdowns and waste.' },
        { key: 'wellbeing', label: 'Wellbeing', description: 'Rest areas, mental health support, team events. Boosts engagement.' },
        { key: 'marketing', label: 'Marketing', description: 'Leaflets, social media, community events. Drives local footfall.' },
        { key: 'training', label: 'Training', description: 'Product knowledge, customer service, compliance refreshers.' },
      ],
    },
    {
      id: uuid(),
      category: 'time',
      title: 'Management Time',
      description: 'Allocate your 40 management hours across four focus areas this week.',
      total: 40,
      unit: 'hrs',
      step: 4,
      itemsJson: [
        { key: 'floor_coaching', label: 'Floor Coaching', description: 'Walking the shop floor, coaching colleagues, spotting issues in real time.' },
        { key: 'team_meetings', label: 'Team Meetings', description: 'Briefings, one-to-ones, performance reviews. Builds engagement and alignment.' },
        { key: 'admin', label: 'Admin & Planning', description: 'Rotas, ordering, compliance paperwork, reporting. Keeps the operation tight.' },
        { key: 'customer_focus', label: 'Customer Focus', description: 'Greeting customers, handling complaints, building local relationships.' },
      ],
    }
  );

  // Event templates (16 total)
  const events: Omit<EventTemplateRecord, 'id'>[] = [
    // People
    { category: 'people', title: 'Sickness Spike', description: 'A wave of illness hits the team. Several colleagues call in sick this week, leaving you short-staffed across key departments.', weightBase: 1.0, effectsJson: { absenceRatePct: 2.5, engagementScore: -3, availabilityPct: -4, queueTimeMins: 1.5, labourCostPct: 0.8 } },
    { category: 'people', title: 'Key Team Leader Off', description: 'Your most experienced team leader is off on unplanned leave. The team loses direction and productivity drops in their department.', weightBase: 0.8, effectsJson: { engagementScore: -5, complianceScore: -4, availabilityPct: -3, wastePct: 0.3, customerSatisfaction: -2 } },
    { category: 'people', title: 'Team Conflict', description: 'A dispute between two colleagues escalates. Morale suffers in the department and customers notice the tension.', weightBase: 0.7, effectsJson: { engagementScore: -6, customerSatisfaction: -3, attritionRisk: 5, complaintsCount: 2 } },
    { category: 'people', title: 'Resignation Risk', description: 'A valued colleague hands in their notice. The team is unsettled and you need to consider how to backfill the role.', weightBase: 0.6, effectsJson: { attritionRisk: 8, engagementScore: -4, labourCostPct: 0.5, availabilityPct: -2 } },
    // Trading
    { category: 'trading', title: 'Competitor Promotion Blitz', description: 'The competitor across the road launches an aggressive promotion campaign. Footfall dips as customers chase deals elsewhere.', weightBase: 1.0, effectsJson: { footfall: -120, revenue: -3500, customerSatisfaction: -2, loyaltyIndex: -3 } },
    { category: 'trading', title: 'Weather Swing', description: 'Unseasonable weather catches the store off guard. Seasonal stock moves slowly and fresh produce waste increases.', weightBase: 0.9, effectsJson: { footfall: -80, wastePct: 0.5, revenue: -2000, basketSize: -1.2 } },
    { category: 'trading', title: 'Local Event Footfall Surge', description: 'A local event brings a surge of visitors to the area. Great for sales, but your team is stretched to handle the extra demand.', weightBase: 0.8, effectsJson: { footfall: 200, revenue: 5000, queueTimeMins: 2.5, customerSatisfaction: -2, wastePct: -0.2, complaintsCount: 3 } },
    { category: 'trading', title: 'Supplier Shortage', description: 'A key supplier fails to deliver on time. Several product lines are unavailable, frustrating customers.', weightBase: 0.7, effectsJson: { availabilityPct: -6, customerSatisfaction: -4, complaintsCount: 4, revenue: -2500, loyaltyIndex: -2 } },
    // Operational
    { category: 'operational', title: 'Fridge Failure', description: 'A refrigeration unit breaks down overnight. You lose a significant amount of chilled stock and must manage the disposal.', weightBase: 0.8, effectsJson: { wastePct: 1.2, availabilityPct: -5, netProfit: -2000, complianceScore: -3, customerSatisfaction: -3 } },
    { category: 'operational', title: 'Late Delivery', description: 'The main delivery arrives 4 hours late. Shelves are bare during the morning rush and the team scrambles to catch up.', weightBase: 1.0, effectsJson: { availabilityPct: -7, queueTimeMins: 1.0, customerSatisfaction: -3, revenue: -1500, complaintsCount: 2 } },
    { category: 'operational', title: 'POS Outage', description: 'The point-of-sale system goes down for 90 minutes during peak trading. Long queues form and some customers leave without buying.', weightBase: 0.6, effectsJson: { queueTimeMins: 4.0, revenue: -4000, customerSatisfaction: -6, complaintsCount: 6, loyaltyIndex: -4 } },
    { category: 'operational', title: 'Waste Incident', description: 'A temperature control failure in the bakery ruins an entire batch of products. Waste spikes and the team has to reorder urgently.', weightBase: 0.7, effectsJson: { wastePct: 0.8, netProfit: -1200, availabilityPct: -3, complianceScore: -2 } },
    // Leadership
    { category: 'leadership', title: 'Escalated Customer Complaint', description: 'A serious customer complaint reaches head office. You need to investigate, respond formally, and demonstrate corrective action.', weightBase: 0.9, effectsJson: { customerSatisfaction: -4, complaintsCount: 1, complianceScore: -2, loyaltyIndex: -3, engagementScore: -2 } },
    { category: 'leadership', title: 'Surprise Audit', description: 'An unannounced compliance audit catches the store mid-week. Results depend heavily on your current standards.', weightBase: 0.8, effectsJson: { complianceScore: -5, engagementScore: -3, customerSatisfaction: -1 } },
    { category: 'leadership', title: 'HQ Data Request', description: 'Head office requests a detailed performance review and improvement plan. It takes management time away from the shop floor.', weightBase: 0.7, effectsJson: { engagementScore: -2, availabilityPct: -2, queueTimeMins: 0.5, complianceScore: 2 } },
    { category: 'leadership', title: 'Incident Investigation', description: 'A health & safety incident requires a formal investigation. You must pull colleagues off the floor for interviews and documentation.', weightBase: 0.6, effectsJson: { complianceScore: -4, engagementScore: -4, labourCostPct: 0.3, availabilityPct: -3, attritionRisk: 3 } },
  ];

  for (const e of events) {
    eventTemplates.push({ id: uuid(), ...e });
  }
}

// Run seed on import
seed();

// --- Store API ---

export const store = {
  // Runs
  createRun(data: Omit<RunRecord, 'id' | 'createdAt'>): RunRecord {
    const run: RunRecord = { id: uuid(), createdAt: new Date().toISOString(), ...data };
    runs.set(run.id, run);
    roundStates.set(run.id, []);
    decisionSelections.set(run.id, []);
    eventInstances.set(run.id, []);
    return run;
  },

  getRun(id: string): RunRecord | undefined {
    return runs.get(id);
  },

  updateRun(id: string, data: Partial<RunRecord>): RunRecord | undefined {
    const run = runs.get(id);
    if (!run) return undefined;
    Object.assign(run, data);
    return run;
  },

  // Round states
  addRoundState(data: Omit<RoundStateRecord, 'id'>): RoundStateRecord {
    const rec: RoundStateRecord = { id: uuid(), ...data };
    const arr = roundStates.get(data.runId) || [];
    arr.push(rec);
    roundStates.set(data.runId, arr);
    return rec;
  },

  getRoundState(runId: string, roundNumber: number): RoundStateRecord | undefined {
    return roundStates.get(runId)?.find((rs) => rs.roundNumber === roundNumber);
  },

  getAllRoundStates(runId: string): RoundStateRecord[] {
    return (roundStates.get(runId) || []).sort((a, b) => a.roundNumber - b.roundNumber);
  },

  // Decision templates
  getDecisionTemplates(): DecisionTemplateRecord[] {
    return decisionTemplates;
  },

  getDecisionTemplate(id: string): DecisionTemplateRecord | undefined {
    return decisionTemplates.find((dt) => dt.id === id);
  },

  // Decision selections
  addDecisionSelection(data: Omit<DecisionSelectionRecord, 'id'>): DecisionSelectionRecord {
    const rec: DecisionSelectionRecord = { id: uuid(), ...data };
    const arr = decisionSelections.get(data.runId) || [];
    arr.push(rec);
    decisionSelections.set(data.runId, arr);
    return rec;
  },

  getDecisionSelections(runId: string, roundNumber?: number): DecisionSelectionRecord[] {
    const arr = decisionSelections.get(runId) || [];
    if (roundNumber !== undefined) return arr.filter((d) => d.roundNumber === roundNumber);
    return arr;
  },

  // Allocation templates
  getAllocationTemplates(): AllocationTemplateRecord[] {
    return allocationTemplates;
  },

  getAllocationTemplate(id: string): AllocationTemplateRecord | undefined {
    return allocationTemplates.find((at) => at.id === id);
  },

  // Event templates
  getEventTemplates(): EventTemplateRecord[] {
    return eventTemplates;
  },

  getEventTemplate(id: string): EventTemplateRecord | undefined {
    return eventTemplates.find((et) => et.id === id);
  },

  // Event instances
  addEventInstance(data: Omit<EventInstanceRecord, 'id'>): EventInstanceRecord {
    const rec: EventInstanceRecord = { id: uuid(), ...data };
    const arr = eventInstances.get(data.runId) || [];
    arr.push(rec);
    eventInstances.set(data.runId, arr);
    return rec;
  },

  getEventInstances(runId: string): EventInstanceRecord[] {
    return (eventInstances.get(runId) || []).sort((a, b) => a.roundNumber - b.roundNumber);
  },

  getEventInstance(runId: string, roundNumber: number): EventInstanceRecord | undefined {
    return eventInstances.get(runId)?.find((e) => e.roundNumber === roundNumber);
  },
};
