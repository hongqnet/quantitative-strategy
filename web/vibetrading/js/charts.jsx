// Lightweight SVG charts for Quant Lab.

const { useMemo } = React;

function buildPath(curve, w, h, pad = 4) {
  if (!curve || curve.length === 0) return { d: '', area: '', min: 0, max: 0 };
  const min = Math.min(...curve);
  const max = Math.max(...curve);
  const span = max - min || 1;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  const stepX = innerW / Math.max(1, curve.length - 1);
  const pts = curve.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + innerH - ((v - min) / span) * innerH;
    return [x, y];
  });
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');
  const area = `${d} L${pts[pts.length - 1][0].toFixed(2)},${h - pad} L${pts[0][0].toFixed(2)},${h - pad} Z`;
  return { d, area, min, max, pts };
}

function Sparkline({ curve, color = '#0f172a', width = 120, height = 36, fill = true, strokeWidth = 1.5, stretch = false }) {
  const { d, area } = useMemo(() => buildPath(curve, width, height, 2), [curve, width, height]);
  const id = useMemo(() => 'sg' + Math.random().toString(36).slice(2, 8), []);
  const svgProps = stretch
    ? { width: '100%', height, preserveAspectRatio: 'none' }
    : { width, height };
  return (
    <svg {...svgProps} viewBox={`0 0 ${width} ${height}`} className="block">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${id})`} />}
      <path d={d} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function EquityChart({ curve, color = '#0ea5e9', width = 320, height = 120, showAxis = false, label, dark }) {
  const { d, area, min, max } = useMemo(() => buildPath(curve, width, height, 8), [curve, width, height]);
  const id = useMemo(() => 'eq' + Math.random().toString(36).slice(2, 8), []);
  const ticks = 4;
  const labelFill = dark ? 'fill-white/55' : 'fill-slate-500';
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="block">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {showAxis && [...Array(ticks)].map((_, i) => {
        const y = 8 + ((height - 16) * i) / (ticks - 1);
        return <line key={i} x1={0} y1={y} x2={width} y2={y} stroke="currentColor" strokeOpacity={dark ? 0.12 : 0.06} strokeWidth="1" />;
      })}
      <path d={area} fill={`url(#${id})`} />
      <path d={d} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {label && <text x={12} y={20} className={labelFill} fontSize="10" fontFamily="ui-sans-serif">{label}</text>}
    </svg>
  );
}

// QC-style leaderboard: multiple lines on one chart with %-axis
function LeaderboardChart({ lines, height = 260, hoverIndex, onHoverIndex, dark }) {
  const width = 1000;
  const pad = { top: 16, right: 16, bottom: 28, left: 44 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  // Normalize all curves to start at 0 (% return)
  const normalized = useMemo(() => lines.map(line => {
    const s = line.curve[0];
    const pct = line.curve.map(v => v - s); // already approx % since we generated walks around 0
    return { ...line, pct };
  }), [lines]);

  const allVals = normalized.flatMap(l => l.pct);
  const minV = Math.min(-10, Math.min(...allVals));
  const maxV = Math.max(10, Math.max(...allVals));
  const span = maxV - minV || 1;
  const n = normalized[0]?.pct.length || 1;
  const stepX = innerW / Math.max(1, n - 1);

  const buildLine = (pct) => pct.map((v, i) => {
    const x = pad.left + i * stepX;
    const y = pad.top + innerH - ((v - minV) / span) * innerH;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');

  // y-axis ticks
  const yTicks = [];
  const tickStep = 25;
  for (let v = Math.ceil(minV / tickStep) * tickStep; v <= maxV; v += tickStep) {
    const y = pad.top + innerH - ((v - minV) / span) * innerH;
    yTicks.push({ v, y });
  }

  // x-axis date labels (synthetic months)
  const months = ['Feb', 'Mar', 'Apr', 'May'];
  const xLabels = months.map((m, i) => {
    const x = pad.left + (innerW * (i + 0.5)) / months.length;
    return { m, x };
  });

  return (
    <div className="relative w-full" style={{ height }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const xRel = ((e.clientX - rect.left) / rect.width) * width - pad.left;
        const idx = Math.max(0, Math.min(n - 1, Math.round(xRel / stepX)));
        onHoverIndex && onHoverIndex(idx);
      }}
      onMouseLeave={() => onHoverIndex && onHoverIndex(null)}
    >
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="block w-full h-full">
        {/* grid */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={pad.left} x2={width - pad.right} y1={t.y} y2={t.y} stroke="currentColor" strokeOpacity={dark ? 0.10 : 0.06} />
            <text x={pad.left - 8} y={t.y + 3} textAnchor="end" fontSize="10" className={dark ? 'fill-white/45' : 'fill-slate-400'} fontFamily="ui-sans-serif">{t.v.toFixed(0)}%</text>
          </g>
        ))}
        {/* zero line */}
        {(() => {
          const y0 = pad.top + innerH - ((0 - minV) / span) * innerH;
          return <line x1={pad.left} x2={width - pad.right} y1={y0} y2={y0} stroke="currentColor" strokeOpacity={dark ? 0.20 : 0.14} strokeWidth="1" />;
        })()}
        {/* lines */}
        {normalized.map(l => (
          <path key={l.id} d={buildLine(l.pct)} stroke={l.color} strokeWidth={1.6} fill="none" strokeLinejoin="round" opacity={0.9} />
        ))}
        {/* x labels */}
        {xLabels.map((l, i) => (
          <text key={i} x={l.x} y={height - 8} textAnchor="middle" fontSize="10" className={dark ? 'fill-white/45' : 'fill-slate-400'} fontFamily="ui-sans-serif">{l.m}</text>
        ))}
        {/* hover crosshair */}
        {hoverIndex != null && (() => {
          const x = pad.left + hoverIndex * stepX;
          return <line x1={x} x2={x} y1={pad.top} y2={height - pad.bottom} stroke="currentColor" strokeOpacity={dark ? 0.35 : 0.25} strokeDasharray="3 3" />;
        })()}
      </svg>
    </div>
  );
}

Object.assign(window, { Sparkline, EquityChart, LeaderboardChart, buildPath });
