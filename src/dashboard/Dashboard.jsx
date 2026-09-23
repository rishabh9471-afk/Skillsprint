import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { load, save, remove, KEYS } from '../lib/storage.js';
import { SKILLS, VERDICTS } from '../shared/limits.js';
import { Banner, Icon, Spinner } from '../components/ui.jsx';
import { DayBars, Funnel, SplitBar, TrendChart } from './charts.jsx';

const RANGES = [
  [1, 'Today'],
  [7, '7 days'],
  [30, '30 days'],
  [90, '90 days'],
];

const show = (v, suffix = '') => (v == null ? '–' : `${v}${suffix}`);

export default function Dashboard() {
  const [password, setPassword] = useState(() => sessionStorage.getItem(KEYS.dash) || '');
  const [authed, setAuthed] = useState(false);
  const [days, setDays] = useState(() => load('ss.dashDays', 7));
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function fetchData(pw = password, d = days) {
    setBusy(true);
    setError('');
    try {
      const res = await api.dashboard(pw, d);
      setData(res);
      setAuthed(true);
      sessionStorage.setItem(KEYS.dash, pw);
    } catch (e) {
      if (e.code === 'wrong_password') {
        setAuthed(false);
        sessionStorage.removeItem(KEYS.dash);
      }
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    document.title = 'SkillSprint — Metrics';
    if (password) fetchData(password, days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pickRange(d) {
    setDays(d);
    save('ss.dashDays', d);
    fetchData(password, d);
  }

  if (!authed) {
    return (
      <div className="dash-login">
        <form
          className="card"
          onSubmit={(e) => {
            e.preventDefault();
            fetchData();
          }}
        >
          <div className="brand brand-static">
            <span className="brand-mark">
              <Icon.bolt />
            </span>
            <span className="brand-name">SkillSprint metrics</span>
          </div>
          <label className="field">
            <span>Dashboard password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus autoComplete="current-password" />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn-primary btn-block" disabled={!password || busy}>
            {busy && <Spinner />} Open dashboard
          </button>
          <a className="link-btn" href="/">
            Back to the app
          </a>
        </form>
      </div>
    );
  }

  const t = data.tiles;
  const ai = data.ai;
  const verdictTotal = Object.values(data.verdictMix).reduce((a, b) => a + b, 0);

  return (
    <div className="dash viz-root">
      <header className="dash-head">
        <div>
          <span className="eyebrow">SkillSprint AI Coach</span>
          <h1>Metrics</h1>
          <p className="muted small">
            {data.range.fromDay === data.range.toDay ? data.range.toDay : `${data.range.fromDay} → ${data.range.toDay}`} · IST · updated{' '}
            {new Date(data.generatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="dash-controls">
          <div className="seg" role="tablist" aria-label="Date range">
            {RANGES.map(([d, label]) => (
              <button key={d} role="tab" aria-selected={days === d} className={days === d ? 'is-on' : ''} onClick={() => pickRange(d)}>
                {label}
              </button>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => fetchData()} disabled={busy}>
            {busy ? <Spinner /> : 'Refresh'}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              sessionStorage.removeItem(KEYS.dash);
              remove(KEYS.dash);
              setPassword('');
              setAuthed(false);
            }}
          >
            Lock
          </button>
        </div>
      </header>

      {error && <Banner tone="bad">{error}</Banner>}
      {data.storage === 'memory' && (
        <Banner tone="warn">Database not connected — these numbers are from temporary memory and will reset. Add the Supabase variables in Vercel.</Banner>
      )}

      <section className="tiles">
        <Tile hero label="Coached sessions" hint="North star · sessions that received AI feedback" value={show(t.coachedSessions)} />
        <Tile label="Unique visitors" hint="Distinct devices with any activity" value={show(t.uniqueVisitors)} />
        <Tile label="Completion rate" hint={`${t.completedSessions} of ${t.coachedSessions} coached sessions reached a verdict`} value={show(t.completionRate, '%')} />
        <Tile label="Returning visitors" hint="Active on 2+ different days" value={show(t.returningVisitors)} sub={t.returningRate != null ? `${t.returningRate}% of visitors` : null} />
        <Tile label="Feedback helpful" hint={`${t.ratings} ratings`} value={show(t.helpfulRate, '%')} />
        <Tile label="Score lift on revision" hint={`Across ${t.revisedSessions} revised sessions`} value={t.avgRevisionLift == null ? '–' : `${t.avgRevisionLift > 0 ? '+' : ''}${t.avgRevisionLift}`} />
        <Tile label="Avg final score" hint="Completed sessions, out of 10" value={show(t.avgFinalScore)} />
        <Tile label="XP awarded" hint="First completions only" value={show(t.xpAwarded)} />
      </section>

      <div className="dash-grid">
        <section className="card panel">
          <h2>Journey funnel</h2>
          <p className="muted small">Distinct sessions reaching each step · % shows conversion from the previous step</p>
          <Funnel steps={data.funnel} />
        </section>

        <section className="card panel">
          <h2>What people do after feedback</h2>
          <p className="muted small">Sessions that saw feedback, by the path they took</p>
          <SplitBar
            parts={[
              { label: 'Revised', value: data.paths.revised, color: '--series-1' },
              { label: 'Straight to interview', value: data.paths.interviewOnly, color: '--series-2' },
              { label: 'Left after feedback', value: data.paths.leftAfterFeedback, color: '--series-3' },
            ]}
          />
          <h3 className="panel-sub">Verdicts</h3>
          <div className="verdict-mix">
            {Object.entries(VERDICTS).map(([k, v]) => (
              <div key={k} className="vm-row">
                <span className={`verdict verdict-${v.tone}`}>{v.label}</span>
                <div className="vm-track">
                  <div className={`vm-bar tone-bg-${v.tone}`} style={{ width: verdictTotal ? `${(data.verdictMix[k] / verdictTotal) * 100}%` : 0 }} />
                </div>
                <span className="mono small">{data.verdictMix[k]}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card panel panel-wide">
          <h2>Daily activity</h2>
          <TrendChart
            data={data.daily}
            series={[
              { key: 'visitors', label: 'Visitors', color: '--series-1' },
              { key: 'coached', label: 'Coached sessions', color: '--series-2' },
            ]}
          />
        </section>

        <section className="card panel panel-wide">
          <h2>Scenarios</h2>
          <p className="muted small">Low completion or low first scores can mean a scenario is unclear or too hard.</p>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Scenario</th>
                  <th>Skill</th>
                  <th className="num">Opened</th>
                  <th className="num">Coached</th>
                  <th className="num">Completion</th>
                  <th className="num">Avg first score</th>
                  <th className="num">Avg final</th>
                </tr>
              </thead>
              <tbody>
                {[...data.scenarios]
                  .sort((a, b) => b.opened - a.opened)
                  .map((s) => (
                    <tr key={s.id}>
                      <td>{s.title}</td>
                      <td className="muted">{SKILLS[s.skill].label}</td>
                      <td className="num">{s.opened}</td>
                      <td className="num">{s.coached}</td>
                      <td className="num">{show(s.completionRate, '%')}</td>
                      <td className="num">{show(s.avgFirstScore)}</td>
                      <td className="num">{show(s.avgFinal)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card panel panel-wide">
          <h2>AI health</h2>
          <div className="tiles tiles-sm">
            <Tile label="Requests today" value={`${ai.requestsToday}`} sub={`of ${ai.dailyCap} daily cap`} />
            <Tile label="AI success rate" value={show(ai.successRate, '%')} sub={`${ai.tasks} tasks`} />
            <Tile label="Served by fallback" value={show(ai.fallbackRate, '%')} sub="Groq instead of Gemini" />
            <Tile label="p90 response time" value={ai.p90Ms == null ? '–' : `${(ai.p90Ms / 1000).toFixed(1)}s`} sub="Target under 8s" />
            <Tile label="Not an answer" value={`${ai.notAnAnswer}`} sub={`${ai.injectionFlags} injection flags`} />
            <Tile label="Limit hits" value={`${ai.dailyLimitHits}`} sub={`${ai.pausedHits} at global cap`} />
          </div>
          <h3 className="panel-sub">AI requests per day</h3>
          <DayBars data={ai.requestsByDay} valueKey="requests" refValue={ai.dailyCap} refLabel={`Daily cap ${ai.dailyCap}`} />
        </section>
      </div>

      <p className="muted small center">
        Settings: {data.settings.dailyScenarioLimit} new scenarios per visitor per day · global AI cap {data.settings.globalDailyAiCap}/day. Change them in
        Vercel environment variables.
      </p>
    </div>
  );
}

function Tile({ label, value, hint, sub, hero }) {
  return (
    <div className={`tile ${hero ? 'tile-hero' : ''}`}>
      <span className="tile-label">{label}</span>
      <strong className="tile-value">{value}</strong>
      {sub && <span className="tile-sub">{sub}</span>}
      {hint && <span className="tile-hint">{hint}</span>}
    </div>
  );
}
