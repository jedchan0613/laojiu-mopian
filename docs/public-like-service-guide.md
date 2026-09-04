# 公开首页点赞功能维护说明

## 功能范围

- 首页精选档案和“继续浏览其他档案”中的每件档案各有一个点赞按钮。
- 点赞跟随档案永久编号，同一档案换到首页其他位置时仍使用原来的计数。
- 同一访问地址对同一件档案只计一次，不提供取消点赞，避免重复点击造成数字跳动。
- 页面一次读取首页所有点赞数，不会为每张图片分别发起请求，也不会查询或传输图片文件。

## 隐私与限制

- 服务器不保存原始 IP，只保存“服务器独立密钥＋档案编号＋访问地址”生成的不可逆验证摘要。
- 不使用账号或 Cookie，不根据摘要建立访客资料。
- 共享同一公网地址的家庭、单位或校园网络会被视为同一访问地址；动态 IP 变化后可能再次计数。这是无账号方案的客观限制。
- 点赞数据位于 `/srv/laojiumopian-interactions/data/likes.json`，与公开网站和本地原始档案完全分开。
- 点赞服务只监听服务器本机 `127.0.0.1:4175`，不能把该端口直接开放到公网。

## 一次性线上启用

这部分只需在首次上线时完成。应先让现有 GitHub 自动发布把包含 `site/server/likes/` 的版本部署到服务器，再执行以下步骤。

1. 更新服务器已经安装的自动发布脚本，以便后续版本会测试并重启点赞服务：

   ```bash
   sudo bash /srv/laojiumopian-admin/app/current/deployment/install-github-auto-deploy.sh
   ```

2. 创建最小权限服务账号、生成独立随机密钥并启动服务：

   ```bash
   sudo bash /srv/laojiumopian-admin/app/current/deployment/install-public-likes.sh
   ```

   安装程序只在 `/etc/laojiumopian-likes.env` 不存在时生成密钥，不会覆盖已有密钥或点赞数据。

3. 先备份现有 Caddy 配置，再把 `deployment/Caddyfile.likes.example` 中的点赞路由放进 `laojiumopian.com` 站点块，并置于现有公开文件服务之前。保留当前“仅 DNS”部署方式时，`{client_ip}` 才是直接访客地址；如果以后开启上游代理，必须先按可信代理规则重新核对客户端地址来源。

4. 检查并重新载入 Caddy：

   ```bash
   sudo caddy validate --config /etc/caddy/Caddyfile
   sudo systemctl reload caddy
   ```

5. 做只读健康检查和重复点赞验收：

   ```bash
   curl --fail http://127.0.0.1:4175/healthz
   systemctl status laojiumopian-likes.service --no-pager
   ```

   浏览正式首页时，按钮会在计数读取成功后出现；接口未启用或异常时按钮保持隐藏，不会把“暂不可用”暴露给访客。

## 日常维护

- GitHub 自动发布在切换新程序版本后会自动重启点赞服务，并检查 `/healthz`。
- 新版本点赞服务无法启动时，自动发布会回退应用版本，不切换新的公开网站。
- 不要手工编辑 `likes.json`，不要把密钥或点赞文件复制进 Git、`site/public/` 或 `site/dist/`。
- 备份时应一起备份 `/etc/laojiumopian-likes.env` 与 `/srv/laojiumopian-interactions/data/likes.json`，并保持只有服务器管理员和点赞服务账号可以读取。
