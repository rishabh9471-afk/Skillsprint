import { useState } from 'react';
import { api } from '../lib/api.js';
import { track } from '../lib/track.js';
import { LIMITS } from '../shared/limits.js';
import { Icon, Spinner } from './ui.jsx';

export default function Onboarding({ onDone }) {
  const [mode, setMode] = useState('new'); // new | recover
  const [nick, setNick] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function start(e) {
    e.preventDefault();
    setError('');
    const n = nick.trim();
    if (n.length < LIMITS.NICK_MIN) return setError(`Pick a nickname of at least ${LIMITS.NICK_MIN} characters.`);
    setBusy(true);
    try {
      const v = await api.createVisitor(n);
      onDone({ id: v.visitorId, nickname: v.nickname, tag: v.tag, recoveryCode: v.saved ? v.recoveryCode : null, codeSaved: false });
      track('onboarded');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function recover(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const v = await api.recover(code);
      onDone(
        { id: v.visitorId, nickname: v.nickname, tag: v.tag, recoveryCode: v.recoveryCode, codeSaved: true },
        { completed: v.completed, totalXp: v.totalXp }
      );
      track('recovered');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="onboard">
      <div className="onboard-copy">
        <div className="brand brand-static">
          <span className="brand-mark">
            <Icon.bolt />
          </span>
          <span className="brand-name">SkillSprint</span>
        </div>
        <h1>
          Practise PM interviews with an AI coach that <span className="hl">pushes back</span>.
        </h1>
        <ol className="steps">
          <li>
            <span className="step-n">1</span>
            <div>
              <strong>Write</strong>
              <span>Answer a real product scenario</span>
            </div>
          </li>
          <li>
            <span className="step-n">2</span>
            <div>
              <strong>Get coached</strong>
              <span>Scores, evidence and a sharper rewrite</span>
            </div>
          </li>
          <li>
            <span className="step-n">3</span>
            <div>
              <strong>Face the interviewer</strong>
              <span>Two follow-ups, then your verdict and XP</span>
            </div>
          </li>
        </ol>
      </div>

      <div className="card onboard-card">
        {mode === 'new' ? (
          <form onSubmit={start} noValidate>
            <h2>Pick a nickname</h2>
            <label className="field">
              <span>Nickname</span>
              <input
                value={nick}
                onChange={(e) => setNick(e.target.value.slice(0, LIMITS.NICK_MAX))}
                placeholder="e.g. Riya"
                autoComplete="nickname"
                maxLength={LIMITS.NICK_MAX}
                autoFocus
              />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="btn btn-primary btn-block" disabled={busy}>
              {busy ? <Spinner /> : null} Start practising <Icon.arrow />
            </button>
            <button type="button" className="link-btn" onClick={() => (setMode('recover'), setError(''))}>
              I have a recovery code
            </button>
          </form>
        ) : (
          <form onSubmit={recover} noValidate>
            <h2>Restore your progress</h2>
            <label className="field">
              <span>Recovery code</span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 20))}
                placeholder="SPRINT-XXXXXX"
                autoCapitalize="characters"
                spellCheck={false}
                autoFocus
                className="mono"
              />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="btn btn-primary btn-block" disabled={busy || code.replace(/[^A-Z0-9]/g, '').length < 6}>
              {busy ? <Spinner /> : null} Restore progress
            </button>
            <button type="button" className="link-btn" onClick={() => (setMode('new'), setError(''))}>
              I'm new here
            </button>
          </form>
        )}
        <p className="fineprint">Answers are graded by AI. Please avoid personal or confidential details.</p>
      </div>
    </div>
  );
}
