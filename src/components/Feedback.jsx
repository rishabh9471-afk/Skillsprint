import { track } from '../lib/track.js';
import { LIMITS } from '../shared/limits.js';
import { Banner, Icon, ScoreRing, scoreTone } from './ui.jsx';

export default function Feedback({ scenario, active, update, onExit }) {
  const idx = active.versions.length - 1;
  const { result, answer } = active.versions[idx];
  const delta = result.previousScore != null ? Math.round((result.score - result.previousScore) * 10) / 10 : null;
  const revisionsLeft = result.revisionsLeft;
  const ctx = { sessionId: active.sessionId, scenarioId: scenario.id };

  function revise() {
    update({ step: 'write', draft: answer, notAnswer: null });
    track('chose_revise', { ...ctx, version: result.version });
  }
  function interview() {
    update({ step: 'interview', fuIndex: 0 });
    track('chose_interview', { ...ctx, version: result.version });
  }
  function rate(value) {
    if (active.rated) return;
    update({ rated: value });
    track('feedback_rated', { ...ctx, value, version: result.version });
  }

  return (
    <div className="session">
      <button className="back" onClick={onExit}>
        <Icon.back /> All scenarios
      </button>

      <div className="fb-hero card">
        <ScoreRing score={result.score} />
        <div className="fb-hero-text">
          <span className="eyebrow">
            {result.version === 1 ? 'Your feedback' : `Feedback on revision ${result.version - 1}`} · {scenario.title}
          </span>
          {delta != null && (
            <span className={`delta ${delta > 0 ? 'up' : delta < 0 ? 'down' : ''}`}>
              {delta > 0 ? '+' : ''}
              {delta.toFixed(1)} from {result.previousScore.toFixed(1)}
            </span>
          )}
          <p className="fb-summary">{result.summary}</p>
          {result.confidence === 'low' && (
            <p className="muted small">
              <Icon.info /> Borderline call — could be a point either way.
            </p>
          )}
        </div>
      </div>

      <div className="fix card">
        <span className="label">
          <Icon.spark /> The one thing to fix
        </span>
        <p>{result.topFix}</p>
      </div>

      <h2 className="section-title">Rubric breakdown</h2>
      <div className="dims">
        {result.dimensions.map((d, k) => (
          <div key={d.name} className="dim card" style={{ '--i': k }}>
            <div className="dim-top">
              <strong>{d.name}</strong>
              <span className={`dim-score tone-${scoreTone(d.score)}`}>{d.score}/10</span>
            </div>
            <div className="bar" role="img" aria-label={`${d.name}: ${d.score} out of 10`}>
              <div className={`bar-fill tone-bg-${scoreTone(d.score)}`} style={{ width: `${d.score * 10}%` }} />
            </div>
            <p>{d.comment}</p>
            {d.evidence ? <blockquote>“{d.evidence}”</blockquote> : <span className="not-addressed">Not addressed</span>}
          </div>
        ))}
      </div>

      <h2 className="section-title">Your weakest paragraph, rewritten</h2>
      <div className="rewrite">
        <div className="rewrite-col before">
          <span className="label">You wrote</span>
          <p>{result.weakestParagraph}</p>
        </div>
        <div className="rewrite-col after">
          <span className="label">Stronger version</span>
          <p>{result.rewrite}</p>
        </div>
      </div>

      {result.injectionAttempt && (
        <Banner tone="info">Part of your answer read like instructions to the AI, so it was graded as plain text.</Banner>
      )}

      <div className="rate">
        <span>Helpful?</span>
        <button className={`rate-btn ${active.rated === 'up' ? 'is-on' : ''}`} onClick={() => rate('up')} disabled={Boolean(active.rated)} aria-label="Helpful">
          <Icon.up />
        </button>
        <button className={`rate-btn ${active.rated === 'down' ? 'is-on' : ''}`} onClick={() => rate('down')} disabled={Boolean(active.rated)} aria-label="Not helpful">
          <Icon.down />
        </button>
        {active.rated && <span className="muted small thanks">Thanks!</span>}
      </div>

      <div className="next card">
        <div className="next-options">
          <div className={`next-option ${revisionsLeft === 0 ? 'is-disabled' : ''}`}>
            <Icon.edit />
            <div>
              <strong>Revise your answer</strong>
              <span>
                {revisionsLeft > 0 ? `${revisionsLeft} left · +15 XP if you improve by 1+` : 'No revisions left'}
              </span>
            </div>
            <button className="btn btn-ghost" onClick={revise} disabled={revisionsLeft === 0}>
              Revise
            </button>
          </div>
          <div className="next-option">
            <Icon.mic />
            <div>
              <strong>Face the interviewer</strong>
              <span>2 follow-ups, then your verdict</span>
            </div>
            <button className="btn btn-primary" onClick={interview}>
              Start interview <Icon.arrow />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
