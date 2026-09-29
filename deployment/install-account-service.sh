#!/usr/bin/env bash
# 安装并启动账户与账户投稿服务（监听 127.0.0.1:4177）。
# 可重复执行：已存在配置文件时不会覆盖，只更新服务定义并重启。
set -Eeuo pipefail

umask 027

readonly ADMIN_USER='ljmadmin'
readonly APP_CURRENT='/srv/laojiumopian-admin/app/current'
readonly DATA_ROOT='/srv/laojiumopian-admin/data'
readonly ACCOUNT_DATA_DIRECTORY="$DATA_ROOT/accounts"
readonly ENVIRONMENT_FILE='/etc/laojiumopian-accounts.env'
readonly SERVICE_FILE='/etc/systemd/system/laojiumopian-accounts.service'
readonly SOURCE_SERVICE="$APP_CURRENT/deployment/laojiumopian-accounts.service"
readonly NODE='/snap/node/current/bin/node'

fail() {
	printf '[accounts-install] 失败：%s\n' "$*" >&2
	exit 1
}

[[ "${EUID:-$(id -u)}" -eq 0 ]] || fail '必须由 root 或 sudo 运行。'
[[ -x "$NODE" ]] || fail "Node.js 不存在：$NODE"
[[ -f "$APP_CURRENT/local-admin/account-server.mjs" ]] || fail '当前线上程序还没有账户服务代码。'
[[ -f "$SOURCE_SERVICE" ]] || fail '当前线上程序缺少账户服务配置。'
id "$ADMIN_USER" >/dev/null 2>&1 || fail "管理程序用户不存在：$ADMIN_USER"

# 账户数据目录：账号、会话、收藏、申请与邮件事件；权限仅属主可读。
install -d -o "$ADMIN_USER" -g "$ADMIN_USER" -m 0700 "$ACCOUNT_DATA_DIRECTORY"

if [[ ! -f "$ENVIRONMENT_FILE" ]]; then
	install -o root -g root -m 0600 "$APP_CURRENT/deployment/accounts.env.example" "$ENVIRONMENT_FILE"
	printf '[accounts-install] 已生成 %s。\n' "$ENVIRONMENT_FILE"
	printf '[accounts-install] 请填入 Resend 的 API 密钥（LJM_MAIL_API_KEY），然后重新运行本脚本。\n'
	exit 0
fi

grep -q '^LJM_MAIL_API_KEY=re_' "$ENVIRONMENT_FILE" || fail "还没有填入正式的邮件密钥，请编辑 $ENVIRONMENT_FILE"

install -o root -g root -m 0644 "$SOURCE_SERVICE" "$SERVICE_FILE"
systemctl daemon-reload
systemctl enable --now laojiumopian-accounts.service

for attempt in {1..30}; do
	if curl --fail --silent --show-error --max-time 2 http://127.0.0.1:4177/healthz >/dev/null; then
		printf '[accounts-install] 账户服务已启动并通过健康检查。\n'
		exit 0
	fi
	[[ "$attempt" -lt 30 ]] || fail '账户服务健康检查没有通过，请查看 journalctl -u laojiumopian-accounts。'
	sleep 1
done
