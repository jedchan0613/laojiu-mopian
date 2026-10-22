#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

mode="${1:---check}"
[[ "$#" -le 1 && ( "$mode" == --check || "$mode" == --apply ) ]] || {
	printf '用法：sudo bash install-github-auto-deploy.sh [--check|--apply]，默认只检查。\n' >&2
	exit 1
}

[[ "${EUID:-$(id -u)}" -eq 0 ]] || {
	printf '请使用 sudo 运行安装程序。\n' >&2
	exit 1
}

script_directory="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

for required_file in \
	"$script_directory/laojiumopian-github-deploy.sh" \
	"$script_directory/deploy-change-plan.mjs" \
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

# 固定工具先安装，再原子替换调用它的脚本；不依赖app/current是否已经切换。
node_command=/snap/node/current/bin/node
[[ -x "$node_command" ]] || { printf '未找到既有Node运行时，不自动安装。\n' >&2; exit 1; }
"$node_command" --check "$script_directory/deploy-change-plan.mjs"
bash -n "$script_directory/laojiumopian-github-deploy.sh"
systemd-analyze verify "$script_directory/laojiumopian-github-deploy.service" "$script_directory/laojiumopian-github-deploy.timer"
if [[ "$mode" == --check ]]; then
	printf '部署脚本、独立判定工具与定时任务检查通过；未改服务器文件或重载服务。\n'
	exit 0
fi

exec 9>/run/lock/laojiumopian-github-deploy.lock
flock -n 9 || { printf '已有发布或配置操作，请稍后重试。\n' >&2; exit 1; }
[[ -d /srv/laojiumopian-admin/build-work ]] || { printf '缺少既有私密构建目录。\n' >&2; exit 1; }
backup_directory="$(mktemp -d /srv/laojiumopian-admin/build-work/deploy-installer-XXXXXXXX)"
sources=(deploy-change-plan.mjs laojiumopian-github-deploy.sh laojiumopian-github-deploy.service laojiumopian-github-deploy.timer laojiumopian-admin.service)
targets=(/usr/local/lib/laojiumopian-github-deploy/deploy-change-plan.mjs /usr/local/sbin/laojiumopian-github-deploy /etc/systemd/system/laojiumopian-github-deploy.service /etc/systemd/system/laojiumopian-github-deploy.timer /etc/systemd/system/laojiumopian-admin.service)
modes=(0644 0755 0644 0644 0644)
for index in "${!targets[@]}"; do
	target="${targets[$index]}"
	[[ ! -L "$target" && ( ! -e "$target" || -f "$target" ) ]] || { printf '安装目标不是普通文件：%s\n' "$target" >&2; exit 1; }
	[[ ! -e "$target.next-$$" && ! -L "$target.next-$$" ]] || exit 1
	if [[ -f "$target" ]]; then
		cp -a -- "$target" "$backup_directory/$index.before"
		printf '%s\t%s\n' "$target" "$index.before" >> "$backup_directory/rollback-manifest.tsv"
	else
		printf '%s\t%s\n' "$target" absent >> "$backup_directory/rollback-manifest.tsv"
	fi
done
replacement_started=false
recover_installation() {
	status=$?
	trap - EXIT
	if [[ "$status" -ne 0 && "$replacement_started" == true ]]; then
		set +e
		recovered=true
		for index in "${!targets[@]}"; do
			target="${targets[$index]}"
			if [[ -f "$backup_directory/$index.before" ]]; then
				cp -a -- "$backup_directory/$index.before" "$target.next-$$" && mv -Tf -- "$target.next-$$" "$target" || recovered=false
			else
				rm -f -- "$target" || recovered=false
			fi
			rm -f -- "$target.next-$$" || recovered=false
		done
		systemctl daemon-reload || recovered=false
		if [[ "$recovered" == true ]]; then printf '安装失败，已恢复原部署程序和任务文件；备份：%s\n' "$backup_directory" >&2
		else printf '安装失败且恢复未完成，请依据备份人工恢复：%s\n' "$backup_directory" >&2; fi
	fi
	exit "$status"
}
trap recover_installation EXIT
install -d -o root -g root -m 0755 /usr/local/lib/laojiumopian-github-deploy
replacement_started=true
for index in "${!targets[@]}"; do
	target="${targets[$index]}"
	install -o root -g root -m "${modes[$index]}" "$script_directory/${sources[$index]}" "$target.next-$$"
	mv -Tf -- "$target.next-$$" "$target"
done

install -d -o ljmadmin -g ljmadmin -m 0700 \
	/srv/laojiumopian-admin/github-deploy
install -d -o ljmadmin -g ljmadmin -m 0750 \
	/srv/laojiumopian-admin/build-work/npm-cache \
	/srv/laojiumopian-admin/build-work/npm-home
install -d -o ljmadmin -g ljmadmin -m 0700 \
	/srv/laojiumopian-admin/data/operations

systemd-analyze verify \
	/etc/systemd/system/laojiumopian-github-deploy.service \
	/etc/systemd/system/laojiumopian-github-deploy.timer
systemctl daemon-reload

printf 'GitHub 自动发布文件已安装，恢复备份：%s\n' "$backup_directory"
printf '本命令未主动启停定时器或业务服务；请再运行一次自动检查核验。\n'
