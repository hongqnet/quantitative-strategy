// On Watch tab — portfolio overview, watch cards, AI push feed.

const { useState: useStateW, useEffect: useEffectW } = React;

function OnWatchTab({ direction, darkMode, watchedIds, onToggleWatch, onDeploy, onOptimize, onWriteNew, onManage, onPause, onPreview, onGoToDeployed }) {
  const isBold = direction === 'bold';
  const isCons = direction === 'conservative';
  const dark = darkMode || isBold;

  const [tick, setTick] = useStateW(0);
  useEffectW(() => {
    const id = setInterval(() => setTick(t => t + 1), 1800);
    return () => clearInterval(id);
  }, []);

  const [toast, setToast] = useStateW(null);
  useEffectW(() => {
    const ids = window.PUSH_FEED.slice(0, 3).map(p => p.id);
    let i = 0;
    const id = setInterval(() => {
      setToast(window.PUSH_FEED.find(p => p.id === ids[i % ids.length]));
      i++;
      setTimeout(() => setToast(null), 4200);
    }, 8500);
    return () => clearInterval(id);
  }, []);

  const watched = window.WATCHED_STRATEGIES.filter(w => watchedIds.includes(w.id))
    .map(w => ({ ...w, meta: window.MARKET_STRATEGIES.find(s => s.id === w.id) }));

  const [removeConfirm, setRemoveConfirm] = useStateW(null);
  const [sortBy, setSortBy] = useStateW('cumulative');

  var sortFn = function(a, b) {
    if (sortBy === 'cumulative') return (b.cumPnLPct || 0) - (a.cumPnLPct || 0);
    if (sortBy === 'today') return (b.todayPnLPct || 0) - (a.todayPnLPct || 0);
    if (sortBy === 'runtime') return (b.runDays || 0) - (a.runDays || 0);
    return 0;
  };
  var sortedWatched = watched.slice().sort(sortFn);

  if (watched.length === 0) return <EmptyState dark={dark} watchedIds={watchedIds} onToggleWatch={onToggleWatch} onPreview={onPreview} />;

  var sortOptions = [
    { value: 'cumulative', label: 'Cumulative' },
    { value: 'today', label: 'Today' },
    { value: 'runtime', label: 'Runtime' },
  ];

  return (
    <div className="relative px-7 py-5">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-[15px] font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>Your shortlist</h2>
                <p className={`text-[12px] ${dark ? 'text-white/50' : 'text-slate-500'}`}>
                  {watched.length} strategies in your Activity list — aime tracks every signal. Deploy any of them to a paper or broker account when you are ready.
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={sortBy}
                  onChange={function(e) { setSortBy(e.target.value); }}
                  className={`rounded-md border px-2.5 py-1 text-[11.5px] appearance-none cursor-pointer pr-6 ${dark ? 'border-white/[0.08] bg-white/[0.03] text-white/70' : 'border-slate-200 bg-white text-slate-600'}`}
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'10\' height=\'6\' viewBox=\'0 0 10 6\' fill=\'none\'%3E%3Cpath d=\'M1 1l4 4 4-4\' stroke=\'%2394a3b8\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
                >
                  {sortOptions.map(function(o) { return <option key={o.value} value={o.value}>Sort: {o.label}</option>; })}
                </select>
              </div>
            </div>
            <div className="grid gap-3 grid-cols-1">
              {sortedWatched.map(w => (
                <WatchCard
                  key={w.id} w={w} dark={dark} tick={tick}
                  onRemove={() => setRemoveConfirm(w)}
                  onDeploy={() => onDeploy(w.meta)}
                  onGoToDeployed={onGoToDeployed}
                  onPreview={() => onPreview(w.meta)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="xl:sticky xl:top-0 xl:self-start">
          <PushFeed dark={dark} />
        </div>
      </div>

      <PushToast toast={toast} dark={dark} />

      {removeConfirm && (
        <RemoveConfirmDialog
          dark={dark}
          strategyName={removeConfirm.meta?.name || removeConfirm.id}
          onConfirm={() => { onToggleWatch(removeConfirm.id); setRemoveConfirm(null); }}
          onCancel={() => setRemoveConfirm(null)}
        />
      )}
    </div>
  );
}

function PortfolioOverview({ dark, avgCumPct, bestCumPct, avgTodayPct, totalStrategies, liveCount, paperCount, watchOnlyCount, tick }) {
  const tickAdj = (Math.sin(tick * 0.7) * 0.04).toFixed(3);
  const todayLive = avgTodayPct + Number(tickAdj);
  return (
    <section className={`relative overflow-hidden rounded-2xl border ${dark ? 'border-white/[0.05] bg-[#0f1218]' : 'border-slate-200/70 bg-white elev-card'}`}>
      <div className="relative grid grid-cols-2 gap-y-5 p-5 md:grid-cols-4">
        <BigStat label="Avg cumulative" value={`${avgCumPct >= 0 ? '+' : ''}${avgCumPct.toFixed(2)}%`} sub={`${totalStrategies} strategies tracked`} tone={avgCumPct >= 0 ? 'pos' : 'neg'} dark={dark} big />
        <BigStat label="Avg today" value={`${todayLive >= 0 ? '+' : ''}${todayLive.toFixed(2)}%`} sub={`Best cumulative: ${bestCumPct >= 0 ? '+' : ''}${bestCumPct.toFixed(2)}%`} tone={todayLive >= 0 ? 'pos' : 'neg'} dark={dark} />
        <div className="md:col-span-2 md:border-l md:pl-6" style={{ borderColor: dark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }}>
          <div className={`mb-1.5 text-[10.5px] font-medium uppercase tracking-wider ${dark ? 'text-white/45' : 'text-slate-400'}`}>Shortlist breakdown</div>
          <div className="flex flex-wrap gap-1.5">
            {watchOnlyCount > 0 && <BreakdownChip label="Watching" count={watchOnlyCount} dot="#94a3b8" dark={dark} />}
            {paperCount > 0 && <BreakdownChip label="Paper" count={paperCount} dot="#06b6d4" dark={dark} />}
            {liveCount > 0 && <BreakdownChip label="Deployed" count={liveCount} dot="#ef4444" dark={dark} />}
          </div>
        </div>
      </div>
    </section>
  );
}

function BreakdownChip({ label, count, dot, dark }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] ${dark ? 'border-white/[0.08] bg-white/[0.04] text-white/80' : 'border-slate-200 bg-white text-slate-700'}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
      <span className="font-medium">{label}</span>
      <span className={`tabular-nums ${dark ? 'text-white/40' : 'text-slate-400'}`}>{count}</span>
    </span>
  );
}

function BigStat({ label, value, sub, tone, dark, big }) {
  const toneCls = tone === 'pos' ? 'text-emerald-500' : tone === 'neg' ? 'text-rose-500' : (dark ? 'text-white' : 'text-slate-900');
  return (
    <div>
      <div className={`mb-1 text-[10.5px] font-medium uppercase tracking-wider ${dark ? 'text-white/45' : 'text-slate-400'}`}>{label}</div>
      <div className={`${big ? 'text-[26px]' : 'text-[20px]'} font-semibold tabular-nums leading-tight ${toneCls}`} style={{ letterSpacing: '-0.015em' }}>{value}</div>
      <div className={`mt-0.5 text-[11.5px] tabular-nums ${tone === 'pos' ? 'text-emerald-500/80' : tone === 'neg' ? 'text-rose-500/80' : (dark ? 'text-white/50' : 'text-slate-500')}`}>{sub}</div>
    </div>
  );
}

function AccountChip({ kind, label, tail, dark }) {
  const dot = kind === 'live' ? '#ef4444' : '#06b6d4';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] ${dark ? 'border-white/[0.08] bg-white/[0.04] text-white/80' : 'border-slate-200 bg-white text-slate-700'}`}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
      <span className="font-medium">{label}</span>
      <span className={`tabular-nums ${dark ? 'text-white/40' : 'text-slate-400'}`}>{tail}</span>
    </span>
  );
}

function statusFor(w) {
  return {
    watching: { dot: '#94a3b8', label: 'Watching · signals only', tone: 'neutral' },
    paper:    { dot: '#06b6d4', label: `Paper · ${w.deployAccount?.label || 'AInvest Paper'} ${w.deployAccount?.tail || ''}`, tone: 'paper' },
    live:     { dot: '#ef4444', label: `Live · ${w.deployAccount?.label || ''} ${w.deployAccount?.tail || ''}`, tone: 'live' },
    paused:   { dot: '#f59e0b', label: `Paused · was ${w.deployAccount?.label || 'deployed'}`, tone: 'warn' },
  }[w.deployStatus];
}

function formatRuntime(addedOn) {
  if (!addedOn) return '0d';
  var start = new Date(addedOn);
  var now = new Date();
  var diffMs = now - start;
  var days = Math.floor(diffMs / 86400000);
  if (days < 1) return 'Today';
  if (days < 30) return days + 'd';
  var months = Math.floor(days / 30);
  var remDays = days % 30;
  if (remDays === 0) return months + 'mo';
  return months + 'mo ' + remDays + 'd';
}

function WatchCard({ w, dark, tick, onRemove, onDeploy, onGoToDeployed, onPreview }) {
  const meta = w.meta || window.MARKET_STRATEGIES.find((s) => s.id === w.id) || {};
  const positive = w.cumPnLPct >= 0;
  const tickAdj = (Math.sin(tick * 1.1 + (w.id.charCodeAt(0) || 1)) * 0.06).toFixed(3);
  const todayLive = w.todayPnLPct + Number(tickAdj);
  const todayPos = todayLive >= 0;
  const status = statusFor(w);

  const isWatching = w.deployStatus === 'watching';
  const runtime = formatRuntime(w.addedOn);

  return (
    <div className={`relative overflow-hidden rounded-xl border ${
      dark ? 'border-white/[0.05] bg-white/[0.03]' : 'border-slate-200/70 bg-white elev-tile'
    }`}>
      {/* Top: identity + cumulative hero + remove */}
      <div className="flex items-start justify-between gap-2 p-4 pb-3">
        <div role="button" tabIndex={0} onClick={onPreview} onKeyDown={(e) => { if (e.key === 'Enter') onPreview(); }} className="flex items-start gap-2.5 min-w-0 text-left cursor-pointer">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md text-[11px] font-bold text-white" style={{ background: meta.author?.avatarColor || '#64748b' }}>
            {meta.symbol?.slice(0, 3) || '...'}
          </div>
          <div className="min-w-0">
            <div className={`truncate text-[14.5px] font-semibold ${dark ? 'text-white hover:text-sky-300' : 'text-slate-900 hover:text-sky-700'}`}>
              {meta.name || w.id}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              <UniversePill universe={meta.universe} dark={dark} compact />
              <span className={`flex items-center gap-1.5 text-[11.5px] ${dark ? 'text-white/55' : 'text-slate-500'}`}>
                <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: status.dot }} />
                <span className="truncate">{status.label}</span>
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className={`text-right mr-1`}>
            <div className={`text-[20px] font-bold tabular-nums leading-tight ${positive ? 'text-emerald-500' : 'text-rose-500'}`}>
              {positive ? '+' : ''}{w.cumPnLPct.toFixed(2)}%
            </div>
            <div className={`text-[10px] font-medium uppercase tracking-wider ${dark ? 'text-white/40' : 'text-slate-400'}`}>Cumulative</div>
          </div>
          <button onClick={onRemove} title="Remove from Activity" className={`grid h-7 w-7 place-items-center rounded ${dark ? 'text-white/40 hover:bg-white/10' : 'text-slate-400 hover:bg-slate-100'}`}>
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
      </div>

      {/* Main row: metrics on left, equity on right */}
      <div className="flex flex-col items-stretch gap-3 px-4 pb-3 md:flex-row md:items-center">
        <div className="grid flex-1 grid-cols-2 gap-3">
          <MiniStat
            label="Today"
            value={`${todayPos ? '+' : ''}${todayLive.toFixed(2)}%`}
            tone={todayPos ? 'pos' : 'neg'}
            dark={dark}
          />
          <MiniStat label="Started" value={w.addedOn ? w.addedOn.slice(0, 19).replace('T', ' ') : '--'} sub={`Running ${runtime}`} dark={dark} />
        </div>
        <div className="md:w-[220px] md:shrink-0">
          <EquityChart curve={w.curve} color={positive ? '#10b981' : '#ef4444'} height={68} dark={dark} />
        </div>
      </div>

      {/* Last signal banner */}
      <div className={`mx-4 mb-3 flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11.5px] ${
        w.lastSignal.kind === 'alert'
          ? (dark ? 'border-amber-400/30 bg-amber-400/8 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-700')
          : (dark ? 'border-white/[0.05] bg-white/[0.03] text-white/70' : 'border-slate-100 bg-slate-50 text-slate-600')
      }`}>
        <SignalIcon kind={w.lastSignal.kind} />
        <span className="flex-1 truncate">{w.lastSignal.text}</span>
        <span className={`shrink-0 ${dark ? 'text-white/40' : 'text-slate-400'}`}>Next: {w.nextRun}</span>
      </div>

      {/* Footer actions */}
      <div className={`flex items-center justify-end gap-2 border-t px-4 py-2.5 ${dark ? 'border-white/[0.05]' : 'border-slate-100'}`}>
        {isWatching ? (
          <button onClick={onDeploy}
            className="flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-sky-700">
            Deploy
          </button>
        ) : (
          <button onClick={onGoToDeployed}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium ${dark ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            Deployed
            <svg viewBox="0 0 20 20" className="h-3 w-3 opacity-60" fill="currentColor"><path fillRule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" clipRule="evenodd" /></svg>
          </button>
        )}
      </div>
    </div>
  );
}

function SignalIcon({ kind }) {
  const map = { buy: '🟢', sell: '🔴', rebalance: '🔁', alert: '⚠︎' };
  return <span className="text-[11px]">{map[kind] || '•'}</span>;
}

function MiniStat({ label, value, sub, tone, dark }) {
  const toneCls = tone === 'pos' ? 'text-emerald-500' : tone === 'neg' ? 'text-rose-500' : (dark ? 'text-white' : 'text-slate-900');
  return (
    <div>
      <div className={`text-[10px] font-medium uppercase tracking-wider ${dark ? 'text-white/40' : 'text-slate-400'}`}>{label}</div>
      <div className={`text-[14.5px] font-semibold tabular-nums ${toneCls}`}>{value}</div>
      <div className={`text-[10.5px] tabular-nums ${dark ? 'text-white/40' : 'text-slate-400'}`}>{sub}</div>
    </div>
  );
}

function PushFeed({ dark }) {
  var feed = window.PUSH_FEED || [];
  var tradeCount = feed.filter(function(p) { return p.kind === 'trade'; }).length;
  var milestoneCount = feed.filter(function(p) { return p.kind === 'milestone'; }).length;
  return (
    <section className={'rounded-xl border ' + (dark ? 'border-white/[0.05] bg-white/[0.02]' : 'border-slate-200/70 bg-white elev-card')}>
      <div className={'flex items-center justify-between border-b px-4 py-3 ' + (dark ? 'border-white/[0.05]' : 'border-slate-100/80')}>
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className={'h-4 w-4 ' + (dark ? 'text-white/60' : 'text-slate-500')} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 8a6 6 0 1112 0c0 7 3 7 3 9H3c0-2 3-2 3-9zM9 19a3 3 0 006 0" /></svg>
          <div className={'text-[13px] font-semibold ' + (dark ? 'text-white' : 'text-slate-900')}>Quant Push</div>
          <span className={'rounded-full px-1.5 py-0.5 text-[10px] font-semibold ' + (dark ? 'bg-sky-400/15 text-sky-300' : 'bg-sky-50 text-sky-700')}>{feed.length} new</span>
        </div>
        <div className={'flex items-center gap-2 text-[10px] ' + (dark ? 'text-white/40' : 'text-slate-400')}>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{tradeCount} trades</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-violet-500" />{milestoneCount} milestones</span>
        </div>
      </div>
      <ol>
        {feed.map(function(p, i) { return <PushItem key={p.id} p={p} dark={dark} first={i === 0} />; })}
      </ol>
      <div className={'px-4 py-2.5 text-center text-[11.5px] ' + (dark ? 'text-white/40' : 'text-slate-400')}>Daily recap arrives at 16:30 ET</div>
    </section>
  );
}

function PushItem({ p, dark, first }) {
  var meta = window.MARKET_STRATEGIES.find(function(s) { return s.id === p.strategyId; });
  var isTrade = p.kind === 'trade';
  var isDeployed = p.source === 'deployed';
  var dot = isTrade ? '#10b981' : '#a855f7';
  var icon = isTrade ? '⚡' : '🎯';
  var sourceBadgeCls = isDeployed
    ? (dark ? 'bg-rose-400/15 text-rose-300' : 'bg-rose-50 text-rose-600')
    : (dark ? 'bg-sky-400/15 text-sky-300' : 'bg-sky-50 text-sky-600');
  var sourceLabel = isDeployed ? 'Deployed' : 'Activity';
  return (
    <li className={'flex gap-2.5 px-4 py-3 ' + (first ? '' : 'border-t')} style={{ borderColor: dark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }}>
      <span className="mt-1.5 block h-2 w-2 shrink-0 rounded-full" style={{ background: dot }} />
      <div className="min-w-0 flex-1">
        <div className={'flex items-center gap-1.5 text-[11px] ' + (dark ? 'text-white/45' : 'text-slate-400')}>
          <span>{icon}</span>
          <span>{p.at}</span>
          <span className="opacity-50">|</span>
          <span className={'rounded px-1 py-px text-[9px] font-bold uppercase tracking-wider ' + sourceBadgeCls}>{sourceLabel}</span>
          {meta && <><span className="opacity-40">|</span><span className="truncate">{meta.name}</span></>}
        </div>
        <div className={'mt-0.5 text-[12.5px] font-medium ' + (dark ? 'text-white' : 'text-slate-900')}>{p.title}</div>
        <div className={'mt-0.5 text-[12px] ' + (dark ? 'text-white/65' : 'text-slate-600')}>{p.body}</div>
        <button className={'mt-1.5 text-[11.5px] font-medium ' + (dark ? 'text-sky-300 hover:text-sky-200' : 'text-sky-700 hover:text-sky-800')}>{p.cta} →</button>
      </div>
    </li>
  );
}

function PushToast({ toast, dark }) {
  if (!toast) return null;
  return (
    <div className="pointer-events-auto fixed right-6 bottom-6 z-30 w-[340px] rounded-xl shadow-xl"
      style={{ animation: 'toastIn 240ms cubic-bezier(.21,1.02,.73,1)', background: dark ? '#11151c' : '#ffffff', border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}` }}>
      <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: dark ? 'rgba(255,255,255,0.08)' : '#f1f5f9' }}>
        <div className="flex items-center gap-1.5">
          <span className="text-base leading-none">🤖</span>
          <span className={`text-[11px] font-semibold uppercase tracking-wider ${dark ? 'text-violet-300' : 'text-violet-700'}`}>Quant Push</span>
        </div>
        <span className={`text-[10.5px] ${dark ? 'text-white/45' : 'text-slate-400'}`}>{toast.at}</span>
      </div>
      <div className="p-3">
        <div className={`text-[13px] font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{toast.title}</div>
        <div className={`mt-0.5 text-[12px] ${dark ? 'text-white/70' : 'text-slate-600'}`}>{toast.body}</div>
        <div className="mt-2.5 flex items-center gap-1.5">
          <button className="rounded-md bg-sky-600 px-2.5 py-1 text-[11.5px] font-semibold text-white hover:bg-sky-700">{toast.cta}</button>
          <button className={`rounded-md border px-2.5 py-1 text-[11.5px] ${dark ? 'border-white/[0.08] text-white/70' : 'border-slate-200 text-slate-600'}`}>Dismiss</button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ dark, watchedIds, onToggleWatch, onPreview }) {
  var picks = (window.MARKET_STRATEGIES || [])
    .filter(function(s) { return !watchedIds || !watchedIds.includes(s.id); })
    .slice(0, 6);

  return (
    <div className="px-7 py-8">
      <div className="text-center mb-8">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full text-2xl" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>🤖</div>
        <div className={`mt-4 text-[18px] font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>Your Activity list is empty</div>
        <p className={`mx-auto mt-1 max-w-md text-[13px] ${dark ? 'text-white/60' : 'text-slate-500'}`}>
          Add strategies to your Activity list to start tracking their signals and performance. Here are some picks to get you started.
        </p>
      </div>

      {picks.length > 0 && (
        <div className={`rounded-2xl border p-5 ${dark ? 'border-white/[0.05] bg-white/[0.02]' : 'border-slate-200/70 bg-white'}`}>
          <div className="flex items-center gap-2 mb-4">
            <div className="grid h-7 w-7 place-items-center rounded-md" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
              <span className="text-sm">🤖</span>
            </div>
            <span className={`text-[13px] font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>Recommended for you</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {picks.map(function(s) {
              var pos = s.metrics.ret1Y >= 0;
              return (
                <div key={s.id} className={`relative overflow-hidden rounded-xl border p-4 ${dark ? 'border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06]' : 'border-slate-200/70 bg-white hover:bg-slate-50'} transition cursor-pointer`} onClick={function() { if (onPreview) onPreview(s); }}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-[10px] font-bold text-white" style={{ background: s.author.avatarColor }}>
                        {s.symbol.slice(0, 3)}
                      </div>
                      <div className="min-w-0">
                        <div className={`truncate text-[13px] font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{s.name}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <UniversePill universe={s.universe} dark={dark} compact />
                        </div>
                      </div>
                    </div>
                    <div className={`text-right shrink-0`}>
                      <div className={`text-[16px] font-bold tabular-nums ${pos ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {pos ? '+' : ''}{s.metrics.ret1Y.toFixed(1)}%
                      </div>
                      <div className={`text-[9px] uppercase tracking-wider ${dark ? 'text-white/40' : 'text-slate-400'}`}>1Y Return</div>
                    </div>
                  </div>
                  <div className={`flex items-center justify-between gap-2 text-[11px] mb-3 ${dark ? 'text-white/50' : 'text-slate-500'}`}>
                    <span>Sharpe {s.metrics.sharpe1Y.toFixed(2)}</span>
                    <span>Max DD {s.metrics.maxDD.toFixed(1)}%</span>
                    <span>Win {s.metrics.winRate}%</span>
                  </div>
                  <button
                    onClick={function(e) { e.stopPropagation(); if (onToggleWatch) onToggleWatch(s.id); }}
                    className="w-full rounded-md bg-sky-600 py-1.5 text-[12px] font-semibold text-white hover:bg-sky-700"
                  >
                    + Add to Activity
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function RemoveConfirmDialog({ dark, strategyName, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className={`w-full max-w-sm rounded-2xl border p-6 shadow-xl ${dark ? 'border-white/10 bg-[#181c24]' : 'border-slate-200 bg-white'}`}>
        <div className={`text-[15px] font-semibold mb-2 ${dark ? 'text-white' : 'text-slate-900'}`}>Remove strategy?</div>
        <p className={`text-[13px] mb-5 ${dark ? 'text-white/60' : 'text-slate-500'}`}>
          Are you sure you want to remove <b>{strategyName}</b> from your Activity list? This will stop tracking its signals.
        </p>
        <div className="flex items-center justify-end gap-2">
          <button onClick={onCancel} className={`rounded-md px-3 py-1.5 text-[12px] font-medium ${dark ? 'text-white/70 hover:bg-white/8' : 'text-slate-600 hover:bg-slate-100'}`}>Cancel</button>
          <button onClick={onConfirm} className="rounded-md bg-rose-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-rose-700">Remove</button>
        </div>
      </div>
    </div>
  );
}

function fmtUSD(n) {
  const sign = n < 0 ? '-' : (n > 0 ? '+' : '');
  return sign + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

Object.assign(window, { OnWatchTab, fmtUSD });
