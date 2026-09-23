import { useMemo, useState } from 'react';
import { scenarios, scenarioById } from '../shared/scenarios.js';
import { SKILLS } from '../shared/limits.js';
import { track } from '../lib/track.js';
import { Banner, DifficultyDots, Icon, SkillChip, VerdictBadge } from './ui.jsx';

const STEP_LABEL = { write: 'Writing your answer', feedback: 'Reviewing feedback', interview: 'In the interview' };

export default function Home({ visitor, progress, status, active, onOpen, onResume, onLeaderboard }) {
  const [skill, setSkill] = useState('all');
  const list = useMemo(() => (skill === 'all' ? scenarios : scenarios.filter((s) => s.skill === skill)), [skill]);
  const doneCount = Object.keys(progress.completed).length;
  const remaining = status ? status.remaining : null;
  const locked = status ? status.remaining === 0 || status.paused : false;
  const [lockNote, setLockNote] = useState('');

  function open(id) {
    const isActive = active && active.scenarioId === id;
    if (locked && !isActive) {
      setLockNote(
        status.paused
          ? "The coach has reached today's capacity. New scenarios open again tomorrow."
          : `You've started all ${status.dailyLimit} of today's scenarios. Come back tomorrow for more.`
      );
      track('limit_seen', { scenarioId: id, kind: status.paused ? 'global' : 'daily' });
      return;
    }
    onOpen(id);
  }

  return (
    <div className="home">
      <section className="home-head">
        <div>
          <p className="eyebrow">Hi {visitor.nickname}</p>
          <h1>{doneCount === 0 ? 'Pick your first scenario' : 'Ready for another sprint?'}</h1>
        </div>
        <div className="stat-row">
          <div className="stat">
            <strong>{progress.totalXp}</strong>
            <span>Total XP</span>
          </div>
          <div className="stat">
            <strong>
              {doneCount}
              <small>/{scenarios.length}</small>
            </strong>
            <span>Completed</span>
          </div>
          <div className="stat">
            <strong>
              {remaining ?? '–'}
              <small>/{status?.dailyLimit ?? 3}</small>
            </strong>
            <span>Left today</span>
          </div>
        </div>
      </section>

      {status && status.aiReady === false && (
        <Banner tone="warn">The AI coach isn't configured yet. The site owner needs to add a GEMINI_API_KEY in Vercel.</Banner>
      )}
      {status?.paused && <Banner tone="warn">The coach has reached today's capacity. You can finish a scenario in progress; new ones open tomorrow.</Banner>}
      {!status?.paused && remaining === 0 && (
        <Banner tone="info">
          You've used today's {status.dailyLimit} scenarios{active ? ' — you can still finish the one in progress' : ''}. New ones unlock tomorrow at midnight (IST).
        </Banner>
      )}
      {lockNote && <Banner tone="info">{lockNote}</Banner>}

      {active && (
        <button className="resume card" onClick={onResume}>
          <div>
            <span className="eyebrow">Continue where you left off</span>
            <strong>{scenarioById[active.scenarioId].title}</strong>
            <span className="muted">{STEP_LABEL[active.step]}</span>
          </div>
          <span className="btn btn-primary">
            Resume <Icon.arrow />
          </span>
        </button>
      )}

      {doneCount === 0 && !active && (
        <div className="how card">
          <div>
            <Icon.edit />
            <span>
              <strong>Write</strong> a 100–300 word answer
            </span>
          </div>
          <div>
            <Icon.spark />
            <span>
              <strong>Get coached</strong>, then revise up to twice
            </span>
          </div>
          <div>
            <Icon.mic />
            <span>
              <strong>Answer 2 follow-ups</strong> for your verdict
            </span>
          </div>
        </div>
      )}

      <div className="filters" role="tablist" aria-label="Filter by skill">
        {[['all', 'All'], ...Object.entries(SKILLS).map(([k, v]) => [k, v.label])].map(([k, label]) => (
          <button key={k} role="tab" aria-selected={skill === k} className={`filter ${skill === k ? 'is-on' : ''}`} onClick={() => setSkill(k)}>
            {label}
          </button>
        ))}
      </div>

      <div className="grid">
        {list.map((s) => {
          const done = progress.completed[s.id];
          const isActive = active && active.scenarioId === s.id;
          const isLocked = locked && !isActive;
          return (
            <button key={s.id} className={`scenario card ${isLocked ? 'is-locked' : ''}`} onClick={() => open(s.id)}>
              <div className="scenario-top">
                <SkillChip skill={s.skill} />
                <DifficultyDots level={s.difficulty} />
              </div>
              <h3>{s.title}</h3>
              <p className="scenario-teaser">{s.context}</p>
              <div className="scenario-foot">
                {isActive ? (
                  <span className="status status-active">In progress</span>
                ) : done ? (
                  <span className="status status-done">
                    <Icon.check /> {done.xp} XP · <VerdictBadge verdict={done.verdict} />
                  </span>
                ) : (
                  <span className="muted small">
                    <Icon.clock /> ~{s.minutes} min
                  </span>
                )}
                <span className="scenario-cta">
                  {isLocked ? (
                    <>
                      <Icon.lock /> Tomorrow
                    </>
                  ) : isActive ? (
                    <>
                      Resume <Icon.arrow />
                    </>
                  ) : done ? (
                    <>
                      Practise again <Icon.arrow />
                    </>
                  ) : (
                    <>
                      Start <Icon.arrow />
                    </>
                  )}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <button className="leader-teaser" onClick={onLeaderboard}>
        <Icon.trophy /> See this week's leaderboard <Icon.arrow />
      </button>
    </div>
  );
}
