// DetailPage — full-bleed strategy detail. Used for Studio drafts AND Marketplace
// strategies (when clicked from Marketplace card, future).
// Pages: Overview / Backtest / Reports / Audit.

const { useState: useStateDP, useMemo: useMemoDP, useEffect: useEffectDP, useRef: useRefDP, useCallback: useCallbackDP } = React;

function DetailPage({ strategyId, strategy: strategyProp, source, watchedData, onBack, onEdit, onDeploy, onToggleWatch, watched, dark }) {
  const looked = useMemoDP(() => window.findStrategyById ? window.findStrategyById(strategyId) : null, [strategyId]);
  const strategy = strategyProp || looked;
  const isDraft = !!strategy?.draft;
  const isDeployed = source === 'deployed';
  const isMarketplace = source === 'marketplace' || (!isDraft && !isDeployed && !strategy?.draft);
  const isMulti = strategy?.universe?.kind === 'multi';

  const sections = isDeployed ? [
    { id: 'overview',   label: 'Overview' },
    { id: 'positions',  label: 'Positions' },
    { id: 'orders',     label: 'All orders' },
    { id: 'params',     label: 'Parameters' },
    { id: 'code',       label: 'Code' },
  ] : isMarketplace ? [
    { id: 'overview', label: 'Overview' },
    { id: 'holdings', label: isMulti ? 'Current basket' : 'Holdings' },
    { id: 'trades',   label: 'Trade list' },
  ] : [
    { id: 'overview', label: 'Overview' },
    { id: 'backtest', label: 'Backtest' },
    { id: 'reports',  label: 'Reports' },
    { id: 'audit',    label: 'Audit' },
  ];

  const [activeSection, setActiveSection] = useStateDP(sections[0].id);
  const sectionRefs = useRefDP({});
  const scrollContainerRef = useRefDP(null);
  const isClickScrolling = useRefDP(false);

  useEffectDP(() => {
    const container = scrollContainerRef.current?.closest('.overflow-y-auto');
    if (!container) return;
    const handler = () => {
      if (isClickScrolling.current) return;
      const offsets = sections.map(s => {
        const el = sectionRefs.current[s.id];
        if (!el) return { id: s.id, top: Infinity };
        return { id: s.id, top: el.getBoundingClientRect().top };
      });
      const visible = offsets.filter(o => o.top <= 200);
      if (visible.length > 0) setActiveSection(visible[visible.length - 1].id);
    };
    container.addEventListener('scroll', handler, { passive: true });
    return () => container.removeEventListener('scroll', handler);
  }, [sections.map(s => s.id).join(',')]);

  const scrollTo = useCallbackDP((id) => {
    const el = sectionRefs.current[id];
    if (!el) return;
    setActiveSection(id);
    isClickScrolling.current = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => { isClickScrolling.current = false; }, 600);
  }, []);

  if (!strategy) {
    return (
      <div className="px-7 pt-5">
        <button onClick={onBack} className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-[12px] font-medium ${dark ? 'border-white/[0.08] bg-white/[0.03] text-white/80' : 'border-slate-200 bg-white text-slate-700'}`}>
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
          Back
        </button>
        <div className={`mt-6 rounded-xl p-6 text-center ${dark ? 'bg-white/[0.03] text-white/70' : 'bg-slate-50 text-slate-600'}`}>
          找不到该策略（id = {strategyId}）。
        </div>
      </div>
    );
  }

  const info = (window.ENGINE_INFO && strategy.engine && window.ENGINE_INFO[strategy.engine]) || { label: strategy.engine || '', sub: '' };

  return (
    <div ref={scrollContainerRef} className="pb-20">
      <div className="px-7 pt-5">
        <DetailHeader
          strategy={strategy} info={info}
          dark={dark} isDraft={isDraft} isMarketplace={isMarketplace} isDeployed={isDeployed}
          watchedData={watchedData}
          onBack={onBack} onEdit={onEdit} onDeploy={onDeploy}
          onToggleWatch={onToggleWatch} watched={watched}
        />
      </div>

      {/* Sticky nav bar */}
      <div className={`sticky top-0 z-10 mt-4 border-b px-7 ${dark ? 'border-white/[0.06] bg-[#0b0d12]/95' : 'border-slate-200 bg-white/95'}`} style={{ backdropFilter: 'blur(8px)' }}>
        <div className="flex items-center gap-1">
          {sections.map((s) => (
            <button key={s.id} onClick={() => scrollTo(s.id)}
              className={`relative px-3.5 py-2.5 text-[13px] font-medium transition-colors ${
                activeSection === s.id
                  ? (dark ? 'text-white' : 'text-slate-900')
                  : (dark ? 'text-white/55 hover:text-white' : 'text-slate-500 hover:text-slate-900')
              }`}>
              {s.label}
              {activeSection === s.id && <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full" style={{ background: dark ? '#0ea5e9' : '#0f172a' }} />}
            </button>
          ))}
        </div>
      </div>

      {/* All sections stacked */}
      <div className="px-7 space-y-10 pt-6">
        {isDeployed ? (
          <>
            <div ref={el => sectionRefs.current['overview'] = el} className="scroll-mt-14">
              <DeployedOverview strategy={strategy} watchedData={watchedData} dark={dark} />
            </div>
            <div ref={el => sectionRefs.current['positions'] = el} className="scroll-mt-14">
              <SectionTitle label="Positions" dark={dark} />
              <DeployedPositionsTable watchedData={watchedData} dark={dark} />
            </div>
            <div ref={el => sectionRefs.current['orders'] = el} className="scroll-mt-14">
              <SectionTitle label="All orders" dark={dark} />
              <DeployedOrdersTable strategy={strategy} dark={dark} />
            </div>
            <div ref={el => sectionRefs.current['params'] = el} className="scroll-mt-14">
              <SectionTitle label="Parameters" dark={dark} />
              <window.PreviewParams s={strategy} dark={dark} />
            </div>
            <div ref={el => sectionRefs.current['code'] = el} className="scroll-mt-14">
              <SectionTitle label="Code" dark={dark} />
              <window.PreviewCode s={strategy} dark={dark} />
            </div>
          </>
        ) : isMarketplace ? (
          <>
            <div ref={el => sectionRefs.current['overview'] = el} className="scroll-mt-14">
              <MarketplaceOverview strategy={strategy} dark={dark} />
            </div>
            <div ref={el => sectionRefs.current['holdings'] = el} className="scroll-mt-14">
              <SectionTitle label={isMulti ? 'Current basket' : 'Holdings'} dark={dark} />
              <window.PreviewHoldings s={strategy} dark={dark} isMulti={isMulti} />
            </div>
            <div ref={el => sectionRefs.current['trades'] = el} className="scroll-mt-14">
              <SectionTitle label="Trade list" dark={dark} />
              <window.PreviewTrades s={strategy} dark={dark} />
            </div>
          </>
        ) : (
          <>
            <div ref={el => sectionRefs.current['overview'] = el} className="scroll-mt-14">
              <OverviewPane strategy={strategy} dark={dark} />
            </div>
            <div ref={el => sectionRefs.current['backtest'] = el} className="scroll-mt-14">
              <SectionTitle label="Backtest" dark={dark} />
              <BacktestPane strategy={strategy} dark={dark} />
            </div>
            <div ref={el => sectionRefs.current['reports'] = el} className="scroll-mt-14">
              <SectionTitle label="Reports" dark={dark} />
              <ReportsPane strategy={strategy} dark={dark} />
            </div>
            <div ref={el => sectionRefs.current['audit'] = el} className="scroll-mt-14">
              <SectionTitle label="Audit" dark={dark} />
              <AuditPane strategy={strategy} dark={dark} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ label, dark }) {
  return (
    <div className={`mb-4 text-[16px] font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{label}</div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail header — title + actions row.
// ─────────────────────────────────────────────────────────────────────────────
function DetailHeader({ strategy, info, dark, isDraft, isMarketplace, isDeployed, watchedData, onBack, onEdit, onDeploy, onToggleWatch, watched }) {
  const backLabel = isDeployed ? 'Deployed' : isMarketplace ? 'Marketplace' : 'Studio';
  const isStopped = watchedData && watchedData.deployStatus === 'paused';
  const isLive = watchedData && watchedData.deployStatus === 'live';
  return (
    <div>
      <div className="flex items-center gap-3 pb-3">
        <button onClick={onBack} className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-[12px] font-medium ${dark ? 'border-white/[0.08] bg-white/[0.03] text-white/80 hover:bg-white/[0.08]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
          {backLabel}
        </button>
        <div className="ml-auto flex items-center gap-1.5">
          {isDraft && (
            <button onClick={() => onEdit(strategy.id)} className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-[12px] font-medium ${dark ? 'border-white/[0.08] bg-white/[0.03] text-white/80 hover:bg-white/[0.08]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4v16h16v-7M18.4 2.6a2 2 0 012.83 2.83L12 14.66 8 16l1.34-4z" /></svg>
              继续编辑
            </button>
          )}
          {isDraft && (
            <button className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-[12px] font-medium ${dark ? 'border-white/[0.08] bg-white/[0.03] text-white/80 hover:bg-white/[0.08]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
              发布到 Marketplace
            </button>
          )}
          {isMarketplace && onToggleWatch && (
            <button onClick={onToggleWatch} className={`inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-[12px] font-medium ${
              watched
                ? (dark ? 'border-white/[0.10] bg-white/8 text-white' : 'border-slate-200 bg-slate-50 text-slate-700')
                : (dark ? 'border-white/[0.10] text-white hover:bg-white/8' : 'border-slate-200 text-slate-700 hover:bg-slate-50')
            }`}>
              {watched ? '✓ Added to Activity' : '+ Add to Activity'}
            </button>
          )}
          {!isDeployed && (
            <button onClick={() => onDeploy && onDeploy(strategy)} className="inline-flex items-center gap-1 rounded-md bg-sky-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-sky-700">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M13 2L3 14h7l-1 8 10-12h-7z" /></svg>
              Deploy
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <h1 className={`text-[24px] font-semibold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`} style={{ letterSpacing: '-0.015em' }}>{strategy.name}</h1>
        {isDeployed && watchedData && (
          <span className={'rounded-full px-2 py-0.5 text-[10.5px] font-bold tracking-wider ' + (
            isStopped
              ? (dark ? 'bg-amber-400/15 text-amber-300' : 'bg-amber-50 text-amber-700')
              : isLive
              ? (dark ? 'bg-rose-400/15 text-rose-300' : 'bg-rose-50 text-rose-700')
              : (dark ? 'bg-emerald-400/15 text-emerald-300' : 'bg-emerald-50 text-emerald-700')
          )}>
            {isStopped ? 'STOPPED' : isLive ? 'LIVE' : 'RUNNING'}
          </span>
        )}
      </div>
      <p className={`mt-1.5 max-w-3xl text-[13px] leading-relaxed ${dark ? 'text-white/65' : 'text-slate-600'}`}>{strategy.blurb}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {isDeployed && watchedData && (
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${dark ? 'bg-white/8 text-white/65' : 'bg-slate-100 text-slate-600'}`}>
            Started: {watchedData.addedOn ? watchedData.addedOn.slice(0, 10) : '--'}
          </span>
        )}
        {isDeployed && watchedData && watchedData.deployAccount && (
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${dark ? 'bg-white/8 text-white/65' : 'bg-slate-100 text-slate-600'}`}>
            {watchedData.deployAccount.label} {watchedData.deployAccount.tail}
          </span>
        )}
        {strategy.universe?.label && (
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${dark ? 'bg-sky-400/15 text-sky-300' : 'bg-sky-50 text-sky-700'}`}>{strategy.universe.label}</span>
        )}
        {(strategy.tags || []).map(t => (
          <span key={t} className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${dark ? 'bg-white/8 text-white/65' : 'bg-slate-100 text-slate-600'}`}>{t}</span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Overview pane — hero stats + summary blocks.
// ─────────────────────────────────────────────────────────────────────────────
function OverviewPane({ strategy, dark }) {
  const m = strategy.metrics || {};
  const isEvent = strategy.engine === 'event';
  const stats = isEvent ? [
    { label: '事件样本数',   value: String(strategy.eventMeta?.sampleSize || 0) },
    { label: '样本可信度',   value: String(strategy.eventMeta?.credibility || 0) },
    { label: 'T+20 均值',    value: window.formatPct(strategy.eventMeta?.avgForwardReturn?.['T+20'] || 0, { sign: true }) },
    { label: 'T+20 正概率',  value: Math.round((strategy.eventMeta?.probabilityPositive?.['T+20'] || 0) * 100) + '%' },
  ] : [
    { label: 'Return 1Y',  value: window.formatPct(m.ret1Y || 0, { sign: true }), tone: (m.ret1Y || 0) >= 0 ? 'pos' : 'neg' },
    { label: 'Sharpe 1Y',  value: (m.sharpe1Y || 0).toFixed(2) },
    { label: 'Max DD',     value: window.formatPct(m.maxDD || 0), tone: 'neg' },
    { label: 'Win rate',   value: m.winRate ? (m.winRate + '%') : '—' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-lg p-3 ${dark ? 'bg-white/[0.03] border border-white/[0.06]' : 'border border-slate-200/70 bg-white'}`}>
            <div className={`text-[10.5px] font-bold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-slate-400'}`}>{s.label}</div>
            <div className={`mt-0.5 font-mono text-[20px] font-bold tabular-nums ${
              s.tone === 'pos' ? (dark ? 'text-emerald-300' : 'text-emerald-700')
              : s.tone === 'neg' ? (dark ? 'text-rose-300' : 'text-rose-700')
              : (dark ? 'text-white' : 'text-slate-900')
            }`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className={`rounded-xl p-4 ${dark ? 'bg-white/[0.03] border border-white/[0.06]' : 'border border-slate-200/70 bg-white'}`}>
          <div className={`mb-2 text-[11px] font-bold uppercase tracking-wider ${dark ? 'text-white/55' : 'text-slate-500'}`}>策略摘要</div>
          <p className={`text-[13px] leading-relaxed ${dark ? 'text-white/80' : 'text-slate-700'}`}>{strategy.blurb}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(strategy.tags || []).map((t) => (
              <span key={t} className={`rounded-full px-2 py-0.5 text-[10.5px] ${dark ? 'bg-white/[0.05] text-white/60' : 'bg-slate-100 text-slate-600'}`}>{t}</span>
            ))}
          </div>
        </div>
        <div className={`rounded-xl p-4 ${dark ? 'bg-white/[0.03] border border-white/[0.06]' : 'border border-slate-200/70 bg-white'}`}>
          <div className={`mb-2 text-[11px] font-bold uppercase tracking-wider ${dark ? 'text-white/55' : 'text-slate-500'}`}>配置</div>
          <dl className="space-y-1.5 text-[12px]">
            <DR k="Engine" v={window.ENGINE_INFO[strategy.engine]?.label || strategy.engine} dark={dark} />
            <DR k="Universe" v={strategy.universe?.label || '—'} dark={dark} />
            <DR k="调仓节奏" v={hpLabel(strategy.holdingPolicy)} dark={dark} />
            <DR k="仓位" v={(window.SIZING_OPTIONS || []).find((o) => o.id === strategy.sizingMethod)?.label || strategy.sizingMethod || '—'} dark={dark} />
            <DR k="作者" v={strategy.author?.name || '—'} dark={dark} />
            {strategy.published && <DR k="发布日期" v={strategy.published} dark={dark} />}
          </dl>
        </div>
      </div>
    </div>
  );
}
function MarketplaceOverview({ strategy, dark }) {
  const s = strategy;
  const m = s.metrics || {};
  const positive = (m.ret1Y || 0) >= 0;
  const stats = [
    { label: '1Y Return', value: `${positive ? '+' : ''}${(m.ret1Y || 0).toFixed(1)}%`, tone: positive ? 'pos' : 'neg' },
    { label: '1Y Sharpe', value: (m.sharpe1Y || 0).toFixed(2) },
    { label: 'Max DD', value: `${(m.maxDD || 0).toFixed(1)}%`, tone: 'neg' },
    { label: 'Win rate', value: m.winRate ? `${m.winRate}%` : '—' },
    { label: 'Followers', value: (m.followers || 0).toLocaleString() },
  ];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map(st => (
          <div key={st.label} className={`rounded-lg p-3 ${dark ? 'bg-white/[0.03] border border-white/[0.06]' : 'border border-slate-200/70 bg-white'}`}>
            <div className={`text-[10px] font-bold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-slate-400'}`}>{st.label}</div>
            <div className={`mt-0.5 font-mono text-[18px] font-bold tabular-nums ${
              st.tone === 'pos' ? 'text-emerald-500' : st.tone === 'neg' ? 'text-rose-500' : (dark ? 'text-white' : 'text-slate-900')
            }`}>{st.value}</div>
          </div>
        ))}
      </div>

      <div className={`rounded-lg border p-3 ${dark ? 'border-white/[0.05] bg-white/[0.03]' : 'border-slate-200 bg-white'}`}>
        <div className="mb-2 flex items-center justify-between">
          <span className={`text-[11px] font-semibold uppercase tracking-wider ${dark ? 'text-white/55' : 'text-slate-500'}`}>Cumulative net value · 120d OOS</span>
          <span className={`text-[11px] tabular-nums ${dark ? 'text-white/55' : 'text-slate-500'}`}>vs benchmark: SPY</span>
        </div>
        <EquityChart curve={s.curve} color={positive ? '#10b981' : '#ef4444'} height={160} showAxis dark={dark} />
      </div>

      <window.ReBacktestPanel strategy={s} dark={dark} />

    </div>
  );
}

function DR({ k, v, dark }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className={dark ? 'text-white/45' : 'text-slate-500'}>{k}</dt>
      <dd className={`text-right font-mono tabular-nums ${dark ? 'text-white/85' : 'text-slate-800'}`}>{v}</dd>
    </div>
  );
}
function hpLabel(hp) {
  const o = (window.HOLDING_POLICIES || []).find((x) => x.id === hp);
  return o ? o.label : (hp || '—');
}

// ─────────────────────────────────────────────────────────────────────────────
// Backtest pane — routes by resultType.
// ─────────────────────────────────────────────────────────────────────────────
function BacktestPane({ strategy, dark }) {
  const warnings = strategy.warnings || [];

  return (
    <div className="space-y-4">
      <window.ReBacktestPanel strategy={strategy} dark={dark} />

      {warnings.length > 0 && (
        <details className={`rounded-md border ${dark ? 'border-amber-400/25 bg-amber-500/10' : 'border-amber-200 bg-amber-50'}`}>
          <summary className={`cursor-pointer px-3 py-2 text-[12px] font-semibold ${dark ? 'text-amber-200' : 'text-amber-800'}`}>
            ⚠ 本次回测有 {warnings.length} 条警告
          </summary>
          <ul className={`px-3 pb-2 text-[11.5px] ${dark ? 'text-amber-200/80' : 'text-amber-700'}`}>
            {warnings.map((w, i) => <li key={i}>· <code className="font-mono">{w.kind}</code> — {w.message}</li>)}
          </ul>
        </details>
      )}

      {strategy.engine === 'screen' && (
        strategy.screenMeta?.mode === 'time-series'
          ? <window.TradeView strategy={strategy} dark={dark} />
          : <window.PortfolioView strategy={strategy} dark={dark} showGroups />
      )}
      {strategy.engine === 'factor' && <window.PortfolioView strategy={strategy} dark={dark} showFactor showGroups />}
      {strategy.engine === 'pine'  && <window.TradeView strategy={strategy} dark={dark} />}
      {strategy.engine === 'event' && <window.StudyView strategy={strategy} dark={dark} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reports pane — 4 simplified report types.
// ─────────────────────────────────────────────────────────────────────────────
function ReportsPane({ strategy, dark }) {
  const reports = strategy.engine === 'event' ? [
    { kind: 'event_study',    label: '事件研究报告',     desc: '窗口收益分布 + 样本明细 + credibility' },
    { kind: 'trade_summary',  label: '事件命中统计',     desc: '各窗口正负样本数 + 平均收益' },
  ] : strategy.engine === 'pine' ? [
    { kind: 'trade_lifecycle',label: '交易生命周期报告', desc: '每笔交易的 entry / exit / PnL / duration' },
    { kind: 'trade_summary',  label: '交易汇总报告',     desc: '胜率 / 盈亏比 / 单笔分布' },
    { kind: 'drawdown',       label: '回撤分析',         desc: '最大回撤区间 / 持续天数 / 恢复时间' },
    { kind: 'nav',            label: '净值曲线',         desc: 'Equity vs benchmark / 月度收益分布' },
  ] : [
    { kind: 'nav',            label: '净值曲线',         desc: 'Equity vs benchmark · 月度收益' },
    { kind: 'rebalance',      label: '调仓明细',         desc: '每个调仓日的入选 / 移除 + turnover' },
    { kind: 'holdings',       label: '持仓分布',         desc: '当前持仓 + 历史持仓变化' },
    { kind: 'drawdown',       label: '回撤分析',         desc: '最大回撤区间 / 风险贡献分解' },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {reports.map((r) => (
        <div key={r.kind} className={`group cursor-pointer rounded-xl p-4 transition-all elev-tile ${dark ? 'bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.14]' : 'border border-slate-200/70 bg-white hover:border-slate-300'}`}>
          <div className={`mb-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${dark ? 'bg-sky-500/15 text-sky-200' : 'bg-sky-50 text-sky-700'}`}>
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></svg>
            {r.kind}
          </div>
          <div className={`text-[14px] font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{r.label}</div>
          <p className={`mt-1 text-[12px] leading-snug ${dark ? 'text-white/55' : 'text-slate-500'}`}>{r.desc}</p>
          <div className={`mt-3 inline-flex items-center gap-1 text-[11.5px] font-semibold opacity-0 transition-opacity group-hover:opacity-100 ${dark ? 'text-sky-300' : 'text-sky-700'}`}>
            打开报告
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Audit pane — data lineage summary.
// ─────────────────────────────────────────────────────────────────────────────
function AuditPane({ strategy, dark }) {
  return (
    <div className={`rounded-xl p-5 ${dark ? 'bg-white/[0.03] border border-white/[0.06]' : 'border border-slate-200/70 bg-white'}`}>
      <div className={`mb-3 text-[11px] font-bold uppercase tracking-wider ${dark ? 'text-white/55' : 'text-slate-500'}`}>Data lineage</div>
      <dl className="space-y-1.5 text-[12.5px]">
        <DR k="数据范围" v="2018-01-01 → 2026-04-30" dark={dark} />
        <DR k="数据源" v="OHLCV (split-adjusted) + 财报基本面" dark={dark} />
        <DR k="最新更新" v="2026-05-20 03:15 UTC" dark={dark} />
        <DR k="缺失值处理" v="前向填充 ≤ 3 日，超过则剔除当日样本" dark={dark} />
        <DR k="基准" v="SPY / QQQ（按 universe 自动选择）" dark={dark} />
        {strategy.engine === 'event' && <DR k="样本数" v={String(strategy.eventMeta?.sampleSize || 0)} dark={dark} />}
        {strategy.engine === 'factor' && (
          <>
            <DR k="DSL 类型" v="function-style only" dark={dark} />
            <DR k="标准化" v="cross-section zscore" dark={dark} />
          </>
        )}
      </dl>
      <div className={`mt-4 rounded-md border p-3 text-[11.5px] ${dark ? 'border-white/[0.05] bg-white/[0.02] text-white/55' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
        所有回测均在统一数据快照上跑，确保结果可复现。完整 lineage（字段映射 / refresh 历史）可联系算法团队查看。
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Deployed detail views
// ─────────────────────────────────────────────────────────────────────────────

function DeployedOverview({ strategy, watchedData, dark }) {
  var w = watchedData || {};
  var cumPos = (w.cumPnLPct || 0) >= 0;
  var todayPos = (w.todayPnLPct || 0) >= 0;
  var stats = [
    { label: 'Cumulative', value: (cumPos ? '+' : '') + (w.cumPnLPct || 0).toFixed(2) + '%', tone: cumPos ? 'pos' : 'neg' },
    { label: 'Today', value: (todayPos ? '+' : '') + (w.todayPnLPct || 0).toFixed(2) + '%', tone: todayPos ? 'pos' : 'neg' },
    { label: 'Sharpe', value: (w.sharpe || 0).toFixed(2) },
    { label: 'Max DD', value: (w.maxDD || 0).toFixed(1) + '%', tone: 'neg' },
    { label: 'Win rate', value: (w.winRate || 0) + '%' },
  ];
  var curveData = w.curve || (strategy && strategy.curve) || [];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map(function(s) {
          return (
            <div key={s.label} className={'rounded-lg p-3 ' + (dark ? 'bg-white/[0.03] border border-white/[0.06]' : 'border border-slate-200/70 bg-white')}>
              <div className={'text-[10.5px] font-bold uppercase tracking-wider ' + (dark ? 'text-white/45' : 'text-slate-400')}>{s.label}</div>
              <div className={'mt-0.5 font-mono text-[20px] font-bold tabular-nums ' + (
                s.tone === 'pos' ? (dark ? 'text-emerald-300' : 'text-emerald-700')
                : s.tone === 'neg' ? (dark ? 'text-rose-300' : 'text-rose-700')
                : (dark ? 'text-white' : 'text-slate-900')
              )}>{s.value}</div>
            </div>
          );
        })}
      </div>

      <div className={'rounded-lg border p-3 ' + (dark ? 'border-white/[0.05] bg-white/[0.03]' : 'border-slate-200 bg-white')}>
        <div className="mb-2 flex items-center justify-between">
          <span className={'text-[11px] font-semibold uppercase tracking-wider ' + (dark ? 'text-white/55' : 'text-slate-500')}>Equity curve</span>
          <span className={'text-[11px] tabular-nums ' + (dark ? 'text-white/55' : 'text-slate-500')}>Day {w.runDays || 0} | Capital ${(w.capital || 0).toLocaleString()}</span>
        </div>
        <EquityChart curve={curveData} color={cumPos ? '#10b981' : '#ef4444'} height={160} showAxis dark={dark} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={'rounded-xl p-4 ' + (dark ? 'bg-white/[0.03] border border-white/[0.06]' : 'border border-slate-200/70 bg-white')}>
          <div className={'mb-2 text-[11px] font-bold uppercase tracking-wider ' + (dark ? 'text-white/55' : 'text-slate-500')}>Run info</div>
          <dl className="space-y-1.5 text-[12px]">
            <DR k="Status" v={w.deployStatus === 'paused' ? 'Stopped' : w.deployStatus === 'live' ? 'Live' : 'Running (Paper)'} dark={dark} />
            <DR k="Started" v={w.addedOn ? w.addedOn.slice(0, 10) : '--'} dark={dark} />
            <DR k="Run days" v={String(w.runDays || 0)} dark={dark} />
            <DR k="Account" v={w.deployAccount ? (w.deployAccount.label + ' ' + w.deployAccount.tail) : '--'} dark={dark} />
            <DR k="Capital" v={'$' + (w.capital || 0).toLocaleString()} dark={dark} />
            <DR k="Trades" v={String(w.trades || 0)} dark={dark} />
          </dl>
        </div>
        <div className={'rounded-xl p-4 ' + (dark ? 'bg-white/[0.03] border border-white/[0.06]' : 'border border-slate-200/70 bg-white')}>
          <div className={'mb-2 text-[11px] font-bold uppercase tracking-wider ' + (dark ? 'text-white/55' : 'text-slate-500')}>Strategy config</div>
          <dl className="space-y-1.5 text-[12px]">
            <DR k="Engine" v={(window.ENGINE_INFO && window.ENGINE_INFO[strategy.engine]) ? window.ENGINE_INFO[strategy.engine].label : (strategy.engine || '--')} dark={dark} />
            <DR k="Universe" v={strategy.universe ? strategy.universe.label : '--'} dark={dark} />
            <DR k="Author" v={strategy.author ? strategy.author.name : '--'} dark={dark} />
          </dl>
        </div>
      </div>
    </div>
  );
}

function DeployedPositionsTable({ watchedData, dark }) {
  var positions = (watchedData && watchedData.positions) || [];
  var denom = (watchedData && watchedData.capital) || 0;
  if (positions.length === 0) {
    return (
      <div className={'rounded-xl border px-6 py-10 text-center ' + (dark ? 'border-white/[0.05] bg-white/[0.02]' : 'border-slate-200/70 bg-white')}>
        <div className={'text-[13px] ' + (dark ? 'text-white/50' : 'text-slate-400')}>No open positions</div>
      </div>
    );
  }
  return (
    <div className={'overflow-hidden rounded-xl border ' + (dark ? 'border-white/[0.05] bg-[#0f1218]' : 'border-slate-200/70 bg-white')}>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead className={dark ? 'bg-white/[0.03] text-white/45' : 'bg-slate-50 text-slate-400'}>
            <tr>
              <th className="px-4 py-2 text-left font-medium">Symbol</th>
              <th className="py-2 text-left font-medium">Side</th>
              <th className="py-2 text-right font-medium">Qty</th>
              <th className="py-2 text-right font-medium">Weight</th>
              <th className="py-2 text-right font-medium">Avg cost</th>
              <th className="py-2 text-right font-medium">Mark</th>
              <th className="py-2 text-right font-medium">Unrealized</th>
              <th className="px-4 py-2 text-right font-medium">%</th>
            </tr>
          </thead>
          <tbody className={dark ? 'text-white/85' : 'text-slate-700'}>
            {positions.map(function(p, i) {
              var pos = (p.unreal || 0) >= 0;
              var weight = denom > 0 ? (p.mktValue / denom) * 100 : 0;
              return (
                <tr key={p.symbol + '-' + i} className={'border-t ' + (dark ? 'border-white/5' : 'border-slate-100')}>
                  <td className="px-4 py-2.5 font-semibold tabular-nums">{p.symbol}</td>
                  <td className="py-2.5">
                    <span className={'text-[11px] font-semibold uppercase tracking-wider ' + (p.side === 'short' ? 'text-rose-500' : 'text-emerald-500')}>{p.side}</span>
                  </td>
                  <td className="py-2.5 text-right tabular-nums">{p.qty}</td>
                  <td className="py-2.5 text-right tabular-nums">{weight.toFixed(1)}%</td>
                  <td className="py-2.5 text-right tabular-nums">${Number(p.avg).toFixed(2)}</td>
                  <td className="py-2.5 text-right tabular-nums">${Number(p.last).toFixed(2)}</td>
                  <td className={'py-2.5 text-right tabular-nums font-medium ' + (pos ? 'text-emerald-500' : 'text-rose-500')}>
                    {pos ? '+' : ''}{window.fmtUSD ? window.fmtUSD(p.unreal) : ('$' + Math.abs(p.unreal || 0).toFixed(2))}
                  </td>
                  <td className={'px-4 py-2.5 text-right tabular-nums ' + (pos ? 'text-emerald-500/80' : 'text-rose-500/80')}>
                    {pos ? '+' : ''}{(p.pct || 0).toFixed(2)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DeployedOrdersTable({ strategy, dark }) {
  var [page, setPage] = useStateDP(0);
  var PAGE_SIZE = 10;
  var all = useMemoDP(function() {
    return window.makeTradesForStrategy ? window.makeTradesForStrategy(strategy) : [];
  }, [strategy.id]);
  var totalPages = Math.ceil(all.length / PAGE_SIZE);
  var start = page * PAGE_SIZE;
  var visible = all.slice(start, start + PAGE_SIZE);

  if (all.length === 0) {
    return (
      <div className={'rounded-xl border px-6 py-10 text-center ' + (dark ? 'border-white/[0.05] bg-white/[0.02]' : 'border-slate-200/70 bg-white')}>
        <div className={'text-[13px] ' + (dark ? 'text-white/50' : 'text-slate-400')}>No orders yet</div>
      </div>
    );
  }

  return (
    <div className={'overflow-hidden rounded-xl border ' + (dark ? 'border-white/[0.05] bg-[#0f1218]' : 'border-slate-200/70 bg-white')}>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead className={dark ? 'bg-white/[0.03] text-white/45' : 'bg-slate-50 text-slate-400'}>
            <tr>
              <th className="px-4 py-2 text-left font-medium">Date</th>
              <th className="py-2 text-left font-medium">Symbol</th>
              <th className="py-2 text-left font-medium">Side</th>
              <th className="py-2 text-right font-medium">Qty</th>
              <th className="py-2 text-right font-medium">Price</th>
              <th className="px-4 py-2 text-right font-medium">Realized P&amp;L</th>
            </tr>
          </thead>
          <tbody className={dark ? 'text-white/85' : 'text-slate-700'}>
            {visible.map(function(t, i) {
              return (
                <tr key={start + i} className={'border-t ' + (dark ? 'border-white/5' : 'border-slate-100')}>
                  <td className="px-4 py-2 tabular-nums">{t.at}</td>
                  <td className="py-2 font-medium">{t.sym}</td>
                  <td className="py-2">
                    <span className={'text-[11px] font-semibold ' + (t.side === 'BUY' ? 'text-emerald-500' : 'text-rose-500')}>{t.side}</span>
                  </td>
                  <td className="py-2 text-right tabular-nums">{t.qty}</td>
                  <td className="py-2 text-right tabular-nums">${t.px}</td>
                  <td className={'px-4 py-2 text-right tabular-nums ' + (t.pnl == null ? (dark ? 'text-white/40' : 'text-slate-400') : Number(t.pnl) >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
                    {t.pnl == null ? '—' : (Number(t.pnl) >= 0 ? '+' : '') + '$' + Math.abs(Number(t.pnl)).toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className={'flex items-center justify-between border-t px-4 py-2 ' + (dark ? 'border-white/[0.05]' : 'border-slate-100')}>
          <span className={'text-[11px] tabular-nums ' + (dark ? 'text-white/45' : 'text-slate-400')}>
            {start + 1}-{Math.min(start + PAGE_SIZE, all.length)} of {all.length} orders
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={function() { setPage(function(p) { return Math.max(0, p - 1); }); }}
              disabled={page === 0}
              className={'rounded-md px-2 py-1 text-[11px] font-medium ' + (page === 0 ? (dark ? 'text-white/20 cursor-not-allowed' : 'text-slate-300 cursor-not-allowed') : (dark ? 'text-white/70 hover:bg-white/8' : 'text-slate-600 hover:bg-slate-100'))}
            >
              Prev
            </button>
            <span className={'px-1.5 text-[11px] tabular-nums ' + (dark ? 'text-white/60' : 'text-slate-500')}>{page + 1} / {totalPages}</span>
            <button
              onClick={function() { setPage(function(p) { return Math.min(totalPages - 1, p + 1); }); }}
              disabled={page >= totalPages - 1}
              className={'rounded-md px-2 py-1 text-[11px] font-medium ' + (page >= totalPages - 1 ? (dark ? 'text-white/20 cursor-not-allowed' : 'text-slate-300 cursor-not-allowed') : (dark ? 'text-white/70 hover:bg-white/8' : 'text-slate-600 hover:bg-slate-100'))}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { DetailPage });
