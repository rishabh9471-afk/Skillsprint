import { Icon } from './ui.jsx';

export default function TopBar({ visitor, progress, status, view, onHome, onLeaderboard, onProfile }) {
  const left = status ? status.remaining : null;
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <button className="brand" onClick={onHome} aria-label="SkillSprint home">
          <span className="brand-mark">
            <Icon.bolt />
          </span>
          <span className="brand-name">SkillSprint</span>
        </button>
        <div className="topbar-right">
          {left != null && (
            <span className={`pill ${left === 0 ? 'pill-muted' : ''}`} title="New scenarios you can start today">
              <Icon.clock />
              <span>
                {left}/{status.dailyLimit}
                <span className="hide-sm"> left today</span>
              </span>
            </span>
          )}
          <span className="pill pill-xp" title="Total XP">
            <Icon.bolt />
            <span>{progress.totalXp} XP</span>
          </span>
          <button className={`icon-btn ${view === 'leaderboard' ? 'is-active' : ''}`} onClick={onLeaderboard} aria-label="Leaderboard">
            <Icon.trophy />
          </button>
          <button className="avatar" onClick={onProfile} aria-label={`Profile: ${visitor.nickname}`}>
            {visitor.nickname.slice(0, 1).toUpperCase()}
          </button>
        </div>
      </div>
    </header>
  );
}
