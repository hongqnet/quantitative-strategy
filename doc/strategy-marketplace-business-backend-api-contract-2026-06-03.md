# 策略广场业务后端接口协议

版本：v2026-06-03

适用范围：基于 `web/vibetrading` 最新 Marketplace、Activity 前端功能，以及 `doc/算法API文档.md` 算法接口重新定义业务后端接口协议。

## 1. 通用约定

### 1.1 前端接口返回结构

业务后端面向前端统一返回：

```json
{
  "status_code": 0,
  "status_msg": "success",
  "data": {}
}
```

字段说明：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| status_code | Integer | 是 | `0` 表示成功，非 0 表示失败 |
| status_msg | String | 是 | 错误或成功描述 |
| data | Any | 否 | 响应数据 |

### 1.2 命名约定

1. 前端接口字段使用 camelCase。
2. 算法接口字段保持算法文档中的 snake_case。
3. 金额字段单位为原币种数值。
4. 百分比字段均为百分比数值，不是小数。例如 `12.34` 表示 12.34%。
5. 时间字段使用 ISO-8601 字符串，日期字段使用 `yyyy-MM-dd` 或算法要求的 `yyyyMMdd`。

### 1.3 错误码

| 错误码 | 说明 |
| --- | --- |
| 0 | 成功 |
| 40001 | 请求参数错误 |
| 40100 | 未登录或登录态失效 |
| 40300 | 无权限 |
| 40401 | 策略不存在 |
| 40901 | Activity 状态冲突 |
| 50001 | 业务后端内部错误 |
| 50201 | 算法服务不可用 |
| 50202 | 推荐服务不可用 |
| 50203 | 交易后端不可用 |
| 50301 | 策略快照缺失 |

## 2. 公共 DTO

### 2.1 StrategyCardDTO

```json
{
  "strategyId": "mean-reversion-etf",
  "name": "ETF Mean Reversion",
  "symbol": "ETF-MR",
  "market": "Equities",
  "universe": {
    "kind": "ETF",
    "label": "US sector ETFs",
    "detail": "XLK, XLF, XLE and peer ETFs"
  },
  "author": "Quant Lab",
  "blurb": "Mean reversion strategy across liquid sector ETFs.",
  "tags": ["Mean reversion", "ETF", "Low turnover"],
  "engine": "screen",
  "metrics": {
    "return1YPct": 18.42,
    "sharpe1Y": 1.36,
    "maxDrawdownPct": -8.25,
    "cagr5YPct": 12.18,
    "winRatePct": 57.2,
    "followers": 1284
  },
  "curve": [
    {
      "date": "2026-01-02",
      "value": 1.002
    }
  ],
  "publishedAt": "2026-01-15T10:00:00+08:00",
  "activityStatus": "none",
  "deployStatus": "none"
}
```

字段说明：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| strategyId | String | 是 | 策略 ID |
| name | String | 是 | 策略名称 |
| symbol | String | 是 | 策略展示代号 |
| market | String | 是 | 市场/资产分类 |
| universe | UniverseDTO | 是 | 策略标的范围 |
| author | String | 否 | 作者 |
| blurb | String | 否 | 策略摘要 |
| tags | Array<String> | 否 | 标签 |
| engine | String | 否 | screen/pine/event/factor |
| metrics | StrategyMetricsDTO | 是 | 策略指标 |
| curve | Array<CurvePointDTO> | 是 | 卡片收益曲线 |
| publishedAt | String | 否 | 发布时间 |
| activityStatus | String | 是 | none/watching |
| deployStatus | String | 是 | none/watching/paper/live/paused/unknown |

### 2.2 StrategyMetricsDTO

```json
{
  "return1YPct": 18.42,
  "sharpe1Y": 1.36,
  "maxDrawdownPct": -8.25,
  "cagr5YPct": 12.18,
  "winRatePct": 57.2,
  "followers": 1284
}
```

### 2.3 CurvePointDTO

```json
{
  "date": "2026-01-02",
  "value": 1.002
}
```

### 2.4 PreviewHoldingDTO

```json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "market": "US",
  "side": "long",
  "weightPct": 12.5,
  "unrealizedPct": 3.2,
  "quantity": 100,
  "avgPrice": 185.32,
  "lastPrice": 191.25
}
```

字段说明：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| symbol | String | 是 | 标的代码 |
| name | String | 否 | 标的名称 |
| market | String | 否 | 市场 |
| side | String | 是 | `long` 或 `short` |
| weightPct | Number | 是 | 当前权重百分比 |
| unrealizedPct | Number | 是 | 当前浮动盈亏百分比 |
| quantity | Number | 否 | 数量 |
| avgPrice | Number | 否 | 平均成本价 |
| lastPrice | Number | 否 | 最新价 |

### 2.5 PreviewTradeDTO

```json
{
  "tradeTime": "2026-05-28T14:30:00+08:00",
  "symbol": "AAPL",
  "side": "BUY",
  "quantity": 100,
  "price": 185.32,
  "realizedPnl": 128.45,
  "reason": "rebalance"
}
```

字段说明：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| tradeTime | String | 是 | 交易时间 |
| symbol | String | 是 | 标的代码 |
| side | String | 是 | BUY/SELL |
| quantity | Number | 是 | 数量 |
| price | Number | 是 | 成交价 |
| realizedPnl | Number | 否 | 已实现盈亏；未平仓或无盈亏时可为 null |
| reason | String | 否 | 交易原因 |

### 2.6 SignalDTO

```json
{
  "kind": "rebalance",
  "text": "Rotate 12% from XLK to XLF",
  "at": "2026-06-03T09:30:00+08:00"
}
```

### 2.7 PreviewDataStatus

| 值 | 说明 |
| --- | --- |
| ready | preview 快照完整 |
| missing | 没有可用快照 |
| partial | 快照部分字段缺失 |
| calculating | 正在计算 |
| failed | 最近一次算法计算失败 |

## 3. Marketplace 前端接口

### 3.1 查询策略列表

`GET /api/strategy-marketplace/strategies`

请求参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| asset | String | 否 | Asset 过滤；不传表示全部 |
| style | String | 否 | Style/tag 过滤；不传表示全部 |
| sort | String | 否 | `1Y_SHARPE`、`1Y_RETURN`、`CAGR_5Y`、`MAX_DRAWDOWN`、`FOLLOWERS`、`RECENTLY_PUBLISHED` |
| pageNo | Integer | 否 | 默认 1 |
| pageSize | Integer | 否 | 默认 20 |

响应：

```json
{
  "status_code": 0,
  "status_msg": "success",
  "data": {
    "pageNo": 1,
    "pageSize": 20,
    "total": 128,
    "items": [
      {
        "strategyId": "mean-reversion-etf",
        "name": "ETF Mean Reversion",
        "symbol": "ETF-MR",
        "market": "Equities",
        "universe": {
          "kind": "ETF",
          "label": "US sector ETFs",
          "detail": "XLK, XLF, XLE and peer ETFs"
        },
        "author": "Quant Lab",
        "blurb": "Mean reversion strategy across liquid sector ETFs.",
        "tags": ["Mean reversion", "ETF"],
        "engine": "screen",
        "metrics": {
          "return1YPct": 18.42,
          "sharpe1Y": 1.36,
          "maxDrawdownPct": -8.25,
          "cagr5YPct": 12.18,
          "winRatePct": 57.2,
          "followers": 1284
        },
        "curve": [
          {
            "date": "2026-01-02",
            "value": 1.002
          }
        ],
        "publishedAt": "2026-01-15T10:00:00+08:00",
        "activityStatus": "none",
        "deployStatus": "none"
      }
    ]
  }
}
```

说明：

1. 本接口用于 Explore strategies。
2. 不返回 Parameters、Code。
3. 不返回 holdings、recentTrades，Preview 打开时通过详情接口获取。

### 3.2 查询 For you 推荐

`GET /api/strategy-marketplace/recommendations/for-you`

请求参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| limit | Integer | 否 | 默认 3 |

响应：

```json
{
  "status_code": 0,
  "status_msg": "success",
  "data": {
    "items": [
      {
        "strategyId": "mean-reversion-etf",
        "name": "ETF Mean Reversion",
        "aiMatchPct": 92.5,
        "reason": "Matches your ETF and low-turnover preferences",
        "metrics": {
          "return1YPct": 18.42,
          "sharpe1Y": 1.36,
          "maxDrawdownPct": -8.25,
          "cagr5YPct": 12.18,
          "winRatePct": 57.2,
          "followers": 1284
        },
        "curve": [
          {
            "date": "2026-01-02",
            "value": 1.002
          }
        ]
      }
    ],
    "fallback": false
  }
}
```

说明：

1. 登录用户优先走推荐服务。
2. 未登录或推荐失败时，按榜单/热度降级，`fallback=true`。

### 3.3 查询 Leaderboard

`GET /api/strategy-marketplace/leaderboard`

请求参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| window | String | 否 | `1M`、`3M`、`6M`、`1Y`、`ALL`，默认 `3M` |
| market | String | 否 | 市场过滤 |
| limit | Integer | 否 | 默认 10 |

响应：

```json
{
  "status_code": 0,
  "status_msg": "success",
  "data": {
    "window": "3M",
    "displayWindow": "3M",
    "items": [
      {
        "rank": 1,
        "strategyId": "mean-reversion-etf",
        "name": "ETF Mean Reversion",
        "symbol": "ETF-MR",
        "market": "Equities",
        "displayReturnPct": 8.72,
        "sharpe": 1.42,
        "curve": [
          {
            "date": "2026-03-01",
            "value": 1.0
          }
        ]
      }
    ]
  }
}
```

说明：

1. 本接口只用于 Marketplace 榜单。
2. Activity 不提供 leaderboard 接口。

### 3.4 查询策略 Preview/Detail

`GET /api/strategy-marketplace/strategies/{strategyId}`

请求参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| startDate | String | 否 | Preview 计算开始日期，`yyyy-MM-dd` |
| endDate | String | 否 | Preview 计算结束日期，`yyyy-MM-dd` |
| includeHoldings | Boolean | 否 | 默认 true |
| includeTrades | Boolean | 否 | 默认 true |
| tradeLimit | Integer | 否 | 默认 20 |

响应：

```json
{
  "status_code": 0,
  "status_msg": "success",
  "data": {
    "strategy": {
      "strategyId": "mean-reversion-etf",
      "name": "ETF Mean Reversion",
      "symbol": "ETF-MR",
      "market": "Equities",
      "universe": {
        "kind": "ETF",
        "label": "US sector ETFs",
        "detail": "XLK, XLF, XLE and peer ETFs"
      },
      "author": "Quant Lab",
      "blurb": "Mean reversion strategy across liquid sector ETFs.",
      "tags": ["Mean reversion", "ETF"],
      "engine": "screen",
      "metrics": {
        "return1YPct": 18.42,
        "sharpe1Y": 1.36,
        "maxDrawdownPct": -8.25,
        "cagr5YPct": 12.18,
        "winRatePct": 57.2,
        "followers": 1284
      },
      "publishedAt": "2026-01-15T10:00:00+08:00",
      "activityStatus": "watching",
      "deployStatus": "none"
    },
    "curve": [
      {
        "date": "2026-01-02",
        "value": 1.002
      }
    ],
    "benchmarkCurve": [
      {
        "date": "2026-01-02",
        "value": 1.0
      }
    ],
    "holdings": [
      {
        "symbol": "AAPL",
        "name": "Apple Inc.",
        "market": "US",
        "side": "long",
        "weightPct": 12.5,
        "unrealizedPct": 3.2,
        "quantity": 100,
        "avgPrice": 185.32,
        "lastPrice": 191.25
      }
    ],
    "recentTrades": [
      {
        "tradeTime": "2026-05-28T14:30:00+08:00",
        "symbol": "AAPL",
        "side": "BUY",
        "quantity": 100,
        "price": 185.32,
        "realizedPnl": 128.45,
        "reason": "rebalance"
      }
    ],
    "previewDataStatus": "ready",
    "calculatedAt": "2026-06-03T10:00:00+08:00"
  }
}
```

说明：

1. 本接口用于 Marketplace Preview 和 Marketplace Detail。
2. `holdings.side`、`holdings.unrealizedPct`、`recentTrades.realizedPnl` 为本版必需字段。
3. `holdings` 与 `recentTrades` 来自算法 `POST /api/strategy/return/calculate` 扩展返回。
4. 不返回 Parameters。
5. 不返回 Code。

### 3.5 策略详情手动回测/刷新 Preview

`POST /api/strategy-marketplace/strategies/{strategyId}/manual-backtest`

请求：

```json
{
  "startDate": "2026-01-01",
  "endDate": "2026-06-03",
  "benchmark": "SPY",
  "timeframe": "1D",
  "capital": 100000,
  "includeHoldings": true,
  "includeTrades": true,
  "tradeLimit": 20
}
```

响应：

```json
{
  "status_code": 0,
  "status_msg": "success",
  "data": {
    "strategyId": "mean-reversion-etf",
    "totalReturnPct": 12.34,
    "annualizedReturnPct": 18.42,
    "annualizedVolatilityPct": 12.8,
    "sharpe": 1.36,
    "maxDrawdownPct": -8.25,
    "winRatePct": 57.2,
    "curve": [
      {
        "date": "2026-01-02",
        "value": 1.002
      }
    ],
    "benchmarkDiffCurve": [
      {
        "date": "2026-01-02",
        "value": 0.001
      }
    ],
    "holdings": [
      {
        "symbol": "AAPL",
        "name": "Apple Inc.",
        "side": "long",
        "weightPct": 12.5,
        "unrealizedPct": 3.2
      }
    ],
    "recentTrades": [
      {
        "tradeTime": "2026-05-28T14:30:00+08:00",
        "symbol": "AAPL",
        "side": "BUY",
        "quantity": 100,
        "price": 185.32,
        "realizedPnl": 128.45
      }
    ],
    "previewDataStatus": "ready",
    "calculatedAt": "2026-06-03T10:00:00+08:00"
  }
}
```

说明：

1. 本接口调用算法 `POST /api/strategy/return/calculate`。
2. 业务后端不计算收益与 holdings/trades。
3. 算法失败时返回 `50201` 或 `previewDataStatus=failed`。
4. 本接口沿用旧版手动回测路径，不新增 `/return/calculate` 路由。

## 4. Activity 前端接口

### 4.1 加入 Activity

`POST /api/strategy-marketplace/activity`

请求：

```json
{
  "strategyId": "mean-reversion-etf"
}
```

响应：

```json
{
  "status_code": 0,
  "status_msg": "success",
  "data": {
    "strategyId": "mean-reversion-etf",
    "activityStatus": "watching",
    "observationStartAt": "2026-06-03T10:00:00+08:00"
  }
}
```

说明：

1. 重复加入时幂等返回当前 Activity 关系。
2. 加入后可触发观察区间收益异步计算。

### 4.2 移除 Activity

`DELETE /api/strategy-marketplace/activity/{strategyId}`

响应：

```json
{
  "status_code": 0,
  "status_msg": "success",
  "data": {
    "strategyId": "mean-reversion-etf",
    "activityStatus": "removed"
  }
}
```

说明：

1. 移除采用逻辑删除。
2. 移除不存在的策略时幂等成功。

### 4.3 查询 Activity 列表

`GET /api/strategy-marketplace/activity`

请求参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| sort | String | 否 | `cumulative`、`today`、`runtime`，默认 `cumulative` |
| pageNo | Integer | 否 | 默认 1 |
| pageSize | Integer | 否 | 默认 20 |

响应：

```json
{
  "status_code": 0,
  "status_msg": "success",
  "data": {
    "pageNo": 1,
    "pageSize": 20,
    "total": 12,
    "items": [
      {
        "strategyId": "mean-reversion-etf",
        "name": "ETF Mean Reversion",
        "symbol": "ETF-MR",
        "market": "Equities",
        "universe": {
          "kind": "ETF",
          "label": "US sector ETFs",
          "detail": "XLK, XLF, XLE and peer ETFs"
        },
        "tags": ["Mean reversion", "ETF"],
        "addedAt": "2026-05-20T10:00:00+08:00",
        "runDays": 14,
        "deployStatus": "watching",
        "deployAccountLabel": null,
        "cumulativeReturnPct": 4.82,
        "todayReturnPct": 0.35,
        "curve": [
          {
            "date": "2026-05-20",
            "value": 1.0
          }
        ],
        "lastSignal": {
          "kind": "rebalance",
          "text": "Rotate 12% from XLK to XLF",
          "at": "2026-06-03T09:30:00+08:00"
        },
        "nextRunTime": "2026-06-04T09:30:00+08:00",
        "healthStatus": "healthy"
      }
    ]
  }
}
```

说明：

1. 本接口对应 Activity Your shortlist。
2. 不返回 Shortlist leaderboard。
3. 不返回 positions。
4. 不返回 Sharpe。
5. 不返回 Max DD。
6. `deployStatus` 可来自交易后端摘要或业务后端缓存。
7. `cumulativeReturnPct`、`todayReturnPct`、`curve`、`lastSignal`、`nextRunTime` 来自算法区间收益接口返回或其快照。

## 5. 业务后端调用算法接口

### 5.1 单个或批量计算策略区间收益

算法现有接口：

`POST /api/strategy/return/calculate`

### 5.1.1 请求协议

算法文档现有请求：

```json
{
  "strategy_ids": ["mean-reversion-etf"],
  "user_id": "u_001",
  "start_date": "20260101",
  "end_date": "20260603"
}
```

本方案要求扩展请求：

```json
{
  "strategy_ids": ["mean-reversion-etf"],
  "user_id": "u_001",
  "start_date": "20260101",
  "end_date": "20260603",
  "include_holdings": true,
  "include_trades": true,
  "trade_limit": 20,
  "include_signal": true,
  "benchmark": "SPY"
}
```

字段说明：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| strategy_ids | Array<String> | 是 | 策略 ID 列表 |
| user_id | String | 否 | 用户 ID；Activity 场景传入 |
| start_date | String | 是 | 开始日期，`yyyyMMdd` |
| end_date | String | 是 | 结束日期，`yyyyMMdd` |
| include_holdings | Boolean | 否 | 是否返回 preview holdings；Preview 场景必须 true |
| include_trades | Boolean | 否 | 是否返回 recent trades；Preview 场景必须 true |
| trade_limit | Integer | 否 | 返回最近交易数量，默认 20 |
| include_signal | Boolean | 否 | 是否返回 last signal 与 next run |
| benchmark | String | 否 | 基准，默认 SPY |

### 5.1.2 响应协议

算法文档现有响应结构：

```json
{
  "status_code": 0,
  "status_msg": "success",
  "response": [
    {
      "strategy_id": "mean-reversion-etf",
      "strategy_name": "ETF Mean Reversion",
      "total_return": 12.34,
      "annualized_return": 18.42,
      "annualized_volatility": 12.8,
      "sharpe_ratio": 1.36,
      "max_drawdown": -8.25,
      "win_rate": 57.2,
      "nav_curve": [
        {
          "date": "20260102",
          "nav": 1.002
        }
      ],
      "spy_diff_curve": [
        {
          "date": "20260102",
          "diff": 0.001
        }
      ],
      "start_date": "20260101",
      "end_date": "20260603",
      "status": "SUCCESS",
      "error_msg": null
    }
  ]
}
```

本方案要求扩展 `StrategyReturnVO`：

```json
{
  "status_code": 0,
  "status_msg": "success",
  "response": [
    {
      "strategy_id": "mean-reversion-etf",
      "strategy_name": "ETF Mean Reversion",
      "total_return": 12.34,
      "today_return": 0.35,
      "annualized_return": 18.42,
      "annualized_volatility": 12.8,
      "sharpe_ratio": 1.36,
      "max_drawdown": -8.25,
      "win_rate": 57.2,
      "nav_curve": [
        {
          "date": "20260102",
          "nav": 1.002
        }
      ],
      "spy_diff_curve": [
        {
          "date": "20260102",
          "diff": 0.001
        }
      ],
      "holdings": [
        {
          "symbol": "AAPL",
          "name": "Apple Inc.",
          "market": "US",
          "side": "long",
          "weight_pct": 12.5,
          "unrealized_pct": 3.2,
          "quantity": 100,
          "avg_price": 185.32,
          "last_price": 191.25
        }
      ],
      "recent_trades": [
        {
          "trade_time": "2026-05-28T14:30:00+08:00",
          "symbol": "AAPL",
          "side": "BUY",
          "quantity": 100,
          "price": 185.32,
          "realized_pnl": 128.45,
          "reason": "rebalance"
        }
      ],
      "last_signal": {
        "kind": "rebalance",
        "text": "Rotate 12% from XLK to XLF",
        "at": "2026-06-03T09:30:00+08:00"
      },
      "next_run_time": "2026-06-04T09:30:00+08:00",
      "health_status": "healthy",
      "start_date": "20260101",
      "end_date": "20260603",
      "status": "SUCCESS",
      "error_msg": null
    }
  ]
}
```

扩展字段说明：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| today_return | Number | Activity 必填 | 今日收益率百分比 |
| holdings | Array<AlgorithmHoldingVO> | Preview 必填 | 当前持仓快照 |
| recent_trades | Array<AlgorithmTradeVO> | Preview 必填 | 近期交易列表 |
| last_signal | Object | Activity 必填 | 最新信号摘要 |
| next_run_time | String | Activity 必填 | 下一次运行时间 |
| health_status | String | Activity 必填 | healthy/warning/error |

### 5.1.3 AlgorithmHoldingVO

```json
{
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "market": "US",
  "side": "long",
  "weight_pct": 12.5,
  "unrealized_pct": 3.2,
  "quantity": 100,
  "avg_price": 185.32,
  "last_price": 191.25
}
```

字段说明：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| symbol | String | 是 | 标的代码 |
| name | String | 否 | 标的名称 |
| market | String | 否 | 市场 |
| side | String | 是 | `long` 或 `short` |
| weight_pct | Number | 是 | 当前权重百分比 |
| unrealized_pct | Number | 是 | 当前浮动盈亏百分比 |
| quantity | Number | 否 | 数量 |
| avg_price | Number | 否 | 平均成本价 |
| last_price | Number | 否 | 最新价 |

### 5.1.4 AlgorithmTradeVO

```json
{
  "trade_time": "2026-05-28T14:30:00+08:00",
  "symbol": "AAPL",
  "side": "BUY",
  "quantity": 100,
  "price": 185.32,
  "realized_pnl": 128.45,
  "reason": "rebalance"
}
```

字段说明：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| trade_time | String | 是 | 交易时间 |
| symbol | String | 是 | 标的代码 |
| side | String | 是 | BUY/SELL |
| quantity | Number | 是 | 数量 |
| price | Number | 是 | 成交价 |
| realized_pnl | Number | 否 | 已实现盈亏 |
| reason | String | 否 | 交易原因 |

### 5.1.5 算法字段到前端字段映射

| 算法字段 | 业务后端字段 | 用途 |
| --- | --- | --- |
| strategy_id | strategyId | 策略 ID |
| strategy_name | name | 策略名称 |
| total_return | totalReturnPct / cumulativeReturnPct / return1YPct | 区间收益 |
| today_return | todayReturnPct | Activity Today |
| annualized_return | annualizedReturnPct / cagr5YPct | 年化收益 |
| annualized_volatility | annualizedVolatilityPct | 波动率 |
| sharpe_ratio | sharpe / sharpe1Y | Marketplace 指标 |
| max_drawdown | maxDrawdownPct | Marketplace 指标 |
| win_rate | winRatePct | Marketplace Preview 指标 |
| nav_curve[].nav | curve[].value | 收益曲线 |
| spy_diff_curve[].diff | benchmarkDiffCurve[].value | 基准差值曲线 |
| holdings[].side | holdings[].side | Preview 多空方向 |
| holdings[].weight_pct | holdings[].weightPct | Preview 权重 |
| holdings[].unrealized_pct | holdings[].unrealizedPct | Preview 浮动盈亏 |
| recent_trades[].trade_time | recentTrades[].tradeTime | Preview 交易时间 |
| recent_trades[].realized_pnl | recentTrades[].realizedPnl | Preview 已实现盈亏 |
| last_signal | lastSignal | Activity 信号 |
| next_run_time | nextRunTime | Activity 下一次运行 |
| health_status | healthStatus | Activity 健康状态 |

## 6. 算法已部署策略列表接口边界

算法现有接口：

`GET /api/strategy/deployed/list?user_id={userId}`

该接口当前不作为策略广场业务后端核心接口使用，原因：

1. Activity 页面展示的是用户收藏/观察策略，不等同于算法已部署策略。
2. Deployed 详情页涉及真实部署、真实订单、真实仓位，应归交易后端。
3. Marketplace 的 Add to Activity 是观察关系，不是部署关系。

若后续需要合并部署状态，可将该接口作为部署摘要候选来源，但必须与交易后端状态口径对齐。

## 7. 推荐服务接口边界

推荐服务接口待定。业务后端期望获得：

```json
{
  "user_id": "u_001",
  "limit": 3,
  "strategy_ids": ["mean-reversion-etf"],
  "scores": [
    {
      "strategy_id": "mean-reversion-etf",
      "score": 92.5,
      "reason": "Matches ETF and low-turnover preferences"
    }
  ]
}
```

推荐服务不可用时，业务后端按以下顺序降级：

1. 用户已加入 Activity 的策略标签相似策略。
2. Marketplace 1Y Sharpe 榜单。
3. Followers 榜单。

## 8. 交易后端接口边界

交易后端负责：

1. 策略部署。
2. 策略暂停、恢复、停止。
3. 实盘/模拟盘账户。
4. 真实仓位与真实订单。
5. Deployed 详情页。

策略广场业务后端只需要部署摘要：

```json
{
  "strategyId": "mean-reversion-etf",
  "deployStatus": "paper",
  "deployAccountLabel": "Paper account",
  "deployUrl": "/trade/deploy?strategyId=mean-reversion-etf"
}
```

该协议需与交易后端另行确认。本接口协议不定义交易后端完整部署协议。

## 9. Push 服务边界

前端当前存在 PushFeed 与 Toast。Push 服务负责消息通道，业务后端不提供 Push 拉取接口。

如需业务后端记录消息元数据，可另行定义：

```json
{
  "messageId": "msg_001",
  "strategyId": "mean-reversion-etf",
  "kind": "signal",
  "title": "New signal",
  "body": "Rotate 12% from XLK to XLF",
  "createdAt": "2026-06-03T09:30:00+08:00"
}
```

本版不要求实现。

## 10. 已删除功能对应接口

以下接口本版不提供：

| 功能 | 原因 |
| --- | --- |
| Marketplace Preview Parameters | 前端 Marketplace Preview 已删除 Parameters 模块 |
| Marketplace Preview Code | 前端 Marketplace Preview 已删除 Code 模块 |
| Activity Shortlist leaderboard | 前端 Activity 已删除该模块 |
| Activity positions | 前端 Activity 卡片已删除 position 模块 |
| Activity Sharpe | 前端 Activity 卡片已删除 Sharpe |
| Activity Max DD | 前端 Activity 卡片已删除 Max DD |
| Deployed Positions/Orders/Parameters/Code | 属于交易/Deployed 模块，不属于策略广场业务后端 |

## 11. 联调检查清单

1. `GET /api/strategy-marketplace/strategies` 返回的卡片字段能渲染 Marketplace Explore。
2. `GET /api/strategy-marketplace/recommendations/for-you` 返回 3 个推荐策略。
3. `GET /api/strategy-marketplace/leaderboard` 返回窗口、市场、曲线、排名。
4. `GET /api/strategy-marketplace/strategies/{strategyId}` 返回 `holdings[].side`。
5. `GET /api/strategy-marketplace/strategies/{strategyId}` 返回 `holdings[].unrealizedPct`。
6. `GET /api/strategy-marketplace/strategies/{strategyId}` 返回 `recentTrades[].realizedPnl`。
7. `GET /api/strategy-marketplace/activity` 不返回 positions。
8. `GET /api/strategy-marketplace/activity` 不返回 Sharpe。
9. `GET /api/strategy-marketplace/activity` 不返回 Max DD。
10. `GET /api/strategy-marketplace/activity` 支持 `sort=cumulative`、`sort=today`、`sort=runtime`。
11. 算法 `POST /api/strategy/return/calculate` 在 `include_holdings=true`、`include_trades=true` 时返回 preview 持仓和交易列表。

## 12. 本版协议差异点

1. 新增 Marketplace Preview/Detail 的 `holdings` 与 `recentTrades` 明确定义。
2. 新增 holdings 必填字段 `side` 与 `unrealizedPct`。
3. 新增 recentTrades 字段 `realizedPnl`。
4. 新增算法 `POST /api/strategy/return/calculate` 扩展字段要求。
5. 删除 Marketplace Preview Parameters/Code 接口需求。
6. 删除 Activity leaderboard 接口需求。
7. 删除 Activity positions、Sharpe、Max DD 接口需求。
8. 将部署相关能力划归交易后端边界。
