import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing seed data
  await prisma.eventInstance.deleteMany();
  await prisma.decisionSelection.deleteMany();
  await prisma.roundState.deleteMany();
  await prisma.simulationRun.deleteMany();
  await prisma.decisionTemplate.deleteMany();
  await prisma.eventTemplate.deleteMany();

  // --- Decision Templates ---

  await prisma.decisionTemplate.createMany({
    data: [
      {
        category: 'commercial',
        title: 'Pricing & Promotions Strategy',
        optionsJson: [
          {
            key: 'protect_margin',
            label: 'Protect Margin',
            description: 'Hold prices firm — protect gross margin at the expense of footfall. Fewer promotions, premium positioning.',
          },
          {
            key: 'balanced',
            label: 'Balanced Approach',
            description: 'Moderate promotions. Steady footfall with reasonable margin. A safe middle-ground.',
          },
          {
            key: 'drive_volume',
            label: 'Drive Volume',
            description: 'Increase promotional activity to boost footfall. Margin will dip but basket count rises. More pressure on store operations.',
          },
          {
            key: 'aggressive_competitor',
            label: 'Aggressive vs Competitor',
            description: 'Undercut the local competitor hard. Big footfall surge, significant margin hit, and heavy workload on the team.',
          },
        ],
      },
      {
        category: 'labour',
        title: 'Labour & Staffing Plan',
        optionsJson: [
          {
            key: 'cut_hours',
            label: 'Cut Hours',
            description: 'Reduce colleague hours to save costs. Savings hit the bottom line but service, availability, and morale will suffer.',
          },
          {
            key: 'hold_hours',
            label: 'Hold Hours',
            description: 'Maintain current staffing levels. No change in cost or capacity — stability but no improvement.',
          },
          {
            key: 'add_hours',
            label: 'Add Hours',
            description: 'Invest in additional contracted hours. Better availability and service, but labour cost rises.',
          },
          {
            key: 'add_overtime',
            label: 'Add Overtime',
            description: 'Use overtime to cover gaps. Quick fix for capacity, but expensive and can fatigue the team if sustained.',
          },
        ],
      },
      {
        category: 'operations',
        title: 'Operations Focus',
        optionsJson: [
          {
            key: 'availability',
            label: 'Availability Routines',
            description: 'Prioritise on-shelf availability. Run gap scans, fix counts, and manage replenishment tightly.',
          },
          {
            key: 'queue_management',
            label: 'Queue Management',
            description: 'Focus on reducing checkout wait times. Staff tills, open self-scan, and manage peak flow.',
          },
          {
            key: 'waste_control',
            label: 'Waste Control',
            description: 'Crack down on waste and markdowns. Tighter ordering, better rotation, reduced disposal costs.',
          },
          {
            key: 'compliance',
            label: 'Compliance & Standards',
            description: 'Focus on health & safety, food hygiene, and operational standards. Reduces risk but takes time from trading.',
          },
        ],
      },
      {
        category: 'investment',
        title: 'Investment Priority',
        optionsJson: [
          {
            key: 'equipment',
            label: 'Equipment Maintenance',
            description: 'Invest in fixing and maintaining store equipment — fridges, ovens, tills. Reduces breakdown risk and waste.',
          },
          {
            key: 'wellbeing',
            label: 'Colleague Wellbeing',
            description: 'Invest in colleague wellbeing — rest areas, mental health support, team events. Boosts engagement and retention.',
          },
          {
            key: 'marketing',
            label: 'Local Marketing',
            description: 'Invest in local marketing — leaflets, community events, social media. Drives footfall from the local area.',
          },
          {
            key: 'training',
            label: 'Capability & Training',
            description: 'Invest in colleague training — product knowledge, customer service skills, compliance refreshers.',
          },
        ],
      },
    ],
  });

  // --- Event Templates (16 total, 4 per category) ---

  await prisma.eventTemplate.createMany({
    data: [
      // People events
      {
        category: 'people',
        title: 'Sickness Spike',
        description: 'A wave of illness hits the team. Several colleagues call in sick this week, leaving you short-staffed across key departments.',
        weightBase: 1.0,
        effectsJson: {
          absenceRatePct: 2.5,
          engagementScore: -3,
          availabilityPct: -4,
          queueTimeMins: 1.5,
          labourCostPct: 0.8,
        },
      },
      {
        category: 'people',
        title: 'Key Team Leader Off',
        description: 'Your most experienced team leader is off on unplanned leave. The team loses direction and productivity drops in their department.',
        weightBase: 0.8,
        effectsJson: {
          engagementScore: -5,
          complianceScore: -4,
          availabilityPct: -3,
          wastePct: 0.3,
          customerSatisfaction: -2,
        },
      },
      {
        category: 'people',
        title: 'Team Conflict',
        description: 'A dispute between two colleagues escalates. Morale suffers in the department and customers notice the tension.',
        weightBase: 0.7,
        effectsJson: {
          engagementScore: -6,
          customerSatisfaction: -3,
          attritionRisk: 5,
          complaintsCount: 2,
        },
      },
      {
        category: 'people',
        title: 'Resignation Risk',
        description: 'A valued colleague hands in their notice. The team is unsettled and you need to consider how to backfill the role.',
        weightBase: 0.6,
        effectsJson: {
          attritionRisk: 8,
          engagementScore: -4,
          labourCostPct: 0.5,
          availabilityPct: -2,
        },
      },
      // Trading events
      {
        category: 'trading',
        title: 'Competitor Promotion Blitz',
        description: 'The competitor across the road launches an aggressive promotion campaign. Footfall dips as customers chase deals elsewhere.',
        weightBase: 1.0,
        effectsJson: {
          footfall: -120,
          revenue: -3500,
          customerSatisfaction: -2,
          loyaltyIndex: -3,
        },
      },
      {
        category: 'trading',
        title: 'Weather Swing',
        description: 'Unseasonable weather catches the store off guard. Seasonal stock moves slowly and fresh produce waste increases.',
        weightBase: 0.9,
        effectsJson: {
          footfall: -80,
          wastePct: 0.5,
          revenue: -2000,
          basketSize: -1.2,
        },
      },
      {
        category: 'trading',
        title: 'Local Event Footfall Surge',
        description: 'A local event brings a surge of visitors to the area. Great for sales, but your team is stretched to handle the extra demand.',
        weightBase: 0.8,
        effectsJson: {
          footfall: 200,
          revenue: 5000,
          queueTimeMins: 2.5,
          customerSatisfaction: -2,
          wastePct: -0.2,
          complaintsCount: 3,
        },
      },
      {
        category: 'trading',
        title: 'Supplier Shortage',
        description: 'A key supplier fails to deliver on time. Several product lines are unavailable, frustrating customers.',
        weightBase: 0.7,
        effectsJson: {
          availabilityPct: -6,
          customerSatisfaction: -4,
          complaintsCount: 4,
          revenue: -2500,
          loyaltyIndex: -2,
        },
      },
      // Operational events
      {
        category: 'operational',
        title: 'Fridge Failure',
        description: 'A refrigeration unit breaks down overnight. You lose a significant amount of chilled stock and must manage the disposal.',
        weightBase: 0.8,
        effectsJson: {
          wastePct: 1.2,
          availabilityPct: -5,
          netProfit: -2000,
          complianceScore: -3,
          customerSatisfaction: -3,
        },
      },
      {
        category: 'operational',
        title: 'Late Delivery',
        description: 'The main delivery arrives 4 hours late. Shelves are bare during the morning rush and the team scrambles to catch up.',
        weightBase: 1.0,
        effectsJson: {
          availabilityPct: -7,
          queueTimeMins: 1.0,
          customerSatisfaction: -3,
          revenue: -1500,
          complaintsCount: 2,
        },
      },
      {
        category: 'operational',
        title: 'POS Outage',
        description: 'The point-of-sale system goes down for 90 minutes during peak trading. Long queues form and some customers leave without buying.',
        weightBase: 0.6,
        effectsJson: {
          queueTimeMins: 4.0,
          revenue: -4000,
          customerSatisfaction: -6,
          complaintsCount: 6,
          loyaltyIndex: -4,
        },
      },
      {
        category: 'operational',
        title: 'Waste Incident',
        description: 'A temperature control failure in the bakery ruins an entire batch of products. Waste spikes and the team has to reorder urgently.',
        weightBase: 0.7,
        effectsJson: {
          wastePct: 0.8,
          netProfit: -1200,
          availabilityPct: -3,
          complianceScore: -2,
        },
      },
      // Leadership events
      {
        category: 'leadership',
        title: 'Escalated Customer Complaint',
        description: 'A serious customer complaint reaches head office. You need to investigate, respond formally, and demonstrate corrective action.',
        weightBase: 0.9,
        effectsJson: {
          customerSatisfaction: -4,
          complaintsCount: 1,
          complianceScore: -2,
          loyaltyIndex: -3,
          engagementScore: -2,
        },
      },
      {
        category: 'leadership',
        title: 'Surprise Audit',
        description: 'An unannounced compliance audit catches the store mid-week. Results depend heavily on your current standards.',
        weightBase: 0.8,
        effectsJson: {
          complianceScore: -5,
          engagementScore: -3,
          customerSatisfaction: -1,
        },
      },
      {
        category: 'leadership',
        title: 'HQ Data Request',
        description: 'Head office requests a detailed performance review and improvement plan. It takes management time away from the shop floor.',
        weightBase: 0.7,
        effectsJson: {
          engagementScore: -2,
          availabilityPct: -2,
          queueTimeMins: 0.5,
          complianceScore: 2,
        },
      },
      {
        category: 'leadership',
        title: 'Incident Investigation',
        description: 'A health & safety incident requires a formal investigation. You must pull colleagues off the floor for interviews and documentation.',
        weightBase: 0.6,
        effectsJson: {
          complianceScore: -4,
          engagementScore: -4,
          labourCostPct: 0.3,
          availabilityPct: -3,
          attritionRisk: 3,
        },
      },
    ],
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
