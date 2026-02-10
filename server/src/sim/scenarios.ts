// Realistic management scenarios — 4 per round, each with 4 trade-off options
// Every option has nuanced effects. There are no "correct" answers.

export interface ScenarioOption {
  label: string;
  description: string;
  effects: Record<string, number>;
}

export interface Scenario {
  id: string;
  round: number;
  category: 'people' | 'commercial' | 'operational' | 'leadership';
  delivery: string; // how the scenario arrives
  title: string;
  description: string;
  options: ScenarioOption[];
}

// Round 1 — Getting Started
const R1_SCENARIOS: Scenario[] = [
  {
    id: 'r1_s1',
    round: 1,
    category: 'people',
    delivery: 'via a team leader pulling you aside',
    title: 'The Overtime Request',
    description: 'Your fresh produce team leader tells you two colleagues have asked to reduce their overtime. They\'re tired and morale is dipping. But the department is already tight on hours — cutting overtime will leave gaps on the shop floor during the evening rush.',
    options: [
      {
        label: 'Approve the reduced overtime immediately',
        description: 'Show the team you listen. Morale improves, but availability will take a hit during evenings and you\'ll need to find cover.',
        effects: { engagementScore: 5, absenceRatePct: -0.4, availabilityPct: -3, queueTimeMins: 0.8, customerSatisfaction: -2, attritionRisk: -4 },
      },
      {
        label: 'Deny the request — the business needs come first',
        description: 'Hold the line on hours. Availability stays strong but the team will feel unheard. Word spreads fast on the shop floor.',
        effects: { engagementScore: -6, attritionRisk: 5, availabilityPct: 1, absenceRatePct: 0.3, customerSatisfaction: 1, complianceScore: -2 },
      },
      {
        label: 'Offer a compromise — reduce one shift each per week',
        description: 'A middle ground. Neither side gets everything they want, but it shows willingness to flex. You\'ll need to juggle the rota.',
        effects: { engagementScore: 2, availabilityPct: -1, attritionRisk: -1, labourCostPct: 0.2, absenceRatePct: -0.2 },
      },
      {
        label: 'Sit down with each colleague individually to understand why',
        description: 'Takes your time off the floor, but you might uncover a deeper issue — childcare, health, or something else driving the request.',
        effects: { engagementScore: 4, attritionRisk: -3, complianceScore: 1, availabilityPct: -1, queueTimeMins: 0.3 },
      },
    ],
  },
  {
    id: 'r1_s2',
    round: 1,
    category: 'commercial',
    delivery: 'via your regional manager on a call',
    title: 'The Competitor Opening',
    description: 'A discount competitor is opening 200 metres from your store next month. Your regional manager wants to know your plan. Footfall could drop 10-15% once they open. You have a small budget for a response — but whatever you do, it needs to start now.',
    options: [
      {
        label: 'Launch an aggressive price-match campaign on key lines',
        description: 'Match their prices on 50 high-visibility lines. It\'ll protect footfall but crush your margin. The team will need to manage increased workload from promotions.',
        effects: { grossMarginPct: -2.0, footfall: 150, revenue: 3000, labourCostPct: 0.3, wastePct: 0.3, customerSatisfaction: 2, engagementScore: -2 },
      },
      {
        label: 'Double down on fresh quality and customer service',
        description: 'They can\'t compete on fresh. Invest in better displays, sampling, and service training. Slower to show results, but builds loyalty.',
        effects: { customerSatisfaction: 4, loyaltyIndex: 5, engagementScore: 3, footfall: -50, conversion: 0.02, grossMarginPct: 0.3 },
      },
      {
        label: 'Invest in local community marketing',
        description: 'Leaflets, social media, sponsoring the local football team. Make FreshWay the community\'s store, not just a shop.',
        effects: { footfall: 100, loyaltyIndex: 3, customerSatisfaction: 2, revenue: 1500, netProfit: -800 },
      },
      {
        label: 'Do nothing yet — wait to see the actual impact',
        description: 'Don\'t react to speculation. Save the budget for when you have real data. But your regional manager may see this as complacency.',
        effects: { footfall: -80, customerSatisfaction: -1, loyaltyIndex: -2, complianceScore: -2 },
      },
    ],
  },
  {
    id: 'r1_s3',
    round: 1,
    category: 'operational',
    delivery: 'via the morning walk',
    title: 'The Delivery Backlog',
    description: 'You arrive at 6am to find last night\'s delivery only half-worked. The night team ran short and the cages are blocking the warehouse. The morning team is already filling shelves but there\'s no space to receive today\'s delivery, which is due in 90 minutes.',
    options: [
      {
        label: 'Pull everyone off tills to clear the backlog',
        description: 'All hands to the warehouse. You\'ll clear it fast, but the front end will be unmanned for an hour during early trading. Queues will build.',
        effects: { availabilityPct: 4, queueTimeMins: 2.5, customerSatisfaction: -3, complaintsCount: 2, complianceScore: -1, engagementScore: -1 },
      },
      {
        label: 'Split the team — half on backlog, half on tills',
        description: 'Balanced approach. Neither task gets full focus, but nothing is completely neglected. It\'ll be tight until the delivery arrives.',
        effects: { availabilityPct: 2, queueTimeMins: 1.0, customerSatisfaction: -1, complianceScore: 0 },
      },
      {
        label: 'Call in two extra colleagues on overtime',
        description: 'Phone two reliable people and offer overtime. It solves the problem but costs money and those colleagues may not appreciate the 6am wake-up call.',
        effects: { availabilityPct: 3, queueTimeMins: 0.3, labourCostPct: 0.5, engagementScore: -1, attritionRisk: 1 },
      },
      {
        label: 'Focus on clearing high-priority lines only',
        description: 'Prioritise bread, milk, fresh, and promoted lines. Leave the rest for later. Customers get the essentials but some aisles will look bare.',
        effects: { availabilityPct: 1, wastePct: -0.2, customerSatisfaction: -1, complianceScore: 1, queueTimeMins: 0.5 },
      },
    ],
  },
  {
    id: 'r1_s4',
    round: 1,
    category: 'leadership',
    delivery: 'via an email from head office',
    title: 'The Compliance Gap',
    description: 'Head office has flagged that your store\'s food safety records have gaps from the last two weeks. Temperature logs are incomplete and two cleaning schedules are unsigned. An auditor could arrive at any time. Your team leaders say they\'ve been too busy serving customers to complete the paperwork.',
    options: [
      {
        label: 'Stop everything and run a full compliance blitz today',
        description: 'Take every team leader off the floor for 2 hours to complete all outstanding checks and reset standards. Trading will suffer but you\'ll be audit-ready.',
        effects: { complianceScore: 8, availabilityPct: -4, queueTimeMins: 1.5, engagementScore: -2, customerSatisfaction: -2 },
      },
      {
        label: 'Backfill the missing records yourself',
        description: 'Sit in the office and complete the paperwork. It\'s done quickly and the team stays on the floor — but you\'re not managing, you\'re firefighting. And you know the records aren\'t fully accurate.',
        effects: { complianceScore: 3, shrinkPct: 0.1, engagementScore: -1 },
      },
      {
        label: 'Brief each team leader individually and give them 48 hours to fix it',
        description: 'Set clear expectations with accountability. Gives them ownership but risks the auditor arriving before they\'re done.',
        effects: { complianceScore: 4, engagementScore: 2, attritionRisk: -1, availabilityPct: -1 },
      },
      {
        label: 'Escalate to your regional manager for support',
        description: 'Be transparent about the gap and ask for a temporary compliance support visit. Shows honesty but your RM may question your grip on the store.',
        effects: { complianceScore: 5, engagementScore: -1, customerSatisfaction: 0, attritionRisk: -1 },
      },
    ],
  },
];

// Round 2 — Building Momentum
const R2_SCENARIOS: Scenario[] = [
  {
    id: 'r2_s1',
    round: 2,
    category: 'people',
    delivery: 'via a colleague approaching you on the shop floor',
    title: 'The Grievance',
    description: 'A colleague tells you they want to raise a formal grievance against their team leader. They say they\'re being given all the worst shifts, excluded from team communications, and spoken to dismissively in front of customers. The team leader is one of your best performers.',
    options: [
      {
        label: 'Start the formal grievance process immediately',
        description: 'Follow policy to the letter. It\'s the right thing procedurally, but it will consume significant management time and the team leader may become defensive and disengaged.',
        effects: { complianceScore: 5, engagementScore: -3, attritionRisk: 3, availabilityPct: -2, labourCostPct: 0.2 },
      },
      {
        label: 'Speak to the team leader first to hear their side',
        description: 'Have a private, honest conversation. You might resolve it informally — but the colleague may feel you\'re not taking their complaint seriously.',
        effects: { engagementScore: 1, complianceScore: -2, attritionRisk: -1, customerSatisfaction: 1 },
      },
      {
        label: 'Observe the team leader for a few days before acting',
        description: 'Gather your own evidence by watching interactions on the floor. You\'ll make a more informed decision, but the colleague is suffering now.',
        effects: { complianceScore: 1, engagementScore: -2, attritionRisk: 2, customerSatisfaction: -1 },
      },
      {
        label: 'Move the colleague to a different department temporarily',
        description: 'Separate them while you investigate. Removes the immediate tension but doesn\'t address the root cause and may feel like punishment to the colleague.',
        effects: { engagementScore: -4, availabilityPct: -1, attritionRisk: 4, complianceScore: -1, customerSatisfaction: -1 },
      },
    ],
  },
  {
    id: 'r2_s2',
    round: 2,
    category: 'commercial',
    delivery: 'via the weekly trading report',
    title: 'The Waste Spike',
    description: 'Your waste has spiked 40% this week. The bakery is over-ordering, the reduced-to-clear process isn\'t working, and three pallets of seasonal stock are approaching their sell-by date. Your gross margin is being eaten alive.',
    options: [
      {
        label: 'Implement emergency waste controls across all departments',
        description: 'Tighten ordering, mandate twice-daily date checks, and slash bakery production. Waste will drop fast but availability will suffer and the team will feel micromanaged.',
        effects: { wastePct: -1.2, grossMarginPct: 0.6, availabilityPct: -3, engagementScore: -3, customerSatisfaction: -2 },
      },
      {
        label: 'Focus on the bakery — that\'s where the biggest loss is',
        description: 'Work with the bakery team leader to fix ordering patterns and production schedules. Targeted approach, but the other departments\' waste continues.',
        effects: { wastePct: -0.6, grossMarginPct: 0.3, engagementScore: 1, availabilityPct: -1 },
      },
      {
        label: 'Run a massive markdown event to clear the seasonal stock',
        description: 'Price it to move. You\'ll recover some revenue and clear warehouse space, but your margin takes another hit this week.',
        effects: { wastePct: -0.4, revenue: 2000, grossMarginPct: -0.8, footfall: 50, customerSatisfaction: 1 },
      },
      {
        label: 'Invest in colleague training on waste awareness',
        description: 'Run a 30-minute briefing with each team on waste identification, rotation, and ordering. Benefits won\'t show this week, but it builds capability for the long term.',
        effects: { wastePct: -0.3, engagementScore: 2, complianceScore: 2, availabilityPct: -1, labourCostPct: 0.1 },
      },
    ],
  },
  {
    id: 'r2_s3',
    round: 2,
    category: 'operational',
    delivery: 'via a customer complaint at the service desk',
    title: 'The Queue Crisis',
    description: 'It\'s Saturday lunchtime and the queue stretches back to the frozen aisle. Three self-scan machines are broken, two till operators called in sick, and a customer has just walked out shouting that they\'ll "never come back." Your checkout team leader is close to tears.',
    options: [
      {
        label: 'Jump on a till yourself and call all available colleagues to the front',
        description: 'Lead from the front. Customers see the manager serving, which builds goodwill. But you can\'t manage the store from behind a till and other departments will be unmanned.',
        effects: { queueTimeMins: -2.0, customerSatisfaction: 3, engagementScore: 3, availabilityPct: -3, complianceScore: -2 },
      },
      {
        label: 'Focus on getting the self-scan machines fixed urgently',
        description: 'Call the engineer and try a restart. If even one comes back online it halves the pressure. But it might take 30 minutes and customers are angry now.',
        effects: { queueTimeMins: -1.0, customerSatisfaction: -1, availabilityPct: 0, complianceScore: 1 },
      },
      {
        label: 'Open the basket-only express lane and deploy a queue host',
        description: 'Put someone at the front to direct traffic, manage expectations, and thank customers for waiting. Doesn\'t fix the root cause but reduces frustration.',
        effects: { queueTimeMins: -1.5, customerSatisfaction: 2, loyaltyIndex: 1, engagementScore: 1 },
      },
      {
        label: 'Support the checkout team leader first — they need you',
        description: 'Take 5 minutes to calm them down, acknowledge the situation, and help them prioritise. A settled leader will manage the crisis better than a panicking one.',
        effects: { engagementScore: 4, queueTimeMins: -0.5, customerSatisfaction: 1, attritionRisk: -3, complianceScore: 1 },
      },
    ],
  },
  {
    id: 'r2_s4',
    round: 2,
    category: 'leadership',
    delivery: 'via a phone call from your regional manager',
    title: 'The Target Stretch',
    description: 'Your regional manager tells you HQ is raising your weekly sales target by 8% starting next week. No additional hours, no extra budget. "We need you to find it through better execution." You know the team is already working hard.',
    options: [
      {
        label: 'Accept it and push the team to deliver',
        description: 'Rally the troops. Set daily targets, run hourly sales updates, and keep the pressure on. The team may deliver — or they may crack.',
        effects: { revenue: 4000, engagementScore: -5, attritionRisk: 4, absenceRatePct: 0.3, customerSatisfaction: -1, footfall: 50 },
      },
      {
        label: 'Push back on your RM — be honest about capacity',
        description: 'Have a candid conversation about what\'s realistic. It shows integrity but your RM may see it as a lack of ambition.',
        effects: { engagementScore: 2, attritionRisk: -2, revenue: 1000, complianceScore: 1 },
      },
      {
        label: 'Focus on conversion and basket size rather than footfall',
        description: 'You can\'t control who walks in the door, but you can influence what they buy. Improve upselling, cross-merchandising, and checkout prompts.',
        effects: { conversion: 0.02, basketSize: 1.2, revenue: 2500, engagementScore: 1, customerSatisfaction: 1 },
      },
      {
        label: 'Identify the top 3 opportunities and build a focused plan',
        description: 'Analyse your data — which departments are underperforming? Where\'s the biggest gap to target? A surgical approach rather than a blanket push.',
        effects: { revenue: 3000, availabilityPct: 2, engagementScore: 1, wastePct: -0.2 },
      },
    ],
  },
];

// Round 3 — Under Pressure
const R3_SCENARIOS: Scenario[] = [
  {
    id: 'r3_s1',
    round: 3,
    category: 'people',
    delivery: 'via a quiet word after the morning briefing',
    title: 'The Burnout',
    description: 'Your best checkout supervisor pulls you aside and says she can\'t keep going. She\'s been covering every sick day, staying late to cash up, and hasn\'t had a weekend off in a month. She\'s not threatening to leave — she\'s telling you she\'s breaking.',
    options: [
      {
        label: 'Give her the next two weekends off and find cover',
        description: 'She needs rest now. You\'ll struggle to cover those shifts but she\'ll come back stronger. The rest of the team will notice you looked after her.',
        effects: { engagementScore: 5, attritionRisk: -6, absenceRatePct: -0.3, queueTimeMins: 1.0, labourCostPct: 0.4, customerSatisfaction: -1 },
      },
      {
        label: 'Acknowledge it but explain you need her right now',
        description: 'Be honest that you\'re short-staffed and she\'s essential. Promise to fix it soon. She\'ll stay, but the resentment will build.',
        effects: { engagementScore: -4, attritionRisk: 6, absenceRatePct: 0.5, queueTimeMins: 0.3 },
      },
      {
        label: 'Restructure the rota to share the load more fairly',
        description: 'Spread the weekend and late shifts across the whole team. It\'s the right long-term fix but some colleagues won\'t like their new shifts.',
        effects: { engagementScore: 1, attritionRisk: -2, absenceRatePct: -0.2, queueTimeMins: 0.5, complianceScore: 1 },
      },
      {
        label: 'Promote her to team leader with better terms',
        description: 'Recognise her contribution formally. She gets more authority and slightly better pay, but her workload might actually increase.',
        effects: { engagementScore: 3, attritionRisk: -4, labourCostPct: 0.6, complianceScore: 2, customerSatisfaction: 1 },
      },
    ],
  },
  {
    id: 'r3_s2',
    round: 3,
    category: 'commercial',
    delivery: 'via the shrink report landing on your desk',
    title: 'The Shrink Problem',
    description: 'Your shrink figure has been creeping up for three weeks. Stock loss is now double the regional average. You suspect a combination of shoplifting, internal theft, and poor process — but you don\'t know the split. Security footage is limited and your team leaders are defensive when you raise it.',
    options: [
      {
        label: 'Bring in a loss prevention specialist for a full audit',
        description: 'Get the experts in. They\'ll find the root cause but your team will feel under suspicion. Trust could take a hit.',
        effects: { shrinkPct: -0.6, complianceScore: 4, engagementScore: -4, attritionRisk: 3, customerSatisfaction: -1 },
      },
      {
        label: 'Tighten process controls — date checks, stock counts, till audits',
        description: 'Address the process side. More checks, more counts, more oversight. It\'s methodical but slow and adds to everyone\'s workload.',
        effects: { shrinkPct: -0.3, complianceScore: 3, engagementScore: -2, availabilityPct: -1, labourCostPct: 0.2 },
      },
      {
        label: 'Have an honest team meeting about the numbers',
        description: 'Put the data on the table and ask for help. Some managers find this builds collective ownership. Others find it creates suspicion and blame.',
        effects: { shrinkPct: -0.2, engagementScore: 2, complianceScore: 1, attritionRisk: -1 },
      },
      {
        label: 'Focus security on the shop floor — visible deterrence',
        description: 'More staff presence in high-theft areas, better sight-lines, security tags on premium products. Deters external theft but doesn\'t address internal issues.',
        effects: { shrinkPct: -0.4, customerSatisfaction: -2, availabilityPct: -1, footfall: -30 },
      },
    ],
  },
  {
    id: 'r3_s3',
    round: 3,
    category: 'operational',
    delivery: 'via a text message at 5:30am',
    title: 'The Fridge Failure',
    description: 'You get a text from the night security guard: "Main chiller cabinet in dairy failed around 2am. Alarm didn\'t trigger. Everything in there is out of temperature." You rush in to find £3,000 worth of dairy products sitting at 12°C. Food safety rules are clear — but throwing it all away will leave the dairy aisle empty at 7am.',
    options: [
      {
        label: 'Dispose of everything and emergency-order replacements',
        description: 'Follow food safety protocol to the letter. Your dairy aisle will be sparse until the emergency order arrives mid-afternoon, but you\'re legally and ethically clean.',
        effects: { wastePct: 1.5, complianceScore: 6, availabilityPct: -5, netProfit: -3000, customerSatisfaction: -3 },
      },
      {
        label: 'Check temperatures item by item and keep what\'s salvageable',
        description: 'Some items may still be within tolerance. You save some stock but you\'re making judgement calls on food safety. If anyone gets ill, it\'s on you.',
        effects: { wastePct: 0.5, complianceScore: -4, availabilityPct: -2, netProfit: -1000, customerSatisfaction: -1, shrinkPct: 0.2 },
      },
      {
        label: 'Dispose of it all but convert the space to a sampling promotion',
        description: 'Turn a negative into a positive. Use the empty space for cheese and yogurt sampling from ambient stock. Creative, but it doesn\'t fix the supply gap.',
        effects: { wastePct: 1.2, complianceScore: 4, availabilityPct: -3, customerSatisfaction: 1, netProfit: -2500, conversion: 0.01 },
      },
      {
        label: 'Call the engineer immediately and focus on preventing it happening again',
        description: 'Fix the root cause first — alarm system, backup monitoring, maintenance schedule. The dairy stock is lost either way, but you stop it recurring.',
        effects: { wastePct: 1.3, complianceScore: 5, availabilityPct: -4, netProfit: -2800, engagementScore: 1 },
      },
    ],
  },
  {
    id: 'r3_s4',
    round: 3,
    category: 'leadership',
    delivery: 'via a surprise visit',
    title: 'The Regional Visit',
    description: 'Your regional manager arrives unannounced for a "routine visit." They spend an hour walking the store, checking dates, questioning colleagues, and studying your P&L. At the end, they sit you down and say: "You\'ve got potential, but I\'m not seeing it in the numbers yet. What\'s your plan?"',
    options: [
      {
        label: 'Present your data and defend your decisions',
        description: 'Walk them through every decision and its rationale. Show you\'re in control and thinking strategically. But if the data doesn\'t support you, this could backfire.',
        effects: { complianceScore: 2, engagementScore: 1, revenue: 1000, customerSatisfaction: 1 },
      },
      {
        label: 'Be honest about the challenges and ask for support',
        description: 'Vulnerability from a manager can build trust upward — or be seen as weakness. Your RM\'s reaction depends on their leadership style.',
        effects: { engagementScore: 2, complianceScore: 1, attritionRisk: -2, labourCostPct: -0.2 },
      },
      {
        label: 'Commit to a specific improvement plan with deadlines',
        description: 'Name three things you\'ll fix, with dates. It shows accountability and drive. But now you\'re on the hook to deliver.',
        effects: { revenue: 2000, complianceScore: 3, engagementScore: -1, availabilityPct: 1, wastePct: -0.2 },
      },
      {
        label: 'Redirect the conversation to your team\'s strengths',
        description: 'Highlight what\'s going well — customer feedback, team retention, compliance improvements. Frame the narrative positively. But the numbers still are what they are.',
        effects: { engagementScore: 1, customerSatisfaction: 1, loyaltyIndex: 1 },
      },
    ],
  },
];

// Round 4 — Final Push
const R4_SCENARIOS: Scenario[] = [
  {
    id: 'r4_s1',
    round: 4,
    category: 'people',
    delivery: 'via multiple colleagues approaching you separately',
    title: 'The Morale Question',
    description: 'Three different colleagues have come to you this week saying the same thing: "It doesn\'t feel like anyone cares about us." They\'re not complaining about pay — it\'s about recognition, communication, and feeling invisible. You can feel the energy draining from the shop floor.',
    options: [
      {
        label: 'Organise a proper team recognition event this week',
        description: 'Buy food, put up a "thank you" board, personally acknowledge every colleague. It costs time and a small budget, but people remember being seen.',
        effects: { engagementScore: 7, attritionRisk: -5, customerSatisfaction: 2, labourCostPct: 0.2, absenceRatePct: -0.3, loyaltyIndex: 1 },
      },
      {
        label: 'Start daily 5-minute huddles with each department',
        description: 'Brief, focused, consistent communication. Share numbers, celebrate wins, listen to concerns. It builds rhythm but takes 30 minutes of your morning every day.',
        effects: { engagementScore: 5, complianceScore: 2, attritionRisk: -3, availabilityPct: -1, customerSatisfaction: 1 },
      },
      {
        label: 'Commit to monthly 1:1s with every team leader',
        description: 'Structured development conversations. Good leadership practice but the impact takes time to filter down to the shop floor.',
        effects: { engagementScore: 3, attritionRisk: -2, complianceScore: 1 },
      },
      {
        label: 'Focus on fixing the tangible issues instead',
        description: 'People say they want recognition but what they really want is a working rota, functioning equipment, and enough hours to do the job. Fix the basics.',
        effects: { availabilityPct: 2, queueTimeMins: -0.5, complianceScore: 2, engagementScore: -1, wastePct: -0.2 },
      },
    ],
  },
  {
    id: 'r4_s2',
    round: 4,
    category: 'commercial',
    delivery: 'via the weekly P&L review',
    title: 'The Margin Squeeze',
    description: 'Your P&L shows labour cost is eating your profit. You\'re spending more on staff than your store can sustain at current revenue. Your regional manager has hinted that if this continues, you\'ll be asked to cut hours next quarter. But your team is already stretched.',
    options: [
      {
        label: 'Cut 40 hours from the weekly rota immediately',
        description: 'Hit the target now and protect next quarter. But 40 hours is two part-timers\' worth of shifts. Someone is losing income.',
        effects: { labourCostPct: -1.5, engagementScore: -6, attritionRisk: 6, availabilityPct: -3, queueTimeMins: 1.5, absenceRatePct: 0.4, customerSatisfaction: -3 },
      },
      {
        label: 'Drive revenue up instead — labour cost is a ratio, not a number',
        description: 'If you grow sales, the percentage drops even if absolute cost stays the same. Focus on trading, not cutting. But it\'s a bet — and it needs to work this week.',
        effects: { revenue: 4000, footfall: 100, basketSize: 0.8, engagementScore: 2, labourCostPct: -0.3 },
      },
      {
        label: 'Optimise the rota — cut dead hours, not people',
        description: 'Analyse when footfall is lowest and pull hours from quiet periods. Smarter scheduling saves money without losing capacity when it matters.',
        effects: { labourCostPct: -0.8, availabilityPct: -1, queueTimeMins: 0.3, engagementScore: 0, complianceScore: 1 },
      },
      {
        label: 'Present a business case to your RM for maintaining current hours',
        description: 'Build the argument: show customer satisfaction, availability, and revenue trends that justify the investment. It might buy you time — or get you overruled.',
        effects: { labourCostPct: 0, engagementScore: 2, attritionRisk: -1, complianceScore: 1 },
      },
    ],
  },
  {
    id: 'r4_s3',
    round: 4,
    category: 'operational',
    delivery: 'via a customer review on social media',
    title: 'The Online Review',
    description: 'A customer has posted a scathing review online: "Went to FreshWay Riverside today. Shelves empty, queues insane, staff looked miserable. Used to love this place — what happened?" It\'s been shared 200+ times. Your regional manager has seen it. Your team has seen it. Everyone is watching how you respond.',
    options: [
      {
        label: 'Post a public, humble response and invite them back',
        description: 'Acknowledge the experience, apologise, and offer to make it right. Shows accountability. But some will see it as admitting failure.',
        effects: { customerSatisfaction: 3, loyaltyIndex: 3, engagementScore: -1, complaintsCount: -2, complianceScore: 1 },
      },
      {
        label: 'Use it as a rallying cry with the team',
        description: 'Show the team the review and say "Let\'s prove them wrong this week." It could galvanise or demoralise, depending on how you deliver it.',
        effects: { engagementScore: 3, availabilityPct: 2, customerSatisfaction: 2, queueTimeMins: -0.5, attritionRisk: -1 },
      },
      {
        label: 'Focus on fixing the specific issues mentioned',
        description: 'Empty shelves, long queues, unhappy staff. Take each one seriously and make visible improvements. Actions speak louder than words.',
        effects: { availabilityPct: 3, queueTimeMins: -1.0, engagementScore: 2, customerSatisfaction: 2, labourCostPct: 0.3 },
      },
      {
        label: 'Ignore it — one review doesn\'t define the store',
        description: 'Don\'t feed the negativity. Focus on serving the customers who are in the store today. But silence online can look like you don\'t care.',
        effects: { customerSatisfaction: -2, loyaltyIndex: -3, complaintsCount: 1 },
      },
    ],
  },
  {
    id: 'r4_s4',
    round: 4,
    category: 'leadership',
    delivery: 'via your own reflection at the end of the day',
    title: 'The Legacy Question',
    description: 'It\'s the end of your fourth week. You sit in the office after close and look at the numbers, the team rota, the customer comments. This is your store now — your decisions shaped it. But you know there\'s more work to do. What do you want your final act as this week\'s manager to be?',
    options: [
      {
        label: 'Write a personal thank-you note to every colleague',
        description: 'Handwritten. Individual. Specific about what each person contributed. It costs nothing but time — and people keep these notes for years.',
        effects: { engagementScore: 6, attritionRisk: -5, customerSatisfaction: 1, loyaltyIndex: 2 },
      },
      {
        label: 'Create a clear 4-week improvement plan for your successor',
        description: 'Document what you\'ve learned — what works, what doesn\'t, where the risks are. It\'s not glamorous but it\'s the most professional thing you can leave behind.',
        effects: { complianceScore: 4, engagementScore: 1, availabilityPct: 1, wastePct: -0.1 },
      },
      {
        label: 'Spend your last day on the shop floor, not in the office',
        description: 'Be visible. Serve customers. Help colleagues. Fill shelves. Show that the best managers lead from the front.',
        effects: { customerSatisfaction: 3, engagementScore: 4, availabilityPct: 2, queueTimeMins: -0.5, complianceScore: -1 },
      },
      {
        label: 'Push for one final big trading day',
        description: 'All promotions, all hands, maximum effort. Go out with a bang. The team might love it — or they might resent one last push.',
        effects: { revenue: 5000, footfall: 150, grossMarginPct: -0.5, engagementScore: -2, labourCostPct: 0.3, customerSatisfaction: 1 },
      },
    ],
  },
];

export const ALL_SCENARIOS: Scenario[] = [
  ...R1_SCENARIOS,
  ...R2_SCENARIOS,
  ...R3_SCENARIOS,
  ...R4_SCENARIOS,
];

export function getScenariosForRound(round: number): Scenario[] {
  return ALL_SCENARIOS.filter((s) => s.round === round);
}
