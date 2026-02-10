import type { Metrics, StoreSize } from 'shared';
import { clamp, applyDeltas, createRng, weightedRandomChoice } from './helpers';

// --- Initial metrics by store size ---

const BASE_METRICS: Record<StoreSize, Metrics> = {
  small: {
    revenue: 85000,
    grossMarginPct: 28.5,
    labourCostPct: 18.0,
    wastePct: 3.2,
    shrinkPct: 1.8,
    netProfit: 6800,
    availabilityPct: 93.0,
    queueTimeMins: 3.5,
    complianceScore: 72,
    engagementScore: 65,
    absenceRatePct: 4.5,
    attritionRisk: 35,
    customerSatisfaction: 70,
    complaintsCount: 8,
    loyaltyIndex: 60,
    footfall: 4500,
    conversion: 0.68,
    basketSize: 27.8,
  },
  medium: {
    revenue: 145000,
    grossMarginPct: 29.0,
    labourCostPct: 17.5,
    wastePct: 2.8,
    shrinkPct: 1.5,
    netProfit: 13500,
    availabilityPct: 94.5,
    queueTimeMins: 4.0,
    complianceScore: 75,
    engagementScore: 68,
    absenceRatePct: 4.0,
    attritionRisk: 30,
    customerSatisfaction: 72,
    complaintsCount: 12,
    loyaltyIndex: 65,
    footfall: 7200,
    conversion: 0.70,
    basketSize: 28.8,
  },
  large: {
    revenue: 220000,
    grossMarginPct: 29.5,
    labourCostPct: 17.0,
    wastePct: 2.5,
    shrinkPct: 1.3,
    netProfit: 22000,
    availabilityPct: 95.0,
    queueTimeMins: 4.5,
    complianceScore: 78,
    engagementScore: 70,
    absenceRatePct: 3.8,
    attritionRisk: 28,
    customerSatisfaction: 74,
    complaintsCount: 15,
    loyaltyIndex: 68,
    footfall: 11000,
    conversion: 0.72,
    basketSize: 27.5,
  },
};

export function getInitialMetrics(storeSize: StoreSize): Metrics {
  return { ...BASE_METRICS[storeSize] };
}

// --- Decision impact calculations ---

interface DecisionSet {
  commercial: string;
  labour: string;
  operations: string;
  investment: string;
}

function getCommercialImpact(option: string, metrics: Metrics): Partial<Metrics> {
  switch (option) {
    case 'protect_margin':
      return {
        grossMarginPct: 1.5,
        footfall: -metrics.footfall * 0.04,
        basketSize: 0.8,
        customerSatisfaction: -1,
      };
    case 'balanced':
      return {
        grossMarginPct: 0.3,
        footfall: metrics.footfall * 0.01,
        basketSize: 0.3,
      };
    case 'drive_volume':
      return {
        grossMarginPct: -1.2,
        footfall: metrics.footfall * 0.08,
        basketSize: -0.5,
        queueTimeMins: 0.8,
        labourCostPct: 0.2,
      };
    case 'aggressive_competitor':
      return {
        grossMarginPct: -2.5,
        footfall: metrics.footfall * 0.15,
        basketSize: -1.0,
        queueTimeMins: 1.5,
        labourCostPct: 0.4,
        customerSatisfaction: -2,
        wastePct: 0.2,
      };
    default:
      return {};
  }
}

function getLabourImpact(option: string, metrics: Metrics): Partial<Metrics> {
  switch (option) {
    case 'cut_hours':
      return {
        labourCostPct: -1.8,
        engagementScore: -6,
        availabilityPct: -4,
        queueTimeMins: 1.5,
        complianceScore: -3,
        absenceRatePct: 0.5,
        attritionRisk: 5,
        customerSatisfaction: -3,
      };
    case 'hold_hours':
      return {
        engagementScore: -1,
        attritionRisk: 1,
      };
    case 'add_hours':
      return {
        labourCostPct: 1.2,
        engagementScore: 3,
        availabilityPct: 3,
        queueTimeMins: -1.0,
        complianceScore: 2,
        absenceRatePct: -0.3,
        attritionRisk: -3,
        customerSatisfaction: 2,
      };
    case 'add_overtime':
      return {
        labourCostPct: 1.8,
        engagementScore: -2,
        availabilityPct: 2,
        queueTimeMins: -0.8,
        absenceRatePct: 0.3,
        attritionRisk: 2,
      };
    default:
      return {};
  }
}

function getOperationsImpact(option: string): Partial<Metrics> {
  switch (option) {
    case 'availability':
      return {
        availabilityPct: 4,
        customerSatisfaction: 2,
        revenue: 2000,
        wastePct: -0.2,
      };
    case 'queue_management':
      return {
        queueTimeMins: -1.5,
        customerSatisfaction: 3,
        conversion: 0.02,
      };
    case 'waste_control':
      return {
        wastePct: -0.8,
        grossMarginPct: 0.4,
        netProfit: 1500,
        availabilityPct: -1,
      };
    case 'compliance':
      return {
        complianceScore: 6,
        shrinkPct: -0.2,
        engagementScore: -1,
        availabilityPct: -1,
      };
    default:
      return {};
  }
}

function getInvestmentImpact(option: string): Partial<Metrics> {
  switch (option) {
    case 'equipment':
      return {
        wastePct: -0.4,
        availabilityPct: 2,
        complianceScore: 2,
        netProfit: 800,
      };
    case 'wellbeing':
      return {
        engagementScore: 5,
        absenceRatePct: -0.5,
        attritionRisk: -4,
        customerSatisfaction: 1,
      };
    case 'marketing':
      return {
        footfall: 300,
        revenue: 3000,
        loyaltyIndex: 3,
        customerSatisfaction: 1,
      };
    case 'training':
      return {
        complianceScore: 4,
        engagementScore: 3,
        customerSatisfaction: 2,
        shrinkPct: -0.1,
        conversion: 0.01,
      };
    default:
      return {};
  }
}

// --- Event selection with weighted random ---

interface EventData {
  id: string;
  category: string;
  weightBase: number;
  effectsJson: Record<string, number>;
}

export function selectEvent(
  events: EventData[],
  metrics: Metrics,
  rng: () => number,
  usedEventIds: string[]
): EventData {
  const available = events.filter((e) => !usedEventIds.includes(e.id));
  const eventsToUse = available.length > 0 ? available : events;

  const weights = eventsToUse.map((e) => {
    let w = e.weightBase;

    // Adjust weights based on metrics
    if (e.category === 'people') {
      if (metrics.engagementScore < 60) w *= 1.5;
      if (metrics.attritionRisk > 50) w *= 1.3;
      if (metrics.absenceRatePct > 5) w *= 1.2;
    }
    if (e.category === 'operational') {
      if (metrics.availabilityPct < 90) w *= 1.4;
      if (metrics.wastePct > 3.5) w *= 1.3;
      if (metrics.complianceScore < 65) w *= 1.2;
    }
    if (e.category === 'trading') {
      if (metrics.footfall > 8000) w *= 1.2;
      if (metrics.customerSatisfaction < 65) w *= 1.3;
    }
    if (e.category === 'leadership') {
      if (metrics.complianceScore < 65) w *= 1.5;
      if (metrics.complaintsCount > 15) w *= 1.3;
    }

    return Math.max(w, 0.1);
  });

  return weightedRandomChoice(eventsToUse, weights, rng);
}

// --- Resolve round ---

export interface RoundResolution {
  newMetrics: Metrics;
  deltas: Partial<Metrics>;
  eventEffects: Record<string, number>;
}

export function resolveRound(
  currentMetrics: Metrics,
  decisions: DecisionSet,
  eventEffects: Record<string, number>,
  rng: () => number
): RoundResolution {
  // Collect all deltas
  const allDeltas: Record<string, number> = {};

  const addDeltas = (d: Partial<Metrics>) => {
    for (const [key, val] of Object.entries(d)) {
      if (val !== undefined) {
        allDeltas[key] = (allDeltas[key] || 0) + val;
      }
    }
  };

  // Apply decision impacts
  addDeltas(getCommercialImpact(decisions.commercial, currentMetrics));
  addDeltas(getLabourImpact(decisions.labour, currentMetrics));
  addDeltas(getOperationsImpact(decisions.operations));
  addDeltas(getInvestmentImpact(decisions.investment));

  // Apply event effects
  addDeltas(eventEffects);

  // Add small randomness (+/- 2% of delta magnitude)
  for (const key of Object.keys(allDeltas)) {
    const noise = (rng() - 0.5) * 0.04 * Math.abs(allDeltas[key] || 1);
    allDeltas[key] = (allDeltas[key] || 0) + noise;
  }

  // Calculate derived metrics
  const rawMetrics = applyDeltas(currentMetrics as unknown as Record<string, number>, allDeltas);

  // Revenue driver model
  const footfall = Math.max(rawMetrics.footfall, 500);
  const conversion = clamp(rawMetrics.conversion, 0.3, 0.95);
  const basketSize = Math.max(rawMetrics.basketSize, 10);
  const derivedRevenue = Math.round(footfall * conversion * basketSize);
  rawMetrics.revenue = derivedRevenue;
  rawMetrics.footfall = footfall;
  rawMetrics.conversion = conversion;
  rawMetrics.basketSize = basketSize;

  // Derived: netProfit
  const grossProfit = derivedRevenue * (rawMetrics.grossMarginPct / 100);
  const labourCost = derivedRevenue * (rawMetrics.labourCostPct / 100);
  const wasteCost = derivedRevenue * (rawMetrics.wastePct / 100);
  const shrinkCost = derivedRevenue * (rawMetrics.shrinkPct / 100);
  rawMetrics.netProfit = Math.round(grossProfit - labourCost - wasteCost - shrinkCost);

  // Derived: customerSatisfaction influenced by availability, queueTime, complaints, engagement
  const satDelta =
    (rawMetrics.availabilityPct - currentMetrics.availabilityPct) * 0.3 +
    (currentMetrics.queueTimeMins - rawMetrics.queueTimeMins) * 1.5 +
    (currentMetrics.complaintsCount - rawMetrics.complaintsCount) * 0.3 +
    (rawMetrics.engagementScore - currentMetrics.engagementScore) * 0.2;
  rawMetrics.customerSatisfaction += satDelta * 0.3;

  // Derived: loyaltyIndex follows satisfaction trend
  const satTrend = rawMetrics.customerSatisfaction - currentMetrics.customerSatisfaction;
  rawMetrics.loyaltyIndex += satTrend * 0.4;

  // Derived: absenceRate influenced by engagement
  if (rawMetrics.engagementScore < 55) {
    rawMetrics.absenceRatePct += 0.3;
  } else if (rawMetrics.engagementScore > 75) {
    rawMetrics.absenceRatePct -= 0.2;
  }

  // Derived: attritionRisk influenced by engagement and workload
  if (rawMetrics.engagementScore < 55) {
    rawMetrics.attritionRisk += 3;
  }
  if (rawMetrics.labourCostPct < 15) {
    rawMetrics.attritionRisk += 2; // understaffed = more attrition
  }

  // Clamp all values to sensible ranges
  const newMetrics: Metrics = {
    revenue: Math.round(rawMetrics.revenue),
    grossMarginPct: clamp(Math.round(rawMetrics.grossMarginPct * 10) / 10, 15, 45),
    labourCostPct: clamp(Math.round(rawMetrics.labourCostPct * 10) / 10, 10, 30),
    wastePct: clamp(Math.round(rawMetrics.wastePct * 10) / 10, 0.5, 8),
    shrinkPct: clamp(Math.round(rawMetrics.shrinkPct * 10) / 10, 0.3, 5),
    netProfit: Math.round(rawMetrics.netProfit),
    availabilityPct: clamp(Math.round(rawMetrics.availabilityPct * 10) / 10, 70, 99.5),
    queueTimeMins: clamp(Math.round(rawMetrics.queueTimeMins * 10) / 10, 0.5, 12),
    complianceScore: clamp(Math.round(rawMetrics.complianceScore), 30, 100),
    engagementScore: clamp(Math.round(rawMetrics.engagementScore), 20, 100),
    absenceRatePct: clamp(Math.round(rawMetrics.absenceRatePct * 10) / 10, 0.5, 12),
    attritionRisk: clamp(Math.round(rawMetrics.attritionRisk), 5, 95),
    customerSatisfaction: clamp(Math.round(rawMetrics.customerSatisfaction), 25, 100),
    complaintsCount: clamp(Math.round(rawMetrics.complaintsCount), 0, 50),
    loyaltyIndex: clamp(Math.round(rawMetrics.loyaltyIndex), 20, 100),
    footfall: Math.round(rawMetrics.footfall),
    conversion: clamp(Math.round(rawMetrics.conversion * 1000) / 1000, 0.3, 0.95),
    basketSize: Math.round(rawMetrics.basketSize * 100) / 100,
  };

  // Calculate deltas for display
  const deltas: Partial<Metrics> = {};
  for (const key of Object.keys(newMetrics) as (keyof Metrics)[]) {
    const diff = Number(newMetrics[key]) - Number(currentMetrics[key]);
    if (Math.abs(diff) > 0.01) {
      (deltas as Record<string, number>)[key] = Math.round(diff * 100) / 100;
    }
  }

  return { newMetrics, deltas, eventEffects };
}

// --- Narrative generation ---

export function deriveNarrative(
  metrics: Metrics,
  prevMetrics: Metrics | null,
  event: { title: string; description: string } | null,
  decisions: DecisionSet,
  roundNumber: number
): string {
  const parts: string[] = [];

  parts.push(`**Week ${roundNumber} at your FreshWay Markets store.**`);

  if (prevMetrics) {
    // Revenue trend
    const revDiff = metrics.revenue - prevMetrics.revenue;
    if (revDiff > 3000) {
      parts.push('Revenue is up strongly — your trading decisions are paying off.');
    } else if (revDiff > 0) {
      parts.push('Revenue has edged up slightly this week.');
    } else if (revDiff < -3000) {
      parts.push('Revenue has taken a noticeable hit this week. Time to review your approach.');
    } else if (revDiff < 0) {
      parts.push('Revenue dipped slightly — keep an eye on the trend.');
    }

    // Engagement
    if (metrics.engagementScore < 55) {
      parts.push('Team morale is low. Colleagues are disengaged and the atmosphere on the shop floor feels flat.');
    } else if (metrics.engagementScore > 80) {
      parts.push('The team is energised and engaged — you can feel the positive atmosphere in store.');
    }

    // Customer satisfaction
    if (metrics.customerSatisfaction < 60) {
      parts.push('Customer satisfaction is concerning. Complaints are rising and loyalty is at risk.');
    } else if (metrics.customerSatisfaction > 82) {
      parts.push('Customers are happy — satisfaction scores are strong.');
    }

    // Compliance
    if (metrics.complianceScore < 60) {
      parts.push('Compliance is slipping — the store is exposed to risk if an audit happens.');
    }

    // Queue
    if (metrics.queueTimeMins > 6) {
      parts.push('Checkout queues are long. Customers are waiting too long to pay.');
    }
  } else {
    parts.push(`Your ${decisions.commercial === 'protect_margin' ? 'margin-focused' : decisions.commercial === 'drive_volume' ? 'volume-driven' : decisions.commercial === 'aggressive_competitor' ? 'aggressive' : 'balanced'} commercial strategy is set for the week.`);
    parts.push(`You've chosen to ${decisions.labour === 'cut_hours' ? 'cut hours — risky but cost-saving' : decisions.labour === 'add_hours' ? 'add hours — investing in the team' : decisions.labour === 'add_overtime' ? 'use overtime — a short-term fix' : 'hold hours steady'}.`);
  }

  if (event) {
    parts.push(`\n**Event: ${event.title}** — ${event.description}`);
  }

  return parts.join(' ');
}

// --- Scoring and grading ---

export interface Scorecard {
  financial: number;
  customer: number;
  people: number;
  operations: number;
  overall: number;
}

export function calculateScorecard(metrics: Metrics): Scorecard {
  // Financial score (0-100)
  const financial = clamp(
    (metrics.grossMarginPct / 35) * 25 +
    (Math.max(0, metrics.netProfit) / 25000) * 25 +
    ((5 - metrics.wastePct) / 5) * 25 +
    ((3 - metrics.shrinkPct) / 3) * 25,
    0,
    100
  );

  // Customer score (0-100)
  const customer = clamp(
    metrics.customerSatisfaction * 0.4 +
    metrics.loyaltyIndex * 0.3 +
    Math.max(0, (20 - metrics.complaintsCount) / 20) * 30,
    0,
    100
  );

  // People score (0-100)
  const people = clamp(
    metrics.engagementScore * 0.4 +
    ((8 - metrics.absenceRatePct) / 8) * 30 +
    ((100 - metrics.attritionRisk) / 100) * 30,
    0,
    100
  );

  // Operations score (0-100)
  const operations = clamp(
    (metrics.availabilityPct / 100) * 30 +
    Math.max(0, (8 - metrics.queueTimeMins) / 8) * 30 +
    metrics.complianceScore * 0.4,
    0,
    100
  );

  const overall = Math.round((financial + customer + people + operations) / 4);

  return {
    financial: Math.round(financial),
    customer: Math.round(customer),
    people: Math.round(people),
    operations: Math.round(operations),
    overall,
  };
}

export type Grade = 'Developing' | 'Ready Soon' | 'Ready' | 'High Performing';

export function calculateGrade(overallScore: number): Grade {
  if (overallScore >= 80) return 'High Performing';
  if (overallScore >= 65) return 'Ready';
  if (overallScore >= 50) return 'Ready Soon';
  return 'Developing';
}

export function generateStrengths(metrics: Metrics): string[] {
  const strengths: string[] = [];
  if (metrics.grossMarginPct > 30) strengths.push('Strong margin management — pricing discipline is delivering results.');
  if (metrics.customerSatisfaction > 78) strengths.push('Customer satisfaction is high — your store is well-regarded locally.');
  if (metrics.engagementScore > 75) strengths.push('Team engagement is excellent — colleagues are motivated and productive.');
  if (metrics.availabilityPct > 96) strengths.push('On-shelf availability is outstanding — customers find what they need.');
  if (metrics.complianceScore > 85) strengths.push('Compliance standards are strong — the store is well-controlled.');
  if (metrics.loyaltyIndex > 75) strengths.push('Customer loyalty is building — repeat visits and basket growth are evident.');
  if (metrics.wastePct < 2.0) strengths.push('Waste is well managed — minimal product loss.');
  if (metrics.queueTimeMins < 3) strengths.push('Queue times are fast — customers are getting through quickly.');
  if (metrics.netProfit > 18000) strengths.push('Net profit is strong — the P&L is healthy.');
  if (metrics.attritionRisk < 25) strengths.push('Attrition risk is low — your team is stable.');

  // Always return at least 3
  if (strengths.length < 3) {
    const defaults = [
      'The store is operational and trading.',
      'Basic standards are being maintained.',
      'The team is showing up and doing the work.',
    ];
    while (strengths.length < 3) {
      strengths.push(defaults[strengths.length]);
    }
  }

  return strengths.slice(0, 3);
}

export function generateRisks(metrics: Metrics): string[] {
  const risks: string[] = [];
  if (metrics.engagementScore < 55) risks.push('Team engagement is critically low — risk of resignations and poor service.');
  if (metrics.attritionRisk > 55) risks.push('Attrition risk is high — you could lose key colleagues soon.');
  if (metrics.complianceScore < 60) risks.push('Compliance is weak — the store is vulnerable to audit failures and incidents.');
  if (metrics.customerSatisfaction < 60) risks.push('Customer satisfaction is poor — complaints are likely to escalate.');
  if (metrics.wastePct > 4) risks.push('Waste levels are high — margin is being eroded by product loss.');
  if (metrics.shrinkPct > 2.5) risks.push('Shrink is above target — investigate stock loss urgently.');
  if (metrics.queueTimeMins > 6) risks.push('Queue times are unacceptable — customers are abandoning baskets.');
  if (metrics.absenceRatePct > 6) risks.push('Absence is high — the store is frequently understaffed.');
  if (metrics.availabilityPct < 88) risks.push('Availability is poor — customers can\'t find products on shelf.');
  if (metrics.netProfit < 5000) risks.push('Profitability is under pressure — the P&L needs attention.');

  if (risks.length < 3) {
    const defaults = [
      'Monitor team workload — sustained pressure can erode performance.',
      'Keep an eye on local competitor activity.',
      'Ensure maintenance schedules are up to date to prevent breakdowns.',
    ];
    while (risks.length < 3) {
      risks.push(defaults[risks.length]);
    }
  }

  return risks.slice(0, 3);
}

export function generateRecommendations(metrics: Metrics): string[] {
  const recs: string[] = [];

  // Prioritise by worst areas
  const issues: { score: number; rec: string }[] = [
    { score: metrics.engagementScore, rec: 'Invest in colleague wellbeing and listen to your team. Engagement drives everything else.' },
    { score: metrics.customerSatisfaction, rec: 'Focus on the customer experience — availability, service speed, and complaint resolution.' },
    { score: metrics.complianceScore, rec: 'Dedicate time to compliance routines before they become a liability.' },
    { score: 100 - metrics.wastePct * 15, rec: 'Tighten waste controls — better ordering, rotation, and markdown management.' },
    { score: 100 - metrics.queueTimeMins * 10, rec: 'Improve checkout speed — deploy staff to tills during peak hours.' },
    { score: 100 - metrics.attritionRisk, rec: 'Address retention risk — have honest conversations with your team about workload and development.' },
  ];

  issues.sort((a, b) => a.score - b.score);

  for (const issue of issues) {
    if (recs.length < 3) {
      recs.push(issue.rec);
    }
  }

  return recs.slice(0, 3);
}
