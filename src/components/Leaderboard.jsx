import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { track } from '../lib/track.js';
import { Banner, Icon, Spinner } from './ui.jsx';

export default function Leaderboard({ visitor, onBack }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  async function loadBoard() {
    setError('');
    try {
      setData(await api.leaderboard(visitor.id));
    } catch (e) {
      setError(e.code === 'offline' ? e.message : 'The leaderboard is temporarily unavailable. Please try again shortly.');
    }
  }

  useEffect(() => {
    loadBoard();
    track('leaderboard_viewed');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inTop = data?.entries.some((e) => e.isMe);

  return (
    <div className="session leaderboard">
      <button className="back" onClick={onBack}>
        <Icon.back /> Back
      </button>
      <div className="lb-head">
        <span className="eyebrow">Weekly leaderboard</span>
        <h1>Top sprinters this week</h1>
        <p className="muted">XP from scenarios completed since Monday. Resets every Monday at 12:00 AM IST.</p>
      </div>

      {error && (
        <Banner
          tone="warn"
          action={
            <button className="btn btn-ghost btn-sm" onClick={loadBoard}>
              Retry
            </button>
          }
        >
          {error}
        </Banner>
      )}
      {!data && !error && (
        <p className="loading-line">
          <Spinner /> Loading…
        </p>
      )}

      {data && data.entries.length === 0 && (
        <div className="card empty">
          <Icon.trophy />
          <p>
            <strong>No one has finished a scenario this week yet.</strong>
            <br />
            Complete one to take the top spot.
          </p>
        </div>
      )}

      {data && data.entries.length > 0 && (
        <ol className="lb card">
          {data.entries.map((e) => (
            <Row key={`${e.rank}-${e.tag}`} e={e} />
          ))}
          {!inTop && data.me && (
            <>
              <li className="lb-gap" aria-hidden="true">
                ⋯
              </li>
              <Row e={data.me} />
            </>
          )}
        </ol>
      )}
      {data && !data.me && data.entries.length > 0 && (
        <p className="muted center">Complete a scenario this week to join the leaderboard.</p>
      )}
    </div>
  );
}

function Row({ e }) {
  return (
    <li className={`lb-row ${e.isMe ? 'is-me' : ''} ${e.rank <= 3 ? `top-${e.rank}` : ''}`}>
      <span className="lb-rank">{e.rank}</span>
      <span className="lb-name">
        {e.nickname}
        <span className="lb-tag">#{e.tag}</span>
        {e.isMe && <span className="you">You</span>}
      </span>
      <span className="lb-xp">
        {e.xp} <small>XP</small>
      </span>
    </li>
  );
}
