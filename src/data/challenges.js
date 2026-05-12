export const challenges = [
  {
    id: 1,
    title: "The Feature Triage Dilemma",
    category: "Prioritization",
    xp: 80,
    duration: "5 min",
    difficulty: "Medium",
    description: "You're a PM at a health-tech startup. Your eng team has capacity for one feature next sprint.",
    questions: [
      {
        id: "q1",
        title: "The Feature Triage Dilemma",
        subtitle: "Q1 of 2",
        scenario: "Three teams are lobbying for their features: Sales wants a PDF export (closes a big deal), Support wants a bug fix (affects 3% of users), and Growth wants a referral program (long-term retention). How do you decide?",
        question: "What's your approach?",
        options: [
          { id: "a", text: "Go with Sales — revenue impact is most immediate and measurable." },
          { id: "b", text: "Use an impact-effort matrix and align each request to current quarter OKRs before deciding." },
          { id: "c", text: "Fix the bug first — user trust is always the foundation." },
          { id: "d", text: "Ask each team to write a one-pager; schedule a committee vote next week." }
        ],
        correct: "b",
        feedback: {
          a: "Revenue matters, but picking Sales without a framework sets a bad precedent — every team will bring a 'big deal' next sprint. B is stronger because it documents the reasoning.",
          b: "Using a scoring matrix tied to OKRs gives you a defensible, repeatable decision process — not just a gut call. This is what separates senior PMs from junior ones.",
          c: "User trust is real, but 3% impact on a bug vs. OKR-aligned features needs quantification, not instinct. A matrix would likely surface this trade-off objectively.",
          d: "Delegating to a committee slows velocity and signals you lack conviction. PMs own the call — even when it's hard."
        }
      },
      {
        id: "q2",
        title: "Stakeholder Pushback",
        subtitle: "Q2 of 2",
        scenario: "You made your call. Now the Sales VP is escalating to your CPO, claiming you ignored a ₹50L deal. Your CPO asks you to justify the decision in a 5-minute sync. You chose the referral program as it aligned with the OKR of reducing CAC by 20% this quarter.",
        question: "How do you frame your defense?",
        options: [
          { id: "a", text: "Apologize and offer to reprioritize to keep Sales happy." },
          { id: "b", text: "Lead with the OKR link, show the scoring matrix, and propose a fast-follow for the PDF export in the next sprint." },
          { id: "c", text: "Say the process was fair and the team voted on it." },
          { id: "d", text: "Ask the CPO to make the call — it's above your pay grade now." }
        ],
        correct: "b",
        feedback: {
          a: "Backing down under pressure signals you didn't have conviction in your framework. PMs who fold on data-backed decisions lose credibility fast.",
          b: "Leading with the OKR link shows you made a principled decision, not a political one. Offering a fast-follow for Sales shows empathy without caving. This is executive-level thinking.",
          c: "Process-as-defense is weak — it sounds bureaucratic and doesn't address the CPO's underlying concern: did you make the right call?",
          d: "Escalating upward when the CPO just asked you to explain — not decide — is a red flag for ownership and judgment."
        }
      }
    ]
  },
  {
    id: 2,
    title: "The North Star Metric",
    category: "Metrics & OKRs",
    xp: 90,
    duration: "5 min",
    difficulty: "Hard",
    description: "Your startup just hit product-market fit. Now leadership wants one metric to rule them all.",
    questions: [
      {
        id: "q1",
        title: "The North Star Metric",
        subtitle: "Q1 of 2",
        scenario: "Your B2B SaaS product helps HR teams run employee wellness programs. DAUs are growing but revenue is flat. Leadership wants a single North Star Metric to align the whole company.",
        question: "What do you propose as your North Star?",
        options: [
          { id: "a", text: "Daily Active Users — it signals engagement and product stickiness." },
          { id: "b", text: "Number of wellness programs completed per company per month — it ties usage to the core value delivered." },
          { id: "c", text: "Monthly Recurring Revenue — revenue is the only metric that truly matters." },
          { id: "d", text: "NPS score — happy users become advocates and drive growth." }
        ],
        correct: "b",
        feedback: {
          a: "DAU measures activity, not value. Users can log in and do nothing meaningful. A metric that doesn't connect to your core value proposition misleads the team.",
          b: "A North Star should capture the moment customers get value, not just use the product. 'Programs completed' directly ties to what HR teams pay for — outcomes for their employees.",
          c: "Revenue is a lagging indicator — by the time it drops, you've already lost. Leading indicators that predict revenue are more actionable for product teams.",
          d: "NPS is a useful signal but too indirect for day-to-day product decisions. It doesn't tell you *what* to build next."
        }
      },
      {
        id: "q2",
        title: "Metric in Conflict",
        subtitle: "Q2 of 2",
        scenario: "Your North Star (programs completed) is up 30% this quarter. But your renewal rate dropped from 85% to 72%. Your CPO is alarmed. What's your hypothesis?",
        question: "How do you investigate the disconnect?",
        options: [
          { id: "a", text: "Celebrate the North Star win — renewals are a Sales problem, not Product." },
          { id: "b", text: "Segment the churn by company size, usage tier, and program type to find if a specific cohort is driving the drop." },
          { id: "c", text: "Immediately run an NPS survey to understand sentiment." },
          { id: "d", text: "Assume the metric definition is wrong and redefine what counts as a 'completed program'." }
        ],
        correct: "b",
        feedback: {
          a: "Renewals are a direct reflection of the value your product delivers. If customers aren't renewing despite high usage, the metric may not be capturing quality of completion.",
          b: "Segmentation is the right first step. The churn could be isolated to SMBs, free-tier users, or one feature set — each requiring a different fix. Broad data masks actionable signals.",
          c: "An NPS survey is slow and gives you sentiment, not causation. You need behavioral data first to know what questions to even ask.",
          d: "Changing the metric definition to fit the outcome is a classic trap — it destroys trust in data and solves nothing real."
        }
      }
    ]
  },
  {
    id: 3,
    title: "The PRD That Ships",
    category: "PRD Writing",
    xp: 75,
    duration: "5 min",
    difficulty: "Easy",
    description: "You're writing a PRD for a new onboarding flow. Engineering keeps asking for more detail.",
    questions: [
      {
        id: "q1",
        title: "The PRD That Ships",
        subtitle: "Q1 of 2",
        scenario: "You've written a PRD for a redesigned onboarding flow. The engineering lead says it's too vague — specifically that the 'success state' is undefined. Design says the requirements keep changing mid-sprint.",
        question: "What's the root cause and fix?",
        options: [
          { id: "a", text: "Engineers always want too much detail. Stick to your high-level vision and let them figure out implementation." },
          { id: "b", text: "The PRD lacks a clear definition of done and acceptance criteria. Add measurable success metrics and edge-case handling before the sprint starts." },
          { id: "c", text: "Move to daily standups so everyone stays aligned on changes in real time." },
          { id: "d", text: "Bring in a BA to translate the PRD into technical specs for engineering." }
        ],
        correct: "b",
        feedback: {
          a: "Vague PRDs create expensive rework mid-sprint. 'Vision' without 'done criteria' is just a wish list — engineers can't ship against it.",
          b: "A great PRD defines the problem, the success state, and what out-of-scope looks like. Adding measurable acceptance criteria (e.g. 'activation rate ≥ 60% by day 3') eliminates mid-sprint ambiguity.",
          c: "More meetings treat the symptom, not the cause. If the PRD is unclear, daily standups just surface the confusion more often.",
          d: "PMs owning the spec is core to the role. Outsourcing it to a BA creates a telephone game between product vision and engineering execution."
        }
      },
      {
        id: "q2",
        title: "Scope Creep Alert",
        subtitle: "Q2 of 2",
        scenario: "Midway through the sprint, the CEO sees a competitor launch a social login feature and asks you to add it to the current onboarding PRD. Engineering says it'll add 3 days to the sprint.",
        question: "What do you do?",
        options: [
          { id: "a", text: "Add it — the CEO asked and competitive parity matters." },
          { id: "b", text: "Acknowledge the request, log it in the backlog, and protect the current sprint scope. Schedule a prioritization conversation for next sprint planning." },
          { id: "c", text: "Let engineering decide if they can fit it in." },
          { id: "d", text: "Do a quick competitive analysis and present it at the next all-hands before deciding." }
        ],
        correct: "b",
        feedback: {
          a: "Reactive feature additions based on competitor moves — without validation — is a fast path to a bloated, unfocused product. The CEO's instinct is data, not direction.",
          b: "Protecting sprint scope is one of the PM's most important jobs. Acknowledging the idea (so the CEO feels heard), logging it, and creating a structured moment to evaluate it is the right sequence.",
          c: "Engineering shouldn't carry prioritization decisions — that's your job as PM. Delegating scope decisions to the team you're supposed to partner with erodes trust.",
          d: "An all-hands presentation is too slow and too public for a scoping decision. This is a PM + CEO 1:1 conversation with data, not a company event."
        }
      }
    ]
  }
];

export const paths = [
  { id: 1, name: "Prioritization", icon: "🎯", color: "#E8571A", bg: "#FFF0E8", lessons: 12, done: 8 },
  { id: 2, name: "Metrics & OKRs", icon: "📊", color: "#1A5FA8", bg: "#E8F1FB", lessons: 10, done: 4 },
  { id: 3, name: "PRD Writing", icon: "📝", color: "#2D7A4F", bg: "#EBF7F1", lessons: 8, done: 2 },
  { id: 4, name: "User Research", icon: "🔬", color: "#B86A00", bg: "#FFF5E0", lessons: 9, done: 0 }
];

export const leaderboard = [
  { rank: 1, initials: "KM", name: "Karan M", xp: 1240, challenges: 16, color: "#E8571A" },
  { rank: 2, initials: "PR", name: "Priya R", xp: 980, challenges: 13, color: "#B86A00" },
  { rank: 3, initials: "SA", name: "Sneha A", xp: 870, challenges: 11, color: "#2D7A4F" },
  { rank: 4, initials: "RV", name: "Riya V", xp: 820, challenges: 12, color: "#1A5FA8" },
  { rank: 5, initials: "AS", name: "Ayush S", xp: 840, challenges: 10, color: "#E8571A", isYou: true },
  { rank: 6, initials: "NK", name: "Neha K", xp: 790, challenges: 9, color: "#534AB7" },
  { rank: 7, initials: "AM", name: "Arjun M", xp: 710, challenges: 8, color: "#3C3489" }
];
