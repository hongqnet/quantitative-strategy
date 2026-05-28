// AimeClaw store — React Context + useReducer, ports zustand demoStore.
// Provider takes optional cross-panel callbacks: onNavigate('aicharts'|'studio:watch'|'studio:activity'),
// onAddStrategyToWatch(seed), onRemoveDeployment(deployId).

const {
  useReducer: useReducerS,
  useContext: useContextS,
  useEffect: useEffectS,
  useMemo: useMemoS,
  useCallback: useCallbackS,
  useRef: useRefS,
  createContext: createContextS,
} = React;

const AimeClawContext = createContextS(null);

const INITIAL_STATE = {
  stage: 0,
  credits: 50,
  paperCapital: 10000,
  paperLeverage: 2,
  deployments: [],         // [{id, strategyId, kind:'paper'|'live', tier:'base'|'refined', capital, leverage, startedAt, watchedRowId}]
  refined: false,
  packUnlocked: false,
  activeStrategyId: null,
  addedToLive: {},         // strategyId -> watchedRowId (so Add-to-Live button shows Added ✓ persistently)
  toasts: [],
  // Tracks per-card local state that should persist across timeline re-renders:
  cardState: {},           // key (e.g., `paper:${strategyId}`) -> { status:'ready'|'running'|'stopped', ... }
  // Quant build flow (triggered from Studio "让 aime 帮我建"):
  flowName: 'discover',    // 'discover' | 'quant'
  quantIntent: null,       // { id, label, engine, detail } chosen at stage 0
  quantSavedDraftId: null, // set after stage 4 if user saved
};

function deployId() {
  return 'd-' + Math.random().toString(36).slice(2, 9);
}

function reducer(state, action) {
  const flowTotal = (window.getActiveFlowTotal ? window.getActiveFlowTotal(state) : (window.TOTAL_STAGES || 6));
  switch (action.type) {
    case 'ADVANCE': {
      const next = Math.min(state.stage + 1, flowTotal - 1);
      const activeStrategyId = (state.flowName === 'discover' && next >= 1 && !state.activeStrategyId) ? 'btc-macd-momentum' : state.activeStrategyId;
      return { ...state, stage: next, activeStrategyId };
    }
    case 'RETREAT':
      return { ...state, stage: Math.max(state.stage - 1, 0) };
    case 'RESTART':
      return { ...INITIAL_STATE };
    case 'JUMP_TO_STAGE':
      return { ...state, stage: Math.max(0, Math.min(action.stage, flowTotal - 1)) };
    case 'START_QUANT_BUILD':
      return { ...INITIAL_STATE, flowName: 'quant', credits: state.credits };
    case 'SET_QUANT_INTENT':
      return { ...state, quantIntent: action.intent };
    case 'SET_QUANT_SAVED_DRAFT':
      return { ...state, quantSavedDraftId: action.id };
    case 'SET_ACTIVE_STRATEGY':
      return { ...state, activeStrategyId: action.id };
    case 'SET_PAPER_CONFIG':
      return { ...state, paperCapital: action.capital, paperLeverage: action.leverage };
    case 'ADD_DEPLOYMENT': {
      const dep = { ...action.deployment, id: action.deployment.id || deployId() };
      return { ...state, deployments: [...state.deployments, dep] };
    }
    case 'REMOVE_DEPLOYMENT':
      return { ...state, deployments: state.deployments.filter((d) => d.id !== action.id) };
    case 'UPDATE_DEPLOYMENT_TIER': {
      return {
        ...state,
        deployments: state.deployments.map((d) =>
          d.id === action.id ? { ...d, tier: action.tier } : d,
        ),
      };
    }
    case 'REFINE':
      if (state.credits < action.cost || state.refined) return state;
      return { ...state, credits: state.credits - action.cost, refined: true };
    case 'UNLOCK_PACK':
      if (state.credits < action.cost || state.packUnlocked) return state;
      return { ...state, credits: state.credits - action.cost, packUnlocked: true };
    case 'MARK_ADDED_TO_LIVE':
      return { ...state, addedToLive: { ...state.addedToLive, [action.strategyId]: action.watchedRowId } };
    case 'SET_CARD_STATE':
      return { ...state, cardState: { ...state.cardState, [action.key]: { ...(state.cardState[action.key] || {}), ...action.patch } } };
    case 'PUSH_TOAST':
      return { ...state, toasts: [...state.toasts, { id: action.id, tone: action.tone, body: action.body, action: action.action || null }] };
    case 'DISMISS_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
    default:
      return state;
  }
}

function AimeClawProvider({ children, onNavigate, onAddStrategyToWatch, onAddDraftFromAime }) {
  const [state, dispatch] = useReducerS(reducer, INITIAL_STATE);

  // Stable refs for the latest callbacks so action creators stay referentially stable.
  const navRef = useRefS(onNavigate);
  const addToWatchRef = useRefS(onAddStrategyToWatch);
  const addDraftRef = useRefS(onAddDraftFromAime);
  useEffectS(() => { navRef.current = onNavigate; }, [onNavigate]);
  useEffectS(() => { addToWatchRef.current = onAddStrategyToWatch; }, [onAddStrategyToWatch]);
  useEffectS(() => { addDraftRef.current = onAddDraftFromAime; }, [onAddDraftFromAime]);

  const pushToast = useCallbackS((tone, body, action) => {
    const id = Math.random().toString(36).slice(2);
    dispatch({ type: 'PUSH_TOAST', id, tone, body, action });
    setTimeout(() => dispatch({ type: 'DISMISS_TOAST', id }), action ? 6000 : 3500);
  }, []);

  const advance   = useCallbackS(() => dispatch({ type: 'ADVANCE' }), []);
  const retreat   = useCallbackS(() => dispatch({ type: 'RETREAT' }), []);
  const restart   = useCallbackS(() => dispatch({ type: 'RESTART' }), []);
  const jumpToStage = useCallbackS((stage) => dispatch({ type: 'JUMP_TO_STAGE', stage }), []);

  const runOnChart = useCallbackS((id) => {
    dispatch({ type: 'SET_ACTIVE_STRATEGY', id });
    if (navRef.current) navRef.current('aicharts');
  }, []);

  const setActiveStrategy = useCallbackS((id) => {
    dispatch({ type: 'SET_ACTIVE_STRATEGY', id });
  }, []);

  const setPaperConfig = useCallbackS((capital, leverage) => {
    dispatch({ type: 'SET_PAPER_CONFIG', capital, leverage });
  }, []);

  // addToLive: AimeClaw strategy card → push to vibetrading WATCHED_STRATEGIES.
  const addToLive = useCallbackS((strategyId, opts) => {
    if (!addToWatchRef.current) return null;
    const strategy = window.getAimeStrategy(strategyId);
    if (!strategy) return null;
    const watchedRowId = addToWatchRef.current({
      sourceId: strategyId,
      name: (opts && opts.namePrefix ? opts.namePrefix : '') + strategy.name + (opts && opts.tier === 'refined' ? ' · Refined' : ''),
      symbol: strategy.symbol,
      blurb: strategy.oneLiner,
      curve: opts && opts.tier === 'refined' && strategy.refinedEquityCurve ? strategy.refinedEquityCurve : strategy.equityCurve,
      tier: opts && opts.tier ? opts.tier : 'base',
    });
    if (watchedRowId) {
      dispatch({ type: 'MARK_ADDED_TO_LIVE', strategyId, watchedRowId });
      pushToast('success', strategy.name + ' added to Deployed ✓');
    }
    return watchedRowId;
  }, [pushToast]);

  const startPaper = useCallbackS((strategyId, cfg) => {
    const strategy = window.getAimeStrategy(strategyId);
    if (!strategy) return;
    const tier = state.refined && strategyId === 'btc-macd-momentum' ? 'refined' : 'base';
    const watchedRowId = state.addedToLive[strategyId] || (addToWatchRef.current ? addToWatchRef.current({
      sourceId: strategyId,
      name: strategy.name,
      symbol: strategy.symbol,
      blurb: strategy.oneLiner,
      curve: strategy.equityCurve,
      tier: 'base',
    }) : null);
    if (watchedRowId && !state.addedToLive[strategyId]) {
      dispatch({ type: 'MARK_ADDED_TO_LIVE', strategyId, watchedRowId });
    }
    dispatch({
      type: 'ADD_DEPLOYMENT',
      deployment: {
        strategyId,
        kind: 'paper',
        tier,
        capital: cfg.capital,
        leverage: cfg.leverage,
        startedAt: Date.now(),
        watchedRowId,
      },
    });
    dispatch({ type: 'SET_CARD_STATE', key: 'paper:' + strategyId, patch: { status: 'running' } });
    pushToast('success', 'Paper trade started 🟢 — I’ll ping you on closes.');
  }, [state.refined, state.addedToLive, pushToast]);

  const stopPaper = useCallbackS((strategyId) => {
    const dep = state.deployments.find((d) => d.kind === 'paper' && d.strategyId === strategyId);
    if (!dep) return;
    dispatch({ type: 'REMOVE_DEPLOYMENT', id: dep.id });
    dispatch({ type: 'SET_CARD_STATE', key: 'paper:' + strategyId, patch: { status: 'stopped' } });
    pushToast('info', 'Paper trade stopped. Position flattened.');
  }, [state.deployments, pushToast]);

  const startLive = useCallbackS((strategyId, cfg) => {
    const strategy = window.getAimeStrategy(strategyId);
    if (!strategy) return;
    const tier = state.refined && strategyId === 'btc-macd-momentum' ? 'refined' : 'base';
    const watchedRowId = state.addedToLive[strategyId] || (addToWatchRef.current ? addToWatchRef.current({
      sourceId: strategyId,
      name: strategy.name,
      symbol: strategy.symbol,
      blurb: strategy.oneLiner,
      curve: strategy.equityCurve,
      tier: 'base',
    }) : null);
    if (watchedRowId && !state.addedToLive[strategyId]) {
      dispatch({ type: 'MARK_ADDED_TO_LIVE', strategyId, watchedRowId });
    }
    dispatch({
      type: 'ADD_DEPLOYMENT',
      deployment: {
        strategyId,
        kind: 'live',
        tier,
        capital: (cfg && cfg.capital) || 1000,
        leverage: (cfg && cfg.leverage) || 2,
        startedAt: Date.now(),
        watchedRowId,
      },
    });
    dispatch({ type: 'SET_CARD_STATE', key: 'live:' + strategyId, patch: { status: 'running' } });
    pushToast('success', 'Hyperliquid connected ⚡ Strategy is live.');
  }, [state.refined, state.addedToLive, pushToast]);

  const stopLive = useCallbackS((strategyId) => {
    const dep = state.deployments.find((d) => d.kind === 'live' && d.strategyId === strategyId);
    if (!dep) return;
    dispatch({ type: 'REMOVE_DEPLOYMENT', id: dep.id });
    dispatch({ type: 'SET_CARD_STATE', key: 'live:' + strategyId, patch: { status: 'stopped' } });
    pushToast('info', 'Hyperliquid disconnected. Open positions left untouched.');
  }, [state.deployments, pushToast]);

  const stopDeployment = useCallbackS((depId) => {
    const dep = state.deployments.find((d) => d.id === depId);
    if (!dep) return;
    dispatch({ type: 'REMOVE_DEPLOYMENT', id: depId });
    dispatch({ type: 'SET_CARD_STATE', key: dep.kind + ':' + dep.strategyId, patch: { status: 'stopped' } });
    pushToast('info', (dep.kind === 'paper' ? 'Paper' : 'Deployed') + ' deployment stopped.');
  }, [state.deployments, pushToast]);

  const refineStrategy = useCallbackS((strategyId, cost) => {
    if (state.refined || state.credits < cost) return;
    dispatch({ type: 'REFINE', cost });
    // Auto-add a Refined variant to Live (per user req 6).
    if (addToWatchRef.current) {
      const strategy = window.getAimeStrategy(strategyId);
      if (strategy) {
        const watchedRowId = addToWatchRef.current({
          sourceId: strategyId + '-refined',
          name: strategy.name + ' · Refined',
          symbol: strategy.symbol,
          blurb: strategy.oneLiner,
          curve: strategy.refinedEquityCurve || strategy.equityCurve,
          tier: 'refined',
        });
        if (watchedRowId) {
          dispatch({ type: 'MARK_ADDED_TO_LIVE', strategyId: strategyId + '-refined', watchedRowId });
        }
      }
    }
    pushToast('success', 'Refined ✨ — added to Deployed as a new variant. Drawdown trimmed by ~32%.');
  }, [state.refined, state.credits, pushToast]);

  const redeployPaperRefined = useCallbackS((strategyId) => {
    // If a paper deployment exists for this strategy, swap its tier; else open paper config (will be handled by UI).
    const dep = state.deployments.find((d) => d.kind === 'paper' && d.strategyId === strategyId);
    if (dep) {
      dispatch({ type: 'UPDATE_DEPLOYMENT_TIER', id: dep.id, tier: 'refined' });
      pushToast('success', 'Paper trade rolled onto Refined 🟢');
    } else {
      // Trigger paper config flow by jumping to Stage 2.
      jumpToStage(2);
    }
  }, [state.deployments, pushToast, jumpToStage]);

  const pushLiveRefined = useCallbackS((strategyId) => {
    // If a live deployment exists, swap its tier; else open live config.
    const dep = state.deployments.find((d) => d.kind === 'live' && d.strategyId === strategyId);
    if (dep) {
      dispatch({ type: 'UPDATE_DEPLOYMENT_TIER', id: dep.id, tier: 'refined' });
      pushToast('success', 'Refined strategy pushed to live ⚡');
    } else {
      jumpToStage(3);
    }
  }, [state.deployments, pushToast, jumpToStage]);

  // Optimize from Studio: caller invokes this when user clicks Optimize button on a Live card.
  const optimizeFromStudio = useCallbackS((strategyId) => {
    // Jump chat to Refine stage and (if needed) prime the active strategy.
    dispatch({ type: 'SET_ACTIVE_STRATEGY', id: strategyId || state.activeStrategyId || 'btc-macd-momentum' });
    if (state.stage < 4) dispatch({ type: 'JUMP_TO_STAGE', stage: 4 });
  }, [state.stage, state.activeStrategyId]);

  // Convenience navigators for blocks.
  const navigateToWatch = useCallbackS(() => { if (navRef.current) navRef.current('studio:watch'); }, []);
  const navigateToActivity = useCallbackS(() => { if (navRef.current) navRef.current('studio:activity'); }, []);
  const navigateToCharts = useCallbackS(() => { if (navRef.current) navRef.current('aicharts'); }, []);
  const navigateToStudio = useCallbackS(() => { if (navRef.current) navRef.current('studio:studio'); }, []);

  // Quant build flow:
  const startQuantBuild = useCallbackS(() => {
    dispatch({ type: 'START_QUANT_BUILD' });
  }, []);
  const setQuantIntent = useCallbackS((intent) => {
    dispatch({ type: 'SET_QUANT_INTENT', intent });
  }, []);
  const saveQuantDraft = useCallbackS((draftSeed) => {
    if (addDraftRef.current) {
      const id = addDraftRef.current(draftSeed);
      if (id) {
        dispatch({ type: 'SET_QUANT_SAVED_DRAFT', id });
        pushToast('success', '已保存为草稿 ✓', {
          label: '查看草稿',
          run: () => { if (navRef.current) navRef.current('studio:studio:detail:' + id); },
        });
        return id;
      }
    }
    return null;
  }, [pushToast]);

  const ctx = useMemoS(() => ({
    state, dispatch,
    advance, retreat, restart, jumpToStage,
    runOnChart, setActiveStrategy, setPaperConfig,
    addToLive, startPaper, stopPaper, startLive, stopLive, stopDeployment,
    refineStrategy, redeployPaperRefined, pushLiveRefined,
    optimizeFromStudio,
    startQuantBuild, setQuantIntent, saveQuantDraft,
    pushToast,
    navigateToWatch, navigateToActivity, navigateToCharts, navigateToStudio,
  }), [
    state, advance, retreat, restart, jumpToStage,
    runOnChart, setActiveStrategy, setPaperConfig,
    addToLive, startPaper, stopPaper, startLive, stopLive, stopDeployment,
    refineStrategy, redeployPaperRefined, pushLiveRefined,
    optimizeFromStudio,
    startQuantBuild, setQuantIntent, saveQuantDraft,
    pushToast,
    navigateToWatch, navigateToActivity, navigateToCharts, navigateToStudio,
  ]);

  return <AimeClawContext.Provider value={ctx}>{children}</AimeClawContext.Provider>;
}

function useAimeClaw() {
  const ctx = useContextS(AimeClawContext);
  if (!ctx) throw new Error('useAimeClaw must be used inside <AimeClawProvider>');
  return ctx;
}

Object.assign(window, { AimeClawProvider, useAimeClaw, AimeClawContext });
