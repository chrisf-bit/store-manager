import { z } from 'zod';

export const StoreSizeSchema = z.enum(['small', 'medium', 'large']);
export const RegionSchema = z.enum(['North', 'Midlands', 'South', 'Scotland', 'Wales']);
export const RunStatusSchema = z.enum(['in_progress', 'completed']);

export const CreateRunSchema = z.object({
  storeName: z.string().min(1).max(100).default('FreshWay Markets – Riverside'),
  storeSize: StoreSizeSchema.default('medium'),
  region: RegionSchema.default('Midlands'),
});

export const DecisionCategorySchema = z.enum([
  'commercial',
  'labour',
  'operations',
]);

export const SubmitDecisionsSchema = z.object({
  decisions: z.array(
    z.object({
      decisionTemplateId: z.string().uuid(),
      optionKey: z.string().min(1),
    })
  ).length(3),
  allocations: z.array(
    z.object({
      allocationTemplateId: z.string().min(1),
      allocations: z.record(z.string(), z.number().min(0)),
    })
  ).length(2),
  scenarioSelections: z.array(
    z.object({
      scenarioId: z.string().min(1),
      optionIndex: z.number().int().min(0).max(3),
    })
  ).optional(),
});

export const MetricsSchema = z.object({
  revenue: z.number(),
  grossMarginPct: z.number(),
  labourCostPct: z.number(),
  wastePct: z.number(),
  shrinkPct: z.number(),
  netProfit: z.number(),
  availabilityPct: z.number(),
  queueTimeMins: z.number(),
  complianceScore: z.number(),
  engagementScore: z.number(),
  absenceRatePct: z.number(),
  attritionRisk: z.number(),
  customerSatisfaction: z.number(),
  complaintsCount: z.number(),
  loyaltyIndex: z.number(),
  footfall: z.number(),
  conversion: z.number(),
  basketSize: z.number(),
});

export const GradeSchema = z.enum([
  'Developing',
  'Ready Soon',
  'Ready',
  'High Performing',
]);
