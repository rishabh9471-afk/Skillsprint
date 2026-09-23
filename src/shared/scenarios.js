/* The 12 v1 scenarios, as the user sees them.
 * Grading rubrics and "what a strong answer covers" live on the server
 * (server/rubrics.js) so they are not shipped to the browser. */

export const scenarios = [
  // ---------------- Prioritisation ----------------
  {
    id: 'pri-feature-triage',
    skill: 'prioritization',
    title: 'The feature triage dilemma',
    difficulty: 'Medium',
    minutes: 8,
    context:
      "You're the PM at a health-tech startup. Engineering has capacity for exactly one feature next sprint. Sales wants a PDF export for reports, which they say will close a ₹50L enterprise deal. Support wants a fix for a payment-failure bug that affects 3% of users at checkout. Growth wants a referral programme. The company OKR this quarter is to cut customer acquisition cost (CAC) by 20%.",
    prompt: 'Which one do you pick for next sprint, and how do you make and defend the decision?',
  },
  {
    id: 'pri-roadmap-halved',
    skill: 'prioritization',
    title: 'Your team just got cut in half',
    difficulty: 'Hard',
    minutes: 10,
    context:
      'Four of your eight engineers are pulled onto a mandatory data-compliance project for the whole quarter. Your committed roadmap has six items: a checkout redesign, Android performance fixes, a partner API for two new insurers, an in-app chat support tool, a loyalty programme, and dark mode. Leadership still expects the quarter to show progress on revenue.',
    prompt: 'What do you keep, what do you cut or delay, and how do you communicate the new plan?',
  },
  {
    id: 'pri-ceo-chatbot',
    skill: 'prioritization',
    title: "The CEO's AI chatbot",
    difficulty: 'Medium',
    minutes: 8,
    context:
      "Your CEO came back from a conference and wants an AI health chatbot on the home screen of your medicine-delivery app next month. Your own data shows 40% of users who add items to the cart drop off at the address-and-delivery-slot step. The team can realistically do one of these well this month.",
    prompt: 'How do you respond to the CEO, and what do you prioritise?',
  },

  // ---------------- Metrics ----------------
  {
    id: 'met-teleconsult-nsm',
    skill: 'metrics',
    title: 'A north star for teleconsults',
    difficulty: 'Medium',
    minutes: 8,
    context:
      'You own a teleconsultation app where users video-call doctors for ₹199 per consult. The company has found product-market fit in tier-1 cities and now wants one north star metric the whole team can rally around for the next year.',
    prompt: 'Propose a north star metric, the input metrics that drive it, and at least one guardrail metric. Explain your choices.',
  },
  {
    id: 'met-dau-drop',
    skill: 'metrics',
    title: 'The 18% DAU drop',
    difficulty: 'Hard',
    minutes: 10,
    context:
      "You're the PM of a fitness-tracking app. Daily active users dropped 18% week over week, starting last Tuesday. Nobody on the team has an explanation yet, and your VP wants an update by the end of the day.",
    prompt: 'Walk through how you would find the cause, in order, and what you would do once you find it.',
  },
  {
    id: 'met-reminders-launch',
    skill: 'metrics',
    title: 'Did medicine reminders work?',
    difficulty: 'Easy',
    minutes: 6,
    context:
      'Your pharmacy app just launched medicine reminders: users add their prescriptions and get push notifications when a dose is due, with a one-tap reorder when stock runs low. The feature went live to all users yesterday.',
    prompt: 'How will you judge whether the feature is a success in its first 30 days?',
  },

  // ---------------- Product sense ----------------
  {
    id: 'ps-first-insurance',
    skill: 'product-sense',
    title: 'First-time insurance buyers',
    difficulty: 'Medium',
    minutes: 10,
    context:
      'You work on a health-insurance app. Young salaried people in tier-2 cities visit the app, browse plans, and leave without buying. Many have never bought insurance before and rely on the cover from their employer.',
    prompt: 'How would you improve the buying experience for first-time buyers? Pick a focus and design your solution.',
  },
  {
    id: 'ps-parents-booking',
    skill: 'product-sense',
    title: 'Booking doctors for parents',
    difficulty: 'Medium',
    minutes: 10,
    context:
      "Many users of your doctor-booking app book appointments for their elderly parents, who often live in another city. Support tickets show confusion about who gets the reminders, who pays, and how the parent joins video consults.",
    prompt: 'Design an improved experience for adult children booking care for their parents.',
  },
  {
    id: 'ps-ai-lab-tests',
    skill: 'product-sense',
    title: 'One AI feature for lab tests',
    difficulty: 'Hard',
    minutes: 10,
    context:
      "You're the PM for a lab-test booking app: users book tests, a technician collects samples at home, and PDF reports arrive in the app. Leadership wants to launch one AI feature this quarter that users will actually value.",
    prompt: 'Which AI feature would you build, for whom, and how would you manage its risks?',
  },

  // ---------------- Stakeholders ----------------
  {
    id: 'stk-sales-escalation',
    skill: 'stakeholders',
    title: 'The Sales VP escalates',
    difficulty: 'Medium',
    minutes: 8,
    context:
      'You chose to build a referral programme this sprint because it supports the OKR of cutting CAC by 20%. The Sales VP has escalated to your CPO, saying you ignored a PDF-export request that would close a ₹50L deal. The CPO has asked you to explain your decision in a 5-minute meeting.',
    prompt: 'How do you handle the meeting, and what happens after it?',
  },
  {
    id: 'stk-eng-deadline',
    skill: 'stakeholders',
    title: 'Engineering says the date is impossible',
    difficulty: 'Medium',
    minutes: 8,
    context:
      'Your business team has promised an insurer partner that the new cashless OPD journey will go live on 1 December. Your engineering lead says that date is impossible without cutting corners on testing, and estimates mid-January. The partner contract has a penalty clause for delays.',
    prompt: 'What do you do?',
  },
  {
    id: 'stk-design-vs-data',
    skill: 'stakeholders',
    title: 'Design vs data',
    difficulty: 'Easy',
    minutes: 6,
    context:
      'Your lead designer championed a new home-screen redesign. In a two-week A/B test, the redesign lowered booking conversion by 3% but raised user satisfaction scores by 8 points. The designer wants to ship it; your growth lead wants to kill it.',
    prompt: 'How do you decide, and how do you bring both people along?',
  },
];

export const scenarioById = Object.fromEntries(scenarios.map((s) => [s.id, s]));
