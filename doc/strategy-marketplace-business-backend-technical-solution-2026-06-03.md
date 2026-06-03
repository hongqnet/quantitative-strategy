# 策略广场业务后端技术方案

版本：v2026-06-03

适用范围：基于 `web/vibetrading` 最新前端页面、`doc/算法API文档.md` 算法接口文档，重新定义策略广场 Marketplace 与 Activity 模块的业务后端方案。

## 1. 背景与目标

前端最新页面已经完成一次功能精简。本方案只覆盖策略广场一期业务后端，不覆盖 Deployed 实盘/模拟盘明细、不覆盖前端本地演示数据、不覆盖 Push 服务自身实现。

本版业务后端目标：

1. 支撑 Marketplace 策略发现、推荐、榜单、策略 Preview/Detail。
2. 支撑 Activity 中用户已收藏/观察策略列表、排序、移除、部署入口辅助状态。
3. 接入算法侧策略区间收益计算接口，获取收益曲线、指标、信号、preview 持仓与交易列表。
4. 明确算法、交易后端、推荐服务、Push 服务与业务后端的职责边界。

## 2. 前端最新功能分析

### 2.1 Marketplace 页面

Marketplace 最新页面包含以下业务能力：

| 区域 | 前端表现 | 后端需要提供 |
| --- | --- | --- |
| For you | 推荐 3 个策略，展示策略卡片、曲线、指标、标签、Preview、Add to Activity | 个性化推荐策略列表；若推荐服务不可用，按榜单或静态权重降级 |
| Explore strategies | 按 Asset、Style 过滤，按 `1Y Sharpe`、`1Y Return`、`CAGR 5Y`、`Max Drawdown`、`Followers`、`Recently published` 排序 | 策略分页查询、筛选、排序、卡片摘要、卡片曲线 |
| Leaderboard | 支持窗口 `1M`、`3M`、`6M`、`1Y`、`All`，支持市场过滤；展示榜单收益曲线与排名表 | 榜单查询、榜单曲线、排名指标 |
| Strategy Preview | Tab 为 Overview、Holdings、Recent trades | 策略详情、收益曲线、当前持仓、近期交易 |
| Add to Activity | 将策略加入用户 Activity | 用户策略观察关系新增 |
| Deploy | 跳转交易/部署流程 | 业务后端只返回跳转所需 strategyId 与状态，不承接交易部署 |

Marketplace 已移除或当前不需要业务后端提供：

1. Preview 页 Parameters 模块。
2. Preview 页 Code 模块。
3. Engine 类型筛选入口，前端存在元数据但页面当前未使用。
4. Hot/Top/New rail 切换入口，前端存在组件但页面当前未渲染。

### 2.2 Strategy Preview/Detail 页面

Marketplace 策略 Preview/Detail 最新页面需要以下数据：

| 模块 | 字段 |
| --- | --- |
| 策略基础信息 | id、name、symbol、market、universe、author、blurb、tags、published |
| 指标 | 1Y Return、1Y Sharpe、Max DD、Win rate、Followers |
| 收益曲线 | 策略净值曲线、基准 SPY 对比曲线或差值曲线 |
| Holdings | symbol、name、side、weight、unrealized |
| Recent trades | date、symbol、side、qty、price、realized P&L |
| 回测入口 | start、end、timeframe、capital、benchmark、rerun 结果 |

关键结论：

1. `holdings.side` 用于展示 Long/Short。
2. `holdings.unrealized` 用于展示当前浮动盈亏百分比。
3. `recentTrades.realizedPnl` 用于展示已实现盈亏。
4. 上述 preview 数据不是交易账户真实持仓，而是策略在指定区间或当前 preview 快照下的算法模拟结果。

### 2.3 Activity 页面

Activity 最新页面包含以下业务能力：

| 区域 | 前端表现 | 后端需要提供 |
| --- | --- | --- |
| Your shortlist | 用户已收藏/观察的策略卡片列表 | 用户 Activity 策略列表 |
| 排序 | `Cumulative`、`Today`、`Runtime` | 按累计收益、今日收益、运行天数排序 |
| 卡片指标 | Cumulative、Today、Started | 活动观察快照 |
| 曲线 | 策略观察期收益曲线 | 用户加入 Activity 后的观察区间曲线 |
| Signal | lastSignal、nextRun | 算法最新信号与下一次运行时间 |
| Deploy 状态 | watching、paper、live、paused 等展示与按钮 | 交易后端部署状态摘要或前端直连交易后端 |
| Remove | 从 Activity 移除 | 用户策略观察关系删除 |
| Push panel | PushFeed 与 Toast | Push 服务推送，业务后端只负责关联消息元数据或不参与 |

Activity 已移除或当前不需要业务后端提供：

1. Shortlist leaderboard 模块。
2. Activity 卡片中的 positions 模块。
3. Activity 卡片中的 Sharpe 指标。
4. Activity 卡片中的 Max DD 指标。

## 3. 系统边界

### 3.1 服务职责

| 服务 | 职责 | 本方案关系 |
| --- | --- | --- |
| 策略广场业务后端 | 策略展示、用户 Activity 关系、策略指标快照、preview 快照、前端接口聚合 | 本方案主实现 |
| 算法服务 | 计算策略区间收益、曲线、指标、信号、preview 持仓、preview 交易列表 | 业务后端依赖 |
| 推荐服务 | 计算用户个性化推荐策略 | 可选依赖；不可用时业务后端降级 |
| 交易后端 | 策略部署、实盘/模拟盘账户、真实订单与真实仓位 | 非本方案实现；Activity 只展示部署摘要或透传跳转状态 |
| Push 服务 | 信号、状态、消息推送 | 前端已直接消费；业务后端不实现 Push 通道 |

### 3.2 业务后端不承担的能力

1. 不生成策略代码。
2. 不解析或执行 Pine/Event/Factor/Screen 策略逻辑。
3. 不计算策略收益、回撤、夏普、胜率。
4. 不生成 preview 持仓和交易列表。
5. 不管理真实交易账户持仓与订单。
6. 不提供 Activity leaderboard、positions、Sharpe、Max DD。
7. 不代理 Deployed 明细页的 Parameters、Code、Positions、All orders。

## 4. 算法 API 适配结论

### 4.1 算法文档现有接口

`doc/算法API文档.md` 当前提供两个接口：

1. `GET /api/strategy/deployed/list`
   - 查询当前用户已部署策略列表。
   - 返回已部署策略基础信息、状态、资金、收益、账户、标签。
2. `POST /api/strategy/return/calculate`
   - 单个或批量计算策略区间收益。
   - 请求包含 `strategy_ids`、`user_id`、`start_date`、`end_date`。
   - 返回 `total_return`、`annualized_return`、`annualized_volatility`、`sharpe_ratio`、`max_drawdown`、`win_rate`、`nav_curve`、`spy_diff_curve` 等。

### 4.2 当前缺口

算法现有 `POST /api/strategy/return/calculate` 缺少 Marketplace preview 必需字段：

| 前端模块 | 缺口字段 | 说明 |
| --- | --- | --- |
| Holdings | `side` | 多空方向，前端展示 Long/Short |
| Holdings | `unrealized` | 当前浮动盈亏，前端展示 Unrealized |
| Recent trades | `realized P&L` | 单笔交易已实现盈亏 |
| Recent trades | 交易列表整体 | Preview Recent trades 表格数据 |
| Activity | `today_return` | Activity Today 排序与展示 |
| Activity | `last_signal` | Activity 信号摘要 |
| Activity | `next_run_time` | Activity 下一次运行时间 |
| Activity | `health_status` | Activity 健康状态展示 |

### 4.3 算法接口扩展要求

业务后端不自行计算 preview holdings/trades。本方案要求算法侧在 `POST /api/strategy/return/calculate` 单个或批量区间收益接口中扩展返回：

1. `holdings`
   - 区间结束日或指定 preview 日期的策略模拟当前持仓快照。
   - 必须包含 `symbol`、`name`、`side`、`weight_pct`、`unrealized_pct`。
2. `recent_trades`
   - 区间内或最近 N 笔策略模拟交易。
   - 必须包含 `trade_time`、`symbol`、`side`、`quantity`、`price`、`realized_pnl`。
3. `today_return`
   - 当前自然日或最近交易日收益率，用于 Activity Today。
4. `last_signal`
   - 最新信号摘要，用于 Activity 卡片。
5. `next_run_time`
   - 下一次策略运行时间。
6. `health_status`
   - 策略运行健康状态。

算法扩展字段与现有收益指标一起返回，业务后端只做字段转换、缓存与聚合。

## 5. 总体架构

```text
Frontend Marketplace/Activity
        |
        v
Strategy Marketplace Business Backend
        |
        +--> Strategy display DB
        +--> User activity DB
        +--> Metric/preview snapshot DB
        |
        +--> Algorithm Service
        |       - /api/strategy/return/calculate
        |       - return metrics, nav curve, holdings, recent trades, signal
        |
        +--> Recommendation Service
        |       - for-you strategy ids
        |
        +--> Trading Backend
        |       - deploy status summary, deploy jump
        |
        +--> Push Service
                - signal/status/message stream
```

### 5.1 Marketplace 数据流

1. 策略元数据由运营后台、Excel 导入或策略源同步进入 `strategy_display`。
2. 定时任务调用算法 `POST /api/strategy/return/calculate` 批量刷新指标和曲线。
3. 刷新结果写入 `strategy_metric_snapshot` 与 `strategy_preview_snapshot`。
4. 前端查询 Marketplace 列表、For you、Leaderboard 时读取业务后端快照。
5. 前端打开 Preview/Detail 时读取策略详情与 preview 快照。
6. 用户点击 Add to Activity 时写入 `user_strategy_activity`。

### 5.2 Activity 数据流

1. 用户加入 Activity 时写入观察关系，记录 `observation_start_at`。
2. Activity 列表查询时，业务后端读取用户观察关系和策略快照。
3. 业务后端按观察开始日期调用或读取算法区间收益快照，生成 `cumPnLPct`、`todayPnLPct`、`curve`、`lastSignal`、`nextRun`、`health`。
4. 前端根据 `cumulative`、`today`、`runtime` 排序。
5. 用户 Remove 时逻辑删除观察关系。
6. Deploy 入口跳转交易后端流程，业务后端可附带当前部署摘要，但不管理交易。

### 5.3 Preview holdings/trades 数据流

1. 前端打开 Strategy Preview/Detail。
2. 业务后端读取最新 `strategy_preview_snapshot`。
3. 如果快照不存在、过期或用户触发 rerun，业务后端调用算法 `POST /api/strategy/return/calculate`。
4. 请求中设置 `include_holdings=true`、`include_trades=true`、`trade_limit=N`。
5. 算法返回 `holdings` 与 `recent_trades`。
6. 业务后端写入快照，并转换为前端字段：
   - `weight_pct` -> `weightPct`
   - `unrealized_pct` -> `unrealizedPct`
   - `realized_pnl` -> `realizedPnl`

## 6. 数据模型

### 6.1 strategy_display

策略展示主表。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | bigint | 主键 |
| strategy_id | varchar(64) | 策略唯一 ID |
| name | varchar(128) | 策略名称 |
| symbol | varchar(64) | 展示代号 |
| market | varchar(32) | 市场/资产分类 |
| universe_kind | varchar(32) | universe 类型 |
| universe_label | varchar(128) | universe 展示名称 |
| universe_detail | varchar(256) | universe 描述 |
| author | varchar(128) | 作者 |
| blurb | varchar(512) | 策略摘要 |
| tags_json | json | 标签 |
| engine | varchar(32) | screen/pine/event/factor，可为空 |
| result_type | varchar(32) | 策略结果类型，可为空 |
| holding_policy | varchar(64) | 持仓策略，可为空 |
| sizing_method | varchar(64) | 仓位方法，可为空 |
| published_at | datetime | 发布时间 |
| status | varchar(32) | online/offline/draft |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

### 6.2 strategy_metric_snapshot

策略指标和榜单快照表。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | bigint | 主键 |
| strategy_id | varchar(64) | 策略 ID |
| window | varchar(16) | 1M/3M/6M/1Y/ALL |
| return_pct | decimal(18,8) | 区间收益率 |
| annualized_return_pct | decimal(18,8) | 年化收益率 |
| annualized_volatility_pct | decimal(18,8) | 年化波动率 |
| sharpe | decimal(18,8) | 夏普 |
| max_drawdown_pct | decimal(18,8) | 最大回撤 |
| win_rate_pct | decimal(18,8) | 胜率 |
| followers | int | 收藏/关注人数 |
| curve_json | json | 策略净值曲线 |
| benchmark_curve_json | json | 基准曲线或差值曲线 |
| calculated_at | datetime | 算法计算时间 |
| source_status | varchar(32) | SUCCESS/FAIL |
| source_error | varchar(512) | 算法错误 |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

### 6.3 strategy_preview_snapshot

策略 preview 快照表。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | bigint | 主键 |
| strategy_id | varchar(64) | 策略 ID |
| start_date | varchar(8) | 算法计算开始日期，yyyyMMdd |
| end_date | varchar(8) | 算法计算结束日期，yyyyMMdd |
| nav_curve_json | json | 净值曲线 |
| benchmark_curve_json | json | 基准曲线或差值曲线 |
| holdings_json | json | Preview holdings |
| recent_trades_json | json | Preview recent trades |
| last_signal_json | json | 最新信号 |
| next_run_time | datetime | 下一次运行时间 |
| health_status | varchar(32) | healthy/warning/error |
| calculated_at | datetime | 算法计算时间 |
| expire_at | datetime | 快照过期时间 |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

### 6.4 user_strategy_activity

用户 Activity 关系表。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | bigint | 主键 |
| user_id | varchar(64) | 用户 ID |
| strategy_id | varchar(64) | 策略 ID |
| activity_status | varchar(32) | watching/removed |
| observation_start_at | datetime | 加入 Activity 时间 |
| deploy_status | varchar(32) | none/watching/paper/live/paused |
| deploy_account_label | varchar(128) | 部署账户展示名，可为空 |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

唯一索引：`uk_user_strategy(user_id, strategy_id)`。

### 6.5 user_strategy_observation_snapshot

用户观察区间收益快照表。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | bigint | 主键 |
| user_id | varchar(64) | 用户 ID |
| strategy_id | varchar(64) | 策略 ID |
| start_date | varchar(8) | 观察开始日期 |
| end_date | varchar(8) | 观察结束日期 |
| cumulative_return_pct | decimal(18,8) | 观察期累计收益 |
| today_return_pct | decimal(18,8) | 今日收益 |
| run_days | int | 运行天数 |
| curve_json | json | 观察期曲线 |
| last_signal_json | json | 最新信号 |
| next_run_time | datetime | 下一次运行时间 |
| health_status | varchar(32) | 健康状态 |
| calculated_at | datetime | 算法计算时间 |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

## 7. 接口分层

### 7.1 前端公开接口

业务后端对前端提供以下接口：

1. Marketplace 策略列表查询。
2. For you 推荐策略查询。
3. Leaderboard 榜单查询。
4. 策略详情/Preview 查询。
5. 策略手动 rerun/backtest。
6. Activity 加入。
7. Activity 移除。
8. Activity 列表查询。

不提供以下接口：

1. Activity leaderboard 查询。
2. Activity positions 查询。
3. Activity Sharpe/Max DD 指标查询。
4. Marketplace Preview Parameters 查询。
5. Marketplace Preview Code 查询。
6. Deployed 详情 Positions/Orders/Parameters/Code 查询。

### 7.2 后端内部依赖接口

业务后端调用以下依赖：

| 依赖 | 接口 | 用途 |
| --- | --- | --- |
| 算法服务 | `POST /api/strategy/return/calculate` | 批量计算曲线、指标、信号、preview holdings/trades |
| 推荐服务 | 待定 | For you 策略 ID 推荐 |
| 交易后端 | 待定 | 部署状态摘要与部署跳转 |

算法 `GET /api/strategy/deployed/list` 当前不作为策略广场业务后端的核心依赖。若后续需要合并部署状态，可作为交易状态摘要的候选来源，但真实部署与账户仍归交易后端。

## 8. 缓存与同步策略

### 8.1 Marketplace 快照

1. `1Y` 指标与卡片曲线用于列表、For you、Preview 首屏。
2. `1M/3M/6M/1Y/ALL` 指标用于 Leaderboard。
3. 定时任务按窗口批量刷新。
4. 算法单策略失败时不影响其他策略，失败策略保留上一版成功快照并记录 `source_error`。
5. 无快照策略不进入榜单，可进入列表但标记 `previewDataStatus=missing`。

### 8.2 Activity 快照

1. Activity 查询优先读取用户观察区间快照。
2. 快照过期后异步刷新，必要时同步刷新当前页策略。
3. `todayPnLPct` 使用算法 `today_return`。
4. `cumPnLPct` 使用用户 `observation_start_at` 到当前日期的 `total_return`。
5. `runDays` 由业务后端按 `observation_start_at` 计算。

### 8.3 Preview holdings/trades 快照

1. `holdings` 与 `recentTrades` 由算法区间收益接口返回。
2. 默认使用最近可用交易日作为 `end_date`。
3. 默认 `trade_limit=20`。
4. 快照 TTL 建议 30 分钟到 2 小时，运营可配置。
5. 若算法返回失败，前端返回空数组和 `previewDataStatus=failed`，并带错误摘要。

## 9. 排序与筛选规则

### 9.1 Marketplace 列表

| 前端排序 | 后端排序字段 |
| --- | --- |
| 1Y Sharpe | `strategy_metric_snapshot.window=1Y.sharpe desc` |
| 1Y Return | `strategy_metric_snapshot.window=1Y.return_pct desc` |
| CAGR 5Y | `strategy_metric_snapshot.annualized_return_pct desc` 或预留 5Y 快照 |
| Max Drawdown | `strategy_metric_snapshot.max_drawdown_pct asc` |
| Followers | `strategy_metric_snapshot.followers desc` |
| Recently published | `strategy_display.published_at desc` |

Asset filter 对应 `strategy_display.market`。

Style filter 对应 `strategy_display.tags_json` 或策略风格字段。

### 9.2 Leaderboard

| 前端窗口 | 后端窗口 |
| --- | --- |
| 1M | `window=1M` |
| 3M | `window=3M` |
| 6M | `window=6M` |
| 1Y | `window=1Y` |
| All | `window=ALL` |

榜单默认按 `return_pct desc` 排序；前端表格展示 `OOS 3M` 和 `Sharpe` 时，后端需返回对应窗口收益与夏普。若前端请求 `window=1Y` 但仍展示 `OOS 3M`，后端应同时返回 `displayReturnPct` 与 `displayWindow`，避免标题和数据含义不一致。

### 9.3 Activity

| 前端排序 | 后端排序字段 |
| --- | --- |
| cumulative | `cumulative_return_pct desc` |
| today | `today_return_pct desc` |
| runtime | `run_days desc` |

Activity 不按 Sharpe 或 Max DD 排序。

## 10. 权限与用户身份

1. 所有 Activity 接口必须校验当前用户身份。
2. 用户只能查看和修改自己的 Activity。
3. Marketplace 列表、榜单可匿名访问；For you 需要用户身份，匿名时降级为热门策略。
4. Preview/Detail 可匿名访问，但是否已加入 Activity、是否已部署需要用户身份。
5. 部署状态不得由前端自行伪造，需来自交易后端或业务后端可信缓存。

## 11. 错误处理

| 场景 | 处理 |
| --- | --- |
| 算法批量计算部分失败 | 成功策略正常入库，失败策略记录错误并保留旧快照 |
| 算法返回缺少 holdings/trades | 标记 `previewDataStatus=partial`，返回空数组，记录告警 |
| 推荐服务不可用 | 降级使用榜单前 N |
| 交易后端不可用 | Activity 仍返回策略观察数据，部署状态标记 `unknown` |
| 用户重复加入 Activity | 幂等返回当前关系 |
| 用户移除不存在的 Activity | 幂等成功 |

## 12. 监控与告警

需要监控：

1. 算法区间收益接口成功率、平均耗时、P95 耗时。
2. 算法返回字段完整性，尤其 `holdings.side`、`holdings.unrealized_pct`、`recent_trades.realized_pnl`。
3. 快照刷新延迟。
4. Marketplace 榜单空数据数量。
5. Activity 查询耗时。
6. 推荐服务降级次数。
7. 交易状态摘要获取失败次数。

## 13. 实施计划

### 13.1 第一阶段：接口与数据闭环

1. 建表：策略展示、指标快照、preview 快照、用户 Activity、观察区间快照。
2. 实现 Marketplace 列表、For you、Leaderboard、Detail。
3. 实现 Activity 加入、移除、列表。
4. 接入算法 `POST /api/strategy/return/calculate` 基础字段。
5. 与算法确认并联调扩展字段 `holdings`、`recent_trades`、`today_return`、`last_signal`、`next_run_time`、`health_status`。

### 13.2 第二阶段：刷新与降级

1. 实现定时刷新 Marketplace 指标。
2. 实现 Activity 观察区间快照刷新。
3. 实现算法失败降级与旧快照回退。
4. 实现推荐服务降级。
5. 增加数据完整性监控。

### 13.3 第三阶段：运营与管理

1. 支持策略展示数据导入/上下线。
2. 支持指标快照手动刷新。
3. 支持 preview 快照重算。
4. 支持榜单窗口配置。

## 14. 联调验收标准

1. Marketplace 列表可按 Asset、Style、Sort 查询，卡片曲线和指标与算法快照一致。
2. For you 返回 3 个策略，匿名或推荐失败时有降级结果。
3. Leaderboard 可按窗口与市场过滤，返回曲线和排名表。
4. Strategy Preview 不出现 Parameters、Code 模块相关接口依赖。
5. Strategy Preview Holdings 每行包含 `side` 与 `unrealizedPct`。
6. Strategy Preview Recent trades 每行包含 `realizedPnl`。
7. Activity 页面不返回 leaderboard、positions、Sharpe、Max DD。
8. Activity 可按 cumulative、today、runtime 排序。
9. Activity 卡片包含曲线、Today、Started、lastSignal、nextRun、deployStatus。
10. 算法缺少 preview holdings/trades 时，业务后端可识别并返回 `previewDataStatus=partial`。

## 15. 风险与待确认

| 风险 | 影响 | 处理建议 |
| --- | --- | --- |
| 算法当前未提供 holdings/trades | Preview Holdings/Recent trades 无真实数据 | 将 `holdings`、`recent_trades` 纳入算法区间收益接口扩展必需项 |
| 算法只支持日期不支持时间 | Activity 加入当天的精确观察收益可能有偏差 | 一期按自然日处理，后续扩展 `start_time/end_time` |
| 前端 leaderboard 文案和窗口口径不完全一致 | 用户可能误解收益窗口 | 后端返回 `displayWindow`，前端按实际窗口展示 |
| 部署状态来源不清 | Activity Deploy 状态不可信 | 与交易后端确认部署摘要接口，业务后端只缓存摘要 |
| 推荐服务未落地 | For you 无个性化 | 按用户 Activity、榜单、标签偏好降级 |

## 16. 本版相对旧方案的关键差异

1. 明确 Marketplace Preview 不再提供 Parameters 与 Code。
2. 明确 Activity 不再提供 Shortlist leaderboard。
3. 明确 Activity 不再提供 positions、Sharpe、Max DD。
4. 明确 preview holdings/trades 不由业务后端生成，而由算法 `POST /api/strategy/return/calculate` 扩展返回。
5. 明确 holdings 必须包含 `side` 与 `unrealizedPct`。
6. 明确 recentTrades 必须包含 `realizedPnl`。
7. 明确 Activity 只保留 Cumulative、Today、Runtime、曲线、信号、部署入口。
8. 明确算法 `GET /api/strategy/deployed/list` 不作为策略广场业务后端核心依赖。
