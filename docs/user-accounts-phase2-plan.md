# 注册用户与自主投稿：阶段二实施方案（账户、收藏与基础权益）

方案日期：2026-09-27。
对应总方案：`docs/user-accounts-and-submissions-plan.md`（2026-09-26）阶段二。
前置交付：`docs/user-accounts-phase1-review.md`（阶段一：隔离原型与技术定案，Trae 完成）。
本文件是**本阶段的实施设计说明**：明确目标范围、模块与功能点、与阶段一成果的衔接方式，并逐项核对与总方案、AGENTS.md 的一致性。

---

## 一、全局检查结论（动手前的现状核对）

### 1. 整体架构

| 层 | 现状 | 阶段二是否改动 |
| --- | --- | --- |
| 公开网站 | `site/`，Astro 静态站，唯一 npm 依赖 `astro`；构建链为 `图片生成 → astro build → 清理下线素材 → 站点地图 → 公开回归检查` | 新增 4 个账户页面与 1 个公开摘要端点；不改动既有页面逻辑 |
| 本地管理服务 | `local-admin/server.mjs`（121 KB），默认 `127.0.0.1:4173`；线上模式 `127.0.0.1:4174` + Cloudflare Access | 新增账户前缀转发与最小账号面板 |
| 公开接收进程 | `local-admin/submission-server.mjs`，独立进程 `127.0.0.1:4176`，只提供投稿、联系、回执、停止处理申请 | **不动**，权限边界不扩大 |
| 投稿接收与审核 | `local-admin/submissions.mjs`：`TG-` 编号、查询密钥摘要、服务端真实解码图片、最长边 2400 像素、去内嵌信息、状态机、13 项人工隐私检查、转草稿、发布门禁 | **不动**，阶段三才衔接 |
| 档案数据 | `archive-data/*.json`（正式 JSON）、`site/src/data/archive.ts`（构建生成）、`local-admin/{drafts,history,recycle-bin}` | **不动**，账户模块禁止读写 |
| 测试 | `local-admin/tests/*.test.mjs`，`node --test`，共 57 项（56 通过 + 1 项按原有 Windows 规则跳过） | 新增账户测试文件，不改动既有测试 |

### 2. 接口与约定（必须沿用）

- 管理/私有接口的写操作标记：请求头 `X-LJM-Admin-Request: 1`，并校验 `Origin`（本地允许 `http://127.0.0.1:4173` / `http://localhost:4173`）。
- 公开投稿接口的写操作标记：请求头 `X-LJM-Submission: 1`，同样校验 `Origin`。
- 响应安全头：`sendJson` 统一带 `X-Content-Type-Options`、`X-Frame-Options: DENY`、`Referrer-Policy: no-referrer`、`Cache-Control: no-store`；线上模式再叠加 CSP、HSTS、`X-Robots-Tag: noindex`。
- 私密数据目录必须位于公开目录之外，`submission-server.mjs` 已用 `path.relative` 强制校验，账户模块沿用同一校验方式。
- 视觉：暖纸底 `--site-bg: #eee9de`、深墨 `#2c2823`、朱红 `#9a3f2e`、中文衬线标题 + 无衬线操作文字；不新增 UI 组件库与字体服务。

### 3. 依赖与运行环境（含一处事实纠正）

- `site/package.json` 只声明 `astro`，`engines.node >= 22.12.0`。
- **纠正阶段一报告的一处事实**：报告写"本机 Node 为 v24.14.1"，实测本机 `node -v` 为 **v22.22.2**（系统另装有 24.14.1，但当前 PATH 解析到 22.22.2）。这一点不影响结论——**`node:sqlite` 在 v22.22.2 下可直接使用，无需命令行开关**，仅打印一次实验性 API 警告。因此"零新增依赖"仍然成立。
- 服务器 Node 版本仍需在阶段四部署前单独核实。

### 4. 阶段一（Trae）已完成的部分与边界

**已交付并已核对存在**：

| 交付物 | 位置 | 核对结果 |
| --- | --- | --- |
| 隔离界面原型 | `local-admin/public/preview/`：7 个页面 + `preview.css`（1169 行）+ `preview.js`（820 行） | 文件齐全，纯前端假数据 |
| 管理页入口 | `local-admin/public/index.html`「预览 → 注册模块预览」 | 存在 |
| 既有保护衔接 | `local-admin/public/app.js` 把新入口纳入"有未保存修改时先确认再离开" | 已纳入 |
| 说明补充 | `local-admin/README.md`、`docs/local-admin-guide.md` 各 1 行 | 存在 |
| 阶段一报告 | `docs/user-accounts-phase1-review.md` | 存在，含 7 项授权清单与用户决定记录 |
| 开发日志 | `docs/development-log.md` 阶段一章节 | 存在 |

**边界（阶段一没有做的事，也正是阶段二不重复的事）**：

- 无真实身份验证、无会话、无权限校验、无数据库、无邮件发送、无网络请求；
- 不读取真实档案、真实用户资料或私密收件区；
- 不进入公开构建、不部署；
- 管理端的账号相关功能未包含。
- 结论：**阶段二的定位是"把原型背后的真实能力建起来"，原型本身保留为版式与文案的对照基准，不删除、不改写。**

---

## 二、本阶段目标范围

### 1. 做什么（方案 M 阶段二原文）

> 在已批准选型及必要例外范围内，实现注册登录、权限隔离、账户设置、收藏、退出和安全措施，并打通人工导出及注销申请。使用隔离测试账号，完成身份验证与跨用户访问检查。不得自动进入上传开发或公开上线。

拆解为本阶段 9 个功能点：

1. **邮箱验证码注册与登录**：6 位验证码、10 分钟有效、一次使用、60 秒重发、最多 5 次尝试、重发即作废旧码；验证前不透露邮箱是否已注册。
2. **首次开通**：验证通过后进行简短开通确认，主动同意协议、记录协议版本与同意时间、可填昵称（默认昵称不含邮箱信息）。
3. **会话与退出**：服务端可撤销会话，闲置 7 天 / 最长 30 天；退出当前设备、退出全部设备必须真正撤销凭证。
4. **账户设置**：昵称、已验证邮箱、更换邮箱（原邮箱 + 新邮箱双向验证）、通知偏好（默认不勾选）。
5. **收藏**：以永久档案编号关联、默认私密、重复点击不产生重复记录、已撤下档案"暂不可查看"。
6. **基础权益**：申请数据导出、申请注销，均走人工受理通道并给出回执；"已收到申请"与"已处理完成"严格区分。
7. **权限隔离**：普通用户只能读自己的数据；管理接口与用户接口、凭证、路由前缀完全分开。
8. **安全措施**：HttpOnly/Secure/SameSite Cookie、CSRF 校验、限流（邮箱 + 来源地址 + 全站邮件额度）、恒定时间比较、不写入浏览器长期存储。
9. **最小管理扩展**：在既有本地管理入口增加账号与申请面板（查看账号、暂停/恢复、处理导出与注销申请），保留操作记录。

### 2. 明确不做（留给后续阶段）

- **不做**上传、草稿、只读版本、进度、补充材料、撤回、旧投稿关联、投稿进度邮件通知（阶段三）。
- **不做**线上部署、Caddy 路由、服务器数据目录、正式发布切换（阶段四）。
- **不做**评论、私信、关注、积分、公开个人主页、头像上传、批量导入、AI 识别 —— 总方案第 5 节已排除。
- **不改造**点赞与浏览足迹；**不改动**投稿接收、审核、转草稿、隐私检查、发布流程。
- **不新增**任何 npm 依赖。

### 3. 与阶段一原型的衔接方式

| 阶段一原型 | 阶段二的处理 |
| --- | --- |
| `preview/login/` 的版式、文案与异常状态清单 | 作为 `/login/` 真实页面的设计基准，交互状态可复用，**逻辑全部换成真实接口** |
| `preview/me/favorites/`、`preview/me/settings/` | 作为 `/me/favorites/`、`/me/settings/` 的实现基准 |
| `preview/me/submissions/`、`preview/me/submissions/tg-demo/`、`preview/contribute/` | **保留不动**，阶段三再落地为真实页面 |
| `preview/` 目录本身 | 保留，继续作为版式对照；不进入公开构建 |
| 原型里的"模拟登录""重置演示数据" | 与真实会话互不干扰，两套状态各自独立 |

---

## 三、涉及的具体模块与文件

### 1. 新增文件

| 文件 | 职责 |
| --- | --- |
| `local-admin/accounts.mjs` | 账户业务数据层。SQLite 建表与迁移、账号、会话、验证码、收藏、导出/注销申请、邮件事件、审计与限流。只使用 `node:sqlite` + `node:crypto`。 |
| `local-admin/mail.mjs` | 邮件发送层。零依赖；开发用"本机私密投递"通道，生产用服务商 HTTPS 接口 + `fetch`；未配置时明确报"登录服务不可用"；生产环境拒绝测试通道。 |
| `local-admin/account-server.mjs` | 独立账户服务，默认 `127.0.0.1:4175`。提供 `/api/account/*`（用户）与 `/api/account-admin/*`（仅本机、管理凭证）。 |
| `local-admin/account.env.example` | 账户服务配置模板（不含真实密钥）。 |
| `local-admin/tests/accounts.test.mjs` | 账户模块隔离测试与跨用户越权检查。 |
| `local-admin/public/accounts.html` + `accounts.js` | 管理端最小账号与申请面板。 |
| `site/src/pages/login.astro` | 登录 / 注册合一。 |
| `site/src/pages/me/favorites.astro` | 我的收藏。 |
| `site/src/pages/me/settings.astro` | 账户设置与权益入口。 |
| `site/src/pages/me/submissions.astro` | 我的投稿**占位页**（明确"投稿功能下一阶段开放"，避免导航死链）。 |
| `site/src/pages/records.json.ts` | 公开档案摘要端点，供收藏页展示用（只含已公开档案的公开字段）。 |
| `site/src/scripts/account-client.ts` | 账户页面共享的请求封装（统一带 CSRF 标记、统一错误提示）。 |
| `site/src/scripts/account-login.ts`、`account-favorites.ts`、`account-settings.ts` | 三个页面的交互脚本。 |

### 2. 修改文件

| 文件 | 改动 |
| --- | --- |
| `local-admin/server.mjs` | ① 本地模式把 `/api/account/*` 与 `/api/account-admin/*` 转发到账户服务；② 管理页面放行 `accounts.html`；③ 启动时校验账户数据目录不在公开目录内。 |
| `site/src/layouts/BaseLayout.astro` | 主导航增加"登录 / 我的"入口（由一个极小的内联脚本按登录态切换显示）。 |
| `site/scripts/generate-sitemap.mjs` | 排除 `/login/`、`/me/` 等账户页面，账户页不进站点地图。 |
| `site/scripts/check-public-build.mjs` | 新增账户页面隔离检查：账户页带 `noindex`、不含私密标记、不含管理端标记。 |
| `local-admin/public/index.html` | 侧栏新增「待处理 → 账号与申请」。 |
| `local-admin/README.md`、`docs/local-admin-guide.md` | 登记账户模块的启动方式、数据位置与边界。 |
| `AGENTS.md` | 在"当前阶段限制"记录阶段二已实施范围（不新增授权，只登记状态）。 |
| `docs/development-log.md` | 追加阶段二记录。 |

---

## 四、数据模型

独立 SQLite 文件，本地 `local-admin/accounts/accounts.db`；与档案 `core`、`metadata`、`public_view` 及私密收件区完全分开。

| 表 | 关键字段 | 说明 |
| --- | --- | --- |
| `schema_version` | `version` | 迁移基线，当前为 1 |
| `users` | `id`、`email`（唯一、小写规范化）、`nickname`、`status`（active / suspended / pending_deletion）、`agreement_version`、`agreement_accepted_at`、`notify_progress`（默认 0）、`created_at`、`updated_at`、`last_login_at` | 账号内部编号与投稿 `TG-`、档案 `LJM-` 三类编号彼此独立 |
| `sessions` | `id`、`user_id`、`token_hash`（仅存摘要）、`created_at`、`last_seen_at`、`idle_expires_at`、`absolute_expires_at`、`revoked_at`、`client_hash` | 原始令牌只下发一次，数据库不可还原 |
| `verification_codes` | `id`、`email`、`purpose`（login / email_change_old / email_change_new）、`code_hash`、`salt`、`ticket`、`attempts`、`max_attempts`、`expires_at`、`consumed_at`、`request_ip_hash` | 不存明文验证码 |
| `favorites` | `user_id`、`item_id`、`created_at`，主键 `(user_id, item_id)` | 重复点击不产生重复记录 |
| `requests` | `id`（`REQ-`）、`user_id`、`kind`（export / deletion / unsuspend）、`status`（received / processing / done / rejected）、`receipt_code`、`public_message`、`admin_note`、`created_at`、`updated_at` | "收到申请"与"处理完成"分开；不可逆清理仍需逐次授权 |
| `mail_events` | `to_hash`、`template`、`status`、`provider_id`、`error`、`created_at` | 发信失败可重试，不回退业务结果 |
| `audit_log` | `at`、`actor`、`action`、`target`、`detail` | 覆盖登录、换邮箱、退出全部设备、暂停/恢复、申请处理 |
| `rate_limits` | `bucket`、`window_start`、`count`、`blocked_until` | 邮箱 / 来源地址 / 全站邮件额度共用 |

设计约定：

- 时间统一使用 ISO 字符串，便于直接导出。
- 邮箱、来源地址仅保存不可逆摘要用于限流聚合，不保存明文地址历史。
- 账号数据保留至注销；验证码记录只存必要字段并短期清理；会话到期自动失效。

---

## 五、接口定义

### 1. 用户接口 `/api/account/*`（HTTP 前缀由公开站转发）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/account/config` | 返回通道可用性、协议版本、当前环境；未配置邮件时 `available: false` |
| POST | `/api/account/code` | 请求验证码。验证前不透露邮箱是否已注册；返回重发等待时间 |
| POST | `/api/account/verify` | 校验验证码。返回 `onboarding`（首次开通票据）或 `signed_in`（并下发会话 Cookie） |
| POST | `/api/account/onboarding` | 完成开通：核对协议版本、主动同意、可选昵称；创建账号并下发会话 |
| GET | `/api/account/me` | 当前账号摘要（昵称、邮箱、通知偏好、收藏数量、申请状态） |
| PATCH | `/api/account/profile` | 修改昵称与通知偏好 |
| POST | `/api/account/email/change` | 换邮箱两步：先验证原邮箱，再验证新邮箱；成功后撤销旧会话 |
| POST | `/api/account/logout` | 退出当前设备 |
| POST | `/api/account/logout-all` | 退出全部设备 |
| GET | `/api/account/favorites` | 收藏编号列表 |
| POST | `/api/account/favorites` | 收藏 / 取消收藏（幂等） |
| GET / POST | `/api/account/requests` | 查看 / 提交导出、注销申请 |

### 2. 管理接口 `/api/account-admin/*`（仅 `127.0.0.1`，需管理凭证）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/account-admin/summary` | 账号数、待处理申请、发信失败、私密容量概览 |
| GET | `/api/account-admin/users` | 账号列表（邮箱按管理端需要脱敏展示） |
| POST | `/api/account-admin/users/:id/status` | 暂停 / 恢复账号，必须填写原因并留记录 |
| GET | `/api/account-admin/requests` | 导出与注销申请列表 |
| POST | `/api/account-admin/requests/:id/review` | 更新申请状态与给用户的可见说明，保留内部备注 |

### 3. 安全约定

- 用户写操作：`Origin` 必须为公开站来源，且带 `X-LJM-Account-Request: 1`。
- 管理写操作：`Origin` 必须为管理来源，且带 `X-LJM-Admin-Request: 1`；线上模式额外要求请求来自本机回环地址。
- 会话 Cookie：`HttpOnly`、`SameSite=Lax`、`Path=/`；线上模式追加 `Secure`；不写入任何浏览器长期存储。
- 所有账户响应 `Cache-Control: no-store`，并叠加 `X-Robots-Tag: noindex, nofollow`。
- 普通账号不能通过改参数调用管理接口：两类接口使用不同的鉴权与不同的前缀，且管理接口不接受会话 Cookie 鉴权。
- 账号被暂停后立即停止新登录、上传与编辑；申诉、导出与注销联系途径保留。

---

## 六、与总方案、AGENTS.md 的一致性核对

| 总方案条目 | 本阶段落实方式 |
| --- | --- |
| D 邮箱验证码注册与登录 | 第 9 条安全参数全部实现；不要求手机号、真实姓名、头像、密码 |
| E / F 上传与保存状态 | **本阶段不实现**，属阶段三；占位页明确说明，不做假入口 |
| G 收藏、提醒与账户权益 | 收藏与账户设置、导出申请、注销申请本阶段实现；进度邮件通知留到阶段三 |
| H 站主最小管理功能 | 本阶段只做账号与申请部分，不新建大型后台 |
| I 数据结构与正式入站 | 账号业务数据与档案 `core` / `metadata` / `public_view` 完全分开；三类编号独立 |
| K 安全、容量与运行要求 | 会话、CSRF、限流、文件与目录边界按第 K 节落实 |
| M 阶段二交付 | 只做账户、收藏与基础权益；不进入上传开发与公开上线 |
| L 视觉与交互验收 | 复用既有字体与纸色体系；覆盖加载、空列表、验证码过期、登录过期、权限不足等状态 |

与 AGENTS.md 的关系：数据库与邮件服务两项例外已于 2026-09-27 获用户批准；本阶段**不新增任何依赖**、**不做线上部署**、**不改动档案主库**、**不降低隐私检查**。AGENTS.md 只登记阶段二实施状态，不新增授权。

---

## 七、验收办法（对应总方案 N）

1. 新账号开通、老账号登录、验证码过期与重试、换邮箱、退出全部设备、受限账号行为符合约定。
2. 用户 A 无法通过改编号、改请求参数或复用缓存读取或修改用户 B 的收藏与申请；普通账号不能调用管理接口。
3. 验证码尝试次数、重发间隔、邮箱级与来源地址级限流、全站邮件额度均由服务端生效。
4. 邮件发送失败不丢账号数据、不产生虚假成功；未配置邮件时明确提示服务不可用。
5. 导出与注销申请可追踪，"已收到申请"与"已处理完成"显示不同状态。
6. 账号数据与私密投递内容未进入 `site/dist/`、公开静态目录、站点地图、公共缓存或可公开读取的历史版本。
7. 现有免注册投稿、回执、联系、纠错、搜索、点赞、浏览足迹与管理流程无回归。
8. 账户页面在 1440px、390px、320px 下无横向溢出；键盘可达；错误提示定位到字段。
9. `node --test local-admin/tests/*.test.mjs` 全绿（含既有 57 项），`site/` 内 `npm run build` 通过。

---

## 八、已知限制（本阶段结束时必须如实报告）

- 邮件服务尚未由用户注册配置：本阶段以"本机私密投递通道"完成端到端验证，真实服务商送达测试（重点 QQ、163）在用户配好账号与域名记录后进行。
- 账号数据目录在本地实施；线上服务器目录与 Caddy 路由属阶段四授权范围。
- 数据导出与注销为**人工受理**：系统负责可靠记录申请、给出回执、在管理端可见；实际导出与清理动作由站主按既定规则执行。
- 账户服务与公开接收进程目前共用本机回环地址，线上形态（独立端口 + 反向代理只转发账户前缀）需在阶段四确认。
