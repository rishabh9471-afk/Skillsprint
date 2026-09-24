import { useMemo, useState } from 'react';
import { scenarios, scenarioById } from '../shared/scenarios.js';
import { SKILLS } from '../shared/limits.js';
import { track } from '../lib/track.js';
import { Banner, DifficultyDots, Icon, SkillIcon, VerdictBadge } from './ui.jsx';

const STEP_LABEL = { write: 'Writing your answer', feedback: 'Reviewing feedback', interview: 'In the interview' };

export default function Home({ visitor, progress, status, active, onOpen, onResume, onLeaderboard }) {
  const [skill, setSkill] = useState('all');
  const list = useMemo(() => (skill === 'all' ? scenarios : scenarios.filter((s) => s.skill === skill)), [skill]);
  const doneCount = Object.keys(progress.completed).length;
  const locked = status ? status.remaining === 0 || status.paused : false;
  const [lockNote, setLockNote] = useState('');

  function open(id) {
    const isActive = active && active.scenarioId === id;
    if (locked && !isActive) {
      setLockNote(status.paused ? "The coach has reached today's capacity. New scenarios open tomorrow." : 'New scenarios unlock tomorrow.');
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
        {doneCount > 0 && (
          <div className="progress-mini" aria-label={`${doneCount} of ${scenarios.length} completed`}>
            <span>
              <strong>{doneCount}</strong>/{scenarios.length} done
            </span>
            <div className="progress-mini-track">
              <div style={{ width: `${(doneCount / scenarios.length) * 100}%` }} />
            </div>
          </div>
        )}
      </section>

      {status && status.aiReady === false && <Banner tone="warn">The AI coach isn't configured yet.</Banner>}
      {locked && (
        <Banner tone="info">
          {status.paused
            ? "The coach has reached today's capacity. New scenarios open tomorrow."
            : `That's today's ${status.dailyLimit} scenarios done${active ? ' — you can still finish the one in progress' : ''}. More unlock tomorrow.`}
        </Banner>
      )}
      {lockNote && !locked && <Banner tone="info">{lockNote}</Banner>}

      {active && (
        <button className="resume card" onClick={onResume}>
          <span className="resume-dot" aria-hidden="true" />
          <div>
            <span className="eyebrow">{STEP_LABEL[active.step]}</span>
            <strong>{scenarioById[active.scenarioId].title}</strong>
          </div>
          <span className="btn btn-primary btn-sm">
            Resume <Icon.arrow />
          </span>
        </button>
      )}

      <div className="filters" role="tablist" aria-label="Filter by skill">
        {[['all', 'All'], ...Object.entries(SKILLS).map(([k, v]) => [k, v.label])].map(([k, label]) => (
          <button key={k} role="tab" aria-selected={skill === k} className={`filter ${skill === k ? 'is-on' : ''}`} onClick={() => setSkill(k)}>
            {label}
          </button>
        ))}
      </div>

      <div className="grid" key={skill}>
        {list.map((s, i) => {
          const done = progress.completed[s.id];
          const isActive = active && active.scenarioId === s.id;
          const isLocked = locked && !isActive;
          return (
            <button
              key={s.id}
              className={`scenario ${isLocked ? 'is-locked' : ''} ${isActive ? 'is-active' : ''} ${done ? 'is-done' : ''}`}
              style={{ '--i': i }}
              onClick={() => open(s.id)}
              aria-label={`${s.title}, ${SKILLS[s.skill].label}, ${s.difficulty}${done ? ', completed' : ''}${isLocked ? ', unlocks tomorrow' : ''}`}
            >
              <div className="scenario-top">
                <SkillIcon skill={s.skill} />
                <DifficultyDots level={s.difficulty} />
              </div>
              <h3>{s.title}</h3>
              <div className="scenario-foot">
                <span className="scenario-meta">
                  {isActive ? (
                    <span className="status-active">In progress</span>
                  ) : done ? (
                    <>
                      <VerdictBadge verdict={done.verdict} /> <span className="xp-earned">+{done.xp} XP</span>
                    </>
                  ) : (
                    <>
                      <span className="meta-skill">{SKILLS[s.skill].label} · </span>
                      {s.minutes} min
                    </>
                  )}
                </span>
                <span className="go" aria-hidden="true">
                  {isLocked ? <Icon.lock /> : done && !isActive ? <Icon.check /> : <Icon.arrow />}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <button className="leader-teaser" onClick={onLeaderboard}>
        <Icon.trophy /> This week's leaderboard <Icon.arrow />
      </button>
    </div>
  );
}
