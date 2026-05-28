// EnginePickerModal — shown when user clicks "Build a backtest" from Studio.
// 4 cards (Screen/Pine/Event/Factor). All engines are available to every user.

function EnginePickerModal({ open, onClose, onPick, dark }) {
  if (!open) return null;

  const engines = ['screen', 'pine', 'event', 'factor'].map((k) => window.ENGINE_INFO[k]);

  function handlePick(engine) {
    onClose();
    onPick(engine.key);
  }

  const overlayBg = dark ? 'bg-black/55' : 'bg-slate-900/45';
  const shellCls = dark ? 'bg-[#0d1014] border border-white/[0.06]' : 'bg-white';

  return (
    <div className={`fixed inset-0 z-[70] flex items-center justify-center p-6 backdrop-blur-sm ${overlayBg}`} onClick={onClose}>
      <div className={`relative w-full max-w-3xl overflow-hidden rounded-2xl elev-pop ${shellCls}`} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={`flex items-center justify-between border-b px-6 py-4 ${dark ? 'border-white/[0.05]' : 'border-slate-200'}`}>
          <div>
            <div className={`mb-1 text-[10.5px] font-bold uppercase tracking-[0.16em] ${dark ? 'text-white/45' : 'text-slate-400'}`}>新建策略</div>
            <h2 className={`text-[19px] font-semibold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>选择一个引擎来开始构建</h2>
          </div>
          <button onClick={onClose} className={`grid h-8 w-8 place-items-center rounded-md ${dark ? 'text-white/40 hover:bg-white/8' : 'text-slate-400 hover:bg-slate-100'}`}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        {/* 4 cards in 2x2 grid */}
        <div className="grid grid-cols-2 gap-3 px-6 py-5">
          {engines.map((info) => (
            <EngineCard key={info.key} info={info} dark={dark} onClick={() => handlePick(info)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function EngineCard({ info, dark, onClick }) {
  const accent = info.darkAccent;
  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col gap-2 overflow-hidden rounded-xl border p-4 text-left transition-all ${
        dark
          ? 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.18] hover:bg-white/[0.06]'
          : 'border-slate-200/70 bg-white hover:border-slate-300 hover:bg-slate-50/50'
      }`}
    >
      {/* Top: icon + label */}
      <div className="flex items-center gap-2">
        <span className={`grid h-9 w-9 place-items-center rounded-lg text-[18px] ${dark ? info.darkBadge : info.lightBadge}`}>
          {info.icon}
        </span>
        <div className="flex-1">
          <div className={`flex items-center gap-1.5 text-[14.5px] font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>
            {info.label}
          </div>
          <div className={`mt-0.5 text-[11.5px] ${dark ? 'text-white/55' : 'text-slate-500'}`}>{info.sub}</div>
        </div>
      </div>

      {/* Feature chips */}
      <div className="flex flex-wrap gap-1">
        {(info.key === 'screen' ? ['Universe', 'Conditions', 'Top N', 'Rebalance']
          : info.key === 'pine' ? ['Code', 'Single instrument', 'Risk params']
          : info.key === 'event' ? ['Event type', 'Windows (T+N)', 'Statistical adj.']
          : ['Factor DSL', 'Cross-section', 'IC / ICIR', 'G1–G10']).map((c) => (
          <span key={c} className={`rounded px-1.5 py-0.5 text-[10px] ${dark ? 'bg-white/[0.05] text-white/60' : 'bg-slate-100 text-slate-600'}`}>{c}</span>
        ))}
      </div>

      {/* CTA underline */}
      <div className={`mt-auto flex items-center justify-between text-[11.5px] font-semibold ${dark ? 'text-sky-300' : 'text-sky-700'}`}>
        <span>用这个引擎构建 →</span>
        <span className="text-[10px] uppercase tracking-wider opacity-70">
          输出 {info.resultType === 'study' ? '研究报告' : info.resultType === 'trade' ? '交易记录' : '组合回测'}
        </span>
      </div>

      {/* Accent corner */}
      <span className="pointer-events-none absolute right-3 top-3 h-12 w-12 rounded-full opacity-0 transition-opacity group-hover:opacity-30" style={{ background: 'radial-gradient(circle, ' + accent + '40, transparent 70%)' }} />
    </button>
  );
}

Object.assign(window, { EnginePickerModal });
