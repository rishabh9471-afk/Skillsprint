import React from 'react';
import { leaderboard } from '../data/challenges';

export default function Leaderboard() {
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const podiumOrder = [top3[1], top3[0], top3[2]]; // 2nd, 1st, 3rd visual order
  const heights = [68, 96, 48];

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px 32px' }}>
      <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>Leaderboard</h2>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>This week's top PM learners</p>

      {/* Podium */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10, marginBottom: 28 }}>
        {podiumOrder.map((user, i) => (
          <div key={user.rank} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#fff' }}>
              {user.initials}
            </div>
            <p style={{ fontSize: 11, color: 'var(--mid)', fontWeight: 500 }}>{user.name}</p>
            <p style={{ fontSize: 11, color: 'var(--muted)' }}>{user.xp} XP</p>
            <div style={{
              width: 74, height: heights[i], borderRadius: '8px 8px 0 0',
              background: i === 1 ? 'var(--orange)' : i === 0 ? '#F5C370' : '#97C459',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>
                {i === 1 ? '1' : i === 0 ? '2' : '3'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {rest.map(user => (
          <div key={user.rank} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: user.isYou ? 'var(--orange-light)' : 'var(--card)',
            border: `0.5px solid ${user.isYou ? 'var(--orange)' : 'var(--border)'}`,
            borderRadius: 11, padding: '10px 14px'
          }}>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--muted)', width: 22 }}>{user.rank}</span>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {user.initials}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--dark)' }}>{user.name}{user.isYou ? ' (You)' : ''}</p>
              <p style={{ fontSize: 11, color: 'var(--muted)' }}>{user.challenges} challenges</p>
            </div>
            <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--orange)' }}>{user.xp} XP</span>
          </div>
        ))}
      </div>
    </div>
  );
}
