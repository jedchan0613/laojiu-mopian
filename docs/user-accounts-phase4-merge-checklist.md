# 注册模块合并到 main 的操作清单（阶段四准备）

日期：2026-09-29。仅本地整理，未推送、未合并、未改服务器。

## 一、先说结论

技术上合并只要三步（推分支、合 main、等自动部署）。但**现在直接合并会出现"公开网站多了登录入口，点进去却用不了"**，因为服务器上账户服务从来没有部署过——接口、数据目录、邮件密钥、Caddy 路由全部不存在。

建议顺序：**先把服务器端装好，再合并 main**。这样合并的瞬间登录页就是可用的（先只放已有账号登录），不会出现对外可见的坏入口。

## 二、现状核对（2026-09-29 实测）

本地：

- 分支 `feature/registration-preview` 比 `main` 多 7 个提交；其中最近 2 个（收藏按钮修复、过期文案清理）**还没推到远端**，`origin/feature/registration-preview` 落后 2 个。
- `main` 当前提交 `24e4ee7`，与服务器实际版本一致（没有未部署的积压）。
- `site/` 正式构建通过：17 个页面、6 个档案详情，公开回归与字体覆盖检查全过。

服务器（只读检查，未做任何变更）：

| 项目 | 状态 |
| --- | --- |
| 账户服务 systemd 单元 | 不存在（not-found / inactive） |
| `/etc/laojiumopian-accounts.env` | 不存在（密钥在本机 `local-admin/accounts/mail.env`，已验证可用，尚未搬到服务器） |
| 账户数据目录 `/srv/laojiumopian-admin/data/accounts` | 不存在 |
| 4177 端口 | 无服务监听 |
| Caddy 是否代理 `/api/account/` | 没有 |
| 服务器 Node | v22.23.3，`node:sqlite` 可用 ✔ |
| 磁盘 / 内存 | 根分区余 25G；可用内存约 1.4G |

## 三、合并后会发生什么

1. `origin/main` 一出现新提交，服务器自动部署定时器会在 **2 分钟内**拉取、跑测试、构建、切换版本，不需要人工操作。
2. 公开网站立即多出：主导航「登录」入口、`/login/`、`/me/contributions/`、`/me/favorites/`、`/me/settings/`；档案详情页多出「收藏」按钮。
3. 服务器上没有账户接口时：点「登录」会提示接口不可用；收藏按钮自动隐藏（不影响浏览）。也就是"入口在、功能不通"。
4. 不会把部署搞崩：部署脚本对账户服务是"装了才重启"（按 systemd 单元存在与否判断），没装就跳过，公开网站照常发布。风险只是那个点不通的登录入口。

## 四、推荐的执行顺序（分两步）

### 第一步：先装服务器端（需要你单独授权）

1. **邮件密钥已在本机，可直接复用，不用重新申请**：`local-admin/accounts/mail.env`（git 已忽略）里有真实 Resend 密钥，且 2026-09-28 已在本机真实发出一封验证码邮件（状态 sent、有服务商回执）。装服务器时把这份配置写入 `/etc/laojiumopian-accounts.env`，**去掉 `LJM_MAIL_PROXY` 一行**——代理是本机连境外用的，香港服务器直连 Resend 即可。
2. 在服务器执行 `deployment/install-account-service.sh`：建数据目录（仅属主可读）、装并启动 `laojiumopian-accounts.service`（127.0.0.1:4177），自带健康检查。脚本发现环境文件已含正式密钥时会直接装服务，不会覆盖已有配置。
3. 把 `deployment/Caddyfile.accounts.example` 里的 `/api/account/*` 路由并入线上 Caddyfile 并重载，只转发该前缀（管理员接口 `/api/account-admin/*` 保持只允许本机访问）。
4. 环境文件保持 `LJM_ACCOUNT_REGISTRATION_OPEN=false`、`LJM_ACCOUNT_UPLOADS_OPEN=false`：**有限开放**——已有账号可以登录，不接受新注册与上传。
5. 验证：打开 `https://laojiumopian.com/login/`，应显示"已有账号可以登录；新账号开通暂时关闭。"

### 第二步：合并 main

1. 推送本地 2 个提交到 `origin/feature/registration-preview`。
2. 合并到 `main` 并推送（推送走本机代理，须带 HTTP/1.1 设置，否则会长时间挂住）。
3. 等自动部署完成（≤2 分钟），核对三项：`github-deploy/deployed-commit` = 新提交；`/srv/laojiumopian-admin/app/current` 与 `/srv/laojiumopian/releases` 软链指向新版本；管理、点赞、投稿、账户四个服务健康检查通过。
4. 抽查：档案页收藏按钮能否收藏、登录页能否收验证码、我的收藏是否显示、管理面板是否正常。

## 五、合并前建议补做的验收（方案 N 节要求，目前尚未做）

- 用隔离的虚构账号在服务器环境跑一遍：开通 → 登录 → 收藏 → 投稿 → 撤回。
- 邮件可达性确认（真实发一封验证码到你自己的邮箱）。
- 备份与恢复演练：账户数据库 + 私密收件区一起备份，并试一次恢复。
- 应急关闭开关演练：把 `LJM_ACCOUNT_REGISTRATION_OPEN` 改回 `false` 重启服务，确认公开浏览不受影响。
- 隐私抽查：确认 `site/dist`、公开目录、站点地图里没有账号数据或私密来稿。

## 六、回退办法

- 部署失败时脚本会自动回到旧版本并保留管理服务，公开网站保持可用（投稿状态不会错误显示"已公开"）。
- 手工回退：把 `deployed-commit` 写回上一个提交，再用 `ljmadmin` 身份切换 releases 软链后重启服务。**不能用 root 切**，否则下一次自动部署会因权限报 `EPERM`。

## 七、需要你决定的事

1. 邮件密钥已解决（本机现成，搬上服务器即可），剩下的线上操作是否授权：装账户服务、写入服务器环境文件、改 Caddy 路由、合并 main。
2. 是否本次授权"装账户服务 + 改 Caddy + 合并 main"这三件线上操作？
3. 第一步完成后是否先只做有限开放（仅已有账号登录），观察几天再放开注册与上传？
