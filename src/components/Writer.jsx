import { useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { track } from '../lib/track.js';
import { useAutosize, useRotating } from '../lib/hooks.js';
import { LIMITS, capWords, countWords } from '../shared/limits.js';
import { Banner, DifficultyDots, Icon, SkillChip, Spinner, WordMeter } from './ui.jsx';

const LOADING = [
  'Reading your answer…',
  'Scoring it against the rubric…',
  'Finding your weakest paragraph…',
  'Preparing the interviewer’s questions…',
  'Almost there…',
];

const norm = (s) => s.trim().replace(/\s+/g, ' ').toLowerCase();

export default function Writer({ scenario, active, visitor, online, update, onExit, onDailyLimit }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null); // { code, message }
  const inFlight = useRef(false); // blocks double submits within the same tick
  const ref = useAutosize(active.draft);
  const loadingMsg = useRotating(LOADING, busy);

  const last = active.versions[active.versions.length - 1];
  const revisionNumber = active.versions.length; // 0 = first attempt
  const words = countWords(active.draft);
  const unchanged = last && norm(last.answer) === norm(active.draft);
  const tooShort = words < LIMITS.MIN_WORDS;
  const canSubmit = !busy && !tooShort && !unchanged && online;

  function onChange(e) {
    let v = e.target.value;
    if (countWords(v) > LIMITS.MAX_WORDS) v = capWords(v, LIMITS.MAX_WORDS);
    update({ draft: v, notAnswer: null });
    if (error && error.code !== 'daily_limit' && error.code !== 'paused') setError(null);
  }

  async function submit() {
    if (!canSubmit || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    const answer = active.draft.trim();
    track('answer_submitted', { sessionId: active.sessionId, scenarioId: scenario.id, version: revisionNumber + 1, words });
    try {
      const result = await api.grade({
        visitorId: visitor.id,
        sessionId: active.sessionId,
        scenarioId: scenario.id,
        answer,
        token: last?.result.token,
      });
      if (result.status === 'not_an_answer') {
        update({ notAnswer: result.reason });
        return;
      }
      update((a) => ({ versions: [...a.versions, { answer, result }], step: 'feedback', notAnswer: null, rated: null }));
      if (result.version === 1) onDailyLimit(); // refresh 'left today'
      track('feedback_shown', { sessionId: active.sessionId, scenarioId: scenario.id, version: result.version, score: result.score });
    } catch (err) {
      setError({ code: err.code, message: err.message });
      track('error_shown', { sessionId: active.sessionId, scenarioId: scenario.id, code: err.code, where: 'grade' });
      if (err.code === 'daily_limit' || err.code === 'paused') onDailyLimit();
      if (err.code === 'revision_limit') update({ step: 'feedback' });
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="session">
      <button className="back" onClick={onExit}>
        <Icon.back /> All scenarios
      </button>

      <div className="session-head">
        <div className="meta-row">
          <SkillChip skill={scenario.skill} />
          <DifficultyDots level={scenario.difficulty} />
          <span className="muted small">
            <Icon.clock /> ~{scenario.minutes} min
          </span>
        </div>
        <h1>{scenario.title}</h1>
      </div>

      <div className="scenario-box">
        <span className="label">Scenario</span>
        <p>{scenario.context}</p>
      </div>
      <p className="question">{scenario.prompt}</p>

      {last && (
        <div className="revision-box">
          <div className="revision-top">
            <span className="eyebrow">
              Revision {revisionNumber} of {LIMITS.MAX_REVISIONS}
            </span>
            <span className="muted small">Previous score {last.result.score.toFixed(1)}/10</span>
          </div>
          <p>
            <strong>Focus on:</strong> {last.result.topFix}
          </p>
          <button className="link-btn" onClick={() => update({ step: 'feedback', draft: last.answer, notAnswer: null })} disabled={busy}>
            Cancel revision and go back to feedback
          </button>
        </div>
      )}

      <label className="answer-label" htmlFor="answer">
        Your answer
      </label>
      <textarea
        id="answer"
        ref={ref}
        className="answer"
        value={active.draft}
        onChange={onChange}
        placeholder="Think out loud like you would in an interview: state the goal, compare the options, make a call, and say how you'd know it worked."
        disabled={busy}
        spellCheck
      />
      <WordMeter text={active.draft} />
      <p className="saved-note">
        <Icon.check /> Draft saved on this device
      </p>

      {active.notAnswer && (
        <Banner tone="warn">
          <strong>This doesn't answer the scenario yet.</strong> {active.notAnswer} This didn't use up a revision.
        </Banner>
      )}
      {unchanged && !busy && <Banner tone="info">Change something before resubmitting — the coach needs a new version to compare.</Banner>}
      {error && (
        <Banner tone={error.code === 'daily_limit' || error.code === 'paused' ? 'info' : 'bad'}>
          {error.message}
          {error.code === 'bad_token' && (
            <>
              {' '}
              <button className="link-btn inline" onClick={onExit}>
                Back to scenarios
              </button>
            </>
          )}
        </Banner>
      )}

      <div className="submit-row">
        <button className="btn btn-primary btn-lg" onClick={submit} disabled={!canSubmit}>
          {busy ? (
            <>
              <Spinner /> {loadingMsg}
            </>
          ) : (
            <>
              {last ? 'Resubmit for feedback' : 'Get feedback'} <Icon.arrow />
            </>
          )}
        </button>
        {!online && <span className="muted small">You're offline — your draft is safe.</span>}
      </div>
      <p className="fineprint">Graded by a free AI service. Please don't include personal or confidential information.</p>
    </div>
  );
}
