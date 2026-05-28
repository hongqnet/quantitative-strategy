// AimeClaw chat block renderers — text bubbles, strategy cards, paper/live config, refine, finale.

const { useState: useStateB, useMemo: useMemoB } = React;

function AssistantBubbleA({ children, bare }) {
  return (
    <div className="flex gap-2.5" style={{ animation: 'aimeclaw-fade-up 0.3s ease-out' }}>
      {!bare && (
        <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm shadow-sm"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
          🤖
        </div>
      )}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function TextBlockA({ body, tone, dark }) {
  return (
    <AssistantBubbleA>
      <div className={`rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-[13.5px] leading-relaxed ${dark ? 'bg-white/[0.04] text-white/85' : 'bg-slate-50 text-slate-700'}`}>
        <window.RichTextA text={body} dark={dark} />
        {tone === 'greeting' && (
          <div className={`mt-1.5 text-[11px] font-medium ${dark ? 'text-white/45' : 'text-slate-400'}`}>
            ✨ I work best when you let me run a strategy live, but no pressure.
          </div>
        )}
      </div>
    </AssistantBubbleA>
  );
}

function QuickRepliesA({ replies, dark }) {
  const aime = window.useAimeClaw();
  return (
    <div className="ml-9 flex flex-wrap gap-1.5">
      {replies.map((r) => (
        <button
          key={r.label}
          onClick={() => {
            if (r.action === 'advance') aime.advance();
            else aime.pushToast('info', 'Got it — keep clicking Next ▸ when you’re ready.');
          }}
          className={`rounded-full border px-3 py-1 text-[12px] transition-colors ${dark ? 'border-white/[0.06] bg-white/[0.04] text-white/80 hover:bg-white/[0.08]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

function AlgorithmDialogA({ strategy, triggerLabel, triggerClass, dark, iconOnly }) {
  const [open, setOpen] = useStateB(false);
  if (!strategy) return null;
  const defaultTrigger = dark
    ? 'inline-flex h-8 items-center gap-1 rounded-md border border-white/[0.06] bg-white/[0.04] px-2.5 text-[12px] font-medium text-white/80 hover:bg-white/[0.08]'
    : 'inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50';
  const iconOnlyCls = dark
    ? 'grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white/[0.05] text-white/70 transition-colors hover:bg-white/[0.10] hover:text-white'
    : 'grid h-8 w-8 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800';
  if (iconOnly) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className={iconOnlyCls}
          title="View strategy logic"
          aria-label="View strategy logic"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/></svg>
        </button>
        <window.ModalShellA open={open} onClose={() => setOpen(false)} maxWidth={460} dark={dark}>
          <div className="space-y-3 p-5">
            <div className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${dark ? 'bg-sky-500/15 text-sky-200' : 'bg-sky-50 text-sky-700'}`}>
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
              Strategy logic · {strategy.symbol}
            </div>
            <h2 className={`text-[18px] font-semibold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>{strategy.name}</h2>
            <p className={`text-[12.5px] ${dark ? 'text-white/55' : 'text-slate-500'}`}>
              Plain-English breakdown of every rule the strategy fires on. No black boxes.
            </p>
            <window.FlowchartSVGA diagram={strategy.algorithm} dark={dark} />
          </div>
        </window.ModalShellA>
      </>
    );
  }
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={triggerClass || defaultTrigger}
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/></svg>
        {triggerLabel || 'View logic'}
        <svg viewBox="0 0 24 24" className="h-3 w-3 opacity-60" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </button>
      <window.ModalShellA open={open} onClose={() => setOpen(false)} maxWidth={460} dark={dark}>
        <div className="space-y-3 p-5">
          <div className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${dark ? 'bg-sky-500/15 text-sky-200' : 'bg-sky-50 text-sky-700'}`}>
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
            Strategy logic · {strategy.symbol}
          </div>
          <h2 className={`text-[18px] font-semibold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>{strategy.name}</h2>
          <p className={`text-[12.5px] ${dark ? 'text-white/55' : 'text-slate-500'}`}>
            Plain-English breakdown of every rule the strategy fires on. No black boxes.
          </p>
          <window.FlowchartSVGA diagram={strategy.algorithm} dark={dark} />
        </div>
      </window.ModalShellA>
    </>
  );
}

function StrategyCardListA({ ids, dark }) {
  return (
    <div className="space-y-2.5">
      {ids.map((id, i) => (
        <div key={id} style={{ animation: `aimeclaw-fade-up 0.32s ease-out ${0.08 + i * 0.1}s both` }}>
          <StrategyCardA id={id} dark={dark} />
        </div>
      ))}
    </div>
  );
}

function StrategyCardA({ id, tier, highlightRefined, dark }) {
  const strategy = window.getAimeStrategy(id);
  const aime = window.useAimeClaw();
  if (!strategy) return null;

  let effectiveTier = tier || 'base';
  if (!tier && highlightRefined && id === 'btc-macd-momentum' && aime.state.refined && strategy.refinedMetrics) {
    effectiveTier = 'refined';
  }
  const m = effectiveTier === 'refined' && strategy.refinedMetrics ? strategy.refinedMetrics : strategy.metrics;
  const curve = effectiveTier === 'refined' && strategy.refinedEquityCurve ? strategy.refinedEquityCurve : strategy.equityCurve;
  const isActive = aime.state.activeStrategyId === id;
  const addedKey = effectiveTier === 'refined' ? id + '-refined' : id;
  const added = !!aime.state.addedToLive[addedKey];

  return (
    <div className={`overflow-hidden rounded-xl elev-tile ${dark ? 'bg-white/[0.04]' : 'border border-slate-200/70 bg-white'}`}>
      <div className="flex items-start gap-2 px-3.5 pt-3.5 pb-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <window.SymbolPill symbol={strategy.symbol} dark={dark} />
            <h3 className={`truncate text-[14px] font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{strategy.name}</h3>
            {effectiveTier === 'refined' && (
              <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide ${dark ? 'bg-sky-500/15 text-sky-200' : 'bg-sky-100 text-sky-700'}`}>
                <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="currentColor"><path d="M12 2l2.39 5.86L20 8.94l-4 4.07.94 5.99L12 16.27 7.06 19l.94-5.99-4-4.07 5.61-1.08z"/></svg>
                Refined
              </span>
            )}
          </div>
          <p className={`mt-1 text-[12px] leading-snug ${dark ? 'text-white/55' : 'text-slate-500'}`}>{strategy.oneLiner}</p>
        </div>
        <AlgorithmDialogA strategy={strategy} dark={dark} iconOnly />
      </div>

      <div className="px-3.5">
        <div className={`flex items-end justify-between gap-3 rounded-lg p-2.5 ${dark ? 'bg-emerald-500/10' : 'bg-emerald-50/60'}`}>
          <div className="flex items-baseline gap-1.5">
            <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 ${dark ? 'text-emerald-400' : 'text-emerald-600'}`} fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 17l6-6 4 4 8-9"/><path d="M21 7v4h-4"/></svg>
            <span className={`font-mono text-[16px] font-bold ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}>{window.formatPct(m.totalPnLPct, { sign: true })}</span>
            <span className={`text-[10px] uppercase tracking-wide ${dark ? 'text-white/40' : 'text-slate-400'}`}>90-day backtest</span>
          </div>
          <div className="h-12 w-32">
            <window.MiniEquityCurveA data={curve} height={48} />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2">
          <window.MetricStatA label="Win" value={`${m.winRatePct}%`} dark={dark} />
          <window.MetricStatA label="Max DD" value={window.formatPct(m.maxDDPct)} tone="neg" dark={dark} />
          <window.MetricStatA label="PF" value={m.profitFactor.toFixed(2)} dark={dark} />
          <window.MetricStatA label="Trades" value={String(m.totalTrades)} dark={dark} />
        </div>
      </div>

      <div className="flex items-center gap-2 px-3.5 pb-3.5 pt-3">
        {added ? (
          <button
            onClick={aime.navigateToWatch}
            className={`inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md text-[12px] font-semibold transition-colors ${dark
              ? 'bg-emerald-500/12 text-emerald-300 hover:bg-emerald-500/20'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
            title="Open in Strategy · Activity"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12l5 5 9-11"/></svg>
            Added · Open
            <svg viewBox="0 0 24 24" className="h-3 w-3 opacity-70" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
        ) : (
          <button
            onClick={() => aime.addToLive(id, { tier: effectiveTier })}
            className={`inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-md text-[12px] font-medium transition-colors ${dark
              ? 'bg-white/[0.05] text-white/80 hover:bg-white/[0.10] hover:text-white'
              : 'border border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700'}`}
          >
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14"/></svg>
            Add to Activity
          </button>
        )}
        <button
          onClick={() => aime.runOnChart(isActive ? null : id)}
          className={`inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-md px-3 text-[12px] font-semibold text-white transition-colors ${isActive ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'}`}
          title={isActive ? 'Click again to stop' : 'Run this strategy on the chart'}
        >
          {isActive ? (
            <>
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
              Stop
            </>
          ) : (
            <>
              Run on chart
              <svg viewBox="0 0 24 24" className="h-3 w-3 opacity-80" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function ChartCommentaryA({ strategyId, dark }) {
  const aime = window.useAimeClaw();
  const strategy = window.getAimeStrategy(strategyId);
  if (!strategy) return null;
  const buys = strategy.signals.filter((s) => s.type === 'buy').length;
  const sells = strategy.signals.filter((s) => s.type === 'sell').length;
  const triggerCls = dark
    ? 'inline-flex h-8 w-full items-center justify-center gap-1 rounded-md border border-white/[0.06] bg-white/[0.04] px-3 text-[12px] font-semibold text-white/85 hover:bg-white/[0.08]'
    : 'inline-flex h-8 w-full items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 hover:bg-slate-50';

  return (
    <AssistantBubbleA>
      <div className={`rounded-2xl rounded-tl-sm p-3.5 shadow-sm ${dark ? 'bg-white/[0.04]' : 'border border-slate-200 bg-white'}`}>
        <div className="flex items-center justify-between">
          <div className={`text-[11px] font-bold uppercase tracking-wide ${dark ? 'text-white/45' : 'text-slate-400'}`}>Chart overlay</div>
          <button onClick={() => aime.runOnChart(strategyId)} className={`text-[11px] font-semibold hover:underline ${dark ? 'text-sky-300' : 'text-sky-700'}`}>
            Re-run on chart →
          </button>
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <div className={`rounded-lg p-2.5 ${dark ? 'bg-emerald-500/10' : 'border border-emerald-200 bg-emerald-50/60'}`}>
            <div className={`flex items-center gap-1.5 ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}>
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 19V5M6 11l6-6 6 6"/></svg>
              <span className="text-[10px] font-bold uppercase tracking-wide">Buys</span>
            </div>
            <div className={`mt-0.5 font-mono text-[16px] font-bold ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}>{buys}</div>
          </div>
          <div className={`rounded-lg p-2.5 ${dark ? 'bg-rose-500/12' : 'border border-rose-200 bg-rose-50/60'}`}>
            <div className={`flex items-center gap-1.5 ${dark ? 'text-rose-300' : 'text-rose-700'}`}>
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M6 13l6 6 6-6"/></svg>
              <span className="text-[10px] font-bold uppercase tracking-wide">Sells</span>
            </div>
            <div className={`mt-0.5 font-mono text-[16px] font-bold ${dark ? 'text-rose-300' : 'text-rose-700'}`}>{sells}</div>
          </div>
        </div>
        <div className="mt-3">
          <AlgorithmDialogA
            strategy={strategy}
            triggerLabel="See the rules under the hood →"
            triggerClass={triggerCls}
            dark={dark}
          />
        </div>
      </div>
    </AssistantBubbleA>
  );
}

function PaperConfigCardA({ strategyId, dark }) {
  const aime = window.useAimeClaw();
  const dep = aime.state.deployments.find((d) => d.kind === 'paper' && d.strategyId === strategyId);
  const [capital, setCapital] = useStateB(aime.state.paperCapital);
  const [leverage, setLeverage] = useStateB(aime.state.paperLeverage);
  const running = !!dep;

  function commit() {
    aime.setPaperConfig(capital, leverage);
    aime.startPaper(strategyId, { capital, leverage });
  }

  return (
    <AssistantBubbleA bare>
      <div className={`overflow-hidden rounded-xl elev-tile ${dark ? 'bg-white/[0.04]' : 'border border-slate-200/70 bg-white'}`}>
        <div className={`flex items-center gap-2 border-b px-3.5 py-2.5 ${dark ? 'border-white/[0.05] bg-white/[0.02]' : 'border-slate-100 bg-slate-50/60'}`}>
          <svg viewBox="0 0 24 24" className={`h-4 w-4 ${dark ? 'text-cyan-300' : 'text-indigo-500'}`} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 3v6l-4 7a4 4 0 003.46 6h7.08A4 4 0 0019 16l-4-7V3M8 3h8"/></svg>
          <span className={`text-[13.5px] font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>Paper trading setup</span>
          <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${dark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>Risk-free</span>
        </div>
        <div className="space-y-4 p-3.5">
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <span className={`text-[11.5px] font-semibold ${dark ? 'text-white/70' : 'text-slate-500'}`}>Starting capital</span>
              <span className={`font-mono text-[15px] font-bold tabular-nums ${dark ? 'text-white' : 'text-slate-900'}`}>{window.formatUSD(capital)}</span>
            </div>
            <input
              type="range"
              min={1000} max={50000} step={500}
              value={capital}
              disabled={running}
              onChange={(e) => setCapital(Number(e.target.value))}
              className="w-full accent-sky-500"
            />
            <div className={`mt-1 flex justify-between text-[10px] ${dark ? 'text-white/40' : 'text-slate-400'}`}><span>$1k</span><span>$50k</span></div>
          </div>
          <div>
            <div className={`mb-2 text-[11.5px] font-semibold ${dark ? 'text-white/70' : 'text-slate-500'}`}>Leverage</div>
            <div className="flex gap-1.5">
              {[1, 2, 3].map((lev) => (
                <button
                  key={lev}
                  disabled={running}
                  onClick={() => setLeverage(lev)}
                  className={`flex-1 rounded-md border px-2 py-1.5 text-[13px] font-semibold transition-colors ${leverage === lev
                    ? (dark ? 'border-sky-400/25 bg-sky-500/15 text-sky-200' : 'border-sky-400 bg-sky-50 text-sky-700')
                    : (dark ? 'border-white/[0.06] bg-white/[0.04] text-white/55 hover:bg-white/[0.08]' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50')}`}
                >
                  {lev}×
                </button>
              ))}
            </div>
            <p className={`mt-1.5 text-[11px] ${dark ? 'text-white/40' : 'text-slate-400'}`}>Recommended: <strong className={dark ? 'text-white/85' : 'text-slate-700'}>2×</strong> for momentum strategies on majors.</p>
          </div>

          {running ? (
            <div className="space-y-2">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] ${dark ? 'bg-emerald-500/12' : 'border border-emerald-200 bg-emerald-50'}`}>
                <svg viewBox="0 0 24 24" className={`h-4 w-4 ${dark ? 'text-emerald-300' : 'text-emerald-600'}`} fill="none" stroke="currentColor" strokeWidth="2.4"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>
                <span className={`flex-1 font-medium ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}>Paper trade is live — I’ll watch the strategy and ping you on closes.</span>
              </div>
              <button
                onClick={aime.navigateToActivity}
                className={`inline-flex w-full items-center justify-center gap-1 rounded-md px-3 py-1.5 text-[12px] font-semibold ${dark ? 'bg-sky-500/12 text-sky-200 hover:bg-sky-500/20' : 'border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100'}`}
              >
                Watch it in Deployed
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </button>
              <button
                onClick={() => aime.stopPaper(strategyId)}
                className={`inline-flex w-full items-center justify-center gap-1 rounded-md px-3 py-1.5 text-[11.5px] font-medium ${dark ? 'text-rose-300 hover:bg-rose-500/15' : 'border border-rose-100 text-rose-600 hover:bg-rose-50'}`}
              >
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
                Stop paper trade
              </button>
            </div>
          ) : (
            <button onClick={commit} className="inline-flex h-9 w-full items-center justify-center gap-1 rounded-md bg-sky-600 text-[13px] font-semibold text-white hover:bg-sky-700">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><polygon points="7 4 21 12 7 20 7 4"/></svg>
              Start paper trade
            </button>
          )}
        </div>
      </div>
    </AssistantBubbleA>
  );
}

function HyperliquidConfigCardA({ strategyId, variant, dark }) {
  const aime = window.useAimeClaw();
  const dep = aime.state.deployments.find((d) => d.kind === 'live' && d.strategyId === strategyId);
  const live = !!dep;
  const [key, setKey] = useStateB('');

  return (
    <AssistantBubbleA bare>
      <div className={`overflow-hidden rounded-xl elev-tile ${dark ? 'bg-white/[0.04]' : 'border border-slate-200/70 bg-white'}`}>
        <div className={`flex items-center gap-2 border-b px-3.5 py-2.5 ${dark ? 'border-white/[0.05] bg-violet-500/12' : 'border-slate-100 bg-gradient-to-r from-purple-50 to-indigo-50'}`}>
          <svg viewBox="0 0 24 24" className={`h-4 w-4 ${dark ? 'text-violet-300' : 'text-purple-600'}`} fill="currentColor"><path d="M13 2L3 14h7l-1 8 10-12h-7z"/></svg>
          <span className={`text-[13.5px] font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{variant === 'final' ? 'Go live on Hyperliquid' : 'Connect Hyperliquid'}</span>
          <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${dark ? 'bg-violet-500/20 text-violet-200' : 'bg-purple-100 text-purple-700'}`}>Real money</span>
        </div>
        <div className="space-y-3 p-3.5">
          {live ? (
            <>
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2.5 ${dark ? 'bg-emerald-500/12' : 'border border-emerald-200 bg-emerald-50'}`}>
                <svg viewBox="0 0 24 24" className={`h-4 w-4 ${dark ? 'text-emerald-300' : 'text-emerald-600'}`} fill="none" stroke="currentColor" strokeWidth="2.4"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>
                <div className="text-[13px]">
                  <div className={`font-semibold ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}>Connected ⚡</div>
                  <div className={dark ? 'text-[11.5px] text-emerald-300/80' : 'text-[11.5px] text-emerald-700/80'}>Strategy is live with ${dep.capital.toLocaleString()} notional. I’ll DM you on every fill.</div>
                </div>
              </div>
              <button
                onClick={aime.navigateToActivity}
                className={`inline-flex w-full items-center justify-center gap-1 rounded-md px-3 py-1.5 text-[12px] font-semibold ${dark ? 'bg-sky-500/12 text-sky-200 hover:bg-sky-500/20' : 'border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100'}`}
              >
                Watch it in Deployed
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </button>
              <button
                onClick={() => aime.stopLive(strategyId)}
                className={`inline-flex w-full items-center justify-center gap-1 rounded-md px-3 py-1.5 text-[11.5px] font-medium ${dark ? 'text-rose-300 hover:bg-rose-500/15' : 'border border-rose-100 text-rose-600 hover:bg-rose-50'}`}
              >
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
                Disconnect Hyperliquid
              </button>
            </>
          ) : (
            <>
              <div>
                <label className={`mb-1.5 block text-[11px] font-semibold ${dark ? 'text-white/70' : 'text-slate-500'}`}>
                  <svg viewBox="0 0 24 24" className="mr-1 inline-block h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-9.6 9.6M15.5 7.5l1 1M11 11l2 2M11 11a4 4 0 11-5.66 5.66L3 19l2 2 2.34-2.34A4 4 0 0011 11z"/></svg>
                  Hyperliquid API key
                </label>
                <input
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="0x… your wallet API key"
                  className={`w-full rounded-md border px-2.5 py-1.5 font-mono text-[11.5px] outline-none ${dark ? 'border-white/[0.06] bg-white/[0.04] text-white placeholder:text-white/30 focus:border-sky-400/40' : 'border-slate-200 bg-white focus:border-sky-300'}`}
                />
                <p className={`mt-1 text-[11px] ${dark ? 'text-white/40' : 'text-slate-400'}`}>Read-only + trade scope is enough. We never see your withdrawal key.</p>
              </div>
              <button
                onClick={() => aime.startLive(strategyId, { capital: 1000, leverage: 2 })}
                disabled={!key}
                className="inline-flex h-9 w-full items-center justify-center gap-1 rounded-md bg-sky-600 text-[13px] font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {key ? (
                  <>
                    Connect & deploy
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                  </>
                ) : 'Paste a key to continue'}
              </button>
              <div className={`flex items-center gap-3 border-t pt-3 text-[11px] ${dark ? 'border-white/[0.05]' : 'border-slate-100'}`}>
                <a href="#" onClick={(e) => e.preventDefault()} className={`inline-flex items-center gap-1 font-medium hover:underline ${dark ? 'text-sky-300' : 'text-sky-700'}`}>
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 4h6v6M10 14L20 4M19 13v6H5V5h6"/></svg>
                  Register on Hyperliquid
                </a>
                <span className={dark ? 'text-white/25' : 'text-slate-300'}>·</span>
                <a href="#" onClick={(e) => e.preventDefault()} className={`inline-flex items-center gap-1 font-medium ${dark ? 'text-white/55 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h11a3 3 0 013 3v14H7a3 3 0 01-3-3z"/></svg>
                  How to create an API key
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </AssistantBubbleA>
  );
}

function SwitchToLivePromptA({ strategyId, dark }) {
  return (
    <div className="space-y-2">
      <div className="ml-9 flex flex-wrap gap-1.5 text-[12px]">
        <SwitchChip label="⚡ Switch to live" dark={dark} />
        <SwitchChip label="🟢 Keep paper trading" dark={dark} />
      </div>
      <HyperliquidConfigCardA strategyId={strategyId} dark={dark} />
    </div>
  );
}

function SwitchChip({ label, dark }) {
  return (
    <button className={`rounded-full border px-3 py-1 text-[12px] ${dark ? 'border-white/[0.06] bg-white/[0.04] text-white/75 hover:bg-white/[0.08]' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{label}</button>
  );
}

function PnLPushBlockA({ strategyId, tradePnL, tradePct, cumulativePnL, cumulativePct, daysElapsed, dark }) {
  const strategy = window.getAimeStrategy(strategyId);
  if (!strategy) return null;
  const slice = strategy.equityCurve.slice(0, Math.max(20, Math.round(daysElapsed * 1.5)));
  return (
    <AssistantBubbleA bare>
      <div className={`overflow-hidden rounded-xl elev-tile ${dark ? 'bg-white/[0.04] ring-1 ring-emerald-400/15' : 'border border-emerald-200 bg-white'}`}>
        <div className={`flex items-center gap-2 border-b px-3.5 py-2 ${dark ? 'border-emerald-400/10 bg-emerald-500/12' : 'border-emerald-100 bg-gradient-to-r from-emerald-50 to-emerald-100/40'}`}>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60"/>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"/>
          </span>
          <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 ${dark ? 'text-emerald-300' : 'text-emerald-700'}`} fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M14 21h-4"/></svg>
          <span className={`text-[11px] font-bold uppercase tracking-wide ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}>aime push · paper trading</span>
          <span className={`ml-auto inline-flex items-center gap-1 text-[10px] ${dark ? 'text-emerald-300/80' : 'text-emerald-700/80'}`}>
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>
            Day {daysElapsed}
          </span>
        </div>
        <div className="space-y-3 p-3.5">
          <div className={`text-[13.5px] leading-relaxed ${dark ? 'text-white/85' : 'text-slate-700'}`}>
            📈 Your <strong className={dark ? 'text-white' : 'text-slate-900'}>BTC MACD</strong> just closed a winning long. Want a recap?
          </div>
          <div className="grid grid-cols-2 gap-2">
            <PnLStat label="Last trade" big={window.formatPct(tradePct, { sign: true, digits: 2 })} sub={window.formatUSD(tradePnL, { sign: true })} dark={dark} />
            <PnLStat label={`Cumulative · ${daysElapsed}d`} big={window.formatPct(cumulativePct, { sign: true, digits: 2 })} sub={window.formatUSD(cumulativePnL, { sign: true })} dark={dark} />
          </div>
          <div className={`rounded-lg p-2 ${dark ? 'bg-emerald-500/8' : 'border border-emerald-100 bg-emerald-50/40'}`}>
            <div className={`mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}>
              <span className="flex items-center gap-1">
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 17l6-6 4 4 8-9"/></svg>
                Paper equity
              </span>
              <span className="font-mono">+{cumulativePct.toFixed(2)}%</span>
            </div>
            <window.MiniEquityCurveA data={slice} height={48} color={dark ? '#34d399' : '#059669'} />
          </div>
        </div>
      </div>
    </AssistantBubbleA>
  );
}

function PnLStat({ label, big, sub, dark }) {
  return (
    <div className={`rounded-md p-2 ${dark ? 'bg-white/[0.04]' : 'border border-emerald-100 bg-white'}`}>
      <div className={`text-[10px] uppercase tracking-wide ${dark ? 'text-white/40' : 'text-slate-400'}`}>{label}</div>
      <div className={`mt-0.5 font-mono text-[16px] font-bold tabular-nums ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}>{big}</div>
      <div className={`text-[11px] tabular-nums ${dark ? 'text-emerald-300/80' : 'text-emerald-700/80'}`}>{sub}</div>
    </div>
  );
}

function RefineCardA({ strategyId, costCredits, dark }) {
  const aime = window.useAimeClaw();
  const strategy = window.getAimeStrategy(strategyId);
  if (!strategy) return null;
  const refined = aime.state.refined;
  const canAfford = aime.state.credits >= costCredits;

  return (
    <AssistantBubbleA bare>
      <div className={`overflow-hidden rounded-xl elev-tile ${dark ? 'bg-white/[0.04]' : 'border border-slate-200/70 bg-white'}`}>
        <div className={`flex items-center gap-2 border-b px-3.5 py-2.5 ${dark ? 'border-white/[0.05] bg-gradient-to-r from-sky-500/10 to-cyan-500/10' : 'border-slate-100 bg-gradient-to-r from-sky-50 to-cyan-50'}`}>
          <svg viewBox="0 0 24 24" className={`h-4 w-4 ${dark ? 'text-sky-300' : 'text-sky-600'}`} fill="currentColor"><path d="M12 2l2.39 5.86L20 8.94l-4 4.07.94 5.99L12 16.27 7.06 19l.94-5.99-4-4.07 5.61-1.08z"/></svg>
          <span className={`text-[13.5px] font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>Refine for current vol regime</span>
          <span className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${dark ? 'bg-sky-500/15 text-sky-200' : 'bg-sky-100 text-sky-700'}`}>
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor"><path d="M13 2L3 14h7l-1 8 10-12h-7z"/></svg>
            {costCredits} credits
          </span>
        </div>
        <div className="space-y-3 p-3.5">
          <p className={`text-[12px] leading-relaxed ${dark ? 'text-white/60' : 'text-slate-500'}`}>
            I'll train <strong className={dark ? 'text-white' : 'text-slate-900'}>12 parameter variants</strong> on current market regime, pick the best on out-of-sample data, and re-run the backtest.
          </p>

          <RefineBeforeAfter strategy={strategy} refined={refined} dark={dark} />

          {refined ? (
            <div className={`rounded-lg px-3 py-2.5 ${dark ? 'bg-emerald-500/12' : 'border border-emerald-200 bg-emerald-50'}`}>
              <div className={`text-[12.5px] font-semibold ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}>✨ Refined — strategy is now smarter about current vol.</div>
              <div className={`mt-0.5 text-[11.5px] ${dark ? 'text-emerald-300/80' : 'text-emerald-700/80'}`}>
                Win rate {strategy.metrics.winRatePct}% → {strategy.refinedMetrics?.winRatePct}%, max DD {window.formatPct(strategy.metrics.maxDDPct)} → {window.formatPct(strategy.refinedMetrics?.maxDDPct || 0)}.
              </div>
            </div>
          ) : (
            <button
              onClick={() => aime.refineStrategy(strategyId, costCredits)}
              disabled={!canAfford}
              className="inline-flex h-9 w-full items-center justify-center gap-1 rounded-md bg-sky-600 text-[13px] font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M12 2l2.39 5.86L20 8.94l-4 4.07.94 5.99L12 16.27 7.06 19l.94-5.99-4-4.07 5.61-1.08z"/></svg>
              Refine — costs {costCredits} credits
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
          )}
        </div>
      </div>
    </AssistantBubbleA>
  );
}

function RefineBeforeAfter({ strategy, refined, dark }) {
  if (!strategy.refinedMetrics || !strategy.refinedEquityCurve) return null;
  return (
    <div className="grid grid-cols-2 gap-2">
      <RefineSidePanel title="Current" m={strategy.metrics} curve={strategy.equityCurve} muted={refined} dark={dark} />
      <RefineSidePanel title="After refine" m={strategy.refinedMetrics} curve={strategy.refinedEquityCurve} highlight={refined} dark={dark} />
    </div>
  );
}

function RefineSidePanel({ title, m, curve, muted, highlight, dark }) {
  const borderBg = highlight
    ? (dark ? 'bg-sky-500/12' : 'border border-sky-300 bg-sky-50/60')
    : (dark ? 'bg-white/[0.04]' : 'border border-slate-200 bg-white');
  return (
    <div
      className={`rounded-lg p-2 transition-opacity ${borderBg}`}
      style={{ opacity: muted ? 0.45 : 1 }}
    >
      <div className={`mb-1 text-[10px] font-bold uppercase tracking-wide ${dark ? 'text-white/45' : 'text-slate-400'}`}>{title}</div>
      <div className={`font-mono text-[16px] font-bold ${dark ? 'text-emerald-300' : 'text-emerald-600'}`}>{window.formatPct(m.totalPnLPct, { sign: true })}</div>
      <div className={`mt-0.5 text-[10px] ${dark ? 'text-white/45' : 'text-slate-400'}`}>WR {m.winRatePct}% · DD {window.formatPct(m.maxDDPct)}</div>
      <window.MiniEquityCurveA data={curve} height={36} color={highlight ? '#0ea5e9' : (dark ? '#64748b' : '#94a3b8')} />
    </div>
  );
}

function OptimizationShowcaseA({ dark }) {
  const aime = window.useAimeClaw();
  const strategy = window.getAimeStrategy('btc-macd-momentum');
  if (!strategy || !strategy.refinedMetrics) return null;
  const before = strategy.metrics;
  const after = strategy.refinedMetrics;
  const paperRefined = aime.state.deployments.find((d) => d.kind === 'paper' && d.strategyId === 'btc-macd-momentum' && d.tier === 'refined');
  const liveRefined = aime.state.deployments.find((d) => d.kind === 'live' && d.strategyId === 'btc-macd-momentum' && d.tier === 'refined');

  return (
    <div className="space-y-2.5" style={{ animation: 'aimeclaw-fade-up 0.35s ease-out' }}>
      <div className={`flex items-center gap-1.5 pl-1 text-[12px] font-semibold ${dark ? 'text-sky-300' : 'text-sky-700'}`}>
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M12 2l2.39 5.86L20 8.94l-4 4.07.94 5.99L12 16.27 7.06 19l.94-5.99-4-4.07 5.61-1.08z"/></svg>
        Refined version is live in Strategy — configure it here:
      </div>
      <div className={`rounded-2xl p-2 elev-tile ${dark ? 'bg-gradient-to-br from-sky-500/10 via-white/[0.03] to-white/[0.03]' : 'border border-sky-200/70 bg-gradient-to-br from-sky-50/60 via-white to-white'}`}>
        <StrategyCardA id="btc-macd-momentum" tier="refined" dark={dark} />
        <div className={`mt-2 rounded-lg border border-dashed p-3 ${dark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-slate-200 bg-white/80'}`}>
          <div className={`text-center text-[10px] font-bold uppercase tracking-wide ${dark ? 'text-white/45' : 'text-slate-400'}`}>Re-trained on current vol regime</div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <DeltaA label="P&L" before={before.totalPnLPct} after={after.totalPnLPct} dark={dark} />
            <DeltaA label="Win" before={before.winRatePct} after={after.winRatePct} dark={dark} />
            <DeltaA label="Max DD" before={before.maxDDPct} after={after.maxDDPct} lowerIsBetter dark={dark} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => aime.redeployPaperRefined('btc-macd-momentum')}
              className={`inline-flex h-9 items-center justify-center gap-1 rounded-md border px-2 text-[12px] font-semibold ${dark ? 'border-white/[0.06] bg-white/[0.04] text-white/85 hover:bg-white/[0.08]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 019-9 9 9 0 016.5 2.7L21 8M21 3v5h-5M21 12a9 9 0 01-9 9 9 9 0 01-6.5-2.7L3 16M3 21v-5h5"/></svg>
              {paperRefined ? 'Re-run paper · Refined' : 'Configure paper trading'}
            </button>
            <button
              onClick={() => aime.pushLiveRefined('btc-macd-momentum')}
              className="inline-flex h-9 items-center justify-center gap-1 rounded-md bg-sky-600 text-[12px] font-semibold text-white hover:bg-sky-700"
            >
              {liveRefined ? (
                <>
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>
                  Push Refined to live
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M13 2L3 14h7l-1 8 10-12h-7z"/></svg>
                  Configure live
                  <svg viewBox="0 0 24 24" className="h-3 w-3 opacity-80" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </>
              )}
            </button>
          </div>
          <p className={`mt-2 text-center text-[10.5px] leading-snug ${dark ? 'text-white/45' : 'text-slate-400'}`}>Same risk caps as before — leverage and notional carry over from your existing config.</p>
        </div>
      </div>
    </div>
  );
}

function DeltaA({ label, before, after, lowerIsBetter, dark }) {
  const fmt = (v) => v.toFixed(1) + '%';
  const better = lowerIsBetter ? after > before : after > before;
  return (
    <div className={`rounded-md px-2 py-1.5 ${dark ? 'bg-white/[0.04]' : 'bg-slate-50'}`}>
      <div className={`text-[9px] font-bold uppercase tracking-wide ${dark ? 'text-white/45' : 'text-slate-400'}`}>{label}</div>
      <div className="mt-0.5 flex items-center justify-center gap-1 font-mono text-[11px]">
        <span className={`line-through ${dark ? 'text-white/40' : 'text-slate-400'}`}>{fmt(before)}</span>
        <svg viewBox="0 0 24 24" className={`h-2.5 w-2.5 ${dark ? 'text-white/40' : 'text-slate-400'}`} fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        <span className={better ? (dark ? 'font-bold text-emerald-300' : 'font-bold text-emerald-600') : (dark ? 'font-bold text-white' : 'font-bold text-slate-900')}>{fmt(after)}</span>
      </div>
    </div>
  );
}

function FinaleBlockA({ dark }) {
  const aime = window.useAimeClaw();
  const strategy = window.getAimeStrategy('btc-macd-momentum');
  if (!strategy) return null;
  const tierData = aime.state.refined && strategy.refinedMetrics ? { name: 'Refined', m: strategy.refinedMetrics } : { name: 'Base', m: strategy.metrics };
  const livePresent = aime.state.deployments.some((d) => d.kind === 'live');
  const paperPresent = aime.state.deployments.some((d) => d.kind === 'paper');
  const recap = [
    { key: 'discover', label: 'Picked BTC MACD off the strategy menu', done: true },
    { key: 'paper', label: 'Paper-traded for 14 days · +6.12% / +$612', done: paperPresent || aime.state.stage >= 3 },
    { key: 'refine', label: 'Refined for current vol · WR 62% → 71%, DD trimmed to -4.9%', done: aime.state.refined },
  ];

  return (
    <AssistantBubbleA bare>
      <div className={`overflow-hidden rounded-xl elev-tile ${dark ? 'bg-white/[0.04] ring-1 ring-sky-400/15' : 'border border-sky-200/70 bg-white'}`}>
        <div className={`flex items-center gap-1.5 border-b px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider ${dark ? 'border-sky-400/10 bg-sky-500/10 text-sky-200' : 'border-sky-100 bg-sky-50/60 text-sky-700'}`}>
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor"><path d="M12 2l2.39 5.86L20 8.94l-4 4.07.94 5.99L12 16.27 7.06 19l.94-5.99-4-4.07 5.61-1.08z"/></svg>
          Wrap-up · {tierData.name} BTC MACD ready
        </div>
        <div className="space-y-1 px-3.5 pt-3">
          <div className={`text-[13.5px] font-semibold leading-snug ${dark ? 'text-white' : 'text-slate-900'}`}>Here's where we landed.</div>
          <p className={`text-[12px] leading-relaxed ${dark ? 'text-white/60' : 'text-slate-500'}`}>
            Backtest jumped from <span className={`font-mono font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>+18.4%</span> to <span className={`font-mono font-semibold ${dark ? 'text-emerald-300' : 'text-emerald-600'}`}>{window.formatPct(tierData.m.totalPnLPct, { sign: true })}</span> after the refine. Paper account is up <span className={`font-mono font-semibold ${dark ? 'text-emerald-300' : 'text-emerald-600'}`}>+6.12%</span> in 14 days. The strategy is doing exactly what it should.
          </p>
        </div>
        <div className="px-3.5 py-2.5">
          <ul className="space-y-1">
            {recap.map((step) => (
              <li key={step.key} className="flex items-start gap-1.5">
                <svg viewBox="0 0 24 24" className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${step.done ? (dark ? 'text-emerald-300' : 'text-emerald-600') : (dark ? 'text-white/25' : 'text-slate-300')}`} fill="none" stroke="currentColor" strokeWidth="2.4"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>
                <span className={`text-[12px] leading-snug ${step.done ? (dark ? 'text-white/85' : 'text-slate-700') : (dark ? 'text-white/35 line-through' : 'text-slate-400 line-through')}`}>{step.label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className={`grid grid-cols-3 border-y px-3.5 py-2.5 text-center ${dark ? 'border-white/[0.04] bg-white/[0.02]' : 'border-slate-100 bg-slate-50/50'}`}>
          <FinaleCell label="Backtest" value={window.formatPct(tierData.m.totalPnLPct, { sign: true })} sub={`vs +${strategy.metrics.totalPnLPct.toFixed(1)}%`} dark={dark} />
          <FinaleCell label="Win rate" value={`${tierData.m.winRatePct}%`} sub={`vs ${strategy.metrics.winRatePct}%`} dark={dark} />
          <FinaleCell label="Max DD" value={window.formatPct(tierData.m.maxDDPct)} sub={`vs ${window.formatPct(strategy.metrics.maxDDPct)}`} dark={dark} />
        </div>
        <div className="space-y-3 px-3.5 py-3">
          <div className={`text-[11.5px] leading-relaxed ${dark ? 'text-white/80' : 'text-slate-700'}`}>
            <span className={`font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>One move left.</span> Connect Hyperliquid and the {tierData.name.toLowerCase()} strategy goes from paper to real flow. Same risk caps, same notional.
          </div>
          <button
            onClick={aime.navigateToWatch}
            className={`inline-flex w-full items-center justify-center gap-1 rounded-md px-3 py-1.5 text-[12px] font-semibold ${dark ? 'bg-sky-500/12 text-sky-200 hover:bg-sky-500/20' : 'border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100'}`}
          >
            Manage from Strategy · Activity
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
          {!livePresent && <HyperliquidConfigCardA strategyId="btc-macd-momentum" variant="final" dark={dark} />}
        </div>
        <button onClick={aime.restart} className={`flex w-full items-center justify-center gap-1 border-t py-1.5 text-[10.5px] ${dark ? 'border-white/[0.04] bg-white/[0.02] text-white/45 hover:bg-white/[0.04] hover:text-white/70' : 'border-slate-100 bg-slate-50/30 text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>
          <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 12a9 9 0 019-9 9 9 0 016.5 2.7L21 8M21 3v5h-5"/></svg>
          Or restart the demo to try a different path
        </button>
      </div>
    </AssistantBubbleA>
  );
}

function FinaleCell({ label, value, sub, dark }) {
  return (
    <div>
      <div className={`text-[9px] font-bold uppercase tracking-wide ${dark ? 'text-white/45' : 'text-slate-400'}`}>{label}</div>
      <div className={`mt-0.5 font-mono text-[14px] font-bold tabular-nums ${dark ? 'text-emerald-300' : 'text-emerald-600'}`}>{value}</div>
      <div className={`text-[10px] tabular-nums ${dark ? 'text-white/45' : 'text-slate-400'}`}>{sub}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Quant build flow blocks
// ─────────────────────────────────────────────────────────────────────────────
function QuantIntentBlockA({ options, dark }) {
  const aime = window.useAimeClaw();
  return (
    <div className="ml-9 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
      {options.map((o) => {
        const info = window.ENGINE_INFO[o.engine];
        return (
          <button
            key={o.id}
            onClick={() => {
              aime.setQuantIntent(o);
              aime.advance();
            }}
            className={`group flex flex-col gap-1 rounded-lg border p-2.5 text-left transition-colors ${dark ? 'border-white/[0.08] bg-white/[0.04] hover:border-white/[0.18] hover:bg-white/[0.07]' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'}`}
          >
            <div className="flex items-center gap-1.5">
              <span className={`text-[14px] ${dark ? 'text-white' : 'text-slate-900'}`}>{o.label}</span>
              {info && <window.EngineBadge engine={o.engine} dark={dark} size="xs" />}
            </div>
            <div className={`text-[11px] ${dark ? 'text-white/55' : 'text-slate-500'}`}>{o.detail}</div>
          </button>
        );
      })}
    </div>
  );
}

function EngineRecommendBlockA({ dark }) {
  const aime = window.useAimeClaw();
  const intent = aime.state.quantIntent;
  const [pickerOpen, setPickerOpen] = useStateB(false);
  if (!intent) return null;
  const info = window.ENGINE_INFO[intent.engine];
  const reasons = {
    screen: ['你想"按指标筛选"，Screener 引擎是最直接的工具', '指标条件 + Top N + 月度调仓，逻辑透明可解释', '回测产出组合净值 + 持仓明细，可直接 Deploy 部署'],
    pine:   ['Pine 是单标的代码策略，TradingView 用户直接复用', '可配置止损 / 止盈 / 手续费 / 滑点', '输出每笔交易的 entry/exit/PnL，量化老炮儿最爱'],
    event:  ['事件研究是"提问"型工具：这事发生后股价怎么动？', 'aime 自动跑 T+1/5/10/20 四个窗口 + 样本可信度', '验证有效后可部署：事件触发自动入场、窗口期结束退出'],
    factor: ['Factor 引擎做截面排名 + 多空组合', 'aime 会跑 G1-G10 分组单调性 + IC/ICIR 诊断', '量化研究员视角，输出可投研的截面回测'],
  }[intent.engine] || [];

  // Pull the same 4 intent options from the QUANT_BUILD_FLOW seed, minus the
  // one the user is currently looking at, so '换一个想法' actually offers
  // alternatives instead of resetting the conversation.
  const allOptions = (window.QUANT_BUILD_FLOW?.[0]?.blocks || [])
    .find((b) => b.type === 'quantIntent')?.payload?.options || [];
  const altOptions = allOptions.filter((o) => o.id !== intent.id);

  return (
    <AssistantBubbleA bare>
      <div className={`overflow-hidden rounded-xl elev-tile ${dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'border border-slate-200 bg-white'}`}>
        <div className={`flex items-center gap-2 border-b px-3.5 py-2.5 ${dark ? 'border-white/[0.05] bg-white/[0.02]' : 'border-slate-100 bg-slate-50/60'}`}>
          <span className={`text-[10.5px] font-bold uppercase tracking-wider ${dark ? 'text-white/55' : 'text-slate-500'}`}>aime 推荐</span>
          <window.EngineBadge engine={intent.engine} dark={dark} size="sm" variant="full" />
        </div>
        <div className="space-y-3 p-3.5">
          <p className={`text-[12.5px] leading-relaxed ${dark ? 'text-white/85' : 'text-slate-700'}`}>
            根据你的想法 <b>{intent.label}</b>，我推荐用 <b>{info?.label}</b> 引擎。
          </p>
          <ul className="space-y-1">
            {reasons.map((r, i) => (
              <li key={i} className={`flex items-start gap-1.5 text-[12px] ${dark ? 'text-white/75' : 'text-slate-600'}`}>
                <svg viewBox="0 0 24 24" className={`mt-0.5 h-3 w-3 shrink-0 ${dark ? 'text-emerald-300' : 'text-emerald-600'}`} fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12l5 5 9-11" /></svg>
                <span>{r}</span>
              </li>
            ))}
          </ul>
          <div className="flex gap-2 pt-1">
            <button onClick={aime.advance} className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-sky-600 px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-sky-700">
              用 {info?.label} 引擎
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
            <button
              onClick={() => setPickerOpen((v) => !v)}
              className={`inline-flex items-center justify-center gap-1 rounded-md border px-3 py-1.5 text-[12px] font-medium ${
                pickerOpen
                  ? (dark ? 'border-sky-400/30 bg-sky-500/15 text-sky-200' : 'border-sky-300 bg-sky-50 text-sky-700')
                  : (dark ? 'border-white/[0.08] bg-white/[0.03] text-white/80 hover:bg-white/[0.08]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50')
              }`}
            >
              {pickerOpen ? '收起' : '换一个想法'}
            </button>
          </div>

          {pickerOpen && altOptions.length > 0 && (
            <div className={`mt-1 rounded-md border p-2.5 ${dark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-slate-200 bg-slate-50/50'}`}>
              <div className={`mb-1.5 text-[10.5px] font-bold uppercase tracking-wider ${dark ? 'text-white/50' : 'text-slate-500'}`}>看看这些方向</div>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {altOptions.map((o) => {
                  const altInfo = window.ENGINE_INFO[o.engine];
                  return (
                    <button
                      key={o.id}
                      onClick={() => { aime.setQuantIntent(o); setPickerOpen(false); }}
                      className={`group flex flex-col gap-1 rounded-md border p-2 text-left transition-colors ${dark ? 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.18] hover:bg-white/[0.06]' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[12.5px] font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{o.label}</span>
                        {altInfo && <window.EngineBadge engine={o.engine} dark={dark} size="xs" />}
                      </div>
                      <div className={`text-[10.5px] leading-snug ${dark ? 'text-white/55' : 'text-slate-500'}`}>{o.detail}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </AssistantBubbleA>
  );
}

function QuantConfigPreviewBlockA({ dark }) {
  const aime = window.useAimeClaw();
  const intent = aime.state.quantIntent;
  if (!intent) return null;
  const rows = ({
    screen: [
      ['Universe', 'S&P 500'],
      ['Conditions', '1-month return > 0 · top quartile by RS'],
      ['Top N', '10 只'],
      ['Rebalance', '月度'],
      ['Sizing', '等权'],
    ],
    pine: [
      ['Universe', 'BTC'],
      ['Code', '20-line strategy (MACD + volume filter)'],
      ['Risk', '止损 -3% · 手续费 0.04% · 滑点 0.02%'],
      ['Sizing', '固定百分比 100%'],
    ],
    event: [
      ['Event', '财报超预期（surprise > 0）'],
      ['Windows', 'T+1 / T+5 / T+10 / T+20'],
      ['Universe', 'S&P 500'],
      ['Adjustment', '减去基准（SPY）'],
    ],
    factor: [
      ['Universe', 'Russell 1000（cross-section）'],
      ['DSL', 'multiply(zscore(return_1m), -1)'],
      ['Groups', '10 组（decile）'],
      ['L/S', '多空中性（long G10 / short G1）'],
      ['Rebalance', '月度'],
    ],
  })[intent.engine] || [];

  return (
    <AssistantBubbleA bare>
      <div className={`overflow-hidden rounded-xl elev-tile ${dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'border border-slate-200 bg-white'}`}>
        <div className={`flex items-center gap-2 border-b px-3.5 py-2.5 ${dark ? 'border-white/[0.05] bg-white/[0.02]' : 'border-slate-100 bg-slate-50/60'}`}>
          <window.EngineBadge engine={intent.engine} dark={dark} size="xs" />
          <span className={`text-[12px] font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>aime 起草的配置</span>
        </div>
        <div className="p-3.5 space-y-1.5">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-3 text-[12px]">
              <span className={dark ? 'text-white/45' : 'text-slate-500'}>{k}</span>
              <span className={`flex items-center gap-1 text-right font-mono tabular-nums ${dark ? 'text-white/85' : 'text-slate-800'}`}>
                {v}
                <button title="改一下" className={`opacity-0 transition-opacity hover:opacity-100 ${dark ? 'text-white/55 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}>
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4v16h16v-7M18.4 2.6a2 2 0 012.83 2.83L12 14.66 8 16l1.34-4z" /></svg>
                </button>
              </span>
            </div>
          ))}
        </div>
        <div className={`flex gap-2 border-t p-3 ${dark ? 'border-white/[0.05]' : 'border-slate-100'}`}>
          <button onClick={aime.advance} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-sky-700">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><polygon points="7 4 21 12 7 20 7 4" /></svg>
            Run backtest
          </button>
        </div>
      </div>
    </AssistantBubbleA>
  );
}

function BacktestRunningBlockA({ dark }) {
  const aime = window.useAimeClaw();
  const [step, setStep] = useStateB(0);
  const stepNames = ['Loading data', 'Computing signals', 'Running simulation', 'Generating report'];

  React.useEffect(() => {
    let s = 0;
    const id = setInterval(() => {
      s++;
      setStep(s);
      if (s >= stepNames.length) {
        clearInterval(id);
        setTimeout(() => aime.advance(), 500);
      }
    }, 700);
    return () => clearInterval(id);
  }, []);

  return (
    <AssistantBubbleA bare>
      <div className={`overflow-hidden rounded-xl elev-tile ${dark ? 'bg-white/[0.04] border border-white/[0.06]' : 'border border-slate-200 bg-white'}`}>
        <div className="flex items-center gap-3 p-3.5">
          <div className="relative grid h-10 w-10 shrink-0 place-items-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-sky-500 opacity-25" />
            <span className="absolute inset-1.5 rounded-full bg-sky-500 opacity-50" />
            <svg viewBox="0 0 24 24" className="relative h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 17l6-6 4 4 8-9" /></svg>
          </div>
          <div className="flex-1">
            <div className={`text-[12.5px] font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>Running backtest…</div>
            <ol className="mt-1 space-y-0.5">
              {stepNames.map((s, i) => (
                <li key={s} className="flex items-center gap-1.5 text-[11.5px]">
                  <span className={`grid h-3 w-3 place-items-center rounded-full text-[8px] font-bold ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-sky-500 text-white animate-pulse' : (dark ? 'bg-white/10 text-white/50' : 'bg-slate-200 text-slate-400')}`}>{i < step ? '✓' : ''}</span>
                  <span className={i <= step ? (dark ? 'text-white/85' : 'text-slate-700') : (dark ? 'text-white/35' : 'text-slate-400')}>{s}…</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </AssistantBubbleA>
  );
}

function BacktestResultCardA({ dark }) {
  const aime = window.useAimeClaw();
  const intent = aime.state.quantIntent;
  if (!intent) return null;
  const info = window.ENGINE_INFO[intent.engine];
  const saved = !!aime.state.quantSavedDraftId;
  const seed = (intent.id || 'x').charCodeAt(0);
  const m = intent.engine === 'event'
    ? { topLabel: 'T+20 平均收益', topValue: '+1.4%', topTone: 'pos',
        cells: [['样本数', '2,840'], ['正样本概率', '64%'], ['可信度', '86']] }
    : {
        topLabel: '1Y Return', topValue: `+${(15 + seed % 18).toFixed(1)}%`, topTone: 'pos',
        cells: [['Sharpe', (1.6 + (seed % 9) * 0.1).toFixed(2)], ['Max DD', `-${(4 + seed % 6).toFixed(1)}%`], ['Win rate', `${58 + (seed % 12)}%`]],
      };

  const symbolLabel = ({ screen: 'SPX', pine: 'BTC', event: 'S&P 500', factor: 'R1000' })[intent.engine];
  const name = ({
    screen: 'aime · S&P 500 Momentum Top 10',
    pine:   'aime · BTC MACD Momentum',
    event:  'aime · Earnings Drift T+20',
    factor: 'aime · 1M Reversal Factor',
  })[intent.engine] || 'aime draft';

  function handleSave() {
    aime.saveQuantDraft({
      id: 'draft-aime-' + Math.random().toString(36).slice(2, 7),
      name,
      symbol: symbolLabel,
      market: intent.engine === 'pine' ? 'Crypto' : 'US Equity',
      universe: { kind: intent.engine === 'factor' ? 'cross-section' : (intent.engine === 'pine' ? 'single' : 'index'), label: ({ screen: 'S&P 500', pine: 'BTC', event: 'S&P 500', factor: 'Russell 1000' })[intent.engine] },
      author: { name: 'aime', org: 'aime draft', avatarColor: '#7c3aed' },
      blurb: 'Generated via aime quant build flow.',
      tags: ['aime', 'Draft'],
      metrics: { ret1Y: 15 + seed % 18, sharpe1Y: 1.6 + (seed % 9) * 0.1, maxDD: -(4 + seed % 6), cagr5Y: 0, winRate: 58 + (seed % 12), trades: 0, followers: 0 },
      curve: window.seededWalk(seed * 7, 120, 0.22, 0.36, 0),
      published: null,
      aiMatch: 0,
      engine: intent.engine,
      resultType: info?.resultType || 'portfolio',
      draft: true,
      draftStatus: 'backtested',
    });
  }

  return (
    <AssistantBubbleA bare>
      <div className={`overflow-hidden rounded-xl elev-tile ${dark ? 'bg-white/[0.04] ring-1 ring-emerald-400/15 border border-white/[0.06]' : 'border border-emerald-200 bg-white'}`}>
        <div className={`flex items-center gap-2 border-b px-3.5 py-2.5 ${dark ? 'border-emerald-400/10 bg-emerald-500/10' : 'border-emerald-100 bg-emerald-50/60'}`}>
          <window.EngineBadge engine={intent.engine} dark={dark} size="xs" />
          <span className={`text-[12px] font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>回测完成 ✨</span>
        </div>
        <div className="p-3.5">
          <div className={`mb-3 rounded-lg p-3 ${dark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
            <div className={`text-[10.5px] font-bold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-slate-400'}`}>{m.topLabel}</div>
            <div className={`mt-0.5 font-mono text-[22px] font-bold tabular-nums ${m.topTone === 'pos' ? (dark ? 'text-emerald-300' : 'text-emerald-700') : (dark ? 'text-rose-300' : 'text-rose-700')}`}>{m.topValue}</div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {m.cells.map(([k, v]) => (
              <div key={k} className={`rounded-md p-2 ${dark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
                <div className={`text-[9.5px] font-bold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-slate-400'}`}>{k}</div>
                <div className={`mt-0.5 font-mono text-[13.5px] font-bold tabular-nums ${dark ? 'text-white' : 'text-slate-900'}`}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div className={`flex flex-wrap gap-2 border-t p-3 ${dark ? 'border-white/[0.05]' : 'border-slate-100'}`}>
          {saved ? (
            <button onClick={aime.navigateToStudio} className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-semibold ${dark ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/22' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12l5 5 9-11" /></svg>
              已保存 · 去 Studio
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          ) : (
            <button onClick={handleSave} className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-[12.5px] font-semibold ${dark ? 'border-white/[0.08] bg-white/[0.03] text-white/85 hover:bg-white/[0.08]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-7H5v7M5 3v4h12V3" /></svg>
              保存为草稿
            </button>
          )}
          {info?.deployable && (
            <button className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-sky-700">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M13 2L3 14h7l-1 8 10-12h-7z" /></svg>
              立即 Deploy
            </button>
          )}
        </div>
        <button onClick={aime.restart} className={`flex w-full items-center justify-center gap-1 border-t py-1.5 text-[10.5px] ${dark ? 'border-white/[0.04] bg-white/[0.02] text-white/45 hover:bg-white/[0.04] hover:text-white/70' : 'border-slate-100 bg-slate-50/30 text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>
          <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 12a9 9 0 019-9 9 9 0 016.5 2.7L21 8M21 3v5h-5" /></svg>
          重新开始
        </button>
      </div>
    </AssistantBubbleA>
  );
}

// Dispatcher
function BlockRendererA({ block, dark }) {
  switch (block.type) {
    case 'text':              return <TextBlockA body={block.payload.body} tone={block.payload.tone} dark={dark} />;
    case 'quickReplies':      return <QuickRepliesA replies={block.payload.replies} dark={dark} />;
    case 'strategyCards':     return <StrategyCardListA ids={block.payload.ids} dark={dark} />;
    case 'chartCommentary':   return <ChartCommentaryA strategyId={block.payload.strategyId} dark={dark} />;
    case 'paperConfig':       return <PaperConfigCardA strategyId={block.payload.strategyId} dark={dark} />;
    case 'pnlPush':           return <PnLPushBlockA {...block.payload} dark={dark} />;
    case 'switchToLivePrompt':return <SwitchToLivePromptA strategyId={block.payload.strategyId} dark={dark} />;
    case 'refine':            return <RefineCardA strategyId={block.payload.strategyId} costCredits={block.payload.costCredits} dark={dark} />;
    case 'finale':            return <FinaleBlockA dark={dark} />;
    case 'quantIntent':       return <QuantIntentBlockA options={block.payload.options} dark={dark} />;
    case 'engineRecommend':   return <EngineRecommendBlockA dark={dark} />;
    case 'quantConfigPreview':return <QuantConfigPreviewBlockA dark={dark} />;
    case 'backtestRunning':   return <BacktestRunningBlockA dark={dark} />;
    case 'backtestResultCard':return <BacktestResultCardA dark={dark} />;
    default:                  return null;
  }
}

Object.assign(window, {
  AssistantBubbleA, TextBlockA, QuickRepliesA, StrategyCardA, StrategyCardListA,
  ChartCommentaryA, PaperConfigCardA, HyperliquidConfigCardA, SwitchToLivePromptA,
  PnLPushBlockA, RefineCardA, OptimizationShowcaseA, FinaleBlockA, AlgorithmDialogA,
  QuantIntentBlockA, EngineRecommendBlockA, QuantConfigPreviewBlockA,
  BacktestRunningBlockA, BacktestResultCardA,
  BlockRendererA,
});
