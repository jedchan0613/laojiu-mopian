# 项目长期约定（老旧默片）

## 分支与部署约定（重要，2026-09-28 明确）

- **开发成果只放 `feature/registration-preview` 分支**；`main` 只保留用户已预览确认的版本。
- **只有 `main` 会触发服务器自动部署**（`laojiumopian-github-deploy.timer` 每 2 分钟检查一次 origin/main）。
- **未获用户逐项确认，绝不推送到 main、绝不在服务器上做变更。**"授权开始某阶段"不等于"授权上线"。
- 线上回退办法：`/srv/laojiumopian-admin/app/releases/` 与 `/srv/laojiumopian/releases/` 保留历史版本，`ln -sfn` 切回后重启服务即可。
- **两个必须同步收尾的细节（2026-09-28 踩过）**：
  1. `github-deploy/deployed-commit` **必须与线上实际版本一致**，否则定时器会"发现记录与主线不一致"而**每两分钟循环重新部署**（每次都会短暂停管理服务、重启点赞与投稿服务）。
  2. 切换软链**不能用 root**——`/srv/laojiumopian/releases` 目录带粘滞位，自动部署脚本以 `ljmadmin` 身份替换 `live` 时，替换不了 root 属主的链接，会报 `EPERM: operation not permitted, rename .../live` 并恢复旧版。用 root 切过后务必 `chown -h ljmadmin:ljmpublish <链接>`。

## 仓库不承载图片与私密数据（2026-10-12 起，重要）

- **GitHub 仓库 jedchan0613/laojiu-mopian 是 Public**，任何入库内容都按"全网公开"对待。
- **公开图片（site/public/archive、archive-responsive）不进仓库**：部署脚本 git archive 本就排除这两处，线上图片由服务器上一版应用目录继承 + 远程写入维护，仓库从不参与图片分发。新发布图片照样走"本地发布→服务器写入"，不要往仓库提交图片。
- **local-admin 的 history/drafts/recycle-bin/submissions/upload-staging 与 public-assets/inbox 永远不入仓库**（.gitignore 已有）；gitignore 只防新增，历史上的残留要靠 filter-branch 清洗（2026-10-12 已清洗全部历史并强推，见当日日志）。
- 改 git 历史前必做：镜像备份到同步目录之外（如 C:\Users\35171\laojiu-mopian-mirror-backup-*.git）；工作区先干净（别的会话的未提交修改先备份再放回，不替人提交）；reflog expire 会清掉 stash；GitHub 对不可达旧提交有缓存，强推后旧提交直链仍会短暂 200。

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

阶段一（原型与技术定案，Trae 完成）→ 阶段二（账户、收藏、基础权益，已完成）→ 阶段三（账户投稿与审核衔接，已完成）→ 阶段四（上线前验收与有限开放，**2026-09-29 首次部署完成，有限开放中**）。一次只做用户明确指定的阶段。

## 线上账户服务（2026-09-29 上线，改线上前必读）

- main 合并提交 `96eb893`，自动部署成功；`deployed-commit` 与线上版本一致。
- 服务器：`laojiumopian-accounts.service`（127.0.0.1:4177，enabled）；环境文件 `/etc/laojiumopian-accounts.env`（0600 root，含正式 Resend 密钥——从本机 `local-admin/accounts/mail.env` 复制并去掉 `LJM_MAIL_PROXY` 行）。
- Caddy 已代理 `/api/account/*`（仅限 laojiumopian.com，不含 `/api/account-admin/*`）；改前备份在 `/etc/caddy/Caddyfile.bak-20260929`。
- **开放开关**在 `/etc/laojiumopian-accounts.env`：`LJM_ACCOUNT_REGISTRATION_OPEN` 与 `LJM_ACCOUNT_UPLOADS_OPEN` **已于 2026-09-29 14:32 经用户授权改为 true（正式开放）**；改前备份 `laojiumopian-accounts.env.bak-20260929`。关闭应急：两项改回 false + `systemctl restart laojiumopian-accounts`，公开浏览不受影响。后续线上变更仍需用户逐项授权。
- 通知队列：管理进程往 `submissions/.notification-queue/` 写文件，账户服务按用户偏好投递、失败重试；账户服务与投稿服务共用 submissions 数据目录（同 ljmadmin 用户）。
- 阶段四待办：真实邮箱送达确认、备份恢复演练、应急开关演练。
