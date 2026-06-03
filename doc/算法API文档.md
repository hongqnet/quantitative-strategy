# API文档

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
GET /api/strategy/deployed/list?user_id=user_001
```

### 响应参数

|参数名|类型|说明|
|---|---|---|
|status\_code|String|状态码，0 表示成功|
|status\_msg|String|返回消息|
|response|Array\<DeployedStrategyVO\>|已部署策略列表|

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
|tags|Array\<String\>|策略标签|

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
|strategy\_ids|Array\<String\>|是|策略ID列表（单个策略传一个元素）|
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
|status\_code|String|状态码，0 表示成功|
|status\_msg|String|返回消息|
|response|Array\<StrategyReturnVO\>|策略收益结果列表|

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
|nav\_curve|Array\<Object\>|收益曲线数据 \[\{date, nav\}\]|
|spy\_diff\_curve|Array\<Object\>|与SPY的差值序列 \[\{date, diff\}\]|
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



