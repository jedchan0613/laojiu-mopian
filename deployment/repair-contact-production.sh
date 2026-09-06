#!/usr/bin/env bash
set -Eeuo pipefail

readonly CADDY_FILE='/etc/caddy/Caddyfile'
readonly APP_CURRENT='/srv/laojiumopian-admin/app/current'
readonly SUBMISSION_SERVICE='laojiumopian-submissions.service'
readonly DEPLOY_COMMAND='/usr/local/sbin/laojiumopian-github-deploy'
readonly PUBLIC_CONTACT_URL='https://laojiumopian.com/api/contact/config'

log() {
	printf '[contact-repair] %s\n' "$*"
}

fail() {
	log "失败：$*"
	exit 1
}

[[ "${EUID:-$(id -u)}" -eq 0 ]] || fail '请使用 sudo 运行此修复程序。'
[[ -f "$CADDY_FILE" ]] || fail "没有找到 Caddy 配置：$CADDY_FILE"
[[ -L "$APP_CURRENT" ]] || fail "当前应用版本不是预期的软链接：$APP_CURRENT"
[[ -f "$APP_CURRENT/local-admin/contacts.mjs" ]] || fail '当前应用版本还没有联系接收程序，请先等待 GitHub 自动发布完成。'
[[ -f "$APP_CURRENT/local-admin/submission-server.mjs" ]] || fail '当前应用版本缺少私密接收程序。'
[[ -f "$APP_CURRENT/deployment/laojiumopian-github-deploy.sh" ]] || fail '当前应用版本缺少自动发布程序。'
systemctl cat "$SUBMISSION_SERVICE" >/dev/null 2>&1 || fail '私密投稿接收服务尚未安装。'

caddy_command="$(command -v caddy || true)"
[[ -n "$caddy_command" ]] || fail '没有找到 Caddy 命令。'

timestamp="$(TZ=Asia/Shanghai date '+%Y%m%d-%H%M%S')"
backup_file="${CADDY_FILE}.contact-backup-${timestamp}"
cp -a -- "$CADDY_FILE" "$backup_file"
log "已备份 Caddy 配置：$backup_file"

caddy_changed=false
restore_caddy() {
	local status=$?
	trap - EXIT
	if [[ "$status" -ne 0 && "$caddy_changed" == true ]]; then
		log '修复没有完成，正在恢复原 Caddy 配置。'
		cp -a -- "$backup_file" "$CADDY_FILE"
		"$caddy_command" validate --config "$CADDY_FILE" >/dev/null 2>&1 || true
		systemctl reload caddy >/dev/null 2>&1 || true
	fi
	exit "$status"
}
trap restore_caddy EXIT

if grep -Fq '/api/contact /api/contact/*' "$CADDY_FILE"; then
	log 'Caddy 已包含联系接口转发，不重复修改。'
else
	match_count="$(grep -Fc 'path /api/submissions /api/submissions/*' "$CADDY_FILE" || true)"
	[[ "$match_count" == '1' ]] || fail '没有找到唯一的投稿接口转发规则，已停止自动修改。'
	sed -i 's|path /api/submissions /api/submissions/\*|path /api/submissions /api/submissions/* /api/contact /api/contact/*|' "$CADDY_FILE"
	caddy_changed=true
	grep -Fq '/api/contact /api/contact/*' "$CADDY_FILE" || fail '联系接口转发规则没有正确写入。'
fi

"$caddy_command" validate --config "$CADDY_FILE"

install -o root -g root -m 0755 \
	"$APP_CURRENT/deployment/laojiumopian-github-deploy.sh" \
	"$DEPLOY_COMMAND"

systemctl restart "$SUBMISSION_SERVICE"
for attempt in {1..20}; do
	if curl --fail --silent --show-error --max-time 2 \
		http://127.0.0.1:4176/api/submissions/config >/dev/null && \
		curl --fail --silent --show-error --max-time 2 \
		http://127.0.0.1:4176/api/contact/config >/dev/null; then
		break
	fi
	[[ "$attempt" -lt 20 ]] || fail '私密投稿与联系接收服务没有通过本机检查。'
	sleep 1
done

systemctl reload caddy
for attempt in {1..10}; do
	if curl --fail --silent --show-error --max-time 4 "$PUBLIC_CONTACT_URL" | grep -Fq '"available":true'; then
		break
	fi
	[[ "$attempt" -lt 10 ]] || fail '公开联系接口没有通过检查。'
	sleep 1
done

trap - EXIT
log '修复完成：公开联系接口可用，私密投稿服务保持正常。'
log "原 Caddy 配置备份保留在：$backup_file"
