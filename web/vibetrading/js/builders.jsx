// Builders — BuilderShell shared chrome + 4 engine-specific forms.
// On Run Backtest, generates a mock draft and hands back to caller via onRunBacktest.

const { useState: useStateBL, useEffect: useEffectBL, useMemo: useMemoBL } = React;

// ─────────────────────────────────────────────────────────────────────────────
// Initial config seeds per engine.
// ─────────────────────────────────────────────────────────────────────────────
function initConfig(engine, draft) {
  if (draft && draft.engine === engine) {
    return cloneDraftConfig(draft);
  }
  if (engine === 'screen') return {
    mode: 'cross-section',
    universe: 'S&P 500',
    conditions: [{ indicator: 'mom_1m', op: '>', value: 0, category: 'technical' }],
    rankBy: 'momentum_score',
    topN: 10,
    rebalance: 'monthly',
    holdDays: 5,
    trailingStop: 6,
    sizing: 'equal',
    dateFrom: '2022-01-01', dateTo: '2026-04-30',
    commission: 0.04, slippage: 0.02, benchmark: 'SPY',
  };
  if (engine === 'pine') return {
    universe: 'BTC',
    code: '//@version=5\nstrategy("My Strategy", overlay=true)\n\n// Define entry/exit logic here\n\nif ta.crossover(close, ta.sma(close, 20))\n    strategy.entry("long", strategy.long)\nif ta.crossunder(close, ta.sma(close, 20))\n    strategy.close("long")',
    dateFrom: '2022-01-01', dateTo: '2026-04-30',
    sizing: 'fixed_percent',
    commission: 0.04, slippage: 0.02,
    stop_loss: -3, take_profit: null, max_position: 1,
  };
  if (engine === 'event') return {
    eventType: 'Earnings surprise > 0',
    windows: ['T+1', 'T+5', 'T+10', 'T+20'],
    universe: 'S&P 500',
    dateFrom: '2020-01-01', dateTo: '2026-04-30',
    adjustment: 'minus_benchmark',
  };
  if (engine === 'factor') return {
    dsl: 'multiply(\n  zscore(return_1m),\n  -1\n)',
    universe: 'Russell 1000',
    groupCount: 10,
    longShort: true,
    rebalance: 'monthly',
    sizing: 'equal',
    dateFrom: '2018-01-01', dateTo: '2026-04-30',
  };
  return {};
}

// Look up an indicator (by id or label match) so categories can be inferred for
// legacy draft conditions saved before category tracking landed.
function findIndicatorMeta(value) {
  if (!value) return null;
  const list = window.SCREENER_INDICATORS || [];
  return list.find((i) => i.id === value || i.label === value) || null;
}
function normalizeCondition(c) {
  if (!c) return { indicator: 'mom_1m', op: '>', value: 0, category: 'technical' };
  if (c.category) return c;
  const meta = findIndicatorMeta(c.indicator);
  return { ...c, category: meta ? meta.category : 'technical' };
}

function cloneDraftConfig(d) {
  // Pull config back out of a saved draft for editing.
  if (d.engine === 'screen') {
    const m = d.screenMeta || {};
    const cond = (m.conditions || [{ indicator: 'mom_1m', op: '>', value: 0 }]).map(normalizeCondition);
    return {
      mode: m.mode || (d.holdingPolicy === 'rule-exit' || d.holdingPolicy === 'time-exit' ? 'time-series' : 'cross-section'),
      universe: (m.universeLabel || 'S&P 500'),
      conditions: cond,
      rankBy: m.rankBy || 'momentum_score',
      topN: m.topN || 10,
      rebalance: m.rebalance || 'monthly',
      holdDays: m.holdDays || 5,
      trailingStop: m.trailingStop || 6,
      sizing: d.sizingMethod || 'equal',
      dateFrom: '2022-01-01', dateTo: '2026-04-30',
      commission: 0.04, slippage: 0.02, benchmark: 'SPY',
    };
  }
  if (d.engine === 'pine') {
    const m = d.pineMeta || {};
    return {
      universe: d.symbol || 'BTC',
      code: m.codePreview || '',
      dateFrom: '2022-01-01', dateTo: '2026-04-30',
      sizing: d.sizingMethod || 'fixed_percent',
      ...(m.riskParams || {}),
    };
  }
  if (d.engine === 'event') {
    const m = d.eventMeta || {};
    return {
      eventType: m.event || 'Earnings surprise > 0',
      windows: m.windows || ['T+1', 'T+5', 'T+10', 'T+20'],
      universe: d.universe?.label || 'S&P 500',
      dateFrom: '2020-01-01', dateTo: '2026-04-30',
      adjustment: m.adjustment || 'minus_benchmark',
    };
  }
  if (d.engine === 'factor') {
    const m = d.factorMeta || {};
    return {
      dsl: m.dsl || 'multiply(zscore(return_1m), -1)',
      universe: d.universe?.label || 'Russell 1000',
      groupCount: m.groupCount || 10,
      longShort: true,
      rebalance: 'monthly',
      sizing: d.sizingMethod || 'equal',
      dateFrom: '2018-01-01', dateTo: '2026-04-30',
    };
  }
  return {};
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock result generator — produces a complete draft after Run Backtest.
// ─────────────────────────────────────────────────────────────────────────────
function mockResult(engine, title, config, existingDraftId) {
  const id = existingDraftId || ('draft-' + Math.random().toString(36).slice(2, 8));
  const seed = id.charCodeAt(id.length - 1) * 7 + id.charCodeAt(0);
  const universeLabel = config.universe || 'S&P 500';
  const symbol = engine === 'pine' ? config.universe : (engine === 'factor' ? 'R1000' : universeLabel);
  const universeKind = engine === 'pine' ? 'single'
    : engine === 'factor' ? 'cross-section'
    : (universeLabel === 'S&P 500' || universeLabel === 'Nasdaq 100' || universeLabel === 'Russell 1000' || universeLabel === 'QQQ 100') ? 'index' : 'single';

  const base = {
    id, draft: true, draftStatus: 'backtested',
    name: title || 'Untitled draft',
    symbol,
    market: engine === 'pine' && universeLabel === 'BTC' ? 'Crypto' : 'US Equity',
    universe: { kind: universeKind, label: universeLabel, detail: universeLabel + ' · ' + (config.rebalance || engine) },
    author: { name: 'You', org: 'Personal draft', avatarColor: '#0ea5e9' },
    blurb: 'Backtest just generated.',
    tags: ['Draft', engine[0].toUpperCase() + engine.slice(1)],
    curve: window.seededWalk(seed, 120, 0.18, 0.32, 0),
    published: null,
    aiMatch: 0,
    engine,
    resultType: window.ENGINE_INFO[engine].resultType,
  };

  if (engine === 'screen') {
    const isTimeSeries = config.mode === 'time-series';
    return {
      ...base,
      holdingPolicy: isTimeSeries ? 'rule-exit' : 'cross-rebalance',
      sizingMethod: config.sizing,
      metrics: { ret1Y: 14 + (seed % 18), sharpe1Y: 1.4 + (seed % 9) * 0.1, maxDD: -(4 + (seed % 8)), cagr5Y: 0, winRate: 58 + (seed % 12), trades: 80 + (seed % 40), followers: 0 },
      screenMeta: {
        mode: config.mode || 'cross-section',
        conditions: config.conditions,
        rankBy: config.rankBy,
        topN: config.topN,
        rebalance: config.rebalance,
        holdDays: config.holdDays,
        trailingStop: config.trailingStop,
        universeLabel,
      },
    };
  }
  if (engine === 'pine') {
    return {
      ...base,
      holdingPolicy: 'rule-exit',
      sizingMethod: config.sizing,
      metrics: { ret1Y: 22 + (seed % 28), sharpe1Y: 1.6 + (seed % 8) * 0.1, maxDD: -(6 + (seed % 12)), cagr5Y: 0, winRate: 54 + (seed % 14), trades: 28 + (seed % 60), followers: 0 },
      pineMeta: {
        codePreview: config.code,
        riskParams: { commission: config.commission, slippage: config.slippage, stop_loss: config.stop_loss, take_profit: config.take_profit, max_position: config.max_position },
      },
    };
  }
  if (engine === 'event') {
    const credibility = 60 + (seed % 35);
    return {
      ...base,
      metrics: { ret1Y: 0, sharpe1Y: 0, maxDD: 0, cagr5Y: 0, winRate: 50 + (seed % 18), trades: 0, followers: 0 },
      eventMeta: {
        event: config.eventType,
        windows: config.windows,
        credibility,
        avgForwardReturn: Object.fromEntries(config.windows.map((w, i) => [w, +((i + 1) * 0.3 + (seed % 5) * 0.1).toFixed(2)])),
        probabilityPositive: Object.fromEntries(config.windows.map((w, i) => [w, +(0.5 + (i + 1) * 0.025 + (seed % 5) * 0.01).toFixed(2)])),
        sampleSize: 180 + (seed * 11) % 2200,
        adjustment: config.adjustment,
      },
    };
  }
  if (engine === 'factor') {
    const ic = +(0.05 + (seed % 9) * 0.01).toFixed(3);
    const icir = +(1.0 + (seed % 14) * 0.1).toFixed(2);
    const baseRet = 8 + (seed % 6);
    const groupReturns = Array.from({ length: config.groupCount }, (_, i) => +(baseRet * (1 - i / (config.groupCount - 1)) - 4 + (seed % 4) * 0.2 - i * 0.2).toFixed(2));
    return {
      ...base,
      holdingPolicy: 'cross-rebalance',
      sizingMethod: config.sizing,
      metrics: { ret1Y: 12 + (seed % 12), sharpe1Y: 2 + (seed % 10) * 0.1, maxDD: -(4 + (seed % 6)), cagr5Y: 0, winRate: 0, trades: 0, followers: 0 },
      factorMeta: {
        dsl: config.dsl,
        ic, icir, lsSharpe: +(1.5 + (seed % 12) * 0.1).toFixed(2),
        monotonicity: +(0.65 + (seed % 30) * 0.01).toFixed(2),
        groupReturns,
        groupCount: config.groupCount,
        longGroup: 1, shortGroup: config.groupCount,
      },
    };
  }
  return base;
}

// ─────────────────────────────────────────────────────────────────────────────
// BuilderShell — chrome (back / engine pill / title / save) + form + summary + run.
// ─────────────────────────────────────────────────────────────────────────────
function BuilderShell({ engine, draft, onBack, onRunBacktest, dark }) {
  const info = window.ENGINE_INFO[engine];
  const [title, setTitle] = useStateBL(draft?.name || '');
  const [config, setConfig] = useStateBL(() => initConfig(engine, draft));
  const [running, setRunning] = useStateBL(false);
  const [runStep, setRunStep] = useStateBL(0);

  if (!info) return null;

  function patch(p) { setConfig((c) => ({ ...c, ...p })); }

  function handleRun() {
    const name = title.trim() || ('Untitled ' + info.label);
    setTitle(name);
    setRunning(true);
    setRunStep(0);
    const steps = ['Loading data…', 'Computing signals…', 'Running simulation…', 'Generating report…'];
    steps.forEach((_, i) => setTimeout(() => setRunStep(i + 1), 600 * (i + 1)));
    setTimeout(() => {
      setRunning(false);
      const result = mockResult(engine, name, config, draft?.id);
      onRunBacktest(result);
    }, 2700);
  }

  function handleSaveDraft() {
    const name = title.trim() || ('Untitled ' + info.label);
    const result = { ...mockResult(engine, name, config, draft?.id), draftStatus: 'configuring' };
    if (window.STUDIO_DRAFTS) {
      const idx = window.STUDIO_DRAFTS.findIndex((d) => d.id === result.id);
      if (idx >= 0) window.STUDIO_DRAFTS[idx] = { ...window.STUDIO_DRAFTS[idx], ...result };
      else window.STUDIO_DRAFTS = [result, ...window.STUDIO_DRAFTS];
    }
    onBack();
  }

  return (
    <div className="relative px-7 pt-5 pb-10">
      {/* Header — back, engine, title, status, actions */}
      <div className="flex flex-wrap items-center gap-3 pb-2">
        <button onClick={onBack} className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-[12px] font-medium ${dark ? 'border-white/[0.08] bg-white/[0.03] text-white/80 hover:bg-white/[0.08]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
          Studio
        </button>
        <window.EngineBadge engine={engine} dark={dark} size="md" />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={'起一个名字 · ' + info.label + ' 策略'}
          className={`min-w-[200px] flex-1 rounded-md border px-3 py-1.5 text-[15px] font-semibold outline-none ${dark ? 'border-white/[0.08] bg-white/[0.03] text-white placeholder:text-white/30 focus:border-sky-400/40' : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-300 focus:border-sky-300'}`}
        />
        <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider ${dark ? 'bg-white/10 text-white/65' : 'bg-slate-100 text-slate-500'}`}>{draft ? 'Editing draft' : 'New draft'}</span>
        <div className="flex items-center gap-2">
          <button onClick={handleSaveDraft} className={`rounded-md border px-3 py-1.5 text-[12.5px] font-medium ${dark ? 'border-white/[0.08] bg-white/[0.03] text-white/80 hover:bg-white/[0.08]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>保存为草稿</button>
          <button onClick={onBack} className={`rounded-md border px-3 py-1.5 text-[12.5px] font-medium ${dark ? 'border-white/[0.08] bg-white/[0.03] text-white/80 hover:bg-white/[0.08]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>取消</button>
          <button onClick={handleRun} className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-4 py-1.5 text-[13px] font-semibold text-white shadow-sm hover:bg-sky-700">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><polygon points="7 4 21 12 7 20 7 4" /></svg>
            Run Backtest
          </button>
        </div>
      </div>
      <div className={`pb-4 text-[11.5px] ${dark ? 'text-white/45' : 'text-slate-400'}`}>
        回测完成后可在详情页发布到 Marketplace 或部署到 Deployed 跟踪。
      </div>

      {/* Body: form on left, summary on right */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        <div className={`rounded-xl ${dark ? 'border border-white/[0.06] bg-white/[0.02]' : 'border border-slate-200/70 bg-white'} p-5`}>
          {engine === 'screen' && <ScreenerForm config={config} patch={patch} dark={dark} />}
          {engine === 'pine' && <PineForm config={config} patch={patch} dark={dark} />}
          {engine === 'event' && <EventForm config={config} patch={patch} dark={dark} />}
          {engine === 'factor' && <FactorForm config={config} patch={patch} dark={dark} />}
        </div>
        <ConfigSummaryCard engine={engine} title={title} config={config} dark={dark} />
      </div>

      {running && <BacktestRunningOverlay step={runStep} dark={dark} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable form primitives.
// ─────────────────────────────────────────────────────────────────────────────
function FieldGroup({ label, hint, children, dark }) {
  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <div className={`text-[11.5px] font-bold uppercase tracking-wider ${dark ? 'text-white/55' : 'text-slate-500'}`}>{label}</div>
        {hint && <div className={`text-[10.5px] ${dark ? 'text-white/35' : 'text-slate-400'}`}>{hint}</div>}
      </div>
      {children}
    </div>
  );
}
function Select({ value, onChange, options, dark, className }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-md border px-2.5 py-1.5 text-[12.5px] outline-none ${dark ? 'border-white/[0.08] bg-white/[0.03] text-white focus:border-sky-400/40' : 'border-slate-200 bg-white text-slate-700 focus:border-sky-300'} ${className || ''}`}
    >
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.value;
        const l = typeof o === 'string' ? o : o.label;
        const disabled = typeof o === 'object' && o.disabled;
        return <option key={v} value={v} disabled={disabled}>{l}</option>;
      })}
    </select>
  );
}
function NumberInput({ value, onChange, step, min, max, dark, className }) {
  return (
    <input
      type="number"
      value={value === null || value === undefined ? '' : value}
      step={step || 1}
      min={min}
      max={max}
      onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      className={`rounded-md border px-2.5 py-1.5 text-[12.5px] outline-none ${dark ? 'border-white/[0.08] bg-white/[0.03] text-white focus:border-sky-400/40' : 'border-slate-200 bg-white text-slate-700 focus:border-sky-300'} ${className || ''}`}
    />
  );
}
function TextInput({ value, onChange, placeholder, dark, className }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`rounded-md border px-2.5 py-1.5 text-[12.5px] outline-none ${dark ? 'border-white/[0.08] bg-white/[0.03] text-white placeholder:text-white/30 focus:border-sky-400/40' : 'border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:border-sky-300'} ${className || ''}`}
    />
  );
}
function ChipGroup({ value, onChange, options, dark, multi }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.id;
        const l = typeof o === 'string' ? o : o.label;
        const active = multi ? (value || []).includes(v) : value === v;
        return (
          <button
            key={v}
            onClick={() => {
              if (multi) {
                const arr = (value || []).slice();
                const idx = arr.indexOf(v);
                if (idx >= 0) arr.splice(idx, 1); else arr.push(v);
                onChange(arr);
              } else onChange(v);
            }}
            className={`rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors ${active
              ? (dark ? 'border-sky-400/35 bg-sky-500/18 text-sky-200' : 'border-sky-400 bg-sky-50 text-sky-700')
              : (dark ? 'border-white/[0.08] bg-white/[0.03] text-white/70 hover:bg-white/[0.06]' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50')}`}
          >{l}</button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screener form — mode toggle (cross-section ↔ time-series) + conditions grouped
// by category (technical / fundamental / valuation, per wireframe image.png).
// ─────────────────────────────────────────────────────────────────────────────
function ScreenerForm({ config, patch, dark }) {
  const mode = config.mode || 'cross-section';
  const isTimeSeries = mode === 'time-series';
  const conditions = config.conditions || [];

  function setCondition(i, p) {
    const next = conditions.map((c, j) => (j === i ? { ...c, ...p } : c));
    patch({ conditions: next });
  }
  function addConditionForCategory(category) {
    const firstInCategory = (window.SCREENER_INDICATORS || []).find((x) => x.category === category);
    patch({ conditions: [...conditions, { indicator: firstInCategory ? firstInCategory.id : 'mom_1m', op: '>', value: 0, category }] });
  }
  function removeCondition(i) {
    if (conditions.length <= 1) return;
    patch({ conditions: conditions.filter((_, j) => j !== i) });
  }

  const categories = window.SCREENER_CATEGORIES || [];
  const indicatorsByCategory = (cat) => (window.SCREENER_INDICATORS || []).filter((x) => x.category === cat);

  return (
    <>
      {/* Mode toggle — segmented control */}
      <FieldGroup label="策略类型" hint="决定信号是横截面排名还是单标的时序" dark={dark}>
        <div className={`inline-flex rounded-lg border p-1 ${dark ? 'border-white/[0.08] bg-white/[0.03]' : 'border-slate-200 bg-slate-50'}`}>
          {(window.SCREENER_MODES || []).map((m) => {
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => patch({ mode: m.id })}
                className={`flex flex-col items-start rounded-md px-4 py-1.5 text-left transition-colors ${
                  active
                    ? (dark ? 'bg-sky-500/22 text-sky-100' : 'bg-white text-slate-900 shadow-sm')
                    : (dark ? 'text-white/60 hover:text-white/85' : 'text-slate-500 hover:text-slate-700')
                }`}
              >
                <span className="text-[12.5px] font-semibold">{m.label}</span>
                <span className={`text-[10.5px] ${active ? (dark ? 'text-sky-200/80' : 'text-slate-500') : (dark ? 'text-white/40' : 'text-slate-400')}`}>{m.sub}</span>
              </button>
            );
          })}
        </div>
      </FieldGroup>

      <FieldGroup label="股票池 · Universe" dark={dark}>
        <Select value={config.universe} onChange={(v) => patch({ universe: v })} options={window.SCREENER_UNIVERSES} dark={dark} className="w-full" />
      </FieldGroup>

      <FieldGroup label="筛选条件 · Conditions" hint="按类型分组，每条都需要满足才入选" dark={dark}>
        <div className="space-y-2.5">
          {categories.map((cat) => {
            const rowsInCat = conditions.map((c, idx) => ({ c, idx })).filter(({ c }) => (c.category || 'technical') === cat.id);
            const catOptions = indicatorsByCategory(cat.id).map((x) => ({ value: x.id, label: x.label }));
            return (
              <div key={cat.id} className={`rounded-md border ${dark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-slate-200 bg-slate-50/40'}`}>
                <div className={`flex items-center justify-between px-3 py-1.5 ${dark ? 'border-b border-white/[0.04]' : 'border-b border-slate-200/70'}`}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px]">{cat.icon}</span>
                    <span className={`text-[12px] font-semibold ${dark ? 'text-white/85' : 'text-slate-700'}`}>{cat.label}</span>
                    <span className={`text-[10.5px] ${dark ? 'text-white/35' : 'text-slate-400'}`}>· {cat.sub}</span>
                  </div>
                  <button
                    onClick={() => addConditionForCategory(cat.id)}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${dark ? 'text-sky-300 hover:bg-white/[0.04]' : 'text-sky-700 hover:bg-slate-100'}`}
                  >
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>
                    添加{cat.label}条件
                  </button>
                </div>
                <div className="p-2 space-y-1.5">
                  {rowsInCat.length === 0 ? (
                    <div className={`px-2 py-1 text-[11px] ${dark ? 'text-white/35' : 'text-slate-400'}`}>暂无条件 — 点右上"+"添加</div>
                  ) : rowsInCat.map(({ c, idx }) => {
                    const presentInOptions = catOptions.some((o) => o.value === c.indicator);
                    const useOptions = presentInOptions ? catOptions : [{ value: c.indicator, label: c.indicator + ' (legacy)' }].concat(catOptions);
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <Select value={c.indicator} onChange={(v) => setCondition(idx, { indicator: v })} options={useOptions} dark={dark} className="flex-1" />
                        <Select value={c.op} onChange={(v) => setCondition(idx, { op: v })} options={['>', '<', '>=', '<=', '=', 'top quartile', 'bottom quartile']} dark={dark} />
                        {c.op !== 'top quartile' && c.op !== 'bottom quartile' && (
                          <NumberInput value={c.value} onChange={(v) => setCondition(idx, { value: v })} step={0.1} dark={dark} className="w-24" />
                        )}
                        <button onClick={() => removeCondition(idx)} disabled={conditions.length <= 1} className={`grid h-7 w-7 place-items-center rounded ${dark ? 'text-white/40 hover:bg-white/8 disabled:opacity-30' : 'text-slate-400 hover:bg-slate-200 disabled:opacity-30'}`}>
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14" /></svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </FieldGroup>

      {/* Cross-section-only fields */}
      {!isTimeSeries && (
        <>
          <FieldGroup label="排序 + Top N" hint="按哪个指标排序，取前几名" dark={dark}>
            <div className="flex items-center gap-2">
              <Select value={config.rankBy} onChange={(v) => patch({ rankBy: v })} options={[
                { value: 'momentum_score', label: '动量得分' },
                { value: 'volatility', label: '波动率（升序）' },
                { value: 'quality_score', label: '质量得分' },
                { value: 'value_score', label: '估值（升序）' },
                { value: 'custom', label: '自定义' },
              ]} dark={dark} className="flex-1" />
              <span className={dark ? 'text-white/50 text-[12px]' : 'text-slate-500 text-[12px]'}>Top</span>
              <NumberInput value={config.topN} onChange={(v) => patch({ topN: v })} min={1} max={500} dark={dark} className="w-20" />
            </div>
          </FieldGroup>

          <FieldGroup label="调仓节奏 · Rebalance" dark={dark}>
            <ChipGroup value={config.rebalance} onChange={(v) => patch({ rebalance: v })} options={window.REBALANCE_OPTIONS} dark={dark} />
          </FieldGroup>
        </>
      )}

      {/* Time-series-only fields */}
      {isTimeSeries && (
        <FieldGroup label="持仓退出规则" hint="时序策略：按规则触发买卖，而非定期调仓" dark={dark}>
          <div className={`rounded-md border p-3 ${dark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-slate-200 bg-slate-50/40'}`}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className={`mb-1 text-[10.5px] font-bold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-slate-400'}`}>最长持有 N 日</div>
                <NumberInput value={config.holdDays} onChange={(v) => patch({ holdDays: v })} min={1} max={120} dark={dark} className="w-full" />
                <div className={`mt-0.5 text-[10.5px] ${dark ? 'text-white/35' : 'text-slate-400'}`}>到期强制平仓</div>
              </div>
              <div>
                <div className={`mb-1 text-[10.5px] font-bold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-slate-400'}`}>跟踪止损 %</div>
                <NumberInput value={config.trailingStop} onChange={(v) => patch({ trailingStop: v })} step={0.5} dark={dark} className="w-full" />
                <div className={`mt-0.5 text-[10.5px] ${dark ? 'text-white/35' : 'text-slate-400'}`}>从最高价回撤超过此值即退出</div>
              </div>
            </div>
            <p className={`mt-2 text-[11px] ${dark ? 'text-sky-200/75' : 'text-sky-700/85'}`}>
              触发条件来自上面的"筛选条件" — 满足全部条件时买入，触发持有上限或跟踪止损时卖出。
            </p>
          </div>
        </FieldGroup>
      )}

      <FieldGroup label="仓位计算 · Sizing" dark={dark}>
        <Select value={config.sizing} onChange={(v) => patch({ sizing: v })} options={window.SIZING_OPTIONS.map((o) => ({ value: o.id, label: o.label }))} dark={dark} className="w-full" />
      </FieldGroup>

      <FieldGroup label="回测区间" dark={dark}>
        <div className="flex items-center gap-2">
          <input type="date" value={config.dateFrom} onChange={(e) => patch({ dateFrom: e.target.value })} className={`flex-1 rounded-md border px-2.5 py-1.5 text-[12.5px] outline-none ${dark ? 'border-white/[0.08] bg-white/[0.03] text-white' : 'border-slate-200 bg-white text-slate-700'}`} />
          <span className={dark ? 'text-white/40' : 'text-slate-400'}>→</span>
          <input type="date" value={config.dateTo} onChange={(e) => patch({ dateTo: e.target.value })} className={`flex-1 rounded-md border px-2.5 py-1.5 text-[12.5px] outline-none ${dark ? 'border-white/[0.08] bg-white/[0.03] text-white' : 'border-slate-200 bg-white text-slate-700'}`} />
        </div>
      </FieldGroup>

      <details className={`mt-2 rounded-md border ${dark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-slate-200 bg-slate-50/30'}`}>
        <summary className={`cursor-pointer px-3 py-2 text-[11.5px] font-semibold uppercase tracking-wider ${dark ? 'text-white/55' : 'text-slate-500'}`}>高级（手续费 / 滑点 / 基准）</summary>
        <div className="grid grid-cols-3 gap-3 p-3">
          <div>
            <div className={`mb-1 text-[10px] font-bold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-slate-400'}`}>手续费 %</div>
            <NumberInput value={config.commission} onChange={(v) => patch({ commission: v })} step={0.01} dark={dark} className="w-full" />
          </div>
          <div>
            <div className={`mb-1 text-[10px] font-bold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-slate-400'}`}>滑点 %</div>
            <NumberInput value={config.slippage} onChange={(v) => patch({ slippage: v })} step={0.01} dark={dark} className="w-full" />
          </div>
          <div>
            <div className={`mb-1 text-[10px] font-bold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-slate-400'}`}>基准</div>
            <TextInput value={config.benchmark} onChange={(v) => patch({ benchmark: v })} placeholder="SPY" dark={dark} className="w-full" />
          </div>
        </div>
      </details>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pine form.
// ─────────────────────────────────────────────────────────────────────────────
function PineForm({ config, patch, dark }) {
  return (
    <>
      <FieldGroup label="标的 · Universe" hint="Pine 引擎为单标的回测" dark={dark}>
        <TextInput value={config.universe} onChange={(v) => patch({ universe: v })} placeholder="BTC / ETH / AAPL …" dark={dark} className="w-full" />
      </FieldGroup>

      <FieldGroup label="Pine 代码" hint="可粘贴 TradingView 策略代码" dark={dark}>
        <div className={`rounded-md border ${dark ? 'border-white/[0.08] bg-[#0b0d12]' : 'border-slate-200 bg-slate-50/60'}`}>
          <div className={`flex items-center justify-between border-b px-3 py-1.5 text-[10.5px] font-mono ${dark ? 'border-white/[0.05] text-white/40' : 'border-slate-200 text-slate-400'}`}>
            <span>pine_script · v5</span>
            <button className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10.5px] font-medium ${dark ? 'bg-white/[0.05] text-white/65 hover:bg-white/[0.08]' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 4h6v6M10 14L20 4M19 13v6H5V5h6" /></svg>
              Import from TradingView
            </button>
          </div>
          <textarea
            value={config.code}
            onChange={(e) => patch({ code: e.target.value })}
            rows={12}
            spellCheck={false}
            className={`w-full resize-y bg-transparent px-3 py-2.5 font-mono text-[12px] leading-relaxed outline-none ${dark ? 'text-white/85 placeholder:text-white/30' : 'text-slate-800 placeholder:text-slate-400'}`}
            placeholder="//@version=5&#10;strategy(...)"
          />
        </div>
      </FieldGroup>

      <FieldGroup label="风控 · Risk" dark={dark}>
        <div className="grid grid-cols-4 gap-2">
          <div>
            <div className={`mb-1 text-[10px] font-bold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-slate-400'}`}>止损 %</div>
            <NumberInput value={config.stop_loss} onChange={(v) => patch({ stop_loss: v })} step={0.5} dark={dark} className="w-full" />
          </div>
          <div>
            <div className={`mb-1 text-[10px] font-bold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-slate-400'}`}>止盈 %</div>
            <NumberInput value={config.take_profit} onChange={(v) => patch({ take_profit: v })} step={0.5} dark={dark} className="w-full" />
          </div>
          <div>
            <div className={`mb-1 text-[10px] font-bold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-slate-400'}`}>手续费 %</div>
            <NumberInput value={config.commission} onChange={(v) => patch({ commission: v })} step={0.01} dark={dark} className="w-full" />
          </div>
          <div>
            <div className={`mb-1 text-[10px] font-bold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-slate-400'}`}>滑点 %</div>
            <NumberInput value={config.slippage} onChange={(v) => patch({ slippage: v })} step={0.01} dark={dark} className="w-full" />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup label="仓位计算 · Sizing" dark={dark}>
        <Select value={config.sizing} onChange={(v) => patch({ sizing: v })} options={window.SIZING_OPTIONS.map((o) => ({ value: o.id, label: o.label }))} dark={dark} className="w-full" />
      </FieldGroup>

      <FieldGroup label="回测区间" dark={dark}>
        <div className="flex items-center gap-2">
          <input type="date" value={config.dateFrom} onChange={(e) => patch({ dateFrom: e.target.value })} className={`flex-1 rounded-md border px-2.5 py-1.5 text-[12.5px] outline-none ${dark ? 'border-white/[0.08] bg-white/[0.03] text-white' : 'border-slate-200 bg-white text-slate-700'}`} />
          <span className={dark ? 'text-white/40' : 'text-slate-400'}>→</span>
          <input type="date" value={config.dateTo} onChange={(e) => patch({ dateTo: e.target.value })} className={`flex-1 rounded-md border px-2.5 py-1.5 text-[12.5px] outline-none ${dark ? 'border-white/[0.08] bg-white/[0.03] text-white' : 'border-slate-200 bg-white text-slate-700'}`} />
        </div>
      </FieldGroup>

      <div className={`mt-2 rounded-md border p-3 text-[12px] ${dark ? 'border-violet-400/22 bg-violet-500/10 text-violet-200' : 'border-violet-200 bg-violet-50 text-violet-700'}`}>
        <b>Pine 引擎特性：</b>为单标的回测，输出 Trade Lifecycle 报告（每笔交易的 entry/exit/PnL/duration）。
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Event form.
// ─────────────────────────────────────────────────────────────────────────────
function EventForm({ config, patch, dark }) {
  return (
    <>
      <FieldGroup label="事件类型" hint="选择要研究的事件" dark={dark}>
        <Select value={config.eventType} onChange={(v) => patch({ eventType: v })} options={window.EVENT_TYPES} dark={dark} className="w-full" />
      </FieldGroup>

      <FieldGroup label="观察窗口 · Windows" hint="事件后多少天观察累计收益" dark={dark}>
        <ChipGroup value={config.windows} onChange={(v) => patch({ windows: v })} options={['T+1', 'T+5', 'T+10', 'T+20', 'T+60']} multi dark={dark} />
      </FieldGroup>

      <FieldGroup label="股票池 · Universe" dark={dark}>
        <Select value={config.universe} onChange={(v) => patch({ universe: v })} options={['S&P 500', 'Nasdaq 100', 'Russell 1000']} dark={dark} className="w-full" />
      </FieldGroup>

      <FieldGroup label="统计调整" hint="是否扣除基准/同业的同期收益" dark={dark}>
        <ChipGroup value={config.adjustment} onChange={(v) => patch({ adjustment: v })} options={[
          { id: 'raw', label: '原始收益' },
          { id: 'minus_benchmark', label: '减去基准' },
          { id: 'minus_sector', label: '减去同行业均值' },
        ]} dark={dark} />
      </FieldGroup>

      <FieldGroup label="样本区间" dark={dark}>
        <div className="flex items-center gap-2">
          <input type="date" value={config.dateFrom} onChange={(e) => patch({ dateFrom: e.target.value })} className={`flex-1 rounded-md border px-2.5 py-1.5 text-[12.5px] outline-none ${dark ? 'border-white/[0.08] bg-white/[0.03] text-white' : 'border-slate-200 bg-white text-slate-700'}`} />
          <span className={dark ? 'text-white/40' : 'text-slate-400'}>→</span>
          <input type="date" value={config.dateTo} onChange={(e) => patch({ dateTo: e.target.value })} className={`flex-1 rounded-md border px-2.5 py-1.5 text-[12.5px] outline-none ${dark ? 'border-white/[0.08] bg-white/[0.03] text-white' : 'border-slate-200 bg-white text-slate-700'}`} />
        </div>
      </FieldGroup>

      <div className={`mt-2 flex items-start gap-2 rounded-md border p-3 text-[12px] ${dark ? 'border-cyan-400/22 bg-cyan-500/10 text-cyan-200' : 'border-cyan-200 bg-cyan-50 text-cyan-700'}`}>
        <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" /></svg>
        <div>
          <b>Event Lab 把事件作为触发器</b> · 事件发生时自动入场，T+N 窗口结束后退出。回测先告诉你这个触发器历史上的窗口收益分布、正样本概率、样本可信度；通过验证后即可部署到 Deployed 跟踪。
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Factor form — cross-section factor DSL with G1-G10 long/short analysis.
// ─────────────────────────────────────────────────────────────────────────────
function FactorForm({ config, patch, dark }) {
  const [dslInfoOpen, setDslInfoOpen] = useStateBL(false);
  const examples = window.FACTOR_DSL_EXAMPLES || [];
  return (
    <>
      <div className={`mb-4 flex items-start gap-2 rounded-md border p-3 text-[12px] ${dark ? 'border-amber-400/22 bg-amber-500/10 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
        <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></svg>
        <div className="flex-1">
          <b>Factor 引擎</b> · DSL 仅支持 function-style：<code className="font-mono">multiply(z, 0.4)</code>、<code className="font-mono">add(...)</code>。<b>不支持中缀</b>表达式如 <code className="font-mono">0.4 * z + 0.3 * y</code>。
          <button onClick={() => setDslInfoOpen((v) => !v)} className={`ml-1 inline-flex items-center gap-0.5 font-semibold underline-offset-2 hover:underline ${dark ? 'text-amber-300' : 'text-amber-700'}`}>
            为什么？
          </button>
          {dslInfoOpen && (
            <div className={`mt-2 rounded-md p-2.5 text-[11.5px] leading-relaxed ${dark ? 'bg-amber-500/8 text-amber-100/85' : 'bg-amber-100/60 text-amber-800/95'}`}>
              function-style 让公式可解析为 AST — 这是后续做<b>因子拆解</b>（每一项对 IC 的贡献）、<b>多因子合成可视化</b>和<b>跨期对比</b>的前提。中缀表达式存在歧义且难以稳定解析，所以这里不接受。
            </div>
          )}
        </div>
      </div>

      <FieldGroup label="因子公式 · DSL" hint="cross-section, function-style only" dark={dark}>
        <div className={`rounded-md border ${dark ? 'border-white/[0.08] bg-[#0b0d12]' : 'border-slate-200 bg-slate-50/60'}`}>
          <div className={`flex items-center justify-between border-b px-3 py-1.5 text-[10.5px] font-mono ${dark ? 'border-white/[0.05] text-white/40' : 'border-slate-200 text-slate-400'}`}>
            <span>factor_dsl · function-style</span>
            <span className={dark ? 'text-emerald-300' : 'text-emerald-700'}>实时预览 → IC / ICIR / 单调性（mock）</span>
          </div>
          <textarea
            value={config.dsl}
            onChange={(e) => patch({ dsl: e.target.value })}
            rows={6}
            spellCheck={false}
            className={`w-full resize-y bg-transparent px-3 py-2.5 font-mono text-[12.5px] leading-relaxed outline-none ${dark ? 'text-white/85 placeholder:text-white/30' : 'text-slate-800 placeholder:text-slate-400'}`}
          />
        </div>

        {examples.length > 0 && (
          <div className="mt-2">
            <div className={`mb-1 text-[10.5px] font-bold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-slate-400'}`}>常用示例 — 点击替换公式</div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
              {examples.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => patch({ dsl: ex.dsl })}
                  title={ex.desc}
                  className={`group flex flex-col items-start gap-0.5 rounded-md border p-2 text-left transition-colors ${dark ? 'border-white/[0.08] bg-white/[0.02] hover:border-amber-400/30 hover:bg-amber-500/8' : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/60'}`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className={`text-[12px] font-semibold ${dark ? 'text-white/85 group-hover:text-amber-200' : 'text-slate-800'}`}>{ex.label}</span>
                    <span className={`rounded px-1 py-px text-[9px] font-bold uppercase tracking-wider ${dark ? 'bg-white/[0.06] text-white/55' : 'bg-slate-100 text-slate-500'}`}>{ex.tag}</span>
                  </div>
                  <code className={`block w-full overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[10.5px] ${dark ? 'text-amber-200/65' : 'text-amber-700/80'}`}>{ex.dsl.replace(/\n\s*/g, ' ')}</code>
                  <span className={`text-[10.5px] leading-snug ${dark ? 'text-white/40' : 'text-slate-500'}`}>{ex.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="mt-2 grid grid-cols-3 gap-2">
          <div className={`rounded-md p-2 ${dark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
            <div className={`text-[10px] font-bold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-slate-400'}`}>IC 预估</div>
            <div className={`font-mono text-[14px] font-bold tabular-nums ${dark ? 'text-amber-300' : 'text-amber-700'}`}>0.083</div>
          </div>
          <div className={`rounded-md p-2 ${dark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
            <div className={`text-[10px] font-bold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-slate-400'}`}>ICIR</div>
            <div className={`font-mono text-[14px] font-bold tabular-nums ${dark ? 'text-amber-300' : 'text-amber-700'}`}>1.25</div>
          </div>
          <div className={`rounded-md p-2 ${dark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
            <div className={`text-[10px] font-bold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-slate-400'}`}>单调性</div>
            <div className={`font-mono text-[14px] font-bold tabular-nums ${dark ? 'text-amber-300' : 'text-amber-700'}`}>82%</div>
          </div>
        </div>
      </FieldGroup>

      <FieldGroup label="股票池" dark={dark}>
        <Select value={config.universe} onChange={(v) => patch({ universe: v })} options={window.FACTOR_UNIVERSES} dark={dark} className="w-full" />
      </FieldGroup>

      <FieldGroup label="分组数 · Group count" hint="把池子按因子值切成 N 组" dark={dark}>
        <ChipGroup value={config.groupCount} onChange={(v) => patch({ groupCount: Number(v) })} options={[{ id: 5, label: '5 组（quintile）' }, { id: 10, label: '10 组（decile）' }, { id: 20, label: '20 组' }]} dark={dark} />
      </FieldGroup>

      <FieldGroup label="多空构造" dark={dark}>
        <label className={`inline-flex items-center gap-2 ${dark ? 'text-white/80' : 'text-slate-700'}`}>
          <input type="checkbox" checked={config.longShort} onChange={(e) => patch({ longShort: e.target.checked })} />
          <span className="text-[12.5px]">同时做空底部组（market-neutral L/S 组合）</span>
        </label>
      </FieldGroup>

      <FieldGroup label="调仓节奏" dark={dark}>
        <ChipGroup value={config.rebalance} onChange={(v) => patch({ rebalance: v })} options={window.REBALANCE_OPTIONS} dark={dark} />
      </FieldGroup>

      <FieldGroup label="仓位计算" dark={dark}>
        <Select value={config.sizing} onChange={(v) => patch({ sizing: v })} options={window.SIZING_OPTIONS.map((o) => ({ value: o.id, label: o.label }))} dark={dark} className="w-full" />
      </FieldGroup>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Config summary card (right side).
// ─────────────────────────────────────────────────────────────────────────────
function ConfigSummaryCard({ engine, title, config, dark }) {
  const info = window.ENGINE_INFO[engine];
  const rows = [];
  if (engine === 'screen') {
    const isTimeSeries = config.mode === 'time-series';
    rows.push(['Mode', isTimeSeries ? '时序策略' : '截面策略']);
    rows.push(['Universe', config.universe]);
    rows.push(['Conditions', `${config.conditions.length} 条`]);
    if (isTimeSeries) {
      rows.push(['Hold', `≤ ${config.holdDays} 日`]);
      rows.push(['Trail stop', `-${config.trailingStop}%`]);
    } else {
      rows.push(['Top N', `${config.topN} 只`]);
      rows.push(['Rebalance', config.rebalance]);
    }
    rows.push(['Sizing', sizingLabel(config.sizing)]);
    rows.push(['Date', `${config.dateFrom} → ${config.dateTo}`]);
  } else if (engine === 'pine') {
    rows.push(['Universe', config.universe]);
    rows.push(['Code lines', `${(config.code || '').split('\n').length} 行`]);
    rows.push(['Stop / Take', `${config.stop_loss || '—'} / ${config.take_profit || '—'}`]);
    rows.push(['Sizing', sizingLabel(config.sizing)]);
    rows.push(['Date', `${config.dateFrom} → ${config.dateTo}`]);
  } else if (engine === 'event') {
    rows.push(['Event', config.eventType]);
    rows.push(['Windows', (config.windows || []).join(' / ')]);
    rows.push(['Universe', config.universe]);
    rows.push(['Adjustment', { raw: '原始', minus_benchmark: '减去基准', minus_sector: '减去同行业' }[config.adjustment] || config.adjustment]);
    rows.push(['Date', `${config.dateFrom} → ${config.dateTo}`]);
  } else if (engine === 'factor') {
    rows.push(['Universe', config.universe + '（cross-section）']);
    rows.push(['DSL', `${(config.dsl || '').split('\n').length} 行`]);
    rows.push(['Groups', `${config.groupCount} 组`]);
    rows.push(['L/S', config.longShort ? '多空中性' : '只做多']);
    rows.push(['Rebalance', config.rebalance]);
    rows.push(['Sizing', sizingLabel(config.sizing)]);
  }

  return (
    <div className={`sticky top-5 self-start rounded-xl p-4 ${dark ? 'border border-white/[0.06] bg-white/[0.03]' : 'border border-slate-200/70 bg-white'}`}>
      <div className="mb-3 flex items-center gap-2">
        <window.EngineBadge engine={engine} dark={dark} size="sm" />
        <div className={`text-[10.5px] font-bold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-slate-400'}`}>配置摘要</div>
      </div>
      <h4 className={`mb-3 text-[14px] font-semibold leading-snug ${dark ? 'text-white' : 'text-slate-900'}`}>{title || '未命名草稿'}</h4>
      <div className="space-y-1.5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-3 text-[12px]">
            <span className={dark ? 'text-white/45' : 'text-slate-500'}>{k}</span>
            <span className={`text-right font-mono tabular-nums ${dark ? 'text-white/85' : 'text-slate-800'}`}>{String(v)}</span>
          </div>
        ))}
      </div>
      <div className={`mt-3 rounded-md p-2.5 text-[11px] leading-relaxed ${dark ? 'bg-white/[0.03] text-white/55' : 'bg-slate-50 text-slate-500'}`}>
        提交后底层调用 <b>{
          engine === 'event' ? 'EventStudyEngine' :
          engine === 'pine' ? 'TradeLifecycleEngine' :
          engine === 'screen' && config.mode === 'time-series' ? 'TradeLifecycleEngine' :
          'ActiveNavEngine' + (engine === 'factor' ? ' + FactorAnalysis' : '')
        }</b>，产出 <b>{
          info.resultType === 'study' ? 'StudyResult' :
          info.resultType === 'trade' ? 'TradeResult' :
          engine === 'screen' && config.mode === 'time-series' ? 'TradeResult' :
          'PortfolioResult'
        }</b>。
      </div>
    </div>
  );
}

function sizingLabel(id) {
  const o = (window.SIZING_OPTIONS || []).find((x) => x.id === id);
  return o ? o.label : id;
}

// ─────────────────────────────────────────────────────────────────────────────
// Backtest running overlay.
// ─────────────────────────────────────────────────────────────────────────────
function BacktestRunningOverlay({ step, dark }) {
  const steps = ['Loading data', 'Computing signals', 'Running simulation', 'Generating report'];
  return (
    <div className={`fixed inset-0 z-[80] flex items-center justify-center backdrop-blur-sm ${dark ? 'bg-[#0b0d12]/85' : 'bg-slate-900/45'}`}>
      <div className={`relative w-full max-w-md overflow-hidden rounded-2xl p-8 elev-pop ${dark ? 'border border-white/[0.06] bg-[#0d1014]' : 'bg-white'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative grid h-16 w-16 place-items-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-sky-500 opacity-30" />
            <span className="absolute inset-2 rounded-full bg-sky-500 opacity-50" />
            <svg viewBox="0 0 24 24" className="relative h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 17l6-6 4 4 8-9" /></svg>
          </div>
          <div className={`text-center text-[14px] font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>Running backtest…</div>
          <ol className="w-full space-y-1.5">
            {steps.map((s, i) => (
              <li key={s} className="flex items-center gap-2 text-[12.5px]">
                <span className={`grid h-4 w-4 place-items-center rounded-full text-[10px] font-bold ${
                  i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-sky-500 text-white animate-pulse' : (dark ? 'bg-white/10 text-white/50' : 'bg-slate-200 text-slate-400')
                }`}>{i < step ? '✓' : (i === step ? '·' : '')}</span>
                <span className={i <= step ? (dark ? 'text-white/85' : 'text-slate-700') : (dark ? 'text-white/35' : 'text-slate-400')}>{s}…</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { BuilderShell, BacktestRunningOverlay });
