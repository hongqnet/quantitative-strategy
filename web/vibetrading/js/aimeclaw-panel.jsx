// AimeClaw chat panel — replaces the old copilot.jsx stub.
// Mounts inside vibetrading right column; reads/dispatches via useAimeClaw context.

const { useEffect: useEffectP, useRef: useRefP, useState: useStateP, useMemo: useMemoP } = React;

function AimeClawPanel({ open, onClose, dark }) {
  // Floating launcher when collapsed (kept for parity with old stub).
  if (!open) {
    return (
      <button
        onClick={onClose}
        className="fixed bottom-6 right-6 z-30 grid h-12 w-12 place-items-center rounded-full text-xl text-white shadow-lg"
        style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}
        title="Open aime"
      >
        🤖
      </button>
    );
  }

  return (
    <aside className={`relative flex h-full w-[440px] shrink-0 flex-col ${dark ? 'border-l border-white/[0.06] bg-[#0d1014]' : 'bg-white chat-rail'}`}>
      <ChatHeader onClose={onClose} dark={dark} />
      <ChatTimeline dark={dark} />
      <BottomSummary dark={dark} />
      <DemoControlsBar dark={dark} />
      <ChatToasts dark={dark} />
    </aside>
  );
}

function ChatHeader({ onClose, dark }) {
  const aime = window.useAimeClaw();
  const isQuant = aime.state.flowName === 'quant';
  const flow = window.getActiveFlow ? window.getActiveFlow(aime.state) : window.AIMECLAW_FLOW;
  const stage = aime.state.stage;
  const total = flow.length;
  return (
    <header className={`flex h-14 items-center gap-2 border-b px-3 ${dark ? 'border-white/[0.05]' : 'border-slate-200/70'}`}
      style={dark ? undefined : { background: 'linear-gradient(180deg, rgba(243,232,255,0.55) 0%, #ffffff 100%)' }}
    >
      <div className="flex flex-1 items-center gap-2">
        <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] font-semibold"
          style={{ background: dark ? 'rgba(124,58,237,.22)' : '#f3e8ff', color: dark ? '#c4b5fd' : '#6d28d9' }}>
          <span>🤖</span>
          aime
        </div>
        {isQuant && (
          <div className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider ${dark ? 'bg-sky-500/18 text-sky-200' : 'bg-sky-50 text-sky-700'}`} title="Quant build flow">
            <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M3 17l6-6 4 4 8-9" /></svg>
            Quant build · Step {stage + 1}/{total}
          </div>
        )}
      </div>
      <window.CreditsBadgeA credits={aime.state.credits} dark={dark} />
      <button onClick={onClose} className={`grid h-7 w-7 place-items-center rounded ${dark ? 'text-white/40 hover:bg-white/8' : 'text-slate-400 hover:bg-slate-100'}`}>
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
    </header>
  );
}

function ChatTimeline({ dark }) {
  const aime = window.useAimeClaw();
  const scrollerRef = useRefP(null);
  const stage = aime.state.stage;
  const refined = aime.state.refined;

  const blocks = useMemoP(() => {
    const flow = window.getActiveFlow ? window.getActiveFlow(aime.state) : window.AIMECLAW_FLOW;
    const out = [];
    for (let i = 0; i <= Math.min(stage, flow.length - 1); i++) {
      out.push(...flow[i].blocks);
    }
    return out;
  }, [stage, aime.state.flowName]);

  useEffectP(() => {
    const el = scrollerRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    });
  }, [stage, refined, aime.state.deployments.length, aime.state.flowName]);

  return (
    <div ref={scrollerRef} className="aimeclaw-scrollbar flex-1 overflow-y-auto">
      <div className="space-y-3.5 px-3 py-4 pb-6">
        {blocks.map((b) => (
          <window.BlockRendererA key={b.id} block={b} dark={dark} />
        ))}
        {refined && stage === 4 && <window.OptimizationShowcaseA dark={dark} />}
      </div>
    </div>
  );
}

function isToday(ts) {
  if (!ts) return false;
  const d = new Date(ts);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function BottomSummary({ dark }) {
  const aime = window.useAimeClaw();
  const [expanded, setExpanded] = useStateP(false);
  const todays = aime.state.deployments.filter((d) => isToday(d.startedAt));
  if (todays.length === 0) return null;

  const visible = expanded ? todays : todays.slice(0, 3);
  const hidden = todays.length - visible.length;

  return (
    <div className={`border-t px-3 py-2 ${dark ? 'border-white/[0.05] bg-white/[0.02]' : 'border-slate-200/60 bg-gradient-to-b from-slate-50/80 to-slate-50/40'}`}>
      <div className={`mb-1.5 flex items-center gap-2 text-[9.5px] font-bold uppercase tracking-wider ${dark ? 'text-white/45' : 'text-slate-400'}`}>
        <span>Deployed today</span>
        <span className={`rounded px-1 py-px text-[9px] font-bold ${dark ? 'bg-white/10 text-white/75' : 'bg-slate-200 text-slate-600'}`}>{todays.length}</span>
        <button onClick={aime.navigateToActivity} className={`ml-auto inline-flex items-center gap-1 text-[10px] font-semibold hover:underline ${dark ? 'text-sky-300' : 'text-sky-700'}`}>
          View all in Deployed
          <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </button>
      </div>
      <div className="space-y-1">
        {visible.map((d) => <DeploymentRow key={d.id} dep={d} dark={dark} />)}
        {!expanded && hidden > 0 && (
          <button onClick={() => setExpanded(true)} className={`flex w-full items-center justify-center gap-1 rounded-md border border-dashed px-2 py-1 text-[10.5px] font-medium ${dark ? 'border-white/[0.06] bg-white/[0.03] text-white/55 hover:bg-white/[0.06]' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}>
            +{hidden} more · Expand
          </button>
        )}
        {expanded && todays.length > 3 && (
          <button onClick={() => setExpanded(false)} className={`flex w-full items-center justify-center gap-1 px-2 py-0.5 text-[10.5px] font-medium ${dark ? 'text-white/40 hover:text-white/80' : 'text-slate-400 hover:text-slate-700'}`}>
            Show fewer
          </button>
        )}
      </div>
    </div>
  );
}

function DeploymentRow({ dep, dark }) {
  const aime = window.useAimeClaw();
  const strategy = window.getAimeStrategy(dep.strategyId);
  const name = strategy ? strategy.name : dep.strategyId;
  const isPaper = dep.kind === 'paper';
  const tone = isPaper
    ? (dark
        ? { ring: 'bg-cyan-500/8',  dot: 'bg-cyan-400', label: 'text-cyan-300', icon: 'text-cyan-300' }
        : { ring: 'border border-cyan-200 bg-white', dot: 'bg-cyan-500', label: 'text-cyan-700', icon: 'text-cyan-600' })
    : (dark
        ? { ring: 'bg-rose-500/8',  dot: 'bg-rose-400', label: 'text-rose-300', icon: 'text-rose-300' }
        : { ring: 'border border-rose-200 bg-white', dot: 'bg-rose-500', label: 'text-rose-700', icon: 'text-rose-600' });

  return (
    <div className={`flex items-center gap-1.5 rounded-md py-1 pl-2 pr-1 text-[11px] ${tone.ring}`}>
      <span className="relative flex h-1.5 w-1.5">
        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${tone.dot}`}/>
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${tone.dot}`}/>
      </span>
      {isPaper ? (
        <svg viewBox="0 0 24 24" className={`h-3 w-3 ${tone.icon}`} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 3v6l-4 7a4 4 0 003.46 6h7.08A4 4 0 0019 16l-4-7V3M8 3h8"/></svg>
      ) : (
        <svg viewBox="0 0 24 24" className={`h-3 w-3 ${tone.icon}`} fill="currentColor"><path d="M13 2L3 14h7l-1 8 10-12h-7z"/></svg>
      )}
      <span className={`font-semibold ${tone.label}`}>{isPaper ? 'Paper' : 'Deployed'}</span>
      <span className={dark ? 'text-white/30' : 'text-slate-400'}>·</span>
      <span className={`truncate ${dark ? 'text-white/85' : 'text-slate-700'}`}>{name}</span>
      {dep.tier === 'refined' && (
        <span className={`rounded-full px-1 py-px text-[8.5px] font-bold uppercase tracking-wider ${dark ? 'bg-sky-500/20 text-sky-200' : 'bg-sky-100 text-sky-700'}`}>R</span>
      )}
      <button
        onClick={() => aime.stopDeployment(dep.id)}
        title="Stop deployment"
        className={`ml-auto inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-colors ${dark ? 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25' : 'border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
      >
        <svg viewBox="0 0 24 24" className="h-2 w-2" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
        Stop
      </button>
    </div>
  );
}

function DemoControlsBar({ dark }) {
  const aime = window.useAimeClaw();
  const stage = aime.state.stage;
  const flow = window.getActiveFlow ? window.getActiveFlow(aime.state) : window.AIMECLAW_FLOW;
  const total = flow.length;
  const current = flow[stage];
  const next = flow[stage + 1];
  const isFirst = stage === 0;
  const isLast = stage === total - 1;

  return (
    <div className={`border-t px-3 py-2 ${dark ? 'border-white/[0.04]' : 'border-slate-200/70 bg-white/95 backdrop-blur'}`}>
      <div className={`mb-1 flex items-center justify-between text-[9.5px] font-medium uppercase tracking-wide ${dark ? 'text-white/30' : 'text-slate-400'}`}>
        <span>
          Stage {stage + 1} / {total} · {current.label}
        </span>
        <button onClick={aime.restart} className={`inline-flex items-center gap-1 transition-colors ${dark ? 'text-white/30 hover:text-white/60' : 'text-slate-400 hover:text-slate-700'}`}>
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 12a9 9 0 019-9 9 9 0 016.5 2.7L21 8M21 3v5h-5"/></svg>
          Restart demo
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={aime.retreat}
          disabled={isFirst}
          className={`inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-md text-[12px] font-medium disabled:cursor-not-allowed disabled:opacity-40 ${dark ? 'bg-white/[0.03] text-white/55 hover:bg-white/[0.06] hover:text-white/80' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>
          Prev
        </button>
        <button
          onClick={aime.advance}
          disabled={isLast}
          className={`inline-flex h-8 flex-[2] items-center justify-center gap-1 rounded-md text-[12px] font-medium disabled:cursor-not-allowed disabled:opacity-40 ${dark ? 'bg-white/[0.05] text-white/70 hover:bg-white/[0.08] hover:text-white/90' : 'bg-sky-600 text-white hover:bg-sky-700'}`}
        >
          {isLast ? 'End of demo' : <>Next ▸ {next ? next.hint : ''}</>}
        </button>
      </div>
    </div>
  );
}

function ChatToasts({ dark }) {
  const aime = window.useAimeClaw();
  if (aime.state.toasts.length === 0) return null;
  return (
    <div className="pointer-events-none absolute left-3 right-3 top-16 z-20 space-y-1.5">
      {aime.state.toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] shadow-md ${
            t.tone === 'success'
              ? (dark ? 'bg-emerald-500/15 text-emerald-200' : 'border border-emerald-200 bg-emerald-50 text-emerald-800')
              : (dark ? 'border border-white/[0.06] bg-[#0d1014] text-white/85' : 'border border-slate-200 bg-white text-slate-700')
          }`}
          style={{ animation: 'aimeclaw-fade-up 0.25s ease-out' }}
        >
          <span className="flex-1">{t.body}</span>
          {t.action && (
            <button
              onClick={() => t.action.run && t.action.run()}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                t.tone === 'success'
                  ? (dark ? 'bg-emerald-400/25 text-emerald-100 hover:bg-emerald-400/40' : 'bg-emerald-700 text-white hover:bg-emerald-800')
                  : (dark ? 'bg-white/[0.10] text-white hover:bg-white/[0.18]' : 'bg-slate-900 text-white hover:bg-slate-800')
              }`}
            >
              {t.action.label}
              <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { AimeClawPanel });
