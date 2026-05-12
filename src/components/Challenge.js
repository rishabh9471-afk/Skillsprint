import React, { useState } from 'react';

export default function Challenge({ challenge, onComplete, onBack }) {
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [done, setDone] = useState(false);

  const q = challenge.questions[qIndex];
  const isLast = qIndex === challenge.questions.length - 1;

  function pick(optId) {
    if (selected) return;
    setSelected(optId);
  }

  function next() {
    const newAnswers = [...answers, { qId: q.id, selected, correct: q.correct }];
    setAnswers(newAnswers);
    if (isLast) {
      const score = newAnswers.filter(a => a.selected === a.correct).length;
      onComplete(challenge, score, newAnswers.length);
    } else {
      setQIndex(qIndex + 1);
      setSelected(null);
    }
  }

  const correctCount = qIndex; // questions answered correctly so far

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 32px' }}>
      {/* Back */}
      <button onClick={onBack} style={{
        display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)',
        fontSize: 13, background: 'none', border: 'none', marginBottom: 22, padding: 0
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back
      </button>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {challenge.questions.map((_, i) => (
          <div key={i} style={{
            height: 4, flex: 1, borderRadius: 99,
            background: i < qIndex ? 'var(--orange)' : i === qIndex ? 'var(--orange)' : '#EBEBEB',
            opacity: i === qIndex ? 1 : i < qIndex ? 0.6 : 1
          }} />
        ))}
      </div>

      {/* Tag + Title */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'inline-block', background: 'var(--orange-light)', color: 'var(--orange)', borderRadius: 6, fontSize: 11, fontWeight: 500, padding: '3px 9px', marginBottom: 10 }}>
          {q.subtitle} &nbsp;·&nbsp; {challenge.category}
        </div>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--dark)', marginBottom: 7, lineHeight: 1.3 }}>
          {q.title}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--mid)', lineHeight: 1.65 }}>
          {challenge.description}
        </p>
      </div>

      {/* Scenario */}
      <div style={{
        background: 'var(--blue-bg)', borderLeft: '3px solid var(--blue)',
        borderRadius: '0 10px 10px 0', padding: '14px 16px', marginBottom: 20
      }}>
        <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--blue)', marginBottom: 5, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Scenario</p>
        <p style={{ fontSize: 13, color: 'var(--dark)', lineHeight: 1.65 }}>{q.scenario}</p>
      </div>

      {/* Question */}
      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--mid)', marginBottom: 10 }}>{q.question}</p>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {q.options.map(opt => {
          const isCorrect = opt.id === q.correct;
          const isSelected = opt.id === selected;
          let borderColor = 'var(--border)';
          let bg = 'var(--card)';
          let letterBg = '#F0EFEA';
          let letterColor = 'var(--mid)';
          if (selected) {
            if (isCorrect) { borderColor = 'var(--green)'; bg = 'var(--green-bg)'; }
            if (isSelected && !isCorrect) { borderColor = '#E24B4A'; bg = 'var(--red-bg)'; }
            if (isCorrect) { letterBg = 'var(--green)'; letterColor = '#fff'; }
            if (isSelected && !isCorrect) { letterBg = '#E24B4A'; letterColor = '#fff'; }
          }
          return (
            <button key={opt.id} onClick={() => pick(opt.id)} style={{
              display: 'flex', alignItems: 'flex-start', gap: 11, width: '100%',
              background: bg, border: `0.5px solid ${borderColor}`, borderRadius: 10,
              padding: '12px 14px', textAlign: 'left', cursor: selected ? 'default' : 'pointer',
              transition: 'all 0.2s', fontFamily: 'DM Sans, sans-serif'
            }}
              onMouseEnter={e => { if (!selected) { e.currentTarget.style.borderColor = 'var(--orange)'; e.currentTarget.style.background = 'var(--orange-light)'; }}}
              onMouseLeave={e => { if (!selected) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--card)'; }}}
            >
              <span style={{
                width: 22, height: 22, borderRadius: 6, background: letterBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600, color: letterColor, flexShrink: 0, marginTop: 1,
                transition: 'all 0.2s'
              }}>
                {opt.id.toUpperCase()}
              </span>
              <span style={{ fontSize: 13, color: 'var(--dark)', lineHeight: 1.55 }}>{opt.text}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {selected && (
        <div style={{
          background: selected === q.correct ? 'var(--green-bg)' : 'var(--red-bg)',
          border: `0.5px solid ${selected === q.correct ? 'rgba(45,122,79,0.3)' : 'rgba(226,75,74,0.3)'}`,
          borderRadius: 10, padding: '14px 16px', marginBottom: 14,
          animation: 'fadeIn 0.25s ease'
        }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: selected === q.correct ? 'var(--green)' : 'var(--red)', marginBottom: 5 }}>
            {selected === q.correct ? '✓ Correct!' : '✗ Not quite'}
          </p>
          <p style={{ fontSize: 13, color: 'var(--mid)', lineHeight: 1.6 }}>
            {q.feedback[selected]}
          </p>
        </div>
      )}

      {/* Next button */}
      {selected && (
        <button onClick={next} style={{
          width: '100%', background: 'var(--orange)', color: '#fff', border: 'none',
          borderRadius: 10, padding: 14, fontSize: 14, fontWeight: 500,
          animation: 'fadeIn 0.2s ease'
        }}>
          {isLast ? 'See results →' : 'Next question →'}
        </button>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
