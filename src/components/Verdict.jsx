import { useState } from 'react';
import { VERDICTS } from '../shared/limits.js';
import { useCountUp } from '../lib/hooks.js';
import { Icon, ScoreRing, VerdictBadge } from './ui.jsx';

export default function Verdict({ scenario, active, visitor, onNext, onLeaderboard, onCodeSaved }) {
  const v = active.verdict;
  const xp = useCountUp(v.xp.total);
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(visitor.recoveryCode);
      setCopied(true);
      onCodeSaved();
    } catch {
      /* clipboard blocked — the code is visible to copy by hand */
    }
  }

  return (
    <div className="session verdict-page">
      <div className={`verdict-hero card tone-border-${VERDICTS[v.verdict].tone}`}>
        <span className="eyebrow">Final verdict · {scenario.title}</span>
        <VerdictBadge verdict={v.verdict} large />
        <div className="verdict-scores">
          <ScoreRing score={v.final} size={132} label="final score" />
          <div className="breakdown">
            <div>
              <span>Written answer (70%)</span>
              <strong>{v.answerScore.toFixed(1)}</strong>
            </div>
            <div>
              <span>Follow-ups (30%)</span>
              <strong>{v.followUpScore != null ? v.followUpScore.toFixed(1) : 'Skipped'}</strong>
            </div>
            {v.answerScore !== v.firstScore && (
              <div className="muted">
                <span>First draft</span>
                <strong>{v.firstScore.toFixed(1)}</strong>
              </div>
            )}
          </div>
        </div>
        <p className="verdict-summary">{v.summary}</p>
      </div>

      <div className="xp card">
        <div className="xp-total">
          <Icon.bolt />
          <strong>+{xp} XP</strong>
        </div>
        {v.practice ? (
          <p className="muted">Practice run — XP is only awarded the first time you complete a scenario.</p>
        ) : (
          <ul className="xp-lines">
            <li>
              <span>Final score × 10</span>
              <span>+{v.xp.base}</span>
            </li>
            <li className={v.xp.revisionBonus ? '' : 'off'}>
              <span>Improved by 1+ point on revision</span>
              <span>+{v.xp.revisionBonus}</span>
            </li>
            <li className={v.xp.followBonus ? '' : 'off'}>
              <span>Answered both follow-ups</span>
              <span>+{v.xp.followBonus}</span>
            </li>
          </ul>
        )}
      </div>

      <h2 className="section-title">How the follow-ups went</h2>
      <div className="fu-results">
        {v.followUps.map((f, k) => (
          <div key={k} className="card fu-result">
            <div className="dim-top">
              <strong>Question {k + 1}</strong>
              <span className="dim-score">{f.score != null ? `${f.score}/10` : 'Skipped'}</span>
            </div>
            <p className="fu-q">{f.question}</p>
            {f.reply && (
              <details>
                <summary>Your reply</summary>
                <p>{f.reply}</p>
              </details>
            )}
            <p>{f.comment}</p>
          </div>
        ))}
      </div>

      {(v.strengths.length > 0 || v.gaps.length > 0) && (
        <div className="sg">
          {v.strengths.length > 0 && (
            <div className="card sg-col good">
              <span className="label">What worked</span>
              <ul>
                {v.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {v.gaps.length > 0 && (
            <div className="card sg-col gap">
              <span className="label">What to work on</span>
              <ul>
                {v.gaps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {visitor.recoveryCode && !visitor.codeSaved && (
        <div className="code card">
          <div>
            <strong>Save your recovery code</strong>
            <p className="muted small">
              No account needed. Use this code to get your XP back on another device, or if your browser clears its data.
            </p>
          </div>
          <div className="code-row">
            <code className="code-value">{visitor.recoveryCode}</code>
            <button className="btn btn-ghost" onClick={copyCode}>
              <Icon.copy /> {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      <div className="verdict-actions">
        <button className="btn btn-ghost" onClick={onLeaderboard}>
          <Icon.trophy /> Leaderboard
        </button>
        <button className="btn btn-primary btn-lg" onClick={onNext}>
          Next scenario <Icon.arrow />
        </button>
      </div>
    </div>
  );
}
