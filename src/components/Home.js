import React from 'react';
import { challenges, paths } from '../data/challenges';

export default function Home({ onStartChallenge, completedIds, xp }) {
  const todayChallenge = challenges[0];
  const level = xp < 300 ? { n: 1, name: 'Curious Learner' }
    : xp < 600 ? { n: 2, name: 'Aspiring PM' }
    : xp < 1000 ? { n: 3, name: 'Rising PM' }
    : { n: 4, name: 'Product Thinker' };
  const nextXp = xp < 300 ? 300 : xp < 600 ? 600 : xp < 1000 ? 1000 : 1500;
  const progress = Math.min(100, Math.round((xp / nextXp) * 100));

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '22px 24px 0' }}>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 2 }}>Good morning,</p>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 700, color: 'var(--dark)' }}>Ayush</h1>
      </div>

      {/* XP Progress */}
      <div style={{ padding: '14px 24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 7 }}>
          <span>Level {level.n} — {level.name}</span>
          <span>{xp} / {nextXp} XP</span>
        </div>
        <div style={{ height: 6, background: '#EBEBEB', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--orange)', borderRadius: 99, transition: 'width 0.6s ease' }} />
        </div>
      </div>

      {/* Today's Challenge */}
      <div style={{ padding: '22px 24px 0' }}>
        <p style={sectionHead}>Today's challenge</p>
        <div
          onClick={() => onStartChallenge(todayChallenge)}
          style={{
            background: 'var(--dark)', borderRadius: 18, padding: '22px 22px 20px',
            position: 'relative', overflow: 'hidden', cursor: 'pointer',
            transition: 'transform 0.15s', userSelect: 'none'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(0.99)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(232,87,26,0.18)' }} />
          <div style={{ position: 'absolute', bottom: -20, right: 40, width: 80, height: 80, borderRadius: '50%', background: 'rgba(232,87,26,0.10)' }} />
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(232,87,26,0.25)', color: '#FF9F74', borderRadius: 6, fontSize: 11, fontWeight: 500, padding: '3px 8px', marginBottom: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
            {todayChallenge.category}
          </div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 7, lineHeight: 1.3 }}>
            {todayChallenge.title}
          </h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 18 }}>
            {todayChallenge.duration} &nbsp;·&nbsp; +{todayChallenge.xp} XP &nbsp;·&nbsp; {todayChallenge.difficulty}
          </p>
          <button style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'var(--orange)', color: '#fff', border: 'none', borderRadius: 9,
            padding: '10px 18px', fontSize: 13, fontWeight: 500
          }}>
            {completedIds.includes(todayChallenge.id) ? 'Play again' : 'Start challenge'}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>

      {/* More Challenges */}
      <div style={{ padding: '22px 24px 0' }}>
        <p style={sectionHead}>More challenges</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {challenges.slice(1).map(c => (
            <div key={c.id} onClick={() => onStartChallenge(c)} style={{
              background: 'var(--card)', border: '0.5px solid var(--border)', borderRadius: 12,
              padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14,
              cursor: 'pointer', transition: 'border-color 0.2s'
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--orange)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ width: 42, height: 42, borderRadius: 11, background: paths.find(p => p.name === c.category)?.bg || '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                {paths.find(p => p.name === c.category)?.icon || '📋'}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--dark)', marginBottom: 3 }}>{c.title}</p>
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>{c.category} &nbsp;·&nbsp; {c.duration} &nbsp;·&nbsp; +{c.xp} XP</p>
              </div>
              {completedIds.includes(c.id) && (
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Learning Paths */}
      <div style={{ padding: '22px 24px 24px' }}>
        <p style={sectionHead}>Learning paths</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {paths.map(p => (
            <div key={p.id} style={{
              background: 'var(--card)', border: '0.5px solid var(--border)', borderRadius: 13,
              padding: '14px', cursor: 'pointer', transition: 'border-color 0.2s, transform 0.15s'
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = p.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ width: 38, height: 38, borderRadius: 10, background: p.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, fontSize: 18 }}>
                {p.icon}
              </div>
              <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>{p.name}</p>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>{p.done} / {p.lessons} lessons</p>
              <div style={{ height: 4, background: '#EBEBEB', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.round((p.done / p.lessons) * 100)}%`, background: p.color, borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const sectionHead = {
  fontFamily: 'Syne, sans-serif', fontSize: 11, fontWeight: 700,
  color: 'var(--muted)', letterSpacing: '0.9px', textTransform: 'uppercase',
  marginBottom: 12
};
