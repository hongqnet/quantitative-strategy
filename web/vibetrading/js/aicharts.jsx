// AI Charts page — ported from src/features/aimeclaw/chart/*.tsx as a single JSX module.
// Reads activeStrategyId from AimeClaw store to drive signal overlay.

const { useMemo: useMemoAC, useState: useStateAC } = React;

function AIChartsPage({ dark }) {
  const aime = window.useAimeClaw();
  const activeId = aime.state.activeStrategyId;
  const strategy = activeId ? window.getAimeStrategy(activeId) : null;

  return (
    <div className={`flex h-full min-w-0 flex-1 flex-col ${dark ? 'bg-[#0b0d12]' : 'bg-white'}`}>
      <AIChartToolbar strategy={strategy} dark={dark} />
      <div className="relative flex min-h-0 flex-1">
        <ChartBackgroundA dark={dark} strategy={strategy} />
        <SignalOverlayA signals={strategy ? strategy.signals : []} active={!!strategy} />
        {strategy && (
          <div className={`absolute left-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-lg border py-1 pl-2.5 pr-1 text-[11px] font-medium shadow-sm backdrop-blur ${dark ? 'border-sky-400/30 bg-sky-500/15 text-sky-200' : 'border-sky-300/60 bg-white/95 text-sky-700'}`}>
            <span className="h-2 w-2 animate-pulse rounded-full bg-sky-500"/>
            Running: {strategy.name}
            <button
              onClick={() => aime.setActiveStrategy(null)}
              title="Stop running strategy"
              className={`ml-1 grid h-5 w-5 place-items-center rounded ${dark ? 'text-sky-200/70 hover:bg-sky-500/20 hover:text-sky-200' : 'text-sky-700/70 hover:bg-sky-50 hover:text-sky-700'}`}
            >
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
          </div>
        )}
      </div>
      <StrategyTesterDockA strategy={strategy} dark={dark} />
    </div>
  );
}

function AIChartToolbar({ strategy, dark }) {
  const symbol = strategy ? strategy.symbol + '-USD' : 'BTC-USD';
  return (
    <div className={`flex h-12 shrink-0 items-center gap-3 border-b px-4 text-[12px] ${dark ? 'border-white/[0.05] text-white/70' : 'border-slate-200/70 text-slate-700 bg-gradient-to-b from-slate-50/60 to-white'}`}>
      <div className={`flex items-center gap-1.5 rounded-md px-2 py-1 font-semibold ${dark ? 'bg-white/5' : 'bg-slate-100'}`}>
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 opacity-70" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        {symbol}
      </div>
      {['1m','5m','15m','1h','4h','1d','1w'].map((tf, i) => (
        <button key={tf} className={`rounded px-1.5 py-0.5 font-medium ${i === 5 ? (dark ? 'bg-white/12 text-white' : 'bg-slate-900 text-white') : (dark ? 'text-white/55 hover:bg-white/8' : 'text-slate-500 hover:bg-slate-100')}`}>{tf}</button>
      ))}
      <div className={`mx-2 h-5 w-px ${dark ? 'bg-white/10' : 'bg-slate-200'}`}/>
      {['MA','BOLL','VOL','MACD','KDJ','RSI'].map((ind, i) => (
        <button key={ind} className={`rounded px-1.5 py-0.5 ${i < 4 ? (dark ? 'font-semibold text-sky-300' : 'font-semibold text-sky-700') : (dark ? 'text-white/45 hover:bg-white/8' : 'text-slate-400 hover:bg-slate-100')}`}>{ind}</button>
      ))}
      <div className="ml-auto flex items-center gap-2">
        <button className={`rounded-md border px-2 py-1 text-[11.5px] font-medium ${dark ? 'border-white/[0.08] text-white/70 hover:bg-white/8' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
          <svg viewBox="0 0 24 24" className="mr-1 inline-block h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
          Indicators
        </button>
        <button className={`rounded-md border px-2 py-1 text-[11.5px] font-medium ${dark ? 'border-white/[0.08] text-white/70 hover:bg-white/8' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
          Drawing
        </button>
      </div>
    </div>
  );
}

// Synthetic candlestick chart — keeps it cheap, deterministic.
function generateCandleData() {
  const N = 120;
  let s = 7;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const closes = [];
  let price = 230;
  for (let i = 0; i < N; i++) {
    const phase = i / N;
    let drift = 0;
    if (phase < 0.18) drift = -0.6;
    else if (phase < 0.55) drift = 0.7;
    else if (phase < 0.85) drift = 0.1;
    else drift = -0.3;
    price += drift + (rand() - 0.5) * 1.6;
    closes.push(price);
  }
  const min = Math.min(...closes) - 4;
  const max = Math.max(...closes) + 4;
  const W = 1000, H = 480;
  const yScale = (p) => H - ((p - min) / (max - min)) * H * 0.95 - 10;
  const xScale = (i) => (i / (N - 1)) * (W - 60) + 12;
  const candles = closes.map((c, i) => {
    const open = i > 0 ? closes[i - 1] : c - 0.5;
    const high = Math.max(open, c) + Math.abs((rand() - 0.5) * 2);
    const low  = Math.min(open, c) - Math.abs((rand() - 0.5) * 2);
    return {
      x: xScale(i), open: yScale(open), close: yScale(c), high: yScale(high), low: yScale(low),
      bull: c >= open, w: 5.5,
    };
  });
  function ma(period, color) {
    const points = closes.map((_, i) => {
      const start = Math.max(0, i - period + 1);
      const slice = closes.slice(start, i + 1);
      const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
      return { x: xScale(i), y: yScale(avg) };
    });
    return { color, points };
  }
  const mas = [ma(5, '#06b6d4'), ma(10, '#94a3b8'), ma(20, '#ec4899'), ma(60, '#a855f7')];
  const vol = closes.map((c, i) => {
    const open = i > 0 ? closes[i - 1] : c;
    const h = 12 + Math.abs(c - open) * 6 + rand() * 18;
    return { x: xScale(i), h: Math.min(56, h), bull: c >= open };
  });
  return { candles, mas, vol };
}

function ChartBackgroundA({ dark, strategy }) {
  const data = useMemoAC(() => generateCandleData(), []);
  return (
    <div className={`relative flex h-full w-full flex-col ${dark ? 'bg-[#0b0d12]' : 'bg-white'}`}>
      <div className={`flex h-9 items-center gap-3 px-3 text-[11px] ${dark ? 'text-white/65' : 'text-slate-700'}`}>
        <div className="font-semibold">{strategy ? strategy.symbol + '-USD' : 'BTC-USD'}</div>
        <div className={`flex items-center gap-3 ${dark ? 'text-white/40' : 'text-slate-400'}`}>
          <span>Date: <span className={dark ? 'text-white/90' : 'text-slate-900'}>2025-08-25 Monday</span></span>
          <span>O:<span className={dark ? 'text-white/90' : 'text-slate-900'}>226.48</span></span>
          <span>H:<span className={dark ? 'text-white/90' : 'text-slate-900'}>229.30</span></span>
          <span>L:<span className={dark ? 'text-white/90' : 'text-slate-900'}>226.23</span></span>
          <span>C:<span className={dark ? 'text-white/90' : 'text-slate-900'}>227.16</span></span>
          <span className="text-rose-600">-0.60(-0.26%)</span>
        </div>
      </div>

      <div className="relative flex-1">
        <svg viewBox="0 0 1000 480" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <Grid width={1000} height={480} rows={6} cols={10} dark={dark} />
          {data.mas.map((line, i) => (
            <polyline key={i} points={line.points.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={line.color} strokeWidth={1.2} opacity={0.85}/>
          ))}
          {data.candles.map((c, i) => (
            <g key={i}>
              <line x1={c.x} x2={c.x} y1={c.high} y2={c.low} stroke={c.bull ? '#10b981' : '#ef4444'} strokeWidth={1}/>
              <rect x={c.x - c.w / 2} y={Math.min(c.open, c.close)} width={c.w} height={Math.max(2, Math.abs(c.close - c.open))} fill={c.bull ? '#10b981' : '#ef4444'}/>
            </g>
          ))}
          <line x1={0} x2={1000} y1={172} y2={172} stroke="#94a3b8" strokeDasharray="3 4" strokeWidth={0.8}/>
          <rect x={952} y={162} width={48} height={20} fill="#0f172a" rx={3}/>
          <text x={976} y={176} fontSize={11} fill="white" textAnchor="middle" fontFamily="JetBrains Mono">244.44</text>
        </svg>
        <div className={`pointer-events-none absolute right-0 top-0 flex h-full w-12 flex-col justify-between py-2 pr-1 text-right font-mono text-[10px] ${dark ? 'text-white/40' : 'text-slate-400'}`}>
          <span>280.00</span><span>260.00</span><span>240.00</span><span>220.00</span><span>200.00</span><span>180.00</span>
        </div>
      </div>

      {/* Volume sub-panel */}
      <div className={`relative h-16 border-t ${dark ? 'border-white/[0.05]' : 'border-slate-200'}`}>
        <div className={`absolute left-2 top-1 flex items-center gap-2 text-[11px] ${dark ? 'text-white/65' : 'text-slate-600'}`}>
          <span className={dark ? 'text-white/40' : 'text-slate-400'}>VOL</span>
          <span className="text-emerald-600">volume:30.98M</span>
        </div>
        <svg viewBox="0 0 1000 64" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          {data.vol.map((v, i) => (
            <rect key={i} x={v.x - 3} y={64 - v.h} width={6} height={v.h}
              fill={v.bull ? 'rgba(16,185,129,0.55)' : 'rgba(239,68,68,0.55)'}/>
          ))}
        </svg>
      </div>

      <div className={`flex h-7 items-center justify-between border-t px-3 font-mono text-[10px] ${dark ? 'border-white/[0.05] text-white/40' : 'border-slate-200 text-slate-400'}`}>
        <span>02-12</span><span>03-27</span><span>05-09</span><span>06-24</span><span>08-09</span><span>09-18</span><span>10-30</span><span>12-12</span><span>01-28</span>
      </div>
    </div>
  );
}

function Grid({ width, height, rows, cols, dark }) {
  const lines = [];
  const stroke = dark ? 'rgba(255,255,255,0.05)' : '#f1f5f9';
  for (let r = 1; r < rows; r++) {
    const y = (height / rows) * r;
    lines.push(<line key={`r${r}`} x1={0} x2={width} y1={y} y2={y} stroke={stroke} strokeWidth={1}/>);
  }
  for (let c = 1; c < cols; c++) {
    const x = (width / cols) * c;
    lines.push(<line key={`c${c}`} x1={x} x2={x} y1={0} y2={height} stroke={stroke} strokeWidth={1}/>);
  }
  return <g>{lines}</g>;
}

function SignalOverlayA({ signals, active }) {
  if (!active || !signals || signals.length === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <svg viewBox="0 0 1000 480" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {signals.map((sig, i) => {
          const cx = sig.x * 1000;
          const cy = sig.y * 480;
          const isBuy = sig.type === 'buy';
          const color = isBuy ? '#10b981' : '#ef4444';
          const points = isBuy
            ? `${cx - 7},${cy + 12} ${cx + 7},${cy + 12} ${cx},${cy + 2}`
            : `${cx - 7},${cy - 12} ${cx + 7},${cy - 12} ${cx},${cy - 2}`;
          return (
            <g key={i} style={{ animation: `aimeclaw-pop 0.3s ease-out ${i * 0.08}s both` }}>
              <polygon points={points} fill={color} stroke="white" strokeWidth={1.5} style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.18))' }}/>
              <text x={cx} y={isBuy ? cy + 26 : cy - 18} textAnchor="middle" fontSize={9} fontWeight={700} fill={color} fontFamily="JetBrains Mono">
                {isBuy ? 'B' : 'S'}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function StrategyTesterDockA({ strategy, dark }) {
  const hasStrategy = !!strategy;
  const [collapsed, setCollapsed] = useStateAC(false);
  const open = hasStrategy && !collapsed;

  return (
    <div className={`shrink-0 border-t ${dark ? 'border-white/[0.05] bg-[#0d1014]' : 'border-slate-200/70 bg-white'}`}>
      {open && (
        <div
          className={`border-b ${dark ? 'border-white/[0.05] bg-[#0d1014]' : 'border-slate-200/60 bg-slate-50/70'}`}
          style={{ animation: 'aimeclaw-fade-up 0.22s ease-out' }}
        >
          <div className="flex items-center gap-2 px-4 py-2 text-[11px] uppercase tracking-wider">
            <span className={dark ? 'text-white/40' : 'text-slate-400'}>Backtest summary</span>
            <span className={`rounded px-1.5 py-px text-[10px] font-bold normal-case tracking-normal ${dark ? 'bg-white/10 text-white/75' : 'bg-slate-200 text-slate-600'}`}>{strategy.name}</span>
          </div>
          <div className="grid grid-cols-5 gap-3 px-4 pb-3">
            <TesterMetric label="Total P&L" value={window.formatPct(strategy.metrics.totalPnLPct, { sign: true })} tone="pos" dark={dark} />
            <TesterMetric label="Win rate" value={`${strategy.metrics.winRatePct}%`} dark={dark} />
            <TesterMetric label="Max DD" value={window.formatPct(strategy.metrics.maxDDPct)} tone="neg" dark={dark} />
            <TesterMetric label="Profit factor" value={strategy.metrics.profitFactor.toFixed(2)} dark={dark} />
            <TesterMetric label="Trades" value={String(strategy.metrics.totalTrades)} dark={dark} />
          </div>
        </div>
      )}
      <button
        onClick={() => hasStrategy && setCollapsed(!collapsed)}
        disabled={!hasStrategy}
        className={`flex h-10 w-full items-center gap-2 px-3 text-[11.5px] font-semibold ${dark ? 'text-white/85 hover:bg-white/5 disabled:text-white/30' : 'text-slate-700 hover:bg-slate-50 disabled:text-slate-400'} ${hasStrategy ? '' : 'cursor-default'}`}
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 opacity-80" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h4l3-8 4 16 3-8h4"/></svg>
        Strategy Tester
        {hasStrategy ? (
          <svg viewBox="0 0 24 24" className={`ml-auto h-3 w-3 transition-transform ${open ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M6 15l6-6 6 6"/></svg>
        ) : (
          <span className={`ml-2 font-normal ${dark ? 'text-white/35' : 'text-slate-400'}`}>Pick a strategy to view backtest</span>
        )}
      </button>
    </div>
  );
}

function TesterMetric({ label, value, tone, dark }) {
  const color = tone === 'pos' ? 'text-emerald-600' : tone === 'neg' ? 'text-rose-600' : (dark ? 'text-white/85' : 'text-slate-900');
  return (
    <div>
      <div className={`text-[10px] uppercase tracking-wide ${dark ? 'text-white/40' : 'text-slate-400'}`}>{label}</div>
      <div className={`mt-0.5 font-mono text-[15px] font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

function ComingSoonPage({ label, dark }) {
  return (
    <div className={`flex h-full min-w-0 flex-1 items-center justify-center ${dark ? 'bg-[#0b0d12]' : 'bg-slate-50/50'}`}>
      <div className={`rounded-2xl border px-8 py-6 text-center ${dark ? 'border-white/[0.06] bg-white/[0.03]' : 'border-slate-200 bg-white shadow-sm'}`}>
        <div className={`text-[10px] font-bold uppercase tracking-[0.18em] ${dark ? 'text-white/40' : 'text-slate-400'}`}>{label}</div>
        <div className={`mt-2 text-[18px] font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>Coming soon</div>
        <div className={`mt-1 text-[12px] ${dark ? 'text-white/55' : 'text-slate-500'}`}>This surface is part of the AInvest demo shell, not in scope today.</div>
      </div>
    </div>
  );
}

Object.assign(window, { AIChartsPage, ComingSoonPage });
