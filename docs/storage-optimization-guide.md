# 系统盘空间维护

适用服务器：腾讯云轻量实例 `lhins-lhm4aokr`。程序和网站版本是可重建的部署副本；档案数据、历史、待入站图片、账户数据和维护备份不能当缓存删除。

## 已采用的限制

- 管理程序及公开网站分别保留按真实时间排序的最近三个版本，额外保护当前运行版本和刚切换前的版本；保护版本不在最近三个时会多留，不强删。
- 同时识别 `YYYYMMDD-HHmmss-来源` 与 `YYYYMMDDHHmmss-来源`。`empty`、临时目录、异常名称不占版本名额且不自动删除。
- 整理前检查真实目录、当前链接、程序标志文件；夹带业务历史/草稿等私密目录的版本跳过，不进入自动删除。
- GitHub部署在全部测试、构建、健康检查和公开切换成功后才整理旧应用；公开发布成功切换后才整理旧公开构建。清理失败不会回退已经成功的发布。
- 同一提交部署失败后，30分钟再完整尝试一次；新的提交立即检查。每两分钟仍检查GitHub，但不反复安装和测试相同的坏提交。手动紧急重试可由管理员设置 `LJM_DEPLOY_RETRY_NOW=1`，不跳过任何测试。
- 安装和暂停管理服务前先估算峰值空间：当前应用体积＋当前公开构建体积＋1GiB余量。不足时提前停止。
- 导出程序时排除百度同步的`_冲突文件_`副本，仓库仍保留原副本；公开检查拒绝同类输出。字形及私密标记检查逐页扫描，避免全站正文展开为巨量重复字符数组。部署服务禁止生成崩溃core文件。
- 系统持久日志目标上限300MB，单日志文件32MB；老日志会淘汰，排错历史范围会缩短。保留部署失败原因摘要再清理，不关闭日志。

## 手动版本整理

在腾讯云“执行命令”使用SHELL。默认只预演；确认后再在两个命令末尾加 `--apply`。删除不经过回收站。

```bash
set -eu
exec 9>/run/lock/laojiumopian-github-deploy.lock
flock -n 9 || { echo '正在部署，请稍后再试'; exit 1; }
tool=/srv/laojiumopian-admin/app/current/deployment/prune-releases.mjs
/snap/node/current/bin/node "$tool" admin
/snap/node/current/bin/node "$tool" public
```

公开网站日常管理发布与代码部署本身会触发版本整理；手动整理同样需要现有部署锁，避免与部署交叉。

## 维护/测试结束收尾

确定一个隔离作业已完成后，用明确的作业目录名预演；确认后加 `--apply`：

```bash
/snap/node/current/bin/node \
  /srv/laojiumopian-admin/app/current/deployment/cleanup-test-build.mjs \
  作业目录名
```

工具仅接受 `build-work/` 直接子目录，只处理 `app/site/dist`、`app/site/public/archive-responsive`、`app/site/node_modules` 与 `app/site/.astro`。遇到链接、当前网站引用或仍运行的作业进程时跳过或停止。它不删整份作业，不碰 `data/`、`production-before/`、`app/site/public/archive/`、记录与恢复材料。未来测试完成后执行收尾；不能靠目录日期推断备份可删除。

## 本次上线边界

修复图片专用缓存与通用静态规则同时匹配的问题，恢复真实Caddy测试，未删减测试或放宽预期。部署既有压缩脚本后，每次正式构建只压缩 `dist/archive` 内过大的网页发布副本；服务器当前源副本保持原样。压缩效果按本次服务器构建记录核对，不沿用本机旧估算。

同日合并同步修复后的最终缓存选择：发布图片保留`max-age=0, must-revalidate`，撤回尚未正式应用的一小时特例及其排除项，以便每次复用前核验更新/撤下。上述规则重叠排障是历史过程，不表示最终仍启用一小时缓存；其余版本保留、空间和日志治理完整保留。见`docs/sync-recovery-20261021.md`。

安装部署基础设施必须另行实际安装根目录脚本；普通GitHub代码部署不会自动覆盖 `/usr/local/sbin/laojiumopian-github-deploy`。本次安装仅替换这一脚本，不顺带覆盖其他服务定义或正式Caddy配置。系统日志限制使用既有systemd配置，不引入新服务或依赖。
