// AimeClaw demo data — strategies + scripted flow stages.
// Ported (lossy) from src/data/strategies.ts and src/features/aimeclaw/flow.ts.

(function () {
  function seededWalk(seed, n, drift, vol, start = 0) {
    let s = seed;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    const out = [];
    let v = start;
    for (let i = 0; i < n; i++) {
      v += drift + (rand() - 0.5) * vol;
      out.push(Number(v.toFixed(3)));
    }
    return out;
  }

  const AIMECLAW_STRATEGIES = [
    {
      id: 'btc-macd-momentum',
      name: 'BTC MACD Momentum',
      symbol: 'BTC',
      oneLiner: 'Ride confirmed momentum bursts. 14 trades over 90 days, low effort, high signal.',
      tags: ['Trend', 'MACD', 'Beginner-friendly'],
      metrics: { totalPnLPct: 18.4, winRatePct: 62, maxDDPct: -7.2, profitFactor: 1.74, totalTrades: 14 },
      equityCurve: seededWalk(11, 90, 0.18, 0.55, 0),
      refinedMetrics: { totalPnLPct: 24.1, winRatePct: 71, maxDDPct: -4.9, profitFactor: 2.31, totalTrades: 16 },
      refinedEquityCurve: seededWalk(11, 90, 0.27, 0.42, 0),
      signals: [
        { x: 0.18, y: 0.74, type: 'buy' },
        { x: 0.27, y: 0.46, type: 'sell' },
        { x: 0.39, y: 0.7,  type: 'buy' },
        { x: 0.5,  y: 0.34, type: 'sell' },
        { x: 0.6,  y: 0.42, type: 'buy' },
        { x: 0.72, y: 0.22, type: 'sell' },
        { x: 0.81, y: 0.32, type: 'buy' },
        { x: 0.93, y: 0.18, type: 'sell' },
      ],
      algorithm: {
        steps: [
          { id: 'a1', kind: 'trigger', label: 'MACD line crosses above signal', detail: '12/26 EMA, signal = 9-period EMA of MACD' },
          { id: 'a2', kind: 'filter',  label: 'Volume > 1.5× MA(20)',           detail: 'Filters out low-conviction crosses in chop' },
          { id: 'a3', kind: 'action',  label: 'Long with 2× leverage',           detail: 'Risk-per-trade kept ≤ 1.5% of equity' },
          { id: 'a4', kind: 'exit',    label: 'Exit on opposite cross OR -3% trailing stop', detail: 'Whichever fires first' },
        ],
        notes: 'Refined version adapts MACD periods to current 30-day realized vol and tightens stop in low-vol regimes.',
      },
    },
    {
      id: 'eth-mean-reversion',
      name: 'ETH Mean Reversion',
      symbol: 'ETH',
      oneLiner: 'Buy oversold dips, fade exhaustion rallies. High win-rate, modest size per trade.',
      tags: ['Mean reversion', 'RSI', 'Steady'],
      metrics: { totalPnLPct: 12.1, winRatePct: 71, maxDDPct: -5.4, profitFactor: 1.92, totalTrades: 21 },
      equityCurve: seededWalk(7, 90, 0.13, 0.32, 0),
      signals: [
        { x: 0.12, y: 0.6,  type: 'buy' },
        { x: 0.21, y: 0.45, type: 'sell' },
        { x: 0.33, y: 0.66, type: 'buy' },
        { x: 0.42, y: 0.5,  type: 'sell' },
        { x: 0.55, y: 0.6,  type: 'buy' },
        { x: 0.66, y: 0.42, type: 'sell' },
        { x: 0.78, y: 0.55, type: 'buy' },
        { x: 0.88, y: 0.4,  type: 'sell' },
      ],
      algorithm: {
        steps: [
          { id: 'b1', kind: 'trigger', label: 'RSI(14) < 30 OR > 70' },
          { id: 'b2', kind: 'filter',  label: 'Price within 2% of 20-day VWAP', detail: 'No regime breaks' },
          { id: 'b3', kind: 'action',  label: 'Enter against the move, 1× notional' },
          { id: 'b4', kind: 'exit',    label: 'Exit on RSI mean-revert to 50 OR 1.2× ATR stop' },
        ],
      },
    },
    {
      id: 'sol-breakout',
      name: 'SOL Breakout Pro',
      symbol: 'SOL',
      oneLiner: 'Catch 3-day range breaks with volume confirmation. Few trades, big winners.',
      tags: ['Breakout', 'Volume', 'High variance'],
      metrics: { totalPnLPct: 27.6, winRatePct: 55, maxDDPct: -11.8, profitFactor: 1.61, totalTrades: 9 },
      equityCurve: seededWalk(23, 90, 0.28, 1.05, 0),
      signals: [
        { x: 0.16, y: 0.56, type: 'buy' },
        { x: 0.32, y: 0.3,  type: 'sell' },
        { x: 0.48, y: 0.62, type: 'buy' },
        { x: 0.62, y: 0.4,  type: 'sell' },
        { x: 0.76, y: 0.55, type: 'buy' },
        { x: 0.9,  y: 0.22, type: 'sell' },
      ],
      algorithm: {
        steps: [
          { id: 'c1', kind: 'trigger', label: 'Close > 3-day high' },
          { id: 'c2', kind: 'filter',  label: 'Volume z-score > 1.5', detail: '20-day rolling baseline' },
          { id: 'c3', kind: 'action',  label: 'Long with 1.5× leverage' },
          { id: 'c4', kind: 'exit',    label: 'Exit on close < 2-day low OR -5% stop' },
        ],
      },
    },
  ];

  function getAimeStrategy(id) {
    return AIMECLAW_STRATEGIES.find((s) => s.id === id) || null;
  }

  // Sales-style scripted flow. Stage 0 is auto on mount; each Next ▸ appends the next stage's blocks.
  const AIMECLAW_FLOW = [
    {
      index: 0,
      label: 'Greeting',
      hint: 'Auto on load',
      blocks: [
        { id: 's0-text', type: 'text', payload: {
          tone: 'greeting',
          body: "Hey 👋 I'm aime, your trading copilot. I scanned the crypto market this morning — here are three setups that stood out. Each card shows a 90-day backtest. Tap **Run on chart** to see how it traded, or **Add to Deployed** to drop it into your Strategy list.",
        }},
        { id: 's0-cards', type: 'strategyCards', payload: {
          ids: ['btc-macd-momentum', 'eth-mean-reversion', 'sol-breakout'],
        }},
      ],
    },
    {
      index: 1,
      label: 'Strategy on chart',
      hint: 'Signals overlaid',
      blocks: [
        { id: 's1-text', type: 'text', payload: {
          body: "Let's run **BTC MACD Momentum** on the chart. Every entry and exit is marked — green is buy, red is sell. Look how cleanly it caught the late-summer leg up.",
        }},
        { id: 's1-commentary', type: 'chartCommentary', payload: { strategyId: 'btc-macd-momentum' }},
        { id: 's1-cta', type: 'text', payload: {
          body: 'Now the question — do you want to **trade this live on Hyperliquid**, or **paper-trade it first** with no risk?',
        }},
        { id: 's1-quick', type: 'quickReplies', payload: {
          replies: [
            { label: '🟢 Paper trade first', action: 'advance' },
            { label: '⚡ Trade live on Hyperliquid', action: 'note' },
          ],
        }},
      ],
    },
    {
      index: 2,
      label: 'Paper trading setup',
      hint: 'Configure & start',
      blocks: [
        { id: 's2-text', type: 'text', payload: {
          body: 'Smart move. Let me spin up a paper account so we can watch this strategy actually trade. Pick your starting capital and leverage.',
        }},
        { id: 's2-config', type: 'paperConfig', payload: { strategyId: 'btc-macd-momentum' }},
      ],
    },
    {
      index: 3,
      label: 'PnL push',
      hint: '14 days later',
      blocks: [
        { id: 's3-pnl', type: 'pnlPush', payload: {
          strategyId: 'btc-macd-momentum', tradePnL: 284.5, tradePct: 2.84,
          cumulativePnL: 612, cumulativePct: 6.12, daysElapsed: 14,
        }},
        { id: 's3-text', type: 'text', payload: {
          body: "Up **6.12% in 2 weeks** paper-side — tracking the backtest closely. Want me to push it to live trading on Hyperliquid?",
        }},
        { id: 's3-prompt', type: 'switchToLivePrompt', payload: { strategyId: 'btc-macd-momentum' }},
      ],
    },
    {
      index: 4,
      label: 'Refine',
      hint: 'Spend credits',
      blocks: [
        { id: 's4-text', type: 'text', payload: {
          body: "Before you scale this, one more idea — I can fine-tune the strategy for the **current vol regime**. Usually trims drawdown ~30% and lifts win-rate. Costs 8 credits.",
        }},
        { id: 's4-refine', type: 'refine', payload: { strategyId: 'btc-macd-momentum', costCredits: 8 }},
      ],
    },
    {
      index: 5,
      label: 'Final',
      hint: 'Recap & go live',
      blocks: [
        { id: 's5-text', type: 'text', payload: {
          body: "OK — refined strategy is dialed in, paper P&L is tracking the backtest. Let me pull it all together so you can decide the last move.",
        }},
        { id: 's5-finale', type: 'finale', payload: {}},
      ],
    },
  ];

  const TOTAL_STAGES = AIMECLAW_FLOW.length;

  // ───────────────────────────────────────────────────────────────────────────
  // Quant build flow — alternate 5-stage conversation triggered from Studio
  // ("让 aime 帮我建"). Walks the user through intent → engine → config → run → result.
  // ───────────────────────────────────────────────────────────────────────────
  const QUANT_BUILD_FLOW = [
    {
      index: 0,
      label: 'Intent',
      hint: 'Tell aime what you want',
      blocks: [
        { id: 'q0-text', type: 'text', payload: {
          body: '想做什么样的策略？说一句话即可，或选一个常见思路 ⬇',
        }},
        { id: 'q0-quick', type: 'quantIntent', payload: {
          options: [
            { id: 'momentum', label: '🏃 按动量选股', engine: 'screen', detail: '选 1M / 3M 涨幅高的，月度调仓' },
            { id: 'earnings', label: '📊 财报漂移研究', engine: 'event', detail: '看正向 EPS Surprise 之后 T+20 漂移' },
            { id: 'pairs', label: '🔀 配对交易', engine: 'factor', detail: 'PCA 残差 / 截面均值回归（Pro）' },
            { id: 'pine',  label: '📈 用 Pine 写代码', engine: 'pine', detail: '已有 TradingView 代码，直接跑回测' },
          ],
        }},
      ],
    },
    {
      index: 1,
      label: 'Engine pick',
      hint: 'aime recommends an engine',
      blocks: [
        { id: 'q1-recommend', type: 'engineRecommend', payload: {} },
      ],
    },
    {
      index: 2,
      label: 'Config preview',
      hint: 'Review the config aime drafted',
      blocks: [
        { id: 'q2-text', type: 'text', payload: {
          body: '我帮你预填了一份配置。点小铅笔可改任何一项，或直接 Run Backtest。',
        }},
        { id: 'q2-config', type: 'quantConfigPreview', payload: {} },
      ],
    },
    {
      index: 3,
      label: 'Run',
      hint: 'Run the backtest',
      blocks: [
        { id: 'q3-running', type: 'backtestRunning', payload: {} },
      ],
    },
    {
      index: 4,
      label: 'Result',
      hint: 'Result card + actions',
      blocks: [
        { id: 'q4-text', type: 'text', payload: {
          body: '回测完成 ✨ 关键指标：',
        }},
        { id: 'q4-result', type: 'backtestResultCard', payload: {} },
      ],
    },
  ];

  function getActiveFlow(state) {
    if (state && state.flowName === 'quant') return QUANT_BUILD_FLOW;
    return AIMECLAW_FLOW;
  }
  function getActiveFlowTotal(state) {
    return getActiveFlow(state).length;
  }

  Object.assign(window, {
    AIMECLAW_STRATEGIES, AIMECLAW_FLOW, TOTAL_STAGES, getAimeStrategy,
    QUANT_BUILD_FLOW, getActiveFlow, getActiveFlowTotal,
  });
})();
