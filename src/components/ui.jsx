import { SKILLS, LIMITS, VERDICTS, countWords } from '../shared/limits.js';

const base = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
export const Icon = {
  bolt: (p) => (
    <svg {...base} {...p}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
    </svg>
  ),
  back: (p) => (
    <svg {...base} {...p}>
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  ),
  arrow: (p) => (
    <svg {...base} {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  trophy: (p) => (
    <svg {...base} {...p}>
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
    </svg>
  ),
  user: (p) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  ),
  check: (p) => (
    <svg {...base} {...p}>
      <path d="m5 12 5 5 9-10" />
    </svg>
  ),
  clock: (p) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  lock: (p) => (
    <svg {...base} {...p}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  ),
  copy: (p) => (
    <svg {...base} {...p}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a1 1 0 0 1 1-1h10" />
    </svg>
  ),
  up: (p) => (
    <svg {...base} {...p}>
      <path d="M7 11v9H4v-9zM7 11l4-8a2 2 0 0 1 3 2l-1 5h6a2 2 0 0 1 2 2l-2 7a2 2 0 0 1-2 1H7" />
    </svg>
  ),
  down: (p) => (
    <svg {...base} {...p}>
      <path d="M17 13V4h3v9zM17 13l-4 8a2 2 0 0 1-3-2l1-5H5a2 2 0 0 1-2-2l2-7a2 2 0 0 1 2-1h10" />
    </svg>
  ),
  edit: (p) => (
    <svg {...base} {...p}>
      <path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4" />
    </svg>
  ),
  mic: (p) => (
    <svg {...base} {...p}>
      <path d="M4 5h16v11H9l-5 4z" />
      <path d="M8 9h8M8 12h5" />
    </svg>
  ),
  alert: (p) => (
    <svg {...base} {...p}>
      <path d="M12 3 2 20h20zM12 10v4M12 17h.01" />
    </svg>
  ),
  info: (p) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  ),
  spark: (p) => (
    <svg {...base} {...p}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />
    </svg>
  ),
  x: (p) => (
    <svg {...base} {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
};

export function Banner({ tone = 'info', children, action }) {
  const I = tone === 'warn' || tone === 'bad' ? Icon.alert : Icon.info;
  return (
    <div className={`banner banner-${tone}`} role={tone === 'bad' ? 'alert' : 'status'}>
      <I />
      <div className="banner-body">{children}</div>
      {action}
    </div>
  );
}

export function SkillChip({ skill }) {
  const s = SKILLS[skill];
  return <span className={`chip chip-${s.color}`}>{s.label}</span>;
}

export function DifficultyDots({ level }) {
  const n = { Easy: 1, Medium: 2, Hard: 3 }[level] || 2;
  return (
    <span className="difficulty" aria-label={`Difficulty: ${level}`}>
      {[1, 2, 3].map((i) => (
        <i key={i} className={i <= n ? 'on' : ''} />
      ))}
      <span>{level}</span>
    </span>
  );
}

export function scoreTone(score) {
  if (score >= 8) return 'good';
  if (score >= 6) return 'warn';
  return 'bad';
}

export function ScoreRing({ score, size = 120, label = 'out of 10' }) {
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, score / 10));
  return (
    <div className={`ring ring-${scoreTone(score)}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-track" strokeWidth="10" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="ring-fill"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-center">
        <strong>{score.toFixed(1)}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

export function VerdictBadge({ verdict, large }) {
  const v = VERDICTS[verdict];
  return <span className={`verdict verdict-${v.tone} ${large ? 'verdict-lg' : ''}`}>{v.label}</span>;
}

/** Word count with guidance for the main answer. */
export function WordMeter({ text }) {
  const n = countWords(text);
  let tone = 'bad';
  let msg = `Write at least ${LIMITS.MIN_WORDS} words`;
  if (n >= LIMITS.MAX_WORDS) {
    tone = 'warn';
    msg = 'Word limit reached';
  } else if (n > LIMITS.GUIDE_MAX) {
    tone = 'warn';
    msg = 'Getting long — interviewers value concise answers';
  } else if (n >= LIMITS.GUIDE_MIN) {
    tone = 'good';
    msg = 'Good length';
  } else if (n >= LIMITS.MIN_WORDS) {
    tone = 'warn';
    msg = `Good start — aim for ${LIMITS.GUIDE_MIN}–${LIMITS.GUIDE_MAX} words`;
  }
  const pct = Math.min(100, (n / LIMITS.GUIDE_MAX) * 100);
  return (
    <div className={`meter meter-${tone}`} aria-live="polite">
      <div className="meter-track">
        <div className="meter-fill" style={{ width: `${pct}%` }} />
        <div className="meter-mark" style={{ left: `${(LIMITS.MIN_WORDS / LIMITS.GUIDE_MAX) * 100}%` }} />
        <div className="meter-mark" style={{ left: `${(LIMITS.GUIDE_MIN / LIMITS.GUIDE_MAX) * 100}%` }} />
      </div>
      <div className="meter-text">
        <span>{msg}</span>
        <span className="mono">
          {n} / {LIMITS.MAX_WORDS}
        </span>
      </div>
    </div>
  );
}

export function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}
