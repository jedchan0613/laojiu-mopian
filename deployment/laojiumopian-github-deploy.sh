#!/usr/bin/env bash
set -Eeuo pipefail

umask 027

readonly ADMIN_USER='ljmadmin'
readonly ADMIN_GROUP='ljmadmin'
readonly PUBLISH_GROUP='ljmpublish'
readonly REPOSITORY_URL='git@github.com:jedchan0613/laojiu-mopian.git'
readonly REPOSITORY_DIR='/srv/laojiumopian-admin/github-source.git'
readonly DEPLOY_DIRECTORY='/srv/laojiumopian-admin/github-deploy'
readonly DEPLOY_KEY="$DEPLOY_DIRECTORY/id_ed25519"
readonly KNOWN_HOSTS="$DEPLOY_DIRECTORY/known_hosts"
readonly DEPLOYED_COMMIT_FILE="$DEPLOY_DIRECTORY/deployed-commit"
readonly APP_ROOT='/srv/laojiumopian-admin/app'
readonly APP_RELEASES="$APP_ROOT/releases"
readonly APP_CURRENT="$APP_ROOT/current"
readonly ADMIN_DATA='/srv/laojiumopian-admin/data'
readonly BUILD_ROOT='/srv/laojiumopian-admin/build-work'
readonly NPM_CACHE="$BUILD_ROOT/npm-cache"
readonly NPM_HOME="$BUILD_ROOT/npm-home"
readonly PUBLIC_RELEASES='/srv/laojiumopian/releases'
readonly PUBLIC_LIVE="$PUBLIC_RELEASES/live"
readonly ENVIRONMENT_FILE='/etc/laojiumopian-admin.env'
readonly ADMIN_SERVICE='laojiumopian-admin.service'
readonly LIKE_SERVICE='laojiumopian-likes.service'
readonly SUBMISSION_SERVICE='laojiumopian-submissions.service'
readonly NODE='/snap/node/current/bin/node'
readonly NPM='/snap/node/current/bin/npm'
readonly RUNUSER='/usr/sbin/runuser'
readonly LOCK_FILE='/run/lock/laojiumopian-github-deploy.lock'

log() {
	printf '[github-deploy] %s\n' "$*"
}

fail() {
	log "失败：$*"
	exit 1
}

require_command() {
	command -v "$1" >/dev/null 2>&1 || fail "服务器缺少必要命令：$1"
}

require_directory() {
	[[ -d "$1" ]] || fail "$2不存在：$1"
}

require_file() {
	[[ -f "$1" ]] || fail "$2不存在：$1"
}

require_symlink() {
	[[ -L "$1" ]] || fail "$2不是软链接：$1"
}

assert_staging_path() {
	[[ -n "${staging_directory:-}" && "$staging_directory" == "$APP_RELEASES"/.github-staging-* ]] ||
		fail '临时应用目录范围异常，已停止清理。'
}

assert_release_path() {
	[[ -n "${release_directory:-}" && "$release_directory" == "$APP_RELEASES"/*-github-* ]] ||
		fail '应用版本目录范围异常，已停止清理。'
}

switch_link() {
	local link_path="$1"
	local target="$2"
	local next_link="${link_path}.github-next-$$"
	ln -s -- "$target" "$next_link"
	if [[ "$link_path" == "$APP_CURRENT" ]]; then
		chown -h "$ADMIN_USER:$ADMIN_GROUP" "$next_link"
	else
		chown -h "$ADMIN_USER:$PUBLISH_GROUP" "$next_link"
	fi
	mv -Tf -- "$next_link" "$link_path"
}

run_as_admin() {
	"$RUNUSER" -u "$ADMIN_USER" -- env HOME="$NPM_HOME" "$@"
}

run_git_as_admin() {
	"$RUNUSER" -u "$ADMIN_USER" -- env \
		HOME="$NPM_HOME" \
		GIT_SSH_COMMAND="ssh -i $DEPLOY_KEY -o IdentitiesOnly=yes -o UserKnownHostsFile=$KNOWN_HOSTS -o StrictHostKeyChecking=yes" \
		"$@"
}

staging_directory=''
release_directory=''
archive_file=''
previous_app_target=''
previous_public_target=''
service_stopped=false
app_switched=false
public_switched=false
like_service_installed=false
submission_service_installed=false

cleanup() {
	local status=$?
	trap - EXIT
	if [[ "$status" -ne 0 ]]; then
		set +e
		log '部署没有完成，开始恢复原版本。'
		if [[ "$public_switched" == true && -n "$previous_public_target" ]]; then
			switch_link "$PUBLIC_LIVE" "$previous_public_target"
		fi
		if [[ "$app_switched" == true && -n "$previous_app_target" ]]; then
			switch_link "$APP_CURRENT" "$previous_app_target"
		fi
		if [[ "$service_stopped" == true || "$app_switched" == true ]]; then
			systemctl restart "$ADMIN_SERVICE"
		fi
		if [[ "$like_service_installed" == true && "$app_switched" == true ]]; then
			systemctl restart "$LIKE_SERVICE"
		fi
		if [[ "$submission_service_installed" == true && "$app_switched" == true ]]; then
			systemctl restart "$SUBMISSION_SERVICE"
		fi
		if [[ -n "$staging_directory" && -e "$staging_directory" ]]; then
			assert_staging_path
			rm -rf -- "$staging_directory"
		fi
		if [[ -n "$archive_file" && -f "$archive_file" && "$archive_file" == "$BUILD_ROOT"/github-source-*.tar ]]; then
			rm -f -- "$archive_file"
		fi
		if [[ -n "$release_directory" && -d "$release_directory" ]]; then
			if [[ "$(readlink -f "$APP_CURRENT" 2>/dev/null)" != "$release_directory" ]]; then
				assert_release_path
				rm -rf -- "$release_directory"
			fi
		fi
		log '原公开网站和原管理服务已保留或恢复。'
	fi
	exit "$status"
}

trap cleanup EXIT

[[ "${EUID:-$(id -u)}" -eq 0 ]] || fail '必须由 root 或 sudo 运行自动部署程序。'
for command_name in git tar flock systemctl curl; do
	require_command "$command_name"
done
require_file "$NODE" 'Node.js'
require_file "$NPM" 'npm'
require_file "$RUNUSER" 'runuser'
require_file "$ENVIRONMENT_FILE" '线上管理配置'
require_file "$DEPLOY_KEY" 'GitHub 只读部署私钥'
require_file "$KNOWN_HOSTS" 'GitHub 主机身份清单'
require_directory "$REPOSITORY_DIR" 'GitHub 裸仓库'
require_directory "$APP_RELEASES" '管理程序版本目录'
require_directory "$ADMIN_DATA" '私有管理数据目录'
require_directory "$BUILD_ROOT" '构建工作目录'
require_directory "$PUBLIC_RELEASES" '公开网站版本目录'
require_symlink "$APP_CURRENT" '当前管理程序版本'
require_symlink "$PUBLIC_LIVE" '当前公开网站版本'

if systemctl cat "$LIKE_SERVICE" >/dev/null 2>&1; then
	like_service_installed=true
fi
if systemctl cat "$SUBMISSION_SERVICE" >/dev/null 2>&1; then
	submission_service_installed=true
fi

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
	log '已有发布任务正在运行，本次检查结束。'
	exit 0
fi

remote_url="$(run_as_admin git --git-dir="$REPOSITORY_DIR" remote get-url origin)"
[[ "$remote_url" == "$REPOSITORY_URL" ]] || fail 'GitHub 裸仓库的来源地址不符合预期。'

log '检查 GitHub main 分支。'
run_git_as_admin git --git-dir="$REPOSITORY_DIR" fetch --quiet --prune origin \
	'+refs/heads/main:refs/remotes/origin/main'
candidate_commit="$(run_as_admin git --git-dir="$REPOSITORY_DIR" rev-parse refs/remotes/origin/main)"
[[ "$candidate_commit" =~ ^[0-9a-f]{40}$ ]] || fail 'GitHub 返回的提交编号无效。'

deployed_commit=''
if [[ -f "$DEPLOYED_COMMIT_FILE" ]]; then
	deployed_commit="$(tr -d '\r\n' < "$DEPLOYED_COMMIT_FILE")"
fi
if [[ "$candidate_commit" == "$deployed_commit" ]]; then
	log "main 没有新版本：${candidate_commit:0:12}"
	exit 0
fi

previous_app_target="$(readlink "$APP_CURRENT")"
previous_public_target="$(readlink "$PUBLIC_LIVE")"
previous_app_directory="$(readlink -f "$APP_CURRENT")"
require_directory "$previous_app_directory" '当前管理程序实际目录'
require_directory "$previous_app_directory/site/public/archive" '当前公开图片源目录'
require_file "$previous_app_directory/site/src/data/archive.ts" '当前网站档案数据源'

timestamp="$(TZ=Asia/Shanghai date '+%Y%m%d-%H%M%S')"
short_commit="${candidate_commit:0:12}"
staging_directory="$APP_RELEASES/.github-staging-$timestamp-$short_commit-$$"
release_directory="$APP_RELEASES/$timestamp-github-$short_commit"
[[ ! -e "$staging_directory" && ! -e "$release_directory" ]] || fail '本次应用版本目录已经存在。'
install -d -o "$ADMIN_USER" -g "$ADMIN_GROUP" -m 0750 "$staging_directory"

archive_file="$BUILD_ROOT/github-source-$short_commit-$$.tar"
run_as_admin git --git-dir="$REPOSITORY_DIR" archive --format=tar --output="$archive_file" \
	"$candidate_commit" -- deployment local-admin site \
	':(exclude)local-admin/drafts/**' \
	':(exclude)local-admin/history/**' \
	':(exclude)local-admin/recycle-bin/**' \
	':(exclude)site/node_modules/**' \
	':(exclude)site/dist/**' \
	':(exclude)site/.astro/**' \
	':(exclude)site/public/archive/**' \
	':(exclude)site/public/archive-responsive/**' \
	':(exclude)site/src/data/archive.ts'
run_as_admin tar -xf "$archive_file" -C "$staging_directory"
rm -f -- "$archive_file"
archive_file=''

for forbidden_path in \
	"$staging_directory/local-admin/drafts" \
	"$staging_directory/local-admin/history" \
	"$staging_directory/local-admin/recycle-bin" \
	"$staging_directory/site/dist" \
	"$staging_directory/site/public/archive-responsive"; do
	[[ ! -e "$forbidden_path" ]] || fail "程序版本混入了运行数据或生成目录：$forbidden_path"
done

require_file "$staging_directory/local-admin/server.mjs" '新版本管理服务'
require_file "$staging_directory/local-admin/submission-server.mjs" '新版本私密投稿与联系接收服务'
require_file "$staging_directory/site/server/likes/server.mjs" '新版本公开点赞服务'
require_file "$staging_directory/site/package-lock.json" '新版本依赖锁定清单'
require_file "$staging_directory/deployment/publish-built-site.mjs" '新版本公开切换程序'

install -d -o "$ADMIN_USER" -g "$ADMIN_GROUP" -m 0750 "$NPM_CACHE" "$NPM_HOME"
log "安装并检查新程序版本：$short_commit"
"$RUNUSER" -u "$ADMIN_USER" -- env \
	HOME="$NPM_HOME" PATH="/snap/node/current/bin:/usr/local/bin:/usr/bin:/bin" \
	NPM_CONFIG_CACHE="$NPM_CACHE" \
	"$NPM" ci --prefix "$staging_directory/site"
run_as_admin "$NODE" --test "$staging_directory"/local-admin/tests/*.test.mjs
run_as_admin "$NODE" --test "$staging_directory"/site/server/likes/tests/*.test.mjs

log '暂停管理服务，接入服务器现有公开资料并执行正式构建。'
systemctl stop "$ADMIN_SERVICE"
service_stopped=true

install -d -o "$ADMIN_USER" -g "$ADMIN_GROUP" -m 0750 "$staging_directory/site/public/archive"
cp -a -- "$previous_app_directory/site/public/archive/." "$staging_directory/site/public/archive/"
chown -R "$ADMIN_USER:$ADMIN_GROUP" "$staging_directory/site/public/archive"
cp -a -- "$previous_app_directory/site/src/data/archive.ts" "$staging_directory/site/src/data/archive.ts"
chown "$ADMIN_USER:$ADMIN_GROUP" "$staging_directory/site/src/data/archive.ts"

set -a
# shellcheck disable=SC1091
source "$ENVIRONMENT_FILE"
set +a
export LJM_PROJECT_ROOT="$staging_directory"
export LJM_SITE_DIR="$staging_directory/site"
export PATH="/snap/node/current/bin:/usr/local/bin:/usr/bin:/bin"
export HOME="$NPM_HOME"
export NPM_CONFIG_CACHE="$NPM_CACHE"

"$RUNUSER" -u "$ADMIN_USER" --preserve-environment -- \
	"$NODE" "$staging_directory/local-admin/server.mjs" --sync-site-data
"$RUNUSER" -u "$ADMIN_USER" --preserve-environment -- \
	"$NPM" run build --prefix "$staging_directory/site"
"$RUNUSER" -u "$ADMIN_USER" --preserve-environment -- \
	"$NODE" "$staging_directory/local-admin/server.mjs" --check-config

mv -- "$staging_directory" "$release_directory"
staging_directory=''
chown -R "$ADMIN_USER:$ADMIN_GROUP" "$release_directory"
switch_link "$APP_CURRENT" "$release_directory"
app_switched=true

systemctl start "$ADMIN_SERVICE"
service_stopped=false
for attempt in {1..20}; do
	if curl --fail --silent --show-error --max-time 2 \
		http://127.0.0.1:4174/healthz >/dev/null; then
		break
	fi
	[[ "$attempt" -lt 20 ]] || fail '新管理服务健康检查没有通过。'
	sleep 1
done

if [[ "$like_service_installed" == true ]]; then
	log '重启公开点赞服务。'
	systemctl restart "$LIKE_SERVICE"
	for attempt in {1..20}; do
		if curl --fail --silent --show-error --max-time 2 \
			http://127.0.0.1:4175/healthz >/dev/null; then
			break
		fi
		[[ "$attempt" -lt 20 ]] || fail '新点赞服务健康检查没有通过。'
		sleep 1
	done
fi

if [[ "$submission_service_installed" == true ]]; then
	log '重启私密投稿与联系接收服务。'
	systemctl restart "$SUBMISSION_SERVICE"
	for attempt in {1..60}; do
		if systemctl is-active --quiet "$SUBMISSION_SERVICE" && \
			curl --fail --silent --max-time 2 \
			http://127.0.0.1:4176/api/submissions/config >/dev/null && \
			curl --fail --silent --max-time 2 \
			http://127.0.0.1:4176/api/contact/config >/dev/null; then
			break
		fi
		[[ "$attempt" -lt 60 ]] || fail '新私密投稿与联系接收服务健康检查没有通过。'
		sleep 1
	done
fi

log '管理服务正常，切换新的公开网站版本。'
run_as_admin "$NODE" "$release_directory/deployment/publish-built-site.mjs" \
	"$release_directory/site/dist" "$PUBLIC_RELEASES" "$PUBLIC_LIVE" "github-${candidate_commit:0:8}"
public_switched=true

printf '%s\n' "$candidate_commit" > "$DEPLOYED_COMMIT_FILE.tmp"
chown root:root "$DEPLOYED_COMMIT_FILE.tmp"
chmod 0640 "$DEPLOYED_COMMIT_FILE.tmp"
mv -f -- "$DEPLOYED_COMMIT_FILE.tmp" "$DEPLOYED_COMMIT_FILE"

log "发布成功：GitHub ${candidate_commit:0:12}"
log "管理程序：$(basename "$release_directory")"
log "公开网站：$(readlink "$PUBLIC_LIVE")"
