// Shared UI primitives for AimeClaw chat panel. No shadcn / recharts / framer-motion.

const { useMemo: useMemoCm, useId: useIdCm, useState: useStateCm } = React;

function formatPct(v, opts) {
  if (v == null || isNaN(v)) return '—';
  const o = opts || {};
  const sign = o.sign && v > 0 ? '+' : '';
  const digits = o.digits != null ? o.digits : 1;
  return sign + v.toFixed(digits) + '%';
}

function formatUSD(v, opts) {
  if (v == null || isNaN(v)) return '—';
  const o = opts || {};
  const sign = o.sign && v > 0 ? '+' : v < 0 ? '−' : '';
  const abs = Math.abs(v);
  return sign + '$' + abs.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function MiniEquityCurveA({ data, height, color, filled, className }) {
  const H = height || 48;
  const W = 200;
  const stroke = color || '#10b981';
  const gradId = useIdCm();
  const { path, areaPath, viewBox } = useMemoCm(() => {
    if (!data || data.length === 0) return { path: '', areaPath: '', viewBox: `0 0 ${W} ${H}` };
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const xs = data.map((_, i) => (i / (data.length - 1)) * W);
    const ys = data.map((v) => H - ((v - min) / range) * (H - 6) - 3);
    const p = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${ys[i].toFixed(2)}`).join(' ');
    return { path: p, areaPath: `${p} L ${W} ${H} L 0 ${H} Z`, viewBox: `0 0 ${W} ${H}` };
  }, [data, H]);
  const showFilled = filled !== false;
  return (
    <svg viewBox={viewBox} preserveAspectRatio="none" className={className} style={{ height: H, width: '100%' }}>
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      {showFilled && <path d={areaPath} fill={`url(#${gradId})`} />}
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ animation: 'aimeclaw-draw 0.7s ease-out forwards' }}
      />
    </svg>
  );
}

function MetricStatA({ label, value, tone, className, dark }) {
  const toneClass = tone === 'pos'
    ? (dark ? 'text-emerald-300' : 'text-emerald-600')
    : tone === 'neg'
    ? (dark ? 'text-rose-300' : 'text-rose-600')
    : (dark ? 'text-white' : 'text-slate-900');
  return (
    <div className={`flex flex-col gap-0.5 ${className || ''}`}>
      <div className={`text-[10px] uppercase tracking-wide ${dark ? 'text-white/40' : 'text-slate-400'}`}>{label}</div>
      <div className={`font-mono text-sm font-semibold tabular-nums ${toneClass}`}>{value}</div>
    </div>
  );
}

function CreditsBadgeA({ credits, dark }) {
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${dark ? 'bg-sky-500/12 text-sky-200' : 'border border-sky-200 bg-sky-50 text-sky-700'}`}>
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M12 2l2.39 5.86L20 8.94l-4 4.07.94 5.99L12 16.27 7.06 19l.94-5.99-4-4.07 5.61-1.08z"/></svg>
      <span className="tabular-nums">{credits}</span>
      <span className={dark ? 'text-sky-200/70' : 'text-sky-600/80'}>credits</span>
    </div>
  );
}

// Markdown-ish: **bold** segments only.
function RichTextA({ text, dark }) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className={`font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

// Algorithm flowchart — used inside the View Logic dialog.
function getFlowchartKind(dark) {
  return {
    trigger: dark
      ? { bg: 'bg-sky-500/12',     border: 'border-transparent',    label: 'Trigger', icon: 'play' }
      : { bg: 'bg-sky-50',         border: 'border-sky-200',        label: 'Trigger', icon: 'play' },
    filter:  dark
      ? { bg: 'bg-white/[0.04]',   border: 'border-transparent',    label: 'Filter',  icon: 'filter' }
      : { bg: 'bg-slate-50',       border: 'border-slate-200',      label: 'Filter',  icon: 'filter' },
    action:  dark
      ? { bg: 'bg-emerald-500/12', border: 'border-transparent',    label: 'Action',  icon: 'target' }
      : { bg: 'bg-emerald-50',     border: 'border-emerald-200',    label: 'Action',  icon: 'target' },
    exit:    dark
      ? { bg: 'bg-rose-500/12',    border: 'border-transparent',    label: 'Exit',    icon: 'stop' }
      : { bg: 'bg-rose-50',        border: 'border-rose-200',       label: 'Exit',    icon: 'stop' },
  };
}

function FlowIcon({ name, dark }) {
  const cls = dark ? 'h-4 w-4 text-white/80' : 'h-4 w-4 text-slate-600';
  switch (name) {
    case 'play':   return <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2"><polygon points="6 4 20 12 6 20 6 4" fill="currentColor"/></svg>;
    case 'filter': return <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 5h18l-7 9v6l-4-2v-4z"/></svg>;
    case 'target': return <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>;
    case 'stop':   return <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor"/></svg>;
    default:       return null;
  }
}

function FlowchartSVGA({ diagram, dark }) {
  if (!diagram) return null;
  const KINDS = getFlowchartKind(dark);
  return (
    <div className="space-y-2">
      {diagram.steps.map((step, i) => {
        const style = KINDS[step.kind] || KINDS.trigger;
        return (
          <div key={step.id}>
            <div className={`flex gap-3 rounded-lg border ${style.border} ${style.bg} p-3`}>
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md shadow-sm ${dark ? 'bg-white/[0.08]' : 'border border-white/60 bg-white'}`}>
                <FlowIcon name={style.icon} dark={dark} />
              </div>
              <div className="min-w-0 flex-1">
                <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide ${dark ? 'text-white/45' : 'text-slate-400'}`}>
                  <span>{style.label}</span>
                  <span className="opacity-60">·</span>
                  <span className="opacity-60">Step {i + 1}</span>
                </div>
                <div className={`mt-0.5 text-sm font-semibold leading-snug ${dark ? 'text-white' : 'text-slate-900'}`}>{step.label}</div>
                {step.detail && <div className={`mt-0.5 text-xs ${dark ? 'text-white/55' : 'text-slate-500'}`}>{step.detail}</div>}
              </div>
            </div>
            {i < diagram.steps.length - 1 && (
              <div className={`flex justify-center py-1 ${dark ? 'text-white/25' : 'text-slate-300'}`}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M6 13l6 6 6-6"/></svg>
              </div>
            )}
          </div>
        );
      })}
      {diagram.notes && (
        <div className={`mt-3 rounded-md border border-dashed p-3 text-xs leading-relaxed ${dark ? 'border-white/[0.06] bg-white/[0.02] text-white/55' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
          <span className={`font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>Note · </span>
          {diagram.notes}
        </div>
      )}
    </div>
  );
}

// Generic modal frame for AimeClaw chat dialogs (AlgorithmDialog etc.).
// Suffix avoids global-scope collision with the differently-shaped ModalShell
// in modals.jsx (which loads later and would otherwise win window.ModalShell).
// Portals to document.body so ancestor transforms (e.g. `.elev-tile:hover`
// or the `aimeclaw-fade-up both` keyframe on each chat block) don't trap our
// `fixed inset-0` overlay inside the hovered card.
function ModalShellA({ open, onClose, children, maxWidth, dark }) {
  if (!open) return null;
  return ReactDOM.createPortal(
    <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm ${dark ? 'bg-black/55' : 'bg-slate-900/40'}`} onClick={onClose}>
      <div
        className={`relative flex max-h-[90vh] w-full flex-col overflow-y-auto rounded-2xl shadow-2xl ${dark ? 'border border-white/[0.06] bg-[#0d1014] text-white' : 'bg-white'}`}
        style={{ maxWidth: maxWidth || 480 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className={`absolute right-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-md ${dark ? 'text-white/40 hover:bg-white/8 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}>
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}

const SYMBOL_PALETTE = {
  BTC: { bg: 'bg-slate-100',   text: 'text-slate-700',   dot: '#64748b',
         darkBg: 'bg-white/[0.06]',     darkText: 'text-white/85' },
  ETH: { bg: 'bg-indigo-100',  text: 'text-indigo-700',  dot: '#6366f1',
         darkBg: 'bg-indigo-500/15',    darkText: 'text-indigo-200' },
  SOL: { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700', dot: '#d946ef',
         darkBg: 'bg-fuchsia-500/15',   darkText: 'text-fuchsia-200' },
};

function SymbolPill({ symbol, dark }) {
  const fallback = { bg: 'bg-slate-100', text: 'text-slate-700', darkBg: 'bg-white/[0.06]', darkText: 'text-white/85' };
  const p = SYMBOL_PALETTE[symbol] || fallback;
  const bg = dark ? p.darkBg : p.bg;
  const text = dark ? p.darkText : p.text;
  return (
    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${bg} ${text}`}>
      {symbol}
    </span>
  );
}

Object.assign(window, {
  formatPct, formatUSD,
  MiniEquityCurveA, MetricStatA, CreditsBadgeA, RichTextA, FlowchartSVGA, getFlowchartKind,
  ModalShellA, SymbolPill, SYMBOL_PALETTE,
});
