# 注册用户与自主投稿：阶段四方案（上线前验收与有限开放）

方案日期：2026-09-28。
对应总方案：`docs/user-accounts-and-submissions-plan.md`（2026-09-26）阶段四。
前置交付：阶段一（原型与技术定案）、阶段二（账户、收藏与基础权益）、阶段三（账户投稿与审核衔接），均已完成并通过本机检查。
**本阶段涉及线上变更，需要站主单独授权。本文件是操作清单，确认后执行。**

---

## 一、目标范围

方案 M 阶段四原文：

> 执行完整回归、正式构建、备份恢复演练，准备可核对的部署与回退清单，确认协议、邮件可达性、容量限制、隐私隔离和应急关闭能力。只有取得对应线上操作授权后才部署和开放；先限制新注册或投稿规模，验证实际运行后再扩大。

---

## 二、服务器现状核对（2026-09-28 远程只读检查）

| 项目 | 实际情况 |
| --- | --- |
| 实例 | `lhins-lhm4aokr`（laojiumopian-hk-test），Ubuntu 24.04，2 核 / 2 GB / 40 GB 系统盘（已用 16 GB，剩 23 GB） |
| 到期时间 | **2026-11-02**（已于 9-25 续费，还剩约 35 天） |
| 公网 IP | 43.132.218.111 |
| Node | **v22.23.3**（支持 `node:sqlite`，无需额外安装） |
| Caddy | v2.11.4 |
| 已在运行的服务 | `caddy`、`laojiumopian-admin`（4174）、`laojiumopian-likes`（4175）、`laojiumopian-submissions`（4176） |
| 应用目录 | `/srv/laojiumopian-admin/app/current` → `app/releases/20260926-174459-github-24e4ee7e92dc` |
| 公开站点 | `/srv/laojiumopian/releases/live`（由 Caddy 提供静态文件） |
| 私密数据 | `/srv/laojiumopian-admin/data/`（含 submissions、archive-data、drafts、history、recycle-bin、inbox 等） |
| 代码更新方式 | GitHub 推送 → 定时任务拉取 → 生成新的 release 目录 → 切换 `app/current` 软链 |

**结论**：账户服务可以完全照现有三个服务的模式接入，不需要新装任何软件。线上端口 4177 空闲，可直接使用。

**顺带发现（不在本次范围，供参考）**：服务器上 `laojiumopian-submissions.service` 的定义与磁盘上的模板不一致（systemd 提示 "changed on disk"），说明本地的加固项（`ReadWritePaths`、`InaccessiblePaths`）尚未在线上生效。本次不动它，避免影响正在运行的投稿接收；建议后续单独确认。

---

## 三、要做的四件事

### 第 1 步：本地准备（不触碰服务器，已完成）

| 产出 | 说明 |
| --- | --- |
| `deployment/laojiumopian-accounts.service` | 账户服务的 systemd 定义：仅本机监听、非 root 运行、只写自己的数据目录与共用收件区、档案数据一律不可见 |
| `deployment/accounts.env.example` | 服务器配置模板：端口 4177、数据目录、正式邮件通道（Resend） |
| `deployment/Caddyfile.accounts.example` | Caddy 路由片段：只放行 `/api/account/*`；管理接口刻意不代理 |
| `deployment/install-account-service.sh` | 可重复执行的安装脚本：建目录、生成配置、装服务、健康检查 |
| `local-admin/accounts.mjs` | 新增只读读取器，供管理端在本机查账号昵称与状态 |
| `local-admin/server.mjs` | 线上模式下用只读连接读取账号信息，不把管理凭证交给公开进程 |
| `deployment/remote-run.mjs` | 通过腾讯云 TAT 远程执行命令的小工具（TAT 要求命令内容 base64 编码） |

### 第 2 步：把新代码发布上线

线上当前运行的是 9 月 26 日的版本，**没有登录入口、用户中心与投稿工作台**。
把本地改动提交并推送到 GitHub，定时部署任务会拉取、跑测试、构建并切换版本。

- 影响：公开网站会增加「登录」入口；新增 `/login/`、`/me/contributions/`、`/me/contribution/`、`/me/favorites/`、`/me/settings/` 六个页面（均禁止搜索引擎收录，且不进入站点地图）。
- 此时账户服务尚未启动，登录页会显示「登录服务暂时不可用」，不会出错。

### 第 3 步：在服务器上启动账户服务

1. 建数据目录 `/srv/laojiumopian-admin/data/accounts`（属主 ljmadmin，权限 0700）
2. 生成 `/etc/laojiumopian-accounts.env`，**由站主填入 Resend 密钥**
3. 安装并启动 `laojiumopian-accounts.service`（监听 127.0.0.1:4177）
4. 修改 Caddyfile：备份 → 加 `/api/account/*` 路由 → `caddy validate` → reload
5. 顺手执行一次 `systemctl daemon-reload`

- 影响：公开站点新增账户接口；不影响现有的网站、点赞、投稿接收、管理端。
- 注意：账户服务与投稿接收服务**共用**同一个私密收件区（账户投稿与免注册投稿写在同一个地方），并发写靠文件锁保证安全，两者缺一不可。

### 第 4 步：验收与有限开放

1. 服务健康检查、接口连通性
2. 用真实邮箱走一遍「获取验证码 → 登录 → 收藏 → 投稿工作台」
3. 用虚构资料走一遍「投稿 → 待补充 → 重提 → 初审 → 转草稿」
4. 检查私密数据未出现在公开目录、站点地图与缓存
5. 备份与恢复演练（账号库 + 私密收件区）
6. 有限开放：先限制新注册与投稿规模，观察实际运行后再放开

---

## 四、回退办法

| 出问题的环节 | 回退动作 | 影响 |
| --- | --- | --- |
| Caddy 配置 | 恢复 `/etc/caddy/Caddyfile.bak.<时间戳>` 并 reload | 账户接口消失，网站与其他接口不受影响 |
| 账户服务 | `systemctl disable --now laojiumopian-accounts` | 登录不可用（会明确提示），其他服务不受影响 |
| 网站新版本 | 切换 `app/current` 与公开站软链回上一个 release | 回到 9-26 版本，登录入口消失 |
| 账户数据 | 从 `/srv/laojiumopian-admin/data/accounts` 与 `backups` 恢复 | 只影响账号业务数据 |

原则：**每一步都先备份、可单独回退，任何一步失败都不影响现在正常运行的网站**。

---

## 五、本次不做

- 不修改档案数据、草稿、历史、回收区与原始主库
- 不改动现有点赞、投稿接收、管理端服务的配置
- 不做数据库迁移（账户库从空开始）
- 不做复杂的容量预警与监控系统（按方案要求保持最小）

---

## 六、需要站主确认的事项

1. **授权提交并推送代码**（会让新网站上线）
2. **授权在服务器上安装并启动账户服务、修改 Caddy 路由**
3. **由站主填入 Resend 密钥**到 `/etc/laojiumopian-accounts.env`（我不接触密钥内容）
