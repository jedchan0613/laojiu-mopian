# 网站基础优化第二批：第③项缓存规则验收

日期：2026-10-18。状态：**开发与隔离验收完成，未上线。**

用户要求“五点都执行完再上线，现在执行第二批第③点”。本批只完善缓存规则及必要的管理端禁止缓存、安装/核验/回退工具；第4项性能、第5项译文尚未实施，第一批安全补丁也继续保留在本地，未推送部署。

## 1. 已完成的规则

| 内容 | 新规则 |
| --- | --- |
| 六语言公开首页、目录、详情、相册、说明页面 | `public, max-age=0, must-revalidate` |
| 发布图片、响应式图片、records.json、robots、sitemap、图标、二维码 | 同上；替换后不再等待原有一小时/一天缓存到期 |
| 已存在、文件名带构建版本的 /_astro/ JS、CSS、字体 | `public, max-age=31536000, immutable` |
| /_astro/ 内没有版本号的资源 | 每次复用前核验，不长缓存 |
| 六语言登录/用户中心、所有 API、管理页/脚本/图片 | `no-store` |
| 缺页、拒绝、服务器错误及重定向 | `no-store`，不把缺页改成200 |

成功文件响应和304保留文件服务原有ETag/Last-Modified。目录下不存在的哈希文件不会误获一年缓存；私密接口即使上游误设public也会被禁止保存。

规则按“文件存在＋公开路径＋正式域名＋成功状态”匹配，自动覆盖六语言及相册，不再使用原有仅覆盖部分中文页面的枚举。公开站与香港测试域名共用一个Caddy站点块，新规则只匹配正式域名，测试域名保持原样。

管理域名当前经Tunnel直达Node服务，而不是经过公开站Caddy。因此管理服务自行设置no-store，覆盖早期拒绝/重定向；不改变Tunnel、Access认证或接入方式。管理只读JSON的应用内ETag协商继续可用，304同样no-store；不依赖浏览器/共享代理保存私密响应。

## 2. 安装与回退保护

- 沿用既有Node和Caddy，无新依赖、服务、CDN或架构。
- 旧安装程序默认就会改配置且只识别单域名站点头；改为**默认只检查**，必须明确`--apply`才应用。共享站点头、换行、重复执行和既有错误块均有检查；不明确时停止。
- 只给唯一正式站点块及其既有错误链添加import，不重写原有API、认证、root、语言缺页或其他域名设置。
- 与现有程序发布共用互斥锁；先准备/校验候选，再保存原文件与恢复清单，替换后再次校验、平滑重载、执行HTTP核验。检查期间文件被其他操作修改时停止，不覆盖新编辑。
- 校验、重载或HTTP核验失败时恢复原文件，必要时重载旧配置；回退失败明确报错并保留备份位置。原先不存在的规则仅在回退时移除本次新建文件，不处理业务数据。
- 原文件权限和所有者在替换/回退时保持，避免严格umask导致Caddy无法读取；新建缓存规则明确可读，私密备份保持0600/0700。Linux合成测试在umask077下验证此保护。
- 新增正式上线后的只读HTTP核验工具，覆盖六语言、账户页、错误、资源/图片、304、公开API及本机管理匿名拒绝；本轮未对正式站运行“应用”。

相关文件：`deployment/Caddyfile.public-cache.example`、`Caddyfile.error-cache.example`、`public-cache-config.mjs`、`public-cache-install.mjs`、`verify-public-cache.mjs`、`install-public-cache-headers.sh`；管理响应调整在`local-admin/server.mjs`。操作说明见`docs/public-cache-guide.md`。

## 3. 验收结果

| 验收 | 结果 |
| --- | --- |
| Windows全量管理/账号/安全测试 | 279项：277通过、0失败、2跳过；分别为既有软链接测试及本机没有Caddy的原生测试 |
| Linux既有Node22.23.3、Caddy2.11.4全量测试 | 289项全部通过、0跳过/失败，包含原生Caddy测试的10个子项 |
| 点赞测试 | 两端各2项通过 |
| 本机现有正式build命令 | 882页、134件详情通过，首页规则/六语言/公开隔离正常 |
| Linux纯合成资料正式build | 72页、1件详情通过，六语言特殊文字和公开隔离正常 |
| 本机受保护文件SHA256 | 2738份，开始/结束0变化 |

原生Caddy使用临时目录及127.0.0.1动态端口，禁用其管理API、自动HTTPS与配置持久化，不重载系统Caddy。使用合成页面/资源和模拟私密接口，验证：

- 六语言普通页、相册、登录/用户中心和正确语言的404。
- 首次GET、HEAD、ETag/Last-Modified条件请求与304。
- 页面v1→v2后旧条件请求得到新内容；撤下后404且no-store；仅合成样例恢复后正常200，不测试真实档案恢复。
- 同名图片替换立即可核验，撤下后404；哈希JS/CSS/字体一年复用，新版本网址独立，缺失网址不长缓存。
- API成功、POST、401/403/404/500覆盖模拟上游错误的public头；共享香港测试域名未被新规则改写。

安装工具另有10项合成配置测试：默认检查、应用顺序、候选失败、写后校验失败、重载失败、HTTP失败、重复执行、异常结构/跨域import、并发修改、权限保留。管理HTTP测试检查页面/脚本/图片、错误与304均no-store。最初Host拒绝测试发现fetch会重写Host，改用原生HTTP发送真实测试头，未放宽服务端检查。

还只读取得正式Caddy配置，在私密目录生成候选并成功adapt；核对移除新增import后与正式原文逐字一致。两次适配的JSON因Caddy自动隐藏配置文件、合并处理器及生成分组而并非逐字相等，因此**未把JSON结构相等当作语义证明**；证据为原文保留、成功适配及实际隔离HTTP行为。正式配置在该核对前后摘要均为`851af5eae6d4b8bfe137132b243328d967bbd8afd242a3b4324450e4da9f2a6f`，没有应用候选。

## 4. 隔离与证据

- Linux仅使用私密`/srv/laojiumopian-admin/build-work/cache-phase2-20261018-1600/`。代码来自Git基线与本地程序补丁，排除真实档案/图片/账号/译文；复用上一批同一锁文件的已验收依赖，不安装或修改运行中的应用。
- 只读取`/etc/caddy/Caddyfile`，未写`/etc/caddy`、未调用systemctl reload/restart、未改变公开版本或应用链接、DNS、Cloudflare、邮件、注册/上传开关。Caddy及四个业务服务结束检查均active；原生临时Caddy已随测试退出。
- 没有访问外部原始主库、使用旧批次特别授权、操作真实稿件、修改隐私/发布状态，或将本机业务资料覆盖服务器。第一批改动及既有.workbuddy文件保留。
- 本机证据：`outputs/cache-phase2-20261018-windows-tests-final.log`、`windows-build.log`、`windows-likes.log`、`linux-caddy.log`、`linux-full.log`、`linux-final.log`、`shape-final.log`、`before.json`/`after.json`。Linux详细日志位于隔离目录的outputs，保留最初的诊断记录。
- 首次传输补丁摘要：`37ad2142bef91922f5396827148c89b82302ac474001c37467904285db996eb3`。权限保留复核后更新的安装模块及测试文件摘要另见本机`outputs/cache-phase2-20261018-final-files.json`，最终Linux289项已按该版本复验。

## 5. 边界与停止点

正式站当前仍使用原缓存行为；本轮不是“线上已生效”的证明。统一上线后须用真实正式域名再查一次实际响应与可能存在的代理层，不新增或擅自清理CDN缓存，不承诺收回访客已经下载/打开的内容。浏览器旧缓存迁移和实际设备体验保留正式验收，隔离HTTP检查不冒充安卓真机。

本批完成后停止。按用户最新要求，①②安全和③缓存均保留未上线；④性能、⑤外语内容复核等待下一阶段指令，全部完成后再安排统一上线与授权核对。

参考：[Caddy响应头](https://caddyserver.com/docs/caddyfile/directives/header)、[错误链](https://caddyserver.com/docs/caddyfile/directives/handle_errors)、[文件服务](https://caddyserver.com/docs/caddyfile/directives/file_server)、[MDN Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control)。
