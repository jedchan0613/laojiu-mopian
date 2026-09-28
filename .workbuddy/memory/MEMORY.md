# 项目长期约定（老旧默片）

## 分支与部署约定（重要，2026-09-28 明确）

- **开发成果只放 `feature/registration-preview` 分支**；`main` 只保留用户已预览确认的版本。
- **只有 `main` 会触发服务器自动部署**（`laojiumopian-github-deploy.timer` 每 2 分钟检查一次 origin/main）。
- **未获用户逐项确认，绝不推送到 main、绝不在服务器上做变更。**"授权开始某阶段"不等于"授权上线"。
- 线上回退办法：`/srv/laojiumopian-admin/app/releases/` 与 `/srv/laojiumopian/releases/` 保留历史版本，`ln -sfn` 切回后重启服务即可；注意**不要动** `github-deploy/deployed-commit`，否则定时任务会重新部署新版。

## 公开构建（site/）的三条硬约束——改公开页面文案前必查

1. **每个 HTML 页面都必须带联系挂件**。`site/scripts/check-public-build.mjs` 会遍历 `dist/**/*.html`，逐页要求 `data-contact-widget`、`data-contact-launcher`、隐私按钮默认选中、且能通过脚本树找到 `/api/contact/config`。**新页面一律用 `BaseLayout`**，否则必然失败。
2. **`dist` 的路径段不能出现** `submissions`、`_contacts`、`drafts`、`history`、`recycle-bin`、`local-admin`、`accounts`。因此"我的投稿"最终用的是 `/me/contributions/` 而不是方案建议的 `/me/submissions/`。
3. **公开页面正文用字必须被本地宋体覆盖**。检查会把所有 HTML（去掉 script/style）里的汉字与 4 个字库文件的 unicode-range 比对，缺任何一个字就直接失败。`scripts/subset-public-fonts.py` 只能从**已有原字库**拆分，不能凭空补字；补新字需要从 Google Fonts 取字形生成补充字库（较重）。**新增公开文案前先对照字库，或改措辞**。已踩过：绑、榜、逛、欢、圾、垃、秒、醒。

## 本机构建与进程坑

- 在 `site/` 跑 `npm run build` **必须前台执行**：Astro 收尾清理 `dist/.prerender`（57 项 > 50）会触发 safe-delete 批量删除确认，后台进程无法弹窗会直接失败。
- 本机 `node -v` 是 **v22.22.2**（系统另装 24.14.1，但 PATH 解析到 22）。`node:sqlite` 可直接用，只打一次实验性警告。
- 本地管理服务默认 `127.0.0.1:4173`（网站 `/`，管理 `/admin/`，账户接口 `/api/account/*`）。

## 账号模块（阶段二、阶段三，2026-09-27 实施）

- 代码：`local-admin/accounts.mjs`（数据层）、`mail.mjs`（邮件层）、`account-server.mjs`（接口，含 `/api/account/submissions/*`）。本地由 `server.mjs` 挂载；线上计划独立进程 + 只转发 `/api/account/` 前缀。
- 数据：`local-admin/accounts/`（SQLite + .ip-salt + mail-outbox），已 gitignore。与档案 JSON、草稿、历史、回收区、私密收件区完全分开。
- 账户投稿**复用同一个私密收件区** `local-admin/submissions/`，只增加 `account_id`、`draft` 状态、`versions` 与 `change_request`；`_account-index.json` 只是索引，状态以各条 `record.json` 为准。
- 管理面板：`/admin/accounts.html`（账号与申请）；投稿审核在 `/admin/submissions.html`（可筛"账号投稿"与"草稿（未提交）"）。
- 邮件三态：`none`（登录明确提示不可用）/ `file`（仅开发，写 mail-outbox）/ `https`（正式）。生产环境拒绝 `file`。
- 测试：`local-admin/tests/accounts.test.mjs`（14 项）、`account-submissions.test.mjs`（9 项）。

## 账户模块的三个安全约定（改这块前必读）

1. **投稿人详情必须剥离内部信息**。管理端的 `detail()` 含 `private_note` 与内部历史条目，直接复用会泄漏给投稿人；账户端一律走 `accountDetail()`。
2. **投稿的发布授权条款版本 ≠ 账号协议版本**。前者是 `submissions.mjs` 的 `consentVersion`（从 `/api/submissions/config` 取），后者是 `agreementVersion`（账号开通用）。两者不可混用，混用会导致"提交被拒"。
3. **不属于当前账号的资源统一返回 404**（不是 403），避免泄漏编号是否存在。

## 阶段划分（总方案）

阶段一（原型与技术定案，Trae 完成）→ 阶段二（账户、收藏、基础权益，已完成）→ 阶段三（账户投稿与审核衔接，已完成）→ 阶段四（上线前验收与有限开放，未开始）。一次只做用户明确指定的阶段。
