// AInvest top navbar (interactive page-tab row) + Strategy Studio page header with sub-tabs.

const TOP_TABS = [
  { id: 'aime',      label: 'Aime' },
  { id: 'studio',    label: 'Strategy' },
  { id: 'aicharts',  label: 'AI Charts' },
  { id: 'markets',   label: 'Markets' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'news',      label: 'News' },
  { id: 'brokers',   label: 'Brokers 🎁' },
];

function AInvestTopbar({ darkMode, pageTab, setPageTab }) {
  return (
    <header className={`relative z-10 flex h-14 items-center gap-4 px-5 ${darkMode ? 'border-b border-white/[0.05] bg-[#0b0d12]' : 'bg-white topbar-edge'}`}>
      <div className="flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-md" style={{ background: 'linear-gradient(135deg,#22c55e 0%,#0ea5e9 100%)' }}>
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 17l5-5 4 4 8-9" /></svg>
        </div>
        <span className={`text-[15px] font-semibold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>AInvest</span>
      </div>

      <div className="ml-3 flex flex-1 items-center justify-center gap-1">
        <button className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] ${darkMode ? 'bg-white/8 text-white/90' : 'bg-slate-100 text-slate-700'}`}>
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 opacity-70" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          <span className="text-slate-400">Symbols</span>
        </button>
        {TOP_TABS.map((t) => {
          const active = pageTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setPageTab(t.id)}
              className={`relative rounded-md px-3 py-1.5 text-[13.5px] ${active ? 'font-semibold' : 'font-medium'} ${darkMode ? (active ? 'text-white' : 'text-white/70 hover:text-white') : (active ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900')}`}
            >
              {t.label}
              {active && <span className="absolute inset-x-3 -bottom-[15px] h-[2px] rounded-full" style={{ background: '#0ea5e9' }} />}
            </button>
          );
        })}
      </div>

      <button className={`rounded-md px-3 py-1.5 text-[12.5px] font-semibold ${darkMode ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-950 text-white'}`}>Premium</button>
      <button className={`rounded-md border px-3 py-1.5 text-[12.5px] font-medium ${darkMode ? 'border-white/[0.10] text-white' : 'border-slate-300 text-slate-700'}`}>Download</button>
      <div className={`grid h-8 w-8 place-items-center rounded-full text-[12px] font-semibold ${darkMode ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'}`}>JZ</div>
    </header>
  );
}

function QuantLabHeader({ tab, setTab, direction, darkMode, copilotOpen, setCopilotOpen, watchCount, onWriteNew }) {
  const isBold = direction === 'bold';
  const palette = darkMode || isBold ? {
    surface: 'bg-transparent',
    title: 'text-white',
    sub: 'text-white/60',
    border: 'border-white/[0.05]',
    btn: 'bg-white/8 text-white border-white/[0.08] hover:bg-white/15',
  } : {
    surface: 'studio-hero',
    title: 'text-slate-900',
    sub: 'text-slate-500',
    border: 'border-slate-200/70',
    btn: 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50',
  };

  return (
    <div className={`border-b ${palette.border} ${palette.surface}`}>
      <div className="px-7 pt-5 pb-3 flex items-start justify-between gap-6">
        <div>
          <div className={`mb-1.5 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] ${palette.sub}`}>
            <span>Strategy</span>
          </div>
          <h1 className={`text-[26px] font-semibold tracking-tight ${palette.title}`} style={{ letterSpacing: '-0.015em' }}>
            {tab === 'marketplace'
              ? 'Browse battle-tested strategies'
              : tab === 'activity'
              ? 'Activity across your deployed strategies'
              : tab === 'studio'
              ? 'Build and backtest your own strategies'
              : 'Your deployed strategies'}
          </h1>
        </div>

        <div className="flex shrink-0 items-center pt-1" />
      </div>

      <div className="px-7">
        <div className="flex items-center gap-1">
          <TabBtn label="Marketplace" active={tab === 'marketplace'} onClick={() => setTab('marketplace')} dark={darkMode || isBold} icon={
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 7l1.5-3h15L21 7M3 7v13h18V7M3 7h18M8 11a4 4 0 008 0" /></svg>
          } />
          <TabBtn label="Studio" active={tab === 'studio'} onClick={() => setTab('studio')} dark={darkMode || isBold} icon={
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M9 3v6l-4 7a4 4 0 003.46 6h7.08A4 4 0 0019 16l-4-7V3M8 3h8" /></svg>
          } />
          <TabBtn label="Activity" active={tab === 'watch'} onClick={() => setTab('watch')} dark={darkMode || isBold} badge={watchCount} icon={
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
          } />
          <TabBtn label="Deployed" active={tab === 'activity'} onClick={() => setTab('activity')} dark={darkMode || isBold} icon={
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 12h4l3-8 4 16 3-8h4" /></svg>
          } />
          <div className="ml-auto pb-2" />
        </div>
      </div>
    </div>
  );
}

function TabBtn({ label, sub, active, onClick, dark, icon, badge }) {
  const baseColor = dark
    ? (active ? 'text-white' : 'text-white/55 hover:text-white')
    : (active ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900');
  return (
    <button onClick={onClick} className={`relative flex items-center gap-2.5 px-3 py-2.5 text-[14px] font-medium ${baseColor}`}>
      <span className="opacity-80">{icon}</span>
      <span className="flex items-baseline gap-1.5">
        {label}
        {sub && <span className={`text-[11px] font-normal ${dark ? 'text-white/40' : 'text-slate-400'}`}>{sub}</span>}
        {badge != null && (
          <span className={`ml-1 rounded-full px-1.5 py-px text-[10px] font-semibold ${dark ? 'bg-white/12 text-white' : 'bg-slate-900 text-white'}`}>{badge}</span>
        )}
      </span>
      {active && (
        <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full" style={{ background: dark ? '#0ea5e9' : '#0f172a' }} />
      )}
    </button>
  );
}

function SearchBox({ dark }) {
  return (
    <div className={`flex w-[260px] items-center gap-2 rounded-md border px-2.5 py-1.5 text-[12.5px] ${dark ? 'border-white/[0.08] bg-white/5 text-white/70' : 'border-slate-200 bg-white text-slate-500'}`}>
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 opacity-60" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
      <input placeholder="Search 8 strategies, tags, authors…" className="flex-1 bg-transparent outline-none placeholder:opacity-60" />
      <kbd className={`hidden rounded px-1.5 py-0.5 text-[10px] sm:inline ${dark ? 'bg-white/10 text-white/60' : 'bg-slate-100 text-slate-500'}`}>⌘K</kbd>
    </div>
  );
}

Object.assign(window, { AInvestTopbar, QuantLabHeader });
