# 策略广场一期 API 协议文档

版本：v0.1  
日期：2026-05-26  
状态：草案，待评审  
关联技术文档：`strategy-marketplace-phase1-technical-architecture.md`

## 1. 通用约定

### 1.1 调用边界

| 调用场景 | 前端调用服务 | 说明 |
| --- | --- | --- |
| Marketplace | 策略广场后端 | 策略列表、详情、榜单、For You |
| Activity | 策略广场后端 | 收藏策略、观察收益、部署标记聚合 |
| Push 消息列表和已读 | 策略广场后端 | 历史消息、未读数、已读 |
| Push 实时通知 | Push 服务 WebSocket | Toast 和实时消息通知 |
| Deployed | 交易后端 | 真实账户、真实部署、持仓、交易明细 |

### 1.2 统一响应

```json
{
  "code": 0,
  "message": "success",
  "data": {},
  "traceId": "trace-xxx"
}
```

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `code` | int | 业务状态码，`0` 表示成功 |
| `message` | string | 状态说明 |
| `data` | object | 响应数据 |
| `traceId` | string | 链路追踪 ID |

### 1.3 字段类型约定

| 类型 | 约定 |
| --- | --- |
| ID | 前端统一按 string 处理 |
| 时间 | ISO-8601 字符串，例如 `2026-05-26T10:00:00+08:00` |
| 日期 | `yyyy-MM-dd` |
| 百分比 | 使用百分比数值，例如 `12.34` 表示 `12.34%` |
| 金额 | 策略广场后端原则上不返回真实账户金额；交易后端如返回金额，建议用 string 小数 |
| 曲线 | `[{ "date": "2026-05-26", "value": 1.0234 }]` |

### 1.4 鉴权约定

1. 用户态接口从登录态解析当前用户，前端不传 `userId`。
2. 管理接口需要管理角色权限。
3. 内部接口需要服务鉴权，具体鉴权方式待技术联调确认。
4. Push WebSocket 鉴权方式由 Push 服务提供方待提供。

## 2. DTO 定义

### 2.1 StrategyCardDTO

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `strategyId` | string | 策略 ID |
| `versionId` | string | 策略版本 ID |
| `name` | string | 策略名称 |
| `symbol` | string | 主展示标的 |
| `market` | string | 市场，例如 `US` |
| `universe` | object | 标的池信息 |
| `author` | object | 作者信息 |
| `summary` | string | 策略卡片简介 |
| `tags` | string[] | 策略标签 |
| `engine` | object | 策略引擎信息 |
| `badges` | object | Hot/Top/New 标签 |
| `status` | string | 策略状态：`listed`、`recommendable`、`deployable` 等 |
| `publishedAt` | string | 发布时间 |
| `metrics` | object | 当前窗口指标 |
| `curve` | array | 当前窗口收益曲线 |
| `isInActivity` | boolean | 当前用户是否已加入 Activity |
| `recommendReason` | string | 推荐原因，仅 For You 场景可有 |

示例：

```json
{
  "strategyId": "str_qqq_momo_001",
  "versionId": "v1",
  "name": "QQQ Momentum Rotation",
  "symbol": "QQQ",
  "market": "US",
  "universe": {
    "kind": "single",
    "label": "QQQ",
    "detail": "Nasdaq 100 ETF"
  },
  "author": {
    "name": "Quant Lab",
    "org": "Ainvest",
    "avatarColor": "#3454D1"
  },
  "summary": "Trend-following strategy for QQQ.",
  "tags": ["Momentum", "ETF"],
  "engine": {
    "code": "momentum_engine",
    "name": "Momentum Engine"
  },
  "badges": {
    "hot": true,
    "top": false,
    "new": false
  },
  "status": "deployable",
  "publishedAt": "2026-05-20T10:00:00+08:00",
  "metrics": {
    "window": "1Y",
    "returnPct": 38.42,
    "sharpe": 1.82,
    "maxDrawdownPct": -8.31,
    "cagrPct": 26.7,
    "winRatePct": 58.2,
    "tradeCount": 42,
    "followers": 1280
  },
  "curve": [
    { "date": "2026-05-20", "value": 1.0 },
    { "date": "2026-05-21", "value": 1.01 }
  ],
  "isInActivity": false,
  "recommendReason": "Matches your ETF preference"
}
```

### 2.2 ActivityStrategyDTO

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `strategyId` | string | 策略 ID |
| `versionId` | string | 策略版本 ID |
| `name` | string | 策略名称 |
| `symbol` | string | 主展示标的 |
| `market` | string | 市场 |
| `tags` | string[] | 标签 |
| `engine` | object | 引擎信息 |
| `addedAt` | string | 加入 Activity 时间 |
| `observationStartAt` | string | 本轮观察开始时间 |
| `calculationEndAt` | string | 本次区间收益计算截止时间 |
| `runDays` | int | 观察天数 |
| `metrics` | object | 策略侧返回的观察收益指标 |
| `curve` | array | 策略侧返回的观察收益曲线 |
| `lastSignal` | object | 最新策略信号 |
| `nextRunAt` | string | 下次运行时间 |
| `healthStatus` | string | 健康状态 |
| `unreadPushCount` | int | 当前策略未读消息数 |
| `deployment` | object | 后端聚合的部署标记 |

`deployment` 字段：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `deployed` | boolean | 当前用户是否已部署该策略 |
| `deploymentId` | string | 部署 ID，未部署为空 |
| `status` | string | 部署状态，例如 `running`、`paused`，未部署为空 |
| `entryType` | string | 前端入口类型：`deploy` 或 `deployed_detail` |

禁止在 Activity 返回：

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

示例：

```json
{
  "strategyId": "str_001",
  "versionId": "v1",
  "name": "QQQ Momentum Rotation",
  "symbol": "QQQ",
  "market": "US",
  "tags": ["Momentum", "ETF"],
  "engine": {
    "code": "momentum_engine",
    "name": "Momentum Engine"
  },
  "addedAt": "2026-05-20T10:00:00+08:00",
  "observationStartAt": "2026-05-20T10:00:00+08:00",
  "calculationEndAt": "2026-05-26T10:00:00+08:00",
  "runDays": 6,
  "metrics": {
    "intervalReturnPct": 3.84,
    "todayReturnPct": 0.42,
    "sharpe": 1.41,
    "maxDrawdownPct": -2.12,
    "winRatePct": 55.6,
    "tradeCount": 8
  },
  "curve": [
    { "date": "2026-05-20", "value": 1.0 },
    { "date": "2026-05-26", "value": 1.0384 }
  ],
  "lastSignal": {
    "kind": "rebalance",
    "text": "Increase QQQ exposure",
    "at": "2026-05-26T09:30:00+08:00"
  },
  "nextRunAt": "2026-05-27T09:30:00+08:00",
  "healthStatus": "healthy",
  "unreadPushCount": 1,
  "deployment": {
    "deployed": true,
    "deploymentId": "dep_001",
    "status": "running",
    "entryType": "deployed_detail"
  }
}
```

### 2.3 PushMessageDTO

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `messageId` | string | 消息 ID |
| `strategyId` | string | 策略 ID |
| `strategyName` | string | 策略名称 |
| `eventType` | string | 事件类型 |
| `severity` | string | 严重级别：`info`、`warning`、`critical` |
| `title` | string | 标题 |
| `body` | string | 内容 |
| `cta` | object | 前端行动按钮 |
| `toast` | boolean | 是否需要 Toast |
| `read` | boolean | 是否已读 |
| `createdAt` | string | 创建时间 |

## 3. Marketplace 接口

### 3.1 查询策略列表

请求路径：`GET /api/strategy-marketplace/strategies`

请求参数：

| 参数 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `market` | string | 否 | 市场过滤，例如 `US` |
| `style` | string | 否 | 策略风格，对应标签 |
| `engine` | string | 否 | 引擎编码 |
| `rail` | string | 否 | `all`、`hot`、`top`、`new`，默认 `all` |
| `sort` | string | 否 | `ret_1y`、`sharpe_1y`、`max_dd`、`published_at`、`followers` |
| `window` | string | 否 | `1M`、`3M`、`6M`、`1Y`、`ALL`，默认 `1Y` |
| `page` | int | 否 | 页码，默认 1 |
| `pageSize` | int | 否 | 每页数量，默认 20 |

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `items` | StrategyCardDTO[] | 策略卡片列表 |
| `page` | int | 当前页 |
| `pageSize` | int | 每页数量 |
| `total` | int | 总数 |

示例：

```json
{
  "items": [],
  "page": 1,
  "pageSize": 20,
  "total": 128
}
```

### 3.2 查询 For You 推荐策略

请求路径：`GET /api/strategy-marketplace/recommendations/for-you`

请求参数：

| 参数 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `limit` | int | 否 | 返回数量，默认 3 |

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `requestId` | string | 推荐请求 ID |
| `fallbackUsed` | boolean | 是否使用后端兜底策略 |
| `items` | StrategyCardDTO[] | 推荐策略列表 |

说明：该接口是一期唯一调用推荐服务的前端场景。

### 3.3 查询排行榜

请求路径：`GET /api/strategy-marketplace/leaderboard`

请求参数：

| 参数 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `window` | string | 否 | `1M`、`3M`、`6M`、`1Y`、`ALL` |
| `limit` | int | 否 | 返回数量，默认 8 |

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `window` | string | 指标窗口 |
| `items` | array | 榜单列表 |

`items` 字段：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `rank` | int | 排名 |
| `strategyId` | string | 策略 ID |
| `name` | string | 策略名称 |
| `returnPct` | number | 区间收益率 |
| `sharpe` | number | 夏普 |
| `curve` | array | 曲线 |

### 3.4 查询策略详情

请求路径：`GET /api/strategy-marketplace/strategies/{strategyId}`

路径参数：

| 参数 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `strategyId` | string | 是 | 策略 ID |

请求参数：

| 参数 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `versionId` | string | 否 | 指定版本，默认当前展示版本 |
| `window` | string | 否 | 指标窗口，默认 `1Y` |

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `strategy` | StrategyCardDTO | 策略卡片信息 |
| `description` | string | 详情描述 |
| `riskLevel` | string | 风险等级 |
| `suitableUsers` | string | 适用用户 |
| `riskDisclaimer` | string | 风险提示 |
| `parameterSummary` | array | 参数摘要 |
| `holdings` | array | 策略模拟/回测持仓，不是真实账户持仓 |
| `recentTrades` | array | 策略模拟/回测交易，不是真实账户交易 |
| `canDeploy` | boolean | 是否允许进入部署入口 |

## 4. Activity 接口

### 4.1 加入 Activity

请求路径：`POST /api/strategy-marketplace/activity`

请求体：

| 字段 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `strategyId` | string | 是 | 策略 ID |
| `versionId` | string | 否 | 策略版本，默认当前展示版本 |
| `source` | string | 否 | 来源：`marketplace`、`for_you`、`detail` |

返回参数：`ActivityStrategyDTO`

说明：

1. 后端记录当前时间为本轮收藏/观察开始时间。
2. 若用户曾经移出后再次加入，观察收益从最新加入时间重新开始。

### 4.2 移出 Activity

请求路径：`DELETE /api/strategy-marketplace/activity/{strategyId}`

路径参数：

| 参数 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `strategyId` | string | 是 | 策略 ID |

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `success` | boolean | 是否成功 |

### 4.3 查询 Activity 列表

请求路径：`GET /api/strategy-marketplace/activity`

请求参数：

| 参数 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `page` | int | 否 | 页码，默认 1 |
| `pageSize` | int | 否 | 每页数量，默认 20 |
| `refresh` | boolean | 否 | 是否强制重新请求策略侧计算区间收益，默认 false |

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
| `activeCount` | int | 当前收藏策略数 |
| `deployedCount` | int | 已部署策略数，由后端聚合算法侧结果 |
| `unreadPushCount` | int | 未读消息数 |
| `warningCount` | int | 健康状态异常策略数 |

说明：

1. 该接口由策略广场后端聚合部署标记。
2. 该接口由策略广场后端用收藏开始时间和当前时间调用策略侧计算区间收益。
3. 前端不需要单独调用算法侧接口合并部署状态。

## 5. Push 接口

### 5.1 查询消息列表

请求路径：`GET /api/strategy-marketplace/push/messages`

请求参数：

| 参数 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `cursor` | string | 否 | 分页游标 |
| `limit` | int | 否 | 每页数量，默认 20 |
| `unreadOnly` | boolean | 否 | 是否只查询未读 |
| `strategyId` | string | 否 | 按策略过滤 |

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `items` | PushMessageDTO[] | 消息列表 |
| `nextCursor` | string | 下一页游标 |
| `unreadCount` | int | 当前用户未读数 |

### 5.2 标记已读

请求路径：`POST /api/strategy-marketplace/push/messages/read`

请求体：

| 字段 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `messageIds` | string[] | 否 | 需要标记已读的消息 ID |
| `readAll` | boolean | 否 | 是否全部已读 |

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `success` | boolean | 是否成功 |
| `unreadCount` | int | 操作后的未读数 |

### 5.3 Push 服务 WebSocket

连接路径：待提供，提供方为 Push 服务方。

作用：前端建立 WebSocket 连接，接收 Toast 和实时消息通知。

建议消息格式：

```json
{
  "type": "strategy_push_message",
  "messageId": "msg_001",
  "payload": {
    "strategyId": "str_001",
    "title": "Strategy signal updated",
    "body": "QQQ Momentum Rotation generated a rebalance signal.",
    "toast": true,
    "createdAt": "2026-05-26T10:00:00+08:00"
  }
}
```

字段说明：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `type` | string | WebSocket 消息类型 |
| `messageId` | string | 业务消息 ID |
| `payload` | object | 消息内容 |

## 6. 管理接口

### 6.1 导入策略展示信息

请求路径：`POST /api/admin/strategy-marketplace/strategies/import`

请求类型：`multipart/form-data`

请求参数：

| 参数 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `file` | file | 是 | Excel 文件 |

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `jobNo` | string | 导入任务编号 |
| `status` | string | 任务状态 |

### 6.2 查询导入任务

请求路径：`GET /api/admin/strategy-marketplace/strategies/import-jobs/{jobNo}`

路径参数：

| 参数 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `jobNo` | string | 是 | 导入任务编号 |

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `jobNo` | string | 导入任务编号 |
| `status` | string | `pending`、`processing`、`success`、`partial_success`、`failed` |
| `totalCount` | int | 总行数 |
| `successCount` | int | 成功行数 |
| `failCount` | int | 失败行数 |
| `errors` | array | 行级错误 |
| `errorFileUrl` | string | 错误文件地址 |

### 6.3 下载导入模板

请求路径：`GET /api/admin/strategy-marketplace/strategies/import-template`

返回：Excel 文件。

## 7. 内部接口

### 7.1 策略侧推送信号到策略广场后端

请求路径：`POST /internal/strategy-marketplace/signals`

调用方：策略侧。

请求体：

| 字段 | 类型 | 必填 | 含义 |
| --- | --- | --- | --- |
| `signalId` | string | 是 | 策略侧信号唯一 ID，用于幂等 |
| `sourceSystem` | string | 是 | 来源系统 |
| `signalType` | string | 是 | 信号类型 |
| `severity` | string | 是 | `info`、`warning`、`critical` |
| `strategyId` | string | 是 | 策略 ID |
| `versionId` | string | 否 | 策略版本 |
| `occurredAt` | string | 是 | 信号发生时间 |
| `payload` | object | 是 | 信号内容 |

返回参数：

| 字段 | 类型 | 含义 |
| --- | --- | --- |
| `accepted` | boolean | 是否接收 |
| `duplicate` | boolean | 是否重复信号 |
| `messageCount` | int | 生成用户消息数 |

### 7.2 策略指标快照同步

请求路径：`POST /internal/strategy-marketplace/metrics/snapshots`

调用方：算法策略执行引擎。

说明：用于同步 Marketplace 卡片、榜单和详情页展示需要的策略指标。该接口如最终由后端主动拉取，可在联调时调整。

## 8. 外部待提供接口清单

当前外部依赖接口尚未最终定义，本文只说明接口名称、作用、提供方和状态；具体路径、请求参数、返回参数后续由对应业务方提供。

| 接口名称 | 作用 | 使用方 | 提供方 | 状态 |
| --- | --- | --- | --- | --- |
| 查询当前用户已部署策略列表 | Activity 后端聚合部署标记 | 策略广场后端 | 杨文园 | 待提供 |
| 批量计算策略区间收益 | Activity 按收藏开始时间和当前时间计算观察收益 | 策略广场后端 | 丁宇杰，或算法侧确认归属 | 待提供 |
| 同步策略指标快照 | Marketplace 展示收益指标、曲线、榜单 | 策略广场后端 | 丁宇杰 | 待提供 |
| 推送策略信号事件 | 策略侧发起信号给业务后端生成消息 | 策略广场后端 | 丁宇杰 | 待提供 |
| 同步策略池 | 策略广场每日同步策略数据给推荐 | 策略广场后端 | 毛灵伟、杜庆彪 | 待提供 |
| 获取 For You 推荐策略 ID | 推荐根据用户返回策略 ID 列表 | 策略广场后端 | 毛灵伟、杜庆彪 | 待提供 |
| 创建并投递 Push 消息 | 策略广场后端调用 Push 服务投递 WebSocket 消息 | 策略广场后端 | Push 服务方待确认 | 待提供 |
| Push WebSocket 连接 | 前端接收实时 Toast 和消息通知 | 前端 | Push 服务方待确认 | 待提供 |
| Deployed 账户和部署接口 | 真实账户、部署、持仓、交易明细 | 前端 | 丁骏(Jun Ding) | 待提供 |

