// First-visit welcome modal for Strategy Studio. Recommends 3 AimeClaw strategies with Add to Activity.

const { useState: useStateW2 } = React;

function WelcomeModal({ open, onClose, dark }) {
  if (!open) return null;
  const aime = window.useAimeClaw();
  const ids = ['btc-macd-momentum', 'eth-mean-reversion', 'sol-breakout'];
  const strategies = ids.map((id) => window.getAimeStrategy(id)).filter(Boolean);
  const remaining = ids.filter((id) => !aime.state.addedToLive[id]);
  const remainingCount = remaining.length;

  function addAllAndClose() {
    remaining.forEach((id) => aime.addToLive(id));
    onClose();
  }

  const shellBg = dark
    ? 'radial-gradient(700px 220px at 0% 0%, rgba(14,165,233,0.18), transparent 55%), radial-gradient(700px 220px at 100% 0%, rgba(124,58,237,0.14), transparent 55%), #0d1014'
    : 'radial-gradient(700px 220px at 0% 0%, rgba(14,165,233,0.08), transparent 55%), radial-gradient(700px 220px at 100% 0%, rgba(124,58,237,0.05), transparent 55%), #ffffff';

  return (
    <div className={`fixed inset-0 z-[80] flex items-center justify-center p-6 backdrop-blur-sm ${dark ? 'bg-black/55' : 'bg-slate-900/45'}`} onClick={onClose}>
      <div className={`relative w-full max-w-3xl overflow-hidden rounded-2xl p-6 elev-pop ${dark ? 'border border-white/[0.06]' : ''}`}
        style={{ background: shellBg }}
        onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className={`absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-md ${dark ? 'text-white/40 hover:bg-white/8 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>

        <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${dark ? 'bg-violet-500/20 text-violet-200' : 'bg-violet-50 text-violet-700'}`}>
          <span>🤖</span>
          Curated by aime
        </div>
        <h2 className={`mt-2 text-[22px] font-semibold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`} style={{ letterSpacing: '-0.012em' }}>
          Welcome to Strategy
        </h2>
        <p className={`mt-1 text-[13px] leading-relaxed ${dark ? 'text-white/70' : 'text-slate-600'}`}>
          Hand-picked setups our quants are running this week. Add any to <strong className={dark ? "text-white" : "text-slate-900"}>Activity</strong> — they'll sit in your shortlist and you can paper-trade or push live whenever you're ready.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          {strategies.map((s) => <WelcomeCard key={s.id} strategy={s} aime={aime} dark={dark}/>)}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div className={`text-[11px] ${dark ? 'text-white/40' : 'text-slate-400'}`}>You can find aime's picks anytime in the right panel.</div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className={`rounded-md border px-3 py-1.5 text-[12.5px] font-medium ${dark ? 'border-white/[0.06] bg-white/[0.04] text-white/85 hover:bg-white/[0.08]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
              Maybe later
            </button>
            <button
              onClick={remainingCount > 0 ? addAllAndClose : onClose}
              className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-4 py-1.5 text-[12.5px] font-semibold text-white hover:bg-sky-700"
            >
              {remainingCount > 0 ? (
                <>
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14"/></svg>
                  Add all {remainingCount} to Activity
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12l5 5 9-11"/></svg>
                  Done — let's go
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WelcomeCard({ strategy, aime, dark }) {
  const added = !!aime.state.addedToLive[strategy.id];
  return (
    <div className={`overflow-hidden rounded-xl elev-tile ${dark ? 'bg-white/[0.04]' : 'border border-slate-200/70 bg-white'}`}>
      <div className="flex items-center gap-1.5 px-3.5 pt-3">
        <window.SymbolPill symbol={strategy.symbol} dark={dark}/>
        <h3 className={`truncate text-[13.5px] font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{strategy.name}</h3>
      </div>
      <p className={`px-3.5 pt-1 text-[11.5px] leading-snug ${dark ? 'text-white/55' : 'text-slate-500'}`}>{strategy.oneLiner}</p>
      <div className="px-3.5 pt-2.5">
        <div className={`flex items-end justify-between gap-2 rounded-md p-2 ${dark ? 'bg-emerald-500/10' : 'bg-emerald-50/60'}`}>
          <div>
            <div className={`font-mono text-[14px] font-bold ${dark ? 'text-emerald-300' : 'text-emerald-700'}`}>{window.formatPct(strategy.metrics.totalPnLPct, { sign: true })}</div>
            <div className={`text-[9.5px] uppercase tracking-wide ${dark ? 'text-white/40' : 'text-slate-400'}`}>90-day</div>
          </div>
          <div className="h-10 w-20">
            <window.MiniEquityCurveA data={strategy.equityCurve} height={40}/>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5 px-3.5 py-2.5 text-center">
        <WMini label="Win" value={`${strategy.metrics.winRatePct}%`} dark={dark}/>
        <WMini label="DD" value={window.formatPct(strategy.metrics.maxDDPct)} tone="neg" dark={dark}/>
        <WMini label="PF" value={strategy.metrics.profitFactor.toFixed(2)} dark={dark}/>
      </div>
      <div className={`border-t px-3.5 py-2 ${dark ? 'border-white/[0.04]' : 'border-slate-100'}`}>
        {added ? (
          <div className={`inline-flex w-full items-center justify-center gap-1 rounded-md px-3 py-1.5 text-[12px] font-semibold ${dark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}>
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12l5 5 9-11"/></svg>
            Added to Activity
          </div>
        ) : (
          <button
            onClick={() => aime.addToLive(strategy.id)}
            className={`inline-flex w-full items-center justify-center gap-1 rounded-md px-3 py-1.5 text-[12px] font-semibold ${dark ? 'bg-sky-500/12 text-sky-200 hover:bg-sky-500/20' : 'border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100'}`}
          >
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14"/></svg>
            Add to Activity
          </button>
        )}
      </div>
    </div>
  );
}

function WMini({ label, value, tone, dark }) {
  const color = tone === 'neg'
    ? (dark ? 'text-rose-300' : 'text-rose-600')
    : tone === 'pos'
    ? (dark ? 'text-emerald-300' : 'text-emerald-600')
    : (dark ? 'text-white' : 'text-slate-900');
  return (
    <div>
      <div className={`text-[9.5px] uppercase tracking-wide ${dark ? 'text-white/40' : 'text-slate-400'}`}>{label}</div>
      <div className={`font-mono text-[12px] font-semibold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

Object.assign(window, { WelcomeModal });
