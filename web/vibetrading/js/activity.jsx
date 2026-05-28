// Activity tab — execution view across every deployed strategy.
// Top: aggregate KPI strip · account filter chips
// Middle: open positions table (cross-strategy)
// Bottom: per-strategy run cards with trades log and Stop & close

const { useState: useStateAc, useMemo: useMemoAc } = React;

function ActivityTab({ dark, onManage, onPause, onPreview, onDeploy }) {
  var [ver, setVer] = useStateAc(0);
  var [stopTarget, setStopTarget] = useStateAc(null);
  var [removeConfirm, setRemoveConfirm] = useStateAc(null);

  var allDeployed = useMemoAc(
    function() {
      return window.WATCHED_STRATEGIES.filter(
        function(w) { return w.deployStatus === 'paper' || w.deployStatus === 'live' || w.deployStatus === 'paused'; }
      );
    },
    [ver]
  );

  var active = allDeployed.filter(function(w) { return w.deployStatus === 'paper' || w.deployStatus === 'live'; });
  var stopped = allDeployed.filter(function(w) { return w.deployStatus === 'paused'; });

  var accounts = useMemoAc(function() {
    var seen = new Map();
    active.forEach(function(w) {
      var acc = w.deployAccount;
      if (!acc) return;
      var key = acc.kind + ':' + acc.tail;
      if (!seen.has(key)) seen.set(key, { ...acc, key: key, deployments: [] });
      seen.get(key).deployments.push(w);
    });
    return Array.from(seen.values());
  }, [active, ver]);

  var [accountFilter, setAccountFilter] = useStateAc('all');
  var [mainTab, setMainTab] = useStateAc('strategies');
  var [strategySubTab, setStrategySubTab] = useStateAc('running');

  var visible = useMemoAc(function() {
    if (accountFilter === 'all') return active;
    return active.filter(function(w) {
      var acc = w.deployAccount;
      return acc && (acc.kind + ':' + acc.tail) === accountFilter;
    });
  }, [active, accountFilter]);

  var kpis = useMemoAc(function() {
    var openPos = visible.reduce(function(n, w) { return n + ((w.positions && w.positions.length) || 0); }, 0);
    var unreal = visible.reduce(function(s, w) {
      return s + ((w.positions || []).reduce(function(ss, p) { return ss + (p.unreal || 0); }, 0));
    }, 0);
    var today = visible.reduce(function(s, w) { return s + (w.todayPnL || 0); }, 0);
    var cum = visible.reduce(function(s, w) { return s + (w.cumPnL || 0); }, 0);
    var capital = visible.reduce(function(s, w) { return s + (w.capital || 0); }, 0);
    return { openPos: openPos, unreal: unreal, today: today, cum: cum, capital: capital };
  }, [visible]);

  function handleStop(w, closePositions) {
    var idx = window.WATCHED_STRATEGIES.findIndex(function(s) { return s.id === w.id; });
    if (idx >= 0) {
      window.WATCHED_STRATEGIES[idx] = Object.assign({}, window.WATCHED_STRATEGIES[idx], {
        deployStatus: 'paused',
        stoppedOn: new Date().toISOString(),
        positions: closePositions ? [] : window.WATCHED_STRATEGIES[idx].positions,
      });
    }
    setStopTarget(null);
    setVer(function(v) { return v + 1; });
  }

  function handleDeleteStopped(wId) {
    window.WATCHED_STRATEGIES = window.WATCHED_STRATEGIES.filter(function(s) { return s.id !== wId; });
    setRemoveConfirm(null);
    setVer(function(v) { return v + 1; });
  }

  function handleRestart(w) {
    var meta = window.MARKET_STRATEGIES.find(function(s) { return s.id === w.id; });
    if (meta && onDeploy) onDeploy(meta);
  }

  if (allDeployed.length === 0) {
    return <ActivityEmpty dark={dark} />;
  }

  var symbolCount = useMemoAc(
    function() { return new Set(visible.flatMap(function(w) { return (w.positions || []).map(function(p) { return p.symbol; }); })).size; },
    [visible]
  );

  return (
    <div className="space-y-4 px-7 py-5">
      <AccountFilter
        accounts={accounts}
        value={accountFilter}
        onChange={setAccountFilter}
        totalDeployed={active.length}
        dark={dark}
      />

      <KPIStrip kpis={kpis} dark={dark} />

      <DeployedMainTabs
        value={mainTab}
        onChange={setMainTab}
        strategyCount={active.length + stopped.length}
        positionCount={kpis.openPos}
        dark={dark}
      />

      {mainTab === 'strategies' ? (
        <section>
          <StrategySubTabs
            activeCount={visible.length}
            stoppedCount={stopped.length}
            value={strategySubTab}
            onChange={setStrategySubTab}
            dark={dark}
          />

          {strategySubTab === 'running' ? (
            <div className="space-y-3 mt-3">
              {visible.length === 0 ? (
                <div className={`rounded-2xl border px-6 py-10 text-center ${dark ? 'border-white/[0.05] bg-white/[0.02]' : 'border-slate-200/70 bg-white'}`}>
                  <div className={`text-[13px] ${dark ? 'text-white/50' : 'text-slate-400'}`}>No running strategies</div>
                </div>
              ) : visible.map(function(w) {
                var meta = window.MARKET_STRATEGIES.find(function(s) { return s.id === w.id; });
                return (
                  <DeployedCard
                    key={w.id}
                    w={w}
                    meta={meta}
                    dark={dark}
                    onViewDetail={function() { onPreview(meta, w); }}
                    onManage={function() { onManage(w); }}
                    onStop={function() { setStopTarget(w); }}
                  />
                );
              })}
            </div>
          ) : (
            <div className="space-y-3 mt-3">
              {stopped.length === 0 ? (
                <div className={`rounded-2xl border px-6 py-10 text-center ${dark ? 'border-white/[0.05] bg-white/[0.02]' : 'border-slate-200/70 bg-white'}`}>
                  <div className={`text-[13px] ${dark ? 'text-white/50' : 'text-slate-400'}`}>No stopped strategies</div>
                </div>
              ) : stopped.map(function(w) {
                var meta = window.MARKET_STRATEGIES.find(function(s) { return s.id === w.id; });
                return (
                  <StoppedCard
                    key={w.id}
                    w={w}
                    meta={meta}
                    dark={dark}
                    onViewDetail={function() { onPreview(meta, w); }}
                    onRestart={function() { handleRestart(w); }}
                    onDelete={function() { setRemoveConfirm(w); }}
                  />
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <section>
          <OpenPositionsTable visible={visible} dark={dark} />
        </section>
      )}

      {stopTarget && (
        <StopConfirmDialog
          dark={dark}
          strategyName={(window.MARKET_STRATEGIES.find(function(s) { return s.id === stopTarget.id; }) || {}).name || stopTarget.id}
          onCloseAndStop={function() { handleStop(stopTarget, true); }}
          onStopOnly={function() { handleStop(stopTarget, false); }}
          onCancel={function() { setStopTarget(null); }}
        />
      )}

      {removeConfirm && (
        <RemoveStoppedDialog
          dark={dark}
          strategyName={(window.MARKET_STRATEGIES.find(function(s) { return s.id === removeConfirm.id; }) || {}).name || removeConfirm.id}
          onConfirm={function() { handleDeleteStopped(removeConfirm.id); }}
          onCancel={function() { setRemoveConfirm(null); }}
        />
      )}
    </div>
  );
}

// Section header that frames each major module on the Activity page.
// Eyebrow + bold title makes the "by symbol" vs "by strategy" framing explicit.
function SectionHeader({ title, subtitle, accent, dark }) {
  const accentBar =
    accent === 'sky'
      ? 'bg-gradient-to-b from-sky-400 to-sky-500'
      : accent === 'emerald'
      ? 'bg-gradient-to-b from-emerald-400 to-emerald-500'
      : accent === 'amber'
      ? 'bg-gradient-to-b from-amber-400 to-amber-500'
      : 'bg-slate-400';
  return (
    <div className="mb-3 flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`h-5 w-[3px] shrink-0 rounded-full ${accentBar}`} aria-hidden />
        <h3 className={`text-[17px] font-semibold leading-tight ${dark ? 'text-white' : 'text-slate-900'}`} style={{ letterSpacing: '-0.01em' }}>
          {title}
        </h3>
      </div>
      {subtitle && (
        <div className={`hidden text-right text-[11.5px] sm:block ${dark ? 'text-white/45' : 'text-slate-500'}`}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

function DeployedMainTabs({ value, onChange, strategyCount, positionCount, dark }) {
  var tabs = [
    { key: 'strategies', label: 'My strategies', count: strategyCount },
    { key: 'positions', label: 'Positions', count: positionCount },
  ];
  return (
    <div className={`flex items-center border-b ${dark ? 'border-white/[0.06]' : 'border-slate-200'}`}>
      {tabs.map(function(t) {
        var isActive = value === t.key;
        return (
          <button
            key={t.key}
            onClick={function() { onChange(t.key); }}
            className={'relative flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium transition-colors ' + (
              isActive
                ? (dark ? 'text-white' : 'text-slate-900')
                : (dark ? 'text-white/50 hover:text-white/70' : 'text-slate-500 hover:text-slate-700')
            )}
          >
            {t.label}
            <span className={'rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ' + (
              isActive
                ? (dark ? 'bg-sky-500/20 text-sky-300' : 'bg-sky-100 text-sky-700')
                : (dark ? 'bg-white/10 text-white/50' : 'bg-slate-100 text-slate-400')
            )}>
              {t.count}
            </span>
            {isActive && <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full" style={{ background: dark ? '#0ea5e9' : '#0f172a' }} />}
          </button>
        );
      })}
    </div>
  );
}

function StrategySubTabs({ activeCount, stoppedCount, value, onChange, dark }) {
  var tabs = [
    { key: 'running', label: 'Strategy runs', count: activeCount, accent: 'emerald' },
    { key: 'stopped', label: 'Stopped', count: stoppedCount, accent: 'amber' },
  ];
  return (
    <div className={`flex items-center gap-1 rounded-lg border p-1 ${dark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-slate-200 bg-slate-50'}`}>
      {tabs.map(function(t) {
        var isActive = value === t.key;
        var activeCls = dark
          ? 'bg-white/[0.08] text-white shadow-sm'
          : 'bg-white text-slate-900 shadow-sm';
        var idleCls = dark
          ? 'text-white/50 hover:text-white/70'
          : 'text-slate-500 hover:text-slate-700';
        return (
          <button
            key={t.key}
            onClick={function() { onChange(t.key); }}
            className={'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-all ' + (isActive ? activeCls : idleCls)}
          >
            {t.label}
            <span className={'rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ' + (
              isActive
                ? (t.accent === 'emerald'
                    ? (dark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700')
                    : (dark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700'))
                : (dark ? 'bg-white/10 text-white/50' : 'bg-slate-100 text-slate-400')
            )}>
              {t.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Top: KPI strip
// ─────────────────────────────────────────────────────────────────

function KPIStrip({ kpis, dark }) {
  const cells = [
    { label: 'Open positions', value: String(kpis.openPos), tone: 'neutral' },
    { label: 'Unrealized P&L', value: fmtUSDA(kpis.unreal), tone: kpis.unreal >= 0 ? 'pos' : 'neg' },
    { label: 'Today', value: fmtUSDA(kpis.today), tone: kpis.today >= 0 ? 'pos' : 'neg' },
    { label: 'Cumulative', value: fmtUSDA(kpis.cum), tone: kpis.cum >= 0 ? 'pos' : 'neg' },
    {
      label: 'Capital deployed',
      value: '$' + kpis.capital.toLocaleString('en-US'),
      tone: 'neutral',
    },
  ];
  return (
    <section
      className={`relative overflow-hidden rounded-2xl border ${
        dark ? 'border-white/[0.05] bg-[#0f1218]' : 'border-slate-200/70 bg-white elev-card'
      }`}
    >
      <div className="grid grid-cols-2 gap-y-5 p-5 md:grid-cols-5">
        {cells.map((c) => (
          <KPICell key={c.label} {...c} dark={dark} />
        ))}
      </div>
    </section>
  );
}

function KPICell({ label, value, tone, dark }) {
  const toneCls =
    tone === 'pos'
      ? 'text-emerald-500'
      : tone === 'neg'
      ? 'text-rose-500'
      : dark
      ? 'text-white'
      : 'text-slate-900';
  return (
    <div>
      <div
        className={`mb-1 text-[10.5px] font-medium uppercase tracking-wider ${
          dark ? 'text-white/45' : 'text-slate-400'
        }`}
      >
        {label}
      </div>
      <div
        className={`text-[22px] font-semibold tabular-nums leading-tight ${toneCls}`}
        style={{ letterSpacing: '-0.015em' }}
      >
        {value}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Account filter chips
// ─────────────────────────────────────────────────────────────────

function AccountFilter({ accounts, value, onChange, totalDeployed, dark }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <FilterChip
        active={value === 'all'}
        onClick={() => onChange('all')}
        dark={dark}
        label={`All accounts · ${totalDeployed} strategies`}
        dot="#94a3b8"
      />
      {accounts.map((a) => {
        const cumA = a.deployments.reduce((s, w) => s + (w.cumPnL || 0), 0);
        const sub =
          `${a.deployments.length} ${a.deployments.length === 1 ? 'strategy' : 'strategies'} · ` +
          `${cumA >= 0 ? '+' : ''}${fmtUSDA(cumA)}`;
        return (
          <FilterChip
            key={a.key}
            active={value === a.key}
            onClick={() => onChange(a.key)}
            dark={dark}
            label={`${a.label} ${a.tail}`}
            sub={sub}
            dot={a.kind === 'live' ? '#ef4444' : '#06b6d4'}
          />
        );
      })}
    </div>
  );
}

function FilterChip({ active, onClick, dark, label, sub, dot }) {
  const activeCls = dark
    ? 'border-white/30 bg-white/[0.08] text-white'
    : 'border-slate-900 bg-slate-900 text-white';
  const idleCls = dark
    ? 'border-white/[0.06] bg-white/[0.02] text-white/70 hover:bg-white/[0.04]'
    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
        active ? activeCls : idleCls
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
      <span>{label}</span>
      {sub && (
        <span
          className={`text-[10.5px] font-normal ${
            active ? 'opacity-70' : dark ? 'text-white/45' : 'text-slate-400'
          }`}
        >
          · {sub}
        </span>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────
// Open positions table — grouped by symbol, expandable when a symbol
// is held by more than one strategy.
// ─────────────────────────────────────────────────────────────────

function OpenPositionsTable({ visible, dark }) {
  const groups = useMemoAc(() => {
    const out = new Map();
    visible.forEach((w) => {
      const meta = window.MARKET_STRATEGIES.find((s) => s.id === w.id);
      (w.positions || []).forEach((p) => {
        if (!out.has(p.symbol)) out.set(p.symbol, []);
        out.get(p.symbol).push({ w, meta, p });
      });
    });
    return Array.from(out.entries());
  }, [visible]);

  const totalPositions = groups.reduce((n, [, hs]) => n + hs.length, 0);
  // Weight denominator: total deployed capital across visible strategies.
  const totalCapital = useMemoAc(
    () => visible.reduce((s, w) => s + (w.capital || 0), 0),
    [visible]
  );

  const [expanded, setExpanded] = useStateAc(false);
  const visibleGroups = expanded ? groups : groups.slice(0, 5);
  const hiddenGroups = groups.length - visibleGroups.length;

  const [openSymbols, setOpenSymbols] = useStateAc(() => new Set());
  const toggle = (sym) =>
    setOpenSymbols((prev) => {
      const next = new Set(prev);
      if (next.has(sym)) next.delete(sym);
      else next.add(sym);
      return next;
    });

  return (
    <section
      className={`overflow-hidden rounded-2xl border ${
        dark ? 'border-white/[0.05] bg-[#0f1218]' : 'border-slate-200/70 bg-white elev-card'
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        disabled={groups.length <= 5}
        className={`flex w-full items-center justify-between border-b px-4 py-3 text-left transition-colors ${
          dark ? 'border-white/[0.05]' : 'border-slate-100'
        } ${groups.length > 5 ? (dark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50') : 'cursor-default'}`}
      >
        <div className="flex items-center gap-2">
          {groups.length > 5 && <Chevron open={expanded} dark={dark} />}
          <div className={`text-[13px] font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>
            Open positions
          </div>
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold ${
              dark ? 'bg-white/10 text-white/70' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {totalPositions}
          </span>
        </div>
        {!expanded && hiddenGroups > 0 && (
          <span className={`text-[11.5px] ${dark ? 'text-white/50' : 'text-slate-500'}`}>
            Showing 5 of {groups.length} · click to expand
          </span>
        )}
      </button>
      {groups.length === 0 ? (
        <div className={`px-4 py-8 text-center text-[12.5px] ${dark ? 'text-white/45' : 'text-slate-400'}`}>
          No open positions right now.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead className={dark ? 'bg-white/[0.03] text-white/45' : 'bg-slate-50 text-slate-400'}>
              <tr>
                <th className="px-4 py-2 text-left font-medium">Symbol</th>
                <th className="py-2 text-left font-medium">Strategy · Account</th>
                <th className="py-2 text-left font-medium">Side</th>
                <th className="py-2 text-right font-medium">Qty</th>
                <th className="py-2 text-right font-medium">Weight</th>
                <th className="py-2 text-right font-medium">Avg cost</th>
                <th className="py-2 text-right font-medium">Mark</th>
                <th className="py-2 text-right font-medium">Unrealized</th>
                <th className="py-2 text-right font-medium">%</th>
                <th className="px-4 py-2 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody className={dark ? 'text-white/85' : 'text-slate-700'}>
              {visibleGroups.map(([sym, holdings]) =>
                holdings.length === 1
                  ? <SinglePositionRow key={sym} holding={holdings[0]} totalCapital={totalCapital} dark={dark} />
                  : <ExpandablePositionRows
                      key={sym}
                      symbol={sym}
                      holdings={holdings}
                      totalCapital={totalCapital}
                      open={openSymbols.has(sym)}
                      onToggle={() => toggle(sym)}
                      dark={dark}
                    />
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function SinglePositionRow({ holding, totalCapital, dark }) {
  const { w, meta, p } = holding;
  const pos = (p.unreal || 0) >= 0;
  const weight = totalCapital > 0 ? (p.mktValue / totalCapital) * 100 : 0;
  return (
    <tr className={`border-t ${dark ? 'border-white/5' : 'border-slate-100'}`}>
      <td className="px-4 py-2.5 font-semibold tabular-nums">{p.symbol}</td>
      <td className="py-2.5">
        <div className={`font-medium leading-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
          {meta?.name || w.id}
        </div>
        <div
          className={`mt-0.5 inline-flex items-center gap-1 text-[11px] ${
            dark ? 'text-white/55' : 'text-slate-500'
          }`}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: w.deployAccount?.kind === 'live' ? '#ef4444' : '#06b6d4' }}
          />
          {w.deployAccount?.label} {w.deployAccount?.tail}
        </div>
      </td>
      <td className="py-2.5">
        <SideBadge side={p.side} />
      </td>
      <td className="py-2.5 text-right tabular-nums">{fmtQty(p.qty)}</td>
      <td className="py-2.5 text-right tabular-nums">{weight.toFixed(1)}%</td>
      <td className="py-2.5 text-right tabular-nums">${fmtPx(p.avg)}</td>
      <td className="py-2.5 text-right tabular-nums">${fmtPx(p.last)}</td>
      <td className={`py-2.5 text-right tabular-nums font-medium ${pos ? 'text-emerald-500' : 'text-rose-500'}`}>
        {pos ? '+' : ''}
        {fmtUSDA(p.unreal)}
      </td>
      <td className={`py-2.5 text-right tabular-nums ${pos ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
        {pos ? '+' : ''}
        {p.pct.toFixed(2)}%
      </td>
      <td className="px-4 py-2.5 text-right">
        <CloseBtn dark={dark} />
      </td>
    </tr>
  );
}

function ExpandablePositionRows({ symbol, holdings, totalCapital, open, onToggle, dark }) {
  const a = aggregateHoldings(holdings);
  const pos = a.unreal >= 0;
  const allLong = holdings.every((h) => h.p.side !== 'short');
  const allShort = holdings.every((h) => h.p.side === 'short');
  const aggWeight = totalCapital > 0 ? (a.mktValueSum / totalCapital) * 100 : 0;
  return (
    <>
      <tr
        className={`cursor-pointer border-t ${
          dark ? 'border-white/5 hover:bg-white/[0.04]' : 'border-slate-100 hover:bg-slate-50'
        }`}
        onClick={onToggle}
      >
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <Chevron open={open} dark={dark} />
            <span className="font-semibold tabular-nums">{symbol}</span>
          </div>
        </td>
        <td className="py-2.5">
          <span className={`text-[11.5px] font-medium ${dark ? 'text-white/70' : 'text-slate-500'}`}>
            {holdings.length} strategies
          </span>
        </td>
        <td className="py-2.5">
          {allLong || allShort ? (
            <SideBadge side={allShort ? 'short' : 'long'} />
          ) : (
            <span
              className={`text-[11px] font-semibold uppercase tracking-wider ${
                dark ? 'text-amber-300' : 'text-amber-600'
              }`}
            >
              MIXED
            </span>
          )}
        </td>
        <td className="py-2.5 text-right tabular-nums">{fmtQty(a.qtyAbs)}</td>
        <td className="py-2.5 text-right tabular-nums">{aggWeight.toFixed(1)}%</td>
        <td className="py-2.5 text-right tabular-nums">${fmtPx(a.avg)}</td>
        <td className="py-2.5 text-right tabular-nums">${fmtPx(a.mark)}</td>
        <td className={`py-2.5 text-right tabular-nums font-medium ${pos ? 'text-emerald-500' : 'text-rose-500'}`}>
          {pos ? '+' : ''}
          {fmtUSDA(a.unreal)}
        </td>
        <td className={`py-2.5 text-right tabular-nums ${pos ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
          {pos ? '+' : ''}
          {a.pct.toFixed(2)}%
        </td>
        <td className="px-4 py-2.5 text-right" />
      </tr>
      {open &&
        holdings.map(({ w, meta, p }, i) => {
          const cp = (p.unreal || 0) >= 0;
          return (
            <tr
              key={`${w.id}-${i}`}
              className={`border-t ${
                dark ? 'border-white/5 bg-white/[0.015]' : 'border-slate-100 bg-slate-50/40'
              }`}
            >
              <td className="px-4 py-2 pl-10" />
              <td className="py-2">
                <div className={`text-[11.5px] font-medium leading-tight ${dark ? 'text-white/85' : 'text-slate-800'}`}>
                  {meta?.name || w.id}
                </div>
                <div
                  className={`mt-0.5 inline-flex items-center gap-1 text-[10.5px] ${
                    dark ? 'text-white/45' : 'text-slate-400'
                  }`}
                >
                  <span
                    className="h-1 w-1 rounded-full"
                    style={{ background: w.deployAccount?.kind === 'live' ? '#ef4444' : '#06b6d4' }}
                  />
                  {w.deployAccount?.label} {w.deployAccount?.tail}
                </div>
              </td>
              <td className="py-2">
                <SideBadge side={p.side} small />
              </td>
              <td className="py-2 text-right tabular-nums text-[11.5px]">{fmtQty(p.qty)}</td>
              <td className="py-2 text-right tabular-nums text-[11.5px]">
                {(totalCapital > 0 ? (p.mktValue / totalCapital) * 100 : 0).toFixed(1)}%
              </td>
              <td className="py-2 text-right tabular-nums text-[11.5px]">${fmtPx(p.avg)}</td>
              <td className="py-2 text-right tabular-nums text-[11.5px]">${fmtPx(p.last)}</td>
              <td className={`py-2 text-right tabular-nums text-[11.5px] font-medium ${cp ? 'text-emerald-500' : 'text-rose-500'}`}>
                {cp ? '+' : ''}
                {fmtUSDA(p.unreal)}
              </td>
              <td className={`py-2 text-right tabular-nums text-[11.5px] ${cp ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                {cp ? '+' : ''}
                {p.pct.toFixed(2)}%
              </td>
              <td className="px-4 py-2 text-right">
                <CloseBtn dark={dark} />
              </td>
            </tr>
          );
        })}
    </>
  );
}

function aggregateHoldings(holdings) {
  let qtyNet = 0,
    costNotionalAbs = 0,
    markNotionalAbs = 0,
    mktValueSum = 0,
    unreal = 0,
    qtyAbs = 0;
  holdings.forEach(({ p }) => {
    const dir = p.side === 'short' ? -1 : 1;
    qtyNet += p.qty * dir;
    qtyAbs += p.qty;
    costNotionalAbs += p.qty * p.avg;
    markNotionalAbs += p.qty * p.last;
    mktValueSum += p.mktValue || 0;
    unreal += p.unreal;
  });
  const avg = qtyAbs ? costNotionalAbs / qtyAbs : 0;
  const mark = qtyAbs ? markNotionalAbs / qtyAbs : 0;
  const pct = costNotionalAbs ? (unreal / costNotionalAbs) * 100 : 0;
  return { qtyNet, qtyAbs, avg, mark, mktValueSum, unreal, pct };
}

function Chevron({ open, dark }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-3 w-3 transition-transform ${open ? 'rotate-90' : ''} ${
        dark ? 'text-white/50' : 'text-slate-400'
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function SideBadge({ side, small }) {
  const isShort = side === 'short';
  const sz = small ? 'text-[10px]' : 'text-[11px]';
  return (
    <span className={`${sz} font-semibold uppercase tracking-wider ${isShort ? 'text-rose-500' : 'text-emerald-500'}`}>
      {side}
    </span>
  );
}

function CloseBtn({ dark, onClick, label }) {
  return (
    <button
      onClick={onClick}
      title="Close this position"
      className={`rounded-md border px-2 py-1 text-[11px] font-medium ${
        dark
          ? 'border-white/[0.10] text-white/75 hover:bg-white/[0.06]'
          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
      }`}
    >
      {label || 'Close'}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────
// Compact deployed strategy card — sparkline + key stats + top 3 positions
// ─────────────────────────────────────────────────────────────────

function MiniSparkline({ data, color, width, height }) {
  if (!data || data.length < 2) return null;
  var min = Infinity, max = -Infinity;
  data.forEach(function(v) { if (v < min) min = v; if (v > max) max = v; });
  var range = max - min || 1;
  var step = width / (data.length - 1);
  var points = data.map(function(v, i) {
    return (i * step).toFixed(1) + ',' + (height - ((v - min) / range) * (height * 0.8) - height * 0.1).toFixed(1);
  }).join(' ');
  return (
    <svg width={width} height={height} viewBox={'0 0 ' + width + ' ' + height} className="block">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DeployedCard({ w, meta, dark, onViewDetail, onManage, onStop }) {
  var cumPos = (w.cumPnLPct || 0) >= 0;
  var todayPos = (w.todayPnLPct || 0) >= 0;
  var curveData = w.curve || (meta && meta.curve) || [];

  return (
    <div
      className={'overflow-hidden rounded-2xl border transition-colors cursor-pointer ' + (dark ? 'border-white/[0.05] bg-[#0f1218] hover:border-white/[0.10]' : 'border-slate-200/70 bg-white hover:border-slate-300 elev-card')}
      onClick={onViewDetail}
    >
      <div className="flex items-start gap-4 p-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-[11px] font-bold text-white" style={{ background: (meta && meta.author && meta.author.avatarColor) || '#64748b' }}>
            {(meta && meta.symbol) || '...'}
          </div>
          <div className="min-w-0 flex-1">
            <div className={'text-[14px] font-semibold leading-tight ' + (dark ? 'text-white' : 'text-slate-900')}>
              {(meta && meta.name) || w.id}
            </div>
            <div className={'mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] ' + (dark ? 'text-white/50' : 'text-slate-500')}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: w.deployAccount && w.deployAccount.kind === 'live' ? '#ef4444' : '#06b6d4' }} />
              <span>{w.deployAccount ? (w.deployAccount.label + ' ' + w.deployAccount.tail) : ''}</span>
              <span className="opacity-40">|</span>
              <span>Started {w.addedOn ? w.addedOn.slice(0, 19).replace('T', ' ') : '--'}</span>
              <span className="opacity-40">|</span>
              <span>Running {w.runDays || 0}d</span>
              <span className="opacity-40">|</span>
              <span>Capital ${(w.capital || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <MiniSparkline data={curveData} color={cumPos ? '#10b981' : '#ef4444'} width={100} height={36} />
          <button onClick={function(e) { e.stopPropagation(); onViewDetail(); }} className={'rounded-md px-2.5 py-1.5 text-[11px] font-medium ' + (dark ? 'text-sky-300 hover:bg-sky-500/10' : 'text-sky-700 hover:bg-sky-50')}>
            View details
          </button>
          <button onClick={function(e) { e.stopPropagation(); onManage && onManage(); }} className={'rounded-md border px-2.5 py-1.5 text-[11px] font-medium ' + (dark ? 'border-white/[0.10] text-white/85 hover:bg-white/[0.06]' : 'border-slate-200 text-slate-700 hover:bg-slate-50')}>
            Manage
          </button>
          <button onClick={function(e) { e.stopPropagation(); onStop(); }} className={'rounded-md border px-2.5 py-1.5 text-[11px] font-semibold ' + (dark ? 'border-rose-400/30 bg-rose-400/10 text-rose-300 hover:bg-rose-400/15' : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100')}>
            Stop
          </button>
        </div>
      </div>

      <div className={'grid grid-cols-5 gap-y-2 border-t px-4 py-3 ' + (dark ? 'border-white/[0.05]' : 'border-slate-100')}>
        <RunStat label="Cumulative" value={(cumPos ? '+' : '') + (w.cumPnLPct || 0).toFixed(2) + '%'} sub={fmtUSDA(w.cumPnL || 0)} tone={cumPos ? 'pos' : 'neg'} dark={dark} />
        <RunStat label="Today" value={(todayPos ? '+' : '') + (w.todayPnLPct || 0).toFixed(2) + '%'} sub={fmtUSDA(w.todayPnL || 0)} tone={todayPos ? 'pos' : 'neg'} dark={dark} />
        <RunStat label="Sharpe" value={(w.sharpe || 0).toFixed(2)} dark={dark} />
        <RunStat label="Max DD" value={(w.maxDD || 0).toFixed(1) + '%'} tone="neg" dark={dark} />
        <RunStat label="Win rate" value={(w.winRate || 0) + '%'} sub={(w.trades || 0) + ' trades'} dark={dark} />
      </div>
    </div>
  );
}

function StoppedCard({ w, meta, dark, onViewDetail, onRestart, onDelete }) {
  var cumPos = (w.cumPnLPct || 0) >= 0;
  var curveData = w.curve || (meta && meta.curve) || [];

  return (
    <div
      className={'overflow-hidden rounded-2xl border cursor-pointer transition-colors ' + (dark ? 'border-white/[0.05] bg-white/[0.02] hover:border-white/[0.10]' : 'border-slate-200/70 bg-white hover:border-slate-300')}
      onClick={onViewDetail}
    >
      <div className="flex items-start gap-4 p-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-[11px] font-bold text-white opacity-50" style={{ background: (meta && meta.author && meta.author.avatarColor) || '#64748b' }}>
            {(meta && meta.symbol) || '...'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={'text-[14px] font-semibold leading-tight ' + (dark ? 'text-white/60' : 'text-slate-500')}>{(meta && meta.name) || w.id}</span>
              <span className={'rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider ' + (dark ? 'bg-amber-400/15 text-amber-300' : 'bg-amber-50 text-amber-700')}>STOPPED</span>
            </div>
            <div className={'mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] ' + (dark ? 'text-white/40' : 'text-slate-400')}>
              <span>{w.deployAccount ? (w.deployAccount.label + ' ' + w.deployAccount.tail) : ''}</span>
              <span className="opacity-40">|</span>
              <span>Stopped {w.stoppedOn ? w.stoppedOn.slice(0, 10) : '--'}</span>
              <span className="opacity-40">|</span>
              <span>Ran {w.runDays || 0}d</span>
              <span className="opacity-40">|</span>
              <span>Cumulative: <span className={cumPos ? 'text-emerald-500' : 'text-rose-500'}>{cumPos ? '+' : ''}{(w.cumPnLPct || 0).toFixed(2)}%</span></span>
            </div>
          </div>
        </div>
        <div className="shrink-0 pt-1 opacity-50">
          <MiniSparkline data={curveData} color={cumPos ? '#10b981' : '#ef4444'} width={80} height={28} />
        </div>
      </div>

      <div className={'flex items-center justify-between border-t px-4 py-2.5 ' + (dark ? 'border-white/[0.05]' : 'border-slate-100')} onClick={function(e) { e.stopPropagation(); }}>
        <button onClick={onViewDetail} className={'rounded-md px-2.5 py-1.5 text-[11.5px] font-medium ' + (dark ? 'text-sky-300 hover:bg-sky-500/10' : 'text-sky-700 hover:bg-sky-50')}>
          View details
        </button>
        <div className="flex items-center gap-1.5">
          <button onClick={onRestart} className={'rounded-md border px-2.5 py-1.5 text-[11.5px] font-medium ' + (dark ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/15' : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100')}>
            Restart
          </button>
          <button onClick={onDelete} title="Delete" className={'grid h-7 w-7 place-items-center rounded ' + (dark ? 'text-white/40 hover:bg-white/10' : 'text-slate-400 hover:bg-slate-100')}>
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function RunStat({ label, value, sub, tone, dark }) {
  var toneCls =
    tone === 'pos'
      ? 'text-emerald-500'
      : tone === 'neg'
      ? 'text-rose-500'
      : dark
      ? 'text-white'
      : 'text-slate-900';
  return (
    <div>
      <div className={'mb-0.5 text-[10px] font-medium uppercase tracking-wider ' + (dark ? 'text-white/45' : 'text-slate-400')}>
        {label}
      </div>
      <div className={'text-[16px] font-semibold tabular-nums leading-tight ' + toneCls}>{value}</div>
      {sub && (
        <div className={'mt-0.5 text-[11px] tabular-nums ' + (tone === 'pos' ? 'text-emerald-500/80' : tone === 'neg' ? 'text-rose-500/80' : dark ? 'text-white/45' : 'text-slate-500')}>
          {sub}
        </div>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────
// Generates trade data for detail page
// ─────────────────────────────────────────────────────────────────

function makeTradesForStrategy(s) {
  var sample = (s.universe && s.universe.kind === 'multi') ? ['NVDA', 'AAPL', 'AVGO', 'MSFT', 'GOOG'] : [s.symbol];
  var trades = [];
  for (var i = 0; i < 32; i++) {
    var buy = i % 2 === 0;
    var sym = sample[i % sample.length];
    var day = 31 - i;
    var month = day > 0 ? '05' : '04';
    var d = day > 0 ? day : 30 + day;
    trades.push({
      at: '2026-' + month + '-' + String(d).padStart(2, '0'),
      sym: sym,
      side: buy ? 'BUY' : 'SELL',
      qty: 10 + i * 3,
      px: (100 + ((i * 7) % 120)).toFixed(2),
      pnl: buy ? null : (Math.sin(i * 0.7) * 180).toFixed(2),
    });
  }
  return trades;
}

// ─────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────

function StopConfirmDialog({ dark, strategyName, onCloseAndStop, onStopOnly, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className={`w-full max-w-md rounded-2xl border p-6 shadow-xl ${dark ? 'border-white/10 bg-[#181c24]' : 'border-slate-200 bg-white'}`}>
        <div className={`text-[15px] font-semibold mb-2 ${dark ? 'text-white' : 'text-slate-900'}`}>Stop strategy</div>
        <p className={`text-[13px] mb-5 ${dark ? 'text-white/60' : 'text-slate-500'}`}>
          How would you like to stop <b>{strategyName}</b>?
        </p>
        <div className="space-y-2">
          <button onClick={onCloseAndStop} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${dark ? 'border-white/[0.08] hover:bg-white/[0.04]' : 'border-slate-200 hover:bg-slate-50'}`}>
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-rose-500/15 text-rose-400 text-sm">X</div>
            <div>
              <div className={`text-[13px] font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>Close all positions and stop</div>
              <div className={`text-[11.5px] ${dark ? 'text-white/50' : 'text-slate-500'}`}>Liquidate all open positions at market, then stop the strategy.</div>
            </div>
          </button>
          <button onClick={onStopOnly} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${dark ? 'border-white/[0.08] hover:bg-white/[0.04]' : 'border-slate-200 hover:bg-slate-50'}`}>
            <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-md text-sm ${dark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-50 text-amber-700'}`}>||</div>
            <div>
              <div className={`text-[13px] font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>Stop only (keep positions)</div>
              <div className={`text-[11.5px] ${dark ? 'text-white/50' : 'text-slate-500'}`}>Stop generating new signals. Existing positions remain open and must be closed manually.</div>
            </div>
          </button>
        </div>
        <div className="mt-4 text-right">
          <button onClick={onCancel} className={`rounded-md px-3 py-1.5 text-[12px] font-medium ${dark ? 'text-white/70 hover:bg-white/8' : 'text-slate-600 hover:bg-slate-100'}`}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function RemoveStoppedDialog({ dark, strategyName, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className={`w-full max-w-sm rounded-2xl border p-6 shadow-xl ${dark ? 'border-white/10 bg-[#181c24]' : 'border-slate-200 bg-white'}`}>
        <div className={`text-[15px] font-semibold mb-2 ${dark ? 'text-white' : 'text-slate-900'}`}>Delete strategy?</div>
        <p className={`text-[13px] mb-5 ${dark ? 'text-white/60' : 'text-slate-500'}`}>
          Are you sure you want to delete <b>{strategyName}</b>? This cannot be undone.
        </p>
        <div className="flex items-center justify-end gap-2">
          <button onClick={onCancel} className={`rounded-md px-3 py-1.5 text-[12px] font-medium ${dark ? 'text-white/70 hover:bg-white/8' : 'text-slate-600 hover:bg-slate-100'}`}>Cancel</button>
          <button onClick={onConfirm} className="rounded-md bg-rose-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-rose-700">Delete</button>
        </div>
      </div>
    </div>
  );
}

function ActivityEmpty({ dark }) {
  return (
    <div className="px-7 py-8">
      <div className="text-center mb-8">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full text-2xl" style={{ background: 'linear-gradient(135deg,#0ea5e9,#10b981)' }}>📊</div>
        <div className={`mt-4 text-[18px] font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>Nothing deployed yet</div>
        <p className={`mx-auto mt-1 max-w-md text-[13px] ${dark ? 'text-white/60' : 'text-slate-500'}`}>
          Deploy a strategy from your Activity list to a paper or broker account. Once deployed, positions, trades, and performance will appear here.
        </p>
      </div>
      <div className={`rounded-2xl border p-5 ${dark ? 'border-white/[0.05] bg-white/[0.02]' : 'border-slate-200/70 bg-white'}`}>
        <div className={`text-[13px] font-semibold mb-3 ${dark ? 'text-white' : 'text-slate-900'}`}>How to get started</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StepCard step="1" title="Browse strategies" desc="Find a strategy in the Marketplace that matches your goals." dark={dark} />
          <StepCard step="2" title="Add to Activity" desc="Add it to your Activity list to track its signals and performance." dark={dark} />
          <StepCard step="3" title="Deploy" desc="Choose a paper or broker account and start trading automatically." dark={dark} />
        </div>
      </div>
    </div>
  );
}

function StepCard({ step, title, desc, dark }) {
  return (
    <div className={`rounded-xl border p-4 ${dark ? 'border-white/[0.06] bg-white/[0.03]' : 'border-slate-200/70 bg-slate-50'}`}>
      <div className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${dark ? 'bg-sky-500/20 text-sky-300' : 'bg-sky-100 text-sky-700'}`}>{step}</div>
      <div className={`mt-2 text-[13px] font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{title}</div>
      <div className={`mt-0.5 text-[11.5px] ${dark ? 'text-white/50' : 'text-slate-500'}`}>{desc}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────────

function fmtUSDA(n) {
  const sign = n < 0 ? '-' : n > 0 ? '+' : '';
  return (
    sign +
    '$' +
    Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

function fmtQty(q) {
  if (q < 1) return q.toFixed(4);
  if (q < 10) return q.toFixed(3);
  return q.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function fmtPx(p) {
  if (p >= 1000) return p.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return p.toFixed(2);
}

Object.assign(window, { ActivityTab, makeTradesForStrategy });
