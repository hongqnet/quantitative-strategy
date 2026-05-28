// Modal layer: Deploy / Optimize / Write strategy.

const { useState: useStateMo, useEffect: useEffectMo, useRef: useRefMo, useMemo: useMemoMo } = React;

function ModalShell({ open, onClose, width = 720, dark, children, title, subtitle, icon, accent }) {
  if (!open) return null;
  // Portal to body so `.elev-tile:hover` transforms on a trigger card don't
  // turn that card into a containing block and trap our fixed overlay inside.
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(8, 11, 18, 0.55)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className={`relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-2xl elev-pop ${dark ? 'bg-[#0d1015] text-white' : 'bg-white text-slate-900'}`}
        style={{ maxWidth: width, border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(226,232,240,0.7)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={`flex shrink-0 items-start gap-3 border-b px-5 py-4 ${dark ? 'border-white/[0.05]' : 'border-slate-100'}`}>
          {icon && (
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-base text-white shadow-sm"
              style={{ background: accent || '#0284c7' }}>
              <span>{icon}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className={`text-[15.5px] font-semibold leading-snug ${dark ? 'text-white' : 'text-slate-900'}`}>{title}</div>
            {subtitle && <div className={`mt-0.5 text-[12.5px] ${dark ? 'text-white/55' : 'text-slate-500'}`}>{subtitle}</div>}
          </div>
          <button onClick={onClose} className={`grid h-8 w-8 place-items-center rounded-md ${dark ? 'text-white/45 hover:bg-white/10' : 'text-slate-400 hover:bg-slate-100'}`}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Deploy modal
// ─────────────────────────────────────────────────────────────────────────
function DeployModal({ open, onClose, strategy, dark, onConfirm }) {
  const [target, setTarget] = useStateMo('paper');
  const [capital, setCapital] = useStateMo(10000);
  const [risk, setRisk] = useStateMo(1.5);
  const [dailyLossCap, setDailyLossCap] = useStateMo(3);
  const [maxDDStop, setMaxDDStop] = useStateMo(8);
  if (!open || !strategy) return null;
  const t = window.DEPLOY_TARGETS.find(x => x.id === target);

  return (
    <ModalShell open={open} onClose={onClose} dark={dark} width={760}
      title={`Deploy "${strategy.name}"`}
      subtitle="Choose an account, set the capital and your guardrails. You can pause or move it later."
      icon="🚀"
      accent="linear-gradient(135deg,#10b981,#0ea5e9)"
    >
      <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-[1fr_280px]">
        {/* Left: form */}
        <div className="space-y-5">
          <section>
            <SectionLabel dark={dark}>Account</SectionLabel>
            <div className="mt-2 space-y-2">
              {window.DEPLOY_TARGETS.map(tt => (
                <AccountOption key={tt.id} target={tt} selected={target === tt.id} onSelect={() => setTarget(tt.id)} dark={dark} />
              ))}
            </div>
            <button className={`mt-2 text-[12px] font-medium ${dark ? 'text-sky-300 hover:text-sky-200' : 'text-sky-700 hover:text-sky-800'}`}>
              + Connect another broker
            </button>
          </section>

          <section>
            <SectionLabel dark={dark}>Capital</SectionLabel>
            <div className="mt-2 flex items-center gap-2">
              <div className={`flex flex-1 items-center rounded-lg border px-3 py-2 ${dark ? 'border-white/[0.08] bg-white/5' : 'border-slate-200 bg-white'}`}>
                <span className={`mr-1 text-[14px] ${dark ? 'text-white/50' : 'text-slate-400'}`}>$</span>
                <input type="number" value={capital} onChange={e => setCapital(Number(e.target.value))}
                  className={`w-full bg-transparent text-[15px] font-semibold tabular-nums outline-none ${dark ? 'text-white' : 'text-slate-900'}`} />
              </div>
              <div className="flex gap-1">
                {[5000, 10000, 25000, 50000].map(v => (
                  <button key={v} onClick={() => setCapital(v)} className={`rounded-md border px-2 py-2 text-[11.5px] tabular-nums ${
                    capital === v
                      ? (dark ? 'border-white/30 bg-white/12 text-white' : 'border-slate-900 bg-slate-900 text-white')
                      : (dark ? 'border-white/[0.08] text-white/70' : 'border-slate-200 text-slate-600')
                  }`}>${v >= 1000 ? (v/1000) + 'k' : v}</button>
                ))}
              </div>
            </div>
            <div className={`mt-1.5 text-[11.5px] ${dark ? 'text-white/45' : 'text-slate-400'}`}>
              Available in {t.label}: <span className="tabular-nums">${t.cash.toLocaleString()}</span>
            </div>
          </section>

          <section>
            <SectionLabel dark={dark}>Guardrails <span className="ml-1 opacity-50">(aime will auto-pause if any are tripped)</span></SectionLabel>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <GuardrailSlider label="Risk per trade" value={risk} display={`${risk.toFixed(1)}%`} min="0.5" max="5" step="0.1" onChange={setRisk} dark={dark} />
              <GuardrailSlider label="Daily loss cap" value={dailyLossCap} display={`${dailyLossCap}%`} min="1" max="10" step="0.5" onChange={setDailyLossCap} dark={dark} />
              <GuardrailSlider label="Max DD stop" value={maxDDStop} display={`${maxDDStop}%`} min="3" max="15" step="0.5" onChange={setMaxDDStop} dark={dark} />
            </div>
          </section>
        </div>

        {/* Right: summary */}
        <aside className={`flex flex-col gap-3 rounded-xl p-4 ${dark ? 'bg-white/[0.04]' : 'bg-slate-50'}`}>
          <div>
            <div className={`text-[10.5px] font-semibold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-slate-400'}`}>You're deploying</div>
            <div className={`mt-1 flex items-center gap-2 ${dark ? 'text-white' : 'text-slate-900'}`}>
              <div className="grid h-8 w-8 place-items-center rounded-md text-[11px] font-bold text-white" style={{ background: strategy.author?.avatarColor || '#64748b' }}>
                {strategy.symbol?.slice(0, 3)}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold">{strategy.name}</div>
                <div className={`text-[11px] ${dark ? 'text-white/55' : 'text-slate-500'}`}>by {strategy.author?.name}</div>
              </div>
            </div>
          </div>
          <div className={`h-px ${dark ? 'bg-white/8' : 'bg-slate-200'}`} />
          <div className="space-y-2 text-[12.5px]">
            <SummaryRow k="Account" v={`${t.label} ${t.tail}`} dark={dark} />
            <SummaryRow k="Capital" v={`$${capital.toLocaleString()}`} dark={dark} />
            <SummaryRow k="Mode" v={t.kind === 'live' ? 'Real money' : 'Simulated'} dark={dark} tone={t.kind === 'live' ? 'warn' : 'ok'} />
            <SummaryRow k="Risk per trade" v={`${risk.toFixed(1)}%`} dark={dark} />
            <SummaryRow k="Daily loss cap" v={`${dailyLossCap}%`} dark={dark} />
            <SummaryRow k="Max drawdown stop" v={`${maxDDStop}%`} dark={dark} />
          </div>
          {t.kind === 'live' && (
            <div className={`rounded-md border p-2.5 text-[11.5px] leading-relaxed ${dark ? 'border-rose-300/30 bg-rose-300/10 text-rose-200' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
              <b>⚠ Real money.</b> Orders will route through {t.label}. Past backtest performance is not a guarantee.
            </div>
          )}
          <button onClick={() => onConfirm && onConfirm({ target: t, capital, risk, dailyLossCap, maxDDStop })}
            className="mt-2 w-full rounded-md py-2 text-[13px] font-semibold text-white shadow-sm"
            style={{ background: t.kind === 'live' ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#10b981,#059669)' }}>
            {t.kind === 'live' ? 'Confirm' : 'Start'}
          </button>
          <button onClick={onClose} className={`text-[12px] ${dark ? 'text-white/55 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>Cancel</button>
        </aside>
      </div>
    </ModalShell>
  );
}

function AccountOption({ target, selected, onSelect, dark }) {
  const isHL = target.provider === 'hyperliquid';
  const iconBg = isHL
    ? 'bg-violet-500/18 text-violet-300'
    : target.kind === 'live'
      ? 'bg-rose-500/15 text-rose-500'
      : 'bg-sky-500/15 text-sky-500';
  return (
    <button onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition ${
        selected
          ? (dark ? 'border-sky-400/50 bg-sky-400/8' : 'border-sky-500 bg-sky-50/60')
          : (dark ? 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]' : 'border-slate-200 bg-white hover:border-slate-300')
      }`}>
      <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
        selected ? 'border-sky-500 bg-sky-500' : (dark ? 'border-white/30' : 'border-slate-300')
      }`}>
        {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
      </span>
      <span className={`grid h-7 w-7 place-items-center rounded-md text-[12px] font-bold ${iconBg}`}>
        {isHL ? (
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M13 2L3 14h7l-1 8 10-12h-7z"/></svg>
        ) : target.kind === 'live' ? '$' : 'P'}
      </span>
      <div className="flex-1 min-w-0">
        <div className={`flex items-center gap-1.5 text-[13px] font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>
          {target.label}
          <span className={`tabular-nums text-[11px] ${dark ? 'text-white/50' : 'text-slate-400'}`}>{target.tail}</span>
          {target.badge && <span className={`rounded px-1.5 py-px text-[9.5px] font-semibold uppercase ${dark ? 'bg-emerald-400/15 text-emerald-300' : 'bg-emerald-50 text-emerald-600'}`}>{target.badge}</span>}
        </div>
        <div className={`text-[11.5px] ${dark ? 'text-white/55' : 'text-slate-500'}`}>{target.sub}</div>
      </div>
      <div className={`shrink-0 text-right text-[11.5px] tabular-nums ${dark ? 'text-white/55' : 'text-slate-500'}`}>
        <div className={dark ? 'text-white/40' : 'text-slate-400'}>Available</div>
        <div className={`font-medium ${dark ? 'text-white/80' : 'text-slate-700'}`}>${target.cash.toLocaleString()}</div>
      </div>
    </button>
  );
}

function GuardrailSlider({ label, value, display, min, max, step, onChange, dark }) {
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <div className={`truncate text-[11px] ${dark ? 'text-white/55' : 'text-slate-500'}`}>{label}</div>
        <span className={`shrink-0 text-[12.5px] font-semibold tabular-nums ${dark ? 'text-white' : 'text-slate-900'}`}>{display}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="block w-full"
      />
    </div>
  );
}

function SummaryRow({ k, v, dark, tone }) {
  const toneCls = tone === 'warn' ? 'text-rose-500' : tone === 'ok' ? 'text-emerald-500' : (dark ? 'text-white' : 'text-slate-900');
  return (
    <div className="flex items-center justify-between">
      <span className={dark ? 'text-white/55' : 'text-slate-500'}>{k}</span>
      <span className={`font-medium tabular-nums ${toneCls}`}>{v}</span>
    </div>
  );
}

function SectionLabel({ children, dark }) {
  return <div className={`text-[10.5px] font-semibold uppercase tracking-wider ${dark ? 'text-white/55' : 'text-slate-500'}`}>{children}</div>;
}

// ─────────────────────────────────────────────────────────────────────────
// Optimize modal — AimeClaw diff & before/after
// ─────────────────────────────────────────────────────────────────────────
function OptimizeModal({ open, onClose, dark }) {
  const target = window.MARKET_STRATEGIES.find(s => s.id === 'sol-breakout');
  const [phase, setPhase] = useStateMo('analyzing'); // analyzing | result
  useEffectMo(() => {
    if (!open) { setPhase('analyzing'); return; }
    const id = setTimeout(() => setPhase('result'), 1600);
    return () => clearTimeout(id);
  }, [open]);

  if (!open) return null;
  const before = { sharpe: 0.84, ret: -2.41, dd: -3.6, win: 40, trades: 4 };
  const after  = { sharpe: 1.94, ret: 4.12, dd: -1.8, win: 67, trades: 3 };

  return (
    <ModalShell open={open} onClose={onClose} dark={dark} width={840}
      title="Optimize SOL Breakout Pro"
      subtitle="aime replayed the last 90 days with candidate filters. Here's what improved."
      icon="🤖"
      accent="linear-gradient(135deg,#7c3aed,#a855f7)"
    >
      {phase === 'analyzing' ? (
        <AnalyzingState dark={dark} />
      ) : (
        <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <section>
              <SectionLabel dark={dark}>Proposed changes</SectionLabel>
              <div className="mt-2 space-y-2">
                <DiffRow type="change" title="Volume z-score threshold"
                  before="z &gt; 1.5" after="z &gt; 1.8"
                  why="Tightening the filter excludes 2 of 3 losing trades in the last 30 days without missing any winners."
                  dark={dark} />
                <DiffRow type="add" title="Add regime gate"
                  after="BTC 30d realized vol &lt; 4.5%"
                  why="Avoid breakout entries during high-vol regimes where ranges fail to hold."
                  dark={dark} />
                <DiffRow type="change" title="Trailing stop"
                  before="−5% fixed" after="−1.5× ATR, dynamic"
                  why="Tracks volatility; tightens automatically in calm markets, gives room in fast ones."
                  dark={dark} />
              </div>
            </section>

            <section>
              <SectionLabel dark={dark}>Replayed equity curve · 90 days</SectionLabel>
              <div className={`mt-2 rounded-lg border p-3 ${dark ? 'border-white/[0.05] bg-white/[0.03]' : 'border-slate-200 bg-white'}`}>
                <BeforeAfterChart curveBefore={target.curve.slice(-60)} dark={dark} />
                <div className="mt-2 flex items-center gap-4 text-[11px]">
                  <Legend color="#94a3b8" label="Original" />
                  <Legend color="#0ea5e9" label="Optimized" />
                </div>
              </div>
            </section>
          </div>

          <aside className={`flex flex-col gap-3 rounded-xl p-4 ${dark ? 'bg-white/[0.04]' : 'bg-slate-50'}`}>
            <div className={`text-[10.5px] font-semibold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-slate-400'}`}>Before → After</div>
            <CompareRow label="Sharpe (90d)" before={before.sharpe} after={after.sharpe} fmt={v => v.toFixed(2)} dark={dark} />
            <CompareRow label="Return (90d)" before={before.ret} after={after.ret} fmt={v => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`} dark={dark} />
            <CompareRow label="Max drawdown" before={before.dd} after={after.dd} fmt={v => `${v.toFixed(1)}%`} dark={dark} betterIsLower />
            <CompareRow label="Win rate" before={before.win} after={after.win} fmt={v => `${v}%`} dark={dark} />
            <CompareRow label="Trades" before={before.trades} after={after.trades} fmt={v => v.toString()} dark={dark} neutral />

            <div className={`h-px ${dark ? 'bg-white/8' : 'bg-slate-200'}`} />
            <button className="rounded-md bg-sky-600 py-2 text-[13px] font-semibold text-white hover:bg-sky-700">
              Apply patch & resume
            </button>
            <button className={`rounded-md border py-1.5 text-[12px] font-medium ${dark ? 'border-white/[0.08] text-white/80' : 'border-slate-200 text-slate-700'}`}>
              Save as a new variant
            </button>
            <button onClick={onClose} className={`text-[12px] ${dark ? 'text-white/55' : 'text-slate-500'}`}>Discard</button>
          </aside>
        </div>
      )}
    </ModalShell>
  );
}

function AnalyzingState({ dark }) {
  const steps = [
    'Loading 90 days of OOS trades…',
    'Sweeping candidate parameters…',
    'Replaying volatility regimes…',
    'Ranking by Sharpe & drawdown…',
    'Drafting human-readable patch…',
  ];
  const [idx, setIdx] = useStateMo(0);
  useEffectMo(() => {
    const id = setInterval(() => setIdx(i => Math.min(i + 1, steps.length - 1)), 280);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="px-8 py-12">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="grid h-14 w-14 place-items-center rounded-full text-2xl shadow-md"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)', animation: 'softPulse 1.4s ease-in-out infinite' }}>
          <span>🤖</span>
        </div>
        <div className={`mt-4 text-[15px] font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>aime is optimizing</div>
        <ol className={`mt-3 space-y-1.5 text-left text-[12.5px] ${dark ? 'text-white/70' : 'text-slate-600'}`}>
          {steps.map((s, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className={`grid h-4 w-4 place-items-center rounded-full text-[10px] font-bold ${
                i < idx ? 'bg-emerald-500 text-white' : i === idx ? 'bg-sky-500 text-white' : (dark ? 'bg-white/10 text-white/50' : 'bg-slate-200 text-slate-400')
              }`}>{i < idx ? '✓' : i === idx ? '·' : ''}</span>
              <span className={i > idx ? 'opacity-50' : ''}>{s}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function DiffRow({ type, title, before, after, why, dark }) {
  const accent = type === 'add' ? 'emerald' : type === 'remove' ? 'rose' : 'sky';
  const accentBg = { emerald: 'bg-emerald-500/15 text-emerald-500', rose: 'bg-rose-500/15 text-rose-500', sky: 'bg-sky-500/15 text-sky-600' }[accent];
  const sign = type === 'add' ? '+' : type === 'remove' ? '−' : '~';
  return (
    <div className={`rounded-lg border p-3 ${dark ? 'border-white/[0.05] bg-white/[0.03]' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-start gap-2.5">
        <span className={`grid h-5 w-5 shrink-0 place-items-center rounded text-[11px] font-bold ${accentBg}`}>{sign}</span>
        <div className="flex-1">
          <div className={`text-[13px] font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{title}</div>
          <div className={`mt-1 flex items-center gap-2 font-mono text-[11.5px] ${dark ? 'text-white/70' : 'text-slate-600'}`}>
            {before && <span className={`rounded px-1.5 py-0.5 line-through opacity-70 ${dark ? 'bg-white/8' : 'bg-slate-100'}`} dangerouslySetInnerHTML={{__html: before}} />}
            {before && <span className={dark ? 'text-white/40' : 'text-slate-400'}>→</span>}
            <span className={`rounded px-1.5 py-0.5 font-semibold ${dark ? 'bg-emerald-400/15 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`} dangerouslySetInnerHTML={{__html: after}} />
          </div>
          <div className={`mt-1.5 text-[12px] leading-relaxed ${dark ? 'text-white/60' : 'text-slate-500'}`}>{why}</div>
        </div>
      </div>
    </div>
  );
}

function CompareRow({ label, before, after, fmt, dark, betterIsLower, neutral }) {
  const delta = after - before;
  let positive = neutral ? null : (betterIsLower ? delta < 0 : delta > 0);
  const toneCls = positive == null ? (dark ? 'text-white' : 'text-slate-900') : (positive ? 'text-emerald-500' : 'text-rose-500');
  return (
    <div className="flex items-center justify-between">
      <span className={`text-[12px] ${dark ? 'text-white/55' : 'text-slate-500'}`}>{label}</span>
      <span className="flex items-center gap-1.5 tabular-nums">
        <span className={`text-[12px] line-through ${dark ? 'text-white/35' : 'text-slate-400'}`}>{fmt(before)}</span>
        <span className={dark ? 'text-white/35' : 'text-slate-300'}>→</span>
        <span className={`text-[13px] font-semibold ${toneCls}`}>{fmt(after)}</span>
      </span>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-1 text-slate-500">
      <span className="h-2 w-4 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}

function BeforeAfterChart({ curveBefore, dark }) {
  // Synthesize an "optimized" curve by mostly outperforming
  const after = curveBefore.map((v, i) => v + i * 0.08 + (i > 30 ? 4 : 0));
  return (
    <svg viewBox="0 0 360 110" preserveAspectRatio="none" className="block h-[110px] w-full">
      <path d={buildPath(curveBefore, 360, 110, 4).d} stroke="#94a3b8" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
      <path d={buildPath(after, 360, 110, 4).d} stroke="#0ea5e9" strokeWidth="2" fill="none" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Write strategy modal — Vibe → AI → flow chart preview
// ─────────────────────────────────────────────────────────────────────────
function WriteStrategyModal({ open, onClose, dark }) {
  const [prompt, setPrompt] = useStateMo('');
  const [phase, setPhase] = useStateMo('compose'); // compose | drafting | preview

  useEffectMo(() => {
    if (!open) { setPhase('compose'); setPrompt(''); }
  }, [open]);

  function send() {
    if (!prompt.trim()) return;
    setPhase('drafting');
    setTimeout(() => setPhase('preview'), 1600);
  }

  if (!open) return null;
  const suggestions = [
    'A momentum strategy on TQQQ that only trades in low-VIX regimes',
    'Buy oversold S&P names that just beat earnings',
    'Dollar-cost average BTC weekly, sell into 20% spikes',
    'Pairs trade NVDA / AMD when their correlation drops',
  ];

  return (
    <ModalShell open={open} onClose={onClose} dark={dark} width={880}
      title="Write a new strategy with aime"
      subtitle="Describe the trade idea in plain English. aime turns it into a runnable algorithm."
      icon="✍︎"
      accent="linear-gradient(135deg,#a855f7,#7c3aed)"
    >
      {phase === 'compose' && (
        <div className="space-y-5 p-5">
          <div className={`rounded-xl border p-3 ${dark ? 'border-white/[0.08] bg-white/[0.04]' : 'border-slate-200 bg-white'}`}>
            <textarea
              value={prompt} onChange={e => setPrompt(e.target.value)}
              rows={4}
              placeholder="e.g. Buy BTC when MACD crosses up AND volume is &gt; 1.5× average, exit on opposite cross or -3% trailing stop. Risk 1.5% per trade."
              className={`w-full resize-none bg-transparent text-[14px] leading-relaxed outline-none placeholder:opacity-50 ${dark ? 'text-white' : 'text-slate-900'}`}
            />
            <div className="mt-2 flex items-center justify-between">
              <div className={`flex items-center gap-2 text-[11.5px] ${dark ? 'text-white/50' : 'text-slate-500'}`}>
                <span>Universe</span>
                <select className={`rounded border px-1.5 py-0.5 text-[11px] ${dark ? 'border-white/[0.08] bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-700'}`}>
                  <option>Crypto (BTC / ETH / SOL …)</option>
                  <option>US Equity (S&amp;P 500)</option>
                  <option>QQQ constituents</option>
                </select>
                <span className="opacity-40">·</span>
                <span>Backtest</span>
                <select className={`rounded border px-1.5 py-0.5 text-[11px] ${dark ? 'border-white/[0.08] bg-white/5 text-white' : 'border-slate-200 bg-white text-slate-700'}`}>
                  <option>Last 2 years</option>
                  <option>Last 5 years</option>
                </select>
              </div>
              <button onClick={send} disabled={!prompt.trim()}
                className="rounded-md px-3 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}>
                Draft strategy →
              </button>
            </div>
          </div>

          <section>
            <SectionLabel dark={dark}>Try one of these</SectionLabel>
            <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => setPrompt(s)}
                  className={`rounded-lg border px-3 py-2 text-left text-[12.5px] ${dark ? 'border-white/[0.08] bg-white/[0.03] text-white/80 hover:bg-white/[0.06]' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}>
                  <span className="mr-1.5 opacity-50">→</span>{s}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {phase === 'drafting' && <AnalyzingState dark={dark} />}

      {phase === 'preview' && <StrategyPreview prompt={prompt} dark={dark} />}
    </ModalShell>
  );
}

function StrategyPreview({ prompt, dark }) {
  return (
    <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <section>
          <SectionLabel dark={dark}>aime's interpretation</SectionLabel>
          <div className={`mt-2 rounded-lg border p-3 text-[12.5px] leading-relaxed ${dark ? 'border-white/[0.05] bg-white/[0.03] text-white/80' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
            I read this as a <b>momentum strategy</b> on a crypto universe, gated by a <b>volume confirmation</b>.
            Entry on MACD bull cross + 1.5× volume; exit on reverse cross or trailing stop. Position size keeps
            risk-per-trade ≤ 1.5% of equity. I've defaulted the MACD periods to 12/26/9 — adjust below.
          </div>
        </section>

        <section>
          <SectionLabel dark={dark}>Logic flow</SectionLabel>
          <FlowChart dark={dark} />
        </section>

        <section>
          <SectionLabel dark={dark}>Generated code <span className="ml-1 font-mono text-[10px] opacity-60">Python · bigtrader</span></SectionLabel>
          <pre className={`mt-2 max-h-[180px] overflow-auto rounded-lg border p-3 font-mono text-[11.5px] leading-relaxed ${dark ? 'border-white/[0.05] bg-black/40 text-emerald-300' : 'border-slate-200 bg-slate-900 text-emerald-300'}`}>
{`def initialize(ctx):
    ctx.set_universe(['BTC', 'ETH', 'SOL'])
    ctx.macd_fast = 12
    ctx.macd_slow = 26
    ctx.signal_n = 9
    ctx.risk_per_trade = 0.015

def on_bar(ctx, bar):
    macd, signal, hist = ta.MACD(bar.close, 12, 26, 9)
    vol_z = (bar.volume - bar.vol_ma20) / bar.vol_std20
    if cross_up(macd, signal) and vol_z > 1.5:
        size = ctx.equity * ctx.risk_per_trade / bar.atr14
        ctx.order_target_value(bar.symbol, size)
    elif cross_down(macd, signal):
        ctx.order_target_value(bar.symbol, 0)`}
          </pre>
        </section>
      </div>

      <aside className="space-y-3">
        <section className={`rounded-xl border p-4 ${dark ? 'border-white/[0.05] bg-white/[0.03]' : 'border-slate-200 bg-white'}`}>
          <div className={`text-[10.5px] font-semibold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-slate-400'}`}>2Y backtest</div>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <Metric label="CAGR" value="+34.2%" tone="pos" dark={dark} />
            <Metric label="Sharpe" value="1.92" dark={dark} />
            <Metric label="Max DD" value="-12.4%" tone="neg" dark={dark} />
            <Metric label="Win rate" value="58%" dark={dark} />
          </div>
          <div className="mt-3">
            <EquityChart curve={window.seededWalk(99, 100, 0.42, 0.7, 0)} color="#a855f7" height={70} dark={dark} />
          </div>
        </section>

        <button className="w-full rounded-md py-2 text-[13px] font-semibold text-white" style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}>
          Save & add to Activity
        </button>
        <button className={`w-full rounded-md border py-1.5 text-[12px] font-medium ${dark ? 'border-white/[0.08] text-white/80' : 'border-slate-200 text-slate-700'}`}>
          Open in editor
        </button>
      </aside>
    </div>
  );
}

function Metric({ label, value, tone, dark }) {
  const toneCls = tone === 'pos' ? 'text-emerald-500' : tone === 'neg' ? 'text-rose-500' : (dark ? 'text-white' : 'text-slate-900');
  return (
    <div>
      <div className={`text-[10px] uppercase tracking-wider ${dark ? 'text-white/45' : 'text-slate-400'}`}>{label}</div>
      <div className={`text-[15px] font-semibold tabular-nums ${toneCls}`}>{value}</div>
    </div>
  );
}

function FlowChart({ dark }) {
  const nodes = [
    { label: 'Universe', sub: 'BTC · ETH · SOL', kind: 'data' },
    { label: 'MACD bull cross', sub: '12 / 26 / 9', kind: 'trigger' },
    { label: 'Volume z > 1.5', sub: 'vs MA-20', kind: 'filter' },
    { label: 'Long with risk = 1.5%', sub: 'sized by ATR-14', kind: 'action' },
    { label: 'Exit on reverse cross\nor -3% trailing stop', sub: 'whichever first', kind: 'exit' },
  ];
  const colors = {
    data:    { bg: dark ? 'rgba(14,165,233,0.14)' : '#e0f2fe', text: dark ? '#7dd3fc' : '#0369a1' },
    trigger: { bg: dark ? 'rgba(168,85,247,0.16)' : '#f5edff', text: dark ? '#d8b4fe' : '#7c3aed' },
    filter:  { bg: dark ? 'rgba(100,116,139,0.16)' : '#f1f5f9', text: dark ? '#cbd5e1' : '#475569' },
    action:  { bg: dark ? 'rgba(16,185,129,0.16)' : '#dcfce7', text: dark ? '#86efac' : '#047857' },
    exit:    { bg: dark ? 'rgba(239,68,68,0.16)' : '#fee2e2', text: dark ? '#fca5a5' : '#b91c1c' },
  };
  return (
    <div className={`mt-2 rounded-lg border p-4 ${dark ? 'border-white/[0.05] bg-white/[0.03]' : 'border-slate-200 bg-white'}`}>
      <div className="flex flex-wrap items-stretch gap-2">
        {nodes.map((n, i) => (
          <React.Fragment key={i}>
            <div className="flex min-w-[120px] flex-col rounded-md px-3 py-2" style={{ background: colors[n.kind].bg, color: colors[n.kind].text }}>
              <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{n.kind}</span>
              <span className="text-[12.5px] font-semibold whitespace-pre-wrap leading-tight">{n.label}</span>
              <span className="mt-0.5 text-[10.5px] opacity-80">{n.sub}</span>
            </div>
            {i < nodes.length - 1 && (
              <div className={`flex items-center text-[14px] ${dark ? 'text-white/30' : 'text-slate-300'}`}>→</div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { DeployModal, OptimizeModal, WriteStrategyModal });

// ─────────────────────────────────────────────────────────────────────────
// Strategy Preview modal — clicked from Marketplace cards.
// Shows: full equity curve, current holdings / dynamic universe,
// parameters (with plain-English explainers), recent trades, code snippet.
// ─────────────────────────────────────────────────────────────────────────
function StrategyPreviewModal({ open, onClose, strategy, dark, watched, onToggleWatch, onDeploy }) {
  const [tab, setTabP] = useStateMo('overview');
  useEffectMo(() => { if (open) setTabP('overview'); }, [open, strategy?.id]);
  if (!open || !strategy) return null;
  const s = strategy;
  const positive = s.metrics.ret1Y >= 0;
  const isMulti = s.universe?.kind === 'multi';

  return (
    <ModalShell open={open} onClose={onClose} dark={dark} width={920}
      title={s.name}
      subtitle={`by ${s.author.name} · ${s.author.org}`}
      icon={s.symbol.slice(0, 3)}
      accent={s.author.avatarColor}
    >
      {/* Hero strip */}
      <div className={`grid grid-cols-2 gap-4 border-b px-5 py-4 md:grid-cols-5 ${dark ? 'border-white/[0.05] bg-white/[0.02]' : 'border-slate-100 bg-slate-50/50'}`}>
        <BigMetric label="1Y return" value={`${positive ? '+' : ''}${s.metrics.ret1Y.toFixed(1)}%`} tone={positive ? 'pos' : 'neg'} dark={dark} />
        <BigMetric label="1Y Sharpe" value={s.metrics.sharpe1Y.toFixed(2)} dark={dark} />
        <BigMetric label="Max DD" value={`${s.metrics.maxDD.toFixed(1)}%`} tone="neg" dark={dark} />
        <BigMetric label="Win rate" value={`${s.metrics.winRate}%`} dark={dark} />
        <BigMetric label="Followers" value={s.metrics.followers.toLocaleString()} dark={dark} />
      </div>

      {/* Universe banner */}
      <div className={`flex items-center gap-3 border-b px-5 py-3 ${dark ? 'border-white/[0.05]' : 'border-slate-100'}`}>
        <div className={`grid h-9 w-9 place-items-center rounded-md ${isMulti
          ? (dark ? 'bg-violet-400/15 text-violet-300' : 'bg-violet-50 text-violet-600')
          : (dark ? 'bg-sky-400/15 text-sky-300' : 'bg-sky-50 text-sky-600')}`}>
          {isMulti
            ? <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M13 2l-2 7h6l-9 13 2-9H4z"/></svg>
            : <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/></svg>}
        </div>
        <div className="flex-1">
          <div className={`text-[12.5px] font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>
            {isMulti ? 'Multi-target · stock-picking' : 'Single target'}
            <span className={`ml-1.5 font-normal ${dark ? 'text-white/55' : 'text-slate-500'}`}>· {s.universe?.label}</span>
          </div>
          <div className={`text-[11.5px] ${dark ? 'text-white/55' : 'text-slate-500'}`}>{s.universe?.detail}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex items-center gap-3 border-b px-5 ${dark ? 'border-white/[0.05]' : 'border-slate-100'}`}>
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'holdings', label: isMulti ? 'Current basket' : 'Holdings' },
          { id: 'trades',   label: 'Recent trades' },
          { id: 'params',   label: 'Parameters' },
          { id: 'code',     label: 'Code' },
        ].map(t => (
          <button key={t.id} onClick={() => setTabP(t.id)} className={`relative py-3 text-[12.5px] font-medium ${
            tab === t.id ? (dark ? 'text-white' : 'text-slate-900') : (dark ? 'text-white/55 hover:text-white' : 'text-slate-500 hover:text-slate-900')
          }`}>
            {t.label}
            {tab === t.id && <span className="absolute inset-x-0 -bottom-px h-[2px] bg-current" />}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-5 py-5">
        {tab === 'overview' && <PreviewOverview s={s} dark={dark} />}
        {tab === 'holdings' && <PreviewHoldings s={s} dark={dark} isMulti={isMulti} />}
        {tab === 'trades' && <PreviewTrades s={s} dark={dark} />}
        {tab === 'params' && <PreviewParams s={s} dark={dark} />}
        {tab === 'code' && <PreviewCode s={s} dark={dark} />}
      </div>

      {/* Footer CTA strip */}
      <div className={`flex items-center justify-between border-t px-5 py-3 ${dark ? 'border-white/[0.05]' : 'border-slate-100'}`}>
        <div className={`text-[11.5px] ${dark ? 'text-white/45' : 'text-slate-400'}`}>
          Published {s.published} · backtest covers 5y in-sample + ~120 days OOS
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onToggleWatch} className={`rounded-md border px-3 py-1.5 text-[12px] font-medium ${
            watched
              ? (dark ? 'border-white/[0.10] bg-white/8 text-white' : 'border-slate-200 bg-slate-50 text-slate-700')
              : (dark ? 'border-white/[0.10] text-white hover:bg-white/8' : 'border-slate-200 text-slate-700 hover:bg-slate-50')
          }`}>
            {watched ? '✓ Added to Activity' : '+ Add to Activity'}
          </button>
          <button onClick={onDeploy} className="rounded-md bg-sky-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-sky-700">
            Deploy →
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function BigMetric({ label, value, tone, dark }) {
  const toneCls = tone === 'pos' ? 'text-emerald-500' : tone === 'neg' ? 'text-rose-500' : (dark ? 'text-white' : 'text-slate-900');
  return (
    <div>
      <div className={`text-[10px] font-medium uppercase tracking-wider ${dark ? 'text-white/45' : 'text-slate-400'}`}>{label}</div>
      <div className={`text-[18px] font-semibold tabular-nums ${toneCls}`} style={{ letterSpacing: '-0.01em' }}>{value}</div>
    </div>
  );
}

function PreviewOverview({ s, dark }) {
  return (
    <div className="space-y-4">
      <p className={`text-[13px] leading-relaxed ${dark ? 'text-white/75' : 'text-slate-700'}`}>{s.blurb}</p>
      <div className="flex flex-wrap gap-1">
        {s.tags.map(t => (
          <span key={t} className={`rounded px-2 py-0.5 text-[11px] font-medium ${dark ? 'bg-white/8 text-white/70' : 'bg-slate-100 text-slate-600'}`}>{t}</span>
        ))}
      </div>
      <div className={`rounded-lg border p-3 ${dark ? 'border-white/[0.05] bg-white/[0.03]' : 'border-slate-200 bg-white'}`}>
        <div className="mb-2 flex items-center justify-between">
          <span className={`text-[11px] font-semibold uppercase tracking-wider ${dark ? 'text-white/55' : 'text-slate-500'}`}>Cumulative net value · 120d OOS</span>
          <span className={`text-[11px] tabular-nums ${dark ? 'text-white/55' : 'text-slate-500'}`}>vs benchmark: SPY</span>
        </div>
        <EquityChart curve={s.curve} color={s.metrics.ret1Y >= 0 ? '#10b981' : '#ef4444'} height={140} showAxis dark={dark} />
      </div>
      <ReBacktestPanel strategy={s} dark={dark} />
    </div>
  );
}

function PreviewHoldings({ s, dark, isMulti }) {
  // Synthesize plausible current holdings based on the strategy type.
  let holdings;
  if (s.id === 'qqq-rotation') {
    holdings = [
      { sym: 'NVDA', name: 'NVIDIA Corp',         w: 22.4, side: 'long', pct: 4.59 },
      { sym: 'AVGO', name: 'Broadcom Inc',        w: 19.8, side: 'long', pct: 2.81 },
      { sym: 'MSFT', name: 'Microsoft',           w: 19.1, side: 'long', pct: 2.10 },
      { sym: 'AAPL', name: 'Apple Inc',           w: 19.5, side: 'long', pct: -1.12 },
      { sym: 'GOOG', name: 'Alphabet Inc',        w: 19.2, side: 'long', pct: -1.32 },
    ];
  } else if (s.id === 'pca-residual') {
    holdings = [
      { sym: 'XLK', name: 'Tech Select',          w: 50.4, side: 'long', pct: 1.08 },
      { sym: 'XLF', name: 'Financials Select',    w: 22.8, side: 'short', pct: -0.75 },
      { sym: 'XLE', name: 'Energy Select',        w: 26.8, side: 'short', pct: -1.33 },
    ];
  } else if (s.id === 'leveraged-etf') {
    holdings = [{ sym: 'TQQQ', name: 'ProShares UltraPro QQQ 3×', w: 100, side: 'long', pct: 3.42 }];
  } else {
    holdings = [{ sym: s.symbol, name: s.universe?.detail || s.symbol, w: 100, side: 'long', pct: s.metrics.ret1Y > 0 ? 2.4 : -1.2 }];
  }
  const longCount = holdings.filter(h => h.side === 'long').length;
  const shortCount = holdings.filter(h => h.side === 'short').length;
  return (
    <div className="space-y-3">
      <div className={`flex items-center justify-between text-[12px] ${dark ? 'text-white/70' : 'text-slate-600'}`}>
        <span>{isMulti ? `Strategy currently holds ${holdings.length} names${shortCount ? ` (${longCount} long, ${shortCount} short)` : ''}` : 'Strategy holds 1 instrument'}</span>
        <span className={dark ? 'text-white/40' : 'text-slate-400'}>Auto-rebalances {s.id === 'qqq-rotation' ? 'weekly' : 'on signal'}</span>
      </div>
      <div className={`overflow-hidden rounded-lg border ${dark ? 'border-white/[0.05]' : 'border-slate-200'}`}>
        <table className="w-full text-[12px]">
          <thead className={dark ? 'bg-white/[0.03] text-white/45' : 'bg-slate-50 text-slate-400'}>
            <tr>
              <th className="px-3 py-2 text-left font-medium">Symbol</th>
              <th className="py-2 text-left font-medium">Side</th>
              <th className="py-2 text-left font-medium">Weight</th>
              <th className="px-3 py-2 text-right font-medium">Unrealized</th>
            </tr>
          </thead>
          <tbody className={dark ? 'text-white/85' : 'text-slate-700'}>
            {holdings.map(h => (
              <tr key={h.sym} className={`border-t ${dark ? 'border-white/5' : 'border-slate-100'}`}>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{h.sym}</span>
                    <span className={dark ? 'text-white/45' : 'text-slate-400'}>{h.name}</span>
                  </div>
                </td>
                <td className="py-2">
                  <span className={`rounded px-1.5 py-0.5 text-[10.5px] font-semibold ${h.side === 'short' ? (dark ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-50 text-rose-600') : (dark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600')}`}>{h.side.toUpperCase()}</span>
                </td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-12 tabular-nums">{h.w.toFixed(1)}%</span>
                    <div className={`relative h-1.5 w-24 overflow-hidden rounded-full ${dark ? 'bg-white/8' : 'bg-slate-100'}`}>
                      <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${h.w}%`, background: h.side === 'short' ? '#ef4444' : '#10b981' }} />
                    </div>
                  </div>
                </td>
                <td className={`px-3 py-2 text-right tabular-nums font-medium ${h.pct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{h.pct >= 0 ? '+' : ''}{h.pct.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PreviewTrades({ s, dark }) {
  const sample = s.universe?.kind === 'multi' ? ['NVDA', 'AAPL', 'AVGO', 'MSFT', 'GOOG'] : [s.symbol];
  const trades = [];
  for (let i = 0; i < 8; i++) {
    const buy = i % 2 === 0;
    const sym = sample[i % sample.length];
    trades.push({ at: `2026-05-${(12 - i).toString().padStart(2, '0')}`, sym, side: buy ? 'BUY' : 'SELL', qty: (10 + i * 3), px: (100 + (i * 7)).toFixed(2), pnl: buy ? null : ((Math.sin(i * 0.7) * 180).toFixed(2)) });
  }
  return (
    <div className={`overflow-hidden rounded-lg border ${dark ? 'border-white/[0.05]' : 'border-slate-200'}`}>
      <table className="w-full text-[12px]">
        <thead className={dark ? 'bg-white/[0.03] text-white/45' : 'bg-slate-50 text-slate-400'}>
          <tr>
            <th className="px-3 py-2 text-left font-medium">Date</th>
            <th className="py-2 text-left font-medium">Symbol</th>
            <th className="py-2 text-left font-medium">Side</th>
            <th className="py-2 text-right font-medium">Qty</th>
            <th className="py-2 text-right font-medium">Price</th>
            <th className="px-3 py-2 text-right font-medium">Realized P&L</th>
          </tr>
        </thead>
        <tbody className={dark ? 'text-white/85' : 'text-slate-700'}>
          {trades.map((t, i) => (
            <tr key={i} className={`border-t ${dark ? 'border-white/5' : 'border-slate-100'}`}>
              <td className="px-3 py-2 tabular-nums">{t.at}</td>
              <td className="py-2 font-medium">{t.sym}</td>
              <td className="py-2"><span className={`text-[11px] font-semibold ${t.side === 'BUY' ? 'text-emerald-500' : 'text-rose-500'}`}>{t.side}</span></td>
              <td className="py-2 text-right tabular-nums">{t.qty}</td>
              <td className="py-2 text-right tabular-nums">${t.px}</td>
              <td className={`px-3 py-2 text-right tabular-nums ${t.pnl == null ? (dark ? 'text-white/40' : 'text-slate-400') : (Number(t.pnl) >= 0 ? 'text-emerald-500' : 'text-rose-500')}`}>
                {t.pnl == null ? '—' : `${Number(t.pnl) >= 0 ? '+' : ''}$${Math.abs(t.pnl)}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PreviewParams({ s, dark }) {
  const params = [
    { k: 'Entry signal', v: 'MACD bull cross (12/26/9)', explain: 'Buys when short-term momentum overtakes long-term.' },
    { k: 'Volume filter', v: 'Volume z-score > 1.5', explain: 'Only when current volume is well above its 20-bar average.' },
    { k: 'Risk per trade', v: '1.5% of equity', explain: 'Position is sized so a hit on the stop loses ≤ 1.5%.' },
    { k: 'Exit', v: 'Opposite MACD cross OR −3% trailing stop', explain: 'Whichever comes first.' },
    { k: 'Rebalance', v: s.id === 'qqq-rotation' ? 'Weekly, Monday 9:30 ET' : 'On signal', explain: '' },
  ];
  return (
    <div className="space-y-2">
      {params.map((p, i) => (
        <div key={i} className={`grid grid-cols-[140px_1fr] gap-3 rounded-lg border p-3 ${dark ? 'border-white/[0.05] bg-white/[0.03]' : 'border-slate-200 bg-white'}`}>
          <div className={`text-[12px] font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{p.k}</div>
          <div>
            <div className={`font-mono text-[12px] ${dark ? 'text-white/85' : 'text-slate-700'}`}>{p.v}</div>
            {p.explain && <div className={`mt-0.5 text-[11.5px] ${dark ? 'text-white/55' : 'text-slate-500'}`}>{p.explain}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function PreviewCode({ s, dark }) {
  return (
    <pre className={`max-h-[300px] overflow-auto rounded-lg border p-3 font-mono text-[11.5px] leading-relaxed ${dark ? 'border-white/[0.05] bg-black/40 text-emerald-300' : 'border-slate-200 bg-slate-900 text-emerald-300'}`}>
{`# ${s.name}
# by ${s.author.name} · ${s.author.org}
# Universe: ${s.universe?.label}

def initialize(ctx):
    ctx.set_universe(${s.universe?.kind === 'multi' ? "'QQQ_100'" : `'${s.symbol}'`})
    ctx.macd_fast, ctx.macd_slow, ctx.signal_n = 12, 26, 9
    ctx.risk_per_trade = 0.015

def on_bar(ctx, bar):
    macd, signal, hist = ta.MACD(bar.close, 12, 26, 9)
    vol_z = (bar.volume - bar.vol_ma20) / bar.vol_std20
    if cross_up(macd, signal) and vol_z > 1.5:
        size = ctx.equity * ctx.risk_per_trade / bar.atr14
        ctx.order_target_value(bar.symbol, size)
    elif cross_down(macd, signal):
        ctx.order_target_value(bar.symbol, 0)`}
    </pre>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Manage live modal — for strategies already deployed to live or paper.
// Lets the user adjust capital / guardrails, see live trade log,
// switch account, or step back down to paper/watching.
// ─────────────────────────────────────────────────────────────────────────
function ManageLiveModal({ open, onClose, watched, dark, onJumpToActivity }) {
  if (!open || !watched) return null;
  const meta = window.MARKET_STRATEGIES.find(s => s.id === watched.id);
  const state = watched.deployStatus; // 'paper' | 'live' | 'paused'
  const isLive = state === 'live';
  const isPaper = state === 'paper';
  const isPaused = state === 'paused';

  const statusBadge = isLive
    ? { label: 'DEPLOYED · real money', cls: dark ? 'bg-rose-400/15 text-rose-300' : 'bg-rose-50 text-rose-700' }
    : isPaper
      ? { label: 'PAPER · simulated', cls: dark ? 'bg-cyan-400/15 text-cyan-300' : 'bg-cyan-50 text-cyan-700' }
      : { label: 'PAUSED', cls: dark ? 'bg-amber-400/15 text-amber-300' : 'bg-amber-50 text-amber-700' };

  return (
    <ModalShell open={open} onClose={onClose} dark={dark} width={780}
      title={`Manage ${meta?.name || watched.id}`}
      subtitle="Pick the account, set capital and guardrails. Live activity (positions, trades, P&L) lives in the Activity tab."
      icon={isLive ? '$' : isPaper ? 'P' : '⏸'}
      accent={isLive ? 'linear-gradient(135deg,#ef4444,#dc2626)' : isPaper ? 'linear-gradient(135deg,#06b6d4,#0891b2)' : 'linear-gradient(135deg,#f59e0b,#d97706)'}
    >
      <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`rounded px-1.5 py-0.5 text-[10.5px] font-bold tracking-wider ${statusBadge.cls}`}>{statusBadge.label}</span>
              <span className={`text-[11.5px] ${dark ? 'text-white/55' : 'text-slate-500'}`}>
                {watched.deployAccount?.label} {watched.deployAccount?.tail} · Day {watched.runDays}
              </span>
            </div>
            {onJumpToActivity && (
              <button
                onClick={() => { onJumpToActivity(watched); onClose(); }}
                className={`text-[11.5px] font-medium ${dark ? 'text-sky-300 hover:text-sky-200' : 'text-sky-600 hover:text-sky-700'}`}
              >
                View activity →
              </button>
            )}
          </div>

          {isPaused && (
            <section className={`rounded-lg border p-3 ${dark ? 'border-amber-300/30 bg-amber-300/10 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
              <div className="flex items-center gap-1.5 text-[12px] font-semibold">⚠︎ Why is this paused?</div>
              <div className="mt-1 text-[12px] leading-relaxed">{watched.lastSignal?.text || 'User-paused.'} You can review settings below and resume when ready.</div>
            </section>
          )}

          <section>
            <SectionLabel dark={dark}>Capital & guardrails</SectionLabel>
            <div className={`mt-2 rounded-lg border p-4 ${dark ? 'border-white/[0.05] bg-white/[0.03]' : 'border-slate-200 bg-white'}`}>
              <div className="grid grid-cols-2 gap-4">
                <KnobRow label="Capital deployed" value={`$${(watched.capital || 0).toLocaleString()}`} dark={dark} adjustable />
                <KnobRow label="Risk per trade" value="1.5%" dark={dark} adjustable />
                <KnobRow label="Daily loss cap" value="3.0%" dark={dark} adjustable />
                <KnobRow label="Max drawdown stop" value="8.0%" dark={dark} adjustable />
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-3">
          {/* Deploy to additional accounts */}
          <section className={`rounded-xl p-4 ${dark ? 'bg-white/[0.04]' : 'bg-slate-50'}`}>
            <SectionLabel dark={dark}>Deploy to accounts</SectionLabel>
            <p className={`mt-1 text-[11.5px] leading-relaxed ${dark ? 'text-white/60' : 'text-slate-500'}`}>
              Run this strategy on multiple accounts simultaneously. Each deployment tracks independently.
            </p>
            <div className="mt-3 space-y-1.5">
              {window.DEPLOY_TARGETS.map(acc => {
                const current = watched.deployAccount && acc.label === watched.deployAccount.label && acc.tail === watched.deployAccount.tail;
                const dot = acc.kind === 'live' ? '#ef4444' : '#06b6d4';
                return (
                  <div key={acc.id} className={`flex items-center gap-2.5 rounded-md border px-3 py-2 ${
                    current
                      ? (dark ? 'border-sky-400/40 bg-sky-400/10' : 'border-sky-300 bg-sky-50')
                      : (dark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-slate-200 bg-white')
                  }`}>
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: dot }} />
                    <div className="min-w-0 flex-1">
                      <div className={`text-[12px] font-medium ${dark ? 'text-white' : 'text-slate-900'}`}>{acc.label} <span className={dark ? 'text-white/40' : 'text-slate-400'}>{acc.tail}</span></div>
                      <div className={`text-[10.5px] ${dark ? 'text-white/45' : 'text-slate-500'}`}>{acc.sub}</div>
                    </div>
                    {current ? (
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${dark ? 'bg-sky-400/20 text-sky-300' : 'bg-sky-100 text-sky-700'}`}>Active</span>
                    ) : (
                      <button className={`shrink-0 rounded-md border px-2 py-1 text-[11px] font-medium ${dark ? 'border-white/[0.10] text-white/85 hover:bg-white/[0.06]' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                        + Deploy
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className={`rounded-xl p-4 ${dark ? 'bg-white/[0.04]' : 'bg-slate-50'}`}>
            <SectionLabel dark={dark}>Other</SectionLabel>
            <div className="mt-2 space-y-1.5">
              <button className={`w-full rounded-md border py-1.5 text-[12px] font-medium ${dark ? 'border-white/[0.08] text-white/85' : 'border-slate-200 text-slate-700'}`}>Return to watch-only</button>
              <button className={`w-full rounded-md border py-1.5 text-[12px] font-medium ${dark ? 'border-white/[0.08] text-white/85' : 'border-slate-200 text-slate-700'}`}>Export trade log (CSV)</button>
            </div>
          </section>

          <section className={`rounded-xl border p-4 ${dark ? 'border-rose-300/25 bg-rose-400/8' : 'border-rose-200 bg-rose-50'}`}>
            <div className={`text-[11.5px] font-semibold ${dark ? 'text-rose-200' : 'text-rose-700'}`}>Danger zone</div>
            <button className={`mt-2 w-full rounded-md py-1.5 text-[12px] font-semibold ${dark ? 'bg-rose-500/20 text-rose-200' : 'bg-rose-100 text-rose-700'}`}>Stop & close all positions</button>
          </section>
        </aside>
      </div>
    </ModalShell>
  );
}

function KnobRow({ label, value, dark, adjustable }) {
  return (
    <div>
      <div className={`text-[11px] ${dark ? 'text-white/55' : 'text-slate-500'}`}>{label}</div>
      <div className="mt-0.5 flex items-center justify-between gap-2">
        <span className={`text-[14px] font-semibold tabular-nums ${dark ? 'text-white' : 'text-slate-900'}`}>{value}</span>
        {adjustable && <button className={`rounded border px-1.5 py-0.5 text-[10.5px] font-medium ${dark ? 'border-white/[0.10] text-white/65' : 'border-slate-200 text-slate-500'}`}>Edit</button>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Pause confirmation
// ─────────────────────────────────────────────────────────────────────────
function PauseConfirmModal({ open, onClose, watched, dark, onConfirm }) {
  if (!open || !watched) return null;
  const meta = window.MARKET_STRATEGIES.find(s => s.id === watched.id);
  const liveMode = watched.deployStatus === 'live';
  return (
    <ModalShell open={open} onClose={onClose} dark={dark} width={460}
      title={`Pause ${meta?.name}?`}
      subtitle="No new orders will be placed. Open positions stay where they are."
      icon="⏸"
      accent="linear-gradient(135deg,#f59e0b,#d97706)"
    >
      <div className="space-y-3 px-5 py-4">
        <div className={`rounded-md p-3 text-[12.5px] leading-relaxed ${dark ? 'bg-white/[0.04] text-white/75' : 'bg-slate-50 text-slate-700'}`}>
          aime will <b>keep tracking signals</b> while paused, so you can resume any time without losing context. {liveMode && 'Live orders already in the market remain active until filled or canceled.'}
        </div>
        <label className={`flex items-center gap-2 text-[12px] ${dark ? 'text-white/70' : 'text-slate-600'}`}>
          <input type="checkbox" defaultChecked /> Close all open positions on pause
        </label>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className={`rounded-md border px-3 py-1.5 text-[12px] font-medium ${dark ? 'border-white/[0.10] text-white/85' : 'border-slate-200 text-slate-700'}`}>Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }} className="rounded-md px-3 py-1.5 text-[12px] font-semibold text-white" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>Pause strategy</button>
        </div>
      </div>
    </ModalShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Re-backtest inline panel — custom date range backtest overlay.
// ─────────────────────────────────────────────────────────────────────────
function ReBacktestPanel({ strategy, dark }) {
  const [open, setOpen] = useStateMo(false);
  const [from, setFrom] = useStateMo('2023-01-01');
  const [to, setTo] = useStateMo(new Date().toISOString().slice(0, 10));
  const [running, setRunning] = useStateMo(false);
  const [result, setResult] = useStateMo(null);
  const [stage, setStage] = useStateMo('');

  function runBacktest() {
    setRunning(true);
    setResult(null);
    const stages = ['Loading data…', 'Computing signals…', 'Running simulation…', 'Generating report…'];
    let i = 0;
    setStage(stages[0]);
    const iv = setInterval(() => {
      i++;
      if (i < stages.length) { setStage(stages[i]); return; }
      clearInterval(iv);
      setStage('');
      setRunning(false);
      const s = strategy;
      const origRet = s.metrics?.ret1Y || 20;
      const jitter = (Math.sin(from.charCodeAt(5) * 7 + to.charCodeAt(8) * 3) * 0.3);
      const reRet = +(origRet * (0.7 + jitter)).toFixed(1);
      const reSharpe = +((s.metrics?.sharpe1Y || 1.5) * (0.8 + jitter * 0.4)).toFixed(2);
      const reDD = +((s.metrics?.maxDD || -10) * (1.1 - jitter * 0.2)).toFixed(1);
      const reCurve = window.seededWalk(
        from.charCodeAt(3) * 100 + to.charCodeAt(8),
        s.curve?.length || 120,
        reRet / (s.curve?.length || 120),
        Math.abs(reRet) / 40,
        0
      );
      setResult({ ret: reRet, sharpe: reSharpe, maxDD: reDD, curve: reCurve, from, to });
    }, 800);
  }

  function setQuickRange(label) {
    const now = new Date();
    const end = now.toISOString().slice(0, 10);
    let start;
    if (label === '1Y') start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    else if (label === '3Y') start = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());
    else if (label === '5Y') start = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
    else start = new Date('2018-01-01');
    setFrom(start.toISOString().slice(0, 10));
    setTo(end);
  }

  const inputCls = `rounded-md border px-2.5 py-1.5 text-[12px] tabular-nums ${dark ? 'border-white/[0.10] bg-white/[0.03] text-white' : 'border-slate-200 bg-white text-slate-900'}`;
  const chipCls = (active) => `rounded-md px-2 py-1 text-[11px] font-medium ${active ? (dark ? 'bg-white/12 text-white' : 'bg-slate-900 text-white') : (dark ? 'text-white/60 hover:bg-white/8' : 'text-slate-500 hover:bg-slate-100')}`;

  return (
    <div className={`rounded-lg border ${dark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-slate-200 bg-slate-50/50'}`}>
      <button onClick={() => setOpen(!open)} className={`flex w-full items-center justify-between px-4 py-2.5 text-left ${dark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50'}`}>
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className={`h-4 w-4 ${dark ? 'text-sky-300' : 'text-sky-600'}`} fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 12h4l3-8 4 16 3-8h4" />
          </svg>
          <span className={`text-[13px] font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>Re-backtest</span>
          <span className={`text-[11px] ${dark ? 'text-white/45' : 'text-slate-400'}`}>Run with a custom date range</span>
        </div>
        <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''} ${dark ? 'text-white/50' : 'text-slate-400'}`} fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className={`border-t px-4 py-4 space-y-4 ${dark ? 'border-white/[0.05]' : 'border-slate-200'}`}>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className={`block mb-1 text-[10.5px] font-medium uppercase tracking-wider ${dark ? 'text-white/45' : 'text-slate-400'}`}>From</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={`block mb-1 text-[10.5px] font-medium uppercase tracking-wider ${dark ? 'text-white/45' : 'text-slate-400'}`}>To</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} className={inputCls} />
            </div>
            <div className="flex items-center gap-1">
              {['1Y', '3Y', '5Y'].map(q => (
                <button key={q} onClick={() => setQuickRange(q)} className={chipCls(false)}>{q}</button>
              ))}
              <button onClick={() => setQuickRange('latest')} className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${dark ? 'bg-sky-500/20 text-sky-300 hover:bg-sky-500/30' : 'bg-sky-50 text-sky-700 hover:bg-sky-100'}`}>
                Run to latest
              </button>
            </div>
            <button onClick={runBacktest} disabled={running} className={`ml-auto rounded-md px-4 py-1.5 text-[12px] font-semibold text-white ${running ? 'opacity-60 cursor-wait' : 'hover:brightness-110'}`} style={{ background: 'linear-gradient(135deg,#0ea5e9,#06b6d4)' }}>
              {running ? stage : 'Run Backtest'}
            </button>
          </div>

          {running && (
            <div className={`flex items-center gap-3 rounded-md px-4 py-3 ${dark ? 'bg-white/[0.03]' : 'bg-white'}`}>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent text-sky-500" />
              <span className={`text-[12.5px] font-medium ${dark ? 'text-white/70' : 'text-slate-600'}`}>{stage}</span>
            </div>
          )}

          {result && !running && (
            <div className="space-y-3">
              <div className={`grid grid-cols-4 gap-3 rounded-md p-3 ${dark ? 'bg-white/[0.03]' : 'bg-white'}`}>
                <div>
                  <div className={`text-[10px] font-medium uppercase tracking-wider ${dark ? 'text-white/40' : 'text-slate-400'}`}>Period</div>
                  <div className={`text-[12px] font-semibold tabular-nums ${dark ? 'text-white' : 'text-slate-900'}`}>{result.from} → {result.to}</div>
                </div>
                <div>
                  <div className={`text-[10px] font-medium uppercase tracking-wider ${dark ? 'text-white/40' : 'text-slate-400'}`}>Return</div>
                  <div className={`text-[14px] font-semibold tabular-nums ${result.ret >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{result.ret >= 0 ? '+' : ''}{result.ret}%</div>
                </div>
                <div>
                  <div className={`text-[10px] font-medium uppercase tracking-wider ${dark ? 'text-white/40' : 'text-slate-400'}`}>Sharpe</div>
                  <div className={`text-[14px] font-semibold tabular-nums ${dark ? 'text-white' : 'text-slate-900'}`}>{result.sharpe}</div>
                </div>
                <div>
                  <div className={`text-[10px] font-medium uppercase tracking-wider ${dark ? 'text-white/40' : 'text-slate-400'}`}>Max DD</div>
                  <div className="text-[14px] font-semibold tabular-nums text-rose-500">{result.maxDD}%</div>
                </div>
              </div>

              <div className={`rounded-md border p-3 ${dark ? 'border-white/[0.05] bg-white/[0.02]' : 'border-slate-200 bg-white'}`}>
                <div className="mb-2 flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <span className="inline-block h-[2px] w-4 rounded" style={{ background: strategy.metrics?.ret1Y >= 0 ? '#10b981' : '#ef4444' }} />
                    <span className={dark ? 'text-white/55' : 'text-slate-500'}>Original</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <span className="inline-block h-[2px] w-4 rounded" style={{ background: '#0ea5e9', borderTop: '2px dashed #0ea5e9', height: 0 }} />
                    <svg width="16" height="2"><line x1="0" y1="1" x2="16" y2="1" stroke="#0ea5e9" strokeWidth="2" strokeDasharray="3,2" /></svg>
                    <span className={dark ? 'text-white/55' : 'text-slate-500'}>Re-backtest ({result.from.slice(0,4)}–{result.to.slice(0,4)})</span>
                  </span>
                </div>
                <div className="relative">
                  <EquityChart curve={strategy.curve} color={strategy.metrics?.ret1Y >= 0 ? '#10b981' : '#ef4444'} height={120} dark={dark} />
                  <div className="absolute inset-0" style={{ opacity: 0.7 }}>
                    <EquityChart curve={result.curve} color="#0ea5e9" height={120} dark={dark} dashed />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { StrategyPreviewModal, ManageLiveModal, PauseConfirmModal, ReBacktestPanel, PreviewHoldings, PreviewTrades, PreviewParams, PreviewCode });
