# GitHub 代码自动发布操作手册

## 方案说明

服务器通过只读部署密钥，每两分钟检查一次 GitHub 仓库 `main` 分支。发现新提交后，自动在独立目录准备新程序，接入服务器现有正式档案数据和公开图片，运行测试与正式构建；全部成功后才切换管理程序和公开网站版本。

该方式只使用服务器向外访问 GitHub，不需要向 GitHub提供服务器登录权限，也不需要开放新的服务器端口。日常操作只有本地提交和推送 GitHub，不再手工打包或上传程序。

## 固定边界

- GitHub `main` 保存程序代码版本。
- `/srv/laojiumopian-admin/data` 继续保存正式 JSON、草稿、待入站图片、历史和回收区。
- 自动部署只从 Git 提交中导出 `deployment`、`local-admin` 和 `site` 程序文件；公开点赞服务代码位于 `site/server/likes/`，其私有密钥和计数数据不在 Git 中。部署不会把管理历史、回收区或构建结果放入新应用版本。
- 新应用会复制服务器当前公开图片，并根据服务器正式 JSON 重新生成网站档案数据。点赞服务完成一次性安装后，后续发布也会运行其自动测试、重启服务并检查本机健康状态。
- 自动部署不会修改、移动或删除项目之外的原始档案主库。

## 版本与失败处理

- 管理程序版本位于 `/srv/laojiumopian-admin/app/releases/`，名称包含 GitHub 提交编号前 12 位。
- 公开网站版本位于 `/srv/laojiumopian/releases/`，名称包含 GitHub 提交编号前 8 位。
- 新版本测试、构建、配置检查或健康检查失败时，不切换公开网站，并恢复原管理程序。
- 旧应用版本和旧公开版本不会自动删除，可以用于人工回退。
- 自动任务使用部署锁；同一时间只能运行一次，避免与另一项代码部署重叠。
- 安装依赖、运行测试、生成响应式图片和正式构建期间，旧管理服务继续在线；这些步骤失败不会造成管理入口中断。
- 只有新版本全部构建通过后，程序才会短暂停止接收新的管理请求并原子切换应用版本；正在进行的保存或发布可以在限定时间内完成。
- 停止旧服务后会再次核对档案数据和公开图片。如果构建期间刚好发生了正式发布，程序会接入最新资料重新构建，避免遗漏新内容。

## 首次启用顺序

1. 在服务器创建专用的 GitHub 只读部署密钥。
2. 在 GitHub 仓库的 Deploy keys 中登记公钥，只授予读取权限。
3. 在服务器核对 GitHub 主机指纹并建立裸仓库。
4. 从裸仓库导出当前 `main` 的安装文件，安装部署脚本与 systemd 定时任务。
5. 手动运行一次自动发布服务，核对管理程序、公开版本和网页。
6. 首次检查通过后，启用每两分钟检查一次的定时器。

## 日常使用

1. 本地完成明确修改。
2. 执行项目测试与正式构建。
3. 创建 Git 提交并推送到 GitHub `main`。
4. 等待约两分钟，服务器自动发现并发布。
5. 打开公开网站和线上管理入口复核；异常时不要重复发布，先查看任务日志。

## 常用只读检查

查看定时器：

```bash
systemctl status laojiumopian-github-deploy.timer --no-pager
```

查看最近一次自动发布结果：

```bash
journalctl -u laojiumopian-github-deploy.service -n 120 --no-pager
```

查看当前版本：

```bash
readlink -f /srv/laojiumopian-admin/app/current
readlink -f /srv/laojiumopian/releases/live
```

如果某个错误提交导致定时任务反复失败，可以先暂停自动检查，避免每两分钟重复尝试：

```bash
sudo systemctl stop laojiumopian-github-deploy.timer
```

这条命令只暂停 GitHub 自动更新，不会停止当前管理服务、公开网站或 Cloudflare Tunnel。问题修复并人工验证一次发布后，再恢复定时器：

```bash
sudo systemctl enable --now laojiumopian-github-deploy.timer
```

## 部署基础设施更新

普通网页或管理程序修改不需要登录服务器。如果以后修改了 `deployment/laojiumopian-github-deploy.sh` 或对应的 systemd 模板，应先人工检查变更，再从服务器 GitHub 裸仓库导出该提交并重新运行安装程序；部署基础设施本身不自动覆盖，避免普通代码提交扩大服务器权限。

当包含新部署脚本的应用版本已经成功切换后，在服务器运行：

```bash
sudo bash /srv/laojiumopian-admin/app/current/deployment/install-github-auto-deploy.sh
sudo systemctl start laojiumopian-github-deploy.service
sudo systemctl enable --now laojiumopian-github-deploy.timer
```

第一条把经过 Git 提交和人工检查的新脚本安装到 systemd 实际使用的位置；第二条立即验证一次；第三条在验证成功后恢复定时检查。
