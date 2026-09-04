#!/usr/bin/env bash
set -Eeuo pipefail

umask 027

readonly LIKE_USER='ljmlikes'
readonly ADMIN_GROUP='ljmadmin'
readonly APP_CURRENT='/srv/laojiumopian-admin/app/current'
readonly DATA_DIRECTORY='/srv/laojiumopian-interactions/data'
readonly ENVIRONMENT_FILE='/etc/laojiumopian-likes.env'
readonly SERVICE_FILE='/etc/systemd/system/laojiumopian-likes.service'
readonly SOURCE_SERVICE="$APP_CURRENT/deployment/laojiumopian-likes.service"
readonly NODE='/snap/node/current/bin/node'

fail() {
	printf '[likes-install] 失败：%s\n' "$*" >&2
	exit 1
}

[[ "${EUID:-$(id -u)}" -eq 0 ]] || fail '必须由 root 或 sudo 运行。'
[[ -x "$NODE" ]] || fail "Node.js 不存在：$NODE"
[[ -f "$APP_CURRENT/site/server/likes/server.mjs" ]] || fail '当前线上程序还没有公开点赞服务。'
[[ -f "$SOURCE_SERVICE" ]] || fail '当前线上程序缺少点赞服务配置。'
getent group "$ADMIN_GROUP" >/dev/null || fail "管理程序用户组不存在：$ADMIN_GROUP"

if ! id "$LIKE_USER" >/dev/null 2>&1; then
	useradd --system --no-create-home --shell /usr/sbin/nologin "$LIKE_USER"
fi
usermod -a -G "$ADMIN_GROUP" "$LIKE_USER"

install -d -o "$LIKE_USER" -g "$LIKE_USER" -m 0700 "$DATA_DIRECTORY"

if [[ ! -f "$ENVIRONMENT_FILE" ]]; then
	secret="$($NODE -e "process.stdout.write(require('node:crypto').randomBytes(48).toString('hex'))")"
	install -o root -g "$LIKE_USER" -m 0640 /dev/null "$ENVIRONMENT_FILE"
	printf '%s\n' \
		'LJM_LIKE_HOST=127.0.0.1' \
		'LJM_LIKE_PORT=4175' \
		'LJM_PUBLIC_LIVE_DIR=/srv/laojiumopian/releases/live' \
		'LJM_LIKE_DATA_FILE=/srv/laojiumopian-interactions/data/likes.json' \
		'LJM_PUBLIC_ORIGIN=https://laojiumopian.com' \
		"LJM_LIKE_HASH_SECRET=$secret" > "$ENVIRONMENT_FILE"
	unset secret
fi

install -o root -g root -m 0644 "$SOURCE_SERVICE" "$SERVICE_FILE"
systemctl daemon-reload
systemctl enable --now laojiumopian-likes.service

for attempt in {1..20}; do
	if curl --fail --silent --show-error --max-time 2 http://127.0.0.1:4175/healthz >/dev/null; then
		printf '[likes-install] 点赞服务已启动。\n'
		exit 0
	fi
	[[ "$attempt" -lt 20 ]] || fail '点赞服务健康检查没有通过。'
	sleep 1
done
