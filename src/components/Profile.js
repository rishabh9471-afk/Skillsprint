import React from 'react';

const badges = [
  { icon: '🔥', name: '7-Day Streak', bg: '#FFF0E8' },
  { icon: '📊', name: 'Metrics Pro', bg: '#E8F1FB' },
  { icon: '🎯', name: 'Sharp Framer', bg: '#EBF7F1' },
  { icon: '⚡', name: 'Speed Runner', bg: '#FFF5E0' }
];

export default function Profile({ xp, streak, completedIds }) {
  const level = xp < 300 ? 1 : xp < 600 ? 2 : xp < 1000 ? 3 : 4;
  const levelName = ['', 'Curious Learner', 'Aspiring PM', 'Rising PM', 'Product Thinker'][level];

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
        <div style={{ width: 58, height: 58, borderRadius: '50%', background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: '#fff' }}>
          AS
        </div>
        <div>
          <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--dark)' }}>Ayush Sharma</p>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Level {level} · {levelName}</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9, marginBottom: 24 }}>
        <StatCard val={completedIds.length} label="Challenges" />
        <StatCard val={streak} label="Day streak" />
        <StatCard val={xp} label="Total XP" />
      </div>

      {/* Badges */}
      <p style={sectionHead}>Badges earned</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
        {badges.map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--card)', border: '0.5px solid var(--border)', borderRadius: 9, padding: '8px 12px' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: b.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
              {b.icon}
            </div>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--dark)' }}>{b.name}</span>
          </div>
        ))}
      </div>

      {/* About */}
      <div style={{ marginTop: 28 }}>
        <p style={sectionHead}>About SkillSprint</p>
        <div style={{ background: 'var(--card)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '16px' }}>
          <p style={{ fontSize: 13, color: 'var(--mid)', lineHeight: 1.7 }}>
            SkillSprint is a gamified web app for PM skill-building — built to address the UX friction points identified in a competitive audit of Buildd and Duolingo. Daily challenges, streaks, and leaderboards make deliberate practice feel like a game.
          </p>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>Built by Ayush Sharma · Product Associate</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ val, label }) {
  return (
    <div style={{ background: 'var(--card)', border: '0.5px solid var(--border)', borderRadius: 11, padding: '13px', textAlign: 'center' }}>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--dark)' }}>{val}</div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{label}</div>
    </div>
  );
}

const sectionHead = {
  fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700,
  color: 'var(--muted)', letterSpacing: '0.9px', textTransform: 'uppercase',
  marginBottom: 12
};
