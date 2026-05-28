// Quant data layer — extends MARKET_STRATEGIES / WATCHED_STRATEGIES with engine
// metadata, adds STUDIO_DRAFTS (private user drafts), and ENGINE_INFO (UI
// labels / colors / dark tokens for the 4 engine types).
//
// Loads AFTER data.jsx so it can mutate MARKET_STRATEGIES in place.

(function () {
  // 1. Engine UI metadata (consumed by badges / picker / detail header / chat)
  const ENGINE_INFO = {
    screen: {
      key: 'screen',
      label: 'Screener',
      sub: 'Filter stocks by indicator conditions, rebalance on a schedule',
      shortSub: 'Indicator-driven stock selection',
      icon: '🔎',
      darkBadge: 'bg-sky-500/15 text-sky-200 border border-sky-400/20',
      lightBadge: 'bg-sky-50 text-sky-700 border border-sky-200',
      darkAccent: '#7dd3fc',
      resultType: 'portfolio',
      deployable: true,
    },
    pine: {
      key: 'pine',
      label: 'Pine',
      sub: 'TradingView-style strategy code on a single instrument',
      shortSub: 'Code-defined single-instrument strategy',
      icon: '📈',
      darkBadge: 'bg-violet-500/18 text-violet-200 border border-violet-400/22',
      lightBadge: 'bg-violet-50 text-violet-700 border border-violet-200',
      darkAccent: '#c4b5fd',
      resultType: 'trade',
      deployable: true,
    },
    event: {
      key: 'event',
      label: 'Event Lab',
      sub: 'Event-triggered strategy — enter on event, exit at window end',
      shortSub: 'Event-triggered entry / window exit',
      icon: '🔬',
      darkBadge: 'bg-cyan-500/15 text-cyan-200 border border-cyan-400/22',
      lightBadge: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
      darkAccent: '#67e8f9',
      resultType: 'study',
      deployable: true,
    },
    factor: {
      key: 'factor',
      label: 'Factor',
      sub: 'Cross-section factor model with G1–G10 long/short diagnostics',
      shortSub: 'Cross-section signal model',
      icon: '∑',
      darkBadge: 'bg-amber-500/18 text-amber-200 border border-amber-400/25',
      lightBadge: 'bg-amber-50 text-amber-700 border border-amber-200',
      darkAccent: '#fcd34d',
      resultType: 'portfolio',
      deployable: true,
    },
  };

  // 3. Map existing strategies → engine. Each entry is the meta we Object.assign
  // onto the matching MARKET_STRATEGIES/WATCHED_STRATEGIES row.
  const ENGINE_MAP = {
    'btc-macd-momentum': {
      engine: 'pine', resultType: 'trade',
      holdingPolicy: 'rule-exit', sizingMethod: 'fixed_percent',
      pineMeta: {
        codePreview:
          '//@version=5\nstrategy("BTC MACD Momentum", overlay=true)\n[macd, sig, _] = ta.macd(close, 12, 26, 9)\nvolOk = volume > ta.sma(volume, 20) * 1.5\nif ta.crossover(macd, sig) and volOk\n    strategy.entry("long", strategy.long, qty=2)\nif ta.crossunder(macd, sig)\n    strategy.close("long")',
        riskParams: { commission: 0.04, slippage: 0.02, stop_loss: -3, take_profit: null, max_position: 1 },
      },
    },
    'eth-mean-reversion': {
      engine: 'pine', resultType: 'trade',
      holdingPolicy: 'rule-exit', sizingMethod: 'fixed_percent',
      pineMeta: {
        codePreview:
          '//@version=5\nstrategy("ETH Mean Reversion", overlay=true)\nrsi = ta.rsi(close, 14)\nvwapDev = math.abs(close - ta.vwap(close)) / close\nif rsi < 30 and vwapDev < 0.02\n    strategy.entry("long", strategy.long)\nif rsi > 50\n    strategy.close("long")',
        riskParams: { commission: 0.04, slippage: 0.02, stop_loss: null, take_profit: null, max_position: 1 },
      },
    },
    'sol-breakout': {
      engine: 'pine', resultType: 'trade',
      holdingPolicy: 'rule-exit', sizingMethod: 'fixed_percent',
      pineMeta: {
        codePreview:
          '//@version=5\nstrategy("SOL Breakout Pro", overlay=true)\nhi3 = ta.highest(high, 3)\nvolZ = (volume - ta.sma(volume, 20)) / ta.stdev(volume, 20)\nif close > hi3[1] and volZ > 1.5\n    strategy.entry("long", strategy.long)',
        riskParams: { commission: 0.04, slippage: 0.05, stop_loss: -5, take_profit: null, max_position: 1.5 },
      },
    },
    'qqq-rotation': {
      engine: 'screen', resultType: 'portfolio',
      holdingPolicy: 'cross-rebalance', sizingMethod: 'equal',
      screenMeta: {
        conditions: [
          { indicator: '20-day momentum', op: '>', value: 0 },
          { indicator: 'Earnings surprise', op: '>', value: 0 },
        ],
        rankBy: 'momentum_score',
        topN: 5,
        rebalance: 'weekly',
        universeLabel: 'QQQ 100',
      },
    },
    'pca-residual': {
      engine: 'factor', resultType: 'portfolio',
      holdingPolicy: 'cross-rebalance', sizingMethod: 'inverse_vol',
      factorMeta: {
        dsl: 'multiply(zscore(pca_residual), -1)',
        ic: 0.072, icir: 1.85, lsSharpe: 2.18, monotonicity: 0.78,
        groupReturns: [12.4, 9.8, 7.2, 5.1, 3.6, 2.4, 1.2, -0.4, -2.1, -5.8],
        groupCount: 10,
        longGroup: 1, shortGroup: 10,
      },
    },
    'leveraged-etf': {
      engine: 'screen', resultType: 'portfolio',
      holdingPolicy: 'state-machine', sizingMethod: 'fixed_percent',
      screenMeta: {
        conditions: [
          { indicator: 'Market regime', op: '=', value: 'risk-on' },
          { indicator: '5-day relative strength', op: '>', value: 0 },
        ],
        rankBy: 'relative_strength',
        topN: 1,
        rebalance: 'daily',
        universeLabel: 'TQQQ / SOXL / SPXL',
      },
    },
    'omni-paradox': {
      engine: 'pine', resultType: 'trade',
      holdingPolicy: 'rule-exit', sizingMethod: 'fixed_percent',
      pineMeta: {
        codePreview:
          '//@version=5\nstrategy("Omniscient Paradox", overlay=true)\n// 7-signal voting ensemble — long when ≥4 vote bullish\nv1 = ta.crossover(close, ta.sma(close, 50))\nv2 = ta.rsi(close, 14) > 50\n// ... 5 more signals\nvotes = (v1?1:0)+(v2?1:0)+/* ... */0\nif votes >= 4\n    strategy.entry("long", strategy.long)',
        riskParams: { commission: 0.02, slippage: 0.01, stop_loss: -4, take_profit: null, max_position: 1 },
      },
    },
    'kinetic-titan': {
      engine: 'pine', resultType: 'trade',
      holdingPolicy: 'rule-exit', sizingMethod: 'unit_risk_atr',
      pineMeta: {
        codePreview:
          '//@version=5\nstrategy("Kinetic Titan NQ", overlay=true, default_qty_type=strategy.fixed)\natr = ta.atr(14)\nif ta.crossover(close, ta.ema(close, 21)) and close > ta.ema(close, 50)\n    strategy.entry("long", strategy.long)\nstrategy.exit("x", "long", stop=strategy.position_avg_price - 1.5*atr)',
        riskParams: { commission: 0.02, slippage: 0.05, stop_loss: null, take_profit: null, max_position: 1 },
      },
    },
  };

  // 4. New mock strategies to publish to Marketplace (cover Event + Factor + extra Screen).
  const NEW_MARKETPLACE = [
    {
      id: 'nasdaq-momentum-top10',
      name: 'Nasdaq 100 Monthly Momentum Top 10',
      symbol: 'NDX',
      market: 'US Equity',
      universe: { kind: 'index', label: 'Auto-picks from Nasdaq 100', detail: 'Holds top 10 by 1-month return, rebalanced monthly' },
      author: { name: 'Sara Ortega', org: 'Latitude Alpha', avatarColor: '#0ea5e9' },
      blurb: 'Classic momentum screen on Nasdaq 100. Holds top 10 by 1M return, rebalanced monthly.',
      tags: ['Momentum', 'Rotation', 'Equity', 'Monthly'],
      hot: false, top: true, new: true,
      metrics: { ret1Y: 36.4, sharpe1Y: 2.18, maxDD: -9.6, cagr5Y: 28.7, winRate: 64, trades: 120, followers: 482 },
      curve: window.seededWalk(91, 120, 0.31, 0.42, 0),
      published: '2026-03-22',
      aiMatch: 89,
      engine: 'screen', resultType: 'portfolio',
      holdingPolicy: 'cross-rebalance', sizingMethod: 'equal',
      screenMeta: {
        conditions: [
          { indicator: '1-month return', op: '>', value: 0 },
          { indicator: '3-month relative strength', op: 'top quartile', value: null },
        ],
        rankBy: 'momentum_score', topN: 10, rebalance: 'monthly',
        universeLabel: 'Nasdaq 100',
      },
    },
    {
      id: 'earnings-drift-study',
      name: 'Earnings Surprise Drift · T+20',
      symbol: 'S&P 500',
      market: 'US Equity',
      universe: { kind: 'cross-section', label: 'S&P 500', detail: 'All earnings events with surprise > 0' },
      author: { name: 'Dr. Hina Park', org: 'Stocknotes Research', avatarColor: '#06b6d4' },
      blurb: 'Buys S&P 500 names on positive earnings surprise, holds 20 days. Historical drift: +1.4% avg on T+20.',
      tags: ['Event', 'Earnings', 'Drift'],
      hot: false, top: false, new: true,
      metrics: { ret1Y: 11.2, sharpe1Y: 1.42, maxDD: -7.6, cagr5Y: 8.6, winRate: 64, trades: 48, followers: 218 },
      curve: window.seededWalk(101, 120, 0.04, 0.18, 0),
      published: '2026-05-04',
      aiMatch: 76,
      engine: 'event', resultType: 'study',
      eventMeta: {
        event: 'Earnings surprise > 0',
        windows: ['T+1', 'T+5', 'T+10', 'T+20'],
        credibility: 86,
        avgForwardReturn: { 'T+1': 0.4, 'T+5': 0.9, 'T+10': 1.2, 'T+20': 1.4 },
        probabilityPositive: { 'T+1': 0.58, 'T+5': 0.62, 'T+10': 0.61, 'T+20': 0.64 },
        sampleSize: 2840,
        adjustment: 'minus_benchmark',
      },
    },
    {
      id: 'cross-section-reversal',
      name: 'Cross-Section Reversal · G1-G10',
      symbol: 'R1000',
      market: 'US Equity',
      universe: { kind: 'cross-section', label: 'Russell 1000', detail: 'Cross-sectional, decile groups, monthly L/S' },
      author: { name: 'Daniel Chen', org: 'Daniel Chen', avatarColor: '#10b981' },
      blurb: '1-month reversal signal across Russell 1000. Long bottom decile, short top — beta-neutral.',
      tags: ['Factor', 'Mean reversion', 'L/S'],
      hot: false, top: false, new: true,
      metrics: { ret1Y: 14.8, sharpe1Y: 2.71, maxDD: -5.4, cagr5Y: 12.3, winRate: 0, trades: 0, followers: 96 },
      curve: window.seededWalk(113, 120, 0.13, 0.14, 0),
      published: '2026-04-30',
      aiMatch: 71,
      engine: 'factor', resultType: 'portfolio',
      holdingPolicy: 'cross-rebalance', sizingMethod: 'equal',
      factorMeta: {
        dsl: 'multiply(zscore(return_1m), -1)',
        ic: 0.083, icir: 1.25, lsSharpe: 1.84, monotonicity: 0.82,
        groupReturns: [8.4, 6.2, 4.8, 3.6, 2.4, 1.4, 0.6, -0.8, -2.4, -4.6],
        groupCount: 10,
        longGroup: 10, shortGroup: 1,  // reversal: long the bottom decile
      },
    },
  ];

  // 5. Apply engine meta to existing rows + push new rows.
  if (window.MARKET_STRATEGIES) {
    for (const s of window.MARKET_STRATEGIES) {
      const meta = ENGINE_MAP[s.id];
      if (meta) Object.assign(s, meta);
    }
    window.MARKET_STRATEGIES.push(...NEW_MARKETPLACE);
  }
  if (window.WATCHED_STRATEGIES) {
    for (const w of window.WATCHED_STRATEGIES) {
      const meta = ENGINE_MAP[w.id];
      if (meta) {
        w.engine = meta.engine;
        w.resultType = meta.resultType;
      }
    }
  }

  // 6. STUDIO_DRAFTS — 5 private user drafts the user has been working on.
  const STUDIO_DRAFTS = [
    {
      id: 'draft-sp500-quality',
      name: 'S&P 500 Quality Screen',
      symbol: 'SPX',
      market: 'US Equity',
      universe: { kind: 'index', label: 'S&P 500', detail: 'Top 15 by quality composite, monthly' },
      author: { name: 'You', org: 'Personal draft', avatarColor: '#0ea5e9' },
      blurb: 'ROE + low debt + earnings stability. Holds 15, rebalanced monthly.',
      tags: ['Quality', 'Equity', 'Draft'],
      metrics: { ret1Y: 18.4, sharpe1Y: 1.68, maxDD: -8.2, cagr5Y: 14.7, winRate: 0, trades: 0, followers: 0 },
      curve: window.seededWalk(201, 120, 0.16, 0.28, 0),
      published: null,
      aiMatch: 0,
      engine: 'screen', resultType: 'portfolio', draft: true, draftStatus: 'backtested',
      holdingPolicy: 'cross-rebalance', sizingMethod: 'equal',
      screenMeta: {
        conditions: [
          { indicator: 'ROE (TTM)', op: '>', value: 15 },
          { indicator: 'Debt / Equity', op: '<', value: 0.6 },
          { indicator: 'Earnings stability', op: 'top quartile', value: null },
        ],
        rankBy: 'quality_score', topN: 15, rebalance: 'monthly',
        universeLabel: 'S&P 500',
      },
    },
    {
      id: 'draft-btc-atr',
      name: 'BTC ATR Channel Breakout',
      symbol: 'BTC',
      market: 'Crypto',
      universe: { kind: 'single', label: 'BTC', detail: 'Bitcoin spot, 4h bars' },
      author: { name: 'You', org: 'Personal draft', avatarColor: '#7c3aed' },
      blurb: 'Long when close breaks above 20-day ATR channel; ATR-based trailing stop.',
      tags: ['Breakout', 'ATR', 'Crypto', 'Draft'],
      metrics: { ret1Y: 42.1, sharpe1Y: 1.94, maxDD: -12.4, cagr5Y: 0, winRate: 58, trades: 36, followers: 0 },
      curve: window.seededWalk(211, 120, 0.4, 0.96, 0),
      published: null,
      aiMatch: 0,
      engine: 'pine', resultType: 'trade', draft: true, draftStatus: 'backtested',
      holdingPolicy: 'rule-exit', sizingMethod: 'unit_risk_atr',
      pineMeta: {
        codePreview:
          '//@version=5\nstrategy("BTC ATR Channel", overlay=true)\natr = ta.atr(20)\nupper = ta.highest(high, 20) + atr*0.2\nif close > upper\n    strategy.entry("long", strategy.long)\nstrategy.exit("x", stop=strategy.position_avg_price - 2*atr)',
        riskParams: { commission: 0.04, slippage: 0.02, stop_loss: null, take_profit: null, max_position: 1 },
      },
    },
    {
      id: 'draft-split-drift',
      name: 'Stock Split Drift Study',
      symbol: 'S&P 500',
      market: 'US Equity',
      universe: { kind: 'cross-section', label: 'S&P 500', detail: 'All split events since 2018' },
      author: { name: 'You', org: 'Personal draft', avatarColor: '#06b6d4' },
      blurb: 'Buys S&P 500 names on stock split announcement, holds 60 days — testing if the post-2020 retail era still rewards splits.',
      tags: ['Event', 'Split', 'Drift', 'Draft'],
      metrics: { ret1Y: 4.8, sharpe1Y: 0.94, maxDD: -5.2, cagr5Y: 3.4, winRate: 56, trades: 12, followers: 0 },
      curve: window.seededWalk(221, 120, 0.06, 0.14, 0),
      published: null,
      aiMatch: 0,
      engine: 'event', resultType: 'study', draft: true, draftStatus: 'backtested',
      eventMeta: {
        event: 'Stock split announcement',
        windows: ['T+1', 'T+5', 'T+10', 'T+20', 'T+60'],
        credibility: 72,
        avgForwardReturn: { 'T+1': 0.3, 'T+5': 0.6, 'T+10': 0.9, 'T+20': 1.1, 'T+60': 1.6 },
        probabilityPositive: { 'T+1': 0.54, 'T+5': 0.56, 'T+10': 0.58, 'T+20': 0.59, 'T+60': 0.61 },
        sampleSize: 184,
        adjustment: 'minus_benchmark',
      },
    },
    {
      id: 'draft-momentum-quality',
      name: 'Momentum × Quality Composite',
      symbol: 'R1000',
      market: 'US Equity',
      universe: { kind: 'cross-section', label: 'Russell 1000', detail: 'Cross-section, deciles, monthly L/S' },
      author: { name: 'You', org: 'Personal draft', avatarColor: '#fbbf24' },
      blurb: 'Composite signal: 6-month momentum × quality (ROE & low debt). Long top decile, short bottom.',
      tags: ['Factor', 'Momentum', 'Quality', 'Draft'],
      metrics: { ret1Y: 16.2, sharpe1Y: 2.34, maxDD: -6.1, cagr5Y: 0, winRate: 0, trades: 0, followers: 0 },
      curve: window.seededWalk(231, 120, 0.16, 0.18, 0),
      published: null,
      aiMatch: 0,
      engine: 'factor', resultType: 'portfolio', draft: true, draftStatus: 'backtested',
      holdingPolicy: 'cross-rebalance', sizingMethod: 'equal',
      factorMeta: {
        dsl: 'multiply(\n  zscore(return_6m),\n  zscore(quality_composite)\n)',
        ic: 0.094, icir: 1.62, lsSharpe: 2.11, monotonicity: 0.88,
        groupReturns: [9.2, 6.8, 5.1, 3.8, 2.6, 1.8, 0.4, -0.8, -2.6, -5.1],
        groupCount: 10,
        longGroup: 1, shortGroup: 10,
      },
    },
    {
      id: 'draft-qqq-top5',
      name: 'QQQ Top 5 Weekly Momentum',
      symbol: 'QQQ',
      market: 'US Equity',
      universe: { kind: 'index', label: 'Auto-picks from QQQ 100', detail: 'Holds top 5 by 1-week return' },
      author: { name: 'You', org: 'Personal draft', avatarColor: '#10b981' },
      blurb: 'Higher-frequency cousin of the QQQ rotation. Weekly rebalance, 5 names.',
      tags: ['Rotation', 'Momentum', 'Weekly', 'Draft'],
      metrics: { ret1Y: 28.4, sharpe1Y: 1.84, maxDD: -11.2, cagr5Y: 0, winRate: 61, trades: 86, followers: 0 },
      curve: window.seededWalk(241, 120, 0.26, 0.46, 0),
      published: null,
      aiMatch: 0,
      engine: 'screen', resultType: 'portfolio', draft: true, draftStatus: 'configuring',
      holdingPolicy: 'cross-rebalance', sizingMethod: 'equal',
      screenMeta: {
        conditions: [{ indicator: '1-week return', op: '>', value: 0 }],
        rankBy: 'momentum_score', topN: 5, rebalance: 'weekly',
        universeLabel: 'QQQ 100',
      },
    },
  ];

  // 7. Condition library for ScreenerBuilder — grouped by category (technical /
  // fundamental / valuation). UI surfaces each group as a collapsible section so
  // users build conditions with a mental model that matches industry convention.
  const SCREENER_INDICATORS = [
    // Technical
    { id: 'mom_1m',   label: '1-month return',               unit: '%', category: 'technical' },
    { id: 'mom_3m',   label: '3-month return',               unit: '%', category: 'technical' },
    { id: 'mom_6m',   label: '6-month return',               unit: '%', category: 'technical' },
    { id: 'rsi_14',   label: 'RSI (14)',                     unit: '',  category: 'technical' },
    { id: 'vol_avg',  label: 'Avg volume (30-day)',          unit: '',  category: 'technical' },
    { id: 'atr_pct',  label: 'ATR % (14)',                   unit: '%', category: 'technical' },
    { id: 'beta',     label: 'Beta (1Y)',                    unit: '',  category: 'technical' },
    // Fundamental
    { id: 'roe',      label: 'ROE (TTM)',                    unit: '%', category: 'fundamental' },
    { id: 'roa',      label: 'ROA (TTM)',                    unit: '%', category: 'fundamental' },
    { id: 'rev_chg',  label: 'Revenue growth (YoY)',         unit: '%', category: 'fundamental' },
    { id: 'eps_chg',  label: 'EPS growth (YoY)',             unit: '%', category: 'fundamental' },
    { id: 'gross_m',  label: 'Gross margin',                 unit: '%', category: 'fundamental' },
    { id: 'de_ratio', label: 'Debt / Equity',                unit: 'x', category: 'fundamental' },
    // Valuation
    { id: 'pe',       label: 'P/E (TTM)',                    unit: 'x', category: 'valuation' },
    { id: 'pb',       label: 'Price / Book',                 unit: 'x', category: 'valuation' },
    { id: 'ps',       label: 'Price / Sales',                unit: 'x', category: 'valuation' },
    { id: 'peg',      label: 'PEG ratio',                    unit: 'x', category: 'valuation' },
    { id: 'div_yld',  label: 'Dividend yield',               unit: '%', category: 'valuation' },
    { id: 'mktcap',   label: 'Market cap',                   unit: 'B', category: 'valuation' },
  ];
  // Category metadata for the ScreenerBuilder UI.
  const SCREENER_CATEGORIES = [
    { id: 'technical',   label: '技术面', icon: '📈', sub: '动量 / 量价 / 波动' },
    { id: 'fundamental', label: '基本面', icon: '💼', sub: '盈利能力 / 增长 / 负债' },
    { id: 'valuation',   label: '估值',   icon: '📊', sub: 'PE / PB / 股息率' },
  ];

  // Strategy mode for Screen engine — cross-section (default) vs time-series.
  // Affects which fields show in ScreenerForm and which engine the summary maps to.
  const SCREENER_MODES = [
    { id: 'cross-section', label: '截面策略', sub: '同一时间点，应该买哪些标的（支持 Top N / 分组）' },
    { id: 'time-series',   label: '时序策略', sub: '同一标的，在什么时候买入或卖出（支持触发 / 退出规则）' },
  ];
  const SCREENER_UNIVERSES = ['S&P 500', 'Nasdaq 100', 'Russell 1000', 'QQQ 100', 'Crypto Top 50'];
  const EVENT_TYPES = [
    'Earnings surprise > 0',
    'Earnings surprise < 0',
    'Dividend announcement',
    'Stock split announcement',
    'Index inclusion (S&P 500)',
    'Index inclusion (Nasdaq 100)',
    '52-week breakout',
    'Custom event…',
  ];
  const FACTOR_UNIVERSES = ['Russell 1000', 'S&P 500', 'Nasdaq 100'];
  const REBALANCE_OPTIONS = [
    { id: 'daily',     label: 'Daily' },
    { id: 'weekly',    label: 'Weekly' },
    { id: 'monthly',   label: 'Monthly' },
    { id: 'quarterly', label: 'Quarterly' },
  ];
  const SIZING_OPTIONS = [
    { id: 'equal',          label: 'Equal weight',     pro: false },
    { id: 'fixed_percent',  label: 'Fixed percentage', pro: false },
    { id: 'score_weighted', label: 'Score-weighted',   pro: false },
    { id: 'inverse_vol',    label: 'Inverse volatility', pro: true },
    { id: 'unit_risk_atr',  label: 'ATR unit risk',    pro: true },
    { id: 'market_cap',     label: 'Market-cap weighted', pro: true },
  ];
  const HOLDING_POLICIES = [
    { id: 'cross-rebalance', label: '按周期调仓',  sub: 'Rebalance on schedule' },
    { id: 'time-exit',       label: '持有 N 日后退出', sub: 'Hold for fixed bars' },
    { id: 'rule-exit',       label: '规则触发退出', sub: 'Exit on signal/stop' },
    { id: 'state-machine',   label: '状态机', sub: 'Regime-gated' },
  ];

  // Factor DSL examples — one-click templates surfaced in FactorBuilder.
  const FACTOR_DSL_EXAMPLES = [
    {
      id: 'mom-quality',
      label: '动量 × 质量',
      tag: 'Composite',
      desc: '6 个月动量乘以质量得分，强者恒强 + 财务稳健',
      dsl: 'multiply(\n  zscore(return_6m),\n  zscore(quality_composite)\n)',
    },
    {
      id: 'short-term-reversal',
      label: '短期反转',
      tag: 'Mean reversion',
      desc: '过去一个月跌得多的，下个月反弹',
      dsl: 'multiply(zscore(return_1m), -1)',
    },
    {
      id: 'low-vol',
      label: '低波动',
      tag: 'Defensive',
      desc: '过去 60 日波动率倒数 — 选稳的',
      dsl: 'multiply(zscore(vol_60d), -1)',
    },
  ];

  // 8. Helper — find a strategy or draft by id across both pools.
  // Use window.STUDIO_DRAFTS (not the local const) so newly-added drafts via
  // window.STUDIO_DRAFTS = [...] reassignments are picked up.
  function findStrategyById(id) {
    if (window.MARKET_STRATEGIES) {
      const m = window.MARKET_STRATEGIES.find((s) => s.id === id);
      if (m) return m;
    }
    const drafts = window.STUDIO_DRAFTS || STUDIO_DRAFTS;
    return drafts.find((d) => d.id === id) || null;
  }

  Object.assign(window, {
    ENGINE_INFO,
    STUDIO_DRAFTS,
    SCREENER_INDICATORS,
    SCREENER_CATEGORIES,
    SCREENER_MODES,
    SCREENER_UNIVERSES,
    EVENT_TYPES,
    FACTOR_UNIVERSES,
    FACTOR_DSL_EXAMPLES,
    REBALANCE_OPTIONS,
    SIZING_OPTIONS,
    HOLDING_POLICIES,
    findStrategyById,
  });
})();
