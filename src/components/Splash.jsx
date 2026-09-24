import { useEffect } from 'react';

/** Brand moment shown once, right after onboarding: the bolt draws itself,
 *  the mark pops, the wordmark rises, then the overlay lifts away. */
export default function Splash({ nickname, onDone }) {
  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const t = setTimeout(onDone, reduced ? 350 : 1900);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="splash" role="status" aria-label="Welcome to SkillSprint">
      <div className="splash-inner">
        <div className="splash-mark">
          <span className="splash-ring" />
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path className="splash-bolt" d="M13 2 4 14h7l-1 8 9-12h-7z" pathLength="1" />
          </svg>
        </div>
        <div className="splash-word" aria-hidden="true">
          {'SkillSprint'.split('').map((ch, i) => (
            <span key={i} style={{ '--i': i }}>
              {ch}
            </span>
          ))}
        </div>
        <p className="splash-hi">Let's go, {nickname}</p>
      </div>
    </div>
  );
}
