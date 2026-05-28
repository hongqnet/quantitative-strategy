# 算法 API 文档



---

## 目录

1. [接口1: 查询当前用户已部署策略列表](http://localhost:63342/markdownPreview/1895327259/markdown-preview-index-59317782.html?_ijt=kdii8judm3arbofjj17l9107ae#%E6%8E%A5%E5%8F%A31-%E6%9F%A5%E8%AF%A2%E5%BD%93%E5%89%8D%E7%94%A8%E6%88%B7%E5%B7%B2%E9%83%A8%E7%BD%B2%E7%AD%96%E7%95%A5%E5%88%97%E8%A1%A8)

2. [接口2: 单个或批量计算策略区间收益](http://localhost:63342/markdownPreview/1895327259/markdown-preview-index-59317782.html?_ijt=kdii8judm3arbofjj17l9107ae#%E6%8E%A5%E5%8F%A32-%E5%8D%95%E4%B8%AA%E6%88%96%E6%89%B9%E9%87%8F%E8%AE%A1%E7%AE%97%E7%AD%96%E7%95%A5%E5%8C%BA%E9%97%B4%E6%94%B6%E7%9B%8A)

3. [接口3: 同步策略ID列表信息以及状态信息](http://localhost:63342/markdownPreview/1895327259/markdown-preview-index-59317782.html?_ijt=kdii8judm3arbofjj17l9107ae#%E6%8E%A5%E5%8F%A33-%E5%90%8C%E6%AD%A5%E7%AD%96%E7%95%A5id%E5%88%97%E8%A1%A8%E4%BF%A1%E6%81%AF%E4%BB%A5%E5%8F%8A%E7%8A%B6%E6%80%81%E4%BF%A1%E6%81%AF)

4. [接口4: 推送策略信号事件](http://localhost:63342/markdownPreview/1895327259/markdown-preview-index-59317782.html?_ijt=kdii8judm3arbofjj17l9107ae#%E6%8E%A5%E5%8F%A34-%E6%8E%A8%E9%80%81%E7%AD%96%E7%95%A5%E4%BF%A1%E5%8F%B7%E4%BA%8B%E4%BB%B6)

---

## 接口1: 查询当前用户已部署策略列表

> 用于后端聚合部署标记，返回用户已部署（deploy / watch\_only）的策略及其状态信息。
> 
> 

### 基本信息

|字段|值|
|---|---|
|**URL**|`/api/strategy/deployed/list`|
|**方法**|`GET`|
|**标签**|量化策略管理API|
|**描述**|查询当前用户已部署策略列表|

### 请求参数

|参数名|位置|必填|类型|说明|
|---|---|---|---|---|
|user\_id|Query|是|String|用户ID|

### 请求示例



```Plain Text
GET /api/strategy/deployed/list?userId=user_001
```

### 响应参数

|参数名|类型|说明|
|---|---|---|
|status\_code|Integer|状态码，0 表示成功|
|status\_msg|String|返回消息|
|response|Array\&lt;DeployedStrategyVO\&gt;|已部署策略列表|

#### DeployedStrategyVO

|参数名|类型|说明|
|---|---|---|
|binding\_id|String|绑定关系ID|
|strategy\_id|String|策略ID|
|strategy\_name|String|策略名称|
|author|String|策略作者|
|strategy\_status|String|策略状态: deployed / running / paused / stopped / watch\_only|
|binding\_type|String|绑定类型: favorite / deploy / watch\_only|
|is\_favorited|Boolean|是否已收藏|
|asset\_category|String|资产类别: stock / crypto / futures / forex / mixed|
|invest\_style|String|投资风格|
|initial\_capital|BigDecimal|部署期初金额|
|current\_nav|BigDecimal|当前净值|
|today\_return|BigDecimal|今日收益|
|total\_return|BigDecimal|总收益|
|broker\_account\_id|String|关联券商账户ID|
|broker\_account\_label|String|券商账户名称|
|is\_auto\_trading|Boolean|是否自动交易|
|last\_trade\_time|String|最近交易时间|
|deploy\_time|String|部署时间|
|tags|Array\&lt;String\&gt;|策略标签|

### 响应示例



```JSON
{
  "status_code": 0,
  "status_msg": "success",
  "response": [
    {
      "binding_id": "bind_001",
      "strategy_id": "strategy_001",
      "strategy_name": "趋势跟踪策略",
      "author": "QuantLab",
      "strategy_status": "running",
      "binding_type": "deploy",
      "is_favorited": true,
      "asset_category": "stock",
      "invest_style": "trend_following",
      "initial_capital": 10000.00,
      "current_nav": 12580.50,
      "today_return": 125.30,
      "total_return": 2580.50,
      "broker_account_id": "acc_001",
      "broker_account_label": "IB主账户",
      "is_auto_trading": true,
      "last_trade_time": "2026-03-17T15:30:00",
      "deploy_time": "2026-01-15T10:00:00",
      "tags": ["趋势", "动量", "中频"]
    }
  ]
}
```

---

## 接口2: 单个或批量计算策略区间收益

> 对于给定的策略列表，在指定的时间区间内计算收益指标。
> 
> 

### 基本信息

|字段|值|
|---|---|
|**URL**|`/api/strategy/return/calculate`|
|**方法**|`POST`|
|**标签**|量化策略管理API|
|**描述**|单个或批量计算策略区间收益|

### 请求参数

#### Body \(application/json\)

|参数名|类型|必填|说明|
|---|---|---|---|
|strategy\_ids|Array\&lt;String\&gt;|是|策略ID列表（单个策略传一个元素）|
|user\_id|String|否|用户ID（用于获取用户绑定期初金额配置）|
|start\_date|String|是|开始日期，格式 yyyyMMdd|
|end\_date|String|是|结束日期，格式 yyyyMMdd|

### 请求示例



```JSON
{
  "strategy_ids": ["strategy_001", "strategy_002"],
  "user_id": "user_001",
  "start_date": "20250301",
  "end_date": "20260318"
}
```

### 响应参数

|参数名|类型|说明|
|---|---|---|
|status\_code|Integer|状态码，0 表示成功|
|status\_msg|String|返回消息|
|response|Array\&lt;StrategyReturnVO\&gt;|策略收益结果列表|

#### StrategyReturnVO

|参数名|类型|说明|
|---|---|---|
|strategy\_id|String|策略ID|
|strategy\_name|String|策略名称|
|total\_return|BigDecimal|区间总收益率（%）|
|annualized\_return|BigDecimal|年化收益率（%）|
|annualized\_volatility|BigDecimal|年化波动率（%）|
|sharpe\_ratio|BigDecimal|夏普比率|
|max\_drawdown|BigDecimal|最大回撤（%）|
|win\_rate|BigDecimal|胜率（%）|
|nav\_curve|Array\&lt;Object\&gt;|收益曲线数据 \[\{date, nav\}\]|
|spy\_diff\_curve|Array\&lt;Object\&gt;|与SPY的差值序列 \[\{date, diff\}\]|
|start\_date|String|计算开始日期|
|end\_date|String|计算结束日期|
|status|String|计算状态: SUCCESS / FAIL|
|error\_msg|String|失败原因|

### 响应示例



```JSON
{
  "status_code": 0,
  "status_msg": "success",
  "response": [
    {
      "strategy_id": "strategy_001",
      "strategy_name": "趋势跟踪策略",
      "total_return": 25.80,
      "annualized_return": 18.50,
      "annualized_volatility": 22.30,
      "sharpe_ratio": 0.83,
      "max_drawdown": -12.50,
      "win_rate": 58.30,
      "nav_curve": [
        {"date": "20250301", "nav": 10000.00},
        {"date": "20250315", "nav": 10250.00},
        {"date": "20260318", "nav": 12580.00}
      ],
      "spy_diff_curve": [
        {"date": "20250301", "diff": 0.00},
        {"date": "20250315", "diff": 1.25},
        {"date": "20260318", "diff": 8.50}
      ],
      "start_date": "20250301",
      "end_date": "20260318",
      "status": "SUCCESS",
      "error_msg": null
    }
  ]
}
```

---

## 接口3: 同步策略ID列表信息以及状态信息

> 批量同步指定策略的最新信息（名称、版本、状态、回测快照等），用于前端定期刷新策略展示数据。
> 
> 

### 基本信息

|字段|值|
|---|---|
|**URL**|`/api/strategy/sync/info`|
|**方法**|`POST`|
|**标签**|量化策略管理API|
|**描述**|同步策略ID列表信息以及状态信息|

### 请求参数

#### Body \(application/json\)

|参数名|类型|必填|说明|
|---|---|---|---|
|strategy\_ids|Array\&lt;String\&gt;|是|需要同步的策略ID列表|
|user\_id|String|否|用户ID（可选，用于同步用户相关的状态信息）|

### 请求示例



```JSON
{
  "strategy_ids": ["strategy_001", "strategy_002", "strategy_003"],
  "user_id": "user_001"
}
```

### 响应参数

|参数名|类型|说明|
|---|---|---|
|status\_code|Integer|状态码，0 表示成功|
|status\_msg|String|返回消息|
|response|Array\&lt;StrategySyncVO\&gt;|策略同步信息列表|

#### StrategySyncVO

|参数名|类型|说明|
|---|---|---|
|strategy\_id|String|策略ID|
|strategy\_name|String|策略名称|
|strategy\_status|String|策略状态|
|version|String|策略版本|
|is\_deployable|Boolean|是否可部署|
|is\_tradable|Boolean|是否可交易|
|current\_nav|BigDecimal|当前净值|
|today\_return|BigDecimal|今日收益|
|total\_return|BigDecimal|总收益|
|backtest\_snapshot|Object|回测数据快照|
|updated\_time|String|更新时间|
|sync\_time|String|同步时间戳|

### 响应示例



```JSON
{
  "status_code": 0,
  "status_msg": "success",
  "response": [
    {
      "strategy_id": "strategy_001",
      "strategy_name": "趋势跟踪策略",
      "strategy_status": "running",
      "version": "2.1.0",
      "is_deployable": true,
      "is_tradable": true,
      "current_nav": 12580.50,
      "today_return": 125.30,
      "total_return": 2580.50,
      "backtest_snapshot": {
        "total_return": 35.60,
        "sharpe_ratio": 0.95,
        "max_drawdown": -15.20,
        "win_rate": 62.10,
        "annualized_return": 22.30,
        "lastBacktestDate": "20260315"
      },
      "updated_time": "2026-03-18T10:30:00",
      "sync_time": "2026-03-18T12:00:00"
    }
  ]
}
```

---

## 接口4: 推送策略信号事件

> 构建并推送策略信号事件到推送通道。实际的推送接口由调用方提供，本接口定义推送内容的标准化格式。
> 
> 

### 基本信息

|字段|值|
|---|---|
|**URL**|`/api/strategy/signal/push`|
|**方法**|`POST`|
|**标签**|量化策略管理API|
|**描述**|推送策略信号事件|

### 请求参数

#### Body \(application/json\)

**PushSignalEventReq**

|参数名|类型|必填|说明|
|---|---|---|---|
|event\_id|String|是|事件ID（全局唯一，用于去重）|
|event\_type|String|是|事件类型: open / close / rebalance / stop\_loss / take\_profit / risk\_warning / status\_change|
|strategy\_id|String|是|策略ID|
|strategy\_name|String|否|策略名称|
|user\_id|String|否|用户ID|
|binding\_id|String|否|绑定关系ID|
|event\_time|String|否|事件发生时间 yyyy\-MM\-dd HH:mm:ss|
|signal\_data|Object|否|信号数据内容|
|extra|Object|否|扩展字段|
|push\_target|Object|否|推送目标信息|

**signal\_data 结构**

|参数名|类型|说明|
|---|---|---|
|trades|Array\&lt;TradeItem\&gt;|交易标的列表|
|signal\_time|String|触发信号时间点|
|signal\_source|String|信号来源|
|positions|Array\&lt;PositionItem\&gt;|当前持仓摘要|
|current\_nav|String|策略当前净值|

**TradeItem**

|参数名|类型|说明|
|---|---|---|
|symbol|String|标的代码|
|direction|String|交易方向: buy / sell|
|quantity|String|交易数量|
|price|String|交易价格|
|amount|String|交易金额|
|reason|String|交易原因|

**PositionItem**

|参数名|类型|说明|
|---|---|---|
|symbol|String|标的代码|
|quantity|String|持仓数量|
|market\_value|String|持仓市值|
|unrealized\_pnl|String|持仓盈亏|
|weight|String|持仓占比（%）|

**push\_target 结构**

|参数名|类型|说明|
|---|---|---|
|push\_method|String|推送方式: webhook / mq / websocket|
|push\_address|String|推送地址|
|require\_confirm|Boolean|是否需要用户确认|

### 请求示例



```JSON
{
  "event_id": "evt_20260318_001",
  "event_type": "open",
  "strategy_id": "strategy_001",
  "strategy_name": "趋势跟踪策略",
  "user_id": "user_001",
  "binding_id": "bind_001",
  "event_time": "2026-03-18 14:30:00",
  "signal_data": {
    "trades": [
      {
        "symbol": "AAPL",
        "direction": "buy",
        "quantity": "100",
        "price": "175.50",
        "amount": "17550.00",
        "reason": "金叉买入信号"
      }
    ],
    "signal_time": "2026-03-18 14:30:00",
    "signal_source": "Screener引擎",
    "positions": [
      {
        "symbol": "AAPL",
        "quantity": "100",
        "market_value": "17550.00",
        "unrealized_pnl": "+350.00",
        "weight": "25.0"
      }
    ],
    "current_nav": "100000.00"
  },
  "extra": {
    "riskLevel": "medium",
    "marketCondition": "bullish"
  },
  "push_target": {
    "push_method": "webhook",
    "push_address": "https://your-api.com/webhook/strategy-signal",
    "require_confirm": true
  }
}
```

### 响应参数

|参数名|类型|说明|
|---|---|---|
|status\_code|Integer|状态码，0 表示成功|
|status\_msg|String|返回消息|
|response|PushSignalEventResult|推送结果|

#### PushSignalEventResult

|参数名|类型|说明|
|---|---|---|
|event\_id|String|事件ID|
|status|String|推送结果: SUCCESS / FAIL|
|push\_time|String|推送时间|
|error\_msg|String|失败原因|

### 响应示例



```JSON
{
  "status_code": 0,
  "status_msg": "success",
  "response": {
    "event_id": "evt_20260318_001",
    "status": "SUCCESS",
    "push_time": "2026-03-18T14:30:01",
    "error_msg": null
  }
}
```

---

## 附录

### 枚举值说明

#### StrategyStatus（策略状态）

|code|说明|
|---|---|
|draft|草稿|
|deployed|已部署|
|running|运行中|
|paused|已暂停|
|stopped|已停止|
|watch\_only|仅监控|
|archived|已归档|

#### PushSignalEventType（推送事件类型）

|code|说明|
|---|---|
|open|开仓信号|
|close|平仓信号|
|rebalance|调仓信号|
|stop\_loss|止损触发|
|take\_profit|止盈触发|
|risk\_warning|风险预警|
|status\_change|状态变更|

### 通用错误码

|code|说明|
|---|---|
|200|成功|
|400|请求参数错误|
|401|未授权|
|403|无权限|
|500|服务器内部错误|

---

## 接口5: 获取策略当天建议买卖操作

> 根据策略代码和当前信号，获取策略在指定日期建议的买入/卖出操作列表。
> 
> 

### 基本信息

|字段|值|
|---|---|
|**URL**|`/api/strategy/today/signal`|
|**方法**|`POST`|
|**标签**|量化策略管理API|
|**描述**|获取策略当天建议买卖操作|

### 请求参数

#### Body \(application/json\)

**StrategyTodaySignalReq**

|参数名|类型|必填|说明|
|---|---|---|---|
|strategy\_id|String|是|策略ID|
|user\_id|String|否|用户ID（可选，用于个性化配置）|
|binding\_id|String|否|绑定关系ID（可选，用于确定当前持仓参照）|
|query\_date|String|否|查询日期，格式 yyyyMMdd，不传默认当天|

### 请求示例



```JSON
{
  "strategy_id": "strategy_001",
  "user_id": "user_001",
  "query_date": "20260318"
}
```

### 响应参数

|参数名|类型|说明|
|---|---|---|
|status\_code|Integer|状态码，0 表示成功|
|status\_msg|String|返回消息|
|response|StrategyTodaySignalVO|当天建议买卖操作结果|

#### StrategyTodaySignalVO

|参数名|类型|说明|
|---|---|---|
|strategy\_id|String|策略ID|
|strategy\_name|String|策略名称|
|query\_date|String|查询日期|
|action|String|建议操作类型: buy / sell / hold（持有）/ no\_data（无数据）|
|action\_type|String|操作方向: open（开仓）/ close（平仓）/ rebalance（调仓）/ hold（持有）|
|buy\_list|Array\&lt;TradeSuggestion\&gt;|建议买入的标的列表|
|sell\_list|Array\&lt;TradeSuggestion\&gt;|建议卖出的标的列表|
|signal\_source|String|信号来源描述|
|signal\_time|String|信号触发时间|
|reason|String|说明/备注|
|status|String|获取信号状态: SUCCESS / FAIL|
|error\_msg|String|失败原因|

#### TradeSuggestion

|参数名|类型|说明|
|---|---|---|
|symbol|String|标的代码|
|name|String|标的名称|
|price|String|建议价格|
|quantity|String|建议数量|
|amount|String|建议金额|
|confidence|Integer|信心度/评分（0\-100）|
|reason|String|操作原因|

### 响应示例



```JSON
{
  "status_code": 0,
  "status_msg": "success",
  "response": {
    "strategy_id": "strategy_001",
    "strategy_name": "趋势跟踪策略",
    "query_date": "20260318",
    "action": "buy",
    "action_type": "open",
    "buy_list": [
      {
        "symbol": "AAPL.O",
        "name": "Apple Inc.",
        "price": "175.50",
        "quantity": "100",
        "amount": "17550.00",
        "confidence": 85,
        "reason": "MACD金叉买入信号触发"
      }
    ],
    "sell_list": [],
    "signal_source": "AISC引擎",
    "signal_time": "2026-03-18 09:30:00",
    "reason": "MACD diff上穿dea，产生买入信号",
    "status": "SUCCESS",
    "error_msg": null
  }
}
```



