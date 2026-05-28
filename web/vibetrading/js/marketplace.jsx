// Marketplace tab — discover, leaderboard, AI for-you, cards.

const { useState: useStateM } = React;

function MarketplaceTab({ direction, darkMode, watchedIds, onToggleWatch, onOptimize, onWriteNew, onPreview }) {
  const isBold = direction === 'bold';
  const isCons = direction === 'conservative';
  const dark = darkMode || isBold;

  const [assetFilter, setAssetFilter] = useStateM('All');
  const [styleFilter, setStyleFilter] = useStateM('All styles');
  const [sortBy, setSortBy] = useStateM('1Y Sharpe');
  const [hoverIdx, setHoverIdx] = useStateM(null);

  const filtered = window.MARKET_STRATEGIES.filter(s => {
    if (assetFilter !== 'All' && s.market !== assetFilter) return false;
    if (styleFilter !== 'All styles' && !s.tags.includes(styleFilter)) return false;
    return true;
  });

  return (
    <div className="px-7 py-5 space-y-6">
      <ForYouRow direction={direction} dark={dark} watchedIds={watchedIds} onToggleWatch={onToggleWatch} onPreview={onPreview} />

      <LeaderboardSection direction={direction} dark={dark} hoverIdx={hoverIdx} setHoverIdx={setHoverIdx} onPreview={onPreview} />

      {/* Filter / sort bar — unified row: Asset | Style | Engine on left, Rail + Sort on right */}
      <div className={`rounded-xl border p-2.5 ${dark ? 'border-white/[0.05] bg-white/[0.03]' : 'border-slate-200/70 bg-white elev-tile'}`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <FilterDropdown label="Asset" options={window.ASSET_FILTERS} value={assetFilter} onChange={setAssetFilter} dark={dark} />
          <FilterDropdown label="Style" options={window.STYLE_FILTERS} value={styleFilter} onChange={setStyleFilter} dark={dark} />
          <div className="ml-auto flex items-center gap-2">
            <SortDropdown value={sortBy} onChange={setSortBy} dark={dark} />
          </div>
        </div>
      </div>

      {/* Cards grid */}
      <div className={`grid gap-3 ${isCons ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
        {filtered.map(s => (
          <StrategyCard
            key={s.id}
            strategy={s}
            watched={watchedIds.includes(s.id)}
            onToggleWatch={() => onToggleWatch(s.id)}
            onPreview={() => onPreview(s)}
            direction={direction}
            dark={dark}
          />
        ))}
      </div>
    </div>
  );
}

function ForYouRow({ direction, dark, watchedIds, onToggleWatch, onPreview }) {
  const picks = window.MARKET_STRATEGIES
    .slice()
    .sort((a, b) => b.aiMatch - a.aiMatch)
    .slice(0, 3);

  return (
    <section className={`relative overflow-hidden rounded-2xl border ${dark ? 'border-white/[0.05]' : 'border-slate-200/70 elev-card'}`}>
      <div className="absolute inset-0 pointer-events-none" style={{
        background: dark
          ? 'radial-gradient(700px 220px at 6% 50%, rgba(124,58,237,.10), transparent 60%), radial-gradient(800px 240px at 94% 50%, rgba(14,165,233,.10), transparent 60%), #0e1116'
          : 'radial-gradient(900px 280px at 8% 0%, rgba(14,165,233,0.08), transparent 60%), radial-gradient(900px 260px at 100% 100%, rgba(124,58,237,0.05), transparent 60%), linear-gradient(180deg,#fafcff 0%,#ffffff 100%)',
      }} />
      <div className="relative p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md shadow-sm" style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
              <span className="text-base">🤖</span>
            </div>
            <div>
              <div className={`text-[13px] font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>
                Picks for you
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {picks.map((s, i) => (
            <ForYouCard key={s.id} strategy={s} rank={i + 1} dark={dark} watched={watchedIds.includes(s.id)} onToggle={() => onToggleWatch(s.id)} onPreview={() => onPreview(s)} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ForYouCard({ strategy: s, rank, dark, watched, onToggle, onPreview }) {
  return (
    <HeroStrategyCard
      strategy={s}
      dark={dark}
      watched={watched}
      onToggle={onToggle}
      onPreview={onPreview}
    />
  );
}

function HeroStrategyCard({ strategy: s, dark, watched, onToggle, onPreview, rightSlot, titleBadges }) {
  const positive = s.metrics.ret1Y >= 0;
  const accent = positive ? '#10b981' : '#ef4444';
  const tintTop = positive ? 'rgba(16,185,129,0.22)' : 'rgba(239,68,68,0.22)';
  const tintMid = positive ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)';

  return (
    <div className={`group relative flex flex-col overflow-hidden rounded-2xl border transition ${
      dark ? 'border-white/[0.06] bg-white/[0.04] hover:bg-white/[0.07]' : 'border-slate-200/70 bg-white elev-tile'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[10.5px] font-bold text-white" style={{ background: s.author.avatarColor }}>
            {s.symbol.slice(0, 3)}
          </div>
          <div className="min-w-0">
            <div className={`flex items-center gap-1.5 ${dark ? 'text-white' : 'text-slate-900'}`}>
              <span className="truncate text-[15px] font-semibold leading-tight">{s.name}</span>
              {titleBadges}
            </div>
            <div className="mt-1 flex min-w-0 items-center gap-1.5">
              <UniversePill universe={s.universe} dark={dark} compact />
            </div>
          </div>
        </div>
        {rightSlot}
      </div>

      {/* Hero chart + metrics panel */}
      <div className="relative" style={{
        background: `linear-gradient(180deg, ${tintTop} 0%, ${tintMid} 55%, transparent 100%)`,
      }}>
        <div className="pt-3">
          <Sparkline curve={s.curve} color={accent} width={400} height={110} stretch strokeWidth={2.4} />
        </div>
        <div className="grid grid-cols-3 gap-1 px-2 pb-3 pt-1">
          <HeroStat label="1Y" value={`${positive ? '+' : ''}${s.metrics.ret1Y.toFixed(1)}%`} tone={positive ? 'pos' : 'neg'} dark={dark} />
          <HeroStat label="Sharpe" value={s.metrics.sharpe1Y.toFixed(2)} dark={dark} />
          <HeroStat label="Max DD" value={`${s.metrics.maxDD.toFixed(1)}%`} tone="neg" dark={dark} />
        </div>
      </div>

      {/* Description */}
      <p className={`mt-3 line-clamp-2 px-4 text-[12.5px] leading-relaxed ${dark ? 'text-white/70' : 'text-slate-600'}`}>{s.blurb}</p>

      {/* Tags */}
      <div className="mt-2.5 flex flex-wrap gap-1.5 px-4">
        {s.tags.slice(0, 3).map(t => (
          <span key={t} className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${dark ? 'bg-white/8 text-white/65' : 'bg-slate-100 text-slate-600'}`}>{t}</span>
        ))}
      </div>

      {/* CTAs */}
      <div className="mt-auto flex gap-2 p-4 pt-3">
        <button onClick={onPreview} className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-[13px] font-medium ${dark ? 'border-white/[0.10] text-white/85 hover:bg-white/8' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
          Preview
        </button>
        <button onClick={onToggle} className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[13px] font-semibold ${
          watched
            ? (dark ? 'bg-white/15 text-white' : 'bg-slate-800 text-white')
            : (dark ? 'bg-white text-slate-900 hover:bg-white/90' : 'bg-slate-900 text-white hover:bg-slate-800')
        }`}>
          {watched ? '✓ Added to Activity' : '+ Add to Activity'}
        </button>
      </div>
    </div>
  );
}

function HeroStat({ label, value, tone, dark }) {
  const toneCls = tone === 'pos' ? 'text-emerald-600'
    : tone === 'neg' ? 'text-rose-600'
    : (dark ? 'text-white' : 'text-slate-900');
  return (
    <div className="text-center">
      <div className={`text-[10.5px] font-medium uppercase tracking-wider ${dark ? 'text-white/45' : 'text-slate-400'}`}>{label}</div>
      <div className={`mt-0.5 font-mono text-[19px] font-bold tabular-nums leading-tight ${toneCls}`}>{value}</div>
    </div>
  );
}

function LeaderboardSection({ direction, dark, hoverIdx, setHoverIdx, onPreview }) {
  const [range, setRange] = useStateM('3M');
  const [marketFilter, setMarketFilter] = useStateM('all');

  const allLines = window.LEADERBOARD_LINES.map(l => ({ ...l, ...window.MARKET_STRATEGIES.find(s => s.id === l.id) }));
  const filtered = allLines.filter(l => {
    if (marketFilter !== 'all' && l.market !== marketFilter) return false;
    return true;
  });
  const sorted = filtered.slice().sort((a, b) => b.metrics.ret1Y - a.metrics.ret1Y);

  const markets = [...new Set(allLines.map(l => l.market).filter(Boolean))];

  return (
    <section className={`rounded-2xl border ${dark ? 'border-white/[0.05] bg-white/[0.02]' : 'border-slate-200/70 bg-white elev-card'}`}>
      <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: dark ? 'rgba(255,255,255,0.08)' : '#eef1f6' }}>
        <div>
          <div className={`flex items-center gap-2 text-[15px] font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>
            Leaderboard
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${dark ? 'bg-white/8 text-white/70' : 'bg-slate-100 text-slate-500'}`}>OOS · 90 days</span>
          </div>
          <div className={`mt-0.5 text-[12px] ${dark ? 'text-white/55' : 'text-slate-500'}`}>
            Cumulative out-of-sample net value. We re-rank weekly so the leaderboard reflects post-publication performance, not curve-fitting.
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {['1M', '3M', '6M', '1Y', 'All'].map(t => (
            <button key={t} onClick={() => setRange(t)} className={`rounded-md px-2 py-1 text-[11.5px] font-medium ${
              t === range
                ? (dark ? 'bg-white/12 text-white' : 'bg-slate-900 text-white')
                : (dark ? 'text-white/60 hover:bg-white/8' : 'text-slate-500 hover:bg-slate-100')
            }`}>{t}</button>
          ))}
        </div>
      </div>

      {/* Condition filters */}
      <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-5 py-2.5`} style={{ borderColor: dark ? 'rgba(255,255,255,0.08)' : '#eef1f6' }}>
        {markets.length > 1 && (
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-bold uppercase tracking-[0.12em] ${dark ? 'text-white/45' : 'text-slate-400'}`}>Market</span>
            <button onClick={() => setMarketFilter('all')} className={`rounded-md px-2 py-1 text-[11.5px] font-medium ${
              marketFilter === 'all' ? (dark ? 'bg-white/12 text-white' : 'bg-slate-900 text-white') : (dark ? 'text-white/60 hover:bg-white/8' : 'text-slate-500 hover:bg-slate-100')
            }`}>All</button>
            {markets.map(m => (
              <button key={m} onClick={() => setMarketFilter(m)} className={`rounded-md px-2 py-1 text-[11.5px] font-medium ${
                marketFilter === m ? (dark ? 'bg-white/12 text-white' : 'bg-slate-900 text-white') : (dark ? 'text-white/60 hover:bg-white/8' : 'text-slate-500 hover:bg-slate-100')
              }`}>{m}</button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5">
        <div className="lg:col-span-3 p-4 pl-2">
          <LeaderboardChart lines={filtered} height={260} hoverIndex={hoverIdx} onHoverIndex={setHoverIdx} dark={dark} />
        </div>
        <div className={`lg:col-span-2 border-l ${dark ? 'border-white/[0.05]' : 'border-slate-200'}`}>
          <table className="w-full text-[12px]">
            <thead>
              <tr className={dark ? 'text-white/45' : 'text-slate-400'}>
                <th className="px-3 py-2 text-left font-medium">#</th>
                <th className="py-2 text-left font-medium">Strategy</th>
                <th className="py-2 text-right font-medium">OOS 3M</th>
                <th className="px-3 py-2 text-right font-medium">Sharpe</th>
              </tr>
            </thead>
            <tbody className={dark ? 'text-white/80' : 'text-slate-700'}>
              {sorted.slice(0, 8).map((l, i) => (
                <tr key={l.id}
                  onClick={() => onPreview && onPreview(l)}
                  className={`cursor-pointer transition ${i % 2 === 0 ? '' : (dark ? 'bg-white/[0.02]' : 'bg-slate-50/50')} ${dark ? 'hover:bg-white/[0.06]' : 'hover:bg-sky-50/60'}`}
                  title="Click to preview"
                >
                  <td className="px-3 py-2 tabular-nums">{i + 1}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: l.color }} />
                      <span className="truncate">{l.name}</span>
                    </div>
                  </td>
                  <td className={`py-2 text-right tabular-nums font-semibold ${l.metrics.ret1Y >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {l.metrics.ret1Y >= 0 ? '+' : ''}{(l.metrics.ret1Y / 4).toFixed(2)}%
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{l.metrics.sharpe1Y.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function EngineFilterChips({ value, onChange, dark }) {
  const engines = ['screen', 'pine', 'event', 'factor'];
  return (
    <div className="flex items-center gap-2">
      <span className={`rounded-md px-1.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${dark ? 'bg-white/10 text-white/65' : 'bg-slate-100 text-slate-500'}`}>Engine</span>
      <div className="flex flex-wrap gap-1">
        <button onClick={() => onChange('all')} className={`rounded-md px-2.5 py-1 text-[12px] ${value === 'all' ? (dark ? 'bg-white text-slate-900' : 'bg-slate-900 text-white') : (dark ? 'text-white/70 hover:bg-white/8' : 'text-slate-600 hover:bg-slate-100')}`}>All</button>
        {engines.map((e) => {
          const info = window.ENGINE_INFO[e];
          const active = value === e;
          return (
            <button
              key={e}
              onClick={() => onChange(e)}
              title={info.label + ' · ' + info.shortSub}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] font-medium ${active ? (dark ? info.darkBadge : info.lightBadge) : (dark ? 'text-white/70 hover:bg-white/8' : 'text-slate-600 hover:bg-slate-100')}`}
            >
              <span className="text-[11px]">{info.icon}</span>
              {info.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FilterChips({ label, options, value, onChange, dark }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`rounded-md px-1.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
        dark ? 'bg-white/10 text-white/65' : 'bg-slate-100 text-slate-500'
      }`}>{label}</span>
      <div className="flex gap-1">
        {options.map(o => (
          <button key={o} onClick={() => onChange(o)} className={`rounded-md px-2.5 py-1 text-[12px] ${
            value === o
              ? (dark ? 'bg-white text-slate-900' : 'bg-slate-900 text-white')
              : (dark ? 'text-white/70 hover:bg-white/8' : 'text-slate-600 hover:bg-slate-100')
          }`}>{o}</button>
        ))}
      </div>
    </div>
  );
}

function RailToggle({ value, onChange, dark }) {
  const rails = [
    { id: 'all', label: 'All' },
    { id: 'hot', label: '🔥 Hot' },
    { id: 'top', label: '⭐ Top' },
    { id: 'new', label: '✦ New' },
  ];
  return (
    <div className={`flex rounded-md p-0.5 ${dark ? 'bg-white/8' : 'bg-slate-100'}`}>
      {rails.map(r => (
        <button key={r.id} onClick={() => onChange(r.id)} className={`rounded-[5px] px-2.5 py-1 text-[12px] font-medium ${
          value === r.id ? (dark ? 'bg-[#0b0d12] text-white shadow' : 'bg-white text-slate-900 shadow') : (dark ? 'text-white/60' : 'text-slate-500')
        }`}>{r.label}</button>
      ))}
    </div>
  );
}

function FilterDropdown({ label, options, value, onChange, dark }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`text-[10px] font-bold uppercase tracking-[0.12em] ${dark ? 'text-white/45' : 'text-slate-400'}`}>{label}</span>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)} className={`appearance-none rounded-md border py-1.5 pl-2.5 pr-7 text-[12px] font-medium ${
          dark ? 'border-white/[0.06] bg-white/[0.05] text-white' : 'border-slate-200 bg-white text-slate-700'
        }`}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-50" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
      </div>
    </div>
  );
}

function SortDropdown({ value, onChange, dark }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)} className={`appearance-none rounded-md border py-1.5 pl-2.5 pr-7 text-[12px] font-medium ${
        dark ? 'border-white/[0.06] bg-white/[0.05] text-white' : 'border-slate-200 bg-white text-slate-700'
      }`}>
        {['1Y Sharpe', '1Y Return', 'CAGR 5Y', 'Max Drawdown', 'Followers', 'Recently published'].map(o => <option key={o}>{o}</option>)}
      </select>
      <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-50" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
    </div>
  );
}

function UniversePill({ universe, dark, compact }) {
  if (!universe) return null;
  const isMulti = universe.kind === 'multi';
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded ${compact ? 'px-1.5 py-px text-[10.5px]' : 'px-2 py-0.5 text-[11px]'} font-medium ${
      isMulti
        ? (dark ? 'bg-violet-400/15 text-violet-300' : 'bg-violet-50 text-violet-700')
        : (dark ? 'bg-sky-400/15 text-sky-300' : 'bg-sky-50 text-sky-700')
    }`}>
      {isMulti
        ? (<><svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="currentColor"><path d="M13 2l-2 7h6l-9 13 2-9H4z"/></svg>{universe.label}</>)
        : (<><svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/></svg>{universe.label}</>)
      }
    </span>
  );
}

function StrategyCard({ strategy: s, watched, onToggleWatch, direction, dark, onPreview }) {
  const positive = s.metrics.ret1Y >= 0;
  const accent = positive ? '#10b981' : '#ef4444';

  return (
    <div className={`group relative flex flex-col overflow-hidden rounded-xl border transition ${
      dark
        ? 'border-white/[0.05] bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/[0.10]'
        : 'border-slate-200/70 bg-white hover:border-slate-300 elev-tile'
    }`}>
      {/* Header: avatar + name | inline sparkline + followers */}
      <div className="flex items-start gap-2 px-3 pt-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white" style={{ background: s.author.avatarColor }}>
          {s.symbol.slice(0, 3)}
        </div>
        <div className="min-w-0 flex-1">
          <div className={`flex items-center gap-1 ${dark ? 'text-white' : 'text-slate-900'}`}>
            <span className="truncate text-[13.5px] font-semibold leading-tight">{s.name}</span>
          </div>
          <div className={`mt-0.5 flex min-w-0 items-center gap-1.5 text-[10.5px] ${dark ? 'text-white/55' : 'text-slate-500'}`}>
            <UniversePill universe={s.universe} dark={dark} compact />
          </div>
        </div>
        <div className="flex shrink-0 items-end">
          <div className="h-9 w-16">
            <Sparkline curve={s.curve} color={accent} width={64} height={36} stretch strokeWidth={1.5} />
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="mt-2.5 grid grid-cols-3 gap-1 px-3">
        <CompactStat label="Return" value={`${positive ? '+' : ''}${s.metrics.ret1Y.toFixed(1)}%`} tone={positive ? 'pos' : 'neg'} dark={dark} />
        <CompactStat label="Sharpe" value={s.metrics.sharpe1Y.toFixed(2)} dark={dark} />
        <CompactStat label="Max DD" value={`${s.metrics.maxDD.toFixed(1)}%`} tone="neg" dark={dark} />
      </div>

      {/* Blurb */}
      <p className={`mt-2 line-clamp-1 px-3 text-[11px] leading-snug ${dark ? 'text-white/55' : 'text-slate-500'}`}>{s.blurb}</p>

      {/* Tags */}
      <div className="mt-1.5 flex flex-wrap gap-1 px-3 pb-3">
        {s.tags.slice(0, 3).map(t => (
          <span key={t} className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${dark ? 'bg-white/8 text-white/65' : 'bg-slate-100 text-slate-600'}`}>{t}</span>
        ))}
      </div>

      {/* Hover overlay — slides up from bottom */}
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-full gap-1.5 p-2 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 ${
          dark ? 'bg-[#0e1116]/95' : 'bg-white/95'
        }`}
        style={{
          borderTop: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #eef1f6',
          backdropFilter: 'blur(6px)',
        }}
      >
        <button
          onClick={onPreview}
          className={`pointer-events-auto flex flex-1 items-center justify-center gap-1 rounded-lg border py-1.5 text-[11.5px] font-medium ${
            dark ? 'border-white/[0.10] text-white/85 hover:bg-white/8' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
          Preview
        </button>
        <button
          onClick={onToggleWatch}
          className={`pointer-events-auto flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[11.5px] font-semibold ${
            watched
              ? (dark ? 'bg-white/15 text-white' : 'bg-slate-800 text-white')
              : (dark ? 'bg-white text-slate-900 hover:bg-white/90' : 'bg-slate-900 text-white hover:bg-slate-800')
          }`}
        >
          {watched ? '✓ Added' : '+ Add to Activity'}
        </button>
      </div>
    </div>
  );
}

function CompactStat({ label, value, tone, dark }) {
  const toneCls = tone === 'pos' ? 'text-emerald-600'
    : tone === 'neg' ? 'text-rose-600'
    : (dark ? 'text-white' : 'text-slate-900');
  return (
    <div>
      <div className={`text-[9.5px] font-medium uppercase tracking-wide ${dark ? 'text-white/45' : 'text-slate-400'}`}>{label}</div>
      <div className={`mt-0.5 font-mono text-[13px] font-bold tabular-nums leading-tight ${toneCls}`}>{value}</div>
    </div>
  );
}

Object.assign(window, { MarketplaceTab, UniversePill });
