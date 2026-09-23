/* Small SVG charts for the dashboard. No chart library needed.
 * Colors come from CSS variables (--series-1..3), light and dark. */
import { useRef, useState } from 'react';

function useTip() {
  const [tip, setTip] = useState(null);
  const box = useRef(null);
  const show = (e, content) => {
    const r = box.current.getBoundingClientRect();
    setTip({ x: e.clientX - r.left, y: e.clientY - r.top, content });
  };
  return { tip, box, show, hide: () => setTip(null) };
}

function Tip({ tip }) {
  if (!tip) return null;
  return (
    <div className="viz-tip" style={{ left: tip.x, top: tip.y }}>
      {tip.content}
    </div>
  );
}

const fmtDay = (d) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/** Horizontal funnel: bar = count, label shows % of the previous step. */
export function Funnel({ steps }) {
  const max = Math.max(1, ...steps.map((s) => s.count));
  const { tip, box, show, hide } = useTip();
  return (
    <div className="viz" ref={box}>
      {steps.map((s, i) => {
        const prev = i > 0 ? steps[i - 1].count : null;
        const conv = prev ? Math.round((s.count / prev) * 100) : null;
        return (
          <div
            className="funnel-row"
            key={s.step}
            onMouseMove={(e) => show(e, `${s.step}: ${s.count}${conv != null ? ` (${conv}% of previous step)` : ''}`)}
            onMouseLeave={hide}
          >
            <span className="funnel-label">{s.step}</span>
            <div className="funnel-track">
              <div className="funnel-bar" style={{ width: `${(s.count / max) * 100}%` }} />
            </div>
            <span className="funnel-val">
              <strong>{s.count}</strong>
              {conv != null && <small>{conv}%</small>}
            </span>
          </div>
        );
      })}
      <Tip tip={tip} />
    </div>
  );
}

/** Line chart over days; 1–2 series, crosshair tooltip. */
export function TrendChart({ data, series }) {
  const W = 640;
  const H = 220;
  const pad = { l: 34, r: 16, t: 12, b: 26 };
  const max = Math.max(1, ...data.flatMap((d) => series.map((s) => d[s.key])));
  const niceMax = Math.max(4, Math.ceil(max / 4) * 4);
  const x = (i) => pad.l + (data.length === 1 ? (W - pad.l - pad.r) / 2 : (i / (data.length - 1)) * (W - pad.l - pad.r));
  const y = (v) => pad.t + (1 - v / niceMax) * (H - pad.t - pad.b);
  const [hover, setHover] = useState(null);
  const svg = useRef(null);

  function onMove(e) {
    const r = svg.current.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    let best = 0;
    for (let i = 1; i < data.length; i++) if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
    setHover(best);
  }

  const ticks = [0, niceMax / 2, niceMax];
  const labelEvery = Math.ceil(data.length / 7);
  return (
    <div className="viz">
      <div className="legend">
        {series.map((s) => (
          <span key={s.key}>
            <i style={{ background: `var(${s.color})` }} />
            {s.label}
          </span>
        ))}
      </div>
      <div className="viz-plot">
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="trend" onMouseMove={onMove} onMouseLeave={() => setHover(null)} role="img" aria-label="Daily trend">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className="grid" />
              <text x={pad.l - 8} y={y(t) + 4} className="axis" textAnchor="end">
                {t}
              </text>
            </g>
          ))}
          {data.map((d, i) =>
            i % labelEvery === 0 || i === data.length - 1 ? (
              <text key={d.day} x={x(i)} y={H - 6} className="axis" textAnchor="middle">
                {fmtDay(d.day)}
              </text>
            ) : null
          )}
          {hover != null && <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} className="crosshair" />}
          {series.map((s) => (
            <g key={s.key}>
              <polyline
                fill="none"
                stroke={`var(${s.color})`}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={data.map((d, i) => `${x(i)},${y(d[s.key])}`).join(' ')}
              />
              {(data.length <= 31 || hover != null) &&
                data.map((d, i) =>
                  data.length <= 31 || i === hover ? (
                    <circle key={i} cx={x(i)} cy={y(d[s.key])} r={i === hover ? 5 : 3} fill={`var(${s.color})`} className="dot" />
                  ) : null
                )}
            </g>
          ))}
        </svg>
        {hover != null && (
          <div className="viz-tip" style={{ left: `${(x(hover) / W) * 100}%`, top: 8 }}>
            <strong>{fmtDay(data[hover].day)}</strong>
            {series.map((s) => (
              <span key={s.key}>
                <i style={{ background: `var(${s.color})` }} />
                {s.label}: {data[hover][s.key]}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** One 100% bar split into parts, with a legend. */
export function SplitBar({ parts }) {
  const total = parts.reduce((a, p) => a + p.value, 0);
  const { tip, box, show, hide } = useTip();
  if (!total) return <p className="muted small">No sessions reached feedback in this period yet.</p>;
  return (
    <div className="viz" ref={box}>
      <div className="split">
        {parts.map((p) =>
          p.value ? (
            <div
              key={p.label}
              className="split-seg"
              style={{ flexGrow: p.value, background: `var(${p.color})` }}
              onMouseMove={(e) => show(e, `${p.label}: ${p.value} (${Math.round((p.value / total) * 100)}%)`)}
              onMouseLeave={hide}
            />
          ) : null
        )}
      </div>
      <div className="legend legend-values">
        {parts.map((p) => (
          <span key={p.label}>
            <i style={{ background: `var(${p.color})` }} />
            {p.label} <strong>{Math.round((p.value / total) * 100)}%</strong> <small>({p.value})</small>
          </span>
        ))}
      </div>
      <Tip tip={tip} />
    </div>
  );
}

/** Vertical bars per day with an optional reference line (e.g. the daily cap). */
export function DayBars({ data, valueKey, refValue, refLabel }) {
  const W = 640;
  const H = 160;
  const pad = { l: 40, r: 12, t: 14, b: 24 };
  const max = Math.max(1, refValue || 0, ...data.map((d) => d[valueKey]));
  const bw = (W - pad.l - pad.r) / data.length;
  const y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const { tip, box, show, hide } = useTip();
  const labelEvery = Math.ceil(data.length / 7);
  return (
    <div className="viz" ref={box}>
      <div className="viz-plot">
        <svg viewBox={`0 0 ${W} ${H}`} className="trend" role="img" aria-label="AI requests per day">
          {refValue != null && (
            <g>
              <line x1={pad.l} x2={W - pad.r} y1={y(refValue)} y2={y(refValue)} className="refline" />
              <text x={W - pad.r} y={y(refValue) - 4} className="axis" textAnchor="end">
                {refLabel}
              </text>
            </g>
          )}
          <line x1={pad.l} x2={W - pad.r} y1={y(0)} y2={y(0)} className="grid" />
          {data.map((d, i) => {
            const h = y(0) - y(d[valueKey]);
            const bx = pad.l + i * bw + Math.min(2, bw * 0.15);
            const w = Math.max(1, bw - Math.min(4, bw * 0.3));
            return (
              <g key={d.day} onMouseMove={(e) => show(e, `${fmtDay(d.day)}: ${d[valueKey]} requests`)} onMouseLeave={hide}>
                <rect x={pad.l + i * bw} y={pad.t} width={bw} height={H - pad.t - pad.b} fill="transparent" />
                {h > 0 && <path d={roundedTop(bx, y(d[valueKey]), w, h, Math.min(4, w / 2))} className="bar-mark" />}
                {(i % labelEvery === 0 || i === data.length - 1) && (
                  <text x={pad.l + i * bw + bw / 2} y={H - 6} className="axis" textAnchor="middle">
                    {fmtDay(d.day)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <Tip tip={tip} />
    </div>
  );
}

function roundedTop(x, y, w, h, r) {
  r = Math.min(r, h);
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}
