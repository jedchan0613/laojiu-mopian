#!/usr/bin/env bash
set -Eeuo pipefail

readonly CADDY_FILE='/etc/caddy/Caddyfile'
readonly CACHE_SNIPPET='/etc/caddy/laojiumopian-public-cache.caddy'
readonly APP_CURRENT='/srv/laojiumopian-admin/app/current'
readonly SOURCE_SNIPPET="$APP_CURRENT/deployment/Caddyfile.public-cache.example"
readonly IMPORT_LINE='import /etc/caddy/laojiumopian-public-cache.caddy'
readonly PUBLIC_SITE='https://laojiumopian.com'

log() {
	printf '[public-cache] %s\n' "$*"
}

fail() {
	log "失败：$*"
	exit 1
}

[[ "${EUID:-$(id -u)}" -eq 0 ]] || fail '请使用 sudo 运行此安装程序。'
[[ -f "$CADDY_FILE" ]] || fail "没有找到 Caddy 配置：$CADDY_FILE"
[[ -L "$APP_CURRENT" ]] || fail "当前应用版本不是预期的软链接：$APP_CURRENT"
[[ -f "$SOURCE_SNIPPET" ]] || fail '当前应用版本缺少公开缓存规则，请先等待包含本文件的程序版本部署完成。'

caddy_command="$(command -v caddy || true)"
[[ -n "$caddy_command" ]] || fail '没有找到 Caddy 命令。'

timestamp="$(TZ=Asia/Shanghai date '+%Y%m%d-%H%M%S')"
caddy_backup="${CADDY_FILE}.public-cache-backup-${timestamp}"
snippet_backup=''
cp -a -- "$CADDY_FILE" "$caddy_backup"
if [[ -f "$CACHE_SNIPPET" ]]; then
	snippet_backup="${CACHE_SNIPPET}.backup-${timestamp}"
	cp -a -- "$CACHE_SNIPPET" "$snippet_backup"
fi
log "已备份 Caddy 配置：$caddy_backup"

changed=false
restore_configuration() {
	local status=$?
	trap - EXIT
	if [[ "$status" -ne 0 && "$changed" == true ]]; then
		log '缓存规则没有安装完成，正在恢复原 Caddy 配置。'
		cp -a -- "$caddy_backup" "$CADDY_FILE"
		if [[ -n "$snippet_backup" ]]; then
			cp -a -- "$snippet_backup" "$CACHE_SNIPPET"
		else
			rm -f -- "$CACHE_SNIPPET"
		fi
		"$caddy_command" validate --config "$CADDY_FILE" >/dev/null 2>&1 || true
		systemctl reload caddy >/dev/null 2>&1 || true
	fi
	exit "$status"
}
trap restore_configuration EXIT

install -o root -g root -m 0644 "$SOURCE_SNIPPET" "$CACHE_SNIPPET"
changed=true

if grep -Fq "$IMPORT_LINE" "$CADDY_FILE"; then
	log 'Caddy 已引用公开缓存规则，本次只更新规则内容。'
else
	site_count="$(grep -Ec '^[[:space:]]*laojiumopian\.com[[:space:]]*\{[[:space:]]*$' "$CADDY_FILE" || true)"
	[[ "$site_count" == '1' ]] || fail '没有找到唯一的 laojiumopian.com 站点块，已停止自动修改。'
	next_caddy="${CADDY_FILE}.public-cache-next-$$"
	awk -v import_line="\t$IMPORT_LINE" '
		/^[[:space:]]*laojiumopian\.com[[:space:]]*\{[[:space:]]*$/ && !inserted {
			print
			print import_line
			inserted = 1
			next
		}
		{ print }
		END { if (!inserted) exit 42 }
	' "$CADDY_FILE" > "$next_caddy" || {
		rm -f -- "$next_caddy"
		fail '无法安全写入缓存规则引用。'
	}
	install -o root -g root -m 0644 "$next_caddy" "$CADDY_FILE"
	rm -f -- "$next_caddy"
fi

"$caddy_command" validate --config "$CADDY_FILE"
systemctl reload caddy

home_html="$(curl --fail --silent --show-error --max-time 8 "$PUBLIC_SITE/")"
hashed_path="$(printf '%s' "$home_html" | grep -oE '/_astro/[^" ]+\.(css|js)' | head -n 1 || true)"
responsive_path="$(printf '%s' "$home_html" | grep -oE '/archive-responsive/[^" ]+\.webp' | head -n 1 || true)"
[[ -n "$hashed_path" ]] || fail '正式首页没有找到可核验的版本化静态资源。'
[[ -n "$responsive_path" ]] || fail '正式首页没有找到可核验的响应式图片。'

curl --fail --silent --show-error --head --max-time 8 "$PUBLIC_SITE/" |
	tr -d '\r' | grep -Fiq 'Cache-Control: public, max-age=0, must-revalidate' ||
	fail '首页缓存规则没有生效。'
curl --fail --silent --show-error --head --max-time 8 "$PUBLIC_SITE$hashed_path" |
	tr -d '\r' | grep -Fiq 'Cache-Control: public, max-age=31536000, immutable' ||
	fail '版本化 CSS/JavaScript 缓存规则没有生效。'
curl --fail --silent --show-error --head --max-time 8 "$PUBLIC_SITE$responsive_path" |
	tr -d '\r' | grep -Fiq 'Cache-Control: public, max-age=3600, must-revalidate' ||
	fail '响应式图片缓存规则没有生效。'

trap - EXIT
log '公开缓存规则已安装并通过正式域名检查。'
log 'API、管理页面和私密资料未纳入共享缓存。'
log "原 Caddy 配置备份保留在：$caddy_backup"
