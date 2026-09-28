# 注册用户与自主投稿：阶段二报告（账户、收藏与基础权益）

报告日期：2026-09-27。
对应总方案：`docs/user-accounts-and-submissions-plan.md`（2026-09-26）阶段二。
实施设计：`docs/user-accounts-phase2-plan.md`。
前置交付：`docs/user-accounts-phase1-review.md`（阶段一，Trae 完成的隔离原型与技术定案）。
状态：**已实施并通过检查**；未提交、未推送、未部署，未配置真实邮件服务，未接收任何真实用户资料。

---

## 一、本阶段完成内容

方案 M 对阶段二的定义是"实现注册登录、权限隔离、账户设置、收藏、退出和安全措施，并打通人工导出及注销申请"。逐项落地如下：

| 功能点 | 实现情况 |
| --- | --- |
| 邮箱验证码注册与登录 | 6 位验证码、10 分钟有效、一次使用、60 秒重发防抖、最多 5 次尝试、重发即作废旧码；验证前不透露邮箱是否已注册 |
| 首次开通 | 必须主动勾选同意、校验协议版本、记录同意时间；昵称可留空，默认昵称不含邮箱信息 |
| 会话与退出 | 服务端会话表，闲置 7 天、最长 30 天；退出当前设备与退出全部设备都真正撤销凭证 |
| 账户设置 | 昵称、已验证邮箱、更换邮箱（原邮箱与新邮箱双向验证）、通知偏好（默认关闭） |
| 收藏 | 以永久档案编号关联、默认私密、幂等、已有上限；已撤下档案显示"暂不可查看" |
| 基础权益 | 数据导出申请、账号注销申请，均给出回执编号，走人工受理通道 |
| 权限隔离 | 用户接口与管理接口使用不同前缀、不同请求标记、不同来源校验；管理接口不接受会话鉴权 |
| 安全措施 | HttpOnly / SameSite Cookie、CSRF 双重校验、多级限流、恒定时间比较、全部响应 `no-store` |
| 最小管理扩展 | 本地管理入口新增账号与申请面板：账号概览、暂停/恢复、处理申请并保留记录 |

### 怎么打开

1. 双击项目根目录的 `启动档案管理.cmd`，保持黑色窗口开启；
2. 访客侧：`http://127.0.0.1:4173/login/`（登录与开通）、`/me/favorites/`（我的收藏）、`/me/settings/`（账户设置）、`/me/contributions/`（我的投稿占位页）；
3. 站主侧：`http://127.0.0.1:4173/admin/accounts.html`，或管理页左侧「待处理 → 账号与申请」；
4. 本地默认使用本机私密投递通道，验证码会写入 `local-admin/accounts/mail-outbox/`，可直接打开查看，便于自己走完整流程。

---

## 二、与第一阶段成果的衔接

阶段一由 Trae 交付的隔离原型与本阶段的关系是"版式与文案的基准，逻辑全部替换"：

| 阶段一产出的原型 | 阶段二的处理 |
| --- | --- |
| `preview/login/` | 演进为真实 `/login/`，异常状态清单（验证码过期、错误、频繁发送、邮件不可用）逐项落地为真实提示 |
| `preview/me/favorites/`、`preview/me/settings/` | 演进为真实 `/me/favorites/`、`/me/settings/`，连接真实接口 |
| `preview/me/submissions/`、`preview/contribute/` | **原样保留**，阶段三再落地；本阶段只提供 `/me/contributions/` 占位页，明确说明投稿下一阶段开放，不提供假入口 |
| `local-admin/public/preview/` 目录本身 | 保留，继续作为版式对照；仍不进入公开构建 |
| 原型的"模拟登录 / 重置演示数据" | 与真实会话完全独立，互不影响 |

阶段一报告中需要修正的一处事实：报告写"本机 Node 为 v24.14.1"，实测 `node -v` 为 **v22.22.2**。这不影响结论——`node:sqlite` 在该版本下可直接使用（仅打印一次实验性 API 警告），零新增依赖方案成立。

---

## 三、涉及的具体模块与文件

**新增（本地管理程序）**

- `local-admin/accounts.mjs`：账户业务数据层（SQLite + crypto，零依赖）。
- `local-admin/mail.mjs`：邮件发送层（HTTPS 正式通道 / 本机私密投递测试通道 / 未配置三态）。
- `local-admin/account-server.mjs`：独立账户服务，可单进程启动，也可被本机服务挂载。
- `local-admin/account.env.example`：配置模板。
- `local-admin/tests/accounts.test.mjs`：14 项隔离测试。
- `local-admin/public/accounts.html`、`accounts.css`、`accounts.js`：管理端账号与申请面板。

**新增（公开网站）**

- `site/src/pages/login.astro`、`site/src/pages/me/{contributions,favorites,settings}.astro`。
- `site/src/pages/records.json.ts`：公开档案摘要端点，只输出已发布档案的公开字段，供收藏页展示。
- `site/src/components/AccountShell.astro`、`site/src/styles/account.css`。
- `site/src/scripts/account-{client,nav,login,favorites,settings}.ts`。

**修改**

- `local-admin/server.mjs`：账户数据目录校验、本地挂载账户处理器、关闭时释放数据库、启动摘要。
- `site/src/layouts/BaseLayout.astro`：新增可选 `robots` 属性（账户页禁止收录）、主导航登录入口、登录态切换脚本。
- `site/scripts/generate-sitemap.mjs`：排除账户页面。
- `site/scripts/check-public-build.mjs`：新增账户页隔离检查，私密目录清单加入 `accounts`。
- `local-admin/public/index.html`：侧栏新增「待处理 → 账号与申请」。
- `.gitignore`：新增 `local-admin/accounts/`。
- `local-admin/README.md`、`docs/local-admin-guide.md`、`AGENTS.md`、`docs/development-log.md`。

---

## 四、数据模型与接口概要

数据保存在独立的 SQLite 文件（本地 `local-admin/accounts/accounts.db`），表包括：`users`、`sessions`、`verification_codes`、`tickets`、`favorites`、`requests`、`mail_events`、`audit_log`、`rate_limits`、`schema_version`。设计要点：

- 账号内部编号（`usr_…`）、投稿 `TG-` 编号、档案 `LJM-` 编号三类彼此独立；
- 验证码只存 `sha256(salt:code)`，会话令牌只存 `sha256(token)`，邮箱与来源地址只存用于限流聚合的摘要；
- 账号业务数据与档案 `core` / `metadata` / `public_view` 及私密收件区完全分开，账户服务不读写 `archive-data/`、`drafts/`、`history/`、`recycle-bin/`、`site/dist/`。

用户接口（`/api/account/*`）：`config`、`code`、`verify`、`onboarding`、`me`、`profile`、`email/change/{start,verify-old,verify-new,confirm}`、`logout`、`logout-all`、`favorites`（GET/POST）、`requests`（GET/POST）。

管理接口（`/api/account-admin/*`，仅本机）：`summary`、`users`、`users/:id/status`、`requests`、`requests/:id/review`、`audit`。

安全约定：用户写操作要求 `Origin` 为公开站来源且带 `X-LJM-Account-Request: 1`；管理写操作要求 `Origin` 为管理入口且带 `X-LJM-Admin-Request: 1`，且不使用会话 Cookie 鉴权；全部账户响应 `Cache-Control: no-store` 并带 `X-Robots-Tag: noindex, nofollow`。

---

## 五、与总方案、AGENTS.md 的一致性核对

| 方案条目 | 落实方式 |
| --- | --- |
| D 邮箱验证码注册与登录 | 第 4、5、6、7、8、9 条的安全参数全部实现；不要求手机号、真实姓名、头像、密码 |
| E / F 上传与状态 | **本阶段不实现**（属阶段三）；占位页明确说明，不做假入口 |
| G 收藏、提醒与账户权益 | 收藏、账户设置、导出与注销申请已实现；进度邮件通知留到阶段三 |
| H 站主最小管理功能 | 只做账号与申请部分，不新建大型后台 |
| I 数据结构与正式入站 | 账号数据与档案数据完全分开；三类编号独立；未触碰任何档案规范与主库 |
| K 安全、容量与运行 | 会话、CSRF、限流、目录边界按第 K 节落实；不含文件上传相关条目（阶段三） |
| M 阶段二交付 | 未进入上传开发，未公开上线 |
| L 视觉与交互验收 | 复用既有字体与纸色体系，未新增 UI 组件库或字体服务 |

与 AGENTS.md：数据库与邮件服务两项例外已于 2026-09-27 获批准；本阶段未新增任何依赖、未做线上部署、未改动档案主库、未降低隐私检查。AGENTS.md 只登记阶段二实施状态。

---

## 六、验收结果（逐条对应方案 N）

| 验收项 | 结果 |
| --- | --- |
| 1. 新用户开通、老用户登录、验证码过期与重试、换邮箱、退出全部设备、受限账号 | 通过（测试 1、2、3、4、6、9 项覆盖） |
| 2. 用户 A 不能读取或修改用户 B 的收藏与申请；普通账号不能调用管理接口 | 通过（测试 5 项 + 端到端验证：B 看到的收藏与申请均为 0；伪造来源调用管理接口返回 403） |
| 3. 验证码尝试次数、重发间隔、邮箱与来源地址限流、全站邮件额度由服务端生效 | 通过（测试 3、14 项覆盖） |
| 4. 邮件失败不丢数据、不产生虚假成功；未配置时明确提示 | 通过（测试 10、11、12 项） |
| 5. 导出与注销申请可追踪，"已收到"与"已完成"区分 | 通过（测试 8 项：处理前为"处理中"，标记完成才显示"已完成"） |
| 6. 私密数据未进入 `site/dist/`、站点地图、公共缓存 | 通过（公开构建检查含账户页隔离项；模拟正式域名生成的站点地图共 11 个地址，不含 `/login/` 与 `/me/`） |
| 7. 现有投稿、联系、纠错、搜索、点赞、足迹与管理流程无回归 | 通过（既有 57 项测试全绿，公开构建回归检查通过） |
| 8. 账户页面在桌面与手机下无横向溢出、键盘可达 | 样式按 1440 / 390 / 320px 编写（见第七节已知限制） |
| 9. 测试与正式构建通过 | 通过（`node --test` 71 项：70 通过 + 1 项原有跳过 + 0 失败；`npm run build` 生成 16 个页面、6 个档案详情并通过回归检查） |

补充实测（本机真实服务，端口 4188，全部使用 `@example.invalid` 虚构账号）：网站账户页与管理面板返回 200；首次开通完整通过；本人账号可读、收藏写入成功、导出申请回执为 `REQ-…`；未登录读取 401、缺少请求标记 403、伪造来源调用管理接口 403、退出后 401。

---

## 七、已知限制与未做

- **邮件服务尚未由用户注册配置**：本阶段以本机私密投递通道完成端到端验证。真实服务商送达测试（重点 QQ、163）需在用户注册账号、配置密钥与 SPF/DKIM/DMARC 记录后进行。在此之前线上登录会明确显示"服务暂时不可用"。
- **线上部署未做**：账户数据目录、Caddy 路由、独立进程与反向代理只转发 `/api/account/` 前缀的形态，均属阶段四授权范围。
- **数据导出与注销为人工受理**：系统负责可靠记录申请、给出回执、在管理面板可见；实际导出与不可逆清理由站主按已确认规则执行，清理前仍需逐次确认对象、原因与影响。
- **界面核对以静态检查为主**：本阶段未做浏览器自动化的逐像素核对（本机自动化工具此前已确认不稳定）；样式按 1440 / 390 / 320px 编写并复用了站点既有版式，仍建议你在浏览器里实际点一遍登录与设置流程。
- **未做**：草稿、上传、版本、进度、补充材料、旧投稿关联、进度邮件通知（阶段三）；评论、私信、关注、积分、头像上传、批量导入、AI 识别（总方案已排除）。
- 账户页面文案为适配公开构建的字库覆盖检查做了微调（避开本地宋体未覆盖的 8 个字），未修改任何字体资产；如需恢复原措辞，应先扩充字体子集。

---

## 八、进入阶段三所需条件

1. 你实际点一遍登录、收藏、账户设置与撤销申请流程，确认版式与文案；
2. 决定是否现在注册邮件服务账号（阶段三的进度通知会用到；不做也能继续，只是登录需要先配好通道才能在线上使用）；
3. 确认 `/me/contributions/` 的路径命名可以接受（公开构建回归检查禁止 `dist` 出现名为 `submissions` 的目录，因此未使用方案建议的 `/me/submissions/`）；
4. 授权后我再开始阶段三（账户投稿与审核衔接）。
