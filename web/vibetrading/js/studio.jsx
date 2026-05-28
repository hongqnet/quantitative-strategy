// Studio sub-tab — main entry for quant research workflow.
// Hero (build new + Pro toggle + Ask aime entry) + Drafts masonry.

const { useState: useStateS2, useEffect: useEffectS2, useMemo: useMemoS2 } = React;

// ─────────────────────────────────────────────────────────────────────────────
// EngineBadge — reusable engine indicator (Screen/Pine/Event/Factor).
//   size: 'xs' (12px text) | 'sm' (default) | 'md' (large hero)
//   variant: 'pill' (default, label) | 'icon' (just emoji + tooltip) | 'full' (icon + label + sub)
// ─────────────────────────────────────────────────────────────────────────────
function EngineBadge({ engine, dark, size, variant }) {
  const info = window.ENGINE_INFO[engine];
  if (!info) return null;
  const cls = dark ? info.darkBadge : info.lightBadge;
  const sz = size || 'sm';
  const padding = sz === 'xs' ? 'px-1.5 py-px text-[9.5px]' : sz === 'md' ? 'px-2.5 py-1 text-[12px]' : 'px-2 py-0.5 text-[10.5px]';
  const iconSz = sz === 'xs' ? 'text-[10px]' : sz === 'md' ? 'text-[13px]' : 'text-[11px]';
  if (variant === 'icon') {
    return (
      <span title={info.label + ' · ' + info.sub} className={`inline-flex items-center justify-center rounded-md ${padding} ${cls} font-semibold`}>
        <span className={iconSz}>{info.icon}</span>
      </span>
    );
  }
  if (variant === 'full') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full ${padding} ${cls} font-semibold uppercase tracking-wide`}>
        <span className={iconSz}>{info.icon}</span>
        <span>{info.label}</span>
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${padding} ${cls} font-bold uppercase tracking-wider`}>
      <span className={iconSz}>{info.icon}</span>
      <span>{info.label}</span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StudioHero — top of Studio tab. Build button + Ask aime.
// ─────────────────────────────────────────────────────────────────────────────
function StudioHero({ onBuild, onAskAime, dark, draftCount }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl px-6 py-6 ${dark ? 'border border-white/[0.06]' : 'border border-slate-200/70'}`}
      style={{
        background: dark
          ? 'radial-gradient(800px 220px at 0% 0%, rgba(14,165,233,0.13), transparent 55%), radial-gradient(700px 200px at 100% 0%, rgba(124,58,237,0.10), transparent 55%), #0d1014'
          : 'radial-gradient(800px 220px at 0% 0%, rgba(14,165,233,0.08), transparent 55%), radial-gradient(700px 200px at 100% 0%, rgba(124,58,237,0.05), transparent 55%), #ffffff',
      }}
    >
      <div className="min-w-0">
        <div className={`mb-1.5 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] ${dark ? 'text-white/55' : 'text-slate-500'}`}>
          <span>Studio</span>
          <span className={dark ? 'text-white/25' : 'text-slate-300'}>·</span>
          <span>{draftCount} drafts</span>
        </div>
        <h2 className={`text-[24px] font-semibold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`} style={{ letterSpacing: '-0.015em' }}>
          新建策略、跑回测，找到真正能赚钱的逻辑
        </h2>
        <p className={`mt-1 max-w-xl text-[13px] leading-relaxed ${dark ? 'text-white/65' : 'text-slate-600'}`}>
          选一种引擎、写下你的想法、跑完回测看真实表现。验证过的策略，可以发布到 Marketplace 或一键部署到 Live。
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <button
          onClick={onBuild}
          className="inline-flex items-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>
          新建策略
        </button>
        <button
          onClick={onAskAime}
          className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-[12.5px] font-medium transition-colors ${dark ? 'border-white/[0.10] bg-white/[0.03] text-white/85 hover:bg-white/[0.06]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
        >
          <span className="text-base leading-none">💬</span>
          让 aime 帮我建
        </button>
        <div className={`ml-auto flex items-center gap-2 text-[11px] ${dark ? 'text-white/50' : 'text-slate-500'}`}>
          <span>支持的引擎：</span>
          <EngineBadge engine="screen" dark={dark} size="xs" />
          <EngineBadge engine="pine"   dark={dark} size="xs" />
          <EngineBadge engine="event"  dark={dark} size="xs" />
          <EngineBadge engine="factor" dark={dark} size="xs" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DraftCard — one card in the drafts masonry.
// ─────────────────────────────────────────────────────────────────────────────
function DraftCard({ draft, onOpen, onDeploy, dark }) {
  const info = window.ENGINE_INFO[draft.engine];
  if (!info) return null;
  const m = draft.metrics || {};
  const statusBadge = draft.draftStatus === 'backtested'
    ? { label: '已回测', cls: dark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-700' }
    : draft.draftStatus === 'configuring'
    ? { label: '配置中', cls: dark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-50 text-amber-700' }
    : { label: '草稿', cls: dark ? 'bg-white/10 text-white/70' : 'bg-slate-100 text-slate-600' };
  const canDeploy = info.deployable && draft.draftStatus === 'backtested';

  return (
    <div
      onClick={() => onOpen(draft)}
      className={`group cursor-pointer overflow-hidden rounded-xl transition-all elev-tile ${
        dark ? 'bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.16]' : 'border border-slate-200/70 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-start gap-2 px-3.5 pt-3 pb-2">
        <EngineBadge engine={draft.engine} dark={dark} size="xs" />
        <span className={`ml-auto rounded-full px-1.5 py-px text-[9.5px] font-bold uppercase tracking-wider ${statusBadge.cls}`}>{statusBadge.label}</span>
      </div>

      <div className="px-3.5">
        <h3 className={`text-[14px] font-semibold leading-snug ${dark ? 'text-white' : 'text-slate-900'}`}>{draft.name}</h3>
        <p className={`mt-1 line-clamp-2 text-[11.5px] leading-snug ${dark ? 'text-white/55' : 'text-slate-500'}`}>{draft.blurb}</p>
      </div>

      <div className="px-3.5 mt-2.5">
        <div className={`flex items-end justify-between gap-2 rounded-md p-2 ${dark ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
          <div>
            {draft.engine === 'event' ? (
              <>
                <div className={`font-mono text-[14px] font-bold ${dark ? 'text-cyan-300' : 'text-cyan-700'}`}>{(draft.eventMeta?.credibility || 0)}</div>
                <div className={`text-[9.5px] uppercase tracking-wide ${dark ? 'text-white/40' : 'text-slate-400'}`}>样本可信度</div>
              </>
            ) : (
              <>
                <div className={`font-mono text-[14px] font-bold ${m.ret1Y >= 0 ? (dark ? 'text-emerald-300' : 'text-emerald-700') : (dark ? 'text-rose-300' : 'text-rose-700')}`}>
                  {window.formatPct(m.ret1Y || 0, { sign: true })}
                </div>
                <div className={`text-[9.5px] uppercase tracking-wide ${dark ? 'text-white/40' : 'text-slate-400'}`}>backtest 1Y</div>
              </>
            )}
          </div>
          <div className="h-9 w-24">
            <window.MiniEquityCurveA data={draft.curve.slice(0, 60)} height={36} color={info.darkAccent} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 px-3.5 py-2.5 text-center">
        {draft.engine === 'event' ? (
          <>
            <DraftStat label="窗口" value={(draft.eventMeta?.windows || []).length + '个'} dark={dark} />
            <DraftStat label="样本" value={String(draft.eventMeta?.sampleSize || '—')} dark={dark} />
            <DraftStat label="正样本概率" value={draft.eventMeta ? Math.round((draft.eventMeta.probabilityPositive?.['T+20'] || 0) * 100) + '%' : '—'} dark={dark} />
          </>
        ) : draft.engine === 'factor' ? (
          <>
            <DraftStat label="IC" value={(draft.factorMeta?.ic || 0).toFixed(3)} dark={dark} />
            <DraftStat label="ICIR" value={(draft.factorMeta?.icir || 0).toFixed(2)} dark={dark} />
            <DraftStat label="L-S Sharpe" value={(draft.factorMeta?.lsSharpe || 0).toFixed(2)} dark={dark} />
          </>
        ) : (
          <>
            <DraftStat label="Sharpe" value={(m.sharpe1Y || 0).toFixed(2)} dark={dark} />
            <DraftStat label="Max DD" value={window.formatPct(m.maxDD || 0)} tone="neg" dark={dark} />
            <DraftStat label="胜率" value={(m.winRate || 0) + '%'} dark={dark} />
          </>
        )}
      </div>

      <div className={`flex items-center justify-between gap-2 border-t px-3.5 py-2 text-[11px] ${dark ? 'border-white/[0.05]' : 'border-slate-100'}`}>
        <span className={dark ? 'text-white/45' : 'text-slate-400'}>{draft.universe?.label || '—'}</span>
        <div className="flex items-center gap-1.5">
          {canDeploy && (
            <button
              onClick={(e) => { e.stopPropagation(); onDeploy && onDeploy(draft); }}
              title="部署到 Deployed"
              className="inline-flex items-center gap-1 rounded-md bg-sky-600 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-white opacity-0 transition-opacity hover:bg-sky-700 group-hover:opacity-100"
            >
              <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="currentColor"><path d="M13 2L3 14h7l-1 8 10-12h-7z" /></svg>
              Deploy
            </button>
          )}
          <span className={`inline-flex items-center gap-1 font-semibold opacity-0 transition-opacity group-hover:opacity-100 ${dark ? 'text-sky-300' : 'text-sky-700'}`}>
            打开详情
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </span>
        </div>
      </div>
    </div>
  );
}

function DraftStat({ label, value, tone, dark }) {
  const color = tone === 'neg'
    ? (dark ? 'text-rose-300' : 'text-rose-600')
    : (dark ? 'text-white' : 'text-slate-900');
  return (
    <div>
      <div className={`text-[9.5px] uppercase tracking-wide ${dark ? 'text-white/40' : 'text-slate-400'}`}>{label}</div>
      <div className={`font-mono text-[12px] font-semibold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StudioTab — main render. Wraps Hero + Drafts.
// ─────────────────────────────────────────────────────────────────────────────
function StudioTab({ dark, drafts, onBuild, onOpenDraft, onDeployDraft, onAskAime }) {
  return (
    <div className="space-y-5 px-7 pt-5">
      <StudioHero
        onBuild={onBuild}
        onAskAime={onAskAime}
        dark={dark}
        draftCount={drafts.length}
      />

      <div>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className={`text-[15px] font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>我的草稿</h2>
            <p className={`text-[12px] ${dark ? 'text-white/50' : 'text-slate-500'}`}>共 {drafts.length} 个未发布的策略 — 点击进入详情查看回测结果、继续编辑或发布到 Marketplace。</p>
          </div>
          <div className={`text-[11px] ${dark ? 'text-white/40' : 'text-slate-400'}`}>按修改时间倒序</div>
        </div>

        {drafts.length === 0 ? (
          <div className={`flex flex-col items-center rounded-xl border border-dashed px-6 py-12 text-center ${dark ? 'border-white/[0.08] bg-white/[0.02]' : 'border-slate-200 bg-slate-50/50'}`}>
            <div className="grid h-12 w-12 place-items-center rounded-full text-2xl" style={{ background: 'linear-gradient(135deg,#0ea5e9,#7c3aed)' }}>🔬</div>
            <div className={`mt-3 text-[14px] font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>还没有草稿</div>
            <p className={`mt-1 max-w-md text-[12.5px] ${dark ? 'text-white/55' : 'text-slate-500'}`}>点击上方"新建策略"或让 aime 帮你出第一个策略。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {drafts.map((d) => (
              <DraftCard key={d.id} draft={d} onOpen={onOpenDraft} onDeploy={onDeployDraft} dark={dark} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { StudioTab, EngineBadge });
