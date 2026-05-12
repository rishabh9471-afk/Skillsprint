import React, { useState } from 'react';
import Nav from './components/Nav';
import BottomNav from './components/BottomNav';
import Home from './components/Home';
import Challenge from './components/Challenge';
import Completion from './components/Completion';
import Leaderboard from './components/Leaderboard';
import Profile from './components/Profile';

const INITIAL_XP = 840;
const INITIAL_STREAK = 7;

export default function App() {
  const [tab, setTab] = useState('home');
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [completionData, setCompletionData] = useState(null);
  const [completedIds, setCompletedIds] = useState([]);
  const [xp, setXp] = useState(INITIAL_XP);
  const [streak] = useState(INITIAL_STREAK);

  function startChallenge(challenge) {
    setActiveChallenge(challenge);
    setCompletionData(null);
  }

  function handleComplete(challenge, score, total) {
    const earned = score === total ? challenge.xp : Math.round(challenge.xp * (score / total));
    setXp(prev => prev + earned);
    if (!completedIds.includes(challenge.id)) {
      setCompletedIds(prev => [...prev, challenge.id]);
    }
    setCompletionData({ challenge, score, total, earned });
    setActiveChallenge(null);
  }

  function goHome() {
    setActiveChallenge(null);
    setCompletionData(null);
    setTab('home');
  }

  const showNav = !activeChallenge && !completionData;

  return (
    <div style={{
      width: '100%', maxWidth: 480, background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      boxShadow: '0 0 0 0.5px rgba(0,0,0,0.08)'
    }}>
      <Nav streak={streak} xp={xp} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', minHeight: 0 }}>
        {activeChallenge ? (
          <Challenge
            challenge={activeChallenge}
            onComplete={handleComplete}
            onBack={() => setActiveChallenge(null)}
          />
        ) : completionData ? (
          <Completion
            challenge={completionData.challenge}
            score={completionData.score}
            total={completionData.total}
            onHome={goHome}
          />
        ) : tab === 'home' ? (
          <Home onStartChallenge={startChallenge} completedIds={completedIds} xp={xp} />
        ) : tab === 'leaderboard' ? (
          <Leaderboard />
        ) : (
          <Profile xp={xp} streak={streak} completedIds={completedIds} />
        )}
      </div>

      {showNav && <BottomNav active={tab} onSwitch={setTab} />}
    </div>
  );
}
