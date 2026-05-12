import React from 'react';

const icons = {
  bolt: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
  star: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
};

export default function Nav({ streak, xp }) {
  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 24px 14px', borderBottom: '0.5px solid var(--border)',
      background: 'var(--card)', position: 'sticky', top: 0, zIndex: 100
    }}>
      <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--orange)', letterSpacing: '-0.5px' }}>
        SkillSprint
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Pill icon={icons.bolt} label={`${streak} day streak`} bg="var(--amber-bg)" color="var(--amber)" />
        <Pill icon={icons.star} label={`${xp} XP`} bg="var(--blue-bg)" color="var(--blue)" />
      </div>
    </nav>
  );
}

function Pill({ icon, label, bg, color }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      background: bg, borderRadius: 20, padding: '5px 11px',
      fontSize: 13, fontWeight: 500, color
    }}>
      {icon} {label}
    </div>
  );
}
