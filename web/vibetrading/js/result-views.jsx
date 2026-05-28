// Result views — rendered inside DetailPage's Backtest tab depending on resultType.
// PortfolioView (screen/factor), TradeView (pine), StudyView (event).
// Factor Pro: G1–G10 chart + IC/ICIR cards rendered inline in PortfolioView.

const { useState: useStateRV, useMemo: useMemoRV } = React;

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers.
// ─────────────────────────────────────────────────────────────────────────────
function deriveBenchmarkCurve(strategyCurve, dampen = 0.55) {
  // Mock benchmark — same shape, lower amplitude.
  return strategyCurve.map((v, i) => v * dampen + (i / strategyCurve.length) * 4);
}

function generateMockHoldings(strategy, n) {
  const isCrypto = strategy.market === 'Crypto';
  const sym = strategy.symbol || 'BTC';
  const pool = isCrypto
    ? ['BTC', 'ETH', 'SOL', 'BNB', 'AVAX', 'LINK', 'DOT', 'MATIC', 'NEAR', 'ATOM']
    : strategy.universe?.label === 'Nasdaq 100' || strategy.universe?.label === 'QQQ 100'
      ? ['NVDA', 'MSFT', 'AAPL', 'AVGO', 'AMD', 'TSLA', 'META', 'NFLX', 'COST', 'AMZN', 'GOOG', 'PEP']
      : ['AAPL', 'MSFT', 'JPM', 'WMT', 'V', 'XOM', 'JNJ', 'PG', 'UNH', 'KO', 'PFE', 'BAC', 'CVX', 'CAT', 'MRK'];
  const out = [];
  const targetN = Math.min(n || 10, pool.length);
  for (let i = 0; i < targetN; i++) {
    const seed = i * 11 + (sym.charCodeAt(0) || 65);
    const pct = (((seed * 37) % 1000) / 100 + 0.5);
    const ret = (((seed * 47) % 700) / 100) - 2.4;
    out.push({
      symbol: pool[i],
      weight: pct,
      mktValue: 1000 + (seed * 12) % 5400,
      pnl: ret,
      side: 'long',
    });
  }
  // Normalize weights to 100%
  const total = out.reduce((s, h) => s + h.weight, 0);
  for (const h of out) h.weight = (h.weight / total) * 100;
  return out;
}

function generateMockTrades(strategy, n) {
  const sym = strategy.symbol || 'BTC';
  const out = [];
  for (let i = 0; i < (n || 20); i++) {
    const seed = i * 13 + (sym.charCodeAt(0) || 65);
    const pnlPct = (((seed * 53) % 1200) / 100) - 5.0;
    const duration = (seed * 7) % 18 + 2;
    out.push({
      idx: i + 1,
      entry: 2025 - Math.floor(seed / 50) + '-' + String((seed % 12) + 1).padStart(2, '0') + '-' + String(((seed * 3) % 28) + 1).padStart(2, '0'),
      exit: 2025 - Math.floor(seed / 50) + '-' + String((seed % 12) + 1).padStart(2, '0') + '-' + String(((seed * 3 + duration) % 28) + 1).padStart(2, '0'),
      duration,
      pnlPct,
    });
  }
  return out.sort((a, b) => a.idx - b.idx);
}

// ─────────────────────────────────────────────────────────────────────────────
// PortfolioView (Screen + Factor results).
// ─────────────────────────────────────────────────────────────────────────────
function PortfolioView({ strategy, dark, showFactor, showGroups }) {
  const [showBench, setShowBench] = useStateRV(true);
  const isFactor = strategy.engine === 'factor';
  const holdings = useMemoRV(() => generateMockHoldings(strategy, strategy.screenMeta?.topN || (isFactor ? 12 : 10)), [strategy]);
  const benchCurve = useMemoRV(() => deriveBenchmarkCurve(strategy.curve), [strategy.curve]);
  const turnover = isFactor ? 4.2 : (strategy.screenMeta?.rebalance === 'monthly' ? 1.8 : strategy.screenMeta?.rebalance === 'weekly' ? 4.8 : 0.7);

  return (
    <div className="space-y-4">
      {/* Equity curve + drawdown */}
      <div className={`rounded-xl p-4 ${dark ? 'bg-white/[0.03] border border-white/[0.06]' : 'border border-slate-200/70 bg-white'}`}>
        <div className="mb-2 flex items-center justify-between">
          <div className={`text-[11.5px] font-bold uppercase tracking-wider ${dark ? 'text-white/55' : 'text-slate-500'}`}>Equity curve</div>
          <label className={`inline-flex items-center gap-1.5 text-[11.5px] ${dark ? 'text-white/65' : 'text-slate-600'}`}>
            <input type="checkbox" checked={showBench} onChange={(e) => setShowBench(e.target.checked)} />
            叠加基准
          </label>
        </div>
        <EquityCompareChart strategyCurve={strategy.curve} benchmarkCurve={showBench ? benchCurve : null} dark={dark} />
        <DrawdownStrip curve={strategy.curve} dark={dark} />
      </div>

      {/* Group analysis — multi-line G1-G10 + bars + monotonicity. Shown for any
          cross-section strategy (Screen.cross-section + Factor). Factor adds
          the IC/ICIR diagnostics section below. */}
      {showGroups && (
        <GroupAnalysisSection strategy={strategy} dark={dark} />
      )}

      {/* Factor signal-strength diagnostics */}
      {isFactor && showFactor && strategy.factorMeta && (
        <FactorSection meta={strategy.factorMeta} dark={dark} />
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        {/* Holdings table */}
        <div className={`rounded-xl p-4 ${dark ? 'bg-white/[0.03] border border-white/[0.06]' : 'border border-slate-200/70 bg-white'}`}>
          <div className="mb-2 flex items-center justify-between">
            <div className={`text-[11.5px] font-bold uppercase tracking-wider ${dark ? 'text-white/55' : 'text-slate-500'}`}>当前持仓</div>
            <div className={`text-[10.5px] ${dark ? 'text-white/40' : 'text-slate-400'}`}>{holdings.length} 只</div>
          </div>
          <div className="overflow-hidden rounded-md">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className={dark ? 'text-white/45' : 'text-slate-500'}>
                  <th className="px-2 py-1.5 text-left font-medium">Symbol</th>
                  <th className="px-2 py-1.5 text-right font-medium">Weight</th>
                  <th className="px-2 py-1.5 text-right font-medium">Mkt value</th>
                  <th className="px-2 py-1.5 text-right font-medium">未实现 PnL</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h, i) => (
                  <tr key={h.symbol} className={`border-t font-mono tabular-nums ${dark ? 'border-white/[0.05] text-white/85' : 'border-slate-100 text-slate-800'}`}>
                    <td className="px-2 py-1.5 font-sans"><b>{h.symbol}</b></td>
                    <td className="px-2 py-1.5 text-right">{h.weight.toFixed(1)}%</td>
                    <td className="px-2 py-1.5 text-right">${h.mktValue.toLocaleString()}</td>
                    <td className={`px-2 py-1.5 text-right ${h.pnl >= 0 ? (dark ? 'text-emerald-300' : 'text-emerald-700') : (dark ? 'text-rose-300' : 'text-rose-700')}`}>
                      {window.formatPct(h.pnl, { sign: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rebalance + turnover */}
        <div className="space-y-3">
          <div className={`rounded-xl p-4 ${dark ? 'bg-white/[0.03] border border-white/[0.06]' : 'border border-slate-200/70 bg-white'}`}>
            <div className={`mb-2 text-[11.5px] font-bold uppercase tracking-wider ${dark ? 'text-white/55' : 'text-slate-500'}`}>Turnover</div>
            <div className={`font-mono text-[24px] font-bold tabular-nums ${dark ? 'text-white' : 'text-slate-900'}`}>{turnover.toFixed(1)}×</div>
            <div className={`mt-0.5 text-[11px] ${dark ? 'text-white/45' : 'text-slate-400'}`}>每年换手次数（双边）</div>
          </div>
          <div className={`rounded-xl p-4 ${dark ? 'bg-white/[0.03] border border-white/[0.06]' : 'border border-slate-200/70 bg-white'}`}>
            <div className={`mb-2 text-[11.5px] font-bold uppercase tracking-wider ${dark ? 'text-white/55' : 'text-slate-500'}`}>调仓日历</div>
            <RebalanceCalendar rebalance={isFactor ? 'monthly' : (strategy.screenMeta?.rebalance || 'monthly')} dark={dark} />
            <div className={`mt-2 text-[11px] ${dark ? 'text-white/45' : 'text-slate-400'}`}>每个圆点 = 一个调仓日，hover 查看入选 / 移除</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EquityCompareChart — strategy vs (optional) benchmark, axes shown.
// ─────────────────────────────────────────────────────────────────────────────
function EquityCompareChart({ strategyCurve, benchmarkCurve, dark }) {
  const width = 800, height = 220;
  const pad = { top: 10, right: 8, bottom: 22, left: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const allVals = strategyCurve.concat(benchmarkCurve || []);
  const minV = Math.min(0, Math.min(...allVals));
  const maxV = Math.max(...allVals);
  const span = maxV - minV || 1;
  const n = strategyCurve.length;
  const stepX = innerW / Math.max(1, n - 1);

  const buildLine = (curve) => curve.map((v, i) => {
    const x = pad.left + i * stepX;
    const y = pad.top + innerH - ((v - minV) / span) * innerH;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const stratPath = buildLine(strategyCurve);
  const benchPath = benchmarkCurve ? buildLine(benchmarkCurve) : null;

  // Y-axis ticks every 25 percentage points (approx)
  const yTicks = [];
  const tickStep = Math.max(5, Math.round((span / 4) / 5) * 5);
  for (let v = Math.ceil(minV / tickStep) * tickStep; v <= maxV; v += tickStep) {
    const y = pad.top + innerH - ((v - minV) / span) * innerH;
    yTicks.push({ v, y });
  }
  const xLabels = ['Q1', 'Q2', 'Q3', 'Q4'].map((m, i) => ({ m, x: pad.left + (innerW * (i + 0.5)) / 4 }));

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="block">
      <defs>
        <linearGradient id="rv-eq-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
        </linearGradient>
      </defs>
      {yTicks.map((t) => (
        <g key={t.v}>
          <line x1={pad.left} y1={t.y} x2={pad.left + innerW} y2={t.y} stroke="currentColor" strokeOpacity={dark ? 0.10 : 0.06} />
          <text x={pad.left - 4} y={t.y + 3} textAnchor="end" fontSize="9.5" className={dark ? 'fill-white/45' : 'fill-slate-500'}>{t.v >= 0 ? '+' : ''}{t.v}%</text>
        </g>
      ))}
      <path d={`${stratPath} L${pad.left + innerW},${pad.top + innerH} L${pad.left},${pad.top + innerH} Z`} fill="url(#rv-eq-fill)" />
      {benchPath && <path d={benchPath} stroke="#94a3b8" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />}
      <path d={stratPath} stroke="#0ea5e9" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {xLabels.map((l) => (
        <text key={l.m} x={l.x} y={height - 6} textAnchor="middle" fontSize="10" className={dark ? 'fill-white/45' : 'fill-slate-500'}>{l.m}</text>
      ))}
      <g transform={`translate(${pad.left + innerW - 130}, ${pad.top + 6})`}>
        <rect width="124" height="38" rx="6" fill={dark ? '#0d1014' : '#ffffff'} stroke={dark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'} />
        <circle cx="10" cy="14" r="3.5" fill="#0ea5e9" />
        <text x="20" y="17" fontSize="10" className={dark ? 'fill-white/85' : 'fill-slate-700'}>Strategy</text>
        {benchPath && <>
          <circle cx="10" cy="28" r="3.5" fill="#94a3b8" />
          <text x="20" y="31" fontSize="10" className={dark ? 'fill-white/65' : 'fill-slate-500'}>Benchmark</text>
        </>}
      </g>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DrawdownStrip — small under-curve drawdown panel.
// ─────────────────────────────────────────────────────────────────────────────
function DrawdownStrip({ curve, dark }) {
  const dd = useMemoRV(() => {
    let peak = curve[0];
    return curve.map((v) => { peak = Math.max(peak, v); return v - peak; });
  }, [curve]);
  const width = 800, height = 50;
  const minV = Math.min(...dd, -1);
  const stepX = width / Math.max(1, dd.length - 1);
  const path = dd.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * stepX).toFixed(1)},${(height - (v / minV) * height).toFixed(1)}`).join(' ');
  return (
    <div className={`mt-2 rounded-md p-1.5 ${dark ? 'bg-white/[0.02]' : 'bg-slate-50/60'}`}>
      <div className={`mb-0.5 flex items-center justify-between text-[10px] ${dark ? 'text-white/40' : 'text-slate-400'}`}>
        <span>回撤 (drawdown)</span>
        <span>Max DD: {minV.toFixed(1)}%</span>
      </div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="block">
        <path d={`${path} L${width},${height} L0,${height} Z`} fill={dark ? 'rgba(244,63,94,0.20)' : 'rgba(244,63,94,0.12)'} />
        <path d={path} stroke={dark ? '#fb7185' : '#e11d48'} strokeWidth="1.5" fill="none" />
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RebalanceCalendar — simple grid of rebalance dates.
// ─────────────────────────────────────────────────────────────────────────────
function RebalanceCalendar({ rebalance, dark }) {
  const count = rebalance === 'daily' ? 60 : rebalance === 'weekly' ? 26 : rebalance === 'monthly' ? 12 : 4;
  const dots = Array.from({ length: count });
  return (
    <div className="flex flex-wrap gap-1">
      {dots.map((_, i) => (
        <span key={i} title={`Rebalance #${i + 1}`} className={`h-2.5 w-2.5 rounded-full ${dark ? 'bg-sky-400/60 hover:bg-sky-400' : 'bg-sky-500/40 hover:bg-sky-500'}`} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FactorSection — G1-G10 chart + 4 signal cards (IC / ICIR / L-S Sharpe / Mono).
// ─────────────────────────────────────────────────────────────────────────────
function FactorSection({ meta, dark }) {
  const cards = [
    { key: 'ic',    label: 'Signal Strength', value: meta.ic.toFixed(3), tip: 'IC（Information Coefficient） · 信号与未来收益的截面相关度，越大越有效。', subLabel: 'IC' },
    { key: 'icir', label: 'Signal Stability', value: (meta.icir || 0).toFixed(2), tip: 'ICIR · IC 的稳定性。> 1 表示信号每个月都能稳定起作用。', subLabel: 'ICIR' },
    { key: 'ls',    label: 'L-S Sharpe',      value: (meta.lsSharpe || 0).toFixed(2), tip: 'Long-Short Sharpe · 做多 G1 + 做空 G10 的多空组合夏普。', subLabel: 'Sharpe' },
    { key: 'mono',  label: 'Monotonicity',    value: Math.round((meta.monotonicity || 0) * 100) + '%', tip: '分组单调性 · G1→G10 收益排序与信号排序的一致度，越高越好。', subLabel: 'Mono' },
  ];

  return (
    <div className={`rounded-xl p-4 ${dark ? 'bg-amber-500/8 border border-amber-400/22' : 'border border-amber-200 bg-amber-50/40'}`}>
      <div className={`mb-3 flex items-center gap-2`}>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider ${dark ? 'bg-amber-500/20 text-amber-200' : 'bg-amber-100 text-amber-700'}`}>
          <span>∑</span>
          Factor diagnostics · Pro
        </span>
        <div className={`text-[11.5px] ${dark ? 'text-amber-200/70' : 'text-amber-800/80'}`}>信号有效性诊断 — IC（强度） + ICIR（稳定性） + L-S Sharpe + 单调性</div>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {cards.map((c) => (
          <SignalCard key={c.key} {...c} dark={dark} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GroupAnalysisSection — multi-line G1-G10 equity curves + group annualized
// returns bars + monotonicity badge. Used by Screen (cross-section) AND Factor.
// Generates mock group curves deterministically from strategy.id when factorMeta
// isn't available; Factor strategies reuse their stored groupReturns directly.
// ─────────────────────────────────────────────────────────────────────────────
function GroupAnalysisSection({ strategy, dark }) {
  const seed = useMemoRV(() => {
    const id = strategy.id || 'x';
    let s = 0;
    for (let i = 0; i < id.length; i++) s = (s * 31 + id.charCodeAt(i)) % 99991;
    return s;
  }, [strategy.id]);

  const { groupReturns, groupCount } = useMemoRV(() => {
    if (strategy.factorMeta && Array.isArray(strategy.factorMeta.groupReturns)) {
      return { groupReturns: strategy.factorMeta.groupReturns, groupCount: strategy.factorMeta.groupCount || 10 };
    }
    // Derive mock cross-section group returns for Screen — monotonically
    // decreasing G1→G10 with small noise so the chart still looks realistic.
    const n = 10;
    const top = 12 + (seed % 8);
    const bottom = -4 - (seed % 5);
    const out = [];
    for (let i = 0; i < n; i++) {
      const lerp = top - (top - bottom) * (i / (n - 1));
      const jitter = ((seed * (i + 1)) % 7 - 3) * 0.35;
      out.push(+(lerp + jitter).toFixed(2));
    }
    return { groupReturns: out, groupCount: n };
  }, [strategy.factorMeta, seed]);

  // Monotonicity: count adjacent pairs that respect the G1→Gn descending order.
  const monotonicity = useMemoRV(() => {
    if (strategy.factorMeta && typeof strategy.factorMeta.monotonicity === 'number') {
      return strategy.factorMeta.monotonicity;
    }
    let respect = 0;
    for (let i = 0; i < groupReturns.length - 1; i++) {
      if (groupReturns[i] >= groupReturns[i + 1]) respect++;
    }
    return respect / Math.max(1, groupReturns.length - 1);
  }, [strategy.factorMeta, groupReturns]);

  // Mock equity curves per group — base curve is strategy.curve; G1 closer to it,
  // later groups drift toward zero or negative.
  const curves = useMemoRV(() => {
    const base = strategy.curve || [];
    const n = groupCount;
    return groupReturns.map((annual, gi) => {
      // amplitude scaled by group's return vs G1
      const scale = (annual - groupReturns[n - 1]) / Math.max(0.001, groupReturns[0] - groupReturns[n - 1]);
      const drift = annual / 100 * 0.04;
      let v = 0;
      let r = (seed + gi * 19) | 0;
      const out = [];
      for (let i = 0; i < base.length; i++) {
        r = (r * 9301 + 49297) % 233280;
        const noise = (r / 233280 - 0.5) * 0.4;
        v += drift + noise * (0.5 + scale * 0.5);
        out.push(v);
      }
      return out;
    });
  }, [strategy.curve, groupReturns, groupCount, seed]);

  const mono = monotonicity;
  const monoLabel = mono >= 0.85 ? '严格递减' : mono >= 0.65 ? '基本递减' : '不显著';
  const monoColor = mono >= 0.85
    ? (dark ? 'bg-emerald-500/18 text-emerald-200' : 'bg-emerald-50 text-emerald-700')
    : mono >= 0.65
    ? (dark ? 'bg-amber-500/15 text-amber-200' : 'bg-amber-50 text-amber-700')
    : (dark ? 'bg-rose-500/15 text-rose-200' : 'bg-rose-50 text-rose-700');

  return (
    <div className={`rounded-xl p-4 ${dark ? 'bg-white/[0.03] border border-white/[0.06]' : 'border border-slate-200/70 bg-white'}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <div className={`text-[11.5px] font-bold uppercase tracking-wider ${dark ? 'text-white/55' : 'text-slate-500'}`}>分组分析 · G1 → G{groupCount}</div>
          <div className={`mt-0.5 text-[11.5px] ${dark ? 'text-white/55' : 'text-slate-500'}`}>把池子按信号强度切成 {groupCount} 组 — G1 信号最强、G{groupCount} 最弱。若净值曲线和年化收益从 G1 到 G{groupCount} 单调下降，说明信号在样本里有效。</div>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-bold ${monoColor}`}>
            <span>单调性 {(mono * 100).toFixed(0)}%</span>
            <span className={`text-[10.5px] font-medium ${dark ? 'opacity-75' : 'opacity-90'}`}>· {monoLabel}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        <GroupCurvesChart curves={curves} count={groupCount} dark={dark} />
        <GroupReturnsChart groups={groupReturns} dark={dark} compact />
      </div>
    </div>
  );
}

function GroupCurvesChart({ curves, count, dark }) {
  if (!curves.length) return null;
  const width = 540, height = 220;
  const pad = { top: 12, right: 60, bottom: 22, left: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const all = [].concat(...curves);
  const minV = Math.min(...all, 0);
  const maxV = Math.max(...all);
  const span = (maxV - minV) || 1;
  const n = curves[0].length;
  const stepX = innerW / Math.max(1, n - 1);

  const buildPath = (curve) => curve.map((v, i) => {
    const x = pad.left + i * stepX;
    const y = pad.top + innerH - ((v - minV) / span) * innerH;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  // Color: G1 emerald (thick), G2-G(n-1) muted slate, Gn rose (dashed)
  const colorFor = (gi) => {
    if (gi === 0) return '#10b981';
    if (gi === count - 1) return '#f43f5e';
    if (gi <= 2) return dark ? '#7dd3fc' : '#0ea5e9';
    if (gi >= count - 3) return dark ? '#fda4af' : '#fb7185';
    return dark ? '#64748b' : '#94a3b8';
  };
  const widthFor = (gi) => (gi === 0 ? 2.4 : gi === count - 1 ? 1.6 : 1.1);
  const dashFor = (gi) => (gi === count - 1 ? '4 3' : '');
  const opacityFor = (gi) => (gi === 0 || gi === count - 1 ? 0.95 : gi <= 2 || gi >= count - 3 ? 0.75 : 0.45);

  const yTicks = [minV, (minV + maxV) / 2, maxV];

  return (
    <div className={`rounded-md p-3 ${dark ? 'bg-white/[0.02]' : 'bg-slate-50/60'}`}>
      <div className={`mb-1 text-[10.5px] font-bold uppercase tracking-wider ${dark ? 'text-white/55' : 'text-slate-500'}`}>分组净值（G1 = 信号最强组，G{count} = 信号最弱组）</div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="block">
        {yTicks.map((v, i) => {
          const y = pad.top + innerH - ((v - minV) / span) * innerH;
          return (
            <g key={i}>
              <line x1={pad.left} y1={y} x2={pad.left + innerW} y2={y} stroke="currentColor" strokeOpacity={dark ? 0.10 : 0.06} />
              <text x={pad.left - 4} y={y + 3} textAnchor="end" fontSize="9.5" className={dark ? 'fill-white/45' : 'fill-slate-500'}>{v >= 0 ? '+' : ''}{v.toFixed(0)}%</text>
            </g>
          );
        })}
        {curves.map((curve, gi) => (
          <path key={gi} d={buildPath(curve)} stroke={colorFor(gi)} strokeWidth={widthFor(gi)} strokeDasharray={dashFor(gi)} opacity={opacityFor(gi)} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {/* End-of-curve labels for G1 and Gn */}
        {[0, count - 1].map((gi) => {
          const last = curves[gi][curves[gi].length - 1];
          const y = pad.top + innerH - ((last - minV) / span) * innerH;
          return (
            <g key={'lbl' + gi}>
              <circle cx={pad.left + innerW} cy={y} r="3" fill={colorFor(gi)} />
              <text x={pad.left + innerW + 5} y={y + 3} fontSize="10" className={dark ? 'fill-white/70' : 'fill-slate-700'} fontWeight="600">G{gi + 1}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function GroupReturnsChart({ groups, dark, compact }) {
  const n = groups.length;
  if (n === 0) return null;
  const max = Math.max(...groups.map((g) => Math.abs(g)));
  const width = compact ? 320 : 460, height = compact ? 180 : 200;
  const pad = { top: 16, right: 8, bottom: 28, left: 30 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const barW = innerW / n - 4;
  const zeroY = pad.top + innerH / 2;

  return (
    <div className={`rounded-md p-3 ${dark ? 'bg-white/[0.03]' : 'bg-slate-50/60'}`}>
      <div className={`mb-1 text-[10.5px] font-bold uppercase tracking-wider ${dark ? 'text-white/55' : 'text-slate-500'}`}>G1 → G{n} · 分组年化收益</div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="block">
        <line x1={pad.left} y1={zeroY} x2={pad.left + innerW} y2={zeroY} stroke="currentColor" strokeOpacity={dark ? 0.18 : 0.20} />
        <text x={pad.left - 4} y={zeroY + 3} textAnchor="end" fontSize="9.5" className={dark ? 'fill-white/45' : 'fill-slate-500'}>0%</text>
        <text x={pad.left - 4} y={pad.top + 6} textAnchor="end" fontSize="9.5" className={dark ? 'fill-emerald-300' : 'fill-emerald-700'}>+{max.toFixed(0)}%</text>
        <text x={pad.left - 4} y={pad.top + innerH + 2} textAnchor="end" fontSize="9.5" className={dark ? 'fill-rose-300' : 'fill-rose-700'}>-{max.toFixed(0)}%</text>
        {groups.map((g, i) => {
          const x = pad.left + (innerW / n) * i + 2;
          const h = Math.abs((g / max) * (innerH / 2));
          const y = g >= 0 ? zeroY - h : zeroY;
          const fillColor = i < 3 ? '#10b981' : i >= n - 3 ? '#f43f5e' : (dark ? '#cbd5e1' : '#94a3b8');
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={h} fill={fillColor} opacity={i < 3 || i >= n - 3 ? 0.95 : 0.55} rx="2" />
              <text x={x + barW / 2} y={height - 12} textAnchor="middle" fontSize="9.5" className={dark ? 'fill-white/55' : 'fill-slate-500'}>G{i + 1}</text>
              <text x={x + barW / 2} y={g >= 0 ? y - 4 : y + h + 10} textAnchor="middle" fontSize="9" className={dark ? 'fill-white/80' : 'fill-slate-700'}>{g.toFixed(1)}</text>
            </g>
          );
        })}
      </svg>
      {!compact && (
        <div className={`mt-1 text-[10.5px] leading-snug ${dark ? 'text-white/55' : 'text-slate-500'}`}>
          <b>G1</b> = 信号最强的 10%（做多）· <b>G{n}</b> = 信号最弱的 10%（做空）。柱子的 G1→G{n} 单调下降越明显，信号越有效。
        </div>
      )}
    </div>
  );
}

function SignalCard({ label, value, tip, subLabel, dark }) {
  const [hovered, setHovered] = useStateRV(false);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} className={`relative rounded-md p-2.5 ${dark ? 'bg-white/[0.04]' : 'bg-white'}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className={`text-[10.5px] font-bold uppercase tracking-wider ${dark ? 'text-amber-200' : 'text-amber-700'}`}>{label}</div>
          <div className={`mt-0.5 font-mono text-[18px] font-bold tabular-nums ${dark ? 'text-white' : 'text-slate-900'}`}>{value}</div>
        </div>
        <span className={`rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider ${dark ? 'bg-amber-500/20 text-amber-200' : 'bg-amber-100 text-amber-700'}`}>{subLabel}</span>
      </div>
      {hovered && (
        <div className={`absolute right-0 top-full z-20 mt-1 w-[240px] rounded-md border p-2.5 text-[11px] leading-relaxed shadow-lg ${dark ? 'border-white/[0.10] bg-[#0d1014] text-white/80' : 'border-slate-200 bg-white text-slate-700'}`}>
          {tip}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TradeView (Pine results) — basic version. Expanded in task #45.
// ─────────────────────────────────────────────────────────────────────────────
function TradeView({ strategy, dark }) {
  const trades = useMemoRV(() => generateMockTrades(strategy, 20), [strategy]);
  const benchCurve = useMemoRV(() => deriveBenchmarkCurve(strategy.curve), [strategy.curve]);
  const wins = trades.filter((t) => t.pnlPct >= 0).length;
  const losses = trades.length - wins;
  const winSum = trades.filter((t) => t.pnlPct >= 0).reduce((s, t) => s + t.pnlPct, 0);
  const lossSum = -trades.filter((t) => t.pnlPct < 0).reduce((s, t) => s + t.pnlPct, 0);
  const profitFactor = lossSum > 0 ? winSum / lossSum : 0;

  return (
    <div className="space-y-4">
      <div className={`rounded-xl p-4 ${dark ? 'bg-white/[0.03] border border-white/[0.06]' : 'border border-slate-200/70 bg-white'}`}>
        <div className={`mb-2 text-[11.5px] font-bold uppercase tracking-wider ${dark ? 'text-white/55' : 'text-slate-500'}`}>Equity curve · 单标的</div>
        <EquityCompareChart strategyCurve={strategy.curve} benchmarkCurve={benchCurve} dark={dark} />
        <DrawdownStrip curve={strategy.curve} dark={dark} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        <div className={`rounded-xl p-4 ${dark ? 'bg-white/[0.03] border border-white/[0.06]' : 'border border-slate-200/70 bg-white'}`}>
          <div className={`mb-2 text-[11.5px] font-bold uppercase tracking-wider ${dark ? 'text-white/55' : 'text-slate-500'}`}>单笔 PnL 分布</div>
          <TradePnLHistogram trades={trades} dark={dark} />
        </div>
        <div className={`rounded-xl p-4 ${dark ? 'bg-white/[0.03] border border-white/[0.06]' : 'border border-slate-200/70 bg-white'}`}>
          <div className={`mb-3 text-[11.5px] font-bold uppercase tracking-wider ${dark ? 'text-white/55' : 'text-slate-500'}`}>胜负摘要</div>
          <div className="space-y-2">
            <div className={`rounded-md p-2 ${dark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
              <div className={`text-[10px] font-bold uppercase ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}>盈利 · {wins} 笔</div>
              <div className={`font-mono text-[14px] font-bold tabular-nums ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}>+{winSum.toFixed(2)}%</div>
            </div>
            <div className={`rounded-md p-2 ${dark ? 'bg-rose-500/12' : 'bg-rose-50'}`}>
              <div className={`text-[10px] font-bold uppercase ${dark ? 'text-rose-300' : 'text-rose-700'}`}>亏损 · {losses} 笔</div>
              <div className={`font-mono text-[14px] font-bold tabular-nums ${dark ? 'text-rose-300' : 'text-rose-700'}`}>-{lossSum.toFixed(2)}%</div>
            </div>
            <div className={`rounded-md p-2 ${dark ? 'bg-white/[0.04]' : 'bg-slate-50'}`}>
              <div className={`text-[10px] font-bold uppercase tracking-wide ${dark ? 'text-white/55' : 'text-slate-500'}`}>盈亏比 PF</div>
              <div className={`font-mono text-[14px] font-bold tabular-nums ${dark ? 'text-white' : 'text-slate-900'}`}>{profitFactor.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className={`rounded-xl p-4 ${dark ? 'bg-white/[0.03] border border-white/[0.06]' : 'border border-slate-200/70 bg-white'}`}>
        <div className="mb-2 flex items-center justify-between">
          <div className={`text-[11.5px] font-bold uppercase tracking-wider ${dark ? 'text-white/55' : 'text-slate-500'}`}>每笔交易 · {trades.length} 笔</div>
          <div className={`text-[10.5px] ${dark ? 'text-white/40' : 'text-slate-400'}`}>按时间正序</div>
        </div>
        <div className="max-h-[420px] overflow-y-auto rounded-md">
          <table className="w-full text-[12.5px]">
            <thead className={`sticky top-0 ${dark ? 'bg-[#0d1014]' : 'bg-white'}`}>
              <tr className={dark ? 'text-white/45' : 'text-slate-500'}>
                <th className="px-2 py-1.5 text-left font-medium">#</th>
                <th className="px-2 py-1.5 text-left font-medium">Entry</th>
                <th className="px-2 py-1.5 text-left font-medium">Exit</th>
                <th className="px-2 py-1.5 text-right font-medium">Bars</th>
                <th className="px-2 py-1.5 text-right font-medium">PnL %</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => (
                <tr key={t.idx} className={`border-t font-mono tabular-nums ${dark ? 'border-white/[0.04] text-white/85' : 'border-slate-100 text-slate-800'}`}>
                  <td className="px-2 py-1.5">{t.idx}</td>
                  <td className="px-2 py-1.5">{t.entry}</td>
                  <td className="px-2 py-1.5">{t.exit}</td>
                  <td className="px-2 py-1.5 text-right">{t.duration}</td>
                  <td className={`px-2 py-1.5 text-right ${t.pnlPct >= 0 ? (dark ? 'text-emerald-300' : 'text-emerald-700') : (dark ? 'text-rose-300' : 'text-rose-700')}`}>
                    {window.formatPct(t.pnlPct, { sign: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StudyView (Event results) — basic version. EventAxisReplay added in #45.
// ─────────────────────────────────────────────────────────────────────────────
function StudyView({ strategy, dark }) {
  const meta = strategy.eventMeta || {};
  const windows = meta.windows || [];
  const credibility = meta.credibility || 0;
  const credColor = credibility >= 80
    ? (dark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-700')
    : credibility >= 60
    ? (dark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-50 text-amber-700')
    : (dark ? 'bg-rose-500/15 text-rose-300' : 'bg-rose-50 text-rose-700');

  return (
    <div className="space-y-4">
      <div className={`rounded-xl p-4 ${dark ? 'bg-white/[0.03] border border-white/[0.06]' : 'border border-slate-200/70 bg-white'}`}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className={`text-[11.5px] font-bold uppercase tracking-wider ${dark ? 'text-cyan-300' : 'text-cyan-700'}`}>事件研究 · {meta.event}</div>
            <div className={`mt-0.5 text-[12.5px] ${dark ? 'text-white/70' : 'text-slate-600'}`}>样本 {meta.sampleSize || 0} 个 · 调整方式：{({ raw: '原始', minus_benchmark: '减去基准', minus_sector: '减去同行业' })[meta.adjustment] || '—'}</div>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold ${credColor}`}>
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4"><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></svg>
            样本可信度 {credibility}
          </span>
        </div>

        <EventMainChart strategy={strategy} dark={dark} />
      </div>

      <div className={`rounded-xl p-4 ${dark ? 'bg-white/[0.03] border border-white/[0.06]' : 'border border-slate-200/70 bg-white'}`}>
        <div className={`mb-2 text-[11.5px] font-bold uppercase tracking-wider ${dark ? 'text-white/55' : 'text-slate-500'}`}>事件后窗口收益分布</div>
        <WindowReturnsBars windows={windows} avgReturns={meta.avgForwardReturn || {}} dark={dark} />
      </div>

      <WindowAnalysisPanel strategy={strategy} dark={dark} />

      <EventAxisReplay strategy={strategy} dark={dark} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WindowAnalysisPanel — 专项分析：avg forward return curve with 95% CI band
// + per-window significance table (t-stat / sample / % positive).
// ─────────────────────────────────────────────────────────────────────────────
function WindowAnalysisPanel({ strategy, dark }) {
  const meta = strategy.eventMeta || {};
  const windows = meta.windows || ['T+1', 'T+5', 'T+10', 'T+20'];
  const sampleSize = meta.sampleSize || 200;

  // Per-window stats: avg, std err (mock = scaled by 1/sqrt(N) * sqrt(window days)),
  // t-stat = avg / stderr, ci95 = ±1.96 * stderr.
  const stats = useMemoRV(() => {
    return windows.map((w) => {
      const days = parseInt(w.replace(/[^0-9]/g, ''), 10) || 1;
      const avg = meta.avgForwardReturn?.[w] || 0;
      const stderr = +(2.4 * Math.sqrt(days) / Math.sqrt(sampleSize)).toFixed(2);
      const tStat = stderr === 0 ? 0 : +(avg / stderr).toFixed(2);
      const ci = +(1.96 * stderr).toFixed(2);
      const p = meta.probabilityPositive?.[w] || 0;
      return { window: w, days, avg, stderr, tStat, ciLow: avg - ci, ciHigh: avg + ci, pPositive: p, sample: sampleSize };
    });
  }, [windows.join(','), meta.avgForwardReturn, meta.probabilityPositive, sampleSize]);

  return (
    <div className={`rounded-xl p-4 ${dark ? 'bg-white/[0.03] border border-white/[0.06]' : 'border border-slate-200/70 bg-white'}`}>
      <div className={`mb-1 text-[11.5px] font-bold uppercase tracking-wider ${dark ? 'text-white/55' : 'text-slate-500'}`}>专项分析 · 各窗口横向对比 + 95% 置信区间</div>
      <p className={`mb-3 text-[11px] ${dark ? 'text-white/50' : 'text-slate-500'}`}>
        阴影区域 = 95% 置信区间（基于 {sampleSize} 个样本估计的均值标准误）。<b>|t-stat| ≥ 2</b> 视为在 5% 水平上显著。
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <CIBandChart stats={stats} dark={dark} />

        <div className={`rounded-md ${dark ? 'bg-white/[0.02]' : 'bg-slate-50/60'}`}>
          <table className="w-full text-[11.5px]">
            <thead>
              <tr className={dark ? 'text-white/45' : 'text-slate-500'}>
                <th className="px-2 py-1.5 text-left font-medium">窗口</th>
                <th className="px-2 py-1.5 text-right font-medium">均值</th>
                <th className="px-2 py-1.5 text-right font-medium">±95% CI</th>
                <th className="px-2 py-1.5 text-right font-medium">t-stat</th>
                <th className="px-2 py-1.5 text-right font-medium">+%</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => {
                const sig = Math.abs(s.tStat) >= 2;
                return (
                  <tr key={s.window} className={`border-t font-mono tabular-nums ${dark ? 'border-white/[0.04] text-white/85' : 'border-slate-100 text-slate-800'}`}>
                    <td className="px-2 py-1.5 font-sans"><b>{s.window}</b></td>
                    <td className={`px-2 py-1.5 text-right ${s.avg >= 0 ? (dark ? 'text-emerald-300' : 'text-emerald-700') : (dark ? 'text-rose-300' : 'text-rose-700')}`}>{window.formatPct(s.avg, { sign: true })}</td>
                    <td className={`px-2 py-1.5 text-right ${dark ? 'text-white/55' : 'text-slate-500'}`}>±{(s.ciHigh - s.avg).toFixed(2)}</td>
                    <td className={`px-2 py-1.5 text-right font-bold ${sig ? (s.tStat >= 0 ? (dark ? 'text-emerald-300' : 'text-emerald-700') : (dark ? 'text-rose-300' : 'text-rose-700')) : (dark ? 'text-white/40' : 'text-slate-400')}`}>{s.tStat.toFixed(2)}{sig ? '*' : ''}</td>
                    <td className="px-2 py-1.5 text-right">{Math.round(s.pPositive * 100)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className={`px-2 py-1.5 text-[10.5px] ${dark ? 'text-white/40' : 'text-slate-400'}`}>* 标记表示在 5% 显著水平上拒绝零假设（均值 = 0）</div>
        </div>
      </div>
    </div>
  );
}

function CIBandChart({ stats, dark }) {
  if (!stats.length) return null;
  const width = 480, height = 200;
  const pad = { top: 16, right: 12, bottom: 28, left: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const all = [].concat(...stats.map((s) => [s.ciLow, s.ciHigh, 0]));
  const minV = Math.min(...all);
  const maxV = Math.max(...all);
  const span = (maxV - minV) || 1;
  const xAt = (i) => pad.left + (stats.length === 1 ? innerW / 2 : (i / (stats.length - 1)) * innerW);
  const yAt = (v) => pad.top + innerH - ((v - minV) / span) * innerH;

  // Build polygon for CI band (upper edge then reversed lower edge)
  const upperPts = stats.map((s, i) => `${xAt(i)},${yAt(s.ciHigh)}`);
  const lowerPts = stats.map((s, i) => `${xAt(i)},${yAt(s.ciLow)}`).reverse();
  const bandPts = [...upperPts, ...lowerPts].join(' ');

  const linePath = stats.map((s, i) => `${i === 0 ? 'M' : 'L'}${xAt(i)},${yAt(s.avg)}`).join(' ');
  const zeroY = yAt(0);

  return (
    <div className={`rounded-md p-3 ${dark ? 'bg-white/[0.02]' : 'bg-slate-50/60'}`}>
      <div className={`mb-1 text-[10.5px] font-bold uppercase tracking-wider ${dark ? 'text-cyan-300' : 'text-cyan-700'}`}>平均收益曲线 ± 95% CI</div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="block">
        {/* zero line */}
        <line x1={pad.left} y1={zeroY} x2={pad.left + innerW} y2={zeroY} stroke="currentColor" strokeOpacity={dark ? 0.18 : 0.20} />
        <text x={pad.left - 4} y={zeroY + 3} textAnchor="end" fontSize="9.5" className={dark ? 'fill-white/45' : 'fill-slate-500'}>0%</text>
        <text x={pad.left - 4} y={pad.top + 6} textAnchor="end" fontSize="9.5" className={dark ? 'fill-emerald-300' : 'fill-emerald-700'}>+{maxV.toFixed(1)}%</text>
        <text x={pad.left - 4} y={pad.top + innerH + 2} textAnchor="end" fontSize="9.5" className={dark ? 'fill-rose-300' : 'fill-rose-700'}>{minV.toFixed(1)}%</text>

        {/* CI band */}
        <polygon points={bandPts} fill={dark ? '#06b6d4' : '#0e7490'} opacity="0.18" />

        {/* avg line */}
        <path d={linePath} stroke={dark ? '#06b6d4' : '#0e7490'} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {/* points + window labels */}
        {stats.map((s, i) => (
          <g key={s.window}>
            <line x1={xAt(i)} y1={yAt(s.ciLow)} x2={xAt(i)} y2={yAt(s.ciHigh)} stroke={dark ? '#06b6d4' : '#0e7490'} strokeWidth="1" opacity="0.6" />
            <circle cx={xAt(i)} cy={yAt(s.avg)} r="3.5" fill={dark ? '#06b6d4' : '#0e7490'} stroke={dark ? '#0d1014' : '#fff'} strokeWidth="1.5" />
            <text x={xAt(i)} y={height - 10} textAnchor="middle" fontSize="10" className={dark ? 'fill-white/65' : 'fill-slate-600'} fontWeight="600">{s.window}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EventMainChart — 12-month equity curve with event markers (vertical dashed
// lines + dots). Hovering a marker shows a tooltip with the event's mini K-line
// candles and T+1/5/10/20 returns. Replaces the "tooltip drawer" pattern from
// wireframe event-axis.html in a more compact form.
// ─────────────────────────────────────────────────────────────────────────────
function EventMainChart({ strategy, dark }) {
  const meta = strategy.eventMeta || {};
  const windows = (meta.windows && meta.windows.length ? meta.windows : ['T+1', 'T+5', 'T+10', 'T+20']);
  const events = useMemoRV(() => mockEventCalendar(strategy, windows), [strategy, windows.join(',')]);
  const [hoverIdx, setHoverIdx] = useStateRV(null);

  const width = 800, height = 240;
  const pad = { top: 16, right: 14, bottom: 28, left: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  // Build cumulative strategy curve from event-driven jumps + drift between events.
  const curve = useMemoRV(() => {
    const days = 252;
    const out = [];
    let v = 0;
    let r = (strategy.id || 'x').charCodeAt(0) * 13;
    let evIdx = 0;
    for (let d = 0; d < days; d++) {
      r = (r * 9301 + 49297) % 233280;
      v += 0.04 + (r / 233280 - 0.5) * 0.3;
      // event lift on event day (cumulative T+20 return injected once)
      if (evIdx < events.length && events[evIdx].dayIndex === d) {
        v += (events[evIdx].returns['T+20'] || events[evIdx].returns['T+5'] || 1.0);
        evIdx++;
      }
      out.push(+v.toFixed(2));
    }
    return out;
  }, [strategy.id, events]);

  const minV = Math.min(...curve, 0);
  const maxV = Math.max(...curve);
  const span = (maxV - minV) || 1;
  const stepX = innerW / Math.max(1, curve.length - 1);

  const stratPath = curve.map((v, i) => {
    const x = pad.left + i * stepX;
    const y = pad.top + innerH - ((v - minV) / span) * innerH;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  // X-axis: month labels
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const xLabels = monthLabels.map((m, i) => ({ m, x: pad.left + (innerW * (i + 0.5)) / 12 }));

  const yTicks = [minV, (minV + maxV) / 2, maxV];

  const hoverEvent = hoverIdx !== null ? events[hoverIdx] : null;

  return (
    <div className="relative">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="block">
        {yTicks.map((v, i) => {
          const y = pad.top + innerH - ((v - minV) / span) * innerH;
          return (
            <g key={i}>
              <line x1={pad.left} y1={y} x2={pad.left + innerW} y2={y} stroke="currentColor" strokeOpacity={dark ? 0.10 : 0.06} />
              <text x={pad.left - 4} y={y + 3} textAnchor="end" fontSize="9.5" className={dark ? 'fill-white/45' : 'fill-slate-500'}>{v >= 0 ? '+' : ''}{v.toFixed(0)}%</text>
            </g>
          );
        })}
        {xLabels.map((l) => (
          <text key={l.m} x={l.x} y={height - 6} textAnchor="middle" fontSize="9.5" className={dark ? 'fill-white/40' : 'fill-slate-400'}>{l.m}</text>
        ))}

        <path d={stratPath} stroke={dark ? '#06b6d4' : '#0e7490'} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {/* Event markers — vertical dashed line + dot */}
        {events.map((ev, i) => {
          const x = pad.left + (ev.dayIndex / Math.max(1, curve.length - 1)) * innerW;
          const v = curve[ev.dayIndex];
          const y = pad.top + innerH - ((v - minV) / span) * innerH;
          const hovered = hoverIdx === i;
          const color = ev.returns['T+20'] >= 0 ? (dark ? '#34d399' : '#10b981') : (dark ? '#fb7185' : '#e11d48');
          return (
            <g key={ev.id}>
              <line x1={x} y1={pad.top} x2={x} y2={pad.top + innerH} stroke={color} strokeWidth={hovered ? 1.2 : 0.7} strokeDasharray="3 3" opacity={hovered ? 0.85 : 0.45} />
              <circle
                cx={x} cy={y} r={hovered ? 6 : 4.5}
                fill={color} stroke={dark ? '#0d1014' : '#fff'} strokeWidth="2"
                onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)}
                style={{ cursor: 'pointer' }}
              />
            </g>
          );
        })}

        {/* Legend */}
        <g transform={`translate(${pad.left + innerW - 220}, ${pad.top + 4})`}>
          <rect x="0" y="0" width="214" height="36" rx="6" fill={dark ? '#0d1014' : '#ffffff'} stroke={dark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'} />
          <circle cx="10" cy="11" r="3.5" fill={dark ? '#06b6d4' : '#0e7490'} />
          <text x="18" y="14" fontSize="10" className={dark ? 'fill-white/80' : 'fill-slate-700'}>事件驱动累计收益</text>
          <circle cx="10" cy="26" r="3.5" fill={dark ? '#34d399' : '#10b981'} />
          <text x="18" y="29" fontSize="9.5" className={dark ? 'fill-white/55' : 'fill-slate-500'}>事件标记 · 悬停查看明细</text>
        </g>
      </svg>

      {/* Tooltip drawer */}
      {hoverEvent && (
        <EventTooltip event={hoverEvent} dark={dark} />
      )}

      <div className={`mt-1 text-[11px] ${dark ? 'text-white/55' : 'text-slate-500'}`}>
        共 {events.length} 个事件 · 虚线 + 圆点标示事件位置，悬停查看事件名 / mini K线 / 各窗口收益。
      </div>
    </div>
  );
}

function EventTooltip({ event, dark }) {
  return (
    <div
      className={`pointer-events-none absolute z-30 w-[240px] rounded-lg p-3 shadow-xl ${dark ? 'border border-cyan-400/30 bg-[#0d1014]' : 'border border-cyan-200 bg-white'}`}
      style={{ left: `${Math.min(event.tooltipPctX, 70)}%`, top: '40px' }}
    >
      <div className={`text-[12px] font-semibold ${dark ? 'text-cyan-200' : 'text-cyan-700'}`}>{event.title}</div>
      <div className={`mt-0.5 text-[10.5px] ${dark ? 'text-white/50' : 'text-slate-500'}`}>{event.date} · {event.subtitle}</div>

      {/* Mini candles (9 candles spanning T-4 → T+4) */}
      <div className="mt-2 flex h-12 items-end gap-1">
        {event.candles.map((c, i) => {
          const isEventDay = i === 4;
          const fill = c.up ? (dark ? '#34d399' : '#10b981') : (dark ? '#fb7185' : '#e11d48');
          return (
            <div key={i} className="flex flex-1 flex-col items-center justify-end">
              <div style={{ height: `${c.height}%`, background: fill, opacity: isEventDay ? 1 : 0.6, borderRadius: 1, width: '100%' }} />
              {isEventDay && <span className={`mt-0.5 text-[8px] font-bold ${dark ? 'text-cyan-300' : 'text-cyan-700'}`}>T</span>}
            </div>
          );
        })}
      </div>

      <div className="mt-2 space-y-0.5">
        {Object.entries(event.returns).map(([w, r]) => (
          <div key={w} className="flex items-baseline justify-between text-[11px]">
            <span className={dark ? 'text-white/55' : 'text-slate-500'}>{w}</span>
            <span className={`font-mono tabular-nums ${r >= 0 ? (dark ? 'text-emerald-300' : 'text-emerald-700') : (dark ? 'text-rose-300' : 'text-rose-700')}`}>{r >= 0 ? '+' : ''}{r.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function mockEventCalendar(strategy, windows) {
  const seed = (strategy.id || 'x').split('').reduce((s, c) => (s * 31 + c.charCodeAt(0)) % 99991, 7);
  const symbols = strategy.market === 'Crypto'
    ? ['BTC', 'ETH', 'SOL', 'AVAX', 'LINK']
    : ['AAPL', 'NVDA', 'MSFT', 'AVGO', 'TSLA', 'AMZN'];
  const eventName = strategy.eventMeta?.event || 'Event';
  const out = [];
  const days = 252;
  const eventCount = 6;
  for (let i = 0; i < eventCount; i++) {
    const s = (seed + i * 137) % 99991;
    const dayIndex = Math.floor(((i + 0.5) / eventCount) * days + ((s % 11) - 5));
    const dateMonth = Math.min(11, Math.floor(dayIndex / 21)) + 1;
    const dateDay = (s % 27) + 1;
    const winReturns = {};
    let prev = 0;
    for (const w of windows) {
      const k = parseInt(w.replace(/[^0-9]/g, ''), 10) || 1;
      const drift = ((s % 100) / 100 - 0.35);
      prev = prev + drift * Math.log(k + 1) * 1.4 + (((s * k) % 7) - 3) * 0.25;
      winReturns[w] = +prev.toFixed(2);
    }
    // 9 candles, event day at index 4
    const candles = [];
    let r = s;
    for (let c = 0; c < 9; c++) {
      r = (r * 9301 + 49297) % 233280;
      const up = c === 4 ? winReturns['T+1'] >= 0 : (r / 233280) > 0.45;
      candles.push({ up, height: 30 + ((r * (c + 1)) % 700) / 10 });
    }
    out.push({
      id: 'evm-' + i,
      symbol: symbols[i % symbols.length],
      title: symbols[i % symbols.length] + ' · ' + eventName,
      date: '2025-' + String(dateMonth).padStart(2, '0') + '-' + String(dateDay).padStart(2, '0'),
      subtitle: (s % 2 === 0 ? '盘后公告' : '盘前预告') + ' · 样本组 G' + ((s % 10) + 1),
      dayIndex,
      tooltipPctX: ((dayIndex / days) * 100),
      candles,
      returns: winReturns,
    });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// EventAxisReplay — auto-play through 5 mock events (±20 day window, ~12s each).
// ─────────────────────────────────────────────────────────────────────────────
function EventAxisReplay({ strategy, dark }) {
  const meta = strategy.eventMeta || {};
  const events = useMemoRV(() => mockEventTrajectories(strategy), [strategy]);
  const [eventIdx, setEventIdx] = useStateRV(0);
  const [day, setDay] = useStateRV(0);
  const [playing, setPlaying] = useStateRV(true);
  const stepMs = 300; // 41 days * 300ms ≈ 12s per event

  React.useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setDay((d) => {
        if (d >= 40) {
          setEventIdx((i) => (i + 1) % events.length);
          return 0;
        }
        return d + 1;
      });
    }, stepMs);
    return () => clearInterval(id);
  }, [playing, events.length]);

  const current = events[eventIdx];
  const visibleTraj = current.trajectory.slice(0, day + 1);

  // average trajectory across all events (shows the "expected" curve)
  const avgTraj = useMemoRV(() => {
    const len = 41;
    const out = new Array(len).fill(0);
    for (const e of events) for (let i = 0; i < len; i++) out[i] += e.trajectory[i];
    return out.map((v) => v / events.length);
  }, [events]);

  return (
    <div className={`rounded-xl p-4 ${dark ? 'bg-cyan-500/8 border border-cyan-400/22' : 'border border-cyan-200 bg-cyan-50/40'}`}>
      <div className="mb-2 flex items-center justify-between">
        <div className={`text-[11.5px] font-bold uppercase tracking-wider ${dark ? 'text-cyan-200' : 'text-cyan-700'}`}>事件轴回放 · ±20 日</div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setPlaying(!playing)} className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold ${dark ? 'bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/22' : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'}`}>
            {playing ? <><svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg> 暂停</> : <><svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor"><polygon points="7 4 21 12 7 20 7 4" /></svg> 播放</>}
          </button>
          <button onClick={() => { setEventIdx((i) => (i + 1) % events.length); setDay(0); }} className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ${dark ? 'bg-white/[0.05] text-white/65 hover:bg-white/[0.10]' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            下一个
          </button>
        </div>
      </div>
      <p className={`mb-3 text-[11.5px] ${dark ? 'text-cyan-200/75' : 'text-cyan-700/85'}`}>
        当前正在回放 <b>{current.name}</b> · 事件日 = Day 0 · 显示前后 20 个交易日的相对收益。
      </p>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[180px_1fr]">
        <div className={`rounded-md p-2 ${dark ? 'bg-white/[0.03]' : 'bg-white'}`}>
          <div className={`mb-1 text-[10px] font-bold uppercase tracking-wider ${dark ? 'text-cyan-200/75' : 'text-cyan-700'}`}>事件列表 · {events.length}</div>
          <ul className="space-y-1">
            {events.map((e, i) => (
              <li key={e.id} onClick={() => { setEventIdx(i); setDay(0); setPlaying(false); }} className={`flex cursor-pointer items-center justify-between rounded px-2 py-1 text-[11.5px] ${i === eventIdx ? (dark ? 'bg-cyan-500/20 text-cyan-100' : 'bg-cyan-100 text-cyan-800') : (dark ? 'text-white/65 hover:bg-white/[0.04]' : 'text-slate-600 hover:bg-slate-50')}`}>
                <span className="truncate"><b>{e.symbol}</b> · {e.date}</span>
                <span className={`font-mono tabular-nums ${e.trajectory[40] >= 0 ? (dark ? 'text-emerald-300' : 'text-emerald-700') : (dark ? 'text-rose-300' : 'text-rose-700')}`}>
                  {window.formatPct(e.trajectory[40], { sign: true })}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className={`rounded-md p-3 ${dark ? 'bg-white/[0.03]' : 'bg-white'}`}>
          <EventAxisChart current={visibleTraj} fullTraj={current.trajectory} avg={avgTraj} day={day} dark={dark} />
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className={dark ? 'text-cyan-200/70' : 'text-cyan-700'}>Day {day - 20 >= 0 ? '+' : ''}{day - 20}</span>
            <div className={`flex-1 mx-3 h-1 rounded-full ${dark ? 'bg-white/[0.05]' : 'bg-slate-100'}`}>
              <div className="h-1 rounded-full" style={{ width: `${(day / 40) * 100}%`, background: dark ? '#67e8f9' : '#0e7490' }} />
            </div>
            <span className={`font-mono tabular-nums ${current.trajectory[day] >= 0 ? (dark ? 'text-emerald-300' : 'text-emerald-700') : (dark ? 'text-rose-300' : 'text-rose-700')}`}>
              {window.formatPct(current.trajectory[day] || 0, { sign: true })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function mockEventTrajectories(strategy) {
  const seed = (strategy.id || 'x').charCodeAt(0) + (strategy.id || 'x').charCodeAt(1 || 0);
  const symbols = strategy.market === 'Crypto' ? ['BTC', 'ETH', 'SOL', 'AVAX', 'LINK'] : ['AAPL', 'NVDA', 'MSFT', 'AVGO', 'TSLA'];
  const out = [];
  for (let i = 0; i < 5; i++) {
    const s = seed + i * 31;
    const drift = ((s % 100) / 100) * 0.4 - 0.1;
    const traj = [];
    let v = 0;
    let r = s;
    for (let d = 0; d < 41; d++) {
      r = (r * 9301 + 49297) % 233280;
      const rand = r / 233280;
      v += drift * 0.04 + (rand - 0.5) * 0.6;
      // events should have a noticeable jump at day 20
      if (d === 20) v += ((s % 7) - 2) * 0.4;
      traj.push(+(v).toFixed(2));
    }
    out.push({
      id: 'evt-' + i,
      symbol: symbols[i],
      date: '2025-' + String((s % 12) + 1).padStart(2, '0') + '-' + String((s * 3 % 28) + 1).padStart(2, '0'),
      name: symbols[i] + ' · ' + (strategy.eventMeta?.event || 'event') + ' #' + (i + 1),
      trajectory: traj,
    });
  }
  return out;
}

function EventAxisChart({ current, fullTraj, avg, day, dark }) {
  const width = 480, height = 180;
  const pad = { top: 16, right: 12, bottom: 22, left: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const all = fullTraj.concat(avg);
  const minV = Math.min(...all);
  const maxV = Math.max(...all);
  const span = (maxV - minV) || 1;
  const n = fullTraj.length;
  const stepX = innerW / (n - 1);

  const buildPath = (curve) => curve.map((v, i) => {
    const x = pad.left + i * stepX;
    const y = pad.top + innerH - ((v - minV) / span) * innerH;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const eventDayX = pad.left + 20 * stepX;
  const dayX = pad.left + day * stepX;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="block">
      <line x1={eventDayX} y1={pad.top} x2={eventDayX} y2={pad.top + innerH} stroke={dark ? '#67e8f9' : '#0e7490'} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
      <text x={eventDayX + 4} y={pad.top + 9} fontSize="9" className={dark ? 'fill-cyan-300' : 'fill-cyan-700'}>事件日 T</text>

      {[-20, -10, 0, 10, 20].map((d) => {
        const x = pad.left + (d + 20) * stepX;
        return <text key={d} x={x} y={height - 6} textAnchor="middle" fontSize="9" className={dark ? 'fill-white/45' : 'fill-slate-500'}>{d === 0 ? 'T' : (d > 0 ? '+' : '') + d}</text>;
      })}
      {[minV, 0, maxV].map((v, i) => {
        const y = pad.top + innerH - ((v - minV) / span) * innerH;
        return (
          <g key={i}>
            <line x1={pad.left} y1={y} x2={pad.left + innerW} y2={y} stroke="currentColor" strokeOpacity={dark ? 0.10 : 0.06} />
            <text x={pad.left - 4} y={y + 3} textAnchor="end" fontSize="9" className={dark ? 'fill-white/45' : 'fill-slate-500'}>{v >= 0 ? '+' : ''}{v.toFixed(1)}%</text>
          </g>
        );
      })}

      <path d={buildPath(avg)} stroke="#94a3b8" strokeWidth="1.5" fill="none" strokeDasharray="4 3" />
      <path d={buildPath(current)} stroke="#06b6d4" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx={dayX} cy={pad.top + innerH - ((current[current.length - 1] - minV) / span) * innerH} r="3.5" fill="#06b6d4" />

      <g transform={`translate(${pad.left + 8}, ${pad.top + 8})`}>
        <circle cx="4" cy="4" r="3" fill="#06b6d4" />
        <text x="12" y="7" fontSize="9.5" className={dark ? 'fill-white/85' : 'fill-slate-700'}>当前事件</text>
        <circle cx="4" cy="18" r="3" fill="#94a3b8" />
        <text x="12" y="21" fontSize="9.5" className={dark ? 'fill-white/65' : 'fill-slate-500'}>5 事件平均</text>
      </g>
    </svg>
  );
}

function WindowReturnsBars({ windows, avgReturns, dark }) {
  const max = Math.max(0.1, ...windows.map((w) => Math.abs(avgReturns[w] || 0)));
  const width = 800, height = 140;
  const pad = { top: 16, right: 10, bottom: 28, left: 32 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const barW = innerW / windows.length - 8;
  const zeroY = pad.top + innerH / 2;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="block">
      <line x1={pad.left} y1={zeroY} x2={pad.left + innerW} y2={zeroY} stroke="currentColor" strokeOpacity={dark ? 0.15 : 0.20} />
      {windows.map((w, i) => {
        const r = avgReturns[w] || 0;
        const x = pad.left + (innerW / windows.length) * i + 4;
        const h = Math.abs((r / max) * (innerH / 2));
        const y = r >= 0 ? zeroY - h : zeroY;
        const fillColor = r >= 0 ? (dark ? '#34d399' : '#10b981') : (dark ? '#fb7185' : '#e11d48');
        return (
          <g key={w}>
            <rect x={x} y={y} width={barW} height={h} fill={fillColor} opacity="0.85" rx="2" />
            <line x1={x + barW / 2} y1={y - 6} x2={x + barW / 2} y2={y + 6} stroke={fillColor} strokeWidth="1.5" />
            <text x={x + barW / 2} y={height - 10} textAnchor="middle" fontSize="10.5" className={dark ? 'fill-white/55' : 'fill-slate-500'}>{w}</text>
            <text x={x + barW / 2} y={r >= 0 ? y - 8 : y + h + 14} textAnchor="middle" fontSize="10" className={dark ? 'fill-white/80' : 'fill-slate-700'}>{window.formatPct(r, { sign: true })}</text>
          </g>
        );
      })}
    </svg>
  );
}

function TradePnLHistogram({ trades, dark }) {
  const buckets = [
    { label: '< -5%',     min: -Infinity, max: -5,  color: '#be123c' },
    { label: '-5% ~ -2%', min: -5,        max: -2,  color: '#e11d48' },
    { label: '-2% ~ 0%',  min: -2,        max: 0,   color: '#fb7185' },
    { label: '0% ~ 2%',   min: 0,         max: 2,   color: '#86efac' },
    { label: '2% ~ 5%',   min: 2,         max: 5,   color: '#34d399' },
    { label: '5% ~ 10%',  min: 5,         max: 10,  color: '#10b981' },
    { label: '> 10%',     min: 10,        max: Infinity, color: '#059669' },
  ];
  const counts = buckets.map((b) => trades.filter((t) => t.pnlPct >= b.min && t.pnlPct < b.max).length);
  const maxC = Math.max(1, ...counts);
  const width = 500, height = 180;
  const pad = { top: 12, right: 8, bottom: 30, left: 24 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const barW = innerW / buckets.length - 6;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="block">
      {buckets.map((b, i) => {
        const x = pad.left + (innerW / buckets.length) * i + 3;
        const h = (counts[i] / maxC) * innerH;
        const y = pad.top + innerH - h;
        return (
          <g key={b.label}>
            <rect x={x} y={y} width={barW} height={h} fill={b.color} opacity="0.88" rx="2" />
            {counts[i] > 0 && <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize="9.5" className={dark ? 'fill-white/85' : 'fill-slate-700'}>{counts[i]}</text>}
            <text x={x + barW / 2} y={height - 14} textAnchor="middle" fontSize="9" className={dark ? 'fill-white/55' : 'fill-slate-500'}>{b.label}</text>
          </g>
        );
      })}
      <line x1={pad.left} y1={pad.top + innerH} x2={pad.left + innerW} y2={pad.top + innerH} stroke="currentColor" strokeOpacity={dark ? 0.15 : 0.20} />
    </svg>
  );
}

Object.assign(window, { PortfolioView, TradeView, StudyView, GroupReturnsChart, GroupAnalysisSection, GroupCurvesChart, EventAxisReplay, EventMainChart, WindowAnalysisPanel, TradePnLHistogram });
