/* Turns raw events + sessions into the dashboard's numbers.
 * Pure function (no I/O) so it is easy to test. */
import { istDay } from './time.js';

const pct = (a, b) => (b > 0 ? Math.round((a / b) * 1000) / 10 : null);
const avg = (xs) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);
const p90 = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(s.length * 0.9))];
};

function dayList(fromDay, toDay) {
  const out = [];
  for (let d = new Date(`${fromDay}T00:00:00Z`); ; d = new Date(d.getTime() + 86400000)) {
    const s = d.toISOString().slice(0, 10);
    out.push(s);
    if (s >= toDay || out.length > 400) break;
  }
  return out;
}

export function computeMetrics({ events, sessions, usage, fromDay, toDay, scenarios, cap }) {
  const client = events.filter((e) => e.source !== 'server');
  const server = events.filter((e) => e.source === 'server');

  // --- visitors
  const visitorDays = new Map();
  for (const e of client) {
    if (!e.visitor_id) continue;
    const d = istDay(new Date(e.ts));
    if (!visitorDays.has(e.visitor_id)) visitorDays.set(e.visitor_id, new Set());
    visitorDays.get(e.visitor_id).add(d);
  }
  const uniqueVisitors = visitorDays.size;
  const returningVisitors = [...visitorDays.values()].filter((s) => s.size >= 2).length;

  // --- sessions
  const coached = sessions.length; // a session row exists once feedback was delivered
  const completedRows = sessions.filter((s) => s.verdict);
  const revisedRows = sessions.filter((s) => (s.revisions || 0) > 0 && s.latest_score != null && s.first_score != null);
  const lift = avg(revisedRows.map((s) => Number(s.latest_score) - Number(s.first_score)));

  // --- ratings
  const ratings = client.filter((e) => e.name === 'feedback_rated');
  const up = ratings.filter((e) => e.props?.value === 'up').length;

  // --- funnel (distinct sessions per step)
  const bySession = (name) => new Set(client.filter((e) => e.name === name && e.session_id).map((e) => e.session_id));
  const opened = bySession('scenario_opened');
  const submitted = bySession('answer_submitted');
  const shown = bySession('feedback_shown');
  const revise = bySession('chose_revise');
  const interview = bySession('chose_interview');
  const verdicts = bySession('verdict_shown');
  const moved = new Set([...revise, ...interview]);
  const funnel = [
    { step: 'Opened a scenario', count: opened.size },
    { step: 'Submitted an answer', count: submitted.size },
    { step: 'Saw AI feedback', count: shown.size },
    { step: 'Revised or went to interview', count: moved.size },
    { step: 'Reached a verdict', count: verdicts.size },
  ];

  // --- path after feedback
  let revisedPath = 0;
  let interviewOnly = 0;
  let leftAfter = 0;
  for (const sid of shown) {
    if (revise.has(sid)) revisedPath++;
    else if (interview.has(sid)) interviewOnly++;
    else leftAfter++;
  }

  // --- daily trend
  const days = dayList(fromDay, toDay);
  const daily = days.map((d) => ({ day: d, visitors: 0, coached: 0, completed: 0 }));
  const dayIndex = Object.fromEntries(days.map((d, i) => [d, i]));
  for (const [, set] of visitorDays) for (const d of set) if (d in dayIndex) daily[dayIndex[d]].visitors++;
  for (const s of sessions) {
    const d = s.day || istDay(new Date(s.started_at));
    if (d in dayIndex) {
      daily[dayIndex[d]].coached++;
      if (s.verdict) daily[dayIndex[d]].completed++;
    }
  }

  // --- per scenario
  const scenarioRows = scenarios.map((sc) => {
    const rows = sessions.filter((s) => s.scenario_id === sc.id);
    const done = rows.filter((s) => s.verdict);
    const openedCount = new Set(client.filter((e) => e.name === 'scenario_opened' && e.scenario_id === sc.id).map((e) => e.session_id)).size;
    return {
      id: sc.id,
      title: sc.title,
      skill: sc.skill,
      opened: openedCount,
      coached: rows.length,
      completed: done.length,
      completionRate: pct(done.length, rows.length),
      avgFirstScore: avg(rows.map((s) => Number(s.first_score)).filter(Number.isFinite)),
      avgFinal: avg(done.map((s) => Number(s.final_score)).filter(Number.isFinite)),
    };
  });

  // --- verdict mix
  const verdictMix = { strong: 0, borderline: 0, needs_work: 0 };
  for (const s of completedRows) if (s.verdict in verdictMix) verdictMix[s.verdict]++;

  // --- AI health
  const tasks = server.filter((e) => e.name === 'ai_task');
  const okTasks = tasks.filter((e) => e.props?.ok);
  const todayKey = toDay;
  const usedToday = (usage.find((u) => u.day === todayKey) || {}).requests || 0;

  return {
    tiles: {
      coachedSessions: coached,
      uniqueVisitors,
      completionRate: pct(completedRows.length, coached),
      completedSessions: completedRows.length,
      returningVisitors,
      returningRate: pct(returningVisitors, uniqueVisitors),
      helpfulRate: pct(up, ratings.length),
      ratings: ratings.length,
      avgRevisionLift: lift,
      revisedSessions: revisedRows.length,
      avgFinalScore: avg(completedRows.map((s) => Number(s.final_score)).filter(Number.isFinite)),
      xpAwarded: completedRows.reduce((a, s) => a + (s.xp || 0), 0),
    },
    funnel,
    paths: { revised: revisedPath, interviewOnly, leftAfterFeedback: leftAfter, total: shown.size },
    daily,
    scenarios: scenarioRows,
    verdictMix,
    ai: {
      requestsToday: usedToday,
      dailyCap: cap,
      tasks: tasks.length,
      successRate: pct(okTasks.length, tasks.length),
      fallbackRate: pct(okTasks.filter((e) => e.props?.fallback).length, okTasks.length),
      p90Ms: p90(okTasks.map((e) => Number(e.props?.ms)).filter(Number.isFinite)),
      notAnAnswer: server.filter((e) => e.name === 'not_an_answer').length,
      injectionFlags: server.filter((e) => e.name === 'graded' && e.props?.injection).length,
      dailyLimitHits: server.filter((e) => e.name === 'limit_hit' && e.props?.kind === 'daily').length,
      pausedHits: server.filter((e) => e.name === 'limit_hit' && e.props?.kind === 'global').length,
      requestsByDay: days.map((d) => ({ day: d, requests: (usage.find((u) => u.day === d) || {}).requests || 0 })),
    },
  };
}
