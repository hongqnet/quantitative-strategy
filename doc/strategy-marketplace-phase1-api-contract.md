# 策略广场一期 API 协议文档

版本：v0.3  
日期：2026-05-27  
状态：草案，待评审  
关联技术文档：`strategy-marketplace-phase1-technical-architecture.md`

## 1. 通用约定

### 1.1 调用边界

| 调用场景 | 前端调用服务 | 说明 |
| --- | --- | --- |
| Marketplace 普通列表、详情、榜单 | 策略广场后端 | 策略展示、筛选、排序、详情、收藏状态 |
| For You 个性化推荐 | 策略广场后端 | 前端不直接调用推荐服务，策略广场后端调用推荐后补齐展示字段 |
| Activity | 策略广场后端 | 加入/移出 Activity、观察收益、策略信号、部署标记聚合 |
| Push 消息列表、未读数、已读 | 策略广场后端 | 历史消息、未读数、已读操作 |
| Push 实时通知 | Push 服务 WebSocket | Toast 和实时消息通知，前端直接连接 Push 服务 |
| Deployed | 交易后端 | 真实账户、真实部署、真实收益、持仓、交易明细；不经过策略广场后端 |
| 策略展示信息管理 | 策略广场后端管理接口 | 一期先支持 Excel 导入初始化和更新 |

### 1.2 统一响应

策略广场后端对外提供的业务接口统一响应结构，包含前端接口和策略广场后端提供给依赖方调用的内部接口：

```json
{
  "data": {},
  "status_code": 0,
  "status_msg": "success"
}
```

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `data` | object | 响应数据 |
| `status_code` | int | 业务状态码，`0` 表示成功 |
| `status_msg` | string | 状态说明，失败时返回可读错误文案 |

说明：

1. 前端不需要传用户 ID，业务服务从网关注入的 `Product-Power` Header 解析当前用户。
2. 排查类链路标识由网关、日志框架或 APM 自动生成，不作为业务请求参数或响应字段定义。
3. 下文各接口“返回参数”默认描述 `data` 内部字段，不再重复包裹 `status_code` 和 `status_msg`。
4. 依赖方接口如果已有统一响应结构，可保留各自规范；本文仅给出业务字段建议。

### 1.3 字段命名与类型约定

| 类型 | 约定 |
| --- | --- |
| 字段命名 | 前端接口统一使用 `camelCase`；Excel 模板和数据库字段使用 `snake_case` |
| ID | 前端统一按 string 处理 |
| 时间 | 服务端统一返回 13 位毫秒级时间戳，业务口径按纽约时区/美东交易日处理；不返回 ISO 时间字符串 |
| 日期 | 用户输入型日期可使用 `yyyy-MM-dd`，例如手动回测的开始日期和结束日期 |
| 百分比 | 使用百分比数值，例如 `12.34` 表示 `12.34%` |
| 金额 | 策略广场后端原则上不返回真实账户金额；交易后端如返回金额，建议用 string 小数 |
| 曲线点 | `[{ "timestamp": 1779883200000, "value": 1.0234 }]`，`timestamp` 为 13 位毫秒时间戳，`value` 为净值归一化值 |

### 1.4 用户信息 Header 约定

1. 策略广场业务服务不设计鉴权参数，鉴权和登录态拦截由网关层处理。
2. 网关在请求 Header 中透传 `Product-Power`，Header 值为 Base64 字符串，服务端解码后获取 `userid` 和用户商品权限位。
3. 管理接口、内部接口和服务间调用如需权限控制，也优先由网关或服务治理层处理；业务接口文档不额外定义鉴权字段。
4. Push WebSocket 连接方式和用户态识别方式由 Push 服务提供方李铎补充，前端按 Push 服务最终协议连接。

`Product-Power` 解码后示例：

```json
{
  "userid": "1800275408",
  "data": {
    "10013_1": [
      {
        "starttime": "1684893389",
        "endtime": "1716602189",
        "level": "10"
      }
    ]
  }
}
```

字段说明：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `userid` | string | 当前用户 ID，业务服务以此作为用户态接口的用户标识 |
| `data` | object | 用户拥有的商品权限位集合 |
| `10013_1` | array | 商品权限位示例；后续如策略收费，可根据该权限位判断可见、可用或可部署范围 |
| `starttime` | string | 权限开始时间，沿用网关载荷格式 |
| `endtime` | string | 权限结束时间，沿用网关载荷格式 |
| `level` | string | 权限等级 |

## 2. DTO 定义

### 2.1 StrategyCardDTO

用于 Marketplace 列表、榜单、For You 推荐、策略详情基础区。

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `strategyId` | string | 策略 ID，必须与算法侧策略 ID 一致 |
| `name` | string | 策略完整名称 |
| `shortName` | string | 策略短名称，可空 |
| `symbol` | string | 主展示标的，例如 `QQQ` |
| `market` | string | 市场，例如 `US`、`HK`、`CN` |
| `universe` | object | 标的池信息 |
| `author` | object | 作者展示信息 |
| `summary` | string | 策略卡片简介 |
| `description` | string | 策略详情说明，详情页返回 |
| `strategyType` | string | 策略类型，例如 `ETF`、`Equity`、`Crypto` |
| `tags` | string[] | 展示标签 |
| `engine` | object | 策略引擎展示信息 |
| `parameterSummary` | object[] | 参数摘要，详情页返回 |
| `riskLevel` | string | 风险等级：`low`、`medium`、`high` |
| `suitableUsers` | string | 适用用户说明 |
| `riskDisclaimer` | string | 风险提示或免责声明 |
| `badges` | object | Top/New 标签 |
| `status` | string | 策略状态，见下方枚举 |
| `statusReason` | string | 状态说明，例如下架原因，可空 |
| `publishedAt` | long | 发布时间，13 位毫秒时间戳 |
| `metrics` | object | 当前窗口指标 |
| `curve` | array | 当前窗口收益曲线 |
| `isInActivity` | boolean | 当前用户是否已加入 Activity |
| `recommendReason` | string | 推荐原因，仅 For You 场景可有 |

`status` 枚举：

| 值 | Marketplace 展示 | For You 候选 | 允许部署入口 | 说明 |
| --- | --- | --- | --- | --- |
| `listed` | 是 | 否 | 否 | 仅普通展示 |
| `recommendable` | 是 | 是 | 否 | 可展示、可推荐 |
| `deployable` | 是 | 是 | 是 | 可展示、可推荐、可部署 |
| `offline` | 新用户列表不展示 | 否 | 否 | 已下架；已收藏/已部署用户仍展示灰色标记 |
| `disabled` | 否 | 否 | 否 | 内部禁用 |

`metrics` 字段：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `window` | string | 指标窗口：`1M`、`3M`、`6M`、`1Y`、`ALL` |
| `returnPct` | number | 区间收益率 |
| `sharpe` | number | 夏普 |
| `maxDrawdownPct` | number | 最大回撤 |
| `cagrPct` | number | 年化收益率 |
| `winRatePct` | number | 胜率 |
| `tradeCount` | int | 交易次数 |
| `followers` | int | 收藏人数 |
| `snapshotAt` | long | 指标快照时间，13 位毫秒时间戳 |

`badges` 字段：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `top` | boolean | 是否 Top |
| `new` | boolean | 是否 New |
| `offline` | boolean | 是否显示“已下架”标记 |

示例：

```json
{
  "strategyId": "str_qqq_momo_001",
  "name": "QQQ Momentum Rotation",
  "shortName": "QQQ Momentum",
  "symbol": "QQQ",
  "market": "US",
  "universe": {
    "kind": "single",
    "label": "Nasdaq 100 ETF",
    "detail": "QQQ"
  },
  "author": {
    "name": "Quant Lab",
    "org": "Ainvest",
    "avatarColor": "#3454D1"
  },
  "summary": "Trend-following strategy for QQQ.",
  "strategyType": "ETF",
  "tags": ["Momentum", "ETF"],
  "engine": {
    "code": "momentum_engine",
    "name": "Momentum Engine"
  },
  "riskLevel": "medium",
  "badges": {
    "top": true,
    "new": false,
    "offline": false
  },
  "status": "deployable",
  "statusReason": "",
  "publishedAt": 1779271200000,
  "metrics": {
    "window": "1Y",
    "returnPct": 38.42,
    "sharpe": 1.82,
    "maxDrawdownPct": -8.31,
    "cagrPct": 26.7,
    "winRatePct": 58.2,
    "tradeCount": 42,
    "followers": 1280,
    "snapshotAt": 1779873600000
  },
  "curve": [
    { "timestamp": 1779271200000, "value": 1.0 },
    { "timestamp": 1779357600000, "value": 1.01 }
  ],
  "isInActivity": false,
  "recommendReason": "Matches your ETF preference"
}
```

### 2.2 ActivityStrategyDTO

用于 Activity 列表和 Activity 入口卡片。Activity 只展示观察收益，不展示真实账户数据。

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `strategyId` | string | 策略 ID |
| `name` | string | 策略名称 |
| `shortName` | string | 策略短名称 |
| `symbol` | string | 主展示标的 |
| `market` | string | 市场 |
| `tags` | string[] | 标签 |
| `engine` | object | 引擎信息 |
| `strategyStatus` | string | 策略展示状态，支持 `offline` 标记 |
| `statusReason` | string | 状态说明，可空 |
| `addedAt` | long | 加入 Activity 时间，13 位毫秒时间戳 |
| `observationStartAt` | long | 本轮观察开始时间，13 位毫秒时间戳 |
| `calculationEndAt` | long | 本次区间收益计算截止时间，13 位毫秒时间戳 |
| `runDays` | int | 观察天数 |
| `metrics` | object | 策略侧返回的观察收益指标 |
| `curve` | array | 策略侧返回的观察收益曲线 |
| `lastSignal` | object | 最新策略信号 |
| `nextRunAt` | long | 下次运行时间，13 位毫秒时间戳 |
| `healthStatus` | string | 健康状态：`healthy`、`warning`、`stale`、`error` |
| `unreadPushCount` | int | 当前策略未读消息数 |
| `deployment` | object | 后端聚合的部署标记 |

`metrics` 字段：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `calculationStatus` | string | `success`、`failed` |
| `intervalReturnPct` | number | 从观察开始时间到计算截止时间的区间收益率 |
| `todayReturnPct` | number | 最新交易日收益率 |
| `sharpe` | number | 观察区间夏普 |
| `maxDrawdownPct` | number | 观察区间最大回撤 |
| `winRatePct` | number | 观察区间胜率 |
| `tradeCount` | int | 观察区间交易次数 |
| `errorCode` | string | 计算失败错误码，可空 |
| `errorMsg` | string | 计算失败原因，可空 |

`deployment` 字段：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `deployed` | boolean | 当前用户是否已部署该策略 |
| `deploymentId` | string | 部署实例 ID，未部署为空 |
| `status` | string | 部署状态，例如 `running`、`stopping`、`stopped`、`failed`；未部署为空 |
| `entryType` | string | 前端入口类型：`deploy`、`deployedDetail` |
| `updatedAt` | long | 部署状态更新时间，13 位毫秒时间戳 |

Activity 禁止返回字段：

| 字段 | 原因 |
| --- | --- |
| `accountId` | 真实账户字段归 Deployed |
| `brokerAccount` | 真实账户字段归 Deployed |
| `capital` | 真实账户收益归 Deployed |
| `cash` | 真实账户字段归 Deployed |
| `realizedPnl` | 真实账户收益归 Deployed |
| `unrealizedPnl` | 真实账户收益归 Deployed |
| `positions` | 真实持仓归 Deployed |
| `orders` | 真实订单归 Deployed |
| `trades` | 真实交易归 Deployed |

### 2.3 PushMessageDTO

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `messageId` | string | 消息 ID |
| `strategyId` | string | 策略 ID |
| `strategyName` | string | 策略名称 |
| `eventType` | string | 事件类型，例如 `signal`、`rebalance`、`riskAlert`、`milestone`、`engineError` |
| `severity` | string | 严重级别：`info`、`warning`、`critical` |
| `title` | string | 标题 |
| `body` | string | 内容 |
| `cta` | object | 前端行动按钮 |
| `toast` | boolean | 是否需要 Toast |
| `read` | boolean | 是否已读 |
| `createdAt` | long | 创建时间，13 位毫秒时间戳 |
| `expiresAt` | long | 过期时间，13 位毫秒时间戳，可空 |

`cta` 字段：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `type` | string | `strategyDetail`、`activityDetail`、`deployedDetail`、`externalUrl` |
| `label` | string | 按钮文案 |
| `params` | object | 跳转参数，例如 `strategyId`、`deploymentId`、`url` |

### 2.4 ManualBacktestResultDTO

策略详情页手动回测结果实时返回，不落库。

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `status` | string | `success`、`failed` |
| `strategyId` | string | 策略 ID |
| `startTime` | long | 回测开始时间，13 位毫秒时间戳 |
| `endTime` | long | 回测结束时间，13 位毫秒时间戳 |
| `metrics` | object | 回测指标 |
| `curve` | array | 回测曲线 |
| `trades` | array | 回测交易列表 |
| `elapsedMs` | int | 算法侧计算耗时 |
| `errorCode` | string | 失败错误码，可空 |
| `errorMsg` | string | 失败原因，可空 |

`metrics` 字段：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `returnPct` | number | 区间收益率 |
| `annualReturnPct` | number | 年化收益率 |
| `sharpe` | number | 夏普 |
| `maxDrawdownPct` | number | 最大回撤 |
| `winRatePct` | number | 胜率 |
| `tradeCount` | int | 交易次数 |

## 3. 策略广场后端提供给前端的接口

### 3.1 查询策略列表

请求路径：`GET /api/strategy-marketplace/strategies`

请求参数：

| 参数 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `market` | string | 否 | 市场过滤，例如 `US` |
| `tag` | string | 否 | 策略标签过滤 |
| `strategyType` | string | 否 | 策略类型过滤，例如 `ETF` |
| `engine` | string | 否 | 引擎编码过滤 |
| `rail` | string | 否 | `all`、`top`、`new`，默认 `all` |
| `sort` | string | 否 | `returnPct`、`sharpe`、`maxDrawdown`、`publishedAt`、`followers`、`displayOrder` |
| `window` | string | 否 | `1M`、`3M`、`6M`、`1Y`、`ALL`，默认 `1Y` |
| `page` | int | 否 | 页码，默认 1 |
| `pageSize` | int | 否 | 每页数量，默认 20 |

说明：本期不提供热度标签筛选参数，也不由推荐服务参与普通列表排序。

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `items` | StrategyCardDTO[] | 策略卡片列表 |
| `page` | int | 当前页 |
| `pageSize` | int | 每页数量 |
| `total` | int | 总数 |

### 3.2 查询 For You 推荐策略

请求路径：`GET /api/strategy-marketplace/recommendations/for-you`

请求参数：

| 参数 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `limit` | int | 否 | 返回数量，默认 3 |
| `window` | string | 否 | 指标窗口，默认 `1Y` |

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `items` | StrategyCardDTO[] | 推荐策略列表 |
| `fallbackUsed` | boolean | 是否使用后端兜底策略池 |

说明：

1. 该接口是一期唯一调用推荐服务的前端场景。
2. 推荐服务只返回策略 ID 和可选推荐原因，展示字段以策略广场后端数据库为准。
3. 推荐同步和推荐请求只打印应用日志，不新增数据库记录。

### 3.3 查询排行榜

请求路径：`GET /api/strategy-marketplace/leaderboard`

请求参数：

| 参数 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `metric` | string | 否 | `returnPct`、`sharpe`、`maxDrawdown`、`followers` |
| `window` | string | 否 | 指标窗口，默认 `1Y` |
| `limit` | int | 否 | 返回数量，默认 10 |

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `items` | StrategyCardDTO[] | 排行策略 |

说明：排行榜由策略广场后端根据本地指标快照排序，不调用推荐服务。

### 3.4 查询策略详情

请求路径：`GET /api/strategy-marketplace/strategies/{strategyId}`

路径参数：

| 参数 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `strategyId` | string | 是 | 策略 ID |

请求参数：

| 参数 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `window` | string | 否 | 指标窗口，默认 `1Y` |

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `strategy` | StrategyCardDTO | 策略基础信息和指标 |
| `holdings` | array | 策略预览持仓快照，由算法侧同步；非真实账户持仓 |
| `recentTrades` | array | 策略预览交易快照，由算法侧同步；非真实账户交易 |
| `activity` | object | 当前用户 Activity 状态 |

`activity` 字段：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `isInActivity` | boolean | 是否已加入 Activity |
| `addedAt` | long | 加入时间，13 位毫秒时间戳，可空 |
| `canManualBacktest` | boolean | 是否允许在详情页手动回测 |
| `canDeploy` | boolean | 是否显示部署入口 |

### 3.5 策略详情手动回测

请求路径：`POST /api/strategy-marketplace/strategies/{strategyId}/manual-backtest`

路径参数：

| 参数 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `strategyId` | string | 是 | 策略 ID |

请求体：

| 字段 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `startDate` | string | 是 | 回测开始日期，`yyyy-MM-dd` |
| `endDate` | string | 是 | 回测结束日期，`yyyy-MM-dd` |
| `initialCapital` | string | 否 | 初始资金，如算法侧需要；不传则算法使用默认值 |
| `includeTrades` | boolean | 否 | 是否返回交易列表，默认 true |

返回参数：`ManualBacktestResultDTO`

处理规则：

1. 仅允许已加入 Activity 的策略发起手动回测。
2. 策略广场后端只做登录态、策略状态、日期范围校验。
3. 回测结果由算法策略执行引擎实时返回，策略广场后端不落库、不兜底计算。

### 3.6 加入 Activity

请求路径：`POST /api/strategy-marketplace/activity`

请求体：

| 字段 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `strategyId` | string | 是 | 策略 ID |
| `source` | string | 否 | 来源：`marketplace`、`recommendation`、`detail` |

返回参数：`ActivityStrategyDTO`

处理规则：

1. 如果用户从未加入过该策略，创建 Activity 记录，`observationStartAt = 当前时间`。
2. 如果用户此前移出后再次加入，重新启用记录，观察收益从本次加入时间重新开始。
3. 加入 Activity 后默认创建策略消息订阅。

### 3.7 移出 Activity

请求路径：`DELETE /api/strategy-marketplace/activity/{strategyId}`

路径参数：

| 参数 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `strategyId` | string | 是 | 策略 ID |

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `removed` | boolean | 是否移出成功 |

处理规则：

1. 用户在 Activity 页面点击关闭后，策略从 Activity 列表移出。
2. 如果策略从 Deployed 执行 Stop & Close，交易链路完成后策略自动降回 Activity 观察态；只有用户在 Activity 手动移出才彻底不展示。
3. 已下架策略如果已在 Activity 中，仍允许展示历史观察数据并显示灰色“已下架”标记。

### 3.8 查询 Activity 列表

请求路径：`GET /api/strategy-marketplace/activity`

请求参数：

| 参数 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `sort` | string | 否 | `addedAt`、`intervalReturnPct`、`todayReturnPct`、`unreadPushCount` |
| `calculationEndAt` | long | 否 | 观察收益计算截止时间，13 位毫秒时间戳，不传默认当前时间 |
| `page` | int | 否 | 页码，默认 1 |
| `pageSize` | int | 否 | 每页数量，默认 20 |

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `summary` | object | Activity 汇总 |
| `items` | ActivityStrategyDTO[] | Activity 策略列表 |
| `page` | int | 当前页 |
| `pageSize` | int | 每页数量 |
| `total` | int | 总数 |

`summary` 字段：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `activeCount` | int | 当前 Activity 策略数量 |
| `deployedCount` | int | 当前 Activity 中已部署策略数量 |
| `unreadPushCount` | int | 未读消息数 |
| `lastCalculatedAt` | long | 最近一次观察收益计算时间，13 位毫秒时间戳 |

处理规则：

1. 后端根据用户 Activity 记录组装 `strategyId + observationStartAt + calculationEndAt`。
2. 后端调用算法侧 `BatchCalculateObservationReturn` 获取观察收益，不做本地收益兜底。
3. 后端调用策略引擎侧 `QueryUserDeployedStrategies` 获取当前用户部署标记，再统一返回给前端。
4. Activity 不返回真实账户、真实持仓、真实交易字段。

### 3.9 查询 Push 消息列表

请求路径：`GET /api/strategy-marketplace/push/messages`

请求参数：

| 参数 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `strategyId` | string | 否 | 按策略过滤 |
| `read` | boolean | 否 | 是否已读 |
| `eventType` | string | 否 | 事件类型过滤 |
| `severity` | string | 否 | 严重级别过滤 |
| `page` | int | 否 | 页码，默认 1 |
| `pageSize` | int | 否 | 每页数量，默认 20 |

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `items` | PushMessageDTO[] | 消息列表 |
| `unreadCount` | int | 当前过滤条件下未读数 |
| `page` | int | 当前页 |
| `pageSize` | int | 每页数量 |
| `total` | int | 总数 |

### 3.10 标记 Push 消息已读

请求路径：`POST /api/strategy-marketplace/push/messages/read`

请求体：

| 字段 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `messageIds` | string[] | 否 | 要标记已读的消息 ID 列表 |
| `readAll` | boolean | 否 | 是否全部标记已读 |
| `strategyId` | string | 否 | `readAll = true` 时可按策略全部已读 |

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `updatedCount` | int | 更新数量 |
| `unreadCount` | int | 更新后的未读数 |

### 3.11 查询 Push 未读数

请求路径：`GET /api/strategy-marketplace/push/messages/unread-count`

请求参数：

| 参数 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `strategyId` | string | 否 | 按策略查询未读数 |

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `unreadCount` | int | 未读消息数 |

## 4. 策略展示信息管理接口

### 4.1 下载 Excel 模板

请求路径：`GET /api/strategy-marketplace/admin/strategies/import-template`

返回：Excel 文件。

### 4.2 上传 Excel 导入策略展示信息

请求路径：`POST /api/strategy-marketplace/admin/strategies/import`

Content-Type：`multipart/form-data`

请求参数：

| 参数 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `file` | file | 是 | Excel 文件 |
| `mode` | string | 否 | `upsert`、`validateOnly`，默认 `upsert` |

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `jobId` | string | 导入任务 ID |
| `status` | string | `pending`、`validating`、`importing`、`success`、`partialFailed`、`failed` |
| `successCount` | int | 成功行数 |
| `failCount` | int | 失败行数 |
| `errorFileUrl` | string | 错误明细文件下载地址，可空 |

### 4.3 查询导入任务

请求路径：`GET /api/strategy-marketplace/admin/strategies/import-jobs/{jobId}`

路径参数：

| 参数 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `jobId` | string | 是 | 导入任务 ID |

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `jobId` | string | 导入任务 ID |
| `fileName` | string | 文件名 |
| `status` | string | 任务状态 |
| `successCount` | int | 成功行数 |
| `failCount` | int | 失败行数 |
| `errors` | array | 行级错误摘要 |
| `errorFileUrl` | string | 错误明细文件下载地址，可空 |
| `createdAt` | long | 创建时间，13 位毫秒时间戳 |
| `finishedAt` | long | 完成时间，13 位毫秒时间戳，可空 |

### 4.4 Excel 模板字段

| Excel 字段 | 必填 | 数据库存储字段 | 前端用途 |
| --- | --- | --- | --- |
| `strategy_id` | 是 | `strategy_display.strategy_id` | 策略主标识 |
| `name` | 是 | `strategy_display.name` | 卡片、详情、Activity 展示 |
| `short_name` | 否 | `strategy_display.short_name` | 卡片空间不足时展示 |
| `symbol` | 是 | `strategy_display.symbol` | 主展示标的 |
| `market` | 是 | `strategy_display.market` | 市场筛选和展示 |
| `universe_type` | 否 | `strategy_display.universe_type` | 标的池类型：`single`、`basket`、`sector` |
| `universe_label` | 否 | `strategy_display.universe_label` | 标的池展示名 |
| `universe_detail` | 否 | `strategy_display.universe_detail` | 详情页标的池说明 |
| `author_name` | 否 | `strategy_display.author_name` | 作者展示名 |
| `author_org` | 否 | `strategy_display.author_org` | 作者组织或来源 |
| `author_avatar_color` | 否 | `strategy_display.author_avatar_color` | 前端头像色或作者标识色 |
| `summary` | 是 | `strategy_display.summary` | 卡片简介 |
| `description` | 否 | `strategy_display.description` | 详情页完整说明 |
| `strategy_type` | 否 | `strategy_display.strategy_type` | 策略类型筛选 |
| `tags` | 否 | `strategy_display.tags_json` | 展示标签，逗号分隔导入 |
| `engine_code` | 是 | `strategy_display.engine_code` | 策略引擎编码 |
| `engine_name` | 否 | `strategy_display.engine_name` | 策略引擎展示名 |
| `parameter_summary` | 否 | `strategy_display.parameter_summary_json` | 参数摘要，JSON 或约定格式 |
| `risk_level` | 否 | `strategy_display.risk_level` | 风险等级 |
| `suitable_users` | 否 | `strategy_display.suitable_users` | 适用用户说明 |
| `risk_disclaimer` | 否 | `strategy_display.risk_disclaimer` | 风险提示或免责声明 |
| `status` | 是 | `strategy_display.status` | 展示、推荐、部署、下架状态控制 |
| `status_reason` | 否 | `strategy_display.status_reason` | 状态说明 |
| `top_flag` | 否 | `strategy_display.top_flag` | Top 标签 |
| `new_flag` | 否 | `strategy_display.new_flag` | New 标签 |
| `display_order` | 否 | `strategy_display.display_order` | 同等排序条件下的展示顺序 |
| `publish_at` | 否 | `strategy_display.publish_at` | 发布时间，13 位毫秒时间戳；同步推荐时映射为 `createTime` |
| `recommend_effect_time` | 条件必填 | `strategy_display.recommend_effect_time` | 推荐物品有效截止时间，13 位毫秒时间戳；`status` 为 `recommendable` 或 `deployable` 时必填，同步推荐时映射为 `effectTime` |

Excel 不维护以下数据：

| 数据类型 | 来源 |
| --- | --- |
| 策略收益、Sharpe、最大回撤、收益曲线 | 算法侧 `SyncStrategyMetricSnapshot` |
| Activity 观察收益 | 算法侧 `BatchCalculateObservationReturn` |
| 手动回测结果 | 算法侧 `RunManualBacktest` 实时返回，不落库 |
| 用户是否已收藏、收藏开始时间 | 策略广场用户行为表 |
| 收藏人数 | 策略广场后端聚合 |
| For You 推荐排序 | 推荐服务 `GetUserRecommendedStrategies` |
| 真实账户、持仓、订单、成交、账户收益 | 交易后端 |

## 5. 策略广场后端提供给依赖方的内部接口

### 5.1 接收策略信号事件：PushStrategySignalEvent

提供方：策略广场后端  
调用方：策略执行侧，负责人杨文园/丁宇杰  
请求路径：`POST /internal/strategy-marketplace/signals`

请求体：

| 字段 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `eventId` | string | 是 | 策略侧事件 ID，用于幂等 |
| `signalId` | string | 否 | 策略信号 ID，如与 `eventId` 不同可传 |
| `sourceSystem` | string | 是 | 来源系统，例如 `strategy-engine`、`strategy-executor` |
| `strategyId` | string | 是 | 策略 ID |
| `deploymentId` | string | 否 | 部署实例 ID，涉及已部署策略时传 |
| `userId` | string | 否 | 单用户事件时传；策略广播事件可空 |
| `eventType` | string | 是 | `signal`、`rebalance`、`riskAlert`、`milestone`、`engineError` |
| `severity` | string | 是 | `info`、`warning`、`critical` |
| `title` | string | 是 | 消息标题建议 |
| `body` | string | 是 | 消息正文建议 |
| `occurredAt` | long | 是 | 事件发生时间，13 位毫秒时间戳 |
| `dedupKey` | string | 否 | 兜底幂等键 |
| `cta` | object | 否 | 建议跳转动作 |
| `payload` | object | 否 | 事件扩展字段 |

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `accepted` | boolean | 是否接收 |
| `duplicate` | boolean | 是否重复事件 |
| `messageCount` | int | 本次生成的用户消息数 |
| `ignoredReason` | string | 未生成消息原因，可空 |

处理规则：

1. 后端根据 `eventId` 或 `dedupKey` 幂等。
2. 后端根据订阅关系、事件类型和严重程度生成用户消息并调用 Push 服务。
3. 事件类型、Toast 规则和频控规则仍需策略侧、后端、Push 服务联调确认。

### 5.2 接收策略指标快照：SyncStrategyMetricSnapshot

提供方：策略广场后端  
调用方：算法策略执行引擎，负责人丁宇杰  
请求路径：`POST /internal/strategy-marketplace/metrics/snapshots`

请求体：

| 字段 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `batchNo` | string | 是 | 指标同步批次号 |
| `items` | array | 是 | 指标快照列表 |

`items` 字段：

| 字段 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `strategyId` | string | 是 | 策略 ID |
| `windowCode` | string | 是 | `1M`、`3M`、`6M`、`1Y`、`ALL` |
| `metricSource` | string | 是 | `backtest`、`simulation`、`liveShadow` |
| `returnPct` | number | 是 | 区间收益率 |
| `sharpe` | number | 否 | 夏普 |
| `maxDrawdownPct` | number | 否 | 最大回撤 |
| `cagrPct` | number | 否 | 年化收益率 |
| `winRatePct` | number | 否 | 胜率 |
| `tradeCount` | int | 否 | 交易次数 |
| `curve` | array | 否 | 曲线点 |
| `snapshotAt` | long | 是 | 指标快照时间，13 位毫秒时间戳 |

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `accepted` | boolean | 是否接收 |
| `batchNo` | string | 批次号 |
| `successCount` | int | 成功条数 |
| `failCount` | int | 失败条数 |
| `errors` | array | 行级错误 |

### 5.3 接收策略预览持仓和交易快照：SyncStrategyPreviewSnapshot

提供方：策略广场后端  
调用方：算法策略执行引擎，负责人丁宇杰  
请求路径：`POST /internal/strategy-marketplace/preview/snapshots`

请求体：

| 字段 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `batchNo` | string | 是 | 同步批次号 |
| `strategyId` | string | 是 | 策略 ID |
| `snapshotAt` | long | 是 | 快照时间，13 位毫秒时间戳 |
| `holdings` | array | 否 | 策略预览持仓，非真实账户持仓 |
| `recentTrades` | array | 否 | 策略预览交易，非真实账户交易 |

`holdings` 字段：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `symbol` | string | 标的代码 |
| `name` | string | 标的名称 |
| `market` | string | 市场 |
| `weightPct` | number | 权重 |

`recentTrades` 字段：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `tradeTime` | long | 交易时间，13 位毫秒时间戳 |
| `side` | string | `buy`、`sell` |
| `symbol` | string | 标的代码 |
| `quantity` | string | 数量 |
| `price` | string | 价格 |
| `reason` | string | 策略交易原因摘要 |

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `accepted` | boolean | 是否接收 |
| `batchNo` | string | 批次号 |
| `successCount` | int | 成功条数 |
| `failCount` | int | 失败条数 |
| `errors` | array | 行级错误 |

## 6. 依赖方待提供接口草案

本节是策略广场后端、前端与外部依赖方联调的建议协议。正式路径、网关/服务治理接入方式、限流、错误码以各提供方最终协议为准。

### 6.1 策略引擎服务：杨文园

#### 6.1.1 查询当前用户已部署策略列表：QueryUserDeployedStrategies

建议提供方：策略引擎服务  
调用方：策略广场后端  
建议路径：`POST /internal/strategy-engine/deployments/query`

作用：Activity 列表聚合部署标记，不承载账户收益、持仓、订单和成交。

请求体：

| 字段 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `userId` | string | 是 | 当前用户 ID，由策略广场后端传入 |
| `strategyIds` | string[] | 否 | Activity 当前页策略 ID；为空表示查询该用户全部部署策略 |
| `includeStopped` | boolean | 否 | 是否返回已停止部署，默认 false |

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `items` | array | 用户部署策略列表 |

`items` 字段：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `strategyId` | string | 策略 ID |
| `deploymentId` | string | 部署实例 ID，前端进入 Deployed 详情使用 |
| `deploymentStatus` | string | `running`、`stopping`、`stopped`、`failed` |
| `entryType` | string | `deploy`、`deployedDetail` |
| `updatedAt` | long | 部署状态更新时间，13 位毫秒时间戳 |

#### 6.1.2 查询策略定义状态：QueryStrategyDefinitionStatus

建议提供方：策略引擎服务  
调用方：策略广场后端  
建议路径：`POST /internal/strategy-engine/strategies/status/query`

作用：Excel 导入、策略展示校验、部署入口校验时，确认策略 ID 和策略侧状态是否存在。

请求体：

| 字段 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `strategyIds` | string[] | 是 | 待校验策略 ID 列表 |

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `items` | array | 策略定义状态列表 |

`items` 字段：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `strategyId` | string | 策略 ID |
| `exists` | boolean | 策略侧是否存在 |
| `engineCode` | string | 策略引擎编码 |
| `engineStatus` | string | `ready`、`disabled`、`error` |
| `deployable` | boolean | 策略侧是否允许部署 |
| `reason` | string | 不存在、禁用或不可部署原因 |

#### 6.1.3 策略部署前校验：ValidateStrategyDeployment

建议提供方：策略引擎服务  
调用方：交易后端，必要时策略广场后端也可调用  
建议路径：`POST /internal/strategy-engine/deployments/validate`

作用：真实部署前确认策略当前是否可部署，以及部署需要的参数约束。

请求体：

| 字段 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `userId` | string | 是 | 当前用户 ID |
| `strategyId` | string | 是 | 策略 ID |
| `accountId` | string | 否 | 交易账户 ID，交易侧调用时可传 |
| `tradeMode` | string | 否 | `paper`、`live` |

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `valid` | boolean | 是否允许部署 |
| `strategyId` | string | 策略 ID |
| `engineCode` | string | 引擎编码 |
| `requiredParams` | array | 部署所需参数定义 |
| `riskWarnings` | string[] | 风险提示 |
| `reason` | string | 不允许部署原因，可空 |

### 6.2 算法策略执行引擎：丁宇杰

#### 6.2.1 批量计算 Activity 观察收益：BatchCalculateObservationReturn

建议提供方：算法策略执行引擎  
调用方：策略广场后端  
建议路径：`POST /internal/strategy-executor/observation-returns/batch-calculate`

作用：Activity 根据用户收藏开始时间和当前时间计算观察收益。该接口是观察收益权威来源，策略广场后端不做本地收益计算和失败兜底。

请求体：

| 字段 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `userId` | string | 是 | 当前用户 ID，用于算法侧审计或限流 |
| `items` | array | 是 | 待计算策略列表 |
| `includeCurve` | boolean | 否 | 是否返回曲线，默认 true |
| `includeSignal` | boolean | 否 | 是否返回最新信号，默认 true |

`items` 字段：

| 字段 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `strategyId` | string | 是 | 策略 ID |
| `startTime` | long | 是 | 观察开始时间，13 位毫秒时间戳，来自用户最新加入 Activity 的 `started_at` |
| `endTime` | long | 是 | 计算截止时间，13 位毫秒时间戳，默认策略广场后端请求时的当前时间 |

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `calculatedAt` | long | 算法完成计算时间，13 位毫秒时间戳 |
| `items` | array | 各策略计算结果 |

`items` 字段：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `strategyId` | string | 策略 ID |
| `status` | string | `success`、`failed` |
| `intervalReturnPct` | number | 观察区间收益率 |
| `todayReturnPct` | number | 最新交易日收益率 |
| `sharpe` | number | 观察区间夏普 |
| `maxDrawdownPct` | number | 观察区间最大回撤 |
| `winRatePct` | number | 观察区间胜率 |
| `tradeCount` | int | 观察区间交易次数 |
| `curve` | array | 曲线点，格式 `[{timestamp,value}]`，`timestamp` 为 13 位毫秒时间戳 |
| `lastSignal` | object | 最新策略信号摘要 |
| `nextRunAt` | long | 下次策略运行时间，13 位毫秒时间戳 |
| `healthStatus` | string | `healthy`、`warning`、`stale`、`error` |
| `errorCode` | string | 失败错误码，可空 |
| `errorMsg` | string | 失败原因，可空 |

#### 6.2.2 策略详情手动回测：RunManualBacktest

建议提供方：算法策略执行引擎  
调用方：策略广场后端  
建议路径：`POST /internal/strategy-executor/backtests/manual-run`

作用：策略详情页手动回测。结果实时返回给用户查看，不落库。

请求体：

| 字段 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `userId` | string | 是 | 当前用户 ID，用于算法侧审计或限流 |
| `strategyId` | string | 是 | 策略 ID |
| `startDate` | string | 是 | 用户选择的回测开始日期 |
| `endDate` | string | 是 | 用户选择的回测结束日期 |
| `initialCapital` | string | 否 | 初始资金，如算法侧需要；一期可由算法默认 |
| `includeTrades` | boolean | 否 | 是否返回交易列表，默认 true |

返回参数：`ManualBacktestResultDTO`

### 6.3 推荐服务：毛灵伟、杜庆彪

#### 6.3.1 推送推荐物品池：PushStrategyItemsToRecommendationPool

提供方：推荐服务  
调用方：策略广场后端定时任务  
接口路径：`POST {recommendationHost}/v1/recsys/marktag/push`

作用：策略广场后端每日将可推荐策略推送到推荐侧物品池。同步结果只打印应用日志，不写策略广场数据库。策略广场后端内部字段和推荐侧字段命名不一致时，由策略广场后端在推送前完成字段映射。

请求体：推荐侧物品列表。若推荐服务最终只支持单条推送，策略广场后端按条循环调用。以下字段为列表中每个物品的字段。

| 字段 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `newsType` | string | 是 | 物品类型，固定 `square_strategy` |
| `msgId` | string | 是 | 物品 ID，即策略 ID |
| `msgTitle` | string | 是 | 物品名称，即策略名称 |
| `effectTime` | long | 是 | 物品有效截止时间，13 位毫秒时间戳 |
| `createTime` | long | 是 | 物品生产时间，即策略发布时间，13 位毫秒时间戳 |
| `market` | string | 是 | 市场 |
| `symbol` | string | 是 | 主展示标的 |
| `strategyType` | string | 否 | 策略类型 |
| `tags` | string[] | 否 | 策略标签 |
| `engineCode` | string | 是 | 引擎编码 |
| `status` | string | 是 | 策略状态，建议只同步 `recommendable` 和 `deployable` |
| `riskLevel` | string | 否 | 风险等级 |
| `summary` | string | 否 | 策略简介 |
| `metrics` | object | 否 | 推荐所需指标摘要 |
| `updatedAt` | long | 否 | 策略展示数据更新时间，13 位毫秒时间戳 |

字段映射：

| 策略广场字段 | 推荐侧字段 | 说明 |
| --- | --- | --- |
| 固定值 `square_strategy` | `newsType` | 推荐侧通过该字段识别策略广场策略物品 |
| `strategyId` | `msgId` | 策略 ID |
| `name` | `msgTitle` | 策略名称 |
| `recommendEffectTime` / `recommend_effect_time` | `effectTime` | 推荐有效截止时间 |
| `publishedAt` / `publish_at` | `createTime` | 策略发布时间 |
| 其他策略基础字段 | 同名或按推荐侧约定扩展 | 包括市场、标的、类型、标签、风险等级、指标摘要等 |

`metrics` 字段建议：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `window` | string | 指标窗口 |
| `returnPct` | number | 区间收益率 |
| `sharpe` | number | 夏普 |
| `maxDrawdownPct` | number | 最大回撤 |
| `cagrPct` | number | 年化收益率 |
| `winRatePct` | number | 胜率 |
| `tradeCount` | int | 交易次数 |
| `followers` | int | 收藏人数 |

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `accepted` | boolean | 是否接收 |
| `receivedCount` | int | 接收策略数量 |
| `invalidCount` | int | 无效策略数量 |
| `errors` | array | 无效数据说明 |

#### 6.3.2 获取用户推荐策略 ID：GetUserRecommendedStrategies

建议提供方：推荐服务  
调用方：策略广场后端  
建议路径：`POST /internal/recommendation/strategy-marketplace/users/recommend-strategies`

作用：根据当前用户返回 For You 推荐策略 ID。推荐只负责这一项，不参与普通列表、榜单、Top/New、推送。

请求体：

| 字段 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `userId` | string | 是 | 当前用户 ID |
| `scene` | string | 是 | 固定建议 `strategyMarketplaceForYou` |
| `limit` | int | 否 | 返回数量，默认 3 |
| `excludeStrategyIds` | string[] | 否 | 可排除已无效或前端不想重复展示的策略 |

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `strategyIds` | string[] | 推荐策略 ID，顺序即推荐顺序 |
| `reasons` | array | 推荐原因，可空 |
| `fallbackRequired` | boolean | 推荐侧是否建议业务后端兜底 |

`reasons` 字段：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `strategyId` | string | 策略 ID |
| `reason` | string | 推荐原因文案 |

### 6.4 Push 服务：李铎

#### 6.4.1 创建并投递 Web Push 消息：CreateWebPushMessage

提供方：Push 服务  
调用方：策略广场后端  
当前测试地址：`POST http://ainvest-api.touzime.com/gw/touchspot/v1/touch/spot`

请求 Header：

| Header | 值 |
| --- | --- |
| `callerType` | `PARTNER` |
| `Content-Type` | `application/json` |

请求体：数组，每个元素为一条投递任务。

| 字段 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `id` | string | 是 | 投递任务 ID，建议使用策略广场消息 ID |
| `touchType` | string | 是 | 固定 `WEB_PUSH` |
| `realTime` | boolean | 是 | 是否实时投递，策略消息建议 true |
| `allUserPush` | boolean | 是 | 是否全量用户推送，策略消息固定 false |
| `userIdList` | array | 是 | 用户 ID 列表 |
| `content` | object | 是 | Web Push 内容 |

`content` 字段：

说明：以下为 Push 服务既有接口字段，不是策略广场对前端返回字段。策略广场内部存储和对前端返回统一使用 13 位毫秒时间戳，调用 Push 服务时按 Push 服务接口要求完成时间单位转换。

| 字段 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `contentType` | string | 是 | 固定 `WEB_PUSH` |
| `title` | string | 是 | 标题 |
| `sourceType` | string | 是 | 建议 `PLATFORM` |
| `logo` | string | 否 | Logo URL |
| `url` | string | 否 | 点击跳转 URL |
| `priority` | int | 否 | 优先级 |
| `buttonContent` | string | 否 | 按钮文案 |
| `content` | string | 是 | 内容正文 |
| `endTime` | long | 否 | 展示结束时间，按 Push 服务接口要求传入 |
| `invalidTime` | long | 否 | 失效时间，按 Push 服务接口要求传入 |
| `pushTime` | long | 否 | 推送时间，按 Push 服务接口要求传入 |
| `duration` | int | 否 | Toast 展示时长，秒 |
| `miniIcon` | string | 否 | 小图标 URL |
| `comefrom` | string | 否 | 来源编码 |
| `gmsPushType` | string | 是 | 固定 `WEB_SOCKET` |

建议返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `accepted` | boolean | 是否接收 |
| `successCount` | int | 成功投递任务数 |
| `failCount` | int | 失败投递任务数 |
| `items` | array | 每条任务投递结果 |

`items` 字段：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `id` | string | 投递任务 ID |
| `status` | string | `success`、`failed` |
| `errorCode` | string | 失败错误码，可空 |
| `errorMsg` | string | 失败原因，可空 |

#### 6.4.2 前端 WebSocket 连接：StrategyPushWebSocket

提供方：Push 服务  
调用方：前端  
连接路径：待 Push 服务方提供。

待明确内容：

| 项 | 说明 |
| --- | --- |
| 连接 URL | WebSocket 地址 |
| 用户态识别方式 | Cookie、Token、网关注入 Header 或其他方式 |
| 心跳机制 | Ping/Pong 周期 |
| 断线重连 | 前端重连策略和服务端会话保留时间 |
| ACK 机制 | 前端是否需要回执 |
| 消息格式 | 建议复用 `PushMessageDTO` 或提供映射字段 |

### 6.5 交易后端：丁骏(Jun Ding)

交易后端直接面向前端提供 Deployed 接口。以下为前端联调建议协议，策略广场业务后端不代理这些接口。

#### 6.5.1 查询券商账户列表：QueryBrokerAccounts

建议路径：`GET /api/trading/broker-accounts`

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `items` | array | 账户列表 |

`items` 字段：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `accountId` | string | 账户 ID |
| `broker` | string | 券商 |
| `accountType` | string | `paper`、`live` |
| `displayName` | string | 展示名称 |
| `connectionStatus` | string | `connected`、`disconnected`、`expired` |
| `permissionStatus` | string | 交易权限状态 |
| `currency` | string | 币种 |
| `updatedAt` | long | 更新时间，13 位毫秒时间戳 |

#### 6.5.2 创建策略部署：CreateStrategyDeployment

建议路径：`POST /api/trading/deployments`

请求体：

| 字段 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `strategyId` | string | 是 | 策略 ID |
| `accountId` | string | 是 | 交易账户 ID |
| `tradeMode` | string | 是 | `paper`、`live` |
| `initialCapital` | string | 否 | 初始资金 |
| `riskParams` | object | 否 | 风控参数 |
| `settings` | object | 否 | 部署配置 |

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `deploymentId` | string | 部署实例 ID |
| `strategyId` | string | 策略 ID |
| `status` | string | 部署状态 |
| `createdAt` | long | 创建时间，13 位毫秒时间戳 |

#### 6.5.3 查询部署策略列表：QueryDeployedStrategies

建议路径：`GET /api/trading/deployments`

请求参数：

| 参数 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `status` | string | 否 | 部署状态过滤 |
| `page` | int | 否 | 页码 |
| `pageSize` | int | 否 | 每页数量 |

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `items` | array | 部署列表 |
| `page` | int | 当前页 |
| `pageSize` | int | 每页数量 |
| `total` | int | 总数 |

`items` 字段：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `deploymentId` | string | 部署实例 ID |
| `strategyId` | string | 策略 ID |
| `strategyName` | string | 策略名称 |
| `accountId` | string | 账户 ID |
| `broker` | string | 券商 |
| `tradeMode` | string | `paper`、`live` |
| `status` | string | 部署状态 |
| `returnPct` | number | 部署维度累计收益率 |
| `todayReturnPct` | number | 当日收益率 |
| `marketValue` | string | 当前市值 |
| `startedAt` | long | 开始时间，13 位毫秒时间戳 |
| `updatedAt` | long | 更新时间，13 位毫秒时间戳 |

#### 6.5.4 查询部署持仓：QueryDeploymentPositions

建议路径：`GET /api/trading/deployments/{deploymentId}/positions`

路径参数：

| 参数 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `deploymentId` | string | 是 | 部署实例 ID |

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `items` | array | 持仓列表 |

`items` 字段：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `symbol` | string | 标的代码 |
| `name` | string | 标的名称 |
| `market` | string | 市场 |
| `quantity` | string | 数量 |
| `marketValue` | string | 市值 |
| `weightPct` | number | 权重 |
| `costPrice` | string | 成本价 |
| `lastPrice` | string | 最新价 |
| `unrealizedPnl` | string | 浮动盈亏 |
| `unrealizedPnlPct` | number | 浮动盈亏率 |

#### 6.5.5 查询部署交易明细：QueryDeploymentTrades

建议路径：`GET /api/trading/deployments/{deploymentId}/trades`

请求参数：

| 参数 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `deploymentId` | string | 是 | 部署实例 ID |
| `startTime` | long | 否 | 开始时间，13 位毫秒时间戳 |
| `endTime` | long | 否 | 结束时间，13 位毫秒时间戳 |
| `page` | int | 否 | 页码 |
| `pageSize` | int | 否 | 每页数量 |

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `items` | array | 交易明细 |
| `page` | int | 当前页 |
| `pageSize` | int | 每页数量 |
| `total` | int | 总数 |

`items` 字段：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `tradeId` | string | 交易 ID |
| `orderId` | string | 订单 ID |
| `tradeTime` | long | 成交时间，13 位毫秒时间戳 |
| `side` | string | `buy`、`sell` |
| `symbol` | string | 标的代码 |
| `quantity` | string | 成交数量 |
| `price` | string | 成交价格 |
| `amount` | string | 成交金额 |
| `fee` | string | 手续费 |
| `status` | string | 成交状态 |
| `reason` | string | 策略交易原因摘要 |

#### 6.5.6 停止并平仓部署：StopAndCloseDeployment

建议路径：`POST /api/trading/deployments/{deploymentId}/stop-close`

请求体：

| 字段 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `closePositions` | boolean | 是 | 是否平仓，Stop & Close 场景为 true |
| `reason` | string | 否 | 用户停止原因 |

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `deploymentId` | string | 部署实例 ID |
| `status` | string | 停止后的部署状态 |
| `updatedAt` | long | 更新时间，13 位毫秒时间戳 |

说明：Stop & Close 完成后，交易侧或策略引擎侧需要同步部署状态，策略广场后端在 Activity 中将该策略降回观察态。

## 7. 错误码建议

| 错误码 | 含义 |
| --- | --- |
| `STRATEGY_NOT_FOUND` | 策略不存在 |
| `STRATEGY_OFFLINE` | 策略已下架，但历史入口可展示 |
| `STRATEGY_DISABLED` | 策略已禁用 |
| `ACTIVITY_NOT_JOINED` | 当前用户未加入 Activity |
| `ACTIVITY_ALREADY_JOINED` | 当前用户已加入 Activity |
| `BACKTEST_RANGE_INVALID` | 手动回测日期范围不合法 |
| `OBSERVATION_CALCULATION_FAILED` | 观察收益计算失败 |
| `RECOMMENDATION_UNAVAILABLE` | 推荐服务不可用，业务后端已兜底 |
| `PUSH_DELIVERY_FAILED` | Push 服务投递失败 |
| `IMPORT_FILE_INVALID` | Excel 文件格式不合法 |
| `IMPORT_ROW_INVALID` | Excel 行数据校验失败 |

## 8. 待依赖方补充确认

| 事项 | 提供方 |
| --- | --- |
| `BatchCalculateObservationReturn` 批量上限、超时时间、部分失败格式 | 算法策略执行引擎：丁宇杰 |
| `RunManualBacktest` 最长日期区间、并发限制、每日次数限制 | 算法策略执行引擎：丁宇杰 |
| 策略信号事件类型、严重级别、Toast 和频控规则 | 策略执行侧、后端、Push 服务 |
| Push WebSocket 连接地址、用户态识别、心跳、ACK、断线重连 | Push 服务：李铎 |
| 用户推荐策略查询接口正式路径、返回数量上限、兜底标识字段 | 推荐：毛灵伟、杜庆彪 |
| 交易后端 Deployed 正式路径、状态枚举、权限模型 | 交易后端：丁骏(Jun Ding) |
