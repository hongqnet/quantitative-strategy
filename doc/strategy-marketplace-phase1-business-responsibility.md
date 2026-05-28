# 策略广场一期业务需求与职责分配

版本：v1.0 原型对齐版

日期：2026-05-28

范围：完全以当前 `web/vibetrading` 前端原型为准，一期仅覆盖 `Strategy` 下的 `Marketplace`、`Activity`、`Deployed`，以及三者共享的 `Preview / Detail / Deploy / Quant Push` 链路。`Studio`、`AI Charts`、`Markets`、`Portfolio`、`News`、`Brokers` 不纳入本文件。

## 1. 原型页面映射

|原型入口|代码位置|页面定位|关键交互|
|---|---|---|---|
|Marketplace|`web/vibetrading/js/marketplace.jsx`|策略发现页|`Picks for you`、`Leaderboard`、筛选排序、策略卡片、预览、加入 Activity、部署入口|
|Activity|`web/vibetrading/js/onwatch.jsx`|策略观察和消息工作台|`Shortlist leaderboard`、`Your shortlist`、`Quant Push`、卡片内轻量持仓预览、部署入口、跳转 Deployed|
|Deployed|`web/vibetrading/js/activity.jsx`|已部署策略执行视图|账户筛选、KPI、`My strategies`、`Stopped`、`Positions`、管理、停止、重启、删除|
|Preview / Deploy Modal|`web/vibetrading/js/modals.jsx`|跨页共享操作层|策略预览、再回测、直接部署、部署参数配置、暂停原因说明、额外账户部署|
|Detail Page|`web/vibetrading/js/detail-page.jsx`|跨 Marketplace / Deployed 共享详情页|Marketplace 详情与 Deployed 详情复用同一容器，但展示区块不同|

## 2. 原型对齐后的核心结论

1. `Activity` 不再是“纯观察列表”。当前原型中，`watching / paper / live / paused` 四种状态共存，已部署或暂停过的策略会展示轻量部署摘要、最近信号，以及可展开的 `Positions` 预览。

2. `Deployed` 仍然是一期唯一承载完整交易执行信息的页面。账户、资金、真实持仓、订单、停止、重启、删除等完整动作只放在 `Deployed`。

3. `Preview` 和 `Detail` 是共享链路，不是 Marketplace 独占弹窗。用户可以在预览弹窗和详情页里直接执行 `+ Add to Activity`、`Deploy`、`Re-backtest`。

4. 当前原型没有体现“必须先加入 Activity 才能再回测”的前置限制。若产品仍要加权限或频控，应通过接口规则限制，而不是继续在职责文档里默认这个前提。

5. `Stop` 后的状态不再是自动降回纯 `watching`。原型中停止后的部署会进入 `paused / stopped` 语义，Activity 保留 `Paused` 卡片，Deployed 进入 `Stopped` 区域，并支持后续 `Restart` 或 `Delete`。

6. `Quant Push` 是跨 `Activity / Deployed` 的统一消息流。原型数据中消息存在 `source=activity` 和 `source=deployed` 两类来源，说明消息归因应覆盖观察态与部署态，而不是只服务 Activity。

7. 部署弹窗已经明确了一期前端期望的账户抽象：账户选择、资金设置、`Risk per trade`、`Daily loss cap`、`Max DD stop` 三个守护阈值，以及 `Paper / Live` 模式差异提示。

8. 个性化推荐仍然只服务 Marketplace 的 `Picks for you` 区域，不扩展到排行榜、Activity、Deployed、Push 或交易执行。

## 3. 一期目标

1. 用户可以在 Marketplace 里发现策略、查看排行榜和推荐策略，并进入预览或详情页。

2. 用户可以把策略加入 Activity，持续查看观察期表现、最近信号、部署状态和消息提醒。

3. 用户可以在预览或详情页发起再回测，查看自定义区间结果，但不覆盖官方展示快照。

4. 用户可以把策略部署到 Paper 或真实账户，并在 Deployed 查看运行、持仓、订单和风险控制状态。

5. 用户可以接收来自观察态和部署态的 Quant Push，并跳转回对应策略或部署上下文。

## 4. 一期页面职责拆分

### 4.1 Marketplace

|功能|一期需求描述|主责团队/负责人|协作方|责任边界|
|---|---|---|---|---|
|策略池展示|展示可上架策略的列表、作者、市场、标签、发布日期、可部署状态等|后端业务开发：@王正强|算法开发：@杨文园 / @丁宇杰<br>前端开发：@夏维森(Vincent)|策略广场后端负责展示池、上下架和列表接口；算法提供策略基础事实和指标源；前端负责页面呈现|
|`Picks for you` 推荐区|按用户展示推荐策略卡片和推荐原因|推荐：@毛灵伟 / @杜庆彪|后端业务开发：@王正强<br>前端开发：@夏维森(Vincent)|推荐服务只返回推荐策略 ID 和可选原因；策略广场后端负责过滤不可展示策略并补全卡片字段；前端负责空态和错误态|
|Leaderboard|支持时间范围切换、市场切换、榜单图表和 Top 列表|后端业务开发：@王正强|算法开发：@丁宇杰<br>前端开发：@夏维森(Vincent)|榜单口径和排序接口由策略广场后端定义；算法提供指标快照；前端负责图表和表格交互|
|筛选与排序|当前原型实际使用 `Asset`、`Style`、`Sort` 三组筛选|后端业务开发：@王正强|前端开发：@夏维森(Vincent)|后端提供筛选字段、枚举和排序能力；前端不写死业务口径|
|策略卡片|展示 1Y 收益、Sharpe、最大回撤、作者、标签、关注人数、Preview 和 Add to Activity|后端业务开发：@王正强|算法开发：@丁宇杰<br>前端开发：@夏维森(Vincent)|后端负责卡片展示快照；算法负责指标和曲线来源；前端负责卡片布局、按钮状态和异常态|
|预览 / 详情|展示 `Overview`、`Holdings / Current basket`、`Recent trades`、`Parameters`、`Code` 等页签|后端业务开发：@王正强|算法开发：@杨文园 / @丁宇杰<br>前端开发：@夏维森(Vincent)|后端负责详情展示结构和展示文案；算法负责回测曲线、当前篮子、近期交易、参数摘要；前端负责弹窗和详情页实现|
|再回测|在预览和详情页支持 `1Y / 3Y / 5Y` 快捷区间与自定义日期区间|算法开发：@丁宇杰|后端业务开发：@王正强<br>前端开发：@夏维森(Vincent)|算法负责回测计算；后端只负责权限、频控、参数校验和结果透传；前端负责交互、加载态和结果展示|
|加入 Activity|用户把策略加入个人观察列表|后端业务开发：@王正强|前端开发：@夏维森(Vincent)|策略广场后端维护 `user_id + strategy_id` 观察关系、来源和加入时间；前端负责按钮状态和成功反馈|
|部署入口|用户可从卡片、预览、详情直接进入 Deploy 流程|交易开发：@丁骏(Jun Ding)|算法开发：@杨文园<br>后端业务开发：@王正强<br>前端开发：@夏维森(Vincent)|交易侧负责账户、风险参数、部署接口和运行状态；策略广场后端只提供策略上下文，不中转交易执行数据|

### 4.2 Activity

|功能|一期需求描述|主责团队/负责人|协作方|责任边界|
|---|---|---|---|---|
|用户短名单|维护用户加入 Activity 的策略集合和加入时间|后端业务开发：@王正强|前端开发：@夏维森(Vincent)|策略广场后端负责观察关系、来源、加入时间和移除；前端负责列表编排|
|Shortlist leaderboard|在用户短名单范围内展示观察期表现排序|后端业务开发：@王正强|算法开发：@丁宇杰<br>前端开发：@夏维森(Vincent)|后端负责用户范围和接口；算法负责观察期指标；前端负责榜单交互|
|观察卡片|展示 `Today`、`Sharpe`、`Max DD`、`Win`、`Started`、`Running`、最近信号、下一次运行时间等|算法开发：@丁宇杰|后端业务开发：@王正强<br>前端开发：@夏维森(Vincent)|算法负责观察期收益、信号和运行信息；后端负责用户可见策略集合；前端负责卡片展示和状态文案|
|部署状态与轻量持仓预览|对 `paper / live / paused` 卡片展示部署状态、部署账户、累计收益，以及可展开的 `Positions` 预览|交易开发：@丁骏(Jun Ding)|后端业务开发：@王正强<br>前端开发：@夏维森(Vincent)<br>算法开发：@杨文园|交易侧是部署状态、账户、轻量持仓预览的权威来源；策略广场后端不再承担部署标记和真实仓位聚合；前端按 `strategy_id / deployment_id` 组合展示|
|部署入口与 Deployed 跳转|未部署策略展示 `Deploy`；已部署或暂停策略展示 `Deployed` 跳转|交易开发：@丁骏(Jun Ding)|前端开发：@夏维森(Vincent)<br>后端业务开发：@王正强|交易侧负责部署上下文和状态；前端负责路由与按钮切换；策略广场后端只负责观察关系|
|Quant Push 侧栏与 Toast|展示来自观察态和部署态的消息流，支持 CTA 跳转|Push 服务：@李铎|后端业务开发：@王正强<br>算法开发：@杨文园 / @丁宇杰<br>交易开发：@丁骏(Jun Ding)<br>前端开发：@夏维森(Vincent)|Push 服务负责消息查询、详情、已读、实时触达；策略广场后端只维护订阅关系并发送策略消息事件；算法和交易侧提供事实事件|
|移除观察|用户可以把策略从 Activity 列表移除|后端业务开发：@王正强|前端开发：@夏维森(Vincent)|移除的是观察关系，不等同于删除交易侧部署记录；若策略仍处于部署态，前端需先提示用户到 Deployed 处理|

### 4.3 Deployed

|功能|一期需求描述|主责团队/负责人|协作方|责任边界|
|---|---|---|---|---|
|账户筛选与 KPI|按账户切换查看 `capital`、`today`、`cum`、`open positions`、`unrealized` 等指标|交易开发：@丁骏(Jun Ding)|前端开发：@夏维森(Vincent)|账户、资金、收益口径由交易侧定义并直接提供前端接口|
|`My strategies`|展示运行中的策略卡片，包括账户、启动时间、运行天数、资金、绩效和火花线|交易开发：@丁骏(Jun Ding)|算法开发：@杨文园 / @丁宇杰<br>前端开发：@夏维森(Vincent)|交易侧负责部署视角的收益、状态和账户关联；算法负责策略实例状态；前端负责卡片和列表|
|`Stopped`|展示已停止策略，并支持 `View details`、`Restart`、`Delete`|交易开发：@丁骏(Jun Ding)|算法开发：@杨文园<br>前端开发：@夏维森(Vincent)|停止后的部署实例仍归交易侧管理；删除的是部署记录生命周期动作，不是 Activity 观察关系的替代实现|
|`Positions`|按标的聚合展示持仓，并支持展开到单策略行|交易开发：@丁骏(Jun Ding)|前端开发：@夏维森(Vincent)|真实仓位、成本、现价、未实现盈亏、策略归因由交易侧提供|
|Deployed 详情|展示 `Overview`、`Positions`、`All orders`、`Parameters`、`Code`|交易开发：@丁骏(Jun Ding)|算法开发：@杨文园 / @丁宇杰<br>前端开发：@夏维森(Vincent)|交易侧负责部署视角数据；算法提供策略参数和策略说明补充；前端负责共享详情页渲染|
|管理与停止|支持 `Manage`、`Stop only`、`Close all positions and stop`、`Restart`、`Delete`|交易开发：@丁骏(Jun Ding)|算法开发：@杨文园<br>前端开发：@夏维森(Vincent)|交易侧负责执行与状态机；算法负责暂停、恢复、停止后的运行同步；前端负责确认弹窗和风险提示|

### 4.4 Quant Push

|功能|一期需求描述|主责团队/负责人|协作方|责任边界|
|---|---|---|---|---|
|订阅关系|用户加入或移除 Activity 时，更新该策略的消息订阅状态|后端业务开发：@王正强|前端开发：@夏维森(Vincent)|订阅关系属于策略广场业务语义，继续由策略广场后端维护|
|事实事件生产|提供策略信号、调仓、风控、里程碑、部署状态变化等事件|算法开发：@杨文园 / @丁宇杰<br>交易开发：@丁骏(Jun Ding)|后端业务开发：@王正强|算法和交易侧只提供事实事件，不负责前端消息中心展示|
|消息生成与投递|根据事件、订阅关系和用户上下文生成可投递消息|后端业务开发：@王正强|Push 服务：@李铎|策略广场后端负责把策略事件翻译为用户可消费的消息请求，并补充 `strategyId / deploymentId / cta` 上下文|
|消息存储、查询、已读、实时触达|支持消息列表、消息详情、已读回写、WebSocket/Push 实时触达|Push 服务：@李铎|前端开发：@夏维森(Vincent)<br>后端业务开发：@王正强|Push 服务是一期消息生命周期的主责；策略广场后端不再自建一套并行的消息存储和查询链路|
|前端展示|Activity 右侧信息流、页面内 Toast、CTA 跳转|前端开发：@夏维森(Vincent)|Push 服务：@李铎<br>后端业务开发：@王正强|前端负责消息消费与跳转；Push 服务负责消息协议；策略广场后端负责 CTA 业务上下文正确性|

### 4.5 共享 Preview / Detail / Deploy 能力

|能力|一期需求描述|主责团队/负责人|协作方|责任边界|
|---|---|---|---|---|
|Strategy Preview Modal|从 Marketplace 或 Activity 打开策略预览弹窗|前端开发：@夏维森(Vincent)|后端业务开发：@王正强<br>算法开发：@丁宇杰|前端负责统一交互层；后端和算法提供页面所需数据，不拆两套预览协议|
|Shared Detail Page|Marketplace 和 Deployed 共用详情容器，但按上下文切换区块|前端开发：@夏维森(Vincent)|后端业务开发：@王正强<br>交易开发：@丁骏(Jun Ding)<br>算法开发：@杨文园 / @丁宇杰|前端负责容器复用；策略广场后端提供策略视角详情；交易侧提供部署视角详情|
|Deploy Modal|选择账户、设置资金和守护阈值后发起部署|交易开发：@丁骏(Jun Ding)|前端开发：@夏维森(Vincent)<br>算法开发：@杨文园|交易侧负责账户清单、风控参数、部署动作；前端负责表单与风控提示；算法负责部署实例启动|

## 5. 团队职责边界

### 5.1 算法开发：策略引擎服务 @杨文园

1. 维护策略基础事实，包括策略可运行状态、策略部署实例、运行容器和调度状态。

2. 为 Activity 和 Deployed 提供部署实例状态、暂停原因、恢复条件等运行态信息。

3. 在停止、恢复、重启等动作后，与交易侧同步策略运行状态。

4. 提供部署态或观察态可用于 Push 的事实事件输入。

### 5.2 算法开发：算法策略执行引擎 @丁宇杰

1. 提供 Marketplace 和详情页所需的策略指标、回测曲线、当前篮子、近期交易和参数摘要。

2. 提供再回测计算能力，支持快捷区间和自定义区间。

3. 提供 Activity 观察期收益、最近信号、下一次运行时间、风险指标和榜单口径。

4. 给出可推送事件类型、阈值建议和文案建议。

### 5.3 后端业务开发：策略广场服务 @王正强

1. 维护 Marketplace 展示池、展示字段、上下架状态、推荐补全和展示接口。

2. 维护用户 Activity 观察关系、加入时间、来源和移除状态。

3. 为再回测提供鉴权、频控、参数校验和透传能力。

4. 维护策略订阅关系，并把策略事实事件转为 Push 消息请求。

5. 不再作为部署状态、账户、持仓、订单、成交和消息中心数据的权威聚合层。

### 5.4 交易开发：Deployed 和交易执行 @丁骏(Jun Ding)

1. 负责 Deploy 流程、账户连接、账户列表、部署实例、资金和风控参数。

2. 负责 Activity 中所有部署态摘要字段，包括 `deployStatus`、`deployAccount`、轻量 `positions` 预览、`todayPnL`、`cumPnL`。

3. 负责 Deployed 中的账户、持仓、订单、停止、重启、删除和详情接口。

4. 负责真实交易和 Paper Trading 的执行、归因和异常处理。

### 5.5 推荐服务 @毛灵伟 / @杜庆彪

1. 接收策略广场服务同步的可推荐策略池。

2. 提供按用户返回推荐策略 ID 的接口，服务 Marketplace 的 `Picks for you`。

3. 可选返回推荐原因，不扩展到 Push、Activity 和交易执行链路。

### 5.6 Push 服务 @李铎

1. 负责消息存储、查询、详情、已读、实时触达和 WebSocket 协议。

2. 负责消息投递回执、失败状态和重连协议。

3. 与策略广场后端约定消息请求协议，与前端约定消息消费协议。

### 5.7 前端开发 @夏维森(Vincent)

1. 实现 Marketplace、Activity、Deployed 和共享 Preview / Detail / Deploy 交互。

2. 在 Activity 页面组合策略广场后端、交易侧和 Push 服务三类数据，不把部署态数据错误地继续归到策略广场后端。

3. 在 Deployed 页面直接消费交易侧接口，在消息流中直接消费 Push 服务能力。

4. 为再回测、停止、真实资金部署等动作补足风险提示、确认交互和异常态。

## 6. 已确认业务规则

|主题|已确认规则|
|---|---|
|Activity 状态|Activity 现阶段至少存在 `watching`、`paper`、`live`、`paused` 四种状态，且它们会共存在同一观察列表。|
|Activity 展示边界|Activity 可以展示轻量部署摘要和持仓预览，但不展示完整订单列表、账户总览和交易管理动作。|
|Deployed 展示边界|完整账户、持仓、订单、停止、重启、删除、风险参数管理只在 Deployed。|
|Stop 后状态|`Stop only` 和 `Close all positions and stop` 都会把部署实例推入 `paused / stopped` 语义，不再默认回到纯 `watching`。|
|再回测入口|当前原型中，预览弹窗和详情页都直接展示再回测区域，没有“先加入 Activity 才可回测”的显式前端限制。|
|推荐范围|推荐只服务 Marketplace 的 `Picks for you`，不参与通用排序、排行榜、Activity、Deployed 和 Push。|
|Push 来源|Push 消息至少区分 `activity` 和 `deployed` 两种 `source`，前端需要据此跳转到不同上下文。|
|部署参数|部署弹窗当前固定包含账户选择、资金、`Risk per trade`、`Daily loss cap`、`Max DD stop` 三类守护参数。|
|原型账户集合|当前原型示例账户为 `AInvest Paper`、`IBKR Margin`、`Alpaca Live`、`Hyperliquid`；其中真实一期支持范围仍需单独确认。|

## 7. 跨团队数据和接口边界

|对象|主要字段方向|权威来源|消费方|说明|
|---|---|---|---|---|
|Strategy Display Snapshot|`strategy_id`、名称、作者、简介、标签、市场、发布时间、可展示状态、可部署状态|策略广场服务|Marketplace、详情页、推荐补全|展示信息由策略广场后端维护|
|Strategy Metrics Snapshot|1Y 收益、Sharpe、最大回撤、胜率、关注人数、曲线、更新时间|算法策略执行引擎|Marketplace、Preview、Detail、Activity|展示时可由策略广场后端做快照缓存|
|Recommendation Result|`user_id`、场景、推荐策略 ID 列表、推荐原因|推荐服务|Marketplace|只服务 `Picks for you`|
|User Activity Relation|`user_id`、`strategy_id`、加入时间、来源、移除状态、订阅状态|策略广场服务|Activity、Push 订阅|观察关系的唯一权威源|
|Activity Watch Snapshot|观察期收益、最近信号、下一次运行时间、观察榜单指标|算法策略执行引擎|Activity|按用户观察关系计算|
|Deployment Summary|`deployment_id`、`strategy_id`、`deployStatus`、`deployAccount`、`capital`、`todayPnL`、`cumPnL`、轻量 `positions`、`stoppedOn`|交易服务|Activity、Deployed|Activity 不再从策略广场后端拿部署标记聚合结果|
|Deployment Risk Config|`risk_per_trade`、`daily_loss_cap`、`max_dd_stop`、模式、账户|交易服务|Deploy Modal、Manage Modal、Deployed|部署参数的唯一权威源|
|Account / Position / Order|账户、真实持仓、订单、成交、费用、状态、归因|交易服务|Deployed|完整交易数据只从交易侧读取|
|Manual Backtest Result|区间、收益曲线、指标、交易列表、错误信息、耗时|算法策略执行引擎|Preview、Detail|结果实时返回，不覆盖官方快照|
|Push Message|`id`、`at`、`kind`、`source`、`strategyId`、`deploymentId`、标题、正文、`cta`、已读状态|Push 服务|Activity、Toast、消息中心|策略广场后端只负责消息请求和上下文，不负责消息中心存储|

## 8. 待确认事项

1. Activity 前端最终是直接组合三类接口，还是增加一层轻量 BFF；若增加，BFF 也不能改变交易侧和 Push 服务的权威边界。

2. Push 服务是否已经具备消息列表、详情、已读和 WebSocket 全套能力；若暂不具备，需要明确过渡方案，但不建议把过渡方案写成长期职责。

3. `IBKR`、`Alpaca`、`Hyperliquid` 在一期中哪些是真实 P0 支持，哪些只是原型演示账户。

4. 再回测的日期范围、频控、并发限制、异常处理和是否允许对已下架策略执行，仍需产品与算法一起确认。

5. `Stop only` 后若保留市场中的未完成订单，前端需要如何提示，Activity 和 Deployed 的状态是否要区分“Paused but positions kept”与“Paused and flat”。

6. `Delete stopped` 是仅删除部署记录，还是同时解除 Activity 观察关系，需要进一步明确，避免用户以为两个动作等价。

7. 共享详情页的 `Code`、`Parameters` 等区块哪些来自策略展示后端，哪些来自算法或交易侧，需要在接口设计阶段细化字段级边界。
