#!/usr/bin/env bash
set -Eeuo pipefail

[[ "${EUID:-$(id -u)}" -eq 0 ]] || {
	printf '请使用 sudo 运行安装程序。\n' >&2
	exit 1
}

script_directory="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

for required_file in \
	"$script_directory/laojiumopian-github-deploy.sh" \
	"$script_directory/laojiumopian-github-deploy.service" \
	"$script_directory/laojiumopian-github-deploy.timer" \
	"$script_directory/laojiumopian-admin.service"; do
	[[ -f "$required_file" ]] || {
		printf '缺少安装文件：%s\n' "$required_file" >&2
		exit 1
	}
done

id ljmadmin >/dev/null 2>&1 || {
	printf '服务器缺少 ljmadmin 服务账号。\n' >&2
	exit 1
}

install -o root -g root -m 0755 \
	"$script_directory/laojiumopian-github-deploy.sh" \
	/usr/local/sbin/laojiumopian-github-deploy
install -o root -g root -m 0644 \
	"$script_directory/laojiumopian-github-deploy.service" \
	/etc/systemd/system/laojiumopian-github-deploy.service
install -o root -g root -m 0644 \
	"$script_directory/laojiumopian-github-deploy.timer" \
	/etc/systemd/system/laojiumopian-github-deploy.timer
install -o root -g root -m 0644 \
	"$script_directory/laojiumopian-admin.service" \
	/etc/systemd/system/laojiumopian-admin.service

install -d -o ljmadmin -g ljmadmin -m 0700 \
	/srv/laojiumopian-admin/github-deploy
install -d -o ljmadmin -g ljmadmin -m 0750 \
	/srv/laojiumopian-admin/build-work/npm-cache \
	/srv/laojiumopian-admin/build-work/npm-home

systemd-analyze verify \
	/etc/systemd/system/laojiumopian-github-deploy.service \
	/etc/systemd/system/laojiumopian-github-deploy.timer
systemctl daemon-reload

printf 'GitHub 自动发布文件已安装，但定时器尚未启用。\n'
printf '请先手动完成首次发布检查，再启用定时器。\n'
