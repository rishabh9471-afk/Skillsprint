/* Grading rubrics — server only.
 * Each skill has 4 dimensions with anchors for scores 1, 5 and 10.
 * Each scenario adds "key points": what strong answers tend to cover.
 * Key points guide the grader; they are NOT the only right answer. */

export const rubrics = {
  prioritization: [
    {
      name: 'Problem framing',
      anchors: {
        1: 'Jumps straight to a choice without stating the goal or constraints.',
        5: 'States the goal or the constraint, but not both, or only in passing.',
        10: 'Restates the business goal, the key constraint and who is affected before choosing.',
      },
    },
    {
      name: 'Decision logic',
      anchors: {
        1: 'Gut feel or personal preference; no criteria.',
        5: 'Names some criteria but applies them loosely or to only one option.',
        10: 'Explicit criteria (e.g. impact, reach, effort, confidence, OKR fit) applied consistently to each option, leading clearly to the choice.',
      },
    },
    {
      name: 'Trade-offs and stakeholders',
      anchors: {
        1: 'Ignores what is given up and who loses out.',
        5: 'Mentions a trade-off vaguely, with no plan for the people affected.',
        10: 'Names exactly what is given up, who is affected, and how they will be handled (sequencing, a fast-follow, communication).',
      },
    },
    {
      name: 'Measurement',
      anchors: {
        1: 'No way to know if the decision was right.',
        5: 'A generic metric with no target or timeframe.',
        10: 'A specific metric, target and timeframe, plus what result would change the decision.',
      },
    },
  ],
  metrics: [
    {
      name: 'Goal clarity',
      anchors: {
        1: 'Metrics listed without saying what the product or feature is for.',
        5: 'Goal stated but generic ("engagement", "growth").',
        10: 'Clearly states the user value and business goal the metrics must reflect.',
      },
    },
    {
      name: 'Metric choice',
      anchors: {
        1: 'Vanity metrics (downloads, page views) or a long unprioritised list.',
        5: 'Reasonable metrics, but weak link to real user value or unclear definitions.',
        10: 'Precisely defined metrics tied to delivered value, with a clear primary metric and why it beats alternatives.',
      },
    },
    {
      name: 'Guardrails and segments',
      anchors: {
        1: 'No counter-metrics; could be gamed or cause harm unnoticed.',
        5: 'Mentions a guardrail or a segment, without explaining why.',
        10: 'Guardrails that catch the likely failure modes, and segments (platform, cohort, city) where results may differ.',
      },
    },
    {
      name: 'Analysis and action',
      anchors: {
        1: 'No method, or no link from numbers to decisions.',
        5: 'Some structure, but steps are out of order or stop short of a decision.',
        10: 'A logical, ordered method (check data first, then segment, then hypothesise) that ends in concrete actions or decisions.',
      },
    },
  ],
  'product-sense': [
    {
      name: 'User and problem',
      anchors: {
        1: 'Generic user, problem assumed rather than examined.',
        5: 'Identifies a user group and a problem, but broadly or without reasoning.',
        10: 'Picks a specific segment, explains why, and pinpoints the most important pain with evidence or clear reasoning.',
      },
    },
    {
      name: 'Solution quality',
      anchors: {
        1: 'Features listed with no link to the problem.',
        5: 'Plausible solution, but obvious or loosely connected to the pain.',
        10: 'Solutions that directly remove the pain, show some creativity, and fit the context (users, market, constraints).',
      },
    },
    {
      name: 'Prioritised scope',
      anchors: {
        1: 'Everything at once; no MVP.',
        5: 'Some prioritisation, but the reasoning is thin.',
        10: 'A clear MVP with a reasoned cut line and what comes later.',
      },
    },
    {
      name: 'Success and risks',
      anchors: {
        1: 'No success measure and no risks considered.',
        5: 'A metric or a risk, but not both, or both are generic.',
        10: 'A clear success metric plus the key risks (trust, adoption, cost, safety) and how to mitigate them.',
      },
    },
  ],
  stakeholders: [
    {
      name: 'Understanding the other side',
      anchors: {
        1: 'Treats the other person as an obstacle; their goals are ignored.',
        5: 'Acknowledges their position but not the underlying interest.',
        10: 'Identifies what each stakeholder actually needs and why, and uses that to shape the approach.',
      },
    },
    {
      name: 'Position and evidence',
      anchors: {
        1: 'Caves immediately, or defends with authority or process alone.',
        5: 'Has a position but supports it weakly.',
        10: 'A clear position grounded in goals and data, held with conviction but open to new information.',
      },
    },
    {
      name: 'Path to resolution',
      anchors: {
        1: 'No options; escalates or stalls.',
        5: 'One option, or options without trade-offs.',
        10: 'Creative options (sequencing, scope cuts, fast-follows, pilots) with trade-offs made explicit and a recommended path.',
      },
    },
    {
      name: 'Communication and follow-through',
      anchors: {
        1: 'No plan for how or when people are informed.',
        5: 'Communicates the decision, but without closing the loop.',
        10: 'Right people, right format and timing, written follow-up, and a check-in to confirm the outcome.',
      },
    },
  ],
};

export const keyPoints = {
  'pri-feature-triage': [
    'Ties the choice to the 20% CAC OKR, while sizing the ₹50L deal and the 3% payment bug.',
    'Questions assumptions: is the deal really contingent on PDF export? How much revenue does the 3% checkout failure lose?',
    'Recognises a payment bug at checkout may be urgent (lost revenue, trust) and may not need a full sprint.',
    'Offers a plan for the options not picked (fast-follow, smaller workaround such as a CSV export).',
    'Defines how success will be measured and communicated to Sales and Support.',
  ],
  'pri-roadmap-halved': [
    'Re-ranks the six items against the revenue expectation and effort with half the team.',
    'Keeps a small number of high-revenue or committed items (e.g. checkout, partner API); cuts or delays low-impact ones (dark mode).',
    'Considers external commitments (insurer partners) and dependencies.',
    'Looks for scope cuts inside kept items rather than only dropping whole items.',
    'Communicates proactively to leadership and affected teams with the new plan and trade-offs.',
  ],
  'pri-ceo-chatbot': [
    'Takes the CEO seriously: asks what problem the chatbot should solve and the goal behind it.',
    "Uses the 40% drop-off data to size the checkout opportunity in revenue terms.",
    'Considers health-advice risk, cost and time-to-quality of an AI chatbot.',
    'Proposes a path: fix drop-off first, with a small, safe AI experiment or a dated plan for the chatbot.',
    'Suggests how to frame this to the CEO (data, options, recommendation).',
  ],
  'met-teleconsult-nsm': [
    'North star reflects value delivered, e.g. completed consults with a good outcome per week, not downloads or signups.',
    'Input metrics cover acquisition/activation, doctor supply or wait time, consult completion, repeat usage.',
    'Guardrails such as consult quality ratings, refund rates, wait times, doctor burnout, or unnecessary prescriptions.',
    'Explains why the chosen north star beats alternatives like revenue or DAU.',
  ],
  'met-dau-drop': [
    'First checks data validity: tracking changes, logging bugs, dashboard definition changes.',
    'Checks internal changes around Tuesday: releases, app-store updates, experiments, notification changes, outages.',
    'Segments: platform, app version, country/city, new vs returning, acquisition channel.',
    'Considers external causes: seasonality, holidays, competitor launches, OS updates.',
    'Forms and tests hypotheses, then acts (roll back, fix, communicate) and sets up alerting.',
  ],
  'met-reminders-launch': [
    'States the goal: better medication adherence for users and more reorders for the business.',
    'Adoption: % of active users who add prescriptions and enable reminders.',
    'Engagement/value: reminder open or "taken" rate, retention of reminder users, reorder conversion.',
    'Guardrails: notification opt-outs and uninstalls, complaints, reminder accuracy.',
    'Compares with a baseline or holdout and segments by user type.',
  ],
  'ps-first-insurance': [
    'Defines the segment (first-time buyers, tier-2, salaried, covered by employer) and the core pains: jargon, trust, "why do I need this", price anxiety.',
    'Solutions such as plain-language comparisons, "what happens when you claim" explainers, top-up plans that complement employer cover, vernacular support, assisted buying.',
    'Prioritises an MVP and explains the cut line.',
    'Success metric such as purchase conversion for first-timers, with guardrails like early cancellations or claim disputes.',
  ],
  'ps-parents-booking': [
    'Identifies both users: the adult child (organiser/payer) and the parent (patient) with low digital comfort.',
    'Solutions such as family profiles, choosing who gets reminders, paying on behalf, one-tap or phone-call joining for parents, caregiver summaries.',
    'Handles consent and privacy of the parent’s health data.',
    'Prioritised MVP and a success metric, e.g. completed consults booked for family members, fewer related support tickets.',
  ],
  'ps-ai-lab-tests': [
    'Picks one feature tied to a real pain, e.g. plain-language explanation of lab reports, or smart test recommendations.',
    'Defines the user and why this matters to them.',
    'Addresses medical-safety risk: no diagnosis, clear disclaimers, flagging abnormal values for a doctor, human review.',
    'Plans for accuracy evaluation, privacy of health data, and cost.',
    'Success metric plus guardrail (e.g. user understanding or trust vs. complaints or unsafe outputs).',
  ],
  'stk-sales-escalation': [
    'Prepares a short, data-backed story: the OKR link and how options were scored.',
    "Acknowledges the Sales VP's goal and the deal's value; checks whether the deal truly depends on PDF export.",
    'Offers options: a fast-follow date, a lighter workaround, or a trade if the deal is truly at risk.',
    'Keeps ownership of the decision while staying open to new information.',
    'Follows up with the Sales VP directly and documents the decision.',
  ],
  'stk-eng-deadline': [
    'Understands the engineering estimate: what drives it and where the risk is.',
    'Understands the business side: what exactly was promised and what the penalty is.',
    'Explores options: phased launch or smaller MVP by 1 December, extra resources, renegotiating with the partner.',
    'Does not force a date that compromises quality in a health/claims flow.',
    'Aligns business, engineering and the partner quickly, with a clear owner for partner communication.',
  ],
  'stk-design-vs-data': [
    'Treats the result as a trade-off between short-term conversion and satisfaction.',
    'Digs deeper: which segments lost conversion, is satisfaction tied to retention or long-term value, was the test long enough.',
    'Proposes options: iterate on the parts hurting conversion, run a longer or follow-up test, partial rollout.',
    'Brings designer and growth lead to shared success criteria before deciding.',
    'Makes and communicates a clear decision.',
  ],
};
