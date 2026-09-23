import { useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { track } from '../lib/track.js';
import { useAutosize, useRotating } from '../lib/hooks.js';
import { LIMITS, capWords, countWords } from '../shared/limits.js';
import { Banner, Icon, Spinner } from './ui.jsx';

const LOADING = ['The interviewer is reviewing your replies…', 'Weighing your answer and follow-ups…', 'Writing your verdict…'];

export default function Interview({ scenario, active, visitor, online, progress, update, onExit, onVerdict }) {
  const last = active.versions[active.versions.length - 1];
  const questions = last.result.followUps;
  const i = active.fuIndex;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const inFlight = useRef(false);
  const loadingMsg = useRotating(LOADING, busy);
  const reply = i < 2 ? active.replies[i] : '';
  const ref = useAutosize(reply);
  const ctx = { sessionId: active.sessionId, scenarioId: scenario.id };

  function setReply(v) {
    if (countWords(v) > LIMITS.FU_MAX_WORDS) v = capWords(v, LIMITS.FU_MAX_WORDS);
    const replies = [...active.replies];
    replies[i] = v;
    update({ replies });
  }

  async function getVerdict(replies, skipped) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      const v = await api.verdict({
        visitorId: visitor.id,
        sessionId: active.sessionId,
        token: last.result.token,
        answer: last.answer,
        replies: replies.map((r, k) => (skipped[k] ? null : r.trim())),
        alreadyCompleted: Boolean(progress.completed[scenario.id]),
      });
      onVerdict(v);
    } catch (err) {
      setError({ code: err.code, message: err.message });
      track('error_shown', { ...ctx, code: err.code, where: 'verdict' });
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  function next(skip) {
    const skipped = [...active.skipped];
    skipped[i] = skip;
    track(skip ? 'followup_skipped' : 'followup_answered', { ...ctx, question: i + 1, words: skip ? 0 : countWords(reply) });
    update({ skipped, fuIndex: i + 1 });
    if (i === 1) getVerdict(active.replies, skipped);
  }

  const words = countWords(reply);
  const canAnswer = words >= LIMITS.FU_MIN_WORDS;

  return (
    <div className="session">
      <button className="back" onClick={onExit}>
        <Icon.back /> All scenarios
      </button>

      <div className="interview-head">
        <span className="eyebrow">Interview · {scenario.title}</span>
        <div className="progress-dots" aria-label={`Question ${Math.min(i + 1, 2)} of 2`}>
          {[0, 1].map((k) => (
            <span key={k} className={k < i ? 'done' : k === i ? 'current' : ''} />
          ))}
        </div>
      </div>

      <div className="chat">
        {questions.map((q, k) =>
          k > i ? null : (
            <div key={k} className="chat-turn">
              <div className="bubble bubble-them">
                <span className="who">
                  <Icon.mic /> Interviewer · Question {k + 1} of 2
                </span>
                <p>{q}</p>
              </div>
              {k < i && (
                <div className={`bubble bubble-me ${active.skipped[k] ? 'skipped' : ''}`}>
                  <p>{active.skipped[k] ? 'Skipped' : active.replies[k]}</p>
                  {k === i - 1 && i < 2 && (
                    <button className="link-btn" onClick={() => update({ fuIndex: k })}>
                      Edit
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        )}
      </div>

      {i < 2 ? (
        <div className="reply">
          <label className="answer-label" htmlFor="reply">
            Your reply
          </label>
          <textarea
            id="reply"
            ref={ref}
            className="answer answer-sm"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Answer like you would out loud: direct, specific, with a number or an example if you can."
            autoFocus
          />
          <div className="reply-meta">
            <span className="muted small">Aim for 30–150 words</span>
            <span className="mono small">
              {words} / {LIMITS.FU_MAX_WORDS}
            </span>
          </div>
          <div className="reply-actions">
            <button className="btn btn-ghost" onClick={() => next(true)}>
              Skip question
            </button>
            <button className="btn btn-primary" onClick={() => next(false)} disabled={!canAnswer}>
              {i === 0 ? 'Answer & next question' : 'Answer & get verdict'} <Icon.arrow />
            </button>
          </div>
          {!canAnswer && words > 0 && <p className="muted small">Write at least {LIMITS.FU_MIN_WORDS} words, or skip this question.</p>}
          {i === 1 && <p className="muted small">Skipping a question means no follow-up XP bonus.</p>}
        </div>
      ) : (
        <div className="verdict-wait card">
          {busy ? (
            <p className="loading-line">
              <Spinner /> {loadingMsg}
            </p>
          ) : error ? (
            <>
              <Banner tone={error.code === 'paused' ? 'info' : 'bad'}>{error.message}</Banner>
              <div className="reply-actions">
                {error.code !== 'bad_token' && error.code !== 'answer_mismatch' ? (
                  <button className="btn btn-primary" onClick={() => getVerdict(active.replies, active.skipped)} disabled={!online}>
                    Try again
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={onExit}>
                    Back to scenarios
                  </button>
                )}
                <button className="btn btn-ghost" onClick={() => update({ fuIndex: 1 })}>
                  Edit my last reply
                </button>
              </div>
            </>
          ) : (
            <>
              <p>Both questions are done. Ready for your verdict?</p>
              <div className="reply-actions">
                <button className="btn btn-ghost" onClick={() => update({ fuIndex: 1 })}>
                  Edit my last reply
                </button>
                <button className="btn btn-primary" onClick={() => getVerdict(active.replies, active.skipped)} disabled={!online}>
                  Get my verdict <Icon.arrow />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
