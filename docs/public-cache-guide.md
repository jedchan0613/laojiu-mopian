# 公开网站缓存规则

2026-10-18 第二批修订，17:36 已按用户后续“直接部署上线／继续完成”授权应用到正式站。程序版本 `6a7bdca`，服务器及电脑端正式域名 HTTP 核验通过；待审译文未随程序发布。上线结果与备份位置见 `docs/website-foundation-release-20261018.md`。

2026-10-21 修复同步及部署异常：撤回10月20日未上线的一小时图片缓存特例。发布图片继续每次复用前核验，与10月18日已应用的正式策略一致；删除与通用规则重叠的图片配置，不以跳过测试解决部署失败。修复与迁移记录见 `docs/sync-recovery-20261021.md`。

公开静态规则只匹配 `laojiumopian.com`，不会改变共享站点块中的 `hk-test.laojiumopian.com`。管理域名经既有 Tunnel 直达管理服务，由该服务单独返回 `no-store`，不将其改接到 Caddy，也不改变访问保护。

## 缓存范围

- 已存在且名称含构建版本号的 `/_astro/` CSS、JavaScript、字体：`public, max-age=31536000, immutable`。仅成功响应及 304 采用此规则；不存在的哈希网址仍是 404、`no-store`。
- 六语言公开 HTML（含相册）、`records.json`、robots、站点地图、图标与二维码：`public, max-age=0, must-revalidate`。可以保存公开副本，但再次使用前需核对更新；保留 Caddy 原有 ETag/Last-Modified。
- 已发布的档案图片（`/archive/` 下的下载副本与 `/archive-responsive/` 下的响应式缩略图，jpg/jpeg/png/webp）：`public, max-age=0, must-revalidate`，保留ETag/Last-Modified。这些网址不是内容版本网址，图片可能更新或因隐私撤下，因此不增加一小时免核验期；错误地址仍为真实404、`no-store`。重新核验仍不能收回访客已经保存或打开的副本。
- `/_astro/` 中未带内容版本号的资源也使用重新核验，不因为目录名而缓存一年。
- 六语言登录/用户中心、全部 `/api` 和 `/api/*`、管理页/管理脚本/管理图片及错误响应：`no-store`。管理端保留应用内只读 ETag 协商，但响应仍为 `no-store`，不要求浏览器/共享代理持久保存私密内容。
- 错误链单独引入 `Caddyfile.error-cache.example`，保留既有六语言缺页和真实 404/401/403/5xx，不把自定义缺页变成 200。普通响应链也覆盖上游误设的错误缓存及重定向。

“重新核验”不能收回访客已下载或已打开的内容，也不承诺清除配置生效前的所有旧缓存。上线后仍需检查实际经过的代理层；本阶段不新增 CDN、不刷新全站缓存、不清除访客账号或浏览数据。

## 安装方法

后续再次应用仍须取得相应线上操作授权；先将对应程序部署到服务器，再在腾讯云服务器终端执行只检查命令：

```bash
sudo bash /srv/laojiumopian-admin/app/current/deployment/install-public-cache-headers.sh --check
```

不带参数也等同 `--check`：只在私密 build-work 新建候选配置并校验，不改 `/etc/caddy`，不重载服务。程序使用现有 Node/Caddy，未增加依赖。

经批准实际应用时，必须明确执行：

```bash
sudo bash /srv/laojiumopian-admin/app/current/deployment/install-public-cache-headers.sh --apply
```

工具与程序发布共用既有互斥锁。它只为唯一正式站点块和其既有错误块添加 import，不重写认证、API 路由或其他站点；结构不明确、旧 import 放置异常或校验期间配置改变时停止。

应用前保存主配置、既有规则和恢复清单，保留原文件权限/所有者；先校验候选，再替换并复验、平滑重载、核对正式域名及本机管理拒绝响应。候选失败不写正式配置；写入/重载/HTTP核验失败会恢复旧文件，必要时重新加载旧配置。回退失败会明确报告备份位置，不报成功。

备份与日志位于新建的私密 `/srv/laojiumopian-admin/build-work/public-cache-<时间>-<随机编号>/`，不放入公开站点。`rollback-manifest.json` 标明每个目标的旧文件、权限和所有者；原先不存在的规则在回退时只移除本次新建文件。不要手工恢复其他版本的数据目录或覆盖后来的档案/账号修改。

## 验收与待办

本批真实 Caddy 隔离演练覆盖六语言、相册、ETag/Last-Modified、304、HEAD、程序版本变化、图片替换/撤下、404后恢复、私密路径及上游误设缓存。安装流程另有候选失败、写后校验失败、重载失败、HTTP失败和并发修改的合成回退测试，包含严格 umask 下的权限保留。详见 `docs/website-cache-phase2-review-20261018.md`。

本次已实际应用正式配置，服务器与电脑端正式域名检查通过；电脑端覆盖 69 项缓存检查，含六语言、条件请求 304、公开资源、账号/API及错误响应。响应为既有 Caddy，未观察到额外共享缓存层改写；不是对所有访客网络的保证。浏览器预览超时，交互和安卓真机不因 HTTP 检查而视为已验收。

## CDN 说明

本阶段没有改变 DNS/Cloudflare 代理状态、接入新 CDN 或修改可信代理/访客地址转发。将来若调整这些服务，须另行确认并重新核对接口、管理域名、可变图片和撤下内容，不直接套用静态程序的一年缓存。

依据：[Caddy 响应头与延迟设置](https://caddyserver.com/docs/caddyfile/directives/header)、[错误处理链](https://caddyserver.com/docs/caddyfile/directives/handle_errors)、[文件服务](https://caddyserver.com/docs/caddyfile/directives/file_server)、[MDN Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control)。
