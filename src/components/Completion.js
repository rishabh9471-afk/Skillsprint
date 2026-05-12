import React from 'react';

export default function Completion({ challenge, score, total, onHome }) {
  const acc = Math.round((score / total) * 100);
  const perfect = acc === 100;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 52, marginBottom: 18 }}>{perfect ? '🎉' : score > 0 ? '👍' : '💪'}</div>
      <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, color: 'var(--dark)', marginBottom: 7 }}>
        {perfect ? 'Challenge complete!' : 'Good effort!'}
      </h2>
      <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 28 }}>
        {perfect ? `You nailed the ${challenge.category} module` : `Keep practicing — you'll get there`}
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        <StatBox val={`+${perfect ? challenge.xp : Math.round(challenge.xp * acc / 100)}`} label="XP earned" />
        <StatBox val={`${score}/${total}`} label="Correct" />
        <StatBox val={`${acc}%`} label="Accuracy" />
      </div>

      <button onClick={onHome} style={{
        background: 'var(--orange)', color: '#fff', border: 'none',
        borderRadius: 11, padding: '14px 32px', fontSize: 14, fontWeight: 500
      }}>
        Back to home
      </button>
    </div>
  );
}

function StatBox({ val, label }) {
  return (
    <div style={{ background: 'var(--card)', border: '0.5px solid var(--border)', borderRadius: 11, padding: '14px 20px', minWidth: 80 }}>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--orange)' }}>{val}</div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{label}</div>
    </div>
  );
}
