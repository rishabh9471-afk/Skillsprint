import React from 'react';

const tabs = [
  {
    id: 'home', label: 'Home',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    )
  },
  {
    id: 'leaderboard', label: 'Ranks',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 20V10M12 20V4M6 20v-6"/>
      </svg>
    )
  },
  {
    id: 'profile', label: 'Profile',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    )
  }
];

export default function BottomNav({ active, onSwitch }) {
  return (
    <nav style={{
      display: 'flex', borderTop: '0.5px solid var(--border)',
      background: 'var(--card)', position: 'sticky', bottom: 0, zIndex: 100
    }}>
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => onSwitch(tab.id)} style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 3, padding: '10px 4px', border: 'none', background: 'none',
          fontSize: 11, color: active === tab.id ? 'var(--orange)' : 'var(--muted)',
          transition: 'color 0.2s', fontFamily: 'DM Sans, sans-serif'
        }}>
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
