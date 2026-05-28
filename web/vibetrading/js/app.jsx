// Vibe Trading — main app shell. Hosts top-level page tabs (Aime / Strategy Studio /
// AI Charts / …) and the AimeClaw chat panel on the right. Strategy Studio
// contains the existing Marketplace / Live / Activity sub-tabs.

const { useState: useStateA, useEffect: useEffectA, useCallback: useCallbackA, useRef: useRefA } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "direction": "balanced",
  "pageTab": "studio",
  "tab": "marketplace",
  "darkMode": true,
  "copilotOpen": true
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const [watchedIds, setWatchedIds] = useStateA(() => window.WATCHED_STRATEGIES.map((w) => w.id));
  const [watchedVersion, setWatchedVersion] = useStateA(0);

  // Modal state
  const [deployTarget, setDeployTarget] = useStateA(null);
  const [writeOpen, setWriteOpen] = useStateA(false);
  const [previewTarget, setPreviewTarget] = useStateA(null);
  const [previewWatched, setPreviewWatched] = useStateA(null);
  const [manageTarget, setManageTarget] = useStateA(null);
  const [pauseTarget, setPauseTarget] = useStateA(null);

  // Welcome modal: shown once per session when user first lands on Strategy Studio.
  const [welcomeOpen, setWelcomeOpen] = useStateA(() => {
    try { return window.sessionStorage.getItem('vibetrading.welcomeSeen') !== 'true'; }
    catch (e) { return true; }
  });

  // Studio internal route: 'list' (default) | {kind:'picker'} | {kind:'builder', engine, draft?} | {kind:'detail', strategyId}
  const [studioRoute, setStudioRoute] = useStateA({ kind: 'list' });

  // Bump on draft mutations (when aime saves a draft, when builder runs a backtest).
  const [draftsVersion, setDraftsVersion] = useStateA(0);

  function toggleWatch(id) {
    setWatchedIds((ids) => ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  }

  const direction = t.direction;
  const darkMode = t.darkMode || direction === 'bold';
  const copilotOpen = t.copilotOpen;
  const tab = t.tab;
  const pageTab = t.pageTab || 'studio';

  // Cross-panel navigation — chat → page tab + sub-tab.
  const handleNavigate = useCallbackA((target) => {
    if (!target) return;
    if (target === 'aicharts') { setTweak('pageTab', 'aicharts'); return; }
    if (target.indexOf('studio:') === 0) {
      const parts = target.split(':');
      const sub = parts[1];
      setTweak('pageTab', 'studio');
      if (sub) setTweak('tab', sub);
      if (sub === 'studio') {
        // 'studio:studio'           → list
        // 'studio:studio:detail:ID' → open that draft's detail page
        if (parts[2] === 'detail' && parts[3]) {
          setStudioRoute({ kind: 'detail', strategyId: parts[3] });
        } else {
          setStudioRoute({ kind: 'list' });
        }
      }
      return;
    }
    setTweak('pageTab', target);
  }, [setTweak]);

  // Studio: handler when aime chat saves a draft after building.
  const handleAddDraftFromAime = useCallbackA((draftSeed) => {
    if (!window.STUDIO_DRAFTS) return null;
    const id = draftSeed.id || ('draft-aime-' + Math.random().toString(36).slice(2, 7));
    const draft = { ...draftSeed, id, draft: true };
    window.STUDIO_DRAFTS = [draft, ...window.STUDIO_DRAFTS];
    setDraftsVersion((v) => v + 1);
    return id;
  }, []);

  // DeployModal confirm: actually push the strategy into Live (WATCHED_STRATEGIES)
  // so the deploy is visible. Returns the watched row id.
  const handleDeployConfirm = useCallbackA((strategy, cfg) => {
    if (!strategy) return null;
    const kind = (cfg && cfg.target && cfg.target.kind) || 'paper';
    const account = cfg && cfg.target
      ? { kind, label: cfg.target.label, tail: cfg.target.tail }
      : { kind, label: 'AInvest Paper', tail: '****0272' };

    // Seed MARKET_STRATEGIES stub if absent (drafts aren't there).
    if (!window.MARKET_STRATEGIES.some((s) => s.id === strategy.id)) {
      window.MARKET_STRATEGIES.push({
        ...strategy,
        draft: false,
        published: strategy.published || new Date().toISOString().slice(0, 10),
        aiMatch: strategy.aiMatch || 0,
      });
    }

    const existing = window.WATCHED_STRATEGIES.findIndex((w) => w.id === strategy.id);
    const m = strategy.metrics || {};
    if (existing >= 0) {
      // Re-deploy: flip status + account + capital.
      window.WATCHED_STRATEGIES[existing] = {
        ...window.WATCHED_STRATEGIES[existing],
        deployStatus: kind,
        deployAccount: account,
        capital: (cfg && cfg.capital) || window.WATCHED_STRATEGIES[existing].capital,
        lastSignal: { kind: 'deployed', text: '已部署 — 等待首个交易信号', at: 'just now' },
        health: 'fresh',
      };
    } else {
      window.WATCHED_STRATEGIES = [{
        id: strategy.id,
        addedOn: new Date().toISOString().slice(0, 10),
        runDays: 0,
        deployStatus: kind,
        deployAccount: account,
        capital: (cfg && cfg.capital) || 10000,
        todayPnLPct: 0, todayPnL: 0,
        cumPnLPct: 0, cumPnL: 0,
        sharpe: m.sharpe1Y || 1.6,
        maxDD: m.maxDD || -5,
        winRate: m.winRate || 0,
        trades: 0,
        lastSignal: { kind: 'deployed', text: '已部署 — 等待首个交易信号', at: 'just now' },
        nextRun: '—',
        health: 'fresh',
        curve: strategy.curve || [],
        positions: [],
      }, ...window.WATCHED_STRATEGIES];
      setWatchedIds((ids) => ids.includes(strategy.id) ? ids : [strategy.id, ...ids]);
    }
    setWatchedVersion((v) => v + 1);
    return strategy.id;
  }, []);

  // Chat → Live: append a new row into window.WATCHED_STRATEGIES.
  const handleAddStrategyToWatch = useCallbackA((seed) => {
    // De-dup: don't add the same id twice.
    if (window.WATCHED_STRATEGIES.some((w) => w.id === seed.sourceId)) {
      return seed.sourceId;
    }
    // Seed MARKET_STRATEGIES stub if the meta isn't there (e.g., refined variant).
    if (!window.MARKET_STRATEGIES.some((s) => s.id === seed.sourceId)) {
      window.MARKET_STRATEGIES.push({
        id: seed.sourceId,
        name: seed.name,
        symbol: seed.symbol,
        market: 'Crypto',
        universe: { kind: 'single', label: seed.symbol, detail: seed.symbol + ' spot' },
        author: { name: 'aime', org: 'aime picks', avatarColor: '#7c3aed' },
        blurb: seed.blurb,
        tags: ['aime pick'],
        metrics: { ret1Y: 18.4, sharpe1Y: 1.7, maxDD: -7.2, cagr5Y: 12.5, winRate: 62, trades: 14, followers: 0 },
        curve: seed.curve,
        published: new Date().toISOString().slice(0, 10),
        aiMatch: 95,
        tier: seed.tier,
      });
    }
    const newRow = {
      id: seed.sourceId,
      addedOn: new Date().toISOString(),
      runDays: 0,
      deployStatus: 'watching',
      deployAccount: null,
      capital: 0,
      todayPnLPct: 0,
      cumPnLPct: 0,
      sharpe: 1.6,
      maxDD: -5,
      trades: 0,
      lastSignal: 'Just added',
      health: 'fresh',
      curve: seed.curve,
      positions: [],
      tier: seed.tier,
    };
    window.WATCHED_STRATEGIES = [newRow, ...window.WATCHED_STRATEGIES];
    setWatchedIds((ids) => ids.includes(seed.sourceId) ? ids : [seed.sourceId, ...ids]);
    setWatchedVersion((v) => v + 1);
    return seed.sourceId;
  }, []);

  // Stop deployment from the chat-summary footer → also flatten the matching
  // watched row's deployment status, so Strategy Studio reflects the change.
  // Hooked from AimeClawProvider via stopDeployment side-effects in store, but
  // since we don't have a hook into the store here, we just leave row state
  // alone (chat tracks deployments separately). User-visible change is the chip
  // disappearing from the chat summary and toast.

  // Dismiss welcome — also persist the flag.
  const closeWelcome = useCallbackA(() => {
    setWelcomeOpen(false);
    try { window.sessionStorage.setItem('vibetrading.welcomeSeen', 'true'); } catch (e) {}
  }, []);

  return (
    <window.AimeClawProvider onNavigate={handleNavigate} onAddStrategyToWatch={handleAddStrategyToWatch} onAddDraftFromAime={handleAddDraftFromAime}>
      <AppShell
        t={t} setTweak={setTweak}
        direction={direction} darkMode={darkMode} copilotOpen={copilotOpen}
        tab={tab} pageTab={pageTab}
        watchedIds={watchedIds} toggleWatch={toggleWatch}
        watchedVersion={watchedVersion}
        deployTarget={deployTarget} setDeployTarget={setDeployTarget}
        writeOpen={writeOpen} setWriteOpen={setWriteOpen}
        previewTarget={previewTarget} setPreviewTarget={setPreviewTarget}
        previewWatched={previewWatched} setPreviewWatched={setPreviewWatched}
        manageTarget={manageTarget} setManageTarget={setManageTarget}
        pauseTarget={pauseTarget} setPauseTarget={setPauseTarget}
        welcomeOpen={welcomeOpen} closeWelcome={closeWelcome}
        studioRoute={studioRoute} setStudioRoute={setStudioRoute}
        draftsVersion={draftsVersion}
        handleDeployConfirm={handleDeployConfirm}
        bumpDraftsVersion={() => setDraftsVersion((v) => v + 1)}
      />
    </window.AimeClawProvider>
  );
}

function AppShell(props) {
  const { t, setTweak, direction, darkMode, copilotOpen, tab, pageTab,
    watchedIds, toggleWatch, watchedVersion,
    deployTarget, setDeployTarget,
    writeOpen, setWriteOpen,
    previewTarget, setPreviewTarget,
    previewWatched, setPreviewWatched,
    manageTarget, setManageTarget,
    pauseTarget, setPauseTarget,
    welcomeOpen, closeWelcome,
    studioRoute, setStudioRoute,
    draftsVersion, bumpDraftsVersion,
    handleDeployConfirm } = props;

  // Studio is in "full-bleed" mode when builder or detail is open (picker just overlays).
  const studioFull = pageTab === 'studio' && tab === 'studio' && (studioRoute.kind === 'builder' || studioRoute.kind === 'detail');
  const showPreviewPage = !!previewTarget;
  const drafts = (window.STUDIO_DRAFTS || []).slice();

  const aime = window.useAimeClaw();

  // Optimize button anywhere in Studio → push refine into chat.
  const handleOptimize = useCallbackA((strategyId) => {
    if (!t.copilotOpen) setTweak('copilotOpen', true);
    aime.optimizeFromStudio(strategyId);
  }, [t.copilotOpen, aime, setTweak]);

  // Show welcome only once we're on Studio.
  const showWelcome = welcomeOpen && pageTab === 'studio';

  return (
    <div className={`flex h-screen w-screen flex-col overflow-hidden ${darkMode ? 'theme-dark bg-[#0b0d12] text-white' : 'app-canvas text-slate-900'}`}
      style={direction === 'bold' ? { background: 'radial-gradient(1400px 600px at 20% -10%, rgba(168,85,247,.16), transparent 60%), radial-gradient(1400px 600px at 80% -10%, rgba(249,115,22,.14), transparent 60%), #0b0d12' } : undefined}
    >
      <AInvestTopbar darkMode={darkMode} pageTab={pageTab} setPageTab={(v) => setTweak('pageTab', v)} />

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {pageTab === 'studio' && (
            <>
              {!studioFull && !showPreviewPage && (
                <QuantLabHeader
                  tab={tab}
                  setTab={(v) => { setTweak('tab', v); setPreviewTarget(null); if (v === 'studio') setStudioRoute({ kind: 'list' }); }}
                  direction={direction}
                  darkMode={darkMode}
                  copilotOpen={copilotOpen}
                  setCopilotOpen={(v) => setTweak('copilotOpen', v)}
                  watchCount={watchedIds.length}
                  onWriteNew={() => {
                    setTweak('tab', 'studio');
                    setStudioRoute({ kind: 'picker' });
                  }}
                />
              )}
              {showPreviewPage && (
                <window.DetailPage
                  strategy={previewTarget}
                  strategyId={previewTarget?.id}
                  source={previewWatched ? 'deployed' : 'marketplace'}
                  watchedData={previewWatched}
                  dark={darkMode}
                  watched={previewTarget ? watchedIds.includes(previewTarget.id) : false}
                  onToggleWatch={() => previewTarget && toggleWatch(previewTarget.id)}
                  onBack={() => { setPreviewTarget(null); setPreviewWatched(null); }}
                  onDeploy={(s) => { setDeployTarget(s); }}
                />
              )}
              {!showPreviewPage && tab === 'marketplace' && (
                <MarketplaceTab
                  key={'mkt-' + watchedVersion}
                  direction={direction} darkMode={darkMode}
                  watchedIds={watchedIds} onToggleWatch={toggleWatch}
                  onOptimize={handleOptimize}
                  onWriteNew={() => setWriteOpen(true)}
                  onPreview={(s) => setPreviewTarget(s)}
                />
              )}
              {!showPreviewPage && tab === 'watch' && (
                <OnWatchTab
                  key={'watch-' + watchedVersion}
                  direction={direction} darkMode={darkMode}
                  watchedIds={watchedIds} onToggleWatch={toggleWatch}
                  onDeploy={(s) => setDeployTarget(s)}
                  onOptimize={handleOptimize}
                  onWriteNew={() => setWriteOpen(true)}
                  onManage={(w) => setManageTarget(w)}
                  onPause={(w) => setPauseTarget(w)}
                  onPreview={(s) => setPreviewTarget(s)}
                  onGoToDeployed={() => { setTweak('tab', 'activity'); }}
                />
              )}
              {!showPreviewPage && tab === 'activity' && (
                <ActivityTab
                  key={'act-' + watchedVersion}
                  dark={darkMode}
                  onManage={(w) => setManageTarget(w)}
                  onPause={(w) => setPauseTarget(w)}
                  onPreview={(s, watchedRow) => { setPreviewTarget(s); setPreviewWatched(watchedRow || null); }}
                  onDeploy={(s) => setDeployTarget(s)}
                />
              )}
              {!showPreviewPage && tab === 'studio' && (
                <window.ComingSoonPage label="Studio" dark={darkMode} />
              )}
              <div className="h-8" />
            </>
          )}

          {pageTab === 'aicharts' && <window.AIChartsPage dark={darkMode} />}

          {pageTab !== 'studio' && pageTab !== 'aicharts' && (
            <window.ComingSoonPage label={pageTab} dark={darkMode} />
          )}
        </div>

        {/* Aime sidebar removed for v1 release */}
      </div>

      <DeployModal
        open={!!deployTarget}
        onClose={() => setDeployTarget(null)}
        strategy={deployTarget}
        dark={darkMode}
        onConfirm={(cfg) => {
          handleDeployConfirm(deployTarget, cfg);
          setDeployTarget(null);
          setTweak('pageTab', 'studio');
          setTweak('tab', 'activity');  // jump to Live tab so user sees the new row
        }}
      />
      <WriteStrategyModal open={writeOpen} onClose={() => setWriteOpen(false)} dark={darkMode} />
      <ManageLiveModal
        open={!!manageTarget}
        onClose={() => setManageTarget(null)}
        watched={manageTarget}
        dark={darkMode}
        onJumpToActivity={() => { setTweak('pageTab', 'studio'); setTweak('tab', 'activity'); setManageTarget(null); }}
      />
      <PauseConfirmModal open={!!pauseTarget} onClose={() => setPauseTarget(null)} watched={pauseTarget} dark={darkMode} onConfirm={() => {}} />

      <window.WelcomeModal open={showWelcome} onClose={closeWelcome} dark={darkMode} />

      <TweaksPanel>
        <TweakSection label="Page" />
        <TweakRadio
          value={pageTab}
          options={[
            { value: 'studio',   label: 'Strategy' },
            { value: 'aicharts', label: 'AI Charts' },
            { value: 'markets',  label: 'Markets (stub)' },
          ]}
          onChange={(v) => setTweak('pageTab', v)}
        />

        <TweakSection label="Direction" />
        <TweakRadio
          value={direction}
          options={[
            { value: 'conservative', label: 'Conservative' },
            { value: 'balanced', label: 'Balanced' },
            { value: 'bold', label: 'Bold' },
          ]}
          onChange={(v) => setTweak('direction', v)}
        />

        <TweakSection label="Strategy sub-tab" />
        <TweakRadio
          value={tab}
          options={[
            { value: 'marketplace', label: 'Marketplace' },
            { value: 'studio', label: 'Studio' },
            { value: 'watch', label: 'Activity' },
            { value: 'activity', label: 'Deployed' },
          ]}
          onChange={(v) => { setTweak('tab', v); if (v === 'studio') setStudioRoute({ kind: 'list' }); }}
        />

        <TweakSection label="Surface" />
        <TweakToggle label="Dark mode" value={t.darkMode} onChange={(v) => setTweak('darkMode', v)} />
        <TweakToggle label="aime panel" value={copilotOpen} onChange={(v) => setTweak('copilotOpen', v)} />

        <TweakSection label="Demo modals" />
        <TweakButton label="Replay Welcome" onClick={() => { try { window.sessionStorage.removeItem('vibetrading.welcomeSeen'); } catch (e) {} location.reload(); }} />
        <TweakButton label="Open Write strategy" onClick={() => setWriteOpen(true)} />
        <TweakButton label="Open Deploy" onClick={() => setDeployTarget(window.MARKET_STRATEGIES[0])} />
        <TweakButton label="Trigger Optimize → chat" onClick={() => handleOptimize('btc-macd-momentum')} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
