// AimeClaw copilot side panel.

const { useState: useStateC, useEffect: useEffectC, useRef: useRefC } = React;

function AimeClawPanel({ open, onClose, dark }) {
  const [messages, setMessages] = useStateC([
    { role: 'ai', body: "Heya. I've been watching BTC MACD all morning — it just closed +2.84%. Want me to summarize the day so far, or dig into anything specific?" },
    { role: 'user', body: "What's working in my basket this week?" },
    { role: 'ai', body: "Two of four watched strategies are net-positive. BTC MACD leads at +6.12% in 14 days, mostly from 3 confirmed crosses on May 6, 9, and 12. PCA Residual is up +0.92% — quiet but consistent.", chips: ['Show trades', 'Explain BTC MACD', 'Why is SOL paused?'] },
  ]);
  const [input, setInput] = useStateC('');
  const listRef = useRefC(null);

  useEffectC(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  function send() {
    if (!input.trim()) return;
    const userMsg = { role: 'user', body: input };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setTimeout(() => {
      setMessages(m => [...m, {
        role: 'ai',
        body: 'Looking at that now — pulling the trade log and the regime context. One moment.',
        thinking: true,
      }]);
    }, 320);
    setTimeout(() => {
      setMessages(m => {
        const copy = m.slice();
        copy[copy.length - 1] = {
          role: 'ai',
          body: "Here's what I found: the BTC MACD position is up +2.84% on the trade, +6.12% cumulative. The trade was confirmed by a volume spike (1.8× MA-20). I'd consider taking partial profit if MACD histogram contracts below 0.4.",
          chips: ['Take 30% profit', 'Hold and watch', 'Tighten stop'],
        };
        return copy;
      });
    }, 1400);
  }

  if (!open) {
    return (
      <button
        onClick={onClose}
        className="fixed bottom-6 right-6 z-30 grid h-12 w-12 place-items-center rounded-full text-xl shadow-lg"
        style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}
        title="Open AimeClaw"
      >
        <span>🤖</span>
      </button>
    );
  }

  return (
    <aside
      className={`relative flex h-full w-[400px] shrink-0 flex-col border-l ${dark ? 'border-white/8 bg-[#0d1014]' : 'border-slate-200 bg-white'}`}
    >
      {/* Header */}
      <header className={`flex h-14 items-center gap-2 border-b px-3 ${dark ? 'border-white/8' : 'border-slate-200'}`}>
        <div className="flex flex-1 items-center justify-center gap-1">
          <button className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium ${dark ? 'text-white/55' : 'text-slate-500'}`}>
            <span className="inline-block h-4 w-4 rounded-full" style={{ background: 'linear-gradient(135deg,#a78bfa,#7c3aed)' }} />
            Aime
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold"
            style={{ background: dark ? 'rgba(249,115,22,.15)' : '#fff1e6', color: '#ea580c' }}>
            <span>🤖</span>
            AimeClaw
          </button>
        </div>
        <button className={`grid h-7 w-7 place-items-center rounded text-[14px] ${dark ? 'text-white/40 hover:bg-white/8' : 'text-slate-400 hover:bg-slate-100'}`}>
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
        </button>
        <button onClick={onClose} className={`grid h-7 w-7 place-items-center rounded ${dark ? 'text-white/40 hover:bg-white/8' : 'text-slate-400 hover:bg-slate-100'}`}>
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </header>

      {/* Active context strip — what AimeClaw is "looking at" */}
      <div className={`border-b px-3 py-2.5 ${dark ? 'border-white/8' : 'border-slate-100'}`}>
        <div className={`mb-1.5 text-[10px] font-medium uppercase tracking-wider ${dark ? 'text-white/40' : 'text-slate-400'}`}>Watching now</div>
        <div className="flex gap-1.5 overflow-x-auto">
          {window.WATCHED_STRATEGIES.slice(0, 4).map(w => {
            const meta = window.MARKET_STRATEGIES.find(s => s.id === w.id);
            const pos = w.todayPnLPct >= 0;
            return (
              <div key={w.id} className={`flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 ${dark ? 'border-white/8 bg-white/[0.04]' : 'border-slate-200 bg-white'}`}>
                <span className="grid h-5 w-5 place-items-center rounded text-[9px] font-bold text-white" style={{ background: meta?.author.avatarColor || '#64748b' }}>
                  {meta?.symbol.slice(0, 1) || '·'}
                </span>
                <span className={`text-[11px] font-medium ${dark ? 'text-white/85' : 'text-slate-700'}`}>{meta?.symbol}</span>
                <span className={`text-[11px] font-semibold tabular-nums ${pos ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {pos ? '+' : ''}{w.todayPnLPct.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {messages.map((m, i) => <Message key={i} m={m} dark={dark} />)}
      </div>

      {/* Quick suggestions */}
      <div className={`flex flex-wrap gap-1.5 border-t px-3 py-2 ${dark ? 'border-white/8' : 'border-slate-100'}`}>
        {['Optimize SOL Breakout', 'Why is BTC up today?', 'Write a value-rotation strategy'].map(q => (
          <button key={q} onClick={() => setInput(q)} className={`rounded-full border px-2.5 py-1 text-[11px] ${dark ? 'border-white/12 text-white/70 hover:bg-white/8' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {q}
          </button>
        ))}
      </div>

      {/* Composer */}
      <div className={`border-t px-3 py-3 ${dark ? 'border-white/8' : 'border-slate-100'}`}>
        <div className={`flex items-end gap-2 rounded-xl border px-3 py-2 ${dark ? 'border-white/12 bg-white/[0.04]' : 'border-slate-200 bg-white'}`}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask, optimize, or write a strategy…"
            rows={1}
            className={`flex-1 resize-none bg-transparent text-[13px] outline-none placeholder:opacity-50 ${dark ? 'text-white' : 'text-slate-900'}`}
          />
          <button onClick={send} className="grid h-7 w-7 place-items-center rounded-md text-white" style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </div>
        <div className={`mt-1.5 flex items-center justify-between text-[10.5px] ${dark ? 'text-white/40' : 'text-slate-400'}`}>
          <span>AimeClaw watches your On Watch list and may push notifications.</span>
          <span>120 credits left</span>
        </div>
      </div>
    </aside>
  );
}

function Message({ m, dark }) {
  if (m.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className={`max-w-[85%] rounded-2xl rounded-br-md px-3 py-2 text-[13px] ${dark ? 'bg-white/12 text-white' : 'bg-slate-900 text-white'}`}>
          {m.body}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-2">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-base" style={{ background: 'linear-gradient(135deg,#f97316,#a855f7)' }}>
        <span>🤖</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className={`rounded-2xl rounded-tl-md px-3 py-2 text-[13px] leading-relaxed ${dark ? 'bg-white/[0.05] text-white/90' : 'bg-slate-50 text-slate-700'}`}>
          {m.thinking && <span className="mr-1.5 inline-flex gap-0.5 align-middle">
            <span className="h-1 w-1 animate-bounce rounded-full bg-current" style={{ animationDelay: '0ms' }} />
            <span className="h-1 w-1 animate-bounce rounded-full bg-current" style={{ animationDelay: '120ms' }} />
            <span className="h-1 w-1 animate-bounce rounded-full bg-current" style={{ animationDelay: '240ms' }} />
          </span>}
          {m.body}
        </div>
        {m.chips && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {m.chips.map((c, i) => (
              <button key={i} className={`rounded-full border px-2 py-0.5 text-[11px] ${dark ? 'border-white/12 text-white/65 hover:bg-white/8' : 'border-slate-200 text-slate-600 hover:bg-white'}`}>{c}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { AimeClawPanel });
